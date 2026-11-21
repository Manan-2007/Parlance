# ISL word recognition model

The temporal forest, metadata and evaluation were copied from the original
local Yap & Render project. Inference uses that model's 135-value hand features
and 2160-value temporal embedding. Camera coordinates are captured without
mirroring. Hands are sorted by wrist x and normalized by wrist-to-joint distance.

The forest covers 150 word classes and a background class. Its 52 automatic
classes, score threshold of 0.56 and margin of 0.15 were selected on calibration
signers. `word-evaluation.json` contains the original signer-disjoint evaluation.
Those results describe source recordings. Live camera performance needs separate
evaluation with new signers and devices.

The weights have SHA-256
`b9e83de794449a4ede72a0b95e804425b71c32318b003bfad1075d0bf41052d1`.
`temporal-provenance.json` records source tracks, partitions and checksums.

The model's source terms apply to these copied weights and derived data.

- [ISL500 / ISL-DATA](https://huggingface.co/datasets/ISL500/ISL-DATA) permits research and academic use. The combined weights inherit that restriction.
- [ISLRTC dictionary re-encode](https://huggingface.co/datasets/Vignesh3816/Indian_Sign_Language_Data.gov_Rencoded) has an MIT-labelled release with original ISLRTC/data.gov.in attribution.
- [INCLUDE, AI4Bharat](https://huggingface.co/datasets/ai4bharat/INCLUDE) uses CC BY 4.0.
- [ISL canonical motion v1](https://www.kaggle.com/datasets/hariragavendramg/isl-canonical-motion-v1) has a CC0-labelled release of ISLRTC-derived coordinates.

Training used 6549 recordings, with separate calibration and test signers.
The original training implementation is `scripts/train-word-model.py` in
Yap & Render. Replace or retrain the model with appropriately licensed data
before commercial use.
