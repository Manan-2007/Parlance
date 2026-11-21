# ISL500 training results

Both runs completed. Neither has replaced the app's recognizer.

| Measurement | Hand-motion model | RGB R3D-18 |
| --- | ---: | ---: |
| Supported known labels | 40 | 40 |
| Usable training clips, publisher users 1–10 | 397 | 400 |
| Selected epoch, validation only | 26 | 16 |
| Validation known-word accuracy, users 11–12 | 73/80 (91.25%) | 32/80 (40%) |
| Test known-word accuracy, users 13–15 | 81/120 (67.5%) | 26/120 (21.67%) |
| Accepted predictions at validation-selected threshold | 111 | 74 |
| Correct among accepted predictions | 77/111 (69.37%) | 18/74 (24.32%) |
| Outside-vocabulary test clips rejected | 7/15 | 8/15 |

The RGB run was paused at the user's request after epoch 15. Its legacy
checkpoint retained model weights but no optimizer state. Epochs 16–20 continued
from those weights with restarted Adam moments and the original learning-rate
schedule position. New checkpoints save optimizer/scheduler/RNG state atomically.
The selected epoch 16 checkpoint was tested only after training completed.
The compact snapshot is `ISL500_RGB_RESULTS.json`.

Three training exclusions were recorded: missing Cool/User006 publisher hand
file, and insufficient hand coverage in one I and one Baby clip. One test track
had insufficient hand coverage and remained in the evaluation denominator with
UNKNOWN output. These are not silently removed failed cases. Details and a
checkpoint content hash are in `ISL500_HAND_RESULTS.json`.

The model learns six causal temporal blocks over 135 normalized hand
shape/location features, resampled to 64 temporal positions. It trains on the
publisher's video-derived hand tracks, not RGB appearance, body or facial cues.
The RGB experiment used a general-action pretrained backbone, with its earlier
layers frozen and its final block/head fine-tuned on 16-frame 112px views. This
particular video configuration generalized worse than the hand-only branch;
it does not establish that RGB approaches are intrinsically worse. It did not
meet acceptance targets and is not deployed.

Signer folders are publisher-reported, and labels/identities have not received
independent verification. The untouched test folders were scored once after
selecting the checkpoint and score threshold using validation only. The
validation-to-test drop is substantial. Accepted precision and unknown rejection
remain below the proposed product targets; a raw softmax score is not a calibrated
probability. Do not deploy this as reliable open-ended ISL recognition.

This is isolated 40-word classification, not continuous signing, sentence
translation, webcam accuracy, or avatar-sign correctness. It is not directly
comparable with the earlier CSLTR sentence gloss WER or the small CISLR candidate
comparison, which used different data, classes and evaluation tasks.

See [the experiment definition](ISL500_EXPERIMENT.md) and
[the publisher](https://huggingface.co/datasets/ISL500/ISL-DATA). Raw predictions,
the selected checkpoint and progress logs remain in the ignored research cache.
