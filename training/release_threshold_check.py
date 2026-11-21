"""Pick the commit-on-release threshold on calibration signers (never the test set).

Higher thresholds insert fewer unknown signs but auto-commit fewer known ones.
  python3 -m training.release_threshold_check
"""
import json
import random

import numpy as np

from backend.model import gloss_key
from backend.recognition import RecognitionSession
from backend.transformer import TransformerRecognizer
from training.stream_check import MODELS, OUT, load_data, replay, score


def main():
    tracks, records, _, _, _ = load_data()
    model = TransformerRecognizer(MODELS)
    model.commit_on_release = True
    cal = [r for r in records if r['split'] == 'calibration']
    random.Random(7).shuffle(cal)
    known = [r for r in cal if r['kind'] == 'known'][:1500]
    unknown = [r for r in cal if r['kind'] == 'unknown']
    clip = lambda r: tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
    out = {}
    base = model.threshold
    for threshold in (base, 0.94, 0.96, 0.97, 0.98, 0.99):
        model.threshold = threshold
        rows = [{'expected': gloss_key(r['label']), **replay(model, clip(r))} for r in known]
        inserted = sum(replay(model, clip(r))['committed'] is not None for r in unknown)
        out[str(threshold)] = {**score(rows), 'unknownInserted': inserted, 'unknownClips': len(unknown)}
        print(threshold, json.dumps({k: out[str(threshold)][k] for k in ('autoPrecision', 'autoRecall', 'usable', 'unknownInserted', 'unknownClips')}), flush=True)
    (OUT / 'release-threshold.json').write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
