# Building a credible ISL recognizer

## What the experiments established

The small causal TCN is a baseline. It is not ready for deployment. On the same
96 validation sequences, motion adaptation reduced word error rate from 73.45%
to 70.80%, while exact sentences stayed at 1/96. The first test split was
inspected and is no longer an untouched holdout for subsequent design decisions.

The actual continuous supervision consists of 473 eligible clips and 164 gloss
types. Of those types, 116 occur in at most five training clips; the median is
five. The additional 1,988 iSign clips were used for masked motion adaptation,
not new gold gloss supervision. English translation captions cannot silently
be substituted for sign-order annotations.

The tiny-set diagnostic deliberately memorized 12 training-only sequences,
covering 42 gloss tokens, with zero word errors. It passed after 140 updates in
about two seconds on MPS. This confirms that this configuration can optimize
and decode those training sequences. It does not prove the implementation is
free of all defects or that predictions generalize.

The current representation discards raw image appearance and landmark depth,
retaining normalized 2D coordinates and masks. That makes a richer video model
worth testing. It does not establish that a different encoder alone fixes the
label scarcity or webcam domain gap.

## Next gates, in order

1. **Audit annotations and capture.** Review suspicious gloss punctuation,
   parenthetical tokens and inconsistent word segmentation with ISL expertise.
   Preserve publisher originals and log every correction. Use original video
   timestamps for temporal models. Record blur, occlusion and hand visibility;
   keep enough hand-image resolution for the supported vocabulary.
2. **Build a bounded pilot benchmark.** Start with 30-50 useful lexical signs,
   unknown signs, non-signing activity and continuous phrases. Reserve new
   signers and new sentences before tuning. See `acceptance-targets.json`.
   Public dictionary clips and video-ID splits support development but do not
   replace verified signer separation and fresh webcam evaluation.
3. **Compare stronger visual baselines.** Benchmark the downloaded OpenHands
   isolated-sign model as a limited-vocabulary control. Evaluate a pretrained
   RGB-plus-keypoint visual backbone with an ISL-specific head. The official
   [TwoStream and online SLR implementations](https://github.com/FangyunWei/SLRT)
   are reference candidates; their published non-ISL checkpoints are not ready
   ISL recognizers. Verify checkpoint availability, dependencies and reuse terms
   before integration. A cloud vision model is another benchmark candidate,
   not an assumed replacement for a task-trained recognizer.
4. **Match training objectives to labels.** Train gloss recognition on verified
   gloss sequences; use iSign translation pairs for representation learning or
   a separately evaluated video-to-English decoder. [iSign](https://aclanthology.org/2024.findings-acl.643/)
   explicitly supports distinct video/pose translation and word-related tasks.
   Do not report translation fluency as exact sign recognition.
5. **Make inference explicitly streaming.** Reuse frame features, bound queues,
   measure end-to-end timing and preserve word boundaries and repeated words.
   Compare a stronger full-context teacher with a small streaming student when
   training data supports that experiment. A model requiring an entire clip
   cannot be reported as low-latency solely from its GPU forward-pass time.
6. **Calibrate and reject.** Include no-sign and unknown-sign evaluation, tune
   confidence only on development data, and measure both accepted precision
   and supported-sign recall. Show uncertain candidates without automatic
   insertion. Keep raw recognized glosses separate from Azure/Groq language
   suggestions so rewriting cannot hide visual errors.
7. **Promote only after acceptance.** Score precision, recall, word errors,
   false insertions and latency by signer, class and speed. No current
   checkpoint satisfies the proposed acceptance targets.

## Work that requires real language evidence

Implementation, data tools, experiments and automated evaluation can be built
autonomously. Verified new-signer recordings and judgement of actual ISL forms,
regional variants and gloss annotations require people with that knowledge.
Automated pseudo-labels can assist review but are not independent ground truth.

Avatar output has a separate acceptance path: obtain a reference-backed motion
for the intended meaning, retarget hands/body/face, and review the result. Adding
camera training data or a text alias does not create a correct avatar animation.

## Immediate next deliverable

A benchmark manifest and candidate comparison for a bounded ISL pilot, with
annotated failure cases and explicit operating conditions. Select the next
architecture from measured evidence before expanding downloads or paying for
larger GPU training. No further short training run should be presented as a
promise of near-perfect open-ended ISL recognition.
