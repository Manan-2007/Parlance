"""Frozen RGB features + labelled dictionary prototypes, with no query leakage."""
import csv
import json
from pathlib import Path
import pickle
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np
import pandas as pd
from training.benchmark_local_candidates import summarize
from training.train_continuous import save_json

CACHE = ROOT / '.research-cache'


class PublisherFeatureReader(pd.compat.pickle_compat.Unpickler):
    """Only permit the numeric DataFrame types present in the publisher export."""
    ALLOWED = {('pandas.core.frame', 'DataFrame'), ('pandas.core.internals.managers', 'BlockManager'),
        ('functools', 'partial'), ('pandas.core.internals.blocks', 'new_block'),
        ('pandas._libs.internals', '_unpickle_block'), ('numpy.core.multiarray', '_reconstruct'),
        ('numpy._core.multiarray', '_reconstruct'), ('numpy', 'ndarray'), ('numpy', 'dtype'),
        ('builtins', 'slice'), ('pandas.core.indexes.base', '_new_Index'),
        ('pandas.core.indexes.base', 'Index'), ('pandas.core.indexes.range', 'RangeIndex'),
        ('pandas.core.indexes.numeric', 'Int64Index')}

    def find_class(self, module, name):
        if (module, name) not in self.ALLOWED:
            raise pickle.UnpicklingError(f'Unapproved numeric-export type {module}.{name}')
        return super().find_class(module, name)


def normalize(vectors):
    return vectors / np.maximum(np.linalg.norm(vectors, axis=-1, keepdims=True), 1e-8)


def main():
    manifest = json.loads((CACHE / 'candidate-benchmark/features-manifest.json').read_text())
    with (CACHE / 'CISLR/prototype.csv').open() as file:
        support = list(csv.DictReader(file))
    query_ids = {record['uid'] for record in manifest['records']}
    query_sources = {record['sourceVideo'] for record in manifest['records']}
    support = [record for record in support if record['uid'] not in query_ids and record['uid'][:11] not in query_sources]
    with (CACHE / 'CISLR/I3D_features.pkl').open('rb') as file:
        frame = PublisherFeatureReader(file).load()
    features = {identifier: np.asarray(value, dtype=np.float32).reshape(1024, -1).mean(axis=1)
                for identifier, value in zip(frame['id'], frame['I3D_features'])}
    if len(features) != len(frame) or any(not np.isfinite(value).all() for value in features.values()):
        raise ValueError('Invalid or duplicated publisher RGB features')
    support = [record for record in support if record['uid'] in features]
    support_vectors = np.asarray([features[record['uid']] for record in support])
    support_labels = [record['gloss'].lower() for record in support]
    mean = support_vectors.mean(axis=0)
    vocabulary = set(manifest['vocabulary'])
    restricted = [index for index, label in enumerate(support_labels) if label in vocabulary]
    if {support_labels[index] for index in restricted} != vocabulary:
        raise ValueError('Missing labelled prototype for a pilot word')
    methods = {}
    for centered in [False, True]:
        offset = mean if centered else 0
        vectors = normalize(support_vectors - offset)
        for scope in ['full_dictionary', 'pilot_inventory']:
            name = f'i3d_{"centered" if centered else "raw"}_{scope}'
            indices = np.asarray(restricted if scope == 'pilot_inventory' else np.arange(len(support)))
            predictions = []
            for record in manifest['records']:
                started = time.perf_counter()
                scores = vectors[indices] @ normalize((features[record['uid']] - offset)[None])[0]
                order = np.argsort(scores)[::-1]
                winner = int(indices[order[0]])
                raw = support_labels[winner]
                predictions.append({'id': record['id'], 'rawPrediction': raw,
                    'prediction': raw if raw in vocabulary else 'UNKNOWN', 'similarity': float(scores[order[0]]),
                    'margin': float(scores[order[0]] - scores[order[1]]),
                    'prototypeUid': support[winner]['uid'], 'clipInferenceMs': (time.perf_counter() - started) * 1000})
            methods[name] = {'metrics': summarize(manifest['records'], predictions), 'predictions': predictions}
    # Calibrate rejection using development examples only; challenge labels are
    # never inspected by the threshold selection routine.
    base = methods['i3d_centered_pilot_inventory']['predictions']
    records = {record['id']: record for record in manifest['records']}
    dev = [prediction for prediction in base if records[prediction['id']]['split'] == 'development']
    score_thresholds = [-1.01] + sorted({prediction['similarity'] for prediction in dev}) + [1.01]
    margin_thresholds = [-1] + sorted({prediction['margin'] for prediction in dev})
    best = (-1, 0, 0)
    for score in score_thresholds:
        for margin in margin_thresholds:
            tp = fp = fn = 0
            for prediction in dev:
                record = records[prediction['id']]
                accepted = prediction['similarity'] >= score and prediction['margin'] >= margin
                correct = record['kind'] == 'known' and prediction['prediction'] == record['expected']
                tp += accepted and correct
                fp += accepted and not correct
                fn += record['kind'] == 'known' and not (accepted and correct)
            f1 = 2 * tp / max(2 * tp + fp + fn, 1)
            if f1 > best[0]:
                best = (f1, score, margin)
    calibrated = [{**prediction, 'prediction': prediction['prediction'] if prediction['similarity'] >= best[1] and prediction['margin'] >= best[2] else 'UNKNOWN'} for prediction in base]
    methods['i3d_centered_pilot_calibrated'] = {'metrics': summarize(manifest['records'], calibrated),
        'predictions': calibrated, 'developmentThresholds': {'similarity': best[1], 'margin': best[2], 'f1': best[0]}}
    report = {'candidateType': 'Frozen publisher RGB I3D features + labelled CISLR prototypes',
        'supportClips': len(support), 'sourceOverlapWithQuery': 0, 'queryUidOverlap': 0,
        'methods': methods, 'limitations': ['One labelled prototype per dictionary item; not a trained live recognizer.',
          'Feature extraction time is excluded from retrieval timing.', 'Signer independence remains unverified.',
          'Pilot-inventory variants have only 30 possible outputs; full-dictionary variants search the publisher prototype set.']}
    save_json(CACHE / 'candidate-benchmark/rgb-results.json', report)
    print(json.dumps({name: result['metrics'] for name, result in methods.items()}), flush=True)


if __name__ == '__main__':
    main()
