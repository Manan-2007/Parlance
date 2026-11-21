# Backend

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

## Summary

There is **no standalone backend** in this repository. Two server-side pieces exist:

1. **`server/` — a Vite middleware** (in this repo) providing optional Gemini translation. It is mounted in `vite.config.ts` via `configureServer` and `configurePreviewServer`, so it only exists while `npm run dev` or `npm run start` (`vite preview`) is running. A static deploy of `dist/` has **no `/api`**; the client then silently uses the offline engine (because `/api/config` fails → `online=false`).
2. **The ISL recognition service ("VOX")** — an **external** FastAPI app with a BiLSTM model, expected at `ws://localhost:8000/ws`. Only its client and protocol live here. Its source, model files and the `ml/*.py` training scripts referenced in comments are **not in this repo**.

## `server/translationApi.js`

Connect-style `(req, res, next)` handler. Reads `process.env.GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-2.5-flash`) **at module load** (Node gets them from `--env-file-if-exists=.env` in the npm scripts).

| Route | Purpose | Input | Processing | Output | Status |
|---|---|---|---|---|---|
| `GET /api/config` | Tell the client whether online translation is on | — | `Boolean(apiKey)` | `200 {online:boolean}` | **Verified** (`{"online":false}` without key) |
| `POST /api/translate-isl` | English/Hindi → ISL gloss tokens via Gemini | JSON `{text}` ≤ 8192 bytes body, text ≤ 600 chars | rate limit 30/min per `socket.remoteAddress`; ≤4 concurrent provider calls; `fetch` Gemini `v1beta/models/{model}:generateContent` with `systemInstruction` = `SYSTEM_INSTRUCTION`, `temperature 0`, JSON schema `string[]`, 6 s timeout, aborted if client disconnects; output parsed and passed through `sanitizeTokens` | `200 {tokens}`; `422 {tokens:[]}` if empty; `400` bad body; `413` too large; `429` (+`Retry-After`); `502` provider/parse error; `503 {tokens:[],error}` no key | `503` path **verified**; Gemini path **unverified** (no key) |

### `server/translationPrompt.js`
System prompt: ISL grammar rules (time first, SOV, drop articles/copulas, negation `NO` at clause end, WH-words last), the exact `SUPPORTED_TOKENS` list, synonym mapping hints, fingerspelling `A-M-I-T` format for names/unknowns, numbers as hyphenated digits, JSON-array-only output.

### `server/apiGuard.js`
- `readBodyText(request, maxBytes)` — rejects by `content-length` or by streaming count (`BodyTooLargeError`).
- `createRateLimiter({limit, windowMs, maxKeys=5000})` — fixed window, in-memory, per instance; refuses when key table is full.
- `createConcurrencyLimit(max)` — returns a one-shot release function or `null`.

### Client side of this API — `src/translation/islTranslator.js`
`translateToGloss(text, signal)`: offline if `navigator.onLine===false` or text > 600 chars; otherwise `POST /api/translate-isl` with a **3 s** client timeout; any failure/empty → `translateOffline`. Throws `TranslationAbortedError` only when the caller's signal aborts. `prepareSpeech` only calls it when `/api/config` said `online:true` (checked once per page load).

## External recognition service protocol (client view)

Implemented in `src/services/recognition/useRecognitionService.ts`; the frame layout in `src/engine/landmarks.ts`.

| Direction | Message | Meaning |
|---|---|---|
| → | `{"config":{"confidence_threshold":0.85}}` | on open and whenever the slider changes |
| → | `{"landmarks":[141 floats]}` | one smoothed frame, ≤15 fps, only while recognising and the pose model sees both shoulders |
| ← | `{"word":"hello","confidence":0.93}` | accepted sign (server applies threshold + 3-prediction stability + verified-list gate) |
| ← | `{"status":"listening","candidate":"x","confidence":n,"stable_for":k,"reason":"low-confidence\|unverified\|unstable\|already-emitted\|resting"}` | candidate, never shown as a result |
| ← | `{"status":"listening","buffered":n,"needed":30}` | window filling |
| ← | `{"status":"no-model"}` | service up without a trained model |
| ← | `{"error":"…"}` | frame rejected |

Frame vector: `[0:63]` left hand 21×(x,y,z) normalised image coords, `[63:126]` right hand, `[126:141]` pose nose, L/R shoulder, L/R elbow. Hands assigned by MediaPipe handedness with continuity (`HandAssigner`), x rescaled to 16:9 reference geometry (`aspectScale`), One-Euro smoothed (`FrameSmoother`). Normalisation is explicitly the server's job (`ml/normalize.py`, absent).

**Status: implemented, unverified** — no service available to test against. Connection failure handling **verified** (offline state, auto-retry, console WS errors).

## Database, auth, logging
None. No database or ORM; persistence is browser storage only. No authentication. Server logging is none beyond Vite's own; client uses `console.warn` in the translator and avatar loader.
