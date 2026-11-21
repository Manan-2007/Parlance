"""Release delay / dropout-rejoin settings, chosen on calibration signers only.

  ISL_RUN=<any> python3 -m training.release_policy_check <run>
"""
import json
import random
import sys

import numpy as np

import training.stream_check as sc
import training.train_isl_transformer as trainer
from backend.model import gloss_key
from training.select_model import TorchRecognizer


def main():
    run = sys.argv[1]
    tracks, records, _, _, _ = trainer.load_data()
    cal = [r for r in records if r['split'] == 'calibration']
    random.Random(11).shuffle(cal)
    known = [r for r in cal if r['kind'] == 'known'][:600]
    unknown = [r for r in cal if r['kind'] == 'unknown']
    known_labels = {r['label'] for r in records if r['kind'] == 'known'}
    clip = lambda r: tracks[r['offset']:r['offset'] + r['length']].astype(np.float32)
    model = TorchRecognizer(run)
    sc.TEST_SIGNERS = set()                      # browser clips from calibration signers only
    out = {}
    for release_ms, rejoin_ms in ((220, 0), (220, 500), (220, 800), (300, 0), (300, 700), (400, 0)):
        model.release_ms, model.rejoin_ms = release_ms, rejoin_ms
        pub = sc.score([{'expected': gloss_key(r['label']), **sc.replay(model, clip(r))} for r in known])
        browser = sc.score(sc.native_replay(model, known_labels))
        inserted = sum(sc.replay(model, clip(r))['committed'] is not None for r in unknown)
        key = f'release{release_ms}/rejoin{rejoin_ms}'
        out[key] = {'publisher': pub, 'browser': browser, 'unknownInserted': inserted}
        print(key, json.dumps({'publisher': {k: pub[k] for k in ('autoPrecision', 'autoRecall', 'usable')},
                               'browser': {k: browser[k] for k in ('autoPrecision', 'autoRecall', 'usable')},
                               'unknownInserted': inserted}), flush=True)
    (trainer.OUT.parent / f'release-policy-{run}.json').write_text(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
