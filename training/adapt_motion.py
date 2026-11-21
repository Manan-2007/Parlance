"""Test masked motion adaptation without inventing gloss labels for iSign.

The encoder retains supervised INCLUDE classification while learning to recover
hidden pose coordinates from iSign motion. Recognition quality must be measured
separately; reconstruction error is not sign recognition accuracy.
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
from torch.nn import functional as F
from torch.utils.data import DataLoader, Dataset

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.features import FEATURE_SIZE, FEATURE_VERSION
from training.network import IsolatedPretrainingModel
from training.pretrain import PoseDataset, accuracy, resample
from training.train_continuous import save_json

CACHE = ROOT / '.research-cache'


def mask_coordinates(frames, rng):
    """Hide matching global/local coordinates together, preserving missingness."""
    original = frames.copy()
    corrupted = frames.copy()
    length = len(frames)
    points = original[:, :285].reshape(length, 95, 3)
    visible = points[:, :, 2] > .5
    hidden = rng.random((length, 95)) < .15
    start = int(rng.integers(0, max(1, length - 6)))
    hidden[start:start + 6, 53:] = True
    hidden &= visible
    weights = np.zeros_like(frames)
    corrupted_points = corrupted[:, :285].reshape(length, 95, 3)
    corrupted_points[:, :, :2][hidden] = 0
    weights[:, :285].reshape(length, 95, 3)[:, :, :2] = hidden[:, :, None]
    for hand, offset in ((53, 285), (74, 327)):
        local_mask = hidden[:, hand:hand + 21]
        corrupted[:, offset:offset + 42].reshape(length, 21, 2)[local_mask] = 0
        weights[:, offset:offset + 42] = np.repeat(local_mask, 2, axis=1)
    return corrupted, original, weights


class MotionDataset(Dataset):
    def __init__(self, records, augment):
        self.records = records
        self.augment = augment
        self.rng = np.random.default_rng(31)
        self.examples = []
        for record in records:
            with np.load(CACHE / 'isign-features' / f'{record["uid"]}.npz') as data:
                if str(data['schema']) != FEATURE_VERSION:
                    raise ValueError('Motion feature schema mismatch')
                values, timestamps = data['features'], data['timestampsMs']
            if values.shape[1] != FEATURE_SIZE or not np.isfinite(values).all() or np.any(np.diff(timestamps) <= 0):
                raise ValueError('Invalid motion sequence')
            self.examples.append((values, timestamps))

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, index):
        values, timestamps = self.examples[index]
        rng = self.rng if self.augment else np.random.default_rng(1000 + index)
        duration = min(float(timestamps[-1] - timestamps[0]), 3000)
        room = max(0, float(timestamps[-1] - timestamps[0]) - duration)
        start = float(timestamps[0]) + (rng.uniform(0, room) if self.augment else room / 2)
        positions = np.interp(np.linspace(start, start + duration, 64), timestamps, np.arange(len(values)))
        frames = resample(values, positions)
        return tuple(torch.from_numpy(item) for item in mask_coordinates(frames, rng))


class MotionModel(IsolatedPretrainingModel):
    def __init__(self, classes):
        super().__init__(classes)
        self.reconstruct = nn.Linear(128, FEATURE_SIZE)

    def masked_prediction(self, frames):
        return self.reconstruct(self.encoder(frames))


def masked_loss(prediction, target, weights):
    return (F.smooth_l1_loss(prediction, target, reduction='none') * weights).sum() / weights.sum().clamp_min(1)


def motion_validation(model, loader, device):
    model.eval()
    losses = []
    with torch.inference_mode():
        for corrupted, target, weights in loader:
            loss = masked_loss(model.masked_prediction(corrupted.to(device)), target.to(device), weights.to(device))
            losses.append(float(loss.cpu()))
    return float(np.mean(losses))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=30)
    parser.add_argument('--output', default='tcn-motion')
    args = parser.parse_args()
    random.seed(31)
    np.random.seed(31)
    torch.manual_seed(31)
    torch.set_num_threads(4)
    device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
    output = CACHE / args.output
    output.mkdir(exist_ok=True)
    plan = json.loads((CACHE / 'isign-subset-plan.json').read_text())
    records = [record for record in plan['records'] if (CACHE / 'isign-features' / f'{record["uid"]}.npz').exists()]
    train_records = [record for record in records if record['split'] == 'train']
    valid_records = [record for record in records if record['split'] == 'validation']
    if len(train_records) < 100 or len(valid_records) < 20:
        raise ValueError('Insufficient prepared motion clips')
    train_sources = {r['sourceVideo'] for r in train_records}
    if train_sources & {r['sourceVideo'] for r in valid_records}:
        raise ValueError('Source video overlaps across motion splits')
    save_json(output / 'data-audit.json', {'schema': FEATURE_VERSION, 'publisherRevision': plan['revision'],
              'trainUids': [r['uid'] for r in train_records], 'validationUids': [r['uid'] for r in valid_records],
              'testUsed': False, 'labelUse': 'English captions are not used as gloss labels',
              'splitLimitation': 'Source-video separation does not prove signer independence'})
    train = MotionDataset(train_records, True)
    valid = MotionDataset(valid_records, False)
    motion_loader = DataLoader(train, batch_size=32, shuffle=True)
    valid_loader = DataLoader(valid, batch_size=32)
    include_manifest = json.loads((CACHE / 'include-manifest.json').read_text())
    checkpoint = torch.load(CACHE / 'tcn-pretrain/best.pt', map_location='cpu', weights_only=True)
    labels = checkpoint['labels']
    supervised = PoseDataset([r for r in include_manifest['records'] if r['split'] == 'train'], labels, True)
    supervised_valid = PoseDataset([r for r in include_manifest['records'] if r['split'] == 'validation'], labels, False)
    supervised_loader = DataLoader(supervised, batch_size=64, shuffle=True)
    supervised_valid_loader = DataLoader(supervised_valid, batch_size=64)
    model = MotionModel(len(labels)).to(device)
    incompatible = model.load_state_dict(checkpoint['state_dict'], strict=False)
    if set(incompatible.missing_keys) != {'reconstruct.weight', 'reconstruct.bias'} or incompatible.unexpected_keys:
        raise ValueError('Unexpected pretraining checkpoint structure')
    baseline_accuracy = accuracy(model, supervised_valid_loader, device)
    baseline_motion = motion_validation(model, valid_loader, device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.0003, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=.05)
    best, best_epoch, history = float('inf'), 0, []
    print(json.dumps({'MOTION_TRAINING_STARTED': {'device': str(device), 'motionTrain': len(train),
              'motionValidation': len(valid), 'includeValidationAccuracyBefore': baseline_accuracy,
              'maskedMotionLossBefore': baseline_motion, 'epochs': args.epochs}}), flush=True)
    # Do not retain DataLoader batches in itertools.cycle: rebuild the iterator
    # so augmentations remain fresh and memory stays bounded.
    supervised_iterator = iter(supervised_loader)
    for epoch in range(1, args.epochs + 1):
        started = time.perf_counter()
        model.train()
        training_losses = []
        for corrupted, target, weights in motion_loader:
            try:
                labelled, classes = next(supervised_iterator)
            except StopIteration:
                supervised_iterator = iter(supervised_loader)
                labelled, classes = next(supervised_iterator)
            optimizer.zero_grad(set_to_none=True)
            reconstruction = masked_loss(model.masked_prediction(corrupted.to(device)), target.to(device), weights.to(device))
            classification = criterion(model(labelled.to(device)), classes.to(device))
            loss = classification + .5 * reconstruction
            if not torch.isfinite(loss):
                raise ValueError('Non-finite adaptation loss')
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1)
            optimizer.step()
            training_losses.append(float(loss.detach().cpu()))
        validation_loss = motion_validation(model, valid_loader, device)
        include_accuracy = accuracy(model, supervised_valid_loader, device)
        eligible = include_accuracy >= baseline_accuracy - .03
        if eligible and validation_loss < best:
            best, best_epoch = validation_loss, epoch
            torch.save({'state_dict': {key: value.detach().cpu() for key, value in model.state_dict().items()},
                        'schema': FEATURE_VERSION, 'labels': labels, 'epoch': epoch,
                        'includeValidationAccuracy': include_accuracy, 'maskedMotionValidationLoss': validation_loss}, output / 'best.pt')
        progress = {'epoch': epoch, 'epochs': args.epochs, 'loss': float(np.mean(training_losses)),
                    'maskedMotionValidationLoss': validation_loss, 'includeValidationAccuracy': include_accuracy,
                    'eligible': eligible, 'bestEpoch': best_epoch, 'seconds': round(time.perf_counter() - started, 2),
                    'peakProcessRSSBytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1 if sys.platform == 'darwin' else 1024)}
        history.append(progress)
        save_json(output / 'progress.json', progress)
        print(json.dumps(progress), flush=True)
        scheduler.step()
    save_json(output / 'history.json', history)
    if not best_epoch:
        raise ValueError('Adaptation failed to preserve supervised validation performance')
    print(f'MOTION_ADAPTATION_COMPLETE best_epoch={best_epoch}; recognition must be evaluated separately', flush=True)


if __name__ == '__main__':
    main()
