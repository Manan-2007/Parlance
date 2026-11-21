# Feature Status Matrix

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

Commit `00a0efe`. Verification environment: macOS, Node v26.13.1 / npm 11.20, Claude desktop built-in Chromium pane (camera & microphone blocked), no `GEMINI_API_KEY`, no recognition service.

Legend: **Implemented & verified** · **Implemented, unverified** · **Partial** · **Mock/demo only** · **Not implemented** · **Blocked** · **Unknown**

| Feature | Status | Evidence / files | Why |
|---|---|---|---|
| Landing page | Implemented & verified | `features/landing/*` | Rendered; hero avatar cycled demo phrases ("MORNING GOOD WELCOME", "Signing 2 of 3"). |
| Landing intro (welcome hands) | Implemented, unverified | `landing/intro/*`, `public/signs/welcome.json` | Code read; not observed frame-by-frame (state persisted after first view). |
| Landing 2D hand traces | Implemented, unverified | `HandTrace.tsx`, `signMotion.ts`, `public/signs/{hello,pain,where}.json` | Assets exist; not inspected visually. |
| Navigation / routing | Implemented & verified | `app/router.tsx`, `AppHeader`, `MobileTabBar` | All 6 app routes loaded in browser. |
| UI animations | Implemented & verified | `styles/index.css`, `motion` | Route fade observed; reduced-motion path read only. |
| Responsive UI | Partially verified | Tailwind breakpoints | Speech → Sign at 375 px: no horizontal overflow, bottom tab bar. Other pages not checked on mobile. |
| Speech → Sign: typed input | Implemented & verified | `SpeechToSignPage`, `prepareSpeech`, `textToGloss`, `player.js` | Typed sentence → gloss rail → Remy signed/fingerspelled; History entry created. |
| Text → gloss, offline English | Implemented & verified | `translation/textToGloss.js` | 7 unit tests pass + manual samples. Grammar quality is rule-based (e.g. comma-joined clauses mix). |
| Text → gloss, Hindi (Devanagari) | Implemented & verified (unit) | `translation/hindiToGloss.js` | Test `मुझे पानी चाहिए → I WATER NEED`. |
| Text → gloss, Gemini | Implemented, unverified | `server/translationApi.js` | `/api/config` & 503 path verified; no key to test the provider path. |
| Speech-to-text (voice input) | Implemented, unverified | `services/speech/useSpeechInput.ts` | Needs mic + Web Speech; pane blocks mic. |
| Text-to-speech | Implemented, unverified | `useSpeechOutput.ts` | Voice list renders in Settings; actual speech not heard. |
| 3D avatar render & playback | Implemented & verified | `avatar/player.js`, `remy.glb` | Loaded (`data-avatar-status="ready"`), played queues, captions & progress update. |
| Avatar controls (speed, mirror, loop, hands view, fullscreen, gloss-rail scrub, drag rotate) | Implemented, unverified | `SignerStage.tsx`, `player.js` | Code read; not individually clicked. |
| Text → sign linguistic accuracy | Unknown | all `animations/*` | Explicitly marked "needs-ISL-review". |
| Fingerspelling A–Z, digits 0–9 | Implemented & verified (playback) | `Alphabets/*`, `numbers.js` | `T-O-M-O-R-R-O-W`, `A-M-I-T` played; accuracy unknown. |
| Facial grammar on avatar | Not implemented | `remy.glb` has 0 morph targets; `engine/avatar/nonManual.ts` unused | Only incidental neck rotations. |
| Webcam capture | Implemented, unverified | `useCameraTracking.ts` | Pane blocks camera; denied path verified ("Camera access is blocked"). |
| Hand + pose tracking (MediaPipe) | Implemented, partially verified | `mediapipe.worker.ts`, `tracking.ts` | Worker initialised both graphs on WebGL ("Graph successfully started running" ×2); no frames processed (no camera). |
| Landmark overlay / framing guide | Implemented, unverified | `drawOverlay`, `FramingGuide.tsx` | Needs camera. |
| Gesture/sign recognition (ISL → text) | Blocked (external) | `useRecognitionService.ts` | Requires the separate VOX service at `ws://localhost:8000/ws` (github.com/Manan-2007/Vox). A local VOX checkout was started on 2026-11-20: model loads (242 labels, 141 features) and a recorded "hello" sample was accepted at 0.98 over the WebSocket. Parlance-to-VOX with a live camera not tested. |
| ISL → speech | Implemented, unverified | `SignToTextPage.finishSentence` → `speech.speak` | Depends on recognition. |
| Gloss → English sentence | Implemented, unverified at runtime | `engine/isl/grammar.ts` `toEnglish` | Pure function; no tests in repo. |
| Continuous sign recognition | Not implemented | — | Isolated-sign windows only; `MotionEnergy` computed but unused. |
| Facial grammar recognition | Not implemented | — | No face landmarker; pose nose only. |
| Live camera → avatar mirroring | Partial (worker side only) | worker `world`/`pose` outputs | No consumer on main thread. |
| Live streaming speech → signing | Partial (logic + tests, no UI) | `translation/liveSpeech.js`, `schedule.js` `append` | Not imported by any component. |
| Conversation history | Implemented & verified | `stores/history.ts`, `HistoryPage.tsx` | Entry shown with gloss + Replay; export/clear/retention read only. |
| Settings persistence | Implemented, partially verified | `stores/settings.ts`, `SettingsPage.tsx` | Page renders all sections; persistence via zustand persist (read). |
| Help page | Implemented & verified | `HelpPage.tsx` | Renders. References external VOX commands. |
| Accessibility (skip link, live regions, text size, reduced motion) | Implemented, unverified | `Preferences.tsx`, `AccessibilityMenu.tsx`, CSS | Code read. |
| Backend integration | Partial | `server/` only under Vite | No production server; `/api` absent on static hosting. |
| Error handling | Implemented, partially verified | camera statuses, WS retry, avatar Retry, RouteError | Verified: camera denied, WS offline, `/api` 503 fallback. |
| Production build (`npm run build`) | Implemented & verified | — | Fixed on `feat/learn` by removing the unused `engine/core/*` and `tracking/handConditioner.ts` (2026-11-20). |
| Unit tests (`npm test`) | Implemented & verified | `test/signing.test.js`, `test/learn.test.js` | 18/18 pass (2026-11-20). Needs Node ≥ 22.18 (tests import `.ts`). |
| Linting | Not implemented | — | No ESLint config/script (code has stray `eslint-disable` comments). |

## Learn (added 2026-11-20, branch `feat/learn`) — see LEARN.md

| Feature | Status | Evidence |
|---|---|---|
| Learn hub, units, unit pages | Implemented & verified | Rendered in browser (desktop + 375 px, no horizontal scroll) |
| Lesson player: watch, recognise, build the sentence, conversation (listen/reply), finish | Implemented & verified | Walked through in browser; plans covered by tests |
| ISLRTC reference figure, 3D guide, official video (click-to-load) | Implemented & verified | Rendered; video iframe not loaded (external) |
| Camera practice ("Sign it") | Implemented, partially verified | Comparison logic unit-tested and calibrated offline; camera-denied path verified; live webcam capture/auto-stop/scoring **not** tested (camera blocked in test browser) |
| Spaced review (recognise + recall) | Implemented & verified | Review session rendered and graded in browser; SRS unit-tested |
| Sign library (239 signs) + sign page | Implemented & verified | Search list rendered |
| Practise from translator / History | Implemented & verified | Speech → Sign "Practise" created a phrase lesson (TOILET WHERE) |
| Learning settings (left-handed, mirror, reset) | Implemented & verified | Rendered |
| Landing "Learn" section, hero copy, nav | Implemented & verified | Rendered |
| Facial grammar in teaching/feedback | Not implemented | Text notes + official video only |

## Phase 2 (2026-11-20) — see LEARN.md

| Feature | Status | Evidence |
|---|---|---|
| Teach hub, my recordings | Implemented & verified | Rendered with recordings from IndexedDB |
| Record a sign | Implemented, partially verified | Page and camera-blocked state rendered; capture uses the shared hook; real recording **not** tested |
| Deck builder, share link, file export/import | Implemented & verified (link), unit-tested (file) | Link generated in browser and opened on wiped storage; file round trip in tests |
| Shared deck page, deck lessons with embedded recordings | Implemented & verified | Opened, saved, lesson played the recording |
| Practise together | Implemented & verified | One guess-mode round played in browser; rounds unit-tested |
| Fingerspelling (read, spell your name) | Implemented & verified | Remy spelling, checking, reveal, letter highlight; letters are approximate (no ISLRTC alphabet) |
| Letter checking with camera | Implemented, unverified | Needs a recorded letter and a camera |

## Phase 3 (2026-11-20) — see LEARN.md

| Feature | Status | Evidence |
|---|---|---|
| Check signs (fluent signers), share and receive checks | Implemented & verified | Saved a check; opened and added another reviewer's link |
| Review status on signs, Remy, letters, translator stage | Implemented & verified | Flag shown on Speech → Sign for WATER; letter A dot |
| Sign to the reader (VOX) | Implemented, partially verified | Connected to a running VOX; camera signing untested |
| Practice log + tip feedback, export in Settings | Implemented, unverified | Needs a camera attempt; store and export code typechecked |
