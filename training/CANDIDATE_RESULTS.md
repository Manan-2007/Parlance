# Recognition candidate results

**No replacement model meets the proposed acceptance targets. A hand-release acceptance bug was fixed in the existing recognizer; no experimental model replacement was deployed.**

These are measurements of particular pipelines on a small external dataset comparison. They are not a universal architecture ranking, verified ISL correctness, or live webcam accuracy.

## External isolated-word comparison

The declared inventory contains 30 words. CISLR supplied 57 selected query clips: 36 development clips (30 known, six outside the inventory) and 21 challenge clips (15 known, six outside the inventory). Fifteen words lack a second distinct query source. Source-video IDs are separated; signer independence and publisher labels have not been independently reviewed. The outside-inventory controls are real signs, not ordinary non-signing activity.

“Correct known” counts rejections as misses. “Accepted precision” includes wrong known-word predictions and wrongly accepted outside-inventory words. Rejecting every clip produces undefined precision, not 100% precision.

| Pipeline | Correct known | Outside-inventory rejected | Accepted precision | Median processing |
| --- | ---: | ---: | ---: | ---: |
| openhands_sl_gcn | 0/15 | 6/6 | — (no accepts) | 20.141 ms |
| isolated_tcn | 0/15 | 5/6 | 0.0% (3 accepted) | 11.818 ms |
| current_forest_pilot_gate | 1/15 | 6/6 | 50.0% (2 accepted) | 3.606 ms |
| i3d_raw_full_dictionary | 2/15 | 6/6 | 50.0% (4 accepted) | 0.792 ms |
| i3d_raw_pilot_inventory | 4/15 | 0/6 | 19.0% (21 accepted) | 0.014 ms |
| i3d_centered_full_dictionary | 2/15 | 6/6 | 50.0% (4 accepted) | 0.785 ms |
| i3d_centered_pilot_inventory | 4/15 | 0/6 | 19.0% (21 accepted) | 0.013 ms |
| i3d_centered_pilot_calibrated | 2/15 | 3/6 | 18.2% (11 accepted) | 0.013 ms |
| development_selected_pose_rgb_fusion | 3/15 | 1/6 | 17.6% (17 accepted) | 29.621 ms |
| azure_8_frames | 4/15 | 0/6 | 22.2% (18 accepted) | 6415.000 ms |

Local classifier/search timings exclude tracking, video accumulation and, for RGB, feature extraction. Azure timing includes the remote request for eight sampled frames. None measures time from sign completion to a live transcript.

The forest row is a baseline snapshot from before the hand-release acceptance fix, simulated with the pilot vocabulary gate and its then-current rules; it does not cover seven pilot labels (baby, pen, house, cat, dog, cow, fish). Rerunning that candidate with the corrected release policy may change its results. OpenHands source-domain adapter sanity was only 13/24 correct. These limitations prevent treating the rows as a fair comparison of model architectures.

RGB prototypes use the publisher’s frozen I3D features and 4,765 labelled support clips, without source-ID or query-ID overlap. The pose/RGB mix and rejection margin were selected using development data only. Its development result was 17/30 known words; challenge performance fell to 3/15. Do not select a different mix after viewing these challenge results and continue calling this an untouched test.

Azure deployment reported `gpt-6-luna-2026-09-22`. It got 4/15 known clips right, rejected 0/6 outside-inventory clips, and took 6.415 seconds per request at the median. Only public dataset frames were submitted. Confidence in its JSON response is subjective, not calibrated.

## Coordinate correction and continuous gloss model

A matching original INCLUDE RGB clip showed that publisher pose pickles store x multiplied by image height and y multiplied by image width. The adapter now undoes this convention before camera-style normalization. Old cached features/checkpoints were separated and the control was retrained.

| Experiment | Validation gloss WER ↓ | Exact sentences |
| --- | ---: | ---: |
| tcn-continuous | 73.45% | 1/96 |
| tcn-motion-continuous | 70.80% | 1/96 |
| tcn-continuous-corrected | 68.44% | 4/96 |
| tcn-motion-continuous-corrected | 71.98% | 4/96 |

The corrected control improved from 73.45% to 68.44% validation WER, but still translated only 4/96 gloss sequences exactly. Motion adaptation worsened the corrected control to 71.98% WER. The previously inspected test split was not reused for selecting these experiments. None of these scores establishes live performance.

The bounded iSign preparation is complete: 1,988 usable clips, 12 excluded for coverage/length, zero unresolved downloads. Its English captions were not converted into invented gloss labels. The corrected INCLUDE preparation has 4,284 usable clips; continuous CSLTR training uses 473 training, 96 validation and 93 test sequences. More downloading is not the current blocker.

## Released ISLiM translation model diagnostic

The public full PoseStitch checkpoint does not match the current GitHub encoder. The author’s older mobile-folder encoder matches it and loaded with `strict=True`, using tensor-only deserialization and a narrow allowlist for NumPy scalar metadata. No model tensors were skipped. The inspected encoder is hash-pinned. The locally computed checkpoint hash and CRC provenance remain under the ignored research cache; no publisher SHA256 was supplied.

Twelve CSLTR validation sentence groups were selected by sorted ID before inference. This is a small English-translation diagnostic, distinct from the CTC gloss task. The tracker uses current MediaPipe Tasks rather than the author’s legacy Solutions version, and source JPG timing is unavailable. These results apply to this adapter and data combination.

| Input | English reference WER ↓ | Exact sentences |
| --- | ---: | ---: |
| real | 127.12% | 0/12 |
| zero | 159.32% | 0/12 |
| reversed | 111.86% | 0/12 |

WER can exceed 100% when predictions insert extra words. Exact match and literal WER do not fully evaluate semantically equivalent English translations; the following examples also show substantial content errors.

- Reference: **could you please talk slower**. Real-input prediction: **on the left there is a picture**.
- Reference: **what did you tell him**. Real-input prediction: **that is right**.
- Reference: **i am afraid of that**. Real-input prediction: **thank you so much for watching**.

Blank input repeatedly generated “you know that a cat is a human”. The model must not be allowed to turn absent signing into an accepted transcript. Reversed-input differences show input sensitivity, not correct motion understanding.

## User-provided camera controls

Offline replay evaluated 5 user-provided control clip(s), totalling 99.921 seconds. Automatic word insertions: **0**, or **0.00 per minute in this sample**. Known-sign accuracy remains unmeasured.

| Activity | Duration | Frames with hands / sampled | Automatic words | Distinct suggestion updates |
| --- | ---: | ---: | ---: | ---: |
| rest | 19.978s | 295/359 | 0 | 3 |
| typing | 19.991s | 218/360 | 0 | 6 |
| ordinary_movement | 19.960s | 284/359 | 0 | 11 |
| change_position | 19.992s | 333/360 | 0 | 42 |
| empty_scene | 20.000s | 45/360 | 0 | 2 |

Sampled-frame activity audit (not fluent ISL review):
- `empty_scene`: No person is visible in the sampled middle frames. Leaving-frame transitions are retained in the complete clip; a person remains visible near 2.4 and 4.8 seconds.

### Hand-release acceptance regression

The same bundle produced **2 automatic words before the fix** and **0 after it**. Both prior words were “bag”, at about 2.5 and 4.9 seconds while leaving the camera view. This is a development regression used to diagnose and fix the problem, not a new independent acceptance test.

The old final-on-hand-loss path bypassed the normal hold requirement. It now requires repeated eligible predictions and 250 ms of a hold measured only while hands are observed. Time after hands disappear cannot satisfy that hold. Model weights, vocabulary, score threshold and eligible word list were not changed.

Trade-off: moving signs that never settle now remain suggestions for confirmation. The existing short source YOU clip changed from automatic insertion to a correct suggestion; it can still be confirmed. A synthetic visible-hold extension of that clip still inserts YOU automatically. This is a policy regression check, not a new real-sign accuracy sample. Faster continuous signing still requires a better recognition model and representative reviewed data.


This short, user-labelled sample cannot establish a long-run false-insertion rate. Unaccepted suggestions are retained separately from automatic transcript words. The Python hand tracker approximates the browser pipeline and does not measure browser latency. Raw personal recordings and detailed traces remain in ignored local storage.

Browser WebM reported 1000 FPS despite roughly 30 FPS capture. Replay now uses increasing decoded presentation timestamps and estimates the final frame interval from their median spacing. It does not derive duration from this misleading FPS field.

## Next evaluation input

A fluent ISL signer/reviewer is not currently available. Public labelled data can support further engineering comparisons, but cannot replace new, reviewed webcam signs for a product accuracy claim.

The local recorder at `http://127.0.0.1:4173/evaluation-recorder.html` captures five 20-second, video-only non-signing controls. It uploads nothing. Download the ZIP and retain it locally. Replay it with:

```sh
python3 training/evaluate_camera_controls.py /absolute/path/to/parlance-controls.zip --output .research-cache/user-controls-results.json
```

The tool reports emitted words per minute, individual emissions and tracker timing. It cannot establish known-sign accuracy, browser end-to-end latency or confidence calibration. Keep user recordings in ignored/private storage. The browser smoke test used a prerecorded HELLO sign as a fake camera solely to verify timer, retake, ZIP CRC, mobile layout and local replay; its emissions are not a false-positive measurement.

Next model work should start with a bounded, reviewed vocabulary and a pretrained video/sign encoder, explicit no-sign/unknown training, and signer-separated evaluation. Spend on a larger training run only after preprocessing parity and a representative evaluation set are established. No paid GPU was provisioned.

## Sources and reproduction

- [INCLUDE pose publisher](https://zenodo.org/records/6674324), [original INCLUDE video publisher](https://zenodo.org/records/4010759)
- [CSLTR publisher](https://data.mendeley.com/datasets/kcmpdxky7p/1), [CISLR publisher](https://huggingface.co/datasets/Exploration-Lab/CISLR), [iSign publisher](https://huggingface.co/datasets/Exploration-Lab/iSign)
- [OpenHands source](https://github.com/AI4Bharat/OpenHands), [ISLiM source and model link](https://github.com/ahmedshoaib/ISLiM)

Raw predictions, frozen plans, source manifests and checkpoint provenance remain in `.research-cache/`. `CANDIDATE_RESULTS.json` is a compact committed-ready snapshot. To rebuild this report after completing the same experiments: `python3 training/write_candidate_report.py`. See `README.md` for preparation and benchmark commands.
