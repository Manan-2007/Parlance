"""Run the prepared continuous experiment, optionally waiting for extraction."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--wait-for-features', action='store_true')
    args = parser.parse_args()
    manifest = CACHE / 'csltr-manifest.json'
    started = time.monotonic()
    while not manifest.exists():
        if not args.wait_for_features:
            raise FileNotFoundError('Run prepare_csltr.py before this experiment')
        if time.monotonic() - started > 3600:
            raise TimeoutError('Feature extraction did not finish within one hour')
        count = len(list((CACHE / 'csltr-features').glob('*.npz')))
        print(f'WAITING_FOR_EXTRACTION cached_sequences={count}', flush=True)
        time.sleep(30)
    records = json.loads(manifest.read_text())['records']
    missing = [record['id'] for record in records if not (CACHE / 'csltr-features' / f'{record["id"]}.npz').exists()]
    if missing:
        raise ValueError(f'{len(missing)} manifest features are missing')
    print(f'STARTING_SENTENCE_TRAINING sequences={len(records)}', flush=True)
    with (CACHE / 'tcn-continuous-training.log').open('w') as log:
        subprocess.run([sys.executable, str(ROOT / 'training/train_continuous.py')],
                       cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, check=True)
    print('EVALUATING_SELECTED_CHECKPOINT', flush=True)
    with (CACHE / 'tcn-continuous-test.log').open('w') as log:
        subprocess.run([sys.executable, str(ROOT / 'training/train_continuous.py'), '--evaluate-test'],
                       cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, check=True)
    print('EXPERIMENT_COMPLETE reports=.research-cache/tcn-continuous/', flush=True)


if __name__ == '__main__':
    main()
