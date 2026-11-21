"""Prepare verified INCLUDE poses for supervised temporal-encoder pretraining."""
import csv
import hashlib
import io
import json
from pathlib import Path
import pickle
import re
import sys
import zipfile

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.features import include_frames, FEATURE_VERSION, INCLUDE_ADAPTER_VERSION

CACHE = ROOT / '.research-cache'


class ArrayReader(pickle.Unpickler):
    def find_class(self, module, name):
        if module in ('numpy.core.multiarray', 'numpy._core.multiarray') and name == '_reconstruct':
            return np._core.multiarray._reconstruct
        if module == 'numpy' and name in ('ndarray', 'dtype'):
            return getattr(np, name)
        raise pickle.UnpicklingError(f'Unsupported dataset object {module}.{name}')


def main():
    with zipfile.ZipFile(CACHE / 'INCLUDE.zip') as outer:
        pose_archive = zipfile.ZipFile(io.BytesIO(outer.read('INCLUDE/Pose_Signs.zip')))
    output = CACHE / 'include-features'
    output.mkdir(exist_ok=True)
    available = set(pose_archive.namelist())
    records, missing = [], []
    for split in ('train', 'test'):
        source = CACHE / 'openhands/Train_Test_Split' / f'{split}_include.csv'
        with source.open() as file:
            for row in csv.DictReader(file):
                member = 'Pose_Signs/' + str(Path(row['FilePath']).with_suffix('.pkl'))
                if member not in available:
                    missing.append(member)
                    continue
                payload = pose_archive.read(member)
                digest = hashlib.sha256(payload).hexdigest()
                sample = ArrayReader(io.BytesIO(payload)).load()
                identifier = hashlib.sha256(member.encode()).hexdigest()[:16]
                target = output / f'{identifier}.npz'
                rebuild = not target.exists()
                if not rebuild:
                    with np.load(target) as cached:
                        rebuild = 'sourceAdapter' not in cached or str(cached['sourceAdapter']) != INCLUDE_ADAPTER_VERSION
                if rebuild:
                    values = include_frames(sample['keypoints'], sample['confidences'], sample['vid_shape'])
                    np.savez_compressed(target, features=values, schema=FEATURE_VERSION, sourceAdapter=INCLUDE_ADAPTER_VERSION)
                # The CSV's Word column drops spaces in training labels only.
                # The shared archive folder is consistent across both splits.
                folder = Path(row['FilePath']).parts[1]
                label = re.sub(r'^\d+\.\s*', '', folder).strip().upper()
                records.append({'id': identifier, 'label': label, 'split': split, 'member': member, 'sha256': digest})
    # Exact duplicate tracks from the official test split cannot enter training.
    test_hashes = {record['sha256'] for record in records if record['split'] == 'test'}
    before = len(records)
    records = [record for record in records if record['split'] == 'test' or record['sha256'] not in test_hashes]
    removed = before - len(records)
    by_label = {}
    for record in records:
        if record['split'] == 'train':
            by_label.setdefault(record['label'], []).append(record)
    for own in by_label.values():
        own.sort(key=lambda record: record['sha256'])
        for record in own[:max(1, len(own) // 8)]:
            record['split'] = 'validation'
    manifest = {'source': 'https://zenodo.org/records/6674324', 'license': 'CC-BY-4.0',
                'schema': FEATURE_VERSION,
                'sourceAdapter': INCLUDE_ADAPTER_VERSION,
                'splitPolicy': 'Official clip-level test split. Validation is selected within official training data. Signer IDs are unavailable in this metadata.',
                'removedTrainTestDuplicates': removed, 'missing': missing, 'records': records}
    (CACHE / 'include-manifest.json').write_text(json.dumps(manifest, indent=2))
    print('INCLUDE features ready', len(records), 'clips', len(by_label), 'classes',
          'missing', len(missing), 'cross-split duplicates removed', removed, flush=True)


if __name__ == '__main__':
    main()
