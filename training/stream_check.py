"""Replay held-out ISL500 clips through the live backend session.

Each test clip is fed to backend.recognition.RecognitionSession at 30 fps as
141-float frames, followed by a short no-hands release, exactly as the browser
would stream it. This measures what a user would see: an automatic commit, a
suggestion that needs a tap, or nothing. Both shipped models are scored on the
words they share.

  python3 -m training.stream_check [--limit 3000]
"""
import argparse
import json
from pathlib import Path
import random
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python-onnx'))
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
import numpy as np

import backend.recognition as recognition
from backend.model import TemporalForest, gloss_key
from backend.recognition import RecognitionSession
from backend.transformer import TransformerRecognizer
from training.train_isl_transformer import CALIBRATION_SIGNERS, CONTROL_SPLITS, DATA, OUT, TEST_SIGNERS, load_controls, load_data

MODELS = ROOT / 'backend' / 'models'


def replay(model, clip):
    session = RecognitionSession(model)
    now = 1000.0
    outcome = {'committed': None, 'confirmed': None, 'suggestions': []}
    frames = [np.concatenate((f.reshape(-1).astype(np.float64), np.zeros(15))) for f in clip]
    frames += [np.zeros(141)] * 10            # ~330 ms with hands lowered
    for vector in frames:
        now += 1000 / 30
        result = session.feed(vector.tolist(), now)
        if 'word' in result and outcome['committed'] is None:
            outcome['committed'] = result['word']
        if result.get('suggestions'):
            outcome['suggestions'] = [s['word'] for s in result['suggestions']]
    return outcome


def control_insertions(model, controls):
    """Words committed while a person is NOT signing (typing, empty scene), per minute."""
    real = recognition.frame_features
    recognition.frame_features = lambda vector: np.asarray(vector[:135], dtype=np.float64)  # replay stored features
    try:
        out = {}
        for name in CONTROL_SPLITS['test']:
            data = np.load(CACHE / 'isl-native/features' / f'{name}.npz')
            session, words = RecognitionSession(model), []
            for features, stamp in zip(data['hands'], data['timestampsMs']):
                vector = np.concatenate((features, np.zeros(6))).tolist()
                result = session.feed(vector, 1000.0 + float(stamp))
                if 'word' in result:
                    words.append(result['word'])
            minutes = float((data['timestampsMs'][-1] - data['timestampsMs'][0]) / 60000)
            out[name] = {'minutes': round(minutes, 2), 'insertions': len(words), 'words': words}
        return out
    finally:
        recognition.frame_features = real


def native_replay(model, records_by_label):
    """Clips re-tracked from the original ISL500 videos with Parlance's browser
    MediaPipe settings (640 px, real timestamps): the closest offline proxy for a
    webcam. Only signers this model never trained on are used."""
    manifest = json.loads((CACHE / 'isl-native/full-manifest.json').read_text())
    real = recognition.frame_features
    recognition.frame_features = lambda vector: np.asarray(vector[:135], dtype=np.float64)
    rows = []
    try:
        for r in manifest['records']:
            signer = r['signer'].upper()
            if signer not in TEST_SIGNERS | CALIBRATION_SIGNERS or r['label'] not in records_by_label:
                continue
            path = CACHE / 'isl-native/features' / f"{r['id']}.npz"
            if not path.exists():
                continue
            data = np.load(path)
            session = RecognitionSession(model)
            outcome = {'committed': None, 'suggestions': []}
            last = 0.0
            for features, stamp in zip(data['hands'], data['timestampsMs']):
                last = 1000.0 + float(stamp)
                result = session.feed(np.concatenate((features, np.zeros(6))).tolist(), last)
                if 'word' in result and outcome['committed'] is None:
                    outcome['committed'] = result['word']
                if result.get('suggestions'):
                    outcome['suggestions'] = [x['word'] for x in result['suggestions']]
            for k in range(1, 11):        # hands lowered
                result = session.feed([0.0] * 141, last + k * 33.3)
                if 'word' in result and outcome['committed'] is None:
                    outcome['committed'] = result['word']
                if result.get('suggestions'):
                    outcome['suggestions'] = [x['word'] for x in result['suggestions']]
            rows.append({'expected': gloss_key(r['label']), 'signer': signer, **outcome})
    finally:
        recognition.frame_features = real
    return rows


def score(rows):
    n = len(rows)
    auto_right = sum(r['committed'] == r['expected'] for r in rows)
    auto_wrong = sum(r['committed'] is not None and r['committed'] != r['expected'] for r in rows)
    tap = sum(r['committed'] is None and r['expected'] in r['suggestions'] for r in rows)
    committed = auto_right + auto_wrong
    return {'clips': n, 'autoCorrect': auto_right, 'autoWrong': auto_wrong,
            'autoPrecision': auto_right / committed if committed else None,
            'autoRecall': auto_right / n if n else None,
            'correctSuggestionNeedsTap': tap,
            'usable': (auto_right + tap) / n if n else None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=3000)
    args = parser.parse_args()
    tracks, records, classes, _, _ = load_data()
    transformer = TransformerRecognizer(MODELS)
    forest = TemporalForest(MODELS)
    forest_words = {gloss_key(l) for l in forest.labels if l != '__NONE__'}
    test = [r for r in records if r['split'] == 'test' and r['kind'] == 'known']
    random.Random(5).shuffle(test)
    test = test[:args.limit]
    mine, release, shared_mine, shared_forest = [], [], [], []
    for i, r in enumerate(test, 1):
        clip = tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
        expected = gloss_key(r['label'])
        transformer.commit_on_release = False
        row = {'expected': expected, 'signer': r['signer'], **replay(transformer, clip)}
        transformer.commit_on_release = True
        release.append({'expected': expected, 'signer': r['signer'], **replay(transformer, clip)})
        mine.append(row)
        if expected in forest_words:
            shared_mine.append(row)
            shared_forest.append({'expected': expected, **replay(forest, clip)})
        if i % 500 == 0:
            print(f'STREAM {i}/{len(test)}', flush=True)
    result = {
        'scope': 'Held-out ISL500 signers replayed through the live session at 30 fps; '
                 'publisher tracks, not browser webcam tracks',
        'transformerAllWords': score(mine),
        'transformerAllWordsCommitOnRelease': score(release),
        'perSignerCommitOnRelease': {s: score([r for r in release if r['signer'] == s])
                                      for s in sorted({r['signer'] for r in release})},
        'sharedWords': len({r['expected'] for r in shared_mine}),
        'transformerSharedWords': score(shared_mine),
        'forestSharedWords': score(shared_forest),
    }
    known_labels = {r['label'] for r in records if r['kind'] == 'known'}
    for policy in (False, True):
        transformer.commit_on_release = policy
        result['browserTracked' + ('CommitOnRelease' if policy else 'Hold')] = score(native_replay(transformer, known_labels))
    forest_rows = [r for r in native_replay(forest, known_labels) if r['expected'] in forest_words]
    result['browserTrackedForestSharedWords'] = score(forest_rows)
    unknown = [r for r in records if r['split'] == 'test' and r['kind'] == 'unknown']
    for policy in (False, True):
        transformer.commit_on_release = policy
        wrong = sum(replay(transformer, tracks[r['offset']:r['offset'] + r['length']].astype(np.float32))['committed'] is not None
                    for r in unknown)
        result['unknownSignInsertions' + ('CommitOnRelease' if policy else 'Hold')] = {'clips': len(unknown), 'committed': wrong}
    result['unknownSignInsertionsForest'] = {'clips': len(unknown), 'committed': sum(
        replay(forest, tracks[r['offset']:r['offset'] + r['length']].astype(np.float32))['committed'] is not None for r in unknown)}
    transformer.commit_on_release = False
    result['controlsHold'] = control_insertions(transformer, None)
    transformer.commit_on_release = True
    result['controlsCommitOnRelease'] = control_insertions(transformer, None)
    result['controlsForest'] = control_insertions(forest, None)
    (OUT / 'stream-results.json').write_text(json.dumps(result, indent=1))
    print(json.dumps(result, indent=1))


if __name__ == '__main__':
    main()
