# Signer-separated ISL500 experiment

This is a new training run, not a claim that the camera recognizer is accurate.
The currently running application keeps its legacy model and corrected release
gate. These experiment checkpoints are not loaded by the app automatically.

The first compact hand-model run has completed; see [ISL500_RESULTS.md](ISL500_RESULTS.md)
for its held-out results. The RGB run remains separate and its live progress files
are the source of truth for its current stage.

## Data found and selected

The [ISL500 publisher](https://huggingface.co/datasets/ISL500/ISL-DATA) supplies
7,500 raw videos for 500 words in 15 signer folders. Its raw video manifest is
137,703,878,068 bytes. The dataset card restricts use to research and academic
purposes. Native videos and derived frames remain in the ignored research cache.

The experiment selects 40 useful labels before training. It does not use the
publisher's person-dependent CSV split:

| Split | Publisher signer folders | Known-word clips | Outside-vocabulary clips |
| --- | --- | ---: | ---: |
| Training | User001–User010 | 400 | 0 |
| Validation | User011–User012 | 80 | 10 |
| Test | User013–User015 | 120 | 15 |

The 625 selected source videos total 10,534,165,750 bytes. Each video is checked
against its publisher LFS SHA256 before extracting 32 chronological RGB frames.
Temporary native files are removed after successful extraction. Actual decoded
presentation timestamps and decoded frame counts are retained; metadata frame
counts are unreliable on some variable-rate files. Full-size files from failed,
terminated attempts may remain under the temporary cache until cleaned up.
Short clips with at least two decoded frames are retained by resampling existing
frames, not by fabricating new motion or a longer source duration. The Cool/User006
video decodes to ten frames spanning about 304 ms despite a larger metadata frame
count; this prompted a decoder regression test. Its absent publisher hand track
is still an explicit hand-branch training exclusion.

The selected words are Hello, Thankyou, Please, Yes, No, Help, I, You, He, She,
Mother, Father, Sister, Friend, Family, Baby, Teacher, Student, School, House,
Eat, Drink, Water, Food, Tea, Go, Sit, Walk, Work, Book, Pen, Computer, Bag, Car,
Bus, Doctor, Happy, Sad, Cool and What. Labels retain publisher spelling.
Red, Black, Cat, Dog and Cow are outside-vocabulary checks, never training labels.

IDs are publisher-reported signer IDs, not independently verified identities.
Word labels and forms have not received independent fluent-ISL review. Exact
source-hash duplicates and missing known-word/signer combinations abort planning.
Separated users reduce leakage but do not establish general webcam performance.

[Amrita SLR](https://data.mendeley.com/datasets/dtg9s785v8/1), with 50 words,
seven signers and varied backgrounds/devices, was also located. It is a potential
external follow-up dataset; it is not silently mixed into this experiment.
INCLUDE, CISLR and iSign remain documented in the earlier candidate results.

## Models actually being prepared

**RGB:** [Torchvision R3D-18](https://docs.pytorch.org/vision/stable/models/generated/torchvision.models.video.r3d_18.html)
with official Kinetics-400 weights. These are general-action weights, not an
already accurate ISL model. Frozen stem/layers 1–3 are cached for three fixed
training views and one evaluation view. The final video block and 40-label head
are fine-tuned, with two classifier-only warmup epochs, then up to 20 epochs and
seven-epoch validation patience. Batch normalization statistics remain frozen.
Video input is 16 chronological RGB frames with 112×112 crops. Training adds
small temporal/crop/brightness/contrast variation; signs are never time-reversed
or mirrored as assumed equivalent labels. This preprocessing may lose detail
and needs empirical evaluation rather than an accuracy promise.

**Hands:** a complementary causal temporal-convolution classifier over the
publisher's hand tracks for the same selected videos. It learns from scratch,
using normalized 3D hand shape, hand presence and wrist location (135 features,
64 temporal samples). This branch does not include body or facial information.
The source manifest contains 624 of the exact corresponding hand files; the
missing Cool/User006 training file is explicitly excluded, not fabricated.
Other low-coverage training tracks are also audited. Held-out denominator clips
are retained and invalid tracking is treated as UNKNOWN, not silently removed.
The compact branch runs up to 80 epochs with 15-epoch validation patience.

Both models select checkpoints using validation known-word accuracy only. A
validation-only score threshold is selected using known and unknown clips.
Softmax scores are not calibrated probabilities. Test evaluation runs afterward
on the frozen checkpoint. Full-clip word accuracy is not sentence translation,
live latency, high-speed continuous recognition, or avatar animation accuracy.
User webcam controls remain separate regression evidence and are not used for
training either classifier.

## Run and inspect

Install `training/requirements.txt` in a dedicated environment. This run uses the
existing PyTorch 2.11 and matching Torchvision 0.26 on the local Apple GPU.

```sh
python3 training/prepare_isl500_rgb.py
python3 training/train_isl500_rgb.py --wait-for-data
python3 training/train_isl500_rgb.py --evaluate-test
python3 training/train_isl500_hands.py
python3 training/train_isl500_hands.py --evaluate-test
```

Preparation requires the pinned `ISL500-video-files.json` publisher manifest in
`.research-cache/`. The hand branch also needs the cached publisher hand-file
manifest `ISL500-files.json`. Both were obtained through the official Hub API.
All data downloads preserve publisher access controls; no videos are uploaded.

The live run's state is explicit:

- `.research-cache/isl500-rgb/progress.json`: raw RGB preparation.
- `.research-cache/isl500-rgb/training-progress.json`: pretrained-weight loading,
  frozen-feature extraction, optimizer training, or training complete.
- `.research-cache/isl500-rgb/model/history.json`: actual completed RGB epochs.
- `.research-cache/isl500-hands/progress.json`: hand preparation/training state.
- `.research-cache/isl500-hands/history.json`: actual completed hand-model epochs.
- Each branch's `evaluation-status.json`: separate final evaluation or failure.
- RGB `model/test-results.json` and hands `test-results.json`: held-out results.

`finish_isl500_training.py --pid PID --branch rgb` (or `hands`) is a bounded
one-run companion for an already running trainer. It waits for that process to
exit, checks that training completed, then runs explicit final evaluation. It
does not deploy anything. Preparation or training failure is reported as failure,
not as a successful background run. A missing `history.json` means no optimizer
epoch has completed, even if the process is loading weights or extracting data.
