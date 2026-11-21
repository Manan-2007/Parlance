"""Pretrain the causal encoder on INCLUDE's labelled motion sequences."""
import argparse
import json
import random
import resource
from pathlib import Path
import sys
import time

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.network import IsolatedPretrainingModel
from training.features import FEATURE_VERSION, INCLUDE_ADAPTER_VERSION

CACHE = ROOT / '.research-cache'


def resample(values, positions):
    low = np.floor(positions).astype(int)
    high = np.minimum(low + 1, len(values) - 1)
    mix = (positions - low)[:, None]
    return (values[low] * (1 - mix) + values[high] * mix).astype(np.float32)


class PoseDataset(Dataset):
    def __init__(self, records, labels, augment):
        self.augment = augment
        self.examples = []
        self.targets = []
        for record in records:
            with np.load(CACHE / 'include-features' / f'{record["id"]}.npz') as data:
                if 'sourceAdapter' not in data or str(data['sourceAdapter']) != INCLUDE_ADAPTER_VERSION:
                    raise ValueError('INCLUDE features need regeneration with the corrected coordinate adapter')
                values = data['features']
            if len(values) < 3 or not np.isfinite(values).all() or not values.any():
                continue
            values = resample(values, np.linspace(0, len(values) - 1, min(128, len(values))))
            self.examples.append(values)
            self.targets.append(labels.index(record['label']))

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, index):
        values = self.examples[index]
        positions = np.linspace(0, len(values) - 1, 64)
        if self.augment:
            increments = np.random.uniform(0.6, 1.4, 63)
            positions = np.concatenate(([0], np.cumsum(increments)))
            positions *= (len(values) - 1) / positions[-1]
        frames = resample(values, positions)
        if self.augment:
            # Preserve visibility and absent landmarks when adding coordinate noise.
            points = frames[:, :285].reshape(-1, 95, 3)
            points[:, :, :2] += np.random.normal(0, 0.005, points[:, :, :2].shape).astype(np.float32) * (points[:, :, 2:] > 0)
            for start, offset in ((53, 285), (74, 327)):
                local = frames[:, offset:offset + 42].reshape(-1, 21, 2)
                local += np.random.normal(0, 0.005, local.shape).astype(np.float32) * (points[:, start:start + 21, 2:] > 0)
        return torch.from_numpy(frames), self.targets[index]


def accuracy(model, loader, device):
    model.eval()
    correct = total = 0
    with torch.inference_mode():
        for frames, target in loader:
            predicted = model(frames.to(device)).argmax(dim=-1).cpu()
            correct += int((predicted == target).sum())
            total += len(target)
    return correct / max(total, 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=40)
    parser.add_argument('--evaluate-test', action='store_true')
    args = parser.parse_args()
    random.seed(7)
    np.random.seed(7)
    torch.manual_seed(7)
    torch.set_num_threads(4)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    manifest = json.loads((CACHE / 'include-manifest.json').read_text())
    labels = sorted({record['label'] for record in manifest['records']})
    output = CACHE / 'tcn-pretrain'
    output.mkdir(exist_ok=True)
    if args.evaluate_test:
        checkpoint = torch.load(output / 'best.pt', map_location='cpu', weights_only=True)
        if checkpoint['labels'] != labels or checkpoint['schema'] != FEATURE_VERSION:
            raise ValueError('Pretraining checkpoint labels/schema mismatch')
        test_records = [record for record in manifest['records'] if record['split'] == 'test']
        test = PoseDataset(test_records, labels, False)
        model = IsolatedPretrainingModel(len(labels)).to(device)
        model.load_state_dict(checkpoint['state_dict'])
        started = time.perf_counter()
        value = accuracy(model, DataLoader(test, batch_size=64), device)
        report = {'officialClipTestAccuracy': value, 'evaluatedClips': len(test),
                  'excludedInvalidClips': len(test_records) - len(test),
                  'classes': len(labels), 'selectedEpoch': checkpoint['epoch'],
                  'seconds': time.perf_counter() - started, 'device': str(device),
                  'limitation': 'Official clip split; signer identities are unavailable. This is not live-camera accuracy.'}
        (output / 'test-report.json').write_text(json.dumps(report, indent=2))
        print(json.dumps(report), flush=True)
        return
    train = PoseDataset([record for record in manifest['records'] if record['split'] == 'train'], labels, True)
    valid = PoseDataset([record for record in manifest['records'] if record['split'] == 'validation'], labels, False)
    train_loader = DataLoader(train, batch_size=64, shuffle=True)
    valid_loader = DataLoader(valid, batch_size=64)
    model = IsolatedPretrainingModel(len(labels)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    best = -1
    print(f'TRAINING STARTED device={device} classes={len(labels)} train={len(train)} validation={len(valid)} parameters={sum(parameter.numel() for parameter in model.parameters())}', flush=True)
    for epoch in range(args.epochs):
        started = time.perf_counter()
        model.train()
        losses = []
        for frames, target in train_loader:
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(model(frames.to(device)), target.to(device))
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1)
            optimizer.step()
            losses.append(float(loss.detach().cpu()))
        value = accuracy(model, valid_loader, device)
        scheduler.step()
        progress = {'epoch': epoch + 1, 'epochs': args.epochs, 'loss': float(np.mean(losses)),
                    'validationAccuracy': value, 'seconds': round(time.perf_counter() - started, 1), 'device': str(device),
                    'peakProcessRSSBytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024),
                    'gpuAllocatedBytes': torch.mps.current_allocated_memory() if device.type == 'mps' else 0}
        (output / 'progress.json').write_text(json.dumps(progress, indent=2))
        print(json.dumps(progress), flush=True)
        if value > best:
            best = value
            state = {key: value.detach().cpu() for key, value in model.state_dict().items()}
            torch.save({'state_dict': state, 'labels': labels, 'schema': FEATURE_VERSION,
                        'sourceAdapter': INCLUDE_ADAPTER_VERSION,
                        'validationAccuracy': best, 'epoch': epoch + 1}, output / 'best.pt')
    print(f'PRETRAINING COMPLETE best validation accuracy={best:.4f}', flush=True)


if __name__ == '__main__':
    main()
