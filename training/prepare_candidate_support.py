"""Fetch labelled training prototypes, kept separate from benchmark queries."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import csv
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.prepare_candidate_benchmark import fetch

CACHE = ROOT / '.research-cache'


def main():
    manifest = json.loads((CACHE / 'candidate-benchmark/manifest.json').read_text())
    publisher = json.loads((CACHE / 'CISLR-files.json').read_text())
    members = {Path(item['name']).stem: item for item in json.loads((CACHE / 'cislr-video-members.json').read_text())}
    with (CACHE / 'CISLR/prototype.csv').open() as source:
        prototypes = list(csv.DictReader(source))
    excluded_sources = {record['sourceVideo'] for record in manifest['records']}
    records = []
    for word in manifest['vocabulary']:
        row = next(row for row in prototypes if row['gloss'].lower() == word and row['uid'][:11] not in excluded_sources)
        if row['uid'] not in members:
            raise ValueError('Publisher prototype video is missing')
        records.append({'id': hashlib.sha256(row['uid'].encode()).hexdigest()[:16], 'uid': row['uid'],
                        'sourceVideo': row['uid'][:11], 'expected': word, 'kind': 'known',
                        'split': 'support', 'member': members[row['uid']]})
    complete = []
    with ThreadPoolExecutor(max_workers=3) as pool:
        for future in as_completed([pool.submit(fetch, record, publisher) for record in records]):
            complete.append(future.result())
            print(f'SUPPORT_DOWNLOADED {len(complete)}/{len(records)}', flush=True)
    (CACHE / 'candidate-benchmark/support-manifest.json').write_text(json.dumps({**manifest,
        'purpose': 'Labelled training prototypes; no source-video overlap with benchmark queries', 'records': complete}, indent=2))
    print('SUPPORT_DOWNLOAD_COMPLETE', flush=True)


if __name__ == '__main__':
    main()
