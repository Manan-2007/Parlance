"""Compare frozen candidates on a declared external vocabulary, without tuning."""
import argparse
import csv
import io
import json
from pathlib import Path
import random
import sys
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from training.openhands_candidate import OpenHandsCandidate, normalize_tracks, word_key
from training.prepare_include import ArrayReader
from training.network import IsolatedPretrainingModel
from training.pretrain import resample
from training.train_continuous import save_json
from backend.model import TemporalForest
from backend.recognition import RecognitionSession

import numpy as np
import torch

CACHE = ROOT / '.research-cache'


def summarize(records, predictions):
    by_id = {prediction['id']: prediction for prediction in predictions}
    output = {}
    for split in ['development', 'challenge']:
        group = [record for record in records if record['split'] == split]
        known = [record for record in group if record['kind'] == 'known']
        unknown = [record for record in group if record['kind'] == 'unknown']
        correct = sum(by_id[r['id']]['prediction'] == r['expected'] for r in known)
        accepted = sum(by_id[r['id']]['prediction'] != 'UNKNOWN' for r in group)
        rejected_unknown = sum(by_id[r['id']]['prediction'] == 'UNKNOWN' for r in unknown)
        output[split] = {'knownClips': len(known), 'knownClasses': len({r['expected'] for r in known}),
            'unknownClips': len(unknown), 'correctKnown': correct,
            'knownAccuracy': correct / len(known) if known else None,
            'acceptedPrecision': correct / accepted if accepted else None,
            'acceptedCount': accepted,
            'unknownRejection': rejected_unknown / len(unknown) if unknown else None,
            'medianClipInferenceMs': float(np.median([by_id[r['id']]['clipInferenceMs'] for r in group])) if group else None}
    return output


def source_sanity(model):
    with (CACHE / 'openhands/Train_Test_Split/test_include.csv').open() as file:
        rows = list(csv.DictReader(file))
    random.Random(73).shuffle(rows)
    correct = total = 0
    with zipfile.ZipFile(CACHE / 'INCLUDE.zip') as outer:
        with zipfile.ZipFile(io.BytesIO(outer.read('INCLUDE/Pose_Signs.zip'))) as archive:
            for row in rows:
                member = 'Pose_Signs/' + str(Path(row['FilePath']).with_suffix('.pkl'))
                if member not in archive.namelist():
                    continue
                sample = ArrayReader(io.BytesIO(archive.read(member))).load()
                label = model.source_label_index[(word_key(row['Category']), word_key(__import__('re').sub(r'^\d+\.\s*', '', row['Word'])))]
                with torch.inference_mode():
                    prediction = int(model(normalize_tracks(sample['keypoints'])).argmax())
                correct += prediction == label
                total += 1
                if total == 24:
                    break
    return {'clips': total, 'correct': correct, 'accuracy': correct / total,
            'purpose': 'Publisher source-domain adapter sanity check, not external accuracy'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--openhands-source', default='/private/tmp/parlance-openhands-reference')
    args = parser.parse_args()
    torch.set_num_threads(4)
    manifest = json.loads((CACHE / 'candidate-benchmark/features-manifest.json').read_text())
    vocabulary = {word_key(word): word for word in manifest['vocabulary']}
    graph = OpenHandsCandidate(args.openhands_source)
    sanity = source_sanity(graph)
    print('PUBLISHER_SANITY', json.dumps(sanity), flush=True)
    if sanity['accuracy'] < .5:
        raise ValueError('Publisher adapter failed its source-domain sanity gate')
    source_checkpoint = torch.load(CACHE / 'tcn-pretrain/best.pt', map_location='cpu', weights_only=True)
    tcn = IsolatedPretrainingModel(len(source_checkpoint['labels']))
    tcn.load_state_dict(source_checkpoint['state_dict'])
    tcn.eval()
    forest = TemporalForest(ROOT / 'backend/models')
    results = {'openhands_sl_gcn': [], 'isolated_tcn': [], 'current_forest_pilot_gate': []}
    for index, record in enumerate(manifest['records'], 1):
        with np.load(record['featureFile']) as data:
            keypoints, aspect = data['keypoints'], float(data['aspect'])
            features, vectors, timestamps = data['features'], data['forest'], data['timestampsMs']
        started = time.perf_counter()
        with torch.inference_mode():
            probabilities = graph(normalize_tracks(keypoints, aspect=aspect)).softmax(-1)[0]
        winner = int(probabilities.argmax())
        raw = graph.labels[winner]
        results['openhands_sl_gcn'].append({'id': record['id'], 'rawPrediction': raw,
            'prediction': vocabulary.get(word_key(raw), 'UNKNOWN'), 'confidence': float(probabilities[winner]),
            'clipInferenceMs': (time.perf_counter() - started) * 1000})
        started = time.perf_counter()
        # INCLUDE has no facial landmarks in the classifier's training inputs.
        features = features.copy()
        features[:, 99:159] = 0
        frames = torch.from_numpy(resample(features, np.linspace(0, len(features) - 1, 64))).unsqueeze(0)
        with torch.inference_mode():
            probabilities = tcn(frames).softmax(-1)[0]
        winner = int(probabilities.argmax())
        raw = source_checkpoint['labels'][winner]
        results['isolated_tcn'].append({'id': record['id'], 'rawPrediction': raw,
            'prediction': vocabulary.get(word_key(raw), 'UNKNOWN'), 'confidence': float(probabilities[winner]),
            'clipInferenceMs': (time.perf_counter() - started) * 1000})
        started = time.perf_counter()
        session = RecognitionSession(forest)
        emitted = []
        for vector, timestamp in zip(vectors, timestamps):
            response = session.feed(vector.tolist(), int(timestamp))
            if 'word' in response:
                emitted.append(response)
        for offset in [100, 300, 500]:
            response = session.feed([0] * 141, int(timestamps[-1]) + offset)
            if 'word' in response:
                emitted.append(response)
        raw = emitted[0]['word'] if len(emitted) == 1 else ''
        results['current_forest_pilot_gate'].append({'id': record['id'], 'rawPrediction': raw,
            'prediction': vocabulary.get(word_key(raw), 'UNKNOWN'), 'emittedWords': [item['word'] for item in emitted],
            'confidence': emitted[0]['confidence'] if emitted else None,
            'clipInferenceMs': (time.perf_counter() - started) * 1000})
        if index % 10 == 0:
            print(f'LOCAL_BENCHMARK {index}/{len(manifest["records"])}', flush=True)
    report = {'benchmark': 'CISLR external development comparison, restricted to declared 30-word inventory',
        'sourceSanity': sanity, 'openhandsProvenance': graph.provenance,
        'frozenCandidates': True, 'thresholdsTunedOnChallenge': False,
        'limitations': ['Source-video separation is not verified signer independence.',
          'Publisher labels are not independently reviewed.',
          'Clip inference timing excludes video duration and tracking; it is not live latency.',
          'Out-of-inventory classifier outputs are mapped to UNKNOWN for this bounded pilot simulation.'],
        'candidates': {name: {'metrics': summarize(manifest['records'], predictions), 'predictions': predictions}
                       for name, predictions in results.items()}}
    save_json(CACHE / 'candidate-benchmark/local-results.json', report)
    print('LOCAL_BENCHMARK_COMPLETE', json.dumps({name: value['metrics'] for name, value in report['candidates'].items()}), flush=True)


if __name__ == '__main__':
    main()
