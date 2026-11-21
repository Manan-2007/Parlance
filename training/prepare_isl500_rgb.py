"""Prepare a bounded, signer-separated RGB experiment from the ISL500 publisher.

Raw files are verified against publisher LFS SHA256, decoded into chronological
frames, then removed from temporary storage. The source videos are research-only.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
import time
from urllib.parse import quote
from urllib.request import urlopen

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
OUTPUT = CACHE / 'isl500-rgb'
REVISION = 'bf1fc5a65ce5ccccdd25eba01f55558db2ccbf32'
WORDS = ['Hello','Thankyou','Please','Yes','No','Help','I','You','He','She',
         'Mother','Father','Sister','Friend','Family','Baby','Teacher','Student',
         'School','House','Eat','Drink','Water','Food','Tea','Go','Sit','Walk',
         'Work','Book','Pen','Computer','Bag','Car','Bus','Doctor','Happy','Sad','Cool','What']
UNKNOWN = ['Red','Black','Cat','Dog','Cow']
SCHEMA = 'isl500-rgb32-128x171-v1'


def atomic_json(path, value):
    temp = path.with_suffix('.partial')
    temp.write_text(json.dumps(value, indent=2) + '\n')
    temp.replace(path)


def plan(publisher=None):
    publisher = publisher or json.loads((CACHE / 'ISL500-video-files.json').read_text())
    if publisher['commit'] != REVISION:
        raise ValueError('ISL500 manifest revision changed')
    records = []
    for file in publisher['files']:
        name = file['name']
        # Publisher uses session/clip suffixes for some users and UUID-based
        # suffixes for others; the declared word is the prefix before "__".
        match = re.fullmatch(r'Videos/User(\d{3})/([^/]+?)__[^/]+\.mp4', name)
        if not match:
            raise ValueError(f'Unrecognized source path: {name}')
        signer, label = int(match[1]), match[2]
        if label not in WORDS + UNKNOWN or label in UNKNOWN and signer <= 10:
            continue
        split = 'train' if signer <= 10 else 'validation' if signer <= 12 else 'test'
        identifier = hashlib.sha256(name.encode()).hexdigest()[:20]
        records.append({'id': identifier, 'signer': f'User{signer:03}', 'label': label,
            'kind': 'unknown' if label in UNKNOWN else 'known', 'split': split,
            'publisherPath': name, 'bytes': file['size'], 'sha256': file['lfsSha256'],
            'frameFile': str(OUTPUT / 'frames' / f'{identifier}.npz')})
    expected = {(f'User{s:03}', word) for s in range(1,16) for word in WORDS}
    actual = {(r['signer'], r['label']) for r in records if r['kind'] == 'known'}
    if expected != actual or len(records) != len(actual) + 25:
        raise ValueError('Unexpected class/signer coverage or duplicate entries')
    if len({r['sha256'] for r in records}) != len(records) or any(not r['sha256'] for r in records):
        raise ValueError('Missing source hashes or exact duplicate videos')
    records.sort(key=lambda r: ({'train':0,'validation':1,'test':2}[r['split']], r['signer'], r['label']))
    return {'dataset':'https://huggingface.co/datasets/ISL500/ISL-DATA', 'revision':REVISION,
        'terms':'Publisher restricts use to research and academic purposes; no raw redistribution here.',
        'schema':SCHEMA, 'vocabulary':WORDS, 'unknownWords':UNKNOWN,
        'splitPolicy':{'train':['User%03d'%s for s in range(1,11)],
            'validation':['User011','User012'], 'test':['User013','User014','User015']},
        'identityScope':'Signer IDs supplied by publisher; identities and word labels not independently reviewed.',
        'records':records}


def sample_video(path):
    capture = cv2.VideoCapture(str(path))
    fps = capture.get(cv2.CAP_PROP_FPS)
    if not capture.isOpened():
        capture.release()
        raise ValueError('Source video cannot be opened')
    selected, timestamps = [], []
    # Metadata frame counts are estimates for some variable-rate publisher
    # files. Sequential decoding avoids seeking past their actual final frame.
    while True:
        ok, image = capture.read()
        if not ok:
            break
        timestamp = capture.get(cv2.CAP_PROP_POS_MSEC)
        image = cv2.cvtColor(cv2.resize(image, (171,128), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
        selected.append(image)
        timestamps.append(timestamp)
        if len(selected) > 3600:
            capture.release()
            raise ValueError('Unexpectedly long isolated-sign video')
    capture.release()
    if len(selected) < 2 or not np.isfinite(timestamps).all() or timestamps[0] < 0 or np.any(np.diff(timestamps) <= 0):
        raise ValueError('Source presentation timestamps are invalid')
    indices = np.linspace(0,len(selected)-1,32).round().astype(int)
    return np.asarray(selected)[indices], np.asarray(timestamps)[indices], fps, len(selected)


def prepare(record):
    target = Path(record['frameFile'])
    if target.exists():
        with np.load(target) as data:
            if str(data['schema']) == SCHEMA and str(data['sourceSha256']) == record['sha256'] and data['frames'].shape == (32,128,171,3):
                return record
    error = None
    for attempt in range(3):
        try:
            with tempfile.TemporaryDirectory(prefix='source-', dir=OUTPUT / 'temporary') as directory:
                raw = Path(directory) / 'clip.mp4'
                url = f'https://huggingface.co/datasets/ISL500/ISL-DATA/resolve/{REVISION}/{quote(record["publisherPath"], safe="/")}'
                checksum, size = hashlib.sha256(), 0
                with urlopen(url, timeout=90) as response, raw.open('wb') as file:
                    while chunk := response.read(1024*1024):
                        file.write(chunk); checksum.update(chunk); size += len(chunk)
                if size != record['bytes'] or checksum.hexdigest() != record['sha256']:
                    raise ValueError('Publisher video checksum/size mismatch')
                frames, timestamps, fps, count = sample_video(raw)
                temporary = target.with_suffix('.partial')
                with temporary.open('wb') as file:
                    np.savez_compressed(file, frames=frames, timestampsMs=timestamps,
                        sourceFps=fps, sourceFrames=count, sourceSha256=record['sha256'], schema=SCHEMA)
                temporary.replace(target)
            return record
        except Exception as failure:
            error = failure
            if attempt < 2:
                time.sleep(2**attempt)
    raise RuntimeError(f'Failed source {record["id"]}: {type(error).__name__}') from error


def main():
    cv2.setNumThreads(1)
    (OUTPUT/'frames').mkdir(parents=True,exist_ok=True)
    (OUTPUT/'temporary').mkdir(exist_ok=True)
    manifest = plan()
    atomic_json(OUTPUT/'plan.json', manifest)
    print('ISL500_RGB_PREPARATION_STARTED '+json.dumps({'clips':len(manifest['records']),
        'sourceBytes':sum(r['bytes'] for r in manifest['records']), 'words':len(WORDS)}),flush=True)
    started=time.monotonic();complete=[];failures=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(prepare,r):r for r in manifest['records']}
        for future in as_completed(futures):
            record=futures[future]
            try:complete.append(future.result())
            except Exception as error:failures.append({'id':record['id'],'error':type(error).__name__})
            progress={'ready':len(complete),'total':len(futures),'failed':failures,
                'elapsedSeconds':round(time.monotonic()-started),
                'readySourceBytes':sum(r['bytes'] for r in complete)}
            atomic_json(OUTPUT/'progress.json',progress)
            if len(complete)%5==0 or failures:print('ISL500_RGB_PROGRESS '+json.dumps(progress),flush=True)
    if failures:
        raise RuntimeError('Preparation has unresolved failures; rerun to resume verified cached frames')
    atomic_json(OUTPUT/'manifest.json',manifest)
    print('ISL500_RGB_PREPARATION_COMPLETE',flush=True)


if __name__=='__main__':
    main()
