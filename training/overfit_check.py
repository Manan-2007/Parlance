"""Diagnostic gate: can the CTC pipeline memorize a tiny training-only set?

This intentionally overfits. Its score is never a recognition-quality claim.
"""
import argparse
import json
from pathlib import Path
import random
import sys
import time

import numpy as np
import torch
from torch import nn

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.features import FEATURE_VERSION
from training.network import ContinuousRecognizer
from training.train_continuous import SentenceDataset, collate, evaluate, save_json

CACHE = ROOT / '.research-cache'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--steps', type=int, default=600)
    parser.add_argument('--samples', type=int, default=12)
    args = parser.parse_args()
    torch.manual_seed(41)
    np.random.seed(41)
    random.seed(41)
    torch.set_num_threads(4)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    records = json.loads((CACHE / 'csltr-manifest.json').read_text())['records']
    vocabulary = ['<blank>'] + sorted({word for record in records for word in record['glosses']})
    candidates = [record for record in records if record['split'] == 'train' and record['variant'] == '1']
    random.shuffle(candidates)
    selected = []
    for record in candidates:
        with np.load(CACHE / 'csltr-features' / f'{record["id"]}.npz') as data:
            length = len(data['features'])
        required = len(record['glosses']) + sum(a == b for a, b in zip(record['glosses'], record['glosses'][1:]))
        if max(10, required) <= length <= 80:
            selected.append(record)
        if len(selected) == args.samples:
            break
    if len(selected) != args.samples:
        raise ValueError('Insufficient diagnostic training clips')
    dataset = SentenceDataset(selected, vocabulary)
    batch = collate([dataset[index] for index in range(len(dataset))])
    frames, targets, lengths, target_lengths, _ = batch
    frames = frames.to(device)
    model = ContinuousRecognizer(len(vocabulary)).to(device)
    pretrained = torch.load(CACHE / 'tcn-motion/best.pt', map_location='cpu', weights_only=True)
    if pretrained['schema'] != FEATURE_VERSION:
        raise ValueError('Feature schema mismatch')
    model.encoder.load_state_dict({key.removeprefix('encoder.'): value for key, value in pretrained['state_dict'].items()
                                  if key.startswith('encoder.')})
    optimizer = torch.optim.AdamW(model.parameters(), lr=.001, weight_decay=0)
    criterion = nn.CTCLoss(blank=0, zero_infinity=False)
    started = time.perf_counter()
    history, zero_checks = [], 0
    print(f'DIAGNOSTIC_STARTED device={device} training_samples={len(dataset)}', flush=True)
    for step in range(1, args.steps + 1):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        probabilities = model(frames).log_softmax(-1).transpose(0, 1).cpu()
        loss = criterion(probabilities, targets, lengths, target_lengths)
        if not torch.isfinite(loss):
            raise ValueError('Non-finite diagnostic loss')
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 5)
        optimizer.step()
        if step % 20 == 0:
            metrics, predictions = evaluate(model, dataset, device)
            progress = {'step': step, 'loss': float(loss.detach().cpu()), 'trainingOnly': metrics}
            history.append(progress)
            print(json.dumps(progress), flush=True)
            zero_checks = zero_checks + 1 if metrics['wordErrorRate'] == 0 else 0
            if zero_checks >= 3:
                break
    metrics, predictions = evaluate(model, dataset, device)
    for prediction in predictions:
        for field in ['reference', 'hypothesis']:
            prediction[field] = [vocabulary[token] for token in prediction[field]]
    result = {'passed': metrics['wordErrorRate'] == 0, 'trainingOnly': metrics,
              'seconds': round(time.perf_counter() - started, 2), 'steps': step,
              'records': [{'id': record['id'], 'sentence': record['sentence']} for record in selected],
              'predictions': predictions, 'history': history,
              'limitation': 'Intentional training-set memorization test; not evidence of live recognition accuracy.'}
    save_json(CACHE / 'ctc-overfit-check.json', result)
    print(json.dumps({'DIAGNOSTIC_COMPLETE': {'passed': result['passed'], 'metrics': metrics, 'seconds': result['seconds']}}), flush=True)


if __name__ == '__main__':
    main()
