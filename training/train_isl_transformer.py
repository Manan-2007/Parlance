"""Train, calibrate, evaluate and export the 500-word ISL landmark transformer.

Data: every ISL500 publisher MediaPipe hand track packed by
`prepare_isl500_full.py`, plus Parlance's recorded non-signing controls.

Signer-disjoint split, matching the shipped forest's evaluation so the two can
be compared on the same people:
  test         USER004, USER005, USER014, USER015
  calibration  USER012, USER013   (epoch, temperature, gates, auto-accept)
  train        everyone else
A fixed set of words is never trained on; those clips measure how often an
unknown sign is wrongly accepted.

Commands
  python3 -m training.train_isl_transformer train
  python3 -m training.train_isl_transformer evaluate   # once, after train
  python3 -m training.train_isl_transformer export     # writes backend/models

Live parity: clips are sampled at ~10 Hz (the backend keeps one frame per
90 ms), frames with no tracked hand are dropped (the backend never stores
them), and features come from the same 135-value `frame_features`.
"""
import argparse
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK', '1')
import numpy as np
import torch
from torch import nn

from training.isl_transformer import FRAME_SIZE, NONE_LABEL, SignTransformer, torch_frame_features

DATA = CACHE / 'isl500-full'
INCLUDE = CACHE / 'include-hands'
# Datasets mixed into one model; INCLUDE adds a second, independent signer population.
SOURCES = set(os.environ.get('ISL_SOURCES', 'isl500').split(','))
INCLUDE_FPS = 25
INCLUDE_OVERSAMPLE = 4        # INCLUDE has ~3.5k clips vs ISL500's ~50k
OUT = CACHE / 'isl-transformer' / os.environ.get('ISL_RUN', 'main')   # one folder per experiment
MODELS = ROOT / 'backend' / 'models'
TEST_SIGNERS = {'USER004', 'USER005', 'USER014', 'USER015'}
CALIBRATION_SIGNERS = {'USER012', 'USER013'}
HELD_OUT_WORDS = 25
MAX_T = 48
SOURCE_FPS = 30
STEP = 3                      # 30 fps -> ~10 Hz
WINDOWS_MS = (600, 1000, 1600, 2400, 3800)
PRECISION_TARGET = 0.95
CONTROL_SPLITS = {'train': ['control-ordinary_movement', 'control-rest'],
                  'calibration': ['control-empty_scene'],
                  'test': ['control-typing', 'control-empty-scene-retake']}


def key(label):
    return label.lower().replace('_', '').replace(' ', '')


def device():
    return torch.device('mps' if torch.backends.mps.is_available() else 'cpu')


def protected_words():
    forest = json.loads((MODELS / 'isl-temporal-model.json').read_text())['labels']
    vocab = (ROOT / 'src/translation/islVocabulary.js').read_text()
    block = vocab[vocab.index('SUPPORTED_TOKENS'):]
    block = block[:block.index(']')]
    tokens = re.findall(r"['\"]([A-Z0-9_]+)['\"]", block)
    return {key(x) for x in forest} | {key(x) for x in tokens}


def load_data():
    index = json.loads((DATA / 'index.json').read_text())
    tracks = np.load(DATA / 'tracks.npy', mmap_mode='r')
    records = index['records']
    labels = sorted({r['label'] for r in records})
    protected = protected_words()
    candidates = sorted((w for w in labels if key(w) not in protected),
                        key=lambda w: hashlib.sha1(w.encode()).hexdigest())
    held_out = set(candidates[:HELD_OUT_WORDS])
    known = [w for w in labels if w not in held_out]
    classes = [NONE_LABEL] + known
    lookup = {w: i for i, w in enumerate(classes)}
    for r in records:
        r['split'] = 'test' if r['signer'] in TEST_SIGNERS else 'calibration' if r['signer'] in CALIBRATION_SIGNERS else 'train'
        r['kind'] = 'unknown' if r['label'] in held_out else 'known'
        r['target'] = lookup.get(r['label'], 0)
        r['source'] = 'isl500'
    if 'include' in SOURCES:
        tracks, records, classes = add_include(tracks, records, classes, held_out)
    return tracks, records, classes, sorted(held_out), index


def add_include(tracks, records, classes, held_out):
    """INCLUDE clips under the same labels where the word matches (by gloss key).

    INCLUDE has no signer ids: its official test split stays test, and a fixed
    hash-chosen 25% of its training clips are calibration.
    """
    index = json.loads((INCLUDE / 'index.json').read_text())['records']
    extra = np.load(INCLUDE / 'tracks.npy')
    by_key = {key(w): w for w in classes[1:]} | {key(w): w for w in held_out}
    new = sorted({r['label'].title() for r in index if r['key'] not in by_key})
    classes = classes + new
    by_key |= {key(w): w for w in new}
    lookup = {w: i for i, w in enumerate(classes)}
    base = len(tracks)
    merged = []
    for r in index:
        label = by_key[r['key']]
        split = r['split']
        if split == 'train' and int(hashlib.sha1(r['id'].encode()).hexdigest(), 16) % 4 == 0:
            split = 'calibration'
        merged.append({'label': label, 'signer': 'INCLUDE', 'offset': base + r['offset'], 'length': r['length'],
                       'split': split, 'kind': 'unknown' if label in held_out else 'known',
                       'target': lookup.get(label, 0), 'source': 'include', 'fps': INCLUDE_FPS})
    return np.concatenate((np.asarray(tracks), extra)), records + merged, classes


def load_controls():
    controls = {}
    for split, names in CONTROL_SPLITS.items():
        for name in names:
            with np.load(CACHE / 'isl-native/features' / f'{name}.npz') as data:
                hands, stamps = data['hands'].astype(np.float32), data['timestampsMs'].astype(np.float64)
            keep, last = [], -math.inf
            for i, (frame, stamp) in enumerate(zip(hands, stamps)):
                if frame[126:128].sum() > 0 and stamp - last >= 90:   # backend sampling rule
                    keep.append(i)
                    last = stamp
            controls[name] = {'split': split, 'features': hands[keep], 'timestamps': stamps[keep],
                              'minutes': float((stamps[-1] - stamps[0]) / 60000)}
    return controls


def load_native(classes, split='train'):
    """ISL500 clips re-tracked with Parlance's browser MediaPipe settings (feature level)."""
    manifest = json.loads((CACHE / 'isl-native/full-manifest.json').read_text())
    lookup = {w: i for i, w in enumerate(classes)}
    clips = []
    for r in manifest['records']:
        signer = r['signer'].upper()
        in_split = (signer not in TEST_SIGNERS | CALIBRATION_SIGNERS) if split == 'train' else False
        path = CACHE / 'isl-native/features' / f"{r['id']}.npz"
        if not in_split or r['label'] not in lookup or not path.exists():
            continue
        with np.load(path) as data:
            hands, stamps = data['hands'].astype(np.float32), data['timestampsMs'].astype(np.float64)
        keep, last = [], -math.inf
        for i, (frame, stamp) in enumerate(zip(hands, stamps)):
            if frame[126:128].sum() > 0 and stamp - last >= 90:
                keep.append(i)
                last = stamp
        if len(keep) >= 5:
            clips.append((hands[keep][-MAX_T:], lookup[r['label']]))
    return clips


def native_batch(clips, rng, count):
    feats = np.zeros((count, MAX_T, FRAME_SIZE), np.float32)
    mask = np.zeros((count, MAX_T), np.float32)
    targets = np.zeros(count, np.int64)
    for i in range(count):
        values, target = clips[rng.integers(len(clips))]
        n = len(values)
        start = int(rng.integers(0, max(1, int(n * 0.12)) + 1))
        end = n - int(rng.integers(0, max(1, int(n * 0.12)) + 1))
        window = values[start:max(start + 5, end)].copy()
        window[:, :126] += rng.normal(0, 0.01, size=(len(window), 126)) * (window[:, :126] != 0)
        feats[i, :len(window)], mask[i, :len(window)], targets[i] = window, 1, target
    return torch.from_numpy(feats), torch.from_numpy(mask), torch.from_numpy(targets)


STEP_RANGE = [0.75, 1.35]   # tempo augmentation, multiples of the ~100 ms step
LONG_DROP = [0.0]           # probability of a longer one-hand tracking loss
IDLE_HAND = [0.0]           # probability of adding a resting second hand (and random hand depth scale)


def positions(length, rng=None, fps=SOURCE_FPS):
    """Frame indices into one clip at ~10 Hz; random speed/trim when rng given."""
    base = STEP * fps / SOURCE_FPS
    if rng is None:
        pos = np.arange(0, length, base, dtype=np.float64)
    else:
        start = rng.uniform(0, 0.12) * length
        end = length - 1 - rng.uniform(0, 0.12) * length
        step = base * rng.uniform(*STEP_RANGE)
        pos = np.arange(start, max(start + 1, end), step) + rng.uniform(-0.4, 0.4, size=None)
    if len(pos) < 5:
        pos = np.linspace(0, length - 1, 5)
    if len(pos) > MAX_T:
        pos = np.linspace(pos[0], pos[-1], MAX_T)
    return np.clip(np.round(pos), 0, length - 1).astype(np.int64)


def augment(points, generator):
    """points (B, T, 2, 21, 3) on device; geometric + tracking-gap augmentation."""
    b = points.shape[0]
    dev = points.device
    present = (points != 0).any(-1, keepdim=True)
    rand = lambda *shape: torch.rand(*shape, device=dev, generator=generator)
    mirror = rand(b) < 0.5
    x = torch.where(mirror[:, None, None, None], 1 - points[..., 0], points[..., 0])
    y = points[..., 1]
    z = points[..., 2]
    angle = (rand(b) - 0.5) * math.radians(24)
    scale = 0.85 + rand(b) * 0.3
    stretch = 0.9 + rand(b) * 0.2
    shift = (rand(b, 2) - 0.5) * 0.16
    cx, cy = x - 0.5, y - 0.5
    cos, sin = angle.cos()[:, None, None, None], angle.sin()[:, None, None, None]
    s, st = scale[:, None, None, None], stretch[:, None, None, None]
    nx = (cos * cx - sin * cy) * s * st + 0.5 + shift[:, 0, None, None, None]
    ny = (sin * cx + cos * cy) * s + 0.5 + shift[:, 1, None, None, None]
    nz = z * s * (0.6 + rand(b) * 0.9)[:, None, None, None] if IDLE_HAND[0] > 0 else z * s
    out = torch.stack((nx, ny, nz), -1)
    out = out + torch.randn(out.shape, device=dev, generator=generator) * 0.002
    # brief tracking gaps on one hand
    t = points.shape[1]
    gap = rand(b) < 0.25
    hand = (rand(b) < 0.5).long()
    start = (rand(b) * t).long()
    span = 1 + (rand(b) * 4).long()
    steps = torch.arange(t, device=dev)[None]
    drop = gap[:, None] & (steps >= start[:, None]) & (steps < (start + span)[:, None])
    drop = drop[:, :, None] & (torch.arange(2, device=dev)[None, None] == hand[:, None, None])
    if LONG_DROP[0] > 0:   # browser tracking loses the second hand for longer stretches
        long_gap = rand(b) < LONG_DROP[0]
        long_hand = (rand(b) < 0.5).long()
        long_start = (rand(b) * t).long()
        long_span = 3 + (rand(b) * 10).long()
        long_drop = long_gap[:, None] & (steps >= long_start[:, None]) & (steps < (long_start + long_span)[:, None])
        drop = drop | (long_drop[:, :, None] & (torch.arange(2, device=dev)[None, None] == long_hand[:, None, None]))
    keep = present & ~drop[..., None, None]
    out = torch.where(keep, out, torch.zeros_like(out))
    if IDLE_HAND[0] > 0:
        out = add_idle_hand(out, rand, IDLE_HAND[0])
    return out


def add_idle_hand(points, rand, probability):
    """Put a resting second hand in view for one-handed clips.

    Webcam users (and INCLUDE's signers) keep the other hand visible, low and
    still; ISL500 framing mostly hides it, so a model trained on ISL500 reads
    the idle hand as part of a two-handed sign.
    """
    b, t = points.shape[:2]
    present = (points != 0).any(-1).any(-1)                                # (B, T, 2)
    one_handed = present.any(1).sum(-1) == 1
    pick = one_handed & (rand(b) < probability)
    if not pick.any():
        return points
    signing = present.any(1).float().argmax(-1)                            # slot that has the hand
    idle_slot = 1 - signing
    shape_src = points[torch.arange(b), :, signing]                       # (B, T, 21, 3)
    first = (present[torch.arange(b), :, signing]).float().argmax(1)
    template = shape_src[torch.arange(b), first].clone()                   # (B, 21, 3)
    template = template - template[:, :1]
    template[..., 0] = -template[..., 0]                                   # the other hand is mirrored
    template = template * (0.8 + rand(b) * 0.4)[:, None, None]
    wrist = torch.stack((0.2 + rand(b) * 0.6, 0.78 + rand(b) * 0.2, torch.zeros(b, device=points.device)), -1)
    idle = template + wrist[:, None]
    jitter = (torch.rand(b, t, 1, 3, device=points.device) - 0.5) * 0.01
    idle = idle[:, None] + jitter                                          # (B, T, 21, 3)
    out = points.clone()
    for slot in (0, 1):
        rows = pick & (idle_slot == slot)
        out[rows, :, slot] = idle[rows]
    return out


def compact(features, mask):
    """Drop frames with no tracked hand, like the backend does, keeping order."""
    present = (features[..., 126:128].sum(-1) > 0) & (mask > 0)
    t = features.shape[1]
    order = torch.argsort((~present).float() * t + torch.arange(t, device=features.device)[None].float(), dim=1)
    features = torch.gather(features, 1, order[..., None].expand(-1, -1, FRAME_SIZE))
    mask = torch.gather(present.float(), 1, order)
    # never leave a sample completely empty
    mask[:, 0] = torch.where(mask.sum(1) == 0, torch.ones_like(mask[:, 0]), mask[:, 0])
    return features, mask


class Batcher:
    def __init__(self, tracks, dev):
        self.dev = dev
        self.tracks = torch.from_numpy(np.ascontiguousarray(tracks)).to(dev)   # float16

    def clips(self, records, rng=None, generator=None):
        idx = np.zeros((len(records), MAX_T), np.int64)
        mask = np.zeros((len(records), MAX_T), np.float32)
        for i, r in enumerate(records):
            p = positions(r['length'], rng, r.get('fps', SOURCE_FPS))
            idx[i, :len(p)] = r['offset'] + p
            mask[i, :len(p)] = 1
        idx_t = torch.from_numpy(idx).to(self.dev)
        mask_t = torch.from_numpy(mask).to(self.dev)
        points = self.tracks[idx_t].float() * mask_t[..., None, None, None]
        if generator is not None:
            points = augment(points, generator)
        return compact(torch_frame_features(points), mask_t)


def control_windows(controls, names, rng, count):
    feats = np.zeros((count, MAX_T, FRAME_SIZE), np.float32)
    mask = np.zeros((count, MAX_T), np.float32)
    for i in range(count):
        values = controls[names[rng.integers(len(names))]]['features']
        length = int(rng.integers(5, min(MAX_T, len(values)) + 1))
        start = int(rng.integers(0, len(values) - length + 1))
        window = values[start:start + length].copy()
        window[:, :126] += rng.normal(0, 0.01, size=(length, 126)) * (window[:, :126] != 0)
        feats[i, :length], mask[i, :length] = window, 1
    return torch.from_numpy(feats), torch.from_numpy(mask)


def live_windows(control):
    """Every window the live session would score, queried every 250 ms."""
    values, stamps = control['features'], control['timestamps']
    rows = []
    last = -math.inf
    for end in range(len(values)):
        if stamps[end] - last < 250:
            continue
        last = stamps[end]
        sizes = set()
        for duration in WINDOWS_MS:
            frames = np.flatnonzero((stamps >= stamps[end] - duration) & (np.arange(len(values)) <= end))
            frames = frames[-MAX_T:]
            if len(frames) >= 5 and len(frames) not in sizes:
                sizes.add(len(frames))
                rows.append((end, values[frames]))
    return rows


def logits_for(model, batcher, records, chunk=512):
    model.eval()
    out = []
    with torch.inference_mode():
        for i in range(0, len(records), chunk):
            feats, mask = batcher.clips(records[i:i + chunk])
            out.append(model(feats, mask).float().cpu())
    return torch.cat(out) if out else torch.zeros(0)


def logits_for_windows(model, windows, dev, chunk=512):
    model.eval()
    out = []
    with torch.inference_mode():
        for i in range(0, len(windows), chunk):
            group = windows[i:i + chunk]
            feats = torch.zeros(len(group), MAX_T, FRAME_SIZE)
            mask = torch.zeros(len(group), MAX_T)
            for j, w in enumerate(group):
                feats[j, :len(w)] = torch.from_numpy(w)
                mask[j, :len(w)] = 1
            out.append(model(feats.to(dev), mask.to(dev)).float().cpu())
    return torch.cat(out) if out else torch.zeros(0, 1)


def gate(probs, threshold, margin):
    top = probs.topk(2, dim=1)
    best, second = top.values[:, 0], top.values[:, 1]
    pred = top.indices[:, 0]
    accepted = (pred != 0) & (best >= threshold) & (best - second >= margin)
    return pred, accepted


def gated_metrics(probs, targets, kinds, threshold, margin):
    pred, accepted = gate(probs, threshold, margin)
    known = torch.tensor([k == 'known' for k in kinds])
    correct = accepted & known & (pred == targets)
    n_acc = int(accepted.sum())
    return {'knownClips': int(known.sum()), 'correctAccepted': int(correct.sum()),
            'recall': float(correct.sum() / max(1, known.sum())),
            'accepted': n_acc, 'precision': float(correct.sum() / n_acc) if n_acc else None,
            'unknownClips': int((~known).sum()), 'unknownRejected': int((~accepted & ~known).sum())}


def fit_temperature(logits, targets):
    log_t = torch.zeros(1, requires_grad=True)
    optimizer = torch.optim.LBFGS([log_t], lr=0.1, max_iter=100)

    def closure():
        optimizer.zero_grad()
        loss = nn.functional.cross_entropy(logits / log_t.exp(), targets)
        loss.backward()
        return loss
    optimizer.step(closure)
    return float(log_t.exp())


def train(args):
    torch.manual_seed(args.seed)
    rng = np.random.default_rng(args.seed)
    STEP_RANGE[1] = args.step_max
    LONG_DROP[0] = args.long_drop
    IDLE_HAND[0] = args.idle_hand
    dev = device()
    tracks, records, classes, held_out, _ = load_data()
    controls = load_controls()
    batcher = Batcher(tracks, dev)
    generator = torch.Generator(device=dev).manual_seed(args.seed)
    training = [r for r in records if r['split'] == 'train' and r['kind'] == 'known']
    training += [r for r in training if r['source'] == 'include'] * (INCLUDE_OVERSAMPLE - 1)
    calibration = [r for r in records if r['split'] == 'calibration' and r['kind'] == 'known']
    cal_targets = torch.tensor([r['target'] for r in calibration])
    model = SignTransformer(len(classes), dim=args.dim, depth=args.depth).to(dev)
    ema = copy.deepcopy(model).eval()          # exponential moving average of weights, used for eval/export
    for p in ema.parameters():
        p.requires_grad_(False)
    params = sum(p.numel() for p in model.parameters())
    steps = math.ceil(len(training) / args.batch)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.05)
    total = steps * args.epochs
    warm = steps * 2
    scheduler = torch.optim.lr_scheduler.LambdaLR(
        optimizer, lambda s: min(1, (s + 1) / warm) * 0.5 * (1 + math.cos(math.pi * min(1, s / total))))
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    OUT.mkdir(parents=True, exist_ok=True)
    print(json.dumps({'event': 'start', 'run': OUT.name, 'epochs': args.epochs, 'dim': args.dim, 'depth': args.depth, 'classes': len(classes), 'trainClips': len(training),
                      'calibrationClips': len(calibration), 'parameters': params, 'device': str(dev),
                      'heldOutWords': held_out}), flush=True)
    best, history = -1.0, []
    optimizer_steps = [0]
    n_control = max(1, int(args.batch * 0.06))
    native = load_native(classes) if args.native else []
    n_native = max(1, int(args.batch * 0.08)) if native else 0
    if native:
        print(json.dumps({'event': 'native', 'clips': len(native)}), flush=True)
    for epoch in range(1, args.epochs + 1):
        model.train()
        order = rng.permutation(len(training))
        started, total_loss = time.time(), 0.0
        for s in range(steps):
            group = [training[i] for i in order[s * args.batch:(s + 1) * args.batch]]
            feats, mask = batcher.clips(group, rng, generator)
            targets = torch.tensor([r['target'] for r in group], device=dev)
            cf, cm = control_windows(controls, CONTROL_SPLITS['train'], rng, n_control)
            feats = torch.cat((feats, cf.to(dev)))
            mask = torch.cat((mask, cm.to(dev)))
            targets = torch.cat((targets, torch.zeros(n_control, dtype=torch.long, device=dev)))
            if n_native:
                nf, nm, nt = native_batch(native, rng, n_native)
                feats = torch.cat((feats, nf.to(dev)))
                mask = torch.cat((mask, nm.to(dev)))
                targets = torch.cat((targets, nt.to(dev)))
            loss = loss_fn(model(feats, mask), targets)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            decay = min(args.ema, (1 + optimizer_steps[0]) / (10 + optimizer_steps[0]))
            optimizer_steps[0] += 1
            with torch.no_grad():
                for shadow, live in zip(ema.parameters(), model.parameters()):
                    shadow.lerp_(live, 1 - decay)
            total_loss += float(loss)
        logits = logits_for(ema, batcher, calibration)
        accuracy = float((logits.argmax(1) == cal_targets).float().mean())
        history.append({'epoch': epoch, 'loss': total_loss / steps, 'calibrationTop1': accuracy,
                        'seconds': round(time.time() - started, 1)})
        print(json.dumps(history[-1]), flush=True)
        if accuracy > best:
            best = accuracy
            torch.save({'state_dict': ema.state_dict(), 'epoch': epoch, 'classes': classes,
                        'heldOut': held_out, 'dim': args.dim, 'depth': args.depth,
                        'sources': sorted(SOURCES)}, OUT / 'best.partial.pt')
            os.replace(OUT / 'best.partial.pt', OUT / 'best.pt')
    (OUT / 'history.json').write_text(json.dumps(history, indent=1))
    calibrate()


class Ensemble(nn.Module):
    """Averages member probabilities; returns log-probabilities as logits."""

    def __init__(self, members):
        super().__init__()
        self.members = nn.ModuleList(members)

    def forward(self, features, mask):
        probs = torch.stack([m(features, mask).softmax(-1) for m in self.members]).mean(0)
        return probs.clamp_min(1e-8).log()


def load_model(dev, folder=None):
    folder = folder or OUT
    checkpoint = torch.load(folder / 'best.pt', map_location=dev, weights_only=True)
    if 'members' in checkpoint:
        members = [load_model(dev, folder.parent / name)[0] for name in checkpoint['members']]
        return Ensemble(members).to(dev).eval(), {**checkpoint, 'dim': None, 'depth': None}
    model = SignTransformer(len(checkpoint['classes']), dim=checkpoint['dim'], depth=checkpoint['depth']).to(dev)
    model.load_state_dict(checkpoint['state_dict'], strict=True)
    return model.eval(), checkpoint


def make_ensemble(names):
    dev = torch.device('cpu')
    first = torch.load(OUT.parent / names[0] / 'best.pt', map_location=dev, weights_only=True)
    for name in names[1:]:
        other = torch.load(OUT.parent / name / 'best.pt', map_location=dev, weights_only=True)
        if other['classes'] != first['classes']:
            raise ValueError('Ensemble members must share classes')
    OUT.mkdir(parents=True, exist_ok=True)
    torch.save({'members': names, 'classes': first['classes'], 'heldOut': first['heldOut'], 'epoch': 0}, OUT / 'best.pt')
    calibrate()


def calibrate():
    """Temperature, gates and auto-accept classes, chosen on calibration signers only."""
    dev = device()
    tracks, records, classes, _, _ = load_data()
    controls = load_controls()
    batcher = Batcher(tracks, dev)
    model, checkpoint = load_model(dev)
    cal = [r for r in records if r['split'] == 'calibration']
    logits = logits_for(model, batcher, cal)
    targets = torch.tensor([r['target'] for r in cal])
    kinds = [r['kind'] for r in cal]
    known = torch.tensor([k == 'known' for k in kinds])
    temperature = fit_temperature(logits[known], targets[known])
    probs = (logits / temperature).softmax(1)
    windows = [w for name in CONTROL_SPLITS['calibration'] for _, w in live_windows(controls[name])]
    control_probs = (logits_for_windows(model, windows, dev) / temperature).softmax(1)
    best = None
    for threshold in np.arange(0.2, 0.96, 0.02):
        for margin in (0.0, 0.05, 0.1, 0.15, 0.2, 0.3):
            m = gated_metrics(probs, targets, kinds, threshold, margin)
            _, control_acc = gate(control_probs, threshold, margin)
            wrong = m['accepted'] - m['correctAccepted'] + int(control_acc.sum())
            precision = m['correctAccepted'] / max(1, m['accepted'] + int(control_acc.sum()))
            if precision >= PRECISION_TARGET and (best is None or m['recall'] > best['recall']):
                best = {'threshold': round(float(threshold), 2), 'margin': margin, 'recall': m['recall'],
                        'precision': precision, 'wrongAccepted': wrong}
    if best is None:
        # Report honestly instead of failing: take the most precise gate that
        # still accepts at least 20% of known words, and flag the miss.
        options = []
        for threshold in np.arange(0.2, 0.96, 0.02):
            for margin in (0.0, 0.05, 0.1, 0.15, 0.2, 0.3):
                m = gated_metrics(probs, targets, kinds, threshold, margin)
                _, control_acc = gate(control_probs, threshold, margin)
                precision = m['correctAccepted'] / max(1, m['accepted'] + int(control_acc.sum()))
                options.append({'threshold': round(float(threshold), 2), 'margin': margin,
                                'recall': m['recall'], 'precision': precision})
        usable = [o for o in options if o['recall'] >= 0.2] or options
        best = max(usable, key=lambda o: (o['precision'], o['recall']))
    best['precisionTargetMet'] = best['precision'] >= PRECISION_TARGET
    pred, accepted = gate(probs, best['threshold'], best['margin'])
    automatic = []
    for c in range(1, len(classes)):
        accepted_c = accepted & (pred == c)
        support = int(((targets == c) & known).sum())
        if accepted_c.sum() >= 3 and support:
            precision = float(((targets == c) & accepted_c).sum() / accepted_c.sum())
            recall = float(((targets == c) & accepted_c).sum() / support)
            if precision >= 0.95 and recall >= 0.5:
                automatic.append(classes[c])
    config = {**best, 'temperature': temperature, 'epoch': checkpoint['epoch'], 'autoAccept': automatic,
              'calibrationSigners': sorted(CALIBRATION_SIGNERS)}
    (OUT / 'calibration.json').write_text(json.dumps(config, indent=1))
    print(json.dumps({'event': 'calibrated', **{k: v for k, v in config.items() if k != 'autoAccept'},
                      'autoAcceptCount': len(automatic)}), flush=True)


def forest_predictions(records, tracks):
    from backend.model import TemporalForest, frame_features, gloss_key, temporal_embedding
    forest = TemporalForest(MODELS)
    rows = []
    for r in records:
        clip = tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
        frames = [frame_features(np.concatenate((clip[i].reshape(-1), np.zeros(15)))) for i in positions(r['length'])]
        frames = [f for f in frames if f[126:128].sum() > 0] or frames
        rows.append(temporal_embedding(frames))
    features = np.asarray(rows, np.float32)
    # full score vectors for top-1 over the forest's own classes
    indices = np.tile(forest.roots, (len(features), 1))
    owners = np.broadcast_to(np.arange(len(features))[:, None], indices.shape)
    for _ in range(100):
        nodes = forest.nodes[indices]
        active = nodes[:, :, 0] >= 0
        if not active.any():
            break
        columns = nodes[:, :, 0][active].astype(int)
        right = features[owners[active], columns] > nodes[:, :, 1][active]
        indices[active] = nodes[active, 2 + right.astype(int)].astype(int)
    leaves = forest.nodes[indices]
    scores = np.zeros((len(features), len(forest.labels)))
    for slot in (4, 6, 8):
        np.add.at(scores, (owners, leaves[:, :, slot].astype(int)), leaves[:, :, slot + 1] / len(forest.roots))
    return [gloss_key(l) for l in forest.labels], scores


def evaluate():
    """One-shot evaluation on the untouched test signers."""
    dev = device()
    tracks, records, classes, held_out, index = load_data()
    controls = load_controls()
    batcher = Batcher(tracks, dev)
    model, checkpoint = load_model(dev)
    config = json.loads((OUT / 'calibration.json').read_text())
    test = [r for r in records if r['split'] == 'test']
    logits = logits_for(model, batcher, test) / config['temperature']
    probs = logits.softmax(1)
    targets = torch.tensor([r['target'] for r in test])
    kinds = [r['kind'] for r in test]
    known = torch.tensor([k == 'known' for k in kinds])
    top5 = probs[known].topk(5, 1).indices
    result = {
        'scope': 'ISL500 publisher hand tracks, isolated words, unseen test signers; not live webcam accuracy',
        'testSigners': sorted(TEST_SIGNERS), 'classes': len(classes) - 1, 'heldOutWords': held_out,
        'epoch': checkpoint['epoch'],
        'top1': float((probs[known].argmax(1) == targets[known]).float().mean()),
        'top5': float((top5 == targets[known][:, None]).any(1).float().mean()),
        'gated': gated_metrics(probs, targets, kinds, config['threshold'], config['margin']),
        'perSigner': {}, 'controls': {}, 'forestComparison': None}
    result['perSource'] = {}
    for source in sorted({r['source'] for r in test}):
        rows = torch.tensor([r['source'] == source for r in test]) & known
        result['perSource'][source] = {'clips': int(rows.sum()),
                                       'top1': float((probs[rows].argmax(1) == targets[rows]).float().mean()),
                                       'top5': float((probs[rows].topk(5, 1).indices == targets[rows][:, None]).any(1).float().mean())}
    for signer in sorted(TEST_SIGNERS):
        rows = torch.tensor([r['signer'] == signer for r in test]) & known
        result['perSigner'][signer] = {'clips': int(rows.sum()),
                                       'top1': float((probs[rows].argmax(1) == targets[rows]).float().mean())}
    for name in CONTROL_SPLITS['test']:
        windows = live_windows(controls[name])
        cp = (logits_for_windows(model, [w for _, w in windows], dev) / config['temperature']).softmax(1)
        _, accepted = gate(cp, config['threshold'], config['margin'])
        result['controls'][name] = {'windows': len(windows), 'falseAccepted': int(accepted.sum()),
                                    'minutes': controls[name]['minutes']}
    # Forest on the same clips, restricted to words both models know.
    forest_labels, forest_scores = forest_predictions([r for r in test if r['kind'] == 'known'], tracks)
    # (forest rows follow known test clips; the comparison below uses ISL500 clips only)
    shared = [w for w in classes[1:] if key(w) in set(forest_labels)]
    col_mine = [classes.index(w) for w in shared]
    col_forest = [forest_labels.index(key(w)) for w in shared]
    known_test = [r for r in test if r['kind'] == 'known']
    rows = [i for i, r in enumerate(known_test) if r['label'] in set(shared) and r['source'] == 'isl500']
    if rows:
        truth = np.array([shared.index(known_test[i]['label']) for i in rows])
        mine = probs[known][rows][:, col_mine].argmax(1).numpy()
        theirs = forest_scores[rows][:, col_forest].argmax(1)
        result['forestComparison'] = {'sharedWords': len(shared), 'clips': len(rows),
                                      'transformerTop1': float((mine == truth).mean()),
                                      'forestTop1': float((theirs == truth).mean()),
                                      'note': 'Forest calibration signers 12-13 equal ours; its test signers equal ours. '
                                              'Both scored on whole clips without gates.'}
    per_class = {}
    pred = probs.argmax(1)
    for c, word in enumerate(classes[1:], 1):
        rows_c = known & (targets == c)
        if rows_c.any():
            per_class[word] = float((pred[rows_c] == c).float().mean())
    result['perClassTop1'] = per_class
    result['worstClasses'] = sorted(per_class.items(), key=lambda x: x[1])[:25]
    (OUT / 'test-results.json').write_text(json.dumps(result, indent=1))
    print(json.dumps({k: v for k, v in result.items() if k not in ('perClassTop1',)}, indent=1), flush=True)


def export(commit_on_release=False, threshold=None, release_ms=220, rejoin_ms=0, settle_ms=0, restart_ms=0):
    sys.path.insert(0, str(CACHE / 'python-onnx'))
    dev = torch.device('cpu')
    model, checkpoint = load_model(dev)
    config = json.loads((OUT / 'calibration.json').read_text())
    test = json.loads((OUT / 'test-results.json').read_text())
    path = MODELS / 'isl-transformer.onnx'
    features = torch.zeros(1, 20, FRAME_SIZE)
    mask = torch.ones(1, 20)
    torch.onnx.export(model, (features, mask), str(path), input_names=['features', 'mask'], output_names=['logits'],
                      dynamic_axes={'features': {0: 'batch', 1: 'time'}, 'mask': {0: 'batch', 1: 'time'},
                                    'logits': {0: 'batch'}}, opset_version=17, dynamo=False)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    meta = {
        'format': 'isl-transformer-v1', 'features': 'hand-frame-features-v1', 'frameSize': FRAME_SIZE,
        'maxFrames': MAX_T, 'sampleIntervalMs': 90, 'sha256': digest,
        'labels': checkpoint['classes'], 'temperature': config['temperature'],
        'threshold': threshold if threshold is not None else config['threshold'], 'margin': config['margin'], 'autoAccept': config['autoAccept'],
        'commitOnRelease': commit_on_release, 'releaseMs': release_ms, 'rejoinMs': rejoin_ms,
        'settleMs': settle_ms, 'restartMs': restart_ms, 'sources': sorted(SOURCES), 'run': OUT.name,
        'evaluation': {k: test.get(k) for k in ('scope', 'testSigners', 'top1', 'top5', 'gated', 'perSigner',
                                                 'perSource', 'controls', 'forestComparison')},
        'license': 'Trained on ISL500 / ISL-DATA publisher MediaPipe hand tracks (research and academic use only)'
                   + (', INCLUDE (AI4Bharat, CC BY 4.0)' if 'include' in SOURCES else '')
                   + ' and Parlance non-signing control recordings. Not for commercial use without relicensed data.',
        'training': 'python3 -m training.train_isl_transformer train|evaluate|export'}
    (MODELS / 'isl-transformer.json').write_text(json.dumps(meta, indent=1) + '\n')
    # The UI's "signs Parlance can recognise" list and per-word trust come from this file.
    (ROOT / 'public/signs/recognition.json').write_text(json.dumps({
        'classes': len(checkpoint['classes']) - 1, 'top1': test['top1'],
        'gatedPrecision': test['gated']['precision'],
        'reliable': sorted(key(w) for w in config['autoAccept']),
        'measured': sorted(key(w) for w, accuracy in test['perClassTop1'].items() if accuracy >= 0.8),
        'modelSha256': digest, 'threshold': meta['threshold'],
        'note': 'Held-out ISL500 signers (publisher MediaPipe tracks) for the bundled ISL transformer. '
                'Automatic words were selected on separate calibration signers. Live webcam accuracy '
                'has not been measured with independent signers.'}, indent=1) + '\n')
    print(json.dumps({'event': 'exported', 'path': str(path), 'sha256': digest,
                      'bytes': path.stat().st_size}), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['train', 'calibrate', 'evaluate', 'export', 'ensemble'])
    parser.add_argument('--epochs', type=int, default=60)
    parser.add_argument('--batch', type=int, default=256)
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--dim', type=int, default=192)
    parser.add_argument('--depth', type=int, default=3)
    parser.add_argument('--ema', type=float, default=0.999)
    parser.add_argument('--native', action='store_true', help='mix in browser-tracked training-signer clips')
    parser.add_argument('--step-max', type=float, default=1.35, help='slowest sampling step multiple (tempo aug)')
    parser.add_argument('--long-drop', type=float, default=0.0, help='probability of a 3-12 frame one-hand dropout')
    parser.add_argument('--seed', type=int, default=17)
    parser.add_argument('--idle-hand', type=float, default=0.0, help='probability of adding a resting second hand')
    parser.add_argument('--commit-on-release', action='store_true', help='export: commit when hands are lowered')
    parser.add_argument('--threshold', type=float, default=None, help='export: override the calibrated score threshold')
    parser.add_argument('--release-ms', type=float, default=220, help='export: hands-down time before a sign ends')
    parser.add_argument('--rejoin-ms', type=float, default=0, help='export: tracking gap that continues the same sign')
    parser.add_argument('--settle-ms', type=float, default=0, help='export: hands still this long in view ends a sign (0 = off)')
    parser.add_argument('--restart-ms', type=float, default=0, help='export: moving again after resting this long starts a new sign')
    parser.add_argument('--members', nargs='*', default=[], help='ensemble: run names to average')
    args = parser.parse_args()
    {'train': lambda: train(args), 'calibrate': calibrate, 'evaluate': evaluate, 'export': lambda: export(args.commit_on_release, args.threshold, args.release_ms, args.rejoin_ms, args.settle_ms, args.restart_ms),
     'ensemble': lambda: make_ensemble(args.members)}[args.command]()


if __name__ == '__main__':
    main()
