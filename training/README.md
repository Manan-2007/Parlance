# ISL temporal recognition experiments

This directory trains a causal motion encoder and a continuous gloss recognizer.
It does not replace the app's recognizer automatically. A successful source-data
experiment still needs evaluation on real webcam recordings from new signers.

**Current results:** [CANDIDATE_RESULTS.md](CANDIDATE_RESULTS.md) contains the
completed coordinate-correction experiments, external candidate comparison and
released ISLiM translation diagnostic. No candidate passed acceptance. The
bounded iSign subset has finished preparation; downloading is not the blocker.

**New training run:** [ISL500_EXPERIMENT.md](ISL500_EXPERIMENT.md) describes the
40-word signer-separated video experiment, its RGB and complementary hand-motion
models, research-only data terms, real progress files and final evaluation.
Earlier candidate results are historical and are not evidence that this new run
has succeeded. Loading weights or extracting features is not optimizer training.

## Data and permission

| Source | Current use | Terms / limitation |
| --- | --- | --- |
| [INCLUDE poses, official OpenHands distribution](https://zenodo.org/records/6674324) | Encoder pretraining | CC BY 4.0. Official clip-level split; signer identities unavailable in the CSV. |
| [ISL-CSLTR](https://data.mendeley.com/datasets/kcmpdxky7p/1) | Continuous gloss training | CC BY 4.0. Source frame-folder variants 1–5 train, 6 validation, 7 test. Their signer identities have not been independently verified. |
| [iSign](https://huggingface.co/datasets/Exploration-Lab/iSign) | Access verified; bounded pose subset preparation | Gated, CC BY-NC-SA 4.0. English translation pairs are not gloss-alignment labels. Not used by the first training run. |
| [CISLR](https://huggingface.co/datasets/Exploration-Lab/CISLR) | Access verified, metadata downloaded | Gated; retain publisher conditions. Not used by this first training run. |

Download scripts use the publishers' download endpoints and retain access
controls. ZIP member reads validate lengths and CRC32; the full INCLUDE archive
is additionally verified against the publisher's MD5. Partial CSLTR downloads
cannot establish the checksum of the entire 8.9 GB archive.

The downloaded INCLUDE manifest contains 4,284 usable clips, 262 canonical labels
and eight missing files. The source CSV removes spaces from training labels but
keeps them in test labels; preparation uses the common archive folder names.
Exact track hashes are checked for train/test duplicates before splitting.

The CSLTR archive has 663 matched sentence frame groups. The publisher reports
700 videos; the current uploaded archive contains 687 sentence videos. This
experiment uses the supplied frame groups and their gold SIGN GLOSSES CSV,
including its original spelling. One sentence-folder spacing error is explicitly
mapped in preparation. Split variants contain the same sentence inventory, so
results do not establish generalization to unseen sentences.

One training clip has only six supplied frames for seven gloss tokens, making
CTC alignment impossible. It is excluded and recorded in the data audit. The
remaining split sizes are 473 training, 96 validation and 93 test sequences.
Validation/test clips are never silently excluded for alignment problems.

## Features and model

MediaPipe Holistic tracks 33 body landmarks, 20 selected facial landmarks and
both 21-point hands. Shoulder-centered, aspect-corrected coordinates and hand
local coordinates produce 369 features per frame. Missing landmarks retain
explicit masks. Extraction and camera inference must use this same schema.

The 128-channel encoder uses six causal depthwise temporal blocks with dilations
1, 2, 4, 8, 16, 32. Per-frame normalization and left padding prevent future frames
from changing earlier outputs. INCLUDE pretraining uses mean/max pooling and an
isolated-label classifier. Sentence training replaces the classifier with a
per-frame gloss head and CTC, learning alignments from complete gloss sequences.
Apple GPU inference stays differentiable through a CPU CTC loss.

CSLTR source JPGs have no reliable frame timestamps here. Extraction uses
synthetic 100 ms steps for the tracker. Temporal resampling tests and augmentation
represent changes in frame sampling, not proof of accuracy at a measured signing
speed. No language model edits recognition outputs for these metrics.

## Reproduce

Use a dedicated Python environment with `training/requirements.txt`. Generated
data, caches and checkpoints stay in the ignored `.research-cache/` directory.

```sh
python3 training/fetch_include.py
python3 training/prepare_include.py
python3 training/pretrain.py --epochs 40
python3 training/pretrain.py --evaluate-test
python3 training/prepare_csltr.py
python3 training/run_experiment.py
python3 -m unittest discover -s training/tests -v
```

`prepare_include.py` also reads the official `include_metadata.zip` CSVs from
`.research-cache/openhands/Train_Test_Split/`. `prepare_csltr.py` requires the
publisher's `ISL Corpus sign glosses.csv` in `.research-cache/csltr-annotations/`
and the official `holistic_landmarker.task` in `.research-cache/`. Cached frame
downloads and features allow extraction to resume.

Run `training/run_experiment.py --wait-for-features` alongside extraction to
start sentence training when its final manifest appears. The runner logs each
stage under `.research-cache/`; it does not change the running application.

The sentence trainer selects its checkpoint by validation word error rate and
stops after 35 epochs without improvement, up to 200 epochs. Test evaluation is
a separate command and is run once for the selected experiment. Reports include
word error rate, sentence exact match, substitutions, deletions, insertions,
synthetic time resampling, memory observations and individual predictions.
These are source-dataset metrics, not product accuracy claims.

## Larger motion corpus preparation

After accepting iSign's publisher conditions with the configured Hugging Face
account, `inspect_isign.py` checks one CRC-verified pose sample. The adapter uses
the named pose, face and hand components, converts pixel coordinates using the
header dimensions, ignores the separate world-coordinate component and retains
source frame timestamps. It refuses unsupported person counts or frame rates.

```sh
python3 training/inspect_isign.py
python3 training/prepare_isign.py --limit 12
python3 training/prepare_isign.py --limit 2000
```

Preparation reads selected members from the publisher's multipart ZIP using
byte ranges, avoiding a full 170 GB pose archive download. It expects the pinned
publisher file manifest, member index and annotation CSV in `.research-cache/`.
The subset draws at most four clips per source video; video IDs receive stable
train/validation/test assignments. This prevents adjacent segments from the same
source video crossing splits, but does not establish unseen-signer evaluation.

The output is `isign-subset-manifest.json`, `isign-features/` and an incremental
`isign-preparation-progress.json` under `.research-cache/`. Existing verified
features are reusable. At most 400 source frames are retained per clip, with
their original timestamps, and low body-coverage clips are recorded as excluded.
English captions remain translation labels, not synthetic gold gloss sequences.
This command prepares data only and does not start model training.

Download retries now refresh signed links through the approved publisher login
on HTTP 403, and member transfers use a bounded range with CRC validation instead
of fetching whole 4 MB cache blocks for each randomly selected pose. The second
pass retained 1,988 usable clips, excluded 12 low-coverage/short clips and resolved
all failed downloads in the selected 2,000-clip subset.

## Motion adaptation experiment

```sh
python3 training/run_motion_experiment.py
```

The first stage trains on the prepared iSign motion training split while keeping
INCLUDE classification as a supervised auxiliary task. It hides pose coordinates
and their corresponding local hand coordinates together, preserving visibility,
then learns to reconstruct the hidden coordinates. Source-video validation IDs
are separated and fixed; the test split and English captions are not used in
this training objective. Actual source timestamps select three-second windows.
The encoder must retain INCLUDE validation accuracy within three percentage
points of its starting value before an adapted checkpoint can be selected.

The second stage fine-tunes CTC on the same audited CSLTR training split as the
control experiment. The runner compares validation word error rates and saves
`motion-experiment-result.json`. It does not reuse the inspected CSLTR test split,
start camera inference or deploy either checkpoint. Lower reconstruction loss
is a representation diagnostic, not recognition accuracy. A validation gain
still requires a separate live-camera acceptance test.

Stage logs are `motion-adaptation.log`, `motion-continuous-training.log` and
`motion-experiment.log`. Their checkpoints, audits and histories are under
`tcn-motion/` and `tcn-motion-continuous/`, inside `.research-cache/`.

## Corrected source coordinates

`check_include_coordinates.py` compares a publisher pose track with its original
RGB clip. It confirmed x*height/y*width storage in INCLUDE. The corrected adapter
undoes that convention before aspect correction. `prepare_include.py` regenerates
caches whose adapter tag is stale; trainers reject incompatible features.
Historical pre-correction checkpoints are not comparable replacement candidates.

```sh
python3 training/check_include_coordinates.py
python3 training/run_coordinate_fix_experiment.py
```

The corrected control selected 68.44% validation gloss WER. Masked-motion
adaptation selected 71.98%, so adaptation did not improve the corrected control.
Neither was deployed. Source variants are not verified unseen signers.

## External candidate comparison

The scripts below use the pinned CISLR manifests and approved publisher access.
They retain separate development/challenge source IDs, freeze a 30-word pilot
inventory and report its limited challenge coverage. Models are engineering
candidates with different source training and coverage, not a fair architecture
leaderboard. The forest row uses existing acceptance rules and a pilot gate.

```sh
python3 training/prepare_candidate_benchmark.py
python3 training/extract_candidate_features.py
python3 training/benchmark_local_candidates.py
python3 training/prepare_candidate_support.py
python3 training/extract_candidate_features.py --support
python3 training/benchmark_rgb_prototypes.py
python3 training/benchmark_pose_rgb_fusion.py
```

OpenHands requires its inspected source checkout and public INCLUDE SL-GCN
weights at the paths described in `openhands_candidate.py`. RGB retrieval requires
the approved CISLR `I3D_features.pkl` publisher file in the research cache. Support
and query source IDs are checked for overlap. Retrieval timing excludes RGB
encoding and tracking. All generated predictions and selected settings are
research artifacts and are not loaded by the application.

Azure vision benchmarking submits only the selected **public dataset** frames
to the configured Azure deployment. It incurs API usage. It does not upload
camera controls. Credentials belong only in ignored `.env`:

```sh
node --env-file=.env training/probe_azure.mjs
node --env-file=.env training/benchmark_azure.mjs
```

Inspect each script's arguments before rerunning; cached responses are matched
to prompt/configuration/image hashes. Do not tune against inspected challenge
outputs and continue calling them an untouched test.

## Released ISLiM diagnostic

`download_islim_checkpoint.py` downloads the author's public full PoseStitch
checkpoint in resumable ranges, validates its ZIP CRC and records a local SHA256.
The author did not publish a matching checksum. The current GitHub encoder
differs from the checkpoint; `benchmark_islim.py` requires the matching older
`mobile/encoder.py` from the publisher's Drive release, hash-pinned in the adapter.
Its source must be placed at `.research-cache/islim-model/mobile-source/encoder.py`.
The public file ID is `1c-16qMf7tThUOoSvkNCUon8BQ14yU2uY`, linked from the model
folder in [the publisher repository](https://github.com/ahmedshoaib/ISLiM).

The adapter loads all model tensors strictly using tensor-only deserialization,
retains the publisher's mobile inference normalization/padding/generation, and
tests real, zero and reversed inputs on 12 deterministically selected external
CSLTR sentence groups. Current MediaPipe Tasks differs from the author's legacy
Solutions tracker. English WER is not comparable to CTC gloss WER.

```sh
python3 training/download_islim_checkpoint.py
python3 training/benchmark_islim.py
python3 training/write_candidate_report.py
```

## Local webcam controls without an ISL signer

Open `http://127.0.0.1:4173/evaluation-recorder.html` while the dev server is
running. Record the five 20-second activities and download the ZIP before
closing the page. Camera access is explicit, no microphone is requested, and
the page uploads nothing. Retake removes the preceding local recording.

```sh
python3 training/evaluate_camera_controls.py /absolute/path/to/recordings.zip --output .research-cache/user-controls-results.json
```

This replays locally with the current forest/session and a Python hand tracker,
using decoded video timestamps. It reports emissions per minute and individual
words, including any final word flushed by a synthetic end-of-clip hand release.
It approximates the browser pipeline; it does not measure browser latency or
known-sign accuracy. Keep personal recordings and outputs under ignored storage.
See `CANDIDATE_RESULTS.md` for the latest user-control results. New known-sign
recordings still need fluent ISL review before product accuracy can be claimed.
Browser WebM may advertise 1000 FPS even at roughly 30 FPS capture; replay uses
decoded presentation timestamps, with a median-interval estimate for the final
frame duration. It rejects ambiguous or non-increasing timestamps rather than
inventing a signing speed.

The current release policy requires the same 250 ms observed hold for normal and
end-of-sign acceptance. Hand disappearance does not supply stationary evidence.
The empty-scene retake exposed two automatic BAG insertions before this fix and
zero afterward on the same five-clip bundle. These clips are now development
regressions, not an untouched acceptance set. This policy also moves an existing
unheld YOU source example to manual confirmation. Neither model weights nor
class thresholds were retrained or tuned against the recordings.
