"""Fine-tune causal TCN with CTC against publisher-provided ISL glosses.

Model selection uses validation only. Test inference is a separate explicit
--evaluate-test command, so intermediate experiments cannot inspect that split.
"""
import argparse
import json
from pathlib import Path
import random
import resource
import sys
import time

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torch.nn.utils.rnn import pad_sequence

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.decoding import collapse_ctc, corpus_metrics
from training.features import FEATURE_SIZE, FEATURE_VERSION
from training.network import ContinuousRecognizer
from training.pretrain import resample

CACHE = ROOT / '.research-cache'


class SentenceDataset(Dataset):
    def __init__(self, records, vocabulary, augment=False, skip_short=False):
        self.records = []
        self.excluded = []
        self.augment = augment
        self.examples = []
        self.targets = []
        for record in records:
            with np.load(CACHE / 'csltr-features' / f'{record["id"]}.npz') as data:
                if str(data['schema']) != FEATURE_VERSION:
                    raise ValueError('Feature schema mismatch')
                frames = data['features'].astype(np.float32)
            if frames.ndim != 2 or frames.shape[1] != FEATURE_SIZE or not np.isfinite(frames).all():
                raise ValueError(f'Invalid features for {record["id"]}')
            targets = [vocabulary.index(word) for word in record['glosses']]
            required = len(targets) + sum(a == b for a, b in zip(targets, targets[1:]))
            if len(frames) < required:
                if skip_short:
                    self.excluded.append({'id': record['id'], 'reason': 'Insufficient source frames for gold CTC alignment',
                                          'frames': len(frames), 'required': required})
                    continue
                raise ValueError(f'Insufficient frames for CTC in {record["id"]}')
            self.records.append(record)
            self.examples.append(frames)
            self.targets.append(torch.tensor(targets, dtype=torch.long))

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, index):
        frames = self.examples[index]
        target = self.targets[index]
        if self.augment:
            length = max(2 * len(target) + 1, round(len(frames) * np.random.uniform(0.7, 1.3)))
            steps = np.random.uniform(0.7, 1.3, length - 1)
            positions = np.concatenate(([0], np.cumsum(steps)))
            positions *= (len(frames) - 1) / positions[-1]
            frames = resample(frames, positions)
            points = frames[:, :285].reshape(-1, 95, 3)
            points[:, :, :2] += (np.random.normal(0, 0.01, points[:, :, :2].shape)
                                  * (points[:, :, 2:] > 0)).astype(np.float32)
        return torch.from_numpy(frames), target, self.records[index]['id']


def collate(examples):
    frames, targets, identifiers = zip(*examples)
    return (pad_sequence(frames, batch_first=True), torch.cat(targets),
            torch.tensor([len(item) for item in frames], dtype=torch.long),
            torch.tensor([len(item) for item in targets], dtype=torch.long), identifiers)


def evaluate(model, dataset, device, time_scale=1.0):
    references, hypotheses, predictions = [], [], []
    model.eval()
    with torch.inference_mode():
        for frames, targets, lengths, target_lengths, identifiers in DataLoader(dataset, batch_size=32, collate_fn=collate):
            if time_scale != 1:
                altered = []
                for frames_one, length, target_length in zip(frames.numpy(), lengths, target_lengths):
                    size = max(2 * int(target_length) + 1, round(int(length) * time_scale))
                    altered.append(torch.from_numpy(resample(frames_one[:length], np.linspace(0, int(length) - 1, size))))
                frames = pad_sequence(altered, batch_first=True)
                lengths = torch.tensor([len(item) for item in altered])
            paths = model(frames.to(device)).argmax(dim=-1).cpu().tolist()
            offset = 0
            for path, length, target_length, identifier in zip(paths, lengths, target_lengths, identifiers):
                reference = targets[offset:offset + target_length].tolist()
                hypothesis = collapse_ctc(path[:length])
                references.append(reference)
                hypotheses.append(hypothesis)
                predictions.append({'id': identifier, 'reference': reference, 'hypothesis': hypothesis})
                offset += target_length
    return corpus_metrics(references, hypotheses), predictions


def save_json(path, value):
    temporary = path.with_suffix('.partial')
    temporary.write_text(json.dumps(value, indent=2))
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=200)
    parser.add_argument('--patience', type=int, default=35)
    parser.add_argument('--output', default='tcn-continuous')
    parser.add_argument('--pretrain', default='tcn-pretrain/best.pt')
    parser.add_argument('--evaluate-test', action='store_true')
    args = parser.parse_args()
    random.seed(17)
    np.random.seed(17)
    torch.manual_seed(17)
    torch.set_num_threads(4)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    manifest = json.loads((CACHE / 'csltr-manifest.json').read_text())
    if manifest['schema'] != FEATURE_VERSION:
        raise ValueError('Manifest schema mismatch')
    records = manifest['records']
    vocabulary = ['<blank>'] + sorted({word for record in records for word in record['glosses']})
    output = CACHE / args.output
    output.mkdir(exist_ok=True)
    model = ContinuousRecognizer(len(vocabulary)).to(device)
    if args.evaluate_test:
        checkpoint = torch.load(output / 'best.pt', map_location='cpu', weights_only=True)
        if checkpoint['vocabulary'] != vocabulary or checkpoint['schema'] != FEATURE_VERSION:
            raise ValueError('Checkpoint vocabulary/schema mismatch')
        model.load_state_dict(checkpoint['state_dict'])
        test = SentenceDataset([record for record in records if record['split'] == 'test'], vocabulary)
        result, predictions = evaluate(model, test, device)
        speeds = {}
        for factor in (0.5, 0.75, 1.5, 2.0):
            speeds[str(factor)] = evaluate(model, test, device, factor)[0]
        for prediction in predictions:
            for field in ('reference', 'hypothesis'):
                prediction[field] = [vocabulary[token] for token in prediction[field]]
        report = {'checkpointEpoch': checkpoint['epoch'], 'test': result,
                  'syntheticTimeResampling': speeds, 'predictions': predictions,
                  'limitations': ['Publisher frame-folder variants are not independently verified signer identities.',
                    'The same sentence inventory occurs across splits.',
                    'Resampled source frames do not establish live camera speed or accuracy.']}
        save_json(output / 'test-report.json', report)
        print(json.dumps({'TEST_COMPLETE': result}), flush=True)
        return
    pretraining = torch.load(CACHE / args.pretrain, map_location='cpu', weights_only=True)
    if pretraining['schema'] != FEATURE_VERSION:
        raise ValueError('Pretraining schema mismatch')
    encoder = {key.removeprefix('encoder.'): value for key, value in pretraining['state_dict'].items() if key.startswith('encoder.')}
    model.encoder.load_state_dict(encoder)
    train = SentenceDataset([record for record in records if record['split'] == 'train'], vocabulary, augment=True, skip_short=True)
    validation = SentenceDataset([record for record in records if record['split'] == 'validation'], vocabulary)
    train_words = {word for record in train.records for word in record['glosses']}
    unseen = sorted(set(vocabulary[1:]) - train_words)
    if unseen:
        raise ValueError(f'Words without training examples: {unseen}')
    loader = DataLoader(train, batch_size=24, shuffle=True, collate_fn=collate)
    optimizer = torch.optim.AdamW([
        {'params': model.encoder.parameters(), 'lr': 0.0005},
        {'params': model.classifier.parameters(), 'lr': 0.001}], weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs)
    # The MPS backend does not implement native CTC. Keep logits in autograd while
    # transferring to the CPU implementation for loss and its backward pass.
    criterion = nn.CTCLoss(blank=0, zero_infinity=False)
    best, best_epoch = float('inf'), 0
    print(json.dumps({'TRAINING_STARTED': {'device': str(device), 'classesIncludingBlank': len(vocabulary),
        'train': len(train), 'validation': len(validation), 'epochsMaximum': args.epochs,
        'excludedTrainingClips': train.excluded}}), flush=True)
    save_json(output / 'data-audit.json', {'train': len(train), 'validation': len(validation),
                                         'excludedTrainingClips': train.excluded,
                                         'pretrainingCheckpoint': args.pretrain})
    history = []
    for epoch in range(1, args.epochs + 1):
        started = time.perf_counter()
        model.train()
        losses = []
        for frames, targets, lengths, target_lengths, _ in loader:
            optimizer.zero_grad(set_to_none=True)
            log_probs = model(frames.to(device)).log_softmax(dim=-1).transpose(0, 1).cpu()
            loss = criterion(log_probs, targets, lengths, target_lengths)
            if not torch.isfinite(loss):
                raise ValueError('Non-finite CTC loss; stopping rather than hiding invalid alignments')
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1)
            optimizer.step()
            losses.append(float(loss.detach()))
        metrics, _ = evaluate(model, validation, device)
        scheduler.step()
        wer = metrics['wordErrorRate']
        if wer < best:
            best, best_epoch = wer, epoch
            state = {key: value.detach().cpu() for key, value in model.state_dict().items()}
            torch.save({'state_dict': state, 'vocabulary': vocabulary, 'schema': FEATURE_VERSION,
                        'epoch': epoch, 'validation': metrics}, output / 'best.pt')
        progress = {'epoch': epoch, 'epochsMaximum': args.epochs, 'loss': float(np.mean(losses)),
                    'validation': metrics, 'bestEpoch': best_epoch,
                    'seconds': round(time.perf_counter() - started, 2),
                    'peakProcessRSSBytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024),
                    'gpuAllocatedBytes': torch.mps.current_allocated_memory() if device.type == 'mps' else 0}
        history.append(progress)
        save_json(output / 'progress.json', progress)
        print(json.dumps(progress), flush=True)
        if epoch - best_epoch >= args.patience:
            break
    save_json(output / 'history.json', history)
    print(f'TRAINING_COMPLETE best_validation_WER={best:.4f} epoch={best_epoch}; test remains unevaluated', flush=True)


if __name__ == '__main__':
    main()
