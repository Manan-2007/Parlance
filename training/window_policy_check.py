"""Compare how the transformer combines its multi-window scores in the live session.

  max        current: the most confident window wins when none is eligible
  longest    decide on the longest window only (the whole sign since the hands rose)
  mean       average the window probabilities, then decide
  longest+   longest window, but a shorter eligible window that agrees may commit

Replays held-out publisher clips, browser-tracked clips and never-trained words.
  python3 -m training.window_policy_check [--limit 1200]
"""
import argparse
import json
import random

import numpy as np

from backend.model import gloss_key
from backend.transformer import NONE_LABEL, TransformerRecognizer
from training.stream_check import MODELS, OUT, load_data, native_replay, replay, score


def decide(model, row, threshold):
    ranked = np.argsort(-row, kind='stable')
    best, second = int(ranked[0]), int(ranked[1])
    label, confidence = model.labels[best], float(row[best])
    reason = 'unstable'
    if label == NONE_LABEL:
        reason = 'resting'
    elif label not in model.automatic:
        reason = 'unverified'
    elif confidence < max(threshold, model.threshold) or confidence - float(row[second]) < model.margin:
        reason = 'low-confidence'
    candidates = [{'word': gloss_key(model.labels[i]), 'confidence': float(row[i])}
                  for i in ranked[:4] if model.labels[i] != NONE_LABEL and row[i] >= 0.12][:3]
    return {'candidate': gloss_key(label), 'confidence': confidence, 'reason': reason,
            'eligible': reason == 'unstable', 'candidates': candidates}


def make_predict(model, policy):
    def predict(windows, threshold):
        scores = model.scores(windows)
        if policy == 'mean':
            return decide(model, scores.mean(0), threshold)
        results = [decide(model, row, threshold) for row in scores]
        longest = results[-1]
        if policy == 'longest':
            return longest
        if policy == 'longest+':
            agree = [r for r in results if r['eligible'] and r['candidate'] == longest['candidate']]
            return max(agree, key=lambda r: r['confidence']) if agree else {**longest, 'eligible': longest['eligible']}
        accepted = [r for r in results if r['eligible'] and r['candidate'] == longest['candidate']]
        if accepted:
            return max(accepted, key=lambda r: r['confidence'])
        best = max(results, key=lambda r: r['confidence'])
        return {**best, 'eligible': False}
    return predict


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=1200)
    args = parser.parse_args()
    tracks, records, classes, _, _ = load_data()
    model = TransformerRecognizer(MODELS)
    original = model.predict
    test = [r for r in records if r['split'] == 'test' and r['kind'] == 'known']
    random.Random(5).shuffle(test)
    test = test[:args.limit]
    unknown = [r for r in records if r['split'] == 'test' and r['kind'] == 'unknown']
    known_labels = {r['label'] for r in records if r['kind'] == 'known'}
    clip = lambda r: tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
    out = {}
    for policy in ('max', 'longest', 'longest+', 'mean'):
        model.predict = make_predict(model, policy)
        for release in (False, True):
            model.commit_on_release = release
            key = f'{policy}/{"release" if release else "hold"}'
            rows = [{'expected': gloss_key(r['label']), **replay(model, clip(r))} for r in test]
            out[key] = {'publisher': score(rows), 'browser': score(native_replay(model, known_labels)),
                        'unknownCommitted': sum(replay(model, clip(r))['committed'] is not None for r in unknown),
                        'unknownClips': len(unknown)}
            print(key, json.dumps({k: (v if not isinstance(v, dict) else {m: v[m] for m in ('autoPrecision', 'autoRecall', 'usable')})
                                   for k, v in out[key].items()}), flush=True)
    model.predict = original
    (OUT / 'window-policy.json').write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
