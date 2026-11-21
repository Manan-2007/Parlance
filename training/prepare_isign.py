"""Prepare a diverse, bounded iSign pose subset using approved HF access.

The output retains English translation labels, never treating them as gold
glosses. Source-video grouping prevents adjacent clips crossing these splits;
it does not establish signer independence. Signed URLs remain in memory only.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
from pathlib import Path
import random
import sys
import threading
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))

import numpy as np
from huggingface_hub import get_hf_file_metadata, hf_hub_url, get_token
from pose_format import Pose
from training.archive import HTTPRangeReader, MultipartRangeReader, read_indexed_member
from training.features import isign_frames, FEATURE_VERSION

LOCAL = threading.local()


def select_records(limit, per_video):
    members = json.loads((CACHE / 'iSign-pose-members.json').read_text())
    with (CACHE / 'iSign/iSign_v1.1.csv').open() as source:
        captions = {row['uid']: row['text'] for row in csv.DictReader(source)}
    groups = {}
    for member in members:
        if not member['name'].endswith('.pose'):
            continue
        uid = Path(member['name']).stem
        if not captions.get(uid, '').strip():
            continue
        video = uid.rsplit('-', 1)[0]
        groups.setdefault(video, []).append({**member, 'uid': uid, 'sourceVideo': video,
                                            'translation': captions[uid]})
    generator = random.Random(29)
    videos = sorted(groups)
    generator.shuffle(videos)
    records = []
    for video in videos:
        own = groups[video]
        generator.shuffle(own)
        bucket = int(hashlib.sha256(video.encode()).hexdigest()[:8], 16) % 10
        split = 'validation' if bucket == 0 else 'test' if bucket == 1 else 'train'
        for record in own[:per_video]:
            records.append({**record, 'split': split})
            if len(records) == limit:
                return records
    return records


def make_reader(manifest):
    if not hasattr(LOCAL, 'reader'):
        parts = sorted((item for item in manifest['files'] if item['name'].startswith('iSign-poses_v1.1_part_')),
                       key=lambda item: item['name'])
        readers = []
        for part in parts:
            def resolve(part_name=part['name']):
                return get_hf_file_metadata(hf_hub_url('Exploration-Lab/iSign', part_name,
                           repo_type='dataset', revision=manifest['commit']), token=get_token(),
                           headers={'Cache-Control': 'no-cache'}).location
            readers.append(HTTPRangeReader(resolve(), part['size'], refresh_url=resolve))
        LOCAL.reader = MultipartRangeReader(readers)
    return LOCAL.reader


def prepare_one(record, manifest):
    target = CACHE / 'isign-features' / f'{record["uid"]}.npz'
    if target.exists():
        with np.load(target) as data:
            if str(data['schema']) == FEATURE_VERSION and 'timestampsMs' in data:
                return {**record, 'frames': len(data['features']), 'cached': True}
    reader = make_reader(manifest)
    payload = read_indexed_member(reader, record)
    pose = Pose.read(payload)
    frames, timestamps = isign_frames(pose)
    valid_body = float(np.mean(np.any(frames != 0, axis=1)))
    if len(frames) < 8 or valid_body < .6 or not np.isfinite(frames).all():
        return {**record, 'excluded': True, 'reason': 'Short clip or insufficient valid body tracks',
                'frames': len(frames), 'bodyCoverage': valid_body}
    temporary = target.with_suffix('.partial')
    with temporary.open('wb') as file:
        np.savez_compressed(file, features=frames, timestampsMs=timestamps, schema=FEATURE_VERSION,
                            sourceFps=float(pose.body.fps), sourceSha256=hashlib.sha256(payload).hexdigest())
    temporary.replace(target)
    return {**record, 'frames': len(frames), 'sourceFps': float(pose.body.fps), 'bodyCoverage': valid_body}


def write_json(path, value):
    temporary = path.with_suffix('.partial')
    temporary.write_text(json.dumps(value, indent=2))
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=2000)
    parser.add_argument('--per-video', type=int, default=4)
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.limit <= 10000 or not 1 <= args.workers <= 4 or args.per_video < 1:
        raise ValueError('Invalid subset or worker limit')
    manifest = json.loads((CACHE / 'iSign-files.json').read_text())
    records = select_records(args.limit, args.per_video)
    (CACHE / 'isign-features').mkdir(exist_ok=True)
    plan = {'publisher': 'https://huggingface.co/datasets/Exploration-Lab/iSign',
            'revision': manifest['commit'], 'schema': FEATURE_VERSION, 'license': 'CC-BY-NC-SA-4.0',
            'labelType': 'English translation, not gloss alignment',
            'splitPolicy': 'Deterministic source-video hash. Signer identities are not independently verified.',
            'records': records}
    write_json(CACHE / 'isign-subset-plan.json', plan)
    print(f'DATA_PREPARATION_STARTED selected={len(records)} source_videos={len({r["sourceVideo"] for r in records})}', flush=True)
    complete, failures = [], []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        pending = {pool.submit(prepare_one, record, manifest): record for record in records}
        for future in as_completed(pending):
            record = pending[future]
            try:
                complete.append(future.result())
            except Exception as error:
                # Exception details may contain a temporary download URL.
                failure = {'uid': record['uid'], 'errorType': type(error).__name__}
                if isinstance(error, HTTPError):
                    failure['httpStatus'] = error.code
                elif isinstance(error, URLError):
                    failure['reasonType'] = type(error.reason).__name__
                failures.append(failure)
                print(json.dumps({'DATA_ERROR': failure}), flush=True)
            progress = {'processed': len(complete) + len(failures), 'selected': len(records),
                        'prepared': sum(not r.get('excluded', False) for r in complete),
                        'excluded': sum(bool(r.get('excluded')) for r in complete), 'failed': len(failures)}
            write_json(CACHE / 'isign-preparation-progress.json', progress)
            if progress['processed'] % 10 == 0 or progress['processed'] == len(records):
                print(json.dumps(progress), flush=True)
    write_json(CACHE / 'isign-subset-manifest.json', {**plan, 'records': complete, 'failures': failures})
    print('DATA_PREPARATION_COMPLETE; no model training was started', flush=True)


if __name__ == '__main__':
    main()
