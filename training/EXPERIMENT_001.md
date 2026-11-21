# First continuous baseline: failed acceptance

The first causal TCN+CTC checkpoint is unsuitable for the camera feature and has
not replaced the running recognizer. Its held-out word error rate is 89.7%.

| Split | Sequences | Word error rate | Exact sentence match |
| --- | ---: | ---: | ---: |
| Training, without augmentation | 473 | 42.9% | 22.4% |
| Validation, used for checkpoint selection | 96 | 73.5% | 1.0% |
| Test | 93 | 89.7% | 0.0% |

Training stopped after epoch 102, with the validation-selected checkpoint from
epoch 67. Peak process resident memory was approximately 4.65 GB. Test errors
were 107 substitutions, 188 deletions and one insertion across 330 reference
tokens. Word error rate includes insertions and is not ordinary token accuracy.

The INCLUDE pretraining task separately achieved 93.75% classification accuracy
on its official 816-clip test split, covering 262 labels. That is an isolated
clip benchmark and does not establish live-camera or continuous recognition.

## Observations

The continuous test outputs are heavily concentrated on frequent words: `I`
appears 39 times and `WHAT` 36 times. The corresponding reference counts are 32
and eight. Many complete source sequences produce only one token. Significant
errors on the training split indicate that overfitting alone cannot explain the
failure; learning/alignment and representation also require investigation.

Shoulder-normalized body features are nonzero throughout the source splits.
Average detected hand-landmark fractions are 0.58 training, 0.53 validation and
0.67 test. These are fractions of both hands together; a one-handed sign may
correctly have only one hand visible, so these numbers are not hand-tracking
accuracy and do not prove that missing hands caused the failure.

The continuous training set has only 473 eligible sequences. Its source JPG
groups have unknown sampling times. One six-frame training sequence cannot
align its seven supplied glosses and was excluded in the recorded data audit.
The same sentence inventory occurs across splits; variant/signer identities are
publisher-reported. These limitations prevent a general live-camera claim even
if a future model obtains better source metrics.

## Next experiment requirements

1. Verify the approved iSign pose schema, dimensions, confidence and timestamps
   before preparing a larger, diverse motion corpus. Its English translations
   cannot be substituted for gold gloss-order labels.
2. Use training/validation diagnostics to separate representation, alignment,
   class imbalance and temporal sampling problems. More training epochs alone
   are not evidence of improvement.
3. Reserve fresh recordings from new signers for product acceptance. This first
   test split has now been inspected and must not be represented as an untouched
   holdout for later experiments influenced by these findings.
4. Measure false positives, word errors and end-to-end latency on real camera
   recordings, including unknown signs and changes in signing speed.

Generated checkpoint, history, audit and per-sequence predictions are in the
ignored `.research-cache/tcn-continuous/` directory. The app remains unchanged.
