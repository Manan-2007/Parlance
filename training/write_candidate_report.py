"""Publish compact, credential-free results from completed local experiments."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.research-cache'


def read(path):
    return json.loads((CACHE / path).read_text())


def main():
    local = read('candidate-benchmark/local-results.json')
    rgb = read('candidate-benchmark/rgb-results.json')
    fusion = read('candidate-benchmark/fusion-results.json')
    azure = read('candidate-benchmark/azure-results.json')
    coordinate = read('coordinate-fix-experiment-results.json')
    islim = read('islim-evaluation/results.json')
    manifest = read('candidate-benchmark/manifest.json')
    controls_path = CACHE / 'user-controls-results.json'
    controls = json.loads(controls_path.read_text()) if controls_path.exists() else None
    observations_path = CACHE / 'user-controls-observations.json'
    observations = json.loads(observations_path.read_text()) if observations_path.exists() else None
    if not controls or not observations or observations.get('inputSha256') != controls.get('inputSha256'):
        observations = None
    baseline_path = CACHE / 'user-controls-retake-baseline.json'
    baseline = json.loads(baseline_path.read_text()) if baseline_path.exists() else None
    if not controls or not baseline or baseline.get('inputSha256') != controls.get('inputSha256'):
        baseline = None
    rows = []
    for label, value in local['candidates'].items():
        rows.append({'candidate': label, **value['metrics']['challenge'], 'timingScope': 'Classifier/recognizer only; tracking excluded'})
    for label, value in rgb['methods'].items():
        rows.append({'candidate': label, **value['metrics']['challenge'], 'timingScope': 'Prototype search only; video encoder excluded'})
    rows.append({'candidate': 'development_selected_pose_rgb_fusion', **fusion['candidates'][fusion['selected']]['metrics']['challenge'],
                 'timingScope': 'Prototype search only; tracking and RGB encoding excluded'})
    rows.append({'candidate': 'azure_8_frames', **azure['metrics'], 'timingScope': 'Remote request only; source clip collection excluded'})
    snapshot = {'status': 'No candidate accepted for deployment', 'knownChallengeClips': 15, 'unknownChallengeClips': 6,
        'source': manifest['dataset'], 'revision': manifest['revision'], 'signerIndependenceVerified': False,
        'candidates': rows, 'continuousValidation': coordinate, 'islimDiagnostic': {
            'metrics': islim['metrics'], 'strictCheckpointLoad': islim['strictCheckpointLoad'],
            'encoderSourceSha256': islim['encoderSourceSha256'], 'limitations': islim['limitations']},
        'webcamControls': ({'evaluation': 'Offline replay of user-provided non-signing controls',
            'durationSeconds': controls['totalDurationSeconds'], 'emittedWords': controls['emittedWords'],
            'emittedWordsPerMinute': controls['emittedWordsPerMinute'], 'knownSignAccuracyEstablished': False,
            'taskAudit': observations['tasks'] if observations else [],
            'releaseGateRegression': ({'baselineAutomaticWords': baseline['emittedWords'],
                'fixedAutomaticWords': controls['emittedWords'], 'sameBundleVerified': True,
                'scope': 'Development regression, not an independent accuracy test',
                'tradeoff': 'Moving signs with no observed hold require manual confirmation'} if baseline else None),
            'tasks': [{'task': r['task'], 'durationSeconds': r['decodedDurationSeconds'],
                       'emittedWords': r['emittedWords'], 'framesWithHands': r['framesWithHands'],
                       'trackedFrames': r['trackedFrames'], 'suggestionUpdates': r['suggestionUpdates']}
                      for r in controls['records']]}
            if controls else 'Recorder and replay tool verified with synthetic camera; no real user controls received')}
    (ROOT / 'training/CANDIDATE_RESULTS.json').write_text(json.dumps(snapshot, indent=2) + '\n')
    lines = [
        '# Recognition candidate results', '',
        '**No replacement model meets the proposed acceptance targets. A hand-release acceptance bug was fixed in the existing recognizer; no experimental model replacement was deployed.**', '',
        'These are measurements of particular pipelines on a small external dataset comparison. They are not a universal architecture ranking, verified ISL correctness, or live webcam accuracy.', '',
        '## External isolated-word comparison', '',
        'The declared inventory contains 30 words. CISLR supplied 57 selected query clips: 36 development clips (30 known, six outside the inventory) and 21 challenge clips (15 known, six outside the inventory). Fifteen words lack a second distinct query source. Source-video IDs are separated; signer independence and publisher labels have not been independently reviewed. The outside-inventory controls are real signs, not ordinary non-signing activity.', '',
        '“Correct known” counts rejections as misses. “Accepted precision” includes wrong known-word predictions and wrongly accepted outside-inventory words. Rejecting every clip produces undefined precision, not 100% precision.', '',
        '| Pipeline | Correct known | Outside-inventory rejected | Accepted precision | Median processing |',
        '| --- | ---: | ---: | ---: | ---: |',
    ]
    for row in rows:
        precision = '— (no accepts)' if row['acceptedPrecision'] is None else f'{100 * row["acceptedPrecision"]:.1f}% ({row["acceptedCount"]} accepted)'
        timing = row.get('medianClipInferenceMs', row.get('medianRequestMilliseconds'))
        lines.append(f'| {row["candidate"]} | {row["correctKnown"]}/15 | {round(row["unknownRejection"] * 6)}/6 | {precision} | {timing:.3f} ms |')
    lines += [
        '', 'Local classifier/search timings exclude tracking, video accumulation and, for RGB, feature extraction. Azure timing includes the remote request for eight sampled frames. None measures time from sign completion to a live transcript.', '',
        'The forest row is a baseline snapshot from before the hand-release acceptance fix, simulated with the pilot vocabulary gate and its then-current rules; it does not cover seven pilot labels (baby, pen, house, cat, dog, cow, fish). Rerunning that candidate with the corrected release policy may change its results. OpenHands source-domain adapter sanity was only 13/24 correct. These limitations prevent treating the rows as a fair comparison of model architectures.', '',
        'RGB prototypes use the publisher’s frozen I3D features and 4,765 labelled support clips, without source-ID or query-ID overlap. The pose/RGB mix and rejection margin were selected using development data only. Its development result was 17/30 known words; challenge performance fell to 3/15. Do not select a different mix after viewing these challenge results and continue calling this an untouched test.', '',
        f'Azure deployment reported `{azure["model"]}`. It got 4/15 known clips right, rejected 0/6 outside-inventory clips, and took {azure["metrics"]["medianRequestMilliseconds"] / 1000:.3f} seconds per request at the median. Only public dataset frames were submitted. Confidence in its JSON response is subjective, not calibrated.', '',
        '## Coordinate correction and continuous gloss model', '',
        'A matching original INCLUDE RGB clip showed that publisher pose pickles store x multiplied by image height and y multiplied by image width. The adapter now undoes this convention before camera-style normalization. Old cached features/checkpoints were separated and the control was retrained.', '',
        '| Experiment | Validation gloss WER ↓ | Exact sentences |',
        '| --- | ---: | ---: |',
    ]
    for label, item in coordinate.items():
        v = item['validation']
        lines.append(f'| {label} | {100 * v["wordErrorRate"]:.2f}% | {round(v["sequenceAccuracy"] * v["sequences"])}/{v["sequences"]} |')
    lines += [
        '', 'The corrected control improved from 73.45% to 68.44% validation WER, but still translated only 4/96 gloss sequences exactly. Motion adaptation worsened the corrected control to 71.98% WER. The previously inspected test split was not reused for selecting these experiments. None of these scores establishes live performance.', '',
        'The bounded iSign preparation is complete: 1,988 usable clips, 12 excluded for coverage/length, zero unresolved downloads. Its English captions were not converted into invented gloss labels. The corrected INCLUDE preparation has 4,284 usable clips; continuous CSLTR training uses 473 training, 96 validation and 93 test sequences. More downloading is not the current blocker.', '',
        '## Released ISLiM translation model diagnostic', '',
        'The public full PoseStitch checkpoint does not match the current GitHub encoder. The author’s older mobile-folder encoder matches it and loaded with `strict=True`, using tensor-only deserialization and a narrow allowlist for NumPy scalar metadata. No model tensors were skipped. The inspected encoder is hash-pinned. The locally computed checkpoint hash and CRC provenance remain under the ignored research cache; no publisher SHA256 was supplied.', '',
        'Twelve CSLTR validation sentence groups were selected by sorted ID before inference. This is a small English-translation diagnostic, distinct from the CTC gloss task. The tracker uses current MediaPipe Tasks rather than the author’s legacy Solutions version, and source JPG timing is unavailable. These results apply to this adapter and data combination.', '',
        '| Input | English reference WER ↓ | Exact sentences |',
        '| --- | ---: | ---: |',
    ]
    for kind, metrics in islim['metrics'].items():
        lines.append(f'| {kind} | {100 * metrics["wordErrorRate"]:.2f}% | {round(metrics["sequenceAccuracy"] * metrics["sequences"])}/{metrics["sequences"]} |')
    lines += ['', 'WER can exceed 100% when predictions insert extra words. Exact match and literal WER do not fully evaluate semantically equivalent English translations; the following examples also show substantial content errors.', '']
    for item in islim['predictions'][:3]:
        lines += [f'- Reference: **{item["reference"]}**. Real-input prediction: **{item["real"]["text"]}**.']
    lines += ['', f'Blank input repeatedly generated “{islim["predictions"][0]["zero"]["text"]}”. The model must not be allowed to turn absent signing into an accepted transcript. Reversed-input differences show input sensitivity, not correct motion understanding.', '']
    if controls:
        lines += ['## User-provided camera controls', '',
            f'Offline replay evaluated {len(controls["records"])} user-provided control clip(s), totalling {controls["totalDurationSeconds"]:.3f} seconds. Automatic word insertions: **{controls["emittedWords"]}**, or **{controls["emittedWordsPerMinute"]:.2f} per minute in this sample**. Known-sign accuracy remains unmeasured.', '',
            '| Activity | Duration | Frames with hands / sampled | Automatic words | Distinct suggestion updates |',
            '| --- | ---: | ---: | ---: | ---: |']
        for r in controls['records']:
            lines.append(f'| {r["task"]} | {r["decodedDurationSeconds"]:.3f}s | {r["framesWithHands"]}/{r["trackedFrames"]} | {r["emittedWords"]} | {r["suggestionUpdates"]} |')
        if observations:
            lines += ['', 'Sampled-frame activity audit (not fluent ISL review):']
            lines += [f'- `{item["task"]}`: {item["observation"]}' for item in observations['tasks']]
        if baseline:
            lines += ['', '### Hand-release acceptance regression', '',
                f'The same bundle produced **{baseline["emittedWords"]} automatic words before the fix** and **{controls["emittedWords"]} after it**. Both prior words were “bag”, at about 2.5 and 4.9 seconds while leaving the camera view. This is a development regression used to diagnose and fix the problem, not a new independent acceptance test.', '',
                'The old final-on-hand-loss path bypassed the normal hold requirement. It now requires repeated eligible predictions and 250 ms of a hold measured only while hands are observed. Time after hands disappear cannot satisfy that hold. Model weights, vocabulary, score threshold and eligible word list were not changed.', '',
                'Trade-off: moving signs that never settle now remain suggestions for confirmation. The existing short source YOU clip changed from automatic insertion to a correct suggestion; it can still be confirmed. A synthetic visible-hold extension of that clip still inserts YOU automatically. This is a policy regression check, not a new real-sign accuracy sample. Faster continuous signing still requires a better recognition model and representative reviewed data.', '']
        lines += ['', 'This short, user-labelled sample cannot establish a long-run false-insertion rate. Unaccepted suggestions are retained separately from automatic transcript words. The Python hand tracker approximates the browser pipeline and does not measure browser latency. Raw personal recordings and detailed traces remain in ignored local storage.', '',
            'Browser WebM reported 1000 FPS despite roughly 30 FPS capture. Replay now uses increasing decoded presentation timestamps and estimates the final frame interval from their median spacing. It does not derive duration from this misleading FPS field.', '']
    lines += [
        '## Next evaluation input', '',
        'A fluent ISL signer/reviewer is not currently available. Public labelled data can support further engineering comparisons, but cannot replace new, reviewed webcam signs for a product accuracy claim.', '',
        'The local recorder at `http://127.0.0.1:4173/evaluation-recorder.html` captures five 20-second, video-only non-signing controls. It uploads nothing. Download the ZIP and retain it locally. Replay it with:', '',
        '```sh',
        'python3 training/evaluate_camera_controls.py /absolute/path/to/parlance-controls.zip --output .research-cache/user-controls-results.json',
        '```', '',
        'The tool reports emitted words per minute, individual emissions and tracker timing. It cannot establish known-sign accuracy, browser end-to-end latency or confidence calibration. Keep user recordings in ignored/private storage. The browser smoke test used a prerecorded HELLO sign as a fake camera solely to verify timer, retake, ZIP CRC, mobile layout and local replay; its emissions are not a false-positive measurement.', '',
        'Next model work should start with a bounded, reviewed vocabulary and a pretrained video/sign encoder, explicit no-sign/unknown training, and signer-separated evaluation. Spend on a larger training run only after preprocessing parity and a representative evaluation set are established. No paid GPU was provisioned.', '',
        '## Sources and reproduction', '',
        '- [INCLUDE pose publisher](https://zenodo.org/records/6674324), [original INCLUDE video publisher](https://zenodo.org/records/4010759)',
        '- [CSLTR publisher](https://data.mendeley.com/datasets/kcmpdxky7p/1), [CISLR publisher](https://huggingface.co/datasets/Exploration-Lab/CISLR), [iSign publisher](https://huggingface.co/datasets/Exploration-Lab/iSign)',
        '- [OpenHands source](https://github.com/AI4Bharat/OpenHands), [ISLiM source and model link](https://github.com/ahmedshoaib/ISLiM)', '',
        'Raw predictions, frozen plans, source manifests and checkpoint provenance remain in `.research-cache/`. `CANDIDATE_RESULTS.json` is a compact committed-ready snapshot. To rebuild this report after completing the same experiments: `python3 training/write_candidate_report.py`. See `README.md` for preparation and benchmark commands.', '',
    ]
    (ROOT / 'training/CANDIDATE_RESULTS.md').write_text('\n'.join(lines))
    print('CANDIDATE_REPORT_WRITTEN')


if __name__ == '__main__':
    main()
