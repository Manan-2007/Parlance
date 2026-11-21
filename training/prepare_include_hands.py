"""INCLUDE (AI4Bharat, CC BY 4.0) hand tracks in the ISL500 track format.

Reads the publisher pose pickles inside `.research-cache/INCLUDE.zip` and writes
`.research-cache/include-hands/{tracks.npy,index.json}`: float16 (T, 2, 21, 3)
hand points in normalized image coordinates, like ISL500. MediaPipe's relative
hand depth is kept; relative to hand size it runs about 1.4x ISL500's, which
training covers with a random depth scale.

INCLUDE pickles store x*height and y*width (verified in training/features.py,
`include_frames`); that is undone here. Labels keep INCLUDE's words, keyed the
same way as the recognizer (`gloss_key`: lowercase, spaces removed).

INCLUDE publishes no signer ids, so its official train/test split is clip-level.

  python3 -m training.prepare_include_hands
"""
import csv
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

import numpy as np

from training.prepare_include import ArrayReader

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
OUT = CACHE / 'include-hands'
MIN_CONFIDENCE = 0.4


def hands_from(sample):
    height, width = sample['vid_shape'][:2]
    points = np.asarray(sample['keypoints'], dtype=np.float32).copy()       # (T, 75, 2|3)
    scores = np.asarray(sample['confidences'], dtype=np.float32)            # (T, 75)
    points[..., 0] /= height
    points[..., 1] /= width
    out = np.zeros((len(points), 2, 21, 3), dtype=np.float32)
    for slot, start in enumerate((33, 54)):
        xy = points[:, start:start + 21, :2]
        z = points[:, start:start + 21, 2] if points.shape[-1] > 2 else np.zeros(xy.shape[:2], np.float32)
        ok = (scores[:, start:start + 21] >= MIN_CONFIDENCE).sum(1) >= 15     # whole-hand presence
        ok &= np.isfinite(xy).all((1, 2)) & (xy > 0).all((1, 2))
        out[ok, slot, :, :2] = xy[ok]
        out[ok, slot, :, 2] = z[ok] - z[ok][:, :1]
    return out


def main():
    OUT.mkdir(exist_ok=True)
    with zipfile.ZipFile(CACHE / 'INCLUDE.zip') as outer:
        archive = zipfile.ZipFile(io.BytesIO(outer.read('INCLUDE/Pose_Signs.zip')))
    available = set(archive.namelist())
    tracks, records, offset = [], [], 0
    for split in ('train', 'test'):
        with (CACHE / 'openhands/Train_Test_Split' / f'{split}_include.csv').open() as file:
            for row in csv.DictReader(file):
                member = 'Pose_Signs/' + str(Path(row['FilePath']).with_suffix('.pkl'))
                if member not in available:
                    continue
                hands = hands_from(ArrayReader(io.BytesIO(archive.read(member))).load())
                present = (hands != 0).any((1, 2, 3))
                if present.sum() < 5:
                    continue
                first, last = np.flatnonzero(present)[[0, -1]]
                hands = hands[first:last + 1]
                label = re.sub(r'^\d+\.\s*', '', Path(row['FilePath']).parts[1]).strip()
                records.append({'id': hashlib.sha256(member.encode()).hexdigest()[:16], 'label': label,
                                'key': re.sub(r'[\s_]+', '', label.lower()), 'split': split,
                                'offset': offset, 'length': len(hands), 'member': member})
                tracks.append(hands.astype(np.float16))
                offset += len(hands)
    np.save(OUT / 'tracks.npy', np.concatenate(tracks))
    (OUT / 'index.json').write_text(json.dumps({
        'source': 'https://zenodo.org/records/6674324', 'license': 'CC-BY-4.0',
        'format': '(T, 2, 21, 3) normalized image xy, MediaPipe relative z', 'records': records}, indent=0))
    print(json.dumps({'clips': len(records), 'labels': len({r['key'] for r in records}), 'frames': offset}))


if __name__ == '__main__':
    main()
