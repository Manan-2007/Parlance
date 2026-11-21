# Setup and Run

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

## Prerequisites
- **Node.js ≥ 22.18** (`engines`; scripts use `node --env-file-if-exists`, and tests import TypeScript directly). Verified with Node v26.13.1, npm 11.20.0.
- **npm** (lockfile `package-lock.json`).
- A Chromium-based browser or Safari for voice input; WebGL2 for the avatar and MediaPipe GPU delegate (CPU fallback exists).
- Optional: a Google Gemini API key. Optional: the external VOX recognition service (Python/FastAPI, not in this repo) for Sign → Text.

## Install
```bash
npm ci
```
Verified: 63 packages, 0 vulnerabilities. npm warns that `fsevents` install scripts are not in `allowScripts` (harmless on macOS).

## Environment variables (names only)
| Name | Where read | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `server/translationApi.js` (Node, at Vite start) | enables `/api/translate-isl` |
| `GEMINI_MODEL` | same | defaults to `gemini-2.5-flash` |
| `PARLANCE_PORT` | `vite.config.ts` | dev/preview port, default 4173 (`strictPort`) |
| `VITE_PARLANCE_WS` | `src/stores/settings.ts` (build time) | default recogniser URL, else `ws://localhost:8000/ws` (not listed in `.env.example`) |

Copy `.env.example` → `.env` to use them. `.env` is gitignored.

## Commands
| Command | What it does | Verified result |
|---|---|---|
| `npm run dev` | `predev` copies MediaPipe wasm → `public/mediapipe/wasm`; starts Vite on `http://127.0.0.1:4173` with the `/api` middleware | ✅ starts; app works at `http://localhost:4173` |
| `npm test` | `node --test` → `test/signing.test.js`, `test/learn.test.js` | ✅ 18/18 pass (2026-11-20) |
| `npm run typecheck` | `tsc -b` | ✅ (fixed 2026-11-20) |
| `npm run build` | `prebuild` copy → `tsc -b && vite build` | ✅ (fixed 2026-11-20) |
| `npm run start` | `vite preview` of `dist/` with `/api` middleware | not run |
| lint | — | no linter configured |

## Running Sign → Text recognition
Per `src/features/help/HelpPage.tsx` ("Running the recognition service"), from the separate VOX project folder:
```bash
source venv/bin/activate
```
```bash
uvicorn backend.main:app --port 8000
```
Then set the URL under Settings → Camera and microphone if it is not `ws://localhost:8000/ws`. The VOX project, its model and the `ml/` scripts referenced in comments are **not** in this repository.

## Known setup problems
1. ~~`npm run build` / `typecheck` broken by an unused file~~ — fixed 2026-11-20.
2. `public/mediapipe/wasm/` must exist before the camera can start; it is created by `predev`/`prebuild`. Running `vite` directly without those hooks leaves it missing on a fresh clone.
3. The `/api` routes exist only under `vite`/`vite preview`. Static hosting of `dist/` → offline translation only (works, by design of the fallback).
4. Vite binds to `127.0.0.1` only (not LAN-accessible) — intentional in `vite.config.ts`.
5. Default recogniser URL is `ws://` — an HTTPS deployment would need `wss://` (mixed-content block).

## Verified runtime behaviour (2026-11-19, built-in Chromium pane)
- Landing renders; Remy loads and signs the demo loop.
- `/api/config` → `{"online":false}`; `/api/translate-isl` → `503` without a key; client used the offline engine.
- Speech → Sign: "My name is Amit, I need a doctor tomorrow" → `T-O-M-O-R-R-O-W MY I NAME A-M-I-T DOCTOR NEED`, avatar played 7 segments; History recorded it.
- Sign → Text: page renders; WS to `ws://localhost:8000/ws` fails ×5 then gives up; "Recognition service offline" state shown; Start camera → MediaPipe worker initialised both graphs, camera denied by the pane → "Camera access is blocked" state.
- 375 px viewport: Speech → Sign has no horizontal scroll; mobile tab bar present.
- Not tested: microphone, real camera frames, TTS audio, Gemini, recognition, `vite preview`.

## Learn data and calibration (2026-11-20)
- `node scripts/sync-islrtc-signs.mjs "<path to a VOX checkout>"` re-imports the 239 ISLRTC motion files into `public/signs/` and regenerates `public/signs/sources.json` (official video ids).
- `node scripts/calibrate-practice.mjs "<path to a VOX checkout>"` re-checks the practice comparison (robustness on distorted references; INCLUDE clips by other signers from VOX `ml/data`). Without a path it runs only the robustness part.
- Running VOX for Sign → Text: in the VOX checkout, `./venv/bin/uvicorn backend.main:app --port 8000` (model `ml/models/vox_lstm.keras`). VOX's own `backend/test_client.py` is out of date (sends 126 floats; the service expects 141).
