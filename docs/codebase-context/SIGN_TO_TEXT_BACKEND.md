# Sign → Text backend: recognizer and sentence API

The two contracts the Sign → Text page relies on. The redesigned UI already uses
both: the recognizer through `useRecognitionService`, and the sentence API through
`useSignSentence` (English / हिन्दी toggle in the sentence card).

## 1. Word recognizer (WebSocket, unchanged contract)

`backend/` loads, in order of preference (`PARLANCE_RECOGNIZER=auto|hybrid|transformer|forest`):

- **hybrid** (default when `onnxruntime` is installed): the ISL transformer
  (`backend/models/isl-transformer.onnx`, 475 ISL500 words) decides and is the only
  model that may commit a word automatically. When it is not confident, the original
  forest adds up to two **suggestions** for the 80 everyday words ISL500 lacks
  (sorry, want, understand, name, come, stop, …). Those always need a tap.
- **forest**: the original Yap & Render temporal forest, used when `onnxruntime` is missing.

The WebSocket messages are identical to before: the browser sends the same 141-float
frames, and the server replies with the same `word`, `candidate`, `suggestions` and
`model` fields. What changes:

- `model.name` is `"Parlance ISL transformer + forest suggestions"`; `model.classes`
  is 555; `model.suggestOnly` lists the forest-only words.
- `model.automatic` lists the words allowed to commit automatically (about 290, up from 52).
- **Commit on release.** Sign one word, then lower your hands: the transformer commits
  when the hands drop (about 220 ms) if it is confident, instead of waiting for a still hold
  that many signs never have. Uncertain signs still arrive as suggestions to tap.
- **Dropout rejoin.** If tracking loses the hands mid-sign and they return within 500 ms,
  with nothing written yet, it is treated as the same sign (`releaseMs` / `rejoinMs` in
  `backend/models/isl-transformer.json`).
- The shipped model is a two-model ensemble (`ens2`); see the results file for numbers.
- **Longest window.** The transformer decides on the whole sign since the hands rose;
  shorter partial windows used to win with confident wrong answers.
- Words are lowercase gloss keys with spaces and underscores removed, as before
  (`thankyou`, `bandaid`, `washface`). Many are new to `public/signs`, so `glossLabel()`
  falls back to the uppercased key until the manifest gains an `english` entry.

Install: `python -m pip install -r backend/requirements.txt` (adds `onnxruntime`).
Measured accuracy and how it was measured: `training/TRANSFORMER_RESULTS.md`.

## 2. Natural sentence: `POST /api/sign-sentence`

Turns recognised signs, in signing order, into one natural English or Hindi
sentence. It runs in the Vite dev/preview middleware (`server/signSentenceApi.js`)
and uses the existing `GEMINI_API_KEY`. `GET /api/config` → `{ online: true }`
says whether it is available.

Request:

```json
{ "glosses": ["i", "water", "need"], "language": "hi" }
```

- `glosses`: 1–30 strings matching `^[a-z0-9]{1,24}$` (the recognizer's words).
- `language`: `"en"` or `"hi"` (Hindi is returned in Devanagari).

Responses:

| Status | Body | Meaning |
| --- | --- | --- |
| 200 | `{ "text": "मुझे पानी चाहिए।", "language": "hi" }` | Use it |
| 422 | `{}` | The model's rewrite dropped a negation or a number, so it was refused. Keep the rule-based sentence |
| 400 / 413 | `{}` | Bad request |
| 429 | `{}` + `Retry-After` | Rate limited (60/min per address, 4 concurrent) |
| 503 | `{ "error": … }` | No `GEMINI_API_KEY`: offline |
| 502 | `{}` | Provider error or timeout (5 s) |

Suggested UI behaviour (not implemented here):

- Always show the offline `toEnglish(glosses)` from `src/engine/isl/grammar.ts` immediately.
- About 400 ms after the last accepted sign, request the natural sentence. Show it
  only if it is still for the same glosses.
- Label it as AI-written and keep the word-by-word signs visible.
- Hindi has no offline fallback; show English when the API is unavailable.

The meaning checks live in `server/signSentence.js`, with tests in `test/signSentence.test.js`.

## 3. Video sign reading (experimental): `/api/sign-video`

"Read signs from video" on the Sign → Text page (off by default, `settings.videoAI`).
When it is on, the page keeps the last 6 s of camera frames in memory (8 per second,
512 px JPEG, `useSignClips` in `src/services/recognition/videoSign.ts`). When the
recognizer finishes a sign it now sends `span: [start, end]` (the sign's first and
last frame, in the `timestamp`s the browser sent). The page sends up to 12 frames
from that span, plus the hand model's best guesses as hints, to `POST /api/sign-video`,
and the vision model's word goes into the sentence. The hand model's own automatic
word is used only if the video request fails; tapped suggestions still work.

Provider (`server/signVideoApi.js`): Gemini when `GEMINI_API_KEY` is set
(`GEMINI_SIGN_MODEL`, default `gemini-2.5-flash`; `GEMINI_SIGN_THINKING`, default 512),
otherwise the `AZURE_OPENAI_*` vision deployment. `GET /api/sign-video` →
`{available, provider}`. The answer must be one of the 629 words the bundled models
know (`server/signVideo.js`), or nothing. Frames are not stored. 40 requests/min per
address, 3 at once, 30 s timeout.

Measured on 35 ISL500 clips of two signers the hand model never saw
(`training/benchmark_sign_video.mjs`), Azure vision deployment:

| Input | Correct |
| --- | --- |
| Video frames only | 1 / 34 |
| Video frames + hand-model hints | 25 / 35 |
| Hand model alone (top guess) | 27 / 35 |

Through the real app (same 35 videos played as the webcam in headless Chrome, video
reading on): **30 written correctly, 1 wrong (noon → sun), 4 not read**, median 3.9 s per
sign (max 7.5 s). With video reading off, the hand model writes 16 of these automatically
and offers 13 more as suggestions to tap.

So far the vision model mostly confirms the hand model's best guess rather than reading
the sign on its own; its gain is that it writes the word without a tap. Gemini has not been
measured here (no key); run the benchmark with `GEMINI_API_KEY` set before relying on it.
