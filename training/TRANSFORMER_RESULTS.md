# ISL transformer recognizer: how it was built and measured

The bundled Sign → Text recognizer (`backend/models/isl-transformer.onnx`) and how
far its numbers can be trusted. Everything here is reproducible with the scripts in
`training/`; the data cache lives in `.research-cache/` (git-ignored).

## Data

- **ISL500 / ISL-DATA** (Hugging Face `ISL500/ISL-DATA`, revision `bf1fc5a6`): MediaPipe
  hand tracks `(T, 2, 21, 3)` at 30 fps, 500 words × 15 signers, 74,878 clips
  (duplicate `/_mnt_` copies excluded). Licence: **research and academic use only**.
  Downloaded with `training/prepare_isl500_full.py` (paced to stay under the
  Hugging Face resolver limit), packed to `.research-cache/isl500-full/`.
- **Parlance controls**: non-signing recordings (typing, empty scene) used as the
  `__NONE__` class so resting and fidgeting are not read as words.
- **Browser-tracked clips** (`isl-native`): ISL500 videos re-tracked with Parlance's
  own browser MediaPipe settings, used to measure the gap between publisher tracks
  and what the webcam pipeline produces.

## Splits (signer-disjoint, same as the forest's)

| Split | Signers | Use |
| --- | --- | --- |
| Train | all others | weights |
| Calibration | USER012, USER013 | temperature, thresholds, automatic words, every design choice |
| Test | USER004, USER005, USER014, USER015 | reported numbers, run once per shipped model |

25 words are held out entirely as **unknown signs**: the model must not write them.
475 words are known.

## Model

`training/isl_transformer.py`: per-frame features (same 135 numbers as
`backend/model.py frame_features`, checked by `training/tests/test_isl_transformer.py`)
plus their deltas → 1-D conv blocks → self-attention → masked mean + max pooling →
476 classes (class 0 = `__NONE__`). Trained with EMA weights, label smoothing and
augmentation (mirroring, affine jitter, noise, hand gaps, tempo changes, long one-hand
dropouts), with browser-tracked training-signer clips mixed in.

Runs: `base` (dim 192, depth 3), `large`, `robust` (stronger dropout augmentation),
`robustlarge`; ensembles average member probabilities (`ens2` = base + large,
`ens4` = all four).

## Isolated-clip accuracy (test signers, whole clips)

| Run | Top-1 | Top-5 | Auto-written recall @ precision |
| --- | --- | --- | --- |
| base | 89.7% | 97.9% | 76.5% @ 96.6% |
| large | 90.2% | 98.2% | 76.5% @ 96.4% |

On the 70 words both models know, the transformer scores **93.0–93.4% top-1 vs 86.4%**
for the original temporal forest (same test signers).

## Calibration (calibration signers)

Temperature scaling, then the lowest score threshold that keeps automatic output at
≥ 95% precision; a word may be written automatically only if, on calibration signers,
it reaches ≥ 95% precision and ≥ 50% recall.

| Run | Written automatically | Precision |
| --- | --- | --- |
| base | 69.8% | 95.1% |
| large | 69.7% | 95.3% |
| robust | 67.3% | 95.3% |
| robustlarge | 68.9% | 95.4% |
| ens2 | 71.3% | 95.2% |
| ens4 | 73.2% | 95.4% |

## Live-session behaviour (replayed through `backend/recognition.py`)

Clips are fed frame by frame at 30 fps through the real `RecognitionSession`,
followed by empty frames (hands lowered). "Usable" = written automatically and
correct, or the correct word offered as a suggestion to tap.

Design choices, each made on calibration signers only:

1. **Longest window** (`window_policy_check.py`): decide on the whole sign since the
   hands rose. Shorter partial windows produced confident wrong answers.
   Usable 86.9% → 91.8% (publisher), 76.9% → 82.3% (browser); unknown signs written
   69 → 47 of 969.
2. **Commit on release**: write the word when the hands drop instead of waiting for
   a still hold, which many signs never have.
3. **Release threshold 0.94** (`release_threshold_check.py`): unknown signs written
   5 → 3 of 532 with no loss of usable output.
4. **Release 220 ms, rejoin 500 ms** (`release_policy_check.py`): 12% of
   browser-tracked clips have a mid-sign tracking gap of ≥ 220 ms. If the hands return
   within 500 ms and nothing was written, it is the same sign. Usable (publisher)
   89.2% → 91.0%, browser 77.8% → 78.9%, no unknown signs written. A 400 ms release is
   worse: it misses the end of short clips.

## Choosing the shipped model (calibration signers, `select_model.py`)

All with longest window, commit on release, threshold 0.94, release 220 / rejoin 500.

| Run | Usable (publisher) | Usable (browser, 90 clips) | Browser auto precision | Unknown signs written |
| --- | --- | --- | --- | --- |
| **ens2** | 91.0% | 78.9% | **100%** | **0** |
| ens4 | 90.6% | 81.1% | 97.5% | 3 |
| robustlarge | 90.4% | 80.0% | 97.1% | 3 |

**Shipped: `ens2`** (base + large, 23.5 MB ONNX). ens4's browser lead is 2 clips of 90;
ens2 wrote no wrong word on browser clips and no unknown sign, at half the size and compute.

## Shipped model on test signers (run once)

Isolated clips, whole-clip decision:

| | ens2 |
| --- | --- |
| Top-1 / top-5 | **90.6% / 98.3%** |
| Written automatically at calibrated gate | 77.7% at 96.6% precision |
| Top-1 on the 70 words shared with the forest | 93.5% (forest 86.4%) |
| Per signer top-1 | 90.2%, 85.8%, 91.4%, 92.1% |

Live session (`stream_check.py`, 3000 sampled known-word clips + all 969 unknown-sign
clips, threshold 0.94, commit on release):

| | Publisher tracks | Browser-tracked (260 clips) |
| --- | --- | --- |
| Usable (written correctly, or correct word offered to tap) | **93.9%** | **85.4%** |
| Written automatically | 50.9% | 38.8% |
| Precision of automatic words | **98.6%** | **99.0%** |
| Old forest on its 70 shared words, usable | 86.5% | 79.4% |

- Hardest signer (USER005): 89.3% usable, 94.8% automatic precision.
- **Unknown signs written: 33 of 969 (3.4%).** On calibration signers this was 0 of
  532, so the test signers are harder. Signing a word outside the vocabulary will
  sometimes produce a wrong word; holding still instead of lowering the hands (the old
  rule) writes 1 of 969, but writes almost nothing automatically.
- Non-signing controls (typing, empty scene): 0 words written.
- Rejoin trade-off: a new sign started within 500 ms of the hands vanishing, after an
  uncertain sign, is joined to it. Isolated-clip tests cannot measure this; lower the
  hands fully between signs.

## Hybrid with the forest

ISL500 lacks 80 of the forest's 150 words (sorry, want, understand, name, come,
stop…). `backend/hybrid.py` lets the forest add up to two **suggestions** for those
words when the transformer is not confident; they always need a tap. On transformer
words the hybrid's numbers are identical to the transformer alone. Per-query latency
p95 ≈ 1.7 ms for a single model on a laptop CPU.

## What these numbers do not show

- **Publisher tracks are not your webcam.** The browser-tracked set is the closest
  proxy and is 10–12 points lower than publisher tracks. It is small (90 clips per
  check), so differences of a few points between runs are noise.
- **No independent live signers.** Nobody outside the dataset has been measured
  signing to a webcam. Lighting, camera angle, signing speed and regional variants
  will move these numbers.
- **Isolated words only.** Continuous signing works because the session splits signs
  when the hands drop. Signs run together without lowering the hands are read as one
  window.
- **Hands only.** Facial grammar, mouthing and body-anchored contrasts are not seen.
- **Licence.** ISL500 is research and academic use only, so this model is not cleared
  for commercial use.

## Reproduce

```bash
export PYTHONPATH=.research-cache/python-onnx:.research-cache/python
python3 -m training.prepare_isl500_full            # download + pack (resumable)
ISL_RUN=base python3 -m training.train_isl_transformer train --native   # also calibrates
ISL_RUN=ens2 python3 -m training.train_isl_transformer ensemble --members base large
ISL_RUN=x    python3 -m training.select_model ens2 ens4      # calibration signers
ISL_RUN=ens2 python3 -m training.train_isl_transformer evaluate   # test signers, once
ISL_RUN=ens2 python3 -m training.train_isl_transformer export --commit-on-release --threshold 0.94 --release-ms 220 --rejoin-ms 500
ISL_RUN=ens2 python3 -m training.stream_check
```

---

## Update: ISL500 + INCLUDE, movement-based signs, end-to-end browser test (2026-11-21)

**Why.** Live webcam use failed. The ISL500-only model scored **10% top-1 on INCLUDE**
(AI4Bharat, a separate signer population) on the 173 shared words: a single
15-signer dataset does not carry over to other people. INCLUDE also shows the
other hand resting in view, which ISL500 framing hides.

**Model.** `incens` = base + large, both trained on ISL500 + INCLUDE
(`training/prepare_include_hands.py`, `ISL_SOURCES=isl500,include`), with a synthetic
resting second hand and random hand-depth scale. 557 words. INCLUDE has no signer ids,
so its test split is clip-level and optimistic.

| Test | Top-1 | Top-5 |
| --- | --- | --- |
| ISL500 unseen signers | 90.8% | 98.3% |
| INCLUDE test clips | 95.2% | 99.0% |

Automatic words: chosen on calibration signers at score ≥ 0.94, per-word precision
≥ 0.95, recall ≥ 0.3, ≥ 5 accepted (345 words). Test precision of automatic words 98.4%.
A confidence-only gate is not safe: words outside the list are ~90% precise even at 0.98.

**Live session.** Signs now end when the hands settle in view (450 ms) and restart when
they move after resting (700 ms); a resting hand is never read as a held sign.
Replayed with hands visible 1 s before and 1.2 s after each sign (ens2, test signers):

| Rules | Usable | Automatic precision | Unknown signs written |
| --- | --- | --- | --- |
| old (hold rule, hands must leave) | 78.2% | 79.3% | 10 / 200 |
| settle / restart | 91.5% | 99.5% | 4 / 200 |

**End to end in the real app** (`training/e2e/`): 35 ISL500 videos of 2 unseen signers
played as the webcam in headless Chrome, through the browser MediaPipe tracker
(17–19 fps), WebSocket and backend: **29 / 35 usable, 16 written automatically,
1 wrong word written** (noon → sun). Tracking at 960 px instead of 640 px changed nothing.
The tracker runs on the CPU: when other heavy processes run, tracking drops to a few
frames per second and recognition fails.

**Video-model alternatives** (measured here, and published): a general vision model on
8 frames per clip got 4 / 15 (27%, ~6.4 s per request); RGB I3D features 3 / 15. Published
zero-shot VLM results on isolated signs are ~20–40% (Gemini 2.5 Pro ~24–32% on WLASL300).
