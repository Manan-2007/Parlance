"""Extract continuous ISL features from the publisher's annotated frame groups.

Uses the source SIGN GLOSSES CSV. Train/validation/test groups are assigned
before feature extraction. Gaps and unmatched source labels are reported.
"""
import concurrent.futures
import csv
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import threading
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('MPLCONFIGDIR', str(CACHE / 'matplotlib'))

import cv2
import numpy as np
from training.archive import HTTPRangeReader, read_member
from training.features import holistic_frame, normalize_frame, forest_frame, FEATURE_VERSION

URL = 'https://data.mendeley.com/public-files/datasets/kcmpdxky7p/files/c14c8953-be53-4c7a-85d5-5bcd7e79d86e/file_downloaded'
SIZE = 8905822924
LOCAL = threading.local()


def canonical(value):
    return ' '.join(value.strip().lower().split())


def build_manifest():
    labels = {}
    annotation = CACHE / 'csltr-annotations' / 'ISL Corpus sign glosses.csv'
    with annotation.open() as source:
        for row in csv.DictReader(source):
            labels[canonical(row['Sentence'])] = row['SIGN GLOSSES'].strip().split()
    with zipfile.ZipFile(HTTPRangeReader(URL, SIZE)) as archive:
        entries = archive.infolist()
    groups = {}
    unmatched = set()
    for info in entries:
        parts = info.filename.split('/')
        if len(parts) != 5 or parts[1] != 'Frames_Sentence_Level' or not parts[-1].lower().endswith('.jpg'):
            continue
        sentence, variant = canonical(parts[2]), parts[3]
        if sentence == 'which collegeschool are you from':
            sentence = 'which college school are you from'
        if sentence not in labels:
            unmatched.add(sentence)
            continue
        groups.setdefault((sentence, variant), []).append(info)
    records = []
    for (sentence, variant), members in sorted(groups.items()):
        numbers = lambda info: int(re.findall(r'\d+', Path(info.filename).stem)[-1])
        members.sort(key=numbers)
        identifier = hashlib.sha256(f'{sentence}|{variant}'.encode()).hexdigest()[:16]
        split = 'test' if variant == '7' else 'validation' if variant == '6' else 'train'
        records.append({'id': identifier, 'sentence': sentence, 'variant': variant,
                        'glosses': labels[sentence], 'split': split, 'members': members})
    print(f'Manifest groups {len(records)}; unmatched sentence folders {sorted(unmatched)}', flush=True)
    return records


def fetch_frames(record):
    if not hasattr(LOCAL, 'reader'):
        LOCAL.reader = HTTPRangeReader(URL, SIZE)
    target = CACHE / 'csltr-images' / record['id']
    target.mkdir(parents=True, exist_ok=True)
    paths = []
    for index, info in enumerate(record['members']):
        path = target / f'{index:04}.jpg'
        if not path.exists() or path.stat().st_size != info.file_size:
            temporary = path.with_suffix('.partial')
            temporary.write_bytes(read_member(LOCAL.reader, info))
            temporary.replace(path)
        paths.append(str(path))
    return {**record, 'paths': paths, 'members': [member.filename for member in record['members']]}


def extract(record):
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    output = CACHE / 'csltr-features' / f'{record["id"]}.npz'
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.exists():
        with np.load(output) as existing:
            if 'forest' in existing:
                return record
    options = vision.HolisticLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(CACHE / 'holistic_landmarker.task')),
        running_mode=vision.RunningMode.VIDEO,
        min_face_detection_confidence=0.3,
        min_pose_detection_confidence=0.3,
        min_hand_landmarks_confidence=0.3,
    )
    features, observed, legacy = [], [], []
    with vision.HolisticLandmarker.create_from_options(options) as detector:
        for index, path in enumerate(record['paths']):
            image = cv2.imread(path)
            if image is None:
                raise ValueError(f'Unreadable source image {path}')
            height, width = image.shape[:2]
            if width > 640:
                image = cv2.resize(image, (640, max(1, round(height * 640 / width))))
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=image), index * 100)
            raw = holistic_frame(result)
            features.append(normalize_frame(raw, width / height))
            legacy.append(forest_frame(result))
            observed.append(float(np.count_nonzero(raw[53:, 2]) / 42))
    values = np.asarray(features, dtype=np.float32)
    np.savez_compressed(output, features=values, forest=np.asarray(legacy), hand_coverage=np.asarray(observed), schema=FEATURE_VERSION)
    return record


def main():
    records = build_manifest()
    manifest_path = CACHE / 'csltr-manifest.json'
    complete = []
    # Bound the CPU work queue while three download workers fetch source frames.
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as downloads, \
         concurrent.futures.ProcessPoolExecutor(max_workers=3) as processors:
        pending = set()
        for index, record in enumerate(downloads.map(fetch_frames, records)):
            pending.add(processors.submit(extract, record))
            if len(pending) >= 6:
                done, pending = concurrent.futures.wait(pending, return_when=concurrent.futures.FIRST_COMPLETED)
                for future in done:
                    complete.append(future.result())
            if index % 20 == 0:
                print(f'Downloaded {index + 1}/{len(records)} groups; extracted {len(complete)}', flush=True)
        for future in concurrent.futures.as_completed(pending):
            complete.append(future.result())
    complete.sort(key=lambda record: record['id'])
    manifest_path.write_text(json.dumps({'source': 'https://data.mendeley.com/datasets/kcmpdxky7p/1',
        'license': 'CC-BY-4.0', 'schema': FEATURE_VERSION,
        'splitPolicy': 'Publisher frame-folder variants 1-5 train, 6 validation, 7 test. Variant identity is publisher-reported.',
        'records': complete}, indent=2))
    print(f'Continuous features ready for {len(complete)} source sequences', flush=True)


if __name__ == '__main__':
    main()
