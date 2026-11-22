# Parlance

A platform to learn and translate Indian Sign Language (ISL).
- **Learn** (`/app/learn`) teaches ISLRTC dictionary signs with lessons, camera practice and spaced review. It also includes Teach (record signs, share decks by link or file), practise together, fingerspelling, community sign checks (self-reported fluency), and "Sign to the reader" (local FastAPI).
- **Speech → Sign** (text or voice → ISL gloss → three.js avatar "Ch22") works offline. With `GEMINI_API_KEY` or the `AZURE_OPENAI_*` settings in `.env`, `/api/translate-isl` uses the model for better ISL grammar (falls back to the offline rules). `?view=interpreter` is the TV-style live interpreter: a signer in the corner of a video, YouTube link, shared tab or the room, signing words as they are heard (`InterpreterView.tsx`, keep-up rules in `interpreter.ts`).
- **Sign → Text** (webcam → MediaPipe landmarks in a worker → WebSocket recogniser → English) uses the bundled `backend/` FastAPI service on port 8000.
- **Parlance mobile** (`parlance_mobile/`, Flutter + Serverpod, for the HackBriven × Serverpod hackathon): two phones in one conversation, the recogniser ported to Dart in the Serverpod server, everything on Serverpod Cloud. See `parlance_mobile/README.md` and `parlance_mobile/AGENTS.md`.
- **Community** (`/app/community`): spaces and threads for in-depth discussion, questions with answers, "See in sign" on every post, and meetups with a live room joined by a six-digit code ("Here, together"). Stored in SQLite by `backend/community.py` (same local FastAPI service). See `docs/codebase-context/COMMUNITY.md`. The phone app has its own Community in Serverpod (`parlance_mobile/parlance_mobile_server/lib/src/community/`); the two do not share posts.
- **Home** (`/app`) lists everything by situation. **Cards** (emergency, counters, visit card, SOS), **live captions** (Speech → Sign `?view=captions`) and **sound alerts** (on-device YAMNet) work offline once the app is installed. See `docs/codebase-context/EVERYDAY.md`.

Docs: `docs/codebase-context/`. Start with `DEVELOPMENT_HANDOFF.md`; Learn is in `LEARN.md`.

## Stack
Vite 8, React 19, TypeScript 6 (strict), Tailwind 4 (`@theme` tokens in `src/styles/index.css`), zustand 5, react-router 7 (lazy routes), three 0.185, `@mediapipe/tasks-vision`, Web Speech API. Optional Gemini translation via Vite middleware in `server/`. Node ≥ 22.18.

## Commands
- `./start.sh` / `start.bat`: installs what is missing, starts the website + Python service, opens http://localhost:4173 (`./start.sh community` opens Community)
- `npm ci` · `npm run dev` (http://localhost:4173; `predev` copies MediaPipe wasm into `public/mediapipe/wasm`)
- `python3 -m unittest discover -s backend/tests` (backend tests, from `.venv`)
- `npm test` (node:test; `test/*.test.js`, which import `.ts` files directly)
- `npm run build` = `tsc -b && vite build`
- `node scripts/sync-islrtc-signs.mjs "<vox path>"` re-imports ISLRTC sign recordings; `node scripts/calibrate-practice.mjs "<vox path>"` re-checks practice scoring
- No linter configured.

## Layout
- `src/features/` pages (landing, home, cards, sound-alerts, learn, community, speech-to-sign, sign-to-text, history, settings, help); `src/components/` UI kit/layout/avatar viewport
- `src/learn/` pure Learn logic (curriculum, lesson plans, spaced review, practice comparison, recordings, decks, pair rounds, fingerspelling); relative imports carry `.ts` so node tests can load them
- `src/features/teach/` record, deck editor, share; `src/stores/teach.ts` recordings and decks in IndexedDB. Sign keys are ISLRTC glosses or `rec:<id>`; resolve them through `src/features/learn/signData.ts`
- `src/translation/` (JS) offline English/Hindi → gloss + Gemini bridge; `islVocabulary.js` `SUPPORTED_TOKENS` is the avatar vocabulary
- `src/avatar/` (JS) player, scheduler, motion compiler, procedural sign tables in `animations/`
- `src/engine/` MediaPipe worker, tracking/smoothing, 141-float frame contract, `isl/grammar.ts` (gloss → English)
- `src/services/` hooks for camera, recognition WS, speech, sign library; `src/stores/` settings + history
- `src/community/` pure Community types/helpers; `src/services/community/` API client + live events; `src/stores/community.ts` your community name and token
- `backend/` bundled recognition and Community (`community.py`, data in `backend/data/`, gitignored); `training/` experimental dataset pipelines (not automatically deployed). `server/` `/api/config`, `/api/translate-isl`, `/api/speech` (only exists under `vite` / `vite preview`)

## Constraints
- Do not change the 141-float vector layout, smoothing order, aspect scaling, or `public/models/*.task` — they must match the bundled model's training. The raw recognition vector must not be aspect-scaled or smoothed. Learn explicitly opts into pose tracking and adapts separate world/pose outputs.
- Translation must always yield playable tokens (`sanitizeTokens`); unknown words are fingerspelled.
- Sign tables are authored in YBot bone axes and retargeted to Ch22 in `player.js`; `npm test` checks joint coverage on YBot, Remy and Ch22 rigs.
- Adding a sign: table in `src/avatar/animations/Words/`, export in `animations/words.js`, token in `SUPPORTED_TOKENS`, English/Hindi mapping in `textToGloss.js` / `hindiToGloss.js`.
- Two gloss vocabularies exist (avatar `UPPER_SNAKE` vs recogniser/ISLRTC lowercase); `glossForToken` / `avatarTokenFor` in `src/learn/lessonPlan.ts` map between them.
- Keep consent-first media handling, accessibility conventions (`announce()`, live regions, reduced motion), and existing UI/design unless asked.
- In Learn, ISLRTC recordings are the reference; The avatar's signs are labelled approximate. Practice feedback covers hands only, and the UI says so.
- Sign checks (`src/learn/reviews.ts`) use keys `gloss`, `avatar:ch22:TOKEN`, `avatar-letter:ch22:X` and `rec:id`; legacy `remy:TOKEN` and `letter:X` packs remain readable but do not approve Ch22; display them through `ReviewBadge`. Shared checks are untrusted input, so they go through `validatePack`.
- Recordings are never presented as ISLRTC signs; always label them "not reviewed". Shared decks are untrusted input, so they go through `validateDeck`.
- Practice score thresholds (`GOOD_DISTANCE`/`BAD_DISTANCE` in `src/learn/motion.ts`) come from the calibration script. Re-run it if features or weights change.
- Comments mentioning `ml/*.py`, `skeleton.ts`, `app/api/...` refer to code in the VOX repo or elsewhere, not here.
