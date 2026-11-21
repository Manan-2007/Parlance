# Codebase Audit (non-destructive)

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

Commit `00a0efe`. Nothing below has been fixed. Each item is tagged **Observed** (reproduced at runtime or by a command), **Code-evident** (certain from reading the code, not triggered at runtime), or **Risk** (hypothetical).

## Critical

### C-1 Production build and typecheck fail — Observed · **FIXED 2026-11-20** (unused `engine/core/*` and `tracking/handConditioner.ts` removed on `feat/learn`)
- **Location:** `src/engine/core/humanoid.ts:54` — `import type { VRMHumanBoneName } from "@pixiv/three-vrm";`
- **Evidence:** `npm run build` → `error TS2307: Cannot find module '@pixiv/three-vrm'`. The package is not in `package.json`. `humanoid.ts` is only imported by `src/engine/tracking/handConditioner.ts`, which nothing imports; but `tsconfig.app.json` includes all of `src/`.
- **Impact:** `npm run build`, `npm run typecheck`, and therefore `npm run start` (needs `dist/`) don't work from a clean clone. README claims they do.
- **Fix options:** delete or exclude the unused `engine/core/*` + `engine/tracking/handConditioner.ts`, or replace the type import with a local union type, or add the dependency (heavier). `vite build` alone already succeeds.

## High

### H-1 Sign → Text depends on an absent external service — Observed · *Update 2026-11-20: VOX exists as a separate repo (github.com/Manan-2007/Vox); a local copy starts and accepts frames. Still not part of this repo.*
- **Location:** `src/services/recognition/useRecognitionService.ts`, `src/stores/settings.ts:48` (`ws://localhost:8000/ws`), Help page commands.
- **Evidence:** WS connection fails ×5 then gives up; no model, server, or training code (`ml/*.py`) in the repo.
- **Impact:** Half the product's headline (ISL → text/speech) cannot run from this repository alone. Contract parity (141-float layout, byte-identical `.task` models) can't be checked here.
- **Suggestion:** bring the service (or a stub/mock server for UI dev) into the repo or document its source/version; add a parity test for the frame vector.

### H-2 Two translation engines and two unconnected vocabularies — Code-evident
- **Location:** `src/translation/textToGloss.js` (English→gloss for the avatar, 164 UPPER tokens) vs `src/engine/isl/grammar.ts` (`toGloss` unused, `toEnglish` used; 239 lowercase ISLRTC glosses from `vocabulary.generated.ts`). Also `glossDictionary.js` and `SUPPORTED_SIGNS` in `textToGloss.js` duplicate parts of `islVocabulary.js`.
- **Impact:** The same ISL ordering rules are implemented twice with different lexicons and lemmatisers, vocabulary edits must be made in several places, a recognised word (`thankyou`) and an avatar token (`THANK_YOU`) are different identifiers. Easy to break one direction while editing the other.
- **Suggestion:** pick one gloss vocabulary with an explicit mapping table; consolidate grammar into one module with tests in both directions.

### H-3 Sign animation accuracy is unreviewed — Code-evident
- **Location:** all of `src/avatar/animations/**`; `islVocabulary.js` marks every entry `review: 'needs-ISL-review'`; README says the same.
- **Impact:** For an accessibility product, incorrect signs are a correctness bug, not polish.
- **Suggestion:** review with fluent ISL signers/ISLRTC references; track per-sign review state.

## Medium

### M-1 A single worker error permanently stalls frame capture — Code-evident · **FIXED 2026-11-20** (`pendingRef` cleared on `error`)
- **Location:** `src/services/camera/useCameraTracking.ts:145-149` returns on `msg.type === "error"` before `pendingRef.current = false` (line 151). The capture loop skips while `pendingRef` is true (line 292). `detect()` exceptions are caught in the worker and posted as `error` (`mediapipe.worker.ts:322`).
- **Impact:** after one failed `detectForVideo`, no more frames are sent until the camera is stopped and restarted; tracker shows "error" but tracking won't resume by itself.
- **Fix:** clear `pendingRef` on `error` messages (and decide whether a per-frame error should flip tracker state).

### M-2 Failed tracker initialisation can't be retried without leaving the page — Code-evident · **FIXED 2026-11-20** (worker discarded if it never became ready)
- **Location:** `useCameraTracking.ts:124-126` — `ensureWorker` returns early if `workerRef.current` exists; `onerror`/`error` paths never clear or terminate it.
- **Impact:** if model/wasm loading fails once (e.g. network hiccup), pressing Start again does nothing useful.
- **Fix:** on init error terminate the worker and null `workerRef`.

### M-3 Offline grammar mixes clauses joined by commas — Observed
- **Location:** `src/translation/textToGloss.js` `textToGloss` splits only on `. ? ! ; newline । ॥`.
- **Evidence:** "My name is Amit, I need a doctor tomorrow" → `T-O-M-O-R-R-O-W MY I NAME A-M-I-T DOCTOR NEED`.
- **Impact:** wrong word order for common conversational input; also common words without signs (TOMORROW, TODAY, NOW, NICE) are fingerspelled, lengthening output (`A-M-I-T` ≈ 5.2 s, i.e. ~1.3 s per letter at 1×).

### M-4 Large amount of dead / half-wired code — Code-evident
- Unused modules: `src/engine/core/humanoid.ts`, `src/engine/core/math.ts`, `src/engine/tracking/handConditioner.ts`, `src/translation/liveSpeech.js`, `engine/isl/grammar.ts#toGloss` (+ `engine/avatar/nonManual.ts`, only used by it), `engine/landmarks.ts#buildFrameVector`, `schedule.js` append mode, `textToGloss.js#SUPPORTED_SIGNS[*].actionId`/`getActionIdForGloss`.
- Worker computes `world` (126 floats), `pose` (39 floats), `motion`, `inferMs` every frame; main thread ignores them (`useCameraTracking.ts:137-173`).
- `PlayerState.transitioning` is always `false` (`player.js:91`), so "Moving to the next sign" (`SignerStage.tsx:154`) never appears.
- Legacy `ref.pending/ref.animate()/ref.characters` hooks in every animation table.
- **Impact:** misleads readers about capabilities, causes C-1, small per-frame waste.

### M-5 Stale references to files that don't exist — Code-evident
Comments cite `ml/collect.py`, `ml/normalize.py`, `ml/build_motion.py`, `ml/evaluate.py`, `ml/vocabulary.py`, `ml/export_vocabulary.py`, `ml/add_words.py`, `skeleton.ts`, `public/models/isl-samples.json`, `useHandTracking`, `app/api/translate-isl/route.ts`, `lib/islTranslator.ts`, `components/avatar/AvatarPlayer.tsx`. `vocabulary.generated.ts` says "do not edit; regenerate with python ml/export_vocabulary.py" — impossible here.

### M-6 Gemini integration only exists under the Vite server — Code-evident
- **Location:** `vite.config.ts` `configureServer` / `configurePreviewServer`.
- **Impact:** no production backend; any static deployment silently loses online translation. Rate limiting is in-memory per process keyed by `socket.remoteAddress` (all clients share one key behind a proxy).

## Low

### L-1 Recognition socket opens whenever Sign → Text is mounted — Observed
`SignToTextPage.tsx:104-109` passes `enabled: true`; with no service the console shows 5 WebSocket errors before giving up, even if the user never starts the camera.

### L-2 No lint setup — Observed
No ESLint config or script, yet files contain `eslint-disable-next-line react-hooks/exhaustive-deps` (`SignToTextPage.tsx:122`, `SpeechToSignPage.tsx:92`).

### L-3 Test coverage gaps — Code-evident
Only `test/signing.test.js` (translator + avatar motion). Nothing for `grammar.toEnglish`, `tracking.ts` (smoother/assigner/frame layout parity), stores, `server/` guards, or React components.

### L-4 "Missing" vs fingerspelled is not distinguished to users — Code-evident
`prepareSpeech.ts:27` marks only unsupported-script words as `missing`; words with no sign are silently fingerspelled. The UI copy "No sign in the library yet … shown as text" never applies to them.

### L-5 Bundle weight — Observed
`prepareSpeech` chunk 460 kB raw (all sign tables + translator, loaded on landing via HeroStage), three.js 597 kB, `remy.glb` 5.4 MB, MediaPipe models 13 MB + wasm ~33 MB (lazy, on Start camera). Acceptable for a demo; relevant for mobile data.

### L-6 Default recogniser URL is plaintext `ws://` — Risk
On an HTTPS deployment browsers block `ws://` (mixed content); if pointed at a remote host, landmark data travels unencrypted.

### L-7 Hand-written `.d.ts` for JS modules — Code-evident
`islVocabulary.d.ts` exposes only 2 of the module's exports; types can drift from implementation silently.

## Security & privacy notes
- **No secrets** found in the repo (`.env` gitignored; scanned for key patterns). Gemini key stays server-side.
- Camera frames never leave the browser (worker on-device); only 141 numbers/frame go to the configured WS host, which the UI names.
- Web Speech in Chrome sends audio to Google (disclosed in Help). Gemini path sends typed text to Google (disclosed on landing About).
- User text reaches the LLM prompt (prompt-injection surface), but output is constrained by JSON schema and re-sanitised to playable tokens — impact limited to wrong signs.
- History is text-only, local, retention-controlled; default is session-only.
- Server guards: body ≤ 8 KB, text ≤ 600 chars, 30 req/min/IP, ≤ 4 concurrent provider calls, 6 s timeout, abort on client disconnect.

## Things that are done well (preserve)
- Consent-first camera with precise error states; stream tracks stopped on stop/unmount; worker terminated on unmount.
- Detection off the main thread, one frame in flight, transferable bitmaps/buffers.
- Presence-aware One-Euro smoothing and continuity-based hand assignment, with measured rationale in comments.
- Render-on-demand avatar loop, suspension off-screen, resource disposal (`forceContextLoss`).
- Deterministic offline fallback for every translation failure; avatar never stalls on unknown words.
- Strong accessibility baseline (live regions, reduced motion, text size, captions).
