"""Wait for an already running local trainer, then evaluate its frozen checkpoint.

This is a bounded one-run companion, not a recurring automation or a deployment.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT=Path(__file__).resolve().parents[1]


def write(path,value):
    temporary=path.with_suffix('.partial');temporary.write_text(json.dumps(value,indent=2)+'\n');temporary.replace(path)


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--pid',type=int,required=True)
    parser.add_argument('--branch',choices=['rgb','hands'],required=True);args=parser.parse_args()
    directory=ROOT/'.research-cache'/f'isl500-{args.branch}'
    status=directory/'evaluation-status.json';started=time.monotonic()
    write(status,{'stage':'waiting_for_training','trainingPid':args.pid})
    while True:
        try:os.kill(args.pid,0)
        except ProcessLookupError:break
        if time.monotonic()-started>4*60*60:
            write(status,{'stage':'timeout','message':'Trainer has not exited after four hours'})
            raise RuntimeError('Bounded evaluation wait expired')
        time.sleep(3)
    progress_file=directory/('training-progress.json' if args.branch=='rgb' else 'progress.json')
    progress=json.loads(progress_file.read_text()) if progress_file.exists() else {}
    if progress.get('stage')!='training_complete':
        write(status,{'stage':'failed','message':'Trainer exited without completing training','lastProgress':progress})
        raise RuntimeError('Trainer did not complete; inspect its log')
    write(status,{'stage':'evaluating_frozen_checkpoint','selection':'Validation only'})
    with (directory/'final-evaluation.log').open('w') as log:
        result=subprocess.run([sys.executable,str(ROOT/'training'/f'train_isl500_{args.branch}.py'),'--evaluate-test'],
            cwd=ROOT,stdout=log,stderr=subprocess.STDOUT)
    if result.returncode:
        write(status,{'stage':'failed','message':'Final evaluation failed','exitCode':result.returncode})
        raise RuntimeError('Final evaluation failed; inspect final-evaluation.log')
    metrics_path=directory/('model/test-results.json' if args.branch=='rgb' else 'test-results.json')
    metrics=json.loads(metrics_path.read_text())
    # A compact local artifact; no checkpoint is deployed by this companion.
    summary={k:v for k,v in metrics.items() if k!='predictions'}
    write(status,{'stage':'complete','metrics':summary,'automaticallyDeployed':False})
    print('ISL500_EVALUATION_COMPLETE '+json.dumps(summary),flush=True)


if __name__=='__main__':main()
