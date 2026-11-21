"""Prepare an external, publisher-labelled ISL candidate comparison.

This benchmark is development evidence. Source-video separation is not verified
signer separation and no result automatically changes the camera recognizer.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
from pathlib import Path
import re
import sys
import threading
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))

from huggingface_hub import get_hf_file_metadata, hf_hub_url, get_token
from training.archive import HTTPRangeReader, read_indexed_member

LOCAL = threading.local()
PILOT_WORDS = ['mother', 'father', 'brother', 'sister', 'friend', 'family', 'boy', 'girl', 'man',
               'woman', 'baby', 'school', 'teacher', 'student', 'book', 'pen', 'computer', 'bus',
               'car', 'train', 'house', 'door', 'window', 'chair', 'table', 'bag', 'cat', 'dog', 'cow', 'fish']
UNKNOWN_WORDS = ['red', 'blue', 'black', 'morning', 'sunday', 'yellow']


def resolver(manifest):
    archive = next(item for item in manifest['files'] if item['name'].endswith('.zip'))
    def resolve():
        return get_hf_file_metadata(hf_hub_url('Exploration-Lab/CISLR', archive['name'],
                   repo_type='dataset', revision=manifest['commit']), token=get_token(),
                   headers={'Cache-Control': 'no-cache'}).location
    return archive, resolve


def index_archive(manifest):
    path = CACHE / 'cislr-video-members.json'
    if path.exists():
        return json.loads(path.read_text())
    archive, resolve = resolver(manifest)
    with zipfile.ZipFile(HTTPRangeReader(resolve(), archive['size'], refresh_url=resolve)) as source:
        members = [{'name': info.filename, 'offset': info.header_offset, 'size': info.file_size,
                    'compressed': info.compress_size, 'crc32': info.CRC}
                   for info in source.infolist() if not info.is_dir()]
    path.write_text(json.dumps(members))
    return members


def fetch(record, manifest):
    directory = CACHE / 'candidate-benchmark/videos'
    directory.mkdir(parents=True, exist_ok=True)
    target = directory / (record['id'] + Path(record['member']['name']).suffix)
    if target.exists() and target.stat().st_size == record['member']['size']:
        return {**record, 'video': str(target)}
    if not hasattr(LOCAL, 'reader'):
        archive, resolve = resolver(manifest)
        LOCAL.reader = HTTPRangeReader(resolve(), archive['size'], refresh_url=resolve)
    payload = read_indexed_member(LOCAL.reader, record['member'])
    temporary = target.with_suffix('.partial')
    temporary.write_bytes(payload)
    temporary.replace(target)
    return {**record, 'video': str(target), 'videoSha256': hashlib.sha256(payload).hexdigest()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--per-word', type=int, default=2)
    args = parser.parse_args()
    manifest = json.loads((CACHE / 'CISLR-files.json').read_text())
    members = index_archive(manifest)
    by_uid = {Path(item['name']).stem: item for item in members if Path(item['name']).suffix.lower() in {'.mp4', '.avi', '.mov', '.mkv'}}
    with (CACHE / 'CISLR/test.csv').open() as source:
        rows = list(csv.DictReader(source))
    records, missing = [], []
    for word in PILOT_WORDS + UNKNOWN_WORDS:
        own = sorted((row for row in rows if row['gloss'].lower() == word and row['uid'] in by_uid), key=lambda row: row['uid'])
        selected_sources = set()
        count = 0
        for row in own:
            video_id = row['uid'][:11]
            if video_id in selected_sources:
                continue
            selected_sources.add(video_id)
            identifier = hashlib.sha256(row['uid'].encode()).hexdigest()[:16]
            records.append({'id': identifier, 'uid': row['uid'], 'sourceVideo': video_id, 'expected': word,
                            'kind': 'known' if word in PILOT_WORDS else 'unknown',
                            'split': 'development' if count == 0 else 'challenge', 'member': by_uid[row['uid']]})
            count += 1
            if count >= args.per_word:
                break
        if count < args.per_word:
            missing.append({'word': word, 'availableDistinctSources': count})
    directory = CACHE / 'candidate-benchmark'
    directory.mkdir(exist_ok=True)
    plan = {'dataset': 'https://huggingface.co/datasets/Exploration-Lab/CISLR', 'revision': manifest['commit'],
            'purpose': 'External dataset development comparison; not product acceptance',
            'labelStatus': 'Publisher labels, not independently reviewed', 'signerIndependenceVerified': False,
            'vocabulary': PILOT_WORDS, 'missingCoverage': missing, 'records': records}
    (directory / 'plan.json').write_text(json.dumps(plan, indent=2))
    print(f'BENCHMARK_DOWNLOAD_STARTED selected={len(records)} vocabulary={len(PILOT_WORDS)}', flush=True)
    complete = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(fetch, record, manifest) for record in records]
        for future in as_completed(futures):
            complete.append(future.result())
            if len(complete) % 10 == 0:
                print(f'Downloaded {len(complete)}/{len(records)} benchmark clips', flush=True)
    complete.sort(key=lambda record: record['id'])
    (directory / 'manifest.json').write_text(json.dumps({**plan, 'records': complete}, indent=2))
    print(f'BENCHMARK_DOWNLOAD_COMPLETE clips={len(complete)} missing_coverage={missing}', flush=True)


if __name__ == '__main__':
    main()
