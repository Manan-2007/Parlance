"""Regenerate corrected source features and compare two sentence experiments."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'


def main():
    stages = [
        ('prepare_include.py', [], 'corrected-include-preparation.log'),
        ('pretrain.py', ['--epochs', '40'], 'corrected-pretraining.log'),
        ('train_continuous.py', ['--output', 'tcn-continuous-corrected'], 'corrected-continuous.log'),
        ('adapt_motion.py', ['--output', 'tcn-motion-corrected'], 'corrected-motion-adaptation.log'),
        ('train_continuous.py', ['--pretrain', 'tcn-motion-corrected/best.pt', '--output', 'tcn-motion-continuous-corrected'], 'corrected-motion-continuous.log'),
    ]
    for script, args, log_name in stages:
        print(f'STARTING {script} {args}', flush=True)
        with (CACHE / log_name).open('w') as log:
            subprocess.run([sys.executable, str(ROOT / 'training' / script), *args], cwd=ROOT,
                           stdout=log, stderr=subprocess.STDOUT, check=True)
    import torch
    results = {}
    for name in ['tcn-continuous', 'tcn-motion-continuous', 'tcn-continuous-corrected', 'tcn-motion-continuous-corrected']:
        checkpoint = torch.load(CACHE / name / 'best.pt', weights_only=True, map_location='cpu')
        results[name] = {'epoch': checkpoint['epoch'], 'validation': checkpoint['validation']}
    (CACHE / 'coordinate-fix-experiment-results.json').write_text(json.dumps(results, indent=2))
    print('COORDINATE_FIX_EXPERIMENT_COMPLETE', json.dumps(results), flush=True)


if __name__ == '__main__':
    main()
