# AI / ML Pipeline

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

**Bottom line:** this repo contains **no sign-recognition model**. It contains (a) on-device MediaPipe landmark tracking, (b) a client for an external recogniser, (c) two rule-based translation engines, (d) an optional LLM (Gemini) translation path, and (e) browser speech APIs. Landmark tracking is **not** sign understanding.

## 1. Camera → landmarks (on-device)

**INPUT** webcam → **PRE** `ImageBitmap` → **MODEL** MediaPipe Hand + Pose landmarkers → **POST** assignment, aspect fix, One-Euro smoothing → **OUTPUT** 141-float vector + overlay points.

| Step | Where | Detail |
|---|---|---|
| Permission & start | `services/camera/useCameraTracking.ts` `start()` | Nothing runs until the user presses Start. `getUserMedia({video:{facingMode:"user" \| deviceId, 1280×720 ideal}, audio:false})`. Errors mapped to `denied/unavailable/in-use/error`; a missing saved camera falls back to default. |
| Frame capture | same, `tick()` rAF loop | ≤30 fps (`DETECT_INTERVAL_MS`), one frame in flight (`pendingRef`), `createImageBitmap(video)` transferred to the worker. Monotonic integer timestamps. Raw (un-mirrored) frame; preview is mirrored by CSS. |
| Worker init | `engine/workers/mediapipe.worker.ts` `init()` | `FilesetResolver.forVisionTasks('/mediapipe/wasm')`; evals the wasm loader into worker scope before each `createFromOptions` (module-worker workaround); `HandLandmarker` (2 hands) + `PoseLandmarker` lite (1 pose), `runningMode:"VIDEO"`, all confidences **0.3** (justified in a header comment with measurements); **GPU** delegate, fallback **CPU**. Models from `/models/*.task`. **Verified:** both graphs start (WebGL2) in Chromium. |
| Detection | `detect()` | `detectForVideo` on hand and pose; bitmap closed. |
| Hand assignment | `engine/tracking.ts` `HandAssigner` | Trusts MediaPipe `Left/Right` label unless it contradicts one-frame continuity; tracks per-block gap counts. |
| Frame assembly | `tracking.ts` `assembleFrame` | 141 floats (see contract below), x multiplied by `aspectScale(w,h) = (w/h)/(16/9)`. |
| Smoothing | `tracking.ts` `FrameSmoother` | One-Euro per channel; hands `minCutoff 1.7, beta 0.35`; body `0.6, 0.06`; presence-aware (absent block stays zeros, reappearing block restarts). |
| Body gate | worker | `body = shoulders 11 & 12 visibility ≥ 0.5`. Vectors are forwarded only when `body` is true. |
| Extra outputs | worker | `world` (126 metric hand landmarks), `pose` (13-point avatar pose, 39 floats), `motion` (MotionEnergy), `inferMs` — **computed every frame but unused by the main thread** (intended for a live-mirroring avatar that is not wired up). |
| Overlay | `useCameraTracking.drawOverlay` | Draws the *smoothed* landmarks: white under-stroke + royal (left) / gold (right). |

### The 141-float contract — `src/engine/landmarks.ts`
```
[  0: 63] Left hand  21 × (x,y,z)  normalised image coords (result.landmarks, NOT worldLandmarks)
[ 63:126] Right hand 21 × (x,y,z)
[126:141] Pose: nose(0), L shoulder(11), R shoulder(12), L elbow(13), R elbow(14)
absent block = zeros; raw values — normalisation happens server-side
```
Documented as a line-by-line mirror of `ml/collect.py` (absent). `buildFrameVector()` in this file is the reference implementation but runtime uses `tracking.assembleFrame`. Changing either side silently breaks the model.

## 2. Recognition (external)

- Client: `services/recognition/useRecognitionService.ts` (protocol in `BACKEND.md`).
- Decision logic is entirely server-side: 30-frame window (~2 s @15 fps), confidence threshold (client-set, default **0.85**), stability over 3 predictions, verified-list gate, "rest" reject class, "already-emitted" de-dup. The client never promotes a candidate.
- Metrics shipped in `public/signs/recognition.json` (produced by absent `ml/evaluate.py`): **242 classes, top-1 0.382, top-3 0.4506, gated precision 0.7717**, 37 "reliable" labels (36 excluding `rest`), 124 "measured".
- **Type:** isolated-sign classification (BiLSTM per Help page text). **Not** continuous recognition: no client segmentation; `MotionEnergy` exists for boundary detection but nothing consumes it.
- **Status:** implemented-but-unverified; absent dependency.

## 3. Gloss → English (Sign → Text output) — `src/engine/isl/grammar.ts`

`toEnglish(glosses)`: rule-based parse of ISL gloss (time, interjections, subject, objects, verb, modal, negation, WH-question) using `vocabulary.generated.ts` (239 glosses, POS, English surfaces) → tense from time word, do-support, articles, possessives ("YOU NAME" → "your name"), destination prepositions, "X PAIN" → "X hurts", question formation. Pure function, deterministic. The same file's `toGloss()` (English → gloss with per-token non-manual markers) is **not used anywhere**.

## 4. Text → gloss (Speech → Sign input)

### Offline (default) — `src/translation/`
- `islTranslator.translateOffline(text)` → `textToGloss(text)` → `sanitizeTokens`.
- `textToGloss.js`: split into sentences on `. ? ! ; newline । ॥` (commas do **not** split); Devanagari sentences → `hindiToGloss.hindiSentenceToGloss` (lexicon + suffix stripping + transliteration for names); English → contraction expansion, phrase dictionary (e.g. "how r u" → `YOU HOW`), lemmatisation (irregular verbs, plurals, suffix stems), classification (time / pronoun / question / negation / verb / noun), reorder **TIME → SUBJECT → OBJECT → VERB → NEGATION(`NO`) → WH**, drop stopwords/copulas, map pronouns (`me→I`, `he/she/they→PERSON` per prompt), numbers → digit spelling.
- `sanitizeTokens`: keep `SUPPORTED_TOKENS` and fingerspell tokens; anything else is spelled letter-by-letter (`WEATHER` → `W-E-A-T-H-E-R`). So **every word is playable**; nothing is dropped except non-Latin/Devanagari script words (`skipped`).
- Verified samples (run via Node):
  - "Where is the hospital?" → `HOSPITAL WHERE`
  - "I do not understand" → `I UNDERSTAND NO`
  - "What is your name?" → `YOUR NAME WHAT`
  - "मुझे पानी चाहिए" → `I WATER NEED`
  - "My name is Amit, I need a doctor tomorrow" → `T-O-M-O-R-R-O-W MY I NAME A-M-I-T DOCTOR NEED` (comma-joined clauses mix; `TOMORROW` has no sign → spelled)
  - "The weather is nice today" → `T-O-D-A-Y W-E-A-T-H-E-R N-I-C-E`

### Online (optional) — Gemini
`server/translationApi.js` + `translationPrompt.js`, `temperature 0`, JSON-schema-constrained `string[]`, output re-sanitised. Falls back to offline on any failure or after 3 s (client) / 6 s (server). **Unverified** (no key).

## 5. Speech

- **STT**: `useSpeechInput` → Web Speech API, languages `en-IN/en-US/en-GB/hi-IN`, single utterance, interim text shown in the composer. In Chrome audio is processed by Google's servers (noted in code/UI). Not in Firefox. **Not runtime-tested** (no microphone in the test pane).
- **TTS**: `useSpeechOutput` → `speechSynthesis`, saved voice or first `en-IN`. Voices enumerated in Settings (**verified** list renders).
- `src/translation/liveSpeech.js` (incremental live-commit logic for streaming speech into the avatar) and `schedule.js`'s `append` mode are tested but **not wired to any UI**.

## 6. Model assets

| Asset | Path | Size | Loaded by | Notes |
|---|---|---|---|---|
| Hand landmarker | `public/models/hand_landmarker.task` | 7.5 MB | worker | committed; "must be byte-identical" to training |
| Pose landmarker lite | `public/models/pose_landmarker_lite.task` | 5.5 MB | worker | committed |
| MediaPipe wasm | `public/mediapipe/wasm/*` (6 files, ~33 MB) | — | worker | copied from `node_modules` by `scripts/copy-assets.mjs`; gitignored |
| Recognition model | — | — | external service | **absent** |
| Sign motion library | `public/signs/*.json` | 4 files | landing illustrations | manifest lists 239 signs; only `hello, pain, welcome, where` shipped |

## Missing capabilities (evidence-based)

- No in-repo recogniser, no training code, no dataset (only references to `ml/`).
- No continuous signing / segmentation; no sentence-level recognition.
- No facial grammar recognition (pose uses nose only; no face landmarker).
- No facial grammar generation on the avatar (no morph targets; `nonManual.ts` unused).
- Live camera → avatar mirroring is half-built in the worker (world/pose outputs) but has no consumer.

## 7. Practice comparison (Learn, added 2026-11-20)
On-device, rule-based comparison of a learner's tracked signing with an ISLRTC recording: shared format-2 frames, shoulder-relative positions, finger-curl and palm-normal hand shape, DTW alignment, calibrated score, and plain-language tips. Not a recogniser and not ML. Method and calibration numbers are in `LEARN.md`.
