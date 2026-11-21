"""Replay a local evaluation-recorder ZIP through the current recognizer.

No network or microphone. This offline Python tracking diagnostic approximates
the browser pipeline; it is not a measurement of browser end-to-end latency.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('MPLCONFIGDIR', str(CACHE / 'matplotlib'))

import cv2
import numpy as np
from backend.model import TemporalForest
from backend.recognition import RecognitionSession


def decoded_timing(timestamps):
    """Duration from presentation timestamps, including one final frame interval.

    Browser WebM often advertises its 1/1000 timebase as 1000 FPS. It must not
    turn a 20-second variable-frame-rate clip into a subsecond evaluation.
    """
    values = np.asarray(timestamps, dtype=np.float64)
    if values.ndim != 1 or len(values) < 2 or not np.isfinite(values).all():
        raise ValueError('Recording needs at least two finite frame timestamps')
    intervals = np.diff(values)
    if values[0] < 0 or np.any(intervals <= 0):
        raise ValueError('Recording timestamps must be nonnegative and strictly increasing')
    return {'durationSeconds': float((values[-1] - values[0] + np.median(intervals)) / 1000),
            'lastFrameIntervalMs': float(np.median(intervals))}


def evaluate_video(path, model):
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    capture = cv2.VideoCapture(str(path))
    reported_fps = capture.get(cv2.CAP_PROP_FPS)
    if not capture.isOpened():
        capture.release()
        raise ValueError('Recording cannot be opened')
    options = vision.HandLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(ROOT / 'public/models/hand_landmarker.task')),
        running_mode=vision.RunningMode.VIDEO, num_hands=2,
        min_hand_detection_confidence=.3, min_hand_presence_confidence=.3, min_tracking_confidence=.3)
    session, emissions, suggestion_events, infer_times = RecognitionSession(model), [], [], []
    suggestion_frames, last_suggestion_revision = 0, None
    source_frame, next_sample, tracked, observed = 0, 0, 0, 0
    timestamps = []
    def feed(vector, timestamp):
        nonlocal suggestion_frames, last_suggestion_revision
        result = session.feed(vector, timestamp)
        if result.get('suggestions'):
            suggestion_frames += 1
            if result.get('revision') != last_suggestion_revision:
                last_suggestion_revision = result.get('revision')
                suggestion_events.append({'timestampMs': timestamp, 'revision': result.get('revision'),
                    'candidate': result.get('candidate'), 'reason': result.get('reason'),
                    'suggestions': result['suggestions']})
        if 'word' in result:
            emissions.append({'word': result['word'], 'timestampMs': timestamp,
                              'confidence': result['confidence']})
    with vision.HandLandmarker.create_from_options(options) as detector:
        while True:
            ok, image = capture.read()
            if not ok:
                break
            source_timestamp = capture.get(cv2.CAP_PROP_POS_MSEC)
            if not np.isfinite(source_timestamp) or source_timestamp < 0 or timestamps and source_timestamp <= timestamps[-1]:
                capture.release()
                raise ValueError('Decoder did not provide increasing frame timestamps')
            timestamps.append(source_timestamp)
            timestamp = source_timestamp - timestamps[0]
            source_frame += 1
            if timestamp < next_sample:
                continue
            next_sample = (np.floor(timestamp / (1000 / 18)) + 1) * (1000 / 18)
            # Same 640px input ceiling as the browser's webcam processing.
            height, width = image.shape[:2]
            if width > 640:
                image = cv2.resize(image, (640, round(height * 640 / width)))
            started = time.perf_counter()
            result = detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,
                data=cv2.cvtColor(image, cv2.COLOR_BGR2RGB)), round(timestamp))
            infer_times.append((time.perf_counter() - started) * 1000)
            vector = np.zeros(141)
            # The backend reorders hands by raw wrist x independently per frame;
            # handedness identities and the preview smoother do not affect it.
            for slot, hand in enumerate(result.hand_landmarks):
                vector[slot * 63:(slot + 1) * 63] = np.asarray([(p.x, p.y, p.z) for p in hand]).reshape(-1)
            feed(vector, round(timestamp))
            tracked += 1
            observed += bool(result.hand_landmarks)
    capture.release()
    if not source_frame:
        raise ValueError('Recording contains no decodable frames')
    timing = decoded_timing(timestamps)
    duration = timing['durationSeconds']
    # Report any pending word at the end as an explicit synthetic release.
    feed(np.zeros(141), round(duration * 1000) + 250)
    return {'decodedDurationSeconds': duration, 'sourceFrames': source_frame, 'trackedFrames': tracked,
        'timingSource': 'Decoded frame presentation timestamps',
        'decoderReportedFps': reported_fps if np.isfinite(reported_fps) else None,
        'lastFrameIntervalEstimateMs': timing['lastFrameIntervalMs'],
        'framesWithHands': observed, 'emissions': emissions, 'emittedWords': len(emissions),
        'emittedWordsPerMinute': len(emissions) * 60 / duration,
        'framesWithSuggestions': suggestion_frames, 'suggestionUpdates': len(suggestion_events),
        'suggestionEvents': suggestion_events,
        'medianTrackerMs': float(np.median(infer_times)), 'syntheticFinalRelease': True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('recording_zip', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    model = TemporalForest(ROOT / 'backend/models')
    records = []
    with zipfile.ZipFile(args.recording_zip) as archive:
        info = archive.getinfo('manifest.json')
        if info.file_size > 1_000_000:
            raise ValueError('Recording manifest is too large')
        manifest = json.loads(archive.read(info))
        if manifest.get('schema') != 'parlance-camera-controls-v1' or not 1 <= len(manifest.get('recordings', [])) <= 5:
            raise ValueError('Unsupported recording bundle')
        for record in manifest['recordings']:
            name = record['filename']
            if Path(name).name != name or record.get('audio') is not False or record.get('label') != 'intended_non_signing':
                raise ValueError('Expected a local non-signing, video-only recording')
            info = archive.getinfo(name)
            if not 0 < info.file_size <= 500_000_000:
                raise ValueError('Recording size is unsupported')
            # No archive paths are extracted; only a generated temporary file.
            with tempfile.TemporaryDirectory(prefix='parlance-control-') as temporary:
                path = Path(temporary) / ('clip' + Path(name).suffix)
                path.write_bytes(archive.read(info))
                metrics = evaluate_video(path, model)
            records.append({'task': record['task'], 'stoppedEarly': record.get('stoppedEarly'), **metrics})
            print('CONTROL_EVALUATED ' + json.dumps(records[-1]), flush=True)
    duration = sum(r['decodedDurationSeconds'] for r in records)
    emitted = sum(r['emittedWords'] for r in records)
    report = {'purpose': 'Offline unwanted-insertion diagnostic', 'cameraFootageUploaded': False,
        'signAccuracyEstablished': False, 'inputSha256': hashlib.sha256(args.recording_zip.read_bytes()).hexdigest(),
        'totalDurationSeconds': duration, 'emittedWords': emitted, 'emittedWordsPerMinute': emitted * 60 / duration,
        'records': records, 'limitations': ['Activities are user-reported non-signing, not independently reviewed.',
            'Python Tasks tracker and offline sampling approximate the browser; browser performance is not measured.',
            'Source video timing from the decoder is used, not wall-clock processing time.',
            'A synthetic hand release is fed after the last source frame.',
            'No known-sign accuracy or confidence calibration can be established from these controls.']}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2))
    print('CONTROLS_COMPLETE', flush=True)


if __name__ == '__main__':
    main()
