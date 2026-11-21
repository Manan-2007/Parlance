"""Check one publisher pose/video pair before changing coordinate adapters."""
import io
import json
import os
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('MPLCONFIGDIR', str(CACHE / 'matplotlib'))

import cv2
import numpy as np
from training.archive import HTTPRangeReader, read_indexed_member
from training.prepare_include import ArrayReader


def main():
    publisher = json.loads((CACHE / 'include-rgb-publisher.json').read_text())
    file = next(item for item in publisher['files'] if item['key'] == 'Adjectives_3of8.zip')
    reader = HTTPRangeReader(file['links']['self'], file['size'])
    with zipfile.ZipFile(reader) as source:
        entries = source.infolist()
    directory = CACHE / 'coordinate-check'
    directory.mkdir(exist_ok=True)
    with zipfile.ZipFile(CACHE / 'INCLUDE.zip') as outer:
        with zipfile.ZipFile(io.BytesIO(outer.read('INCLUDE/Pose_Signs.zip'))) as archive:
            poses = {Path(name).stem: name for name in archive.namelist() if name.endswith('.pkl')}
            info = next(info for info in entries if Path(info.filename).suffix.lower() in ['.mov', '.mp4'] and Path(info.filename).stem in poses)
            sample = ArrayReader(io.BytesIO(archive.read(poses[Path(info.filename).stem]))).load()
    print(f'MATCHED_SOURCE_VIDEO {Path(info.filename).name} bytes={info.file_size}', flush=True)
    target = directory / Path(info.filename).name
    if not target.exists():
        target.write_bytes(read_indexed_member(reader, {'name': info.filename, 'offset': info.header_offset,
            'size': info.file_size, 'compressed': info.compress_size, 'crc32': info.CRC}))
    capture = cv2.VideoCapture(str(target))
    native_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    middle = len(sample['keypoints']) // 2
    capture.set(cv2.CAP_PROP_POS_FRAMES, min(native_frames - 1, middle))
    ok, image = capture.read()
    capture.release()
    if not ok:
        raise ValueError('Unable to decode matching source video')
    height, width = image.shape[:2]
    cv2.imwrite(str(directory / 'source-frame.jpg'), image)
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    options = vision.HolisticLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(CACHE / 'holistic_landmarker.task')))
    with vision.HolisticLandmarker.create_from_options(options) as detector:
        result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(image, cv2.COLOR_BGR2RGB)))
    indices = [0, 11, 12, 13, 14]
    normalized = np.asarray([(result.pose_landmarks[i].x, result.pose_landmarks[i].y) for i in indices])
    stored = sample['keypoints'][middle, indices, :2]
    factors = (normalized * stored).sum(axis=0) / (normalized ** 2).sum(axis=0)
    candidates = {'xy_times_width_height': np.asarray([width, height]),
                  'xy_times_height_width': np.asarray([height, width]),
                  'xy_already_normalized': np.ones(2)}
    residuals = {name: float(np.sqrt(np.mean((stored / factors_one - normalized) ** 2))) for name, factors_one in candidates.items()}
    report = {'video': Path(info.filename).name, 'pose': poses[Path(info.filename).stem],
              'decodedWidth': width, 'decodedHeight': height, 'storedVidShape': list(sample['vid_shape']),
              'videoFrames': native_frames, 'poseFrames': len(sample['keypoints']),
              'estimatedXYMultipliers': factors.tolist(), 'normalizedCoordinateRMSE': residuals,
              'closestConvention': min(residuals, key=residuals.get),
              'limitation': 'New landmarker version; one source pair is a diagnostic, not a corpus-wide guarantee.'}
    (directory / 'report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
