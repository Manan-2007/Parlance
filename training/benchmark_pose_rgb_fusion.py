"""Fit prototype fusion/rejection on development only; score fixed challenge."""
import json
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np
from training.benchmark_rgb_prototypes import PublisherFeatureReader, normalize
from training.benchmark_local_candidates import summarize
from training.pose_templates import template_features, mirror_tracks, dtw_distance
from training.train_continuous import save_json

CACHE = ROOT / '.research-cache'


def load_pose(record, mirror=False):
    with np.load(record['featureFile']) as data:
        points, scores, aspect = data['keypoints'], data['confidences'], float(data['aspect'])
    if mirror:
        points, scores = mirror_tracks(points, scores)
    return template_features(points, scores, aspect)


def calibrate(raw, records):
    lookup = {record['id']: record for record in records}
    dev = [prediction for prediction in raw if lookup[prediction['id']]['split'] == 'development']
    observed = sorted({prediction['score'] for prediction in dev})
    threshold_values = [-1.0] + observed + [max(observed, default=0) + 1]
    best = {'f1': -1}
    for threshold in threshold_values:
        tp = fp = fn = 0
        for prediction in dev:
            record = lookup[prediction['id']]
            accepted = prediction['score'] >= threshold
            correct = record['kind'] == 'known' and prediction['prediction'] == record['expected']
            tp += bool(accepted and correct)
            fp += bool(accepted and not correct)
            fn += bool(record['kind'] == 'known' and not (accepted and correct))
        f1 = 2 * tp / max(2 * tp + fp + fn, 1)
        if f1 > best['f1']:
            best = {'f1': f1, 'threshold': float(threshold)}
    return best


def main():
    manifest = json.loads((CACHE / 'candidate-benchmark/features-manifest.json').read_text())
    support_manifest = json.loads((CACHE / 'candidate-benchmark/support-features-manifest.json').read_text())
    support = sorted(support_manifest['records'], key=lambda record: record['expected'])
    if {record['sourceVideo'] for record in support} & {record['sourceVideo'] for record in manifest['records']}:
        raise ValueError('Prototype/query source overlap')
    poses = [load_pose(record) for record in support]
    labels = [record['expected'] for record in support]
    with (CACHE / 'CISLR/I3D_features.pkl').open('rb') as file:
        frame = PublisherFeatureReader(file).load()
    rgb = {uid: np.asarray(value, dtype=np.float32).reshape(1024, -1).mean(axis=1)
           for uid, value in zip(frame['id'], frame['I3D_features'])}
    rgb_support = np.asarray([rgb[record['uid']] for record in support])
    center = rgb_support.mean(axis=0)
    rgb_support = normalize(rgb_support - center)
    matrices = []
    for index, record in enumerate(manifest['records'], 1):
        started = time.perf_counter()
        pose = load_pose(record)
        mirrored = load_pose(record, mirror=True)
        distances = np.asarray([min(dtw_distance(pose, prototype), dtw_distance(mirrored, prototype)) for prototype in poses])
        similarity = rgb_support @ normalize((rgb[record['uid']] - center)[None])[0]
        rgb_distance = 1 - similarity
        matrices.append({'id': record['id'], 'pose': distances, 'rgb': rgb_distance,
                         'milliseconds': (time.perf_counter() - started) * 1000})
        if index % 10 == 0:
            print(f'FUSION_FEATURES {index}/{len(manifest["records"])}', flush=True)
    results = {}
    selected, selected_f1 = None, -1
    for weight in [0, .25, .5, .75, 1]:
        predictions = []
        for matrix in matrices:
            pose, visual = matrix['pose'], matrix['rgb']
            pose = (pose - pose.min()) / max(float(np.percentile(pose, 90) - pose.min()), 1e-8)
            visual = (visual - visual.min()) / max(float(np.percentile(visual, 90) - visual.min()), 1e-8)
            fused = weight * pose + (1 - weight) * visual
            order = np.argsort(fused)
            predictions.append({'id': matrix['id'], 'prediction': labels[int(order[0])],
                'rawPrediction': labels[int(order[0])], 'score': float(fused[order[1]] - fused[order[0]]),
                'clipInferenceMs': matrix['milliseconds']})
        calibration = calibrate(predictions, manifest['records'])
        calibrated = [{**prediction, 'prediction': prediction['prediction'] if prediction['score'] >= calibration['threshold'] else 'UNKNOWN'} for prediction in predictions]
        name = f'pose_weight_{weight}'
        results[name] = {'calibration': calibration, 'metrics': summarize(manifest['records'], calibrated),
                         'predictions': calibrated, 'unfilteredMetrics': summarize(manifest['records'], predictions)}
        if calibration['f1'] > selected_f1:
            selected, selected_f1 = name, calibration['f1']
    report = {'selectedUsing': 'Development F1 only', 'selected': selected, 'supportClips': len(support),
        'querySourceOverlap': 0, 'candidates': results,
        'limitations': ['Small external development comparison; signer independence is unverified.',
          'Mirrored pose comparison is an experimental assumption for this limited lexical vocabulary.',
          'Timing excludes video tracking and RGB feature extraction.', 'No candidate is automatically deployed.']}
    save_json(CACHE / 'candidate-benchmark/fusion-results.json', report)
    save_json(CACHE / 'candidate-benchmark/prototype-model-config.json', {'schema': 'pose-rgb-template-v1',
        'labels': labels, 'poseWeight': float(selected.removeprefix('pose_weight_')),
        'threshold': results[selected]['calibration']['threshold'], 'supportUids': [record['uid'] for record in support],
        'status': 'Research candidate; not approved for deployment'})
    print('FUSION_BENCHMARK_COMPLETE', json.dumps({'selected': selected, 'metrics': results[selected]['metrics']}), flush=True)


if __name__ == '__main__':
    main()
