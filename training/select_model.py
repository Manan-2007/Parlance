"""Choose the shipped model on calibration signers only (test signers stay untouched).

For each candidate run (single models and ensembles) this replays, through the
live RecognitionSession with commit-on-release and the longest-window rule:
  - publisher-tracked calibration clips (sampled), and
  - calibration-signer clips re-tracked with Parlance's browser MediaPipe settings,
and counts never-trained words that get committed.

  ISL_RUN=<any> python3 -m training.select_model base large robust ens2 ens3
"""
import json
import random
import sys

import numpy as np
import torch

import training.train_isl_transformer as trainer
from backend.model import gloss_key
from backend.transformer import NONE_LABEL
from training.stream_check import native_replay, replay, score


class TorchRecognizer:
    """Same interface as backend.transformer.TransformerRecognizer, scored with PyTorch."""

    def __init__(self, run):
        folder = trainer.OUT.parent / run
        self.model, checkpoint = trainer.load_model(torch.device('cpu'), folder)
        config = json.loads((folder / 'calibration.json').read_text())
        self.labels = checkpoint['classes']
        self.automatic = set(config['autoAccept'])
        self.threshold = 0.94
        self.margin = config['margin']
        self.temperature = config['temperature']
        self.max_frames = trainer.MAX_T
        self.commit_on_release = True
        self.release_ms = 220
        self.rejoin_ms = 500

    def window(self, frames):
        return np.asarray(frames[-self.max_frames:], dtype=np.float32)

    def predict(self, windows, threshold):
        w = windows[-1]
        with torch.inference_mode():
            logits = self.model(torch.from_numpy(w)[None], torch.ones(1, len(w)))[0].numpy() / self.temperature
        row = np.exp(logits - logits.max())
        row /= row.sum()
        ranked = np.argsort(-row, kind='stable')
        best, second = int(ranked[0]), int(ranked[1])
        label, confidence = self.labels[best], float(row[best])
        reason = 'unstable'
        if label == NONE_LABEL:
            reason = 'resting'
        elif label not in self.automatic:
            reason = 'unverified'
        elif confidence < max(threshold, self.threshold) or confidence - float(row[second]) < self.margin:
            reason = 'low-confidence'
        candidates = [{'word': gloss_key(self.labels[i]), 'confidence': float(row[i])}
                      for i in ranked[:4] if self.labels[i] != NONE_LABEL and row[i] >= 0.12][:3]
        return {'candidate': gloss_key(label), 'confidence': confidence, 'reason': reason,
                'eligible': reason == 'unstable', 'candidates': candidates}


def main():
    runs = sys.argv[1:]
    torch.set_num_threads(4)
    tracks, records, _, _, _ = trainer.load_data()
    cal = [r for r in records if r['split'] == 'calibration']
    random.Random(11).shuffle(cal)
    known = [r for r in cal if r['kind'] == 'known'][:800]
    unknown = [r for r in cal if r['kind'] == 'unknown']
    known_labels = {r['label'] for r in records if r['kind'] == 'known'}
    clip = lambda r: tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
    # browser-tracked clips from calibration signers only
    import training.stream_check as sc
    saved = sc.TEST_SIGNERS
    sc.TEST_SIGNERS = set()
    out = {}
    try:
        for run in runs:
            model = TorchRecognizer(run)
            pub = score([{'expected': gloss_key(r['label']), **replay(model, clip(r))} for r in known])
            browser = score(native_replay(model, known_labels))
            inserted = sum(replay(model, clip(r))['committed'] is not None for r in unknown)
            out[run] = {'publisher': pub, 'browser': browser, 'unknownInserted': inserted, 'unknownClips': len(unknown)}
            print(run, json.dumps({'publisher': {k: pub[k] for k in ('autoPrecision', 'autoRecall', 'usable')},
                                   'browser': {k: browser[k] for k in ('clips', 'autoPrecision', 'autoRecall', 'usable')},
                                   'unknownInserted': inserted}), flush=True)
    finally:
        sc.TEST_SIGNERS = saved
    (trainer.OUT.parent / 'selection.json').write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
