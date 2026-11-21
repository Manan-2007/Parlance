"""Track the same external clips for every local candidate; retain vision frames."""
from concurrent.futures import ProcessPoolExecutor, as_completed
import argparse
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('MPLCONFIGDIR', str(CACHE / 'matplotlib'))

import cv2
import numpy as np
from training.features import holistic_frame, normalize_frame, forest_frame, FEATURE_VERSION


def extract(record):
    output = CACHE / 'candidate-benchmark/features' / f'{record["id"]}.npz'
    images = CACHE / 'candidate-benchmark/frames' / record['id']
    output.parent.mkdir(parents=True, exist_ok=True)
    images.mkdir(parents=True, exist_ok=True)
    if output.exists():
        with np.load(output) as data:
            if str(data['schema']) == FEATURE_VERSION:
                return {**record, 'featureFile': str(output), 'visionFrames': [str(p) for p in sorted(images.glob('*.jpg'))]}
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    capture = cv2.VideoCapture(record['video'])
    native_fps = capture.get(cv2.CAP_PROP_FPS)
    total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if native_fps <= 0 or total < 5:
        capture.release()
        raise ValueError('Invalid benchmark video timing')
    # Whole-clip classification benchmark, not a claim of streaming latency.
    indices = np.linspace(0, total - 1, min(total, max(8, round(total / native_fps * 15)))).round().astype(int)
    indices = np.unique(indices)
    vision_indices = set(np.linspace(0, len(indices) - 1, min(8, len(indices))).round().astype(int))
    options = vision.HolisticLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(CACHE / 'holistic_landmarker.task')),
        running_mode=vision.RunningMode.VIDEO, min_face_detection_confidence=.3,
        min_pose_detection_confidence=.3, min_hand_landmarks_confidence=.3)
    raw_tracks, confidences, features, legacy, timestamps = [], [], [], [], []
    wanted = {int(value): index for index, value in enumerate(indices)}
    with vision.HolisticLandmarker.create_from_options(options) as detector:
        for source_index in range(total):
            ok, image = capture.read()
            if not ok:
                break
            if source_index not in wanted:
                continue
            slot = wanted[source_index]
            height, width = image.shape[:2]
            if width > 640:
                image = cv2.resize(image, (640, round(height * 640 / width)))
            if slot in vision_indices:
                cv2.imwrite(str(images / f'{slot:04}.jpg'), image)
            timestamp = round(source_index * 1000 / native_fps)
            result = detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,
                       data=cv2.cvtColor(image, cv2.COLOR_BGR2RGB)), timestamp)
            raw = holistic_frame(result)
            points = np.zeros((75, 3), dtype=np.float32)
            scores = np.zeros(75, dtype=np.float32)
            for start, landmarks in ((0, result.pose_landmarks), (33, result.left_hand_landmarks), (54, result.right_hand_landmarks)):
                for j, point in enumerate(landmarks):
                    points[start + j] = (point.x, point.y, point.z)
                    scores[start + j] = point.visibility if start == 0 and point.visibility is not None else 1
            raw_tracks.append(points)
            confidences.append(scores)
            features.append(normalize_frame(raw, width / height))
            legacy.append(forest_frame(result))
            timestamps.append(timestamp)
    capture.release()
    if len(features) < 5:
        raise ValueError('Insufficient decoded benchmark frames')
    temporary = output.with_suffix('.partial')
    with temporary.open('wb') as file:
        np.savez_compressed(file, keypoints=np.asarray(raw_tracks), confidences=np.asarray(confidences),
            features=np.asarray(features), forest=np.asarray(legacy), timestampsMs=np.asarray(timestamps),
            nativeFps=native_fps, aspect=width / height, schema=FEATURE_VERSION)
    temporary.replace(output)
    return {**record, 'featureFile': str(output), 'visionFrames': [str(p) for p in sorted(images.glob('*.jpg'))]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--support', action='store_true')
    args = parser.parse_args()
    path = CACHE / 'candidate-benchmark' / ('support-manifest.json' if args.support else 'manifest.json')
    manifest = json.loads(path.read_text())
    records = []
    print(f'BENCHMARK_EXTRACTION_STARTED clips={len(manifest["records"])}', flush=True)
    with ProcessPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(extract, record) for record in manifest['records']]
        for future in as_completed(futures):
            records.append(future.result())
            print(f'BENCHMARK_EXTRACTED {len(records)}/{len(futures)}', flush=True)
    records.sort(key=lambda record: record['id'])
    (path.parent / ('support-features-manifest.json' if args.support else 'features-manifest.json')).write_text(json.dumps({**manifest, 'records': records}, indent=2))
    print('BENCHMARK_EXTRACTION_COMPLETE', flush=True)


if __name__ == '__main__':
    main()
