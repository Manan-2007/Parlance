"""Bounded external translation diagnostic for the public ISLiM checkpoint.

Imports only the inspected matching encoder, loads tensors strictly, and keeps
blank/reversed controls separate from real-input English translation metrics.
This is not the CSLTR gloss task and is never deployed automatically.
"""
from concurrent.futures import ProcessPoolExecutor, as_completed
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'
sys.path.insert(0, str(CACHE / 'python'))
sys.path.insert(0, str(ROOT))
os.environ.setdefault('MPLCONFIGDIR', str(CACHE / 'matplotlib'))

import numpy as np
import torch
from training.decoding import corpus_metrics

FACE = [61,146,91,181,84,17,314,405,321,375,291,409,270,95,88,178,87,14,78,308,
        33,133,160,158,153,144,145,246,362,263,387,385,380,373,374,249,
        107,66,105,63,70,336,296,334,293,300]
BODY = [11, 12, 13, 14, 23, 24]


def fill_and_normalize(raw):
    """Match the publisher's interpolation, float16 save, axis min/max and padding."""
    points = np.asarray(raw, dtype=np.float32).copy()
    if points.ndim != 3 or points.shape[1:] != (94, 4) or not len(points) or not np.isfinite(points).all():
        raise ValueError('Expected finite, nonempty T x 94 x 4 keypoints')
    for joint in range(94):
        valid = np.where(points[:, joint, 3] > .5)[0]
        if not len(valid):
            points[:, joint] = 0
            continue
        for first, last in zip(valid[:-1], valid[1:]):
            gap = last - first
            if 1 < gap <= 5:
                for step in range(1, gap):
                    ratio = step / gap
                    points[first + step, joint] = (1 - ratio) * points[first, joint] + ratio * points[last, joint]
        for frame in range(valid[0]):
            if points[frame, joint, 3] < .5:
                points[frame, joint] = points[valid[0], joint]
        for frame in range(valid[-1] + 1, len(points)):
            if points[frame, joint, 3] < .5:
                points[frame, joint] = points[valid[-1], joint]
    points[points[:, :, 3] < .5] = 0
    points = points.astype(np.float16).astype(np.float32)
    for axis in range(3):
        values = points[:, :, axis]
        low, span = values.min(), np.ptp(values)
        points[:, :, axis] = (values - low) / span if span > 1e-8 else values - low
    count = min(len(points), 128)
    if len(points) > 128:
        points = points[torch.linspace(0, len(points) - 1, 128).long().numpy()]
    else:
        points = np.pad(points, ((0, 128 - len(points)), (0, 0), (0, 0)))
    return points.transpose(2, 1, 0).copy(), count


def extract(record):
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import vision
    output = CACHE / 'islim-evaluation' / f'{record["id"]}.npz'
    if output.exists():
        return record
    options = vision.HolisticLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(CACHE / 'holistic_landmarker.task')),
        running_mode=vision.RunningMode.VIDEO, min_face_detection_confidence=.5,
        min_pose_detection_confidence=.5, min_hand_landmarks_confidence=.5)
    frames = []
    started = time.perf_counter()
    with vision.HolisticLandmarker.create_from_options(options) as detector:
        for index, path in enumerate(record['paths']):
            image = cv2.imread(path)
            if image is None:
                raise ValueError(f'Unreadable frame {path}')
            result = detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,
                data=cv2.cvtColor(image, cv2.COLOR_BGR2RGB)), index * 100)
            points = np.zeros((94, 4), dtype=np.float32)
            for start, landmarks, indices, kind in (
                (0, result.pose_landmarks, BODY, 'body'),
                (6, result.left_hand_landmarks, range(21), 'hand'),
                (27, result.right_hand_landmarks, range(21), 'hand'),
                (48, result.face_landmarks, FACE, 'face')):
                if not landmarks:
                    continue
                for offset, point_index in enumerate(indices):
                    point = landmarks[point_index]
                    confidence = (point.visibility if point.visibility is not None else 0) if kind == 'body' else (1 if kind == 'hand' or point.z > -.5 else .5)
                    points[start + offset] = (point.x, point.y, point.z, confidence)
            frames.append(points)
    raw = np.asarray(frames)
    if not np.any(raw[:, 6:48, 3]):
        raise ValueError('No observed hands; refusing a silent empty input')
    features, count = fill_and_normalize(raw)
    np.savez_compressed(output, features=features, count=count, raw=raw,
        extractionMs=(time.perf_counter() - started) * 1000)
    return record


def load_model():
    from transformers import T5Config, T5ForConditionalGeneration, T5Tokenizer
    source = CACHE / 'islim-model/mobile-source/encoder.py'
    if hashlib.sha256(source.read_bytes()).hexdigest() != '3b0a7ad79c3a21e7e39ba55b00df27f00a2e8b33f8b313355a3237cb9713cd29':
        raise ValueError('Publisher encoder differs from the inspected source')
    spec = importlib.util.spec_from_file_location('publisher_islim_encoder', source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    checkpoint = CACHE / 'islim-model/ISLiM_full_posestitch_pre_processed.pt'
    with torch.serialization.safe_globals([(np._core.multiarray.scalar, 'numpy.core.multiarray.scalar'), np.dtype, np.dtypes.Float64DType]):
        saved = torch.load(checkpoint, map_location='cpu', weights_only=True, mmap=True)
    tokenizer = T5Tokenizer.from_pretrained('google-t5/t5-small', cache_dir=str(CACHE / 'huggingface'))
    config = T5Config.from_pretrained('google-t5/t5-small', cache_dir=str(CACHE / 'huggingface'))
    config._attn_implementation = 'eager'
    model = torch.nn.Module()
    model.visual_encoder = module.KeypointToVideoEncoder({'max_frames': 128})
    model.t5 = T5ForConditionalGeneration(config)
    # No pretrained tensors may be skipped or replaced by random initialization.
    model.load_state_dict(saved['model_state_dict'], strict=True)
    model.eval()
    return model, tokenizer, hashlib.sha256(source.read_bytes()).hexdigest()


def main():
    output = CACHE / 'islim-evaluation'
    output.mkdir(exist_ok=True)
    manifest = json.loads((CACHE / 'csltr-manifest.json').read_text())
    # Predeclared deterministic diagnostic, not a tuned model-selection split.
    records = sorted((r for r in manifest['records'] if r['split'] == 'validation'), key=lambda r: r['id'])[:12]
    (output / 'plan.json').write_text(json.dumps({'records': records, 'selection': 'First 12 validation IDs in lexical order'}, indent=2))
    with ProcessPoolExecutor(max_workers=3) as pool:
        for index, future in enumerate(as_completed([pool.submit(extract, r) for r in records]), 1):
            future.result()
            print(f'ISLIM_FEATURES {index}/{len(records)}', flush=True)
    torch.set_num_threads(4)
    model, tokenizer, source_hash = load_model()
    print('ISLIM_STRICT_CHECKPOINT_LOAD_OK', flush=True)
    predictions = []
    # Matching publisher mobile decoder settings. CPU gives reproducible bounded
    # inference; no unverified MPS optimization or challenge-tuned generation.
    for record in records:
        with np.load(output / f'{record["id"]}.npz') as data:
            features, count = torch.from_numpy(data['features']).unsqueeze(0), int(data['count'])
        item = {'id': record['id'], 'reference': record['sentence'], 'frames': count}
        for control in ('real', 'zero', 'reversed'):
            values = features.clone()
            if control == 'zero':
                values.zero_()
            elif control == 'reversed':
                values[:, :, :, :count] = values[:, :, :, :count].flip(-1)
            started = time.perf_counter()
            with torch.inference_mode():
                embeddings = model.visual_encoder.get_sequence_output(values)
                tokens = model.t5.generate(inputs_embeds=embeddings, max_length=128, num_beams=4,
                    repetition_penalty=1.5, no_repeat_ngram_size=3, do_sample=False,
                    length_penalty=1.2, early_stopping=True)
            item[control] = {'text': tokenizer.batch_decode(tokens, skip_special_tokens=True)[0].lower(),
                             'inferenceMs': round((time.perf_counter() - started) * 1000)}
        predictions.append(item)
        print('ISLIM_PREDICTION ' + json.dumps(item), flush=True)
    tokenize = lambda s: re.findall(r"[a-z0-9']+", s.lower())
    report = {'candidate': 'Public ISLiM full PoseStitch checkpoint, matching legacy mobile encoder',
        'source': 'https://github.com/ahmedshoaib/ISLiM', 'encoderSourceSha256': source_hash,
        'strictCheckpointLoad': True, 'device': 'CPU 4 threads', 'predictions': predictions,
        'metrics': {kind: corpus_metrics([tokenize(r['reference']) for r in predictions],
                    [tokenize(r[kind]['text']) for r in predictions]) for kind in ('real', 'zero', 'reversed')},
        'limitations': ['12 external CSLTR validation sentence groups, not a representative acceptance test.',
            'English reference WER is not gloss WER or a complete translation quality metric.',
            'Uses MediaPipe Tasks Holistic 1.1.1 rather than publisher legacy Solutions Holistic.',
            'Supplied sparse JPG frames have no verified source timing; tracker uses synthetic 100 ms steps.',
            'Matching public mobile export uses unmasked 128-frame padding; retained here.',
            'Training overlap with source signers has not been independently established.']}
    (output / 'results.json').write_text(json.dumps(report, indent=2))
    print('ISLIM_COMPLETE ' + json.dumps(report['metrics']), flush=True)


if __name__ == '__main__':
    main()
