# Development Handoff — read this first

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

Written 2026-11-19 against commit `00a0efe` (`main`; only 2 commits exist, both by the same author on 2026-11-19). Sibling docs in this folder go deeper; this one is meant to restore working context on its own.

## 0b. Update — Phase 3 (2026-11-20, branch `manan-work`)
- Sign checks by fluent signers (`/app/learn/check-signs`, shared by link or file) with status shown across the app, "Sign to the reader" practice against VOX, and a practice log with tip feedback (Settings → Learning). See the Phase 3 section of `LEARN.md`. 29 tests pass.

## 0a. Update — Phase 2 (2026-11-20, branch `manan-work`)
- Teach (record signs, build and share decks), deck lessons, practise together and fingerspelling were added. See the Phase 2 section of `LEARN.md`.
- Recordings and decks are stored in IndexedDB (`src/stores/teach.ts`). Shared decks travel in the link fragment or a file, with no server.
- 25 tests pass. Real-camera recording and practice are still untested.

## 0. Update — 2026-11-20 (Phase 1, committed on `manan-work`)
- **Learn** was added and is now the default `/app` route. Parlance is framed as a place to **learn and translate** ISL. Full design, files and scoring method: `LEARN.md`.
- All 239 ISLRTC motion files were imported from VOX (`scripts/sync-islrtc-signs.mjs`), plus `public/signs/sources.json` with official video ids.
- `npm run build` is green: the unused `src/engine/core/*` and `src/engine/tracking/handConditioner.ts` were removed (C-1).
- Camera robustness fixes in `useCameraTracking.ts`: a frame error no longer stalls capture (M-1); a failed tracker start can be retried (M-2). It also gained an optional `onResult` callback (used by practice).
- Tests: 18 (`test/signing.test.js` + `test/learn.test.js`); Node ≥ 22.18 because tests import `.ts`.
- VOX lives in a separate repo (github.com/Manan-2007/Vox). A local checkout starts and accepts frames; Parlance's live camera path to it is still untested.
- **Untested:** live webcam practice (capture, auto start/stop, real scores and tips). Try it with a real camera before relying on it.

## 1. What Parlance is
A browser app for two-way communication between hearing people and Indian Sign Language users:
- **Speech → Sign** (works): English/Hindi text or voice → ISL gloss → a 3D avatar (Remy) signs it.
- **Sign → Text** (client only): webcam → on-device MediaPipe landmarks → external recogniser over WebSocket → words → English sentence → optional speech.
Plus a landing page with a live avatar demo, History, Settings, Help.

## 2. What the repo contains
A single Vite 8 / React 19 / TypeScript SPA (Tailwind 4, zustand, three.js, MediaPipe tasks-vision). A small Node middleware in `server/` runs inside Vite for optional Gemini translation. **No** database, auth, production server, recognition model, or training code. Large binaries are committed in `public/` (Remy/YBot GLB, MediaPipe `.task` models, 4 ISLRTC landmark recordings).

## 3. How the major systems work (one paragraph each)
- **Text → gloss** (`src/translation/`): `prepareSpeech()` asks `/api/config` once; if online, POSTs to `/api/translate-isl` (Gemini, schema-constrained), else/fallback runs `translateOffline()` → `textToGloss()` (rule-based English + Hindi lexicon; time → subject → object → verb → `NO` → WH). `sanitizeTokens()` guarantees every token is either one of 164 `SUPPORTED_TOKENS` or a fingerspell token like `A-M-I-T` / `1-1-2`.
- **Avatar** (`src/avatar/`): `scheduleSigns()` maps tokens to procedural tables (`animations/words.js`, `Alphabets/`, `numbers.js`) → frames of Euler bone targets (authored on YBot axes) → `compileMotion()` (timed, quintic-Hermite, holds, velocity-joining) → `player.js` rAF loop retargets onto Remy (`rest · inv(bindWorld) · R(delta) · bindWorld`) and renders on demand. React wrapper: `components/avatar/AvatarViewport.tsx`.
- **Camera tracking** (`services/camera/useCameraTracking.ts` + `engine/workers/mediapipe.worker.ts` + `engine/tracking.ts`): Start → getUserMedia → ≤30 fps bitmaps to worker → Hand+Pose landmarkers (conf 0.3, GPU→CPU) → hand assignment with continuity → 141-float vector (16:9 aspect fix) → One-Euro smoothing → back to main thread → overlay + forward to recogniser at ≤15 fps when shoulders visible.
- **Recognition client** (`services/recognition/useRecognitionService.ts`): WS JSON protocol (see BACKEND.md); server decides; client shows accepted words, buffering, and rejected candidates with reasons; never promotes a candidate.
- **Gloss → English** (`engine/isl/grammar.ts#toEnglish`): rule-based sentence realisation from recognised lowercase glosses.
- **State** (`src/stores/`): zustand settings (localStorage) and history (session/localStorage per retention).

## 4. Entry points & key files
| Concern | File |
|---|---|
| App bootstrap / routes | `src/main.tsx`, `src/app/router.tsx`, `src/app/AppShell.tsx` |
| Speech → Sign page | `src/features/speech-to-sign/SpeechToSignPage.tsx` (+ `SignerStage.tsx`, `ConversationPanel.tsx`) |
| Sign → Text page | `src/features/sign-to-text/SignToTextPage.tsx` (+ `CameraStage.tsx`, `RecognitionReadout.tsx`, `SentencePanel.tsx`) |
| Translator | `src/translation/islTranslator.js`, `textToGloss.js`, `hindiToGloss.js`, `islVocabulary.js` |
| Avatar | `src/avatar/player.js`, `schedule.js`, `poseMotion.js`, `signQueue.js`, `animations/words.js` |
| Camera / worker | `src/services/camera/useCameraTracking.ts`, `src/engine/workers/mediapipe.worker.ts`, `src/engine/tracking.ts`, `src/engine/landmarks.ts` |
| Recognition client | `src/services/recognition/useRecognitionService.ts` |
| Gemini API | `server/translationApi.js`, `server/translationPrompt.js`, `server/apiGuard.js`, `vite.config.ts` |
| Design tokens | `src/styles/index.css` |
| Tests | `test/signing.test.js` |

## 5. Working (verified in a browser or by tests)
Landing + live avatar demo; routing; Speech → Sign with typed English (offline engine) incl. fingerspelling/digits; History recording; Settings/Help rendering; `/api/config` + 503 fallback; recogniser-offline UI + retry; camera-denied UI; MediaPipe worker initialisation; 7/7 unit tests; `vite build` (bundle only); no horizontal overflow at 375 px on Speech → Sign.

## 6. Implemented but unverified / incomplete
Voice input & TTS (no mic/audio in test env); live camera tracking with real frames; Gemini path; ISL recognition (needs external VOX service); `toEnglish` (no tests); avatar controls individually; `vite preview`.

## 7. Mocked / demo-ish / half-wired
Nothing returns hard-coded predictions. Half-wired: worker's `world`/`pose`/`motion` outputs (intended live avatar mirroring), `liveSpeech.js` + `schedule.js` append mode (live speech signing), `grammar.toGloss` + `nonManual.ts` (facial grammar markers), `MotionEnergy` (continuous segmentation). Landing illustrations use only 4 of 239 manifest signs.

## 8. Patterns to preserve
- Consent-first media (nothing starts until the user acts); explicit status enums for every failure; release streams/workers/WebGL on unmount.
- Heavy work off the main thread; single frame in flight; transferables.
- The **141-float frame contract** and MediaPipe model files are coupled to the external model — do not change layout, smoothing order, aspect handling or `.task` files without retraining/parity tests.
- Translation always resolves to playable tokens (offline fallback, `sanitizeTokens`); avatar never stalls.
- Queue identity semantics: a new array passed to `AvatarViewport` restarts playback; replacing mid-phrase blends from the current pose.
- Render-on-demand avatar loop and off-screen suspension.
- Accessibility conventions: `announce()` for SR, `role=status`/`aria-live`, reduced-motion & text-size attributes, captions.
- Design tokens/brand (navy/royal/gold, Geist, Arcs motif) — don't change UI without being asked.
- Lazy route chunks; three.js manual chunk.

## 9. Architectural constraints
- Two gloss vocabularies (avatar UPPER_SNAKE 164 vs ISLRTC lowercase 239) with no mapping.
- `/api` exists only inside the Vite dev/preview server.
- Avatar tables are authored in YBot bone axes; Remy has no morph targets (no facial animation possible without a new asset).
- JS modules typed by hand-written `.d.ts`; `tsconfig.app.json` is strict with `noUnusedLocals/Parameters` and includes all of `src/`.
- Recognition decisions (threshold semantics, stability, verified list) live server-side, outside this repo.

## 10. Important bugs & risks (see CODEBASE_AUDIT.md)
1. ~~**C-1** build failure~~ — fixed 2026-11-20.
2. **H-1** Sign → Text needs an external service not in the repo.
3. **H-2** Duplicate translation engines/vocabularies.
4. **H-3** All sign animations unreviewed by ISL signers.
5. ~~**M-1** capture stall on worker error~~ — fixed 2026-11-20.
6. ~~**M-2** tracker init retry~~ — fixed 2026-11-20.
7. **M-3** Commas don't split clauses in the offline translator.

## 11. Verification results (2026-11-19)
`npm ci` ✅ · `npm test` ✅ 7/7 · `npm run build` ❌ (C-1) · `vite build` ✅ · `npm run dev` ✅ · browser: landing ✅, Speech → Sign typed ✅, History ✅, Settings/Help ✅, Sign → Text offline/denied states ✅, MediaPipe init ✅; mic/camera/TTS/Gemini/recognition not testable here.

## 12. Recommended next priorities (not started)
1. Fix C-1 (remove/exclude dead `engine/core/*` + `handConditioner.ts`, or local type) so `npm run build` is green; add ESLint.
2. Decide the Sign → Text strategy: vendor/locate the VOX service, or add a mock WS server for UI development; add a frame-contract parity test.
3. Fix M-1/M-2 camera robustness.
4. Unify vocabulary/grammar (one gloss set + mapping; tests for `toEnglish`); improve clause splitting and add signs for high-frequency fingerspelled words (TODAY, TOMORROW, NOW…).
5. ISL signer review loop for animations; consider wiring non-manual markers (needs a rig with blendshapes).
6. Decide production hosting for `/api` (serverless function or small Node server) if Gemini is wanted outside dev.
7. Prune or finish half-wired features (live mirroring, live speech, continuous segmentation).

## 13. Commands
```bash
npm ci
```
```bash
npm run dev
```
```bash
npm test
```
```bash
npm run build
```
Bundle-only build while C-1 is open:
```bash
node node_modules/vite/bin/vite.js build
```
App: http://localhost:4173 (Vite binds 127.0.0.1). Optional `.env`: `GEMINI_API_KEY`, `GEMINI_MODEL`, `PARLANCE_PORT`, `VITE_PARLANCE_WS`.

## 14. Before you edit
- Read the header comments in `mediapipe.worker.ts`, `landmarks.ts`, `tracking.ts`, `grammar.ts`, `poseMotion.js` — they encode measured decisions.
- Adding a word sign = add the table in `animations/Words/*.js`, export it from `animations/words.js`, add the token to `SUPPORTED_TOKENS` (`islVocabulary.js`; this also updates the Gemini prompt and Help page), map English words in `textToGloss.js`/`hindiToGloss.js`; `npm test` checks joints exist on both rigs and return to rest.
- Each instruction's `"+"/"-"` flag in tables is legacy; current player ignores it (normalizes by target), but keep the format.
- History/conversation UI copy promises privacy properties (no video stored, text only, retention) — keep them true.
- Comments referencing `ml/*.py`, `skeleton.ts`, `app/api/...` point to code outside this repo.
