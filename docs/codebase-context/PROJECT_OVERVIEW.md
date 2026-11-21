# Parlance — Project Overview

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

> Analysed at commit `00a0efe` (branch `main`, 2 commits total, both 2026-11-19).
> Every claim here is backed by source reading; runtime-verified items are marked **(verified)**.

> **2026-11-20:** Parlance now leads with **Learn** (ISL lessons from ISLRTC recordings, camera practice, spaced review). See `LEARN.md`. Sections below describe the translator half as analysed on 2026-11-19.

## What Parlance is

A browser-based accessibility app that bridges spoken/written English or Hindi and **Indian Sign Language (ISL)**. It is a single Vite + React 19 + TypeScript SPA with:

- a **Speech → Sign studio**: typed or spoken English/Hindi → ISL gloss tokens → a rigged 3D avatar ("Remy") that performs procedurally-authored signs or fingerspells **(verified, typed input)**;
- a **Sign → Text workspace**: webcam → MediaPipe hand + pose landmarks (in a Web Worker, on-device) → 141-float frame vectors streamed over WebSocket to an **external recognition service (VOX, not in this repo)** → accepted words → English sentence + optional speech;
- a marketing **landing page** with an intro animation, a live avatar demo, and 2D hand-trace illustrations driven by real ISLRTC landmark recordings;
- **History**, **Settings**, **Help** pages; all state lives in the browser.

There is no database, no auth, no deployable backend. A tiny Node middleware (`server/`) runs **inside Vite's dev/preview server** and optionally proxies text to Google Gemini for translation.

## Target users

- Hearing people who need to address an ISL user (clinic, everyday phrases are the seeded examples).
- ISL users signing to a hearing person (only with the external recogniser running).

## What a user can actually do today

| Can do | Notes |
|---|---|
| Type English/Hindi → see gloss → watch Remy sign | Works fully offline with the rule engine. ~164 base word signs (+ inflection aliases), A–Z, 0–9. Unknown words are fingerspelled. |
| Speak into the mic → same as above | Web Speech API (Chrome/Safari; audio goes to the browser vendor). Not runtime-tested here (no mic in test pane). |
| Replay, scrub (click a gloss), speed 0.5/0.75/1×, mirror, loop, hands-focus, fullscreen | Verified visually for playback; controls read in code. |
| Start the camera, see hand landmarks overlaid, framing guide | Code complete; MediaPipe worker initialisation **verified**; live camera **not** verifiable in the test pane (camera blocked). |
| Get signs recognised into text | **Only** if the separate VOX FastAPI/BiLSTM service runs at `ws://localhost:8000/ws`. Not present here → UI shows "Recognition service offline" **(verified)**. |
| Keep history, export it as .txt, choose retention | Verified the entry appears in History. |

## Scope of ISL recognition (as designed)

- **Isolated signs**, one word at a time, from a 30-frame (~2 s @15 fps) window, decided server-side.
- 242 classes in the external model; held-out top-1 = 38.2 %, gated precision 77 %; only **36 "verified" words** (≥80 % held-out) are emitted (`public/signs/recognition.json`).
- No continuous/sentence-level recognition, no segmentation in the client, no facial-grammar recognition.

## Scope of sign generation

- **Procedural keyframe tables** of Euler bone rotations (authored for Mixamo YBot axes, re-targeted to Remy at runtime). Not motion capture, not ML-generated.
- Non-manual markers exist only as occasional neck rotations inside a few tables; Remy has **no morph targets**, so no facial expressions.
- README itself states: "The sign animations still need linguistic review on Remy."

## Technology stack (verified from `package.json` / source)

| Layer | Tech |
|---|---|
| Build/dev | Vite 8, `@vitejs/plugin-react` 6, TypeScript 6 (strict), Node ≥ 22.12 |
| UI | React 19.2, react-router-dom 7 (data router, lazy routes), Tailwind CSS 4 (`@tailwindcss/vite`, tokens in `src/styles/index.css`), `motion` 12, `lucide-react`, Geist variable font |
| State | zustand 5 (+ persist → localStorage) |
| 3D | three 0.185 (GLTFLoader, SkeletonUtils) |
| CV | `@mediapipe/tasks-vision` 1.0 (HandLandmarker + PoseLandmarker lite, VIDEO mode, GPU→CPU fallback) in a module Web Worker |
| Speech | Web Speech API (`SpeechRecognition`, `speechSynthesis`) |
| Optional AI | Google Gemini `generateContent` (default `gemini-2.5-flash`) via `server/translationApi.js` |
| Tests | `node --test` (`test/signing.test.js`, 7 tests) |

## Main modules

```
src/app/            router, shells, error boundary, preferences
src/features/       landing, speech-to-sign, sign-to-text, history, settings, help
src/components/     layout, ui kit, avatar viewport, brand arcs
src/avatar/         three.js player + procedural sign tables (JS)
src/translation/    offline English/Hindi → gloss engine + Gemini bridge (JS)
src/engine/         MediaPipe worker, tracking/smoothing, 141-float contract,
                    ISL grammar (gloss → English), landmark motion loader
src/services/       React hooks: camera, recognition WS, speech in/out, sign library
src/stores/         settings + history (zustand)
server/             Vite middleware: /api/config, /api/translate-isl
public/             remy.glb, ybot.glb, MediaPipe .task models, ISLRTC sign samples
test/               node:test suite for translator + avatar motion
```

## Current development state

Two commits, a "merge" of a reference UI (`Manan-2007/testing1`) with an avatar/translation engine from another local project and a camera pipeline adapted from "VOX". The seams are visible: two independent translation engines, two vocabularies, unused modules, and comments pointing at files (`ml/*.py`, `app/api/...`, `components/avatar/...`) that do not exist here. The Speech → Sign path is the most complete; Sign → Text depends entirely on an external service. `npm run build` currently **fails** typecheck (see CODEBASE_AUDIT C-1).

See `DEVELOPMENT_HANDOFF.md` for the condensed takeover guide.
