"""Adapt the motion encoder, then compare continuous validation performance."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'


def main():
    for script, arguments, log_name in [
        ('adapt_motion.py', [], 'motion-adaptation.log'),
        ('train_continuous.py', ['--pretrain', 'tcn-motion/best.pt', '--output', 'tcn-motion-continuous'],
         'motion-continuous-training.log'),
    ]:
        print(f'STARTING_STAGE {script}', flush=True)
        with (CACHE / log_name).open('w') as log:
            subprocess.run([sys.executable, str(ROOT / 'training' / script), *arguments],
                           cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, check=True)
    import torch
    before = torch.load(CACHE / 'tcn-continuous/best.pt', map_location='cpu', weights_only=True)
    after = torch.load(CACHE / 'tcn-motion-continuous/best.pt', map_location='cpu', weights_only=True)
    result = {'controlValidation': before['validation'], 'adaptedValidation': after['validation'],
              'improvedValidationWER': after['validation']['wordErrorRate'] < before['validation']['wordErrorRate'],
              'testReused': False, 'liveCameraAcceptance': 'Not evaluated; no automatic deployment'}
    (CACHE / 'motion-experiment-result.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result), flush=True)


if __name__ == '__main__':
    main()
