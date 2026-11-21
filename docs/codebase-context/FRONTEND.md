# Frontend

> Historical teammate-branch snapshot. For the integrated setup and current behavior, read [README](../../README.md) and [CLAUDE.md](../../CLAUDE.md). The integrated app uses the bundled FastAPI backend, the Ch22 avatar, raw hand-only recognition vectors, and separate opt-in body anchors for Learn. Earlier external-VOX, Remy, test-count and recognition-quality statements below may be outdated.

React 19 + TypeScript (strict) SPA built with Vite 8. JS modules under `src/avatar/` and `src/translation/` are plain ES JavaScript with hand-written `.d.ts` shims.

## Routing — `src/app/router.tsx`

`createBrowserRouter`, all pages lazy-loaded.

| Path | Component | Shell |
|---|---|---|
| `/` | `features/landing/LandingPage` | own header/footer |
| `/app` | redirect → `/app/speech-to-sign` | `AppShell` |
| `/app/speech-to-sign` | `features/speech-to-sign/SpeechToSignPage` | `AppShell` |
| `/app/sign-to-text` | `features/sign-to-text/SignToTextPage` | `AppShell` |
| `/app/history` | `features/history/HistoryPage` | `AppShell` |
| `/app/settings` | `features/settings/SettingsPage` | `AppShell` |
| `/app/help` | `features/help/HelpPage` (anchors `#camera`, `#service`, …) | `AppShell` |
| `*` | `features/NotFoundPage` | — |

`RootLayout` → `Preferences` (applies `html[data-text-size]`, `html[data-motion]`, motion `MotionConfig`, starts history pruning) + `Toaster` + `ScrollRestoration`. `RouteError` is the error boundary. `AppShell` = `SkipLink`, `AppHeader`, `<main>` keyed by pathname with `animate-fade` (0.35 s), `MobileTabBar` (phones).

## State management

- **zustand** `useSettings` (`src/stores/settings.ts`), persisted to `localStorage["parlance.settings.v1"]`. Fields: speech language, autoTranslate, avatarView (`figure|hands`), playbackSpeed, mirror, loop, showCaptions, voiceOutput, voiceURI, speechRate, cameraId, showLandmarks, showFramingGuide, autoFinishSentence, confidenceThreshold (0.85), serviceUrl (`VITE_PARLANCE_WS` ?? `ws://localhost:8000/ws`), motion, textSize, retention (`session` default).
- **zustand** `useHistory` (`src/stores/history.ts`): entries saved to session/localStorage per retention (`off|session|1d|7d|30d`), max 250, dedup same text within 15 s, re-saves on retention change, 60 s pruning timer.
- **Local component state** for conversations, queues, recognised words (lost on navigation — intended; History is the persistent record).
- Module-level caches/singletons: `loadSignLibrary`, `loadMetrics` (`services/signs/library.ts`), `loadManifest/loadSign` (`engine/avatar/signMotion.ts`), GLB `modelPromise` (`avatar/player.js`), `/api/config` result (`services/signs/prepareSpeech.ts`).

## Pages in depth

### Speech → Sign — `SpeechToSignPage.tsx`
- State: `text`, `exchanges: Exchange[]`, `activeId`, `queue: QueueItem[]` (new array identity = restart playback), `player`, `playerState`.
- `translate(input, override?)` → `useSignQueue().translate` → `prepareSpeech(text)` → `Exchange` appended, `setQueue([...result.queue])`, history `add`, `announce()` for screen readers.
- Voice: `useSpeechInput(language, onFinalSpeech)`; with `autoTranslate` the final transcript is translated immediately.
- `?text=` query param (from History "Replay signs") is translated once on mount and removed.
- Children: `SignerStage` (avatar, toolbar: figure/hands view, mirror, loop, fullscreen; big caption; clickable gloss rail → `player.step(i); player.play()`; transport: play/pause, restart, progress bar, 0.5/0.75/1×) and `ConversationPanel` (seeded phrase groups from `phrases.ts`, exchange log with "Sign again", composer textarea max 300 chars, Enter to submit, mic button, voice-language select).
- Missing-token UI: tokens from `skipped` (non-Latin/Devanagari words) are shown struck through; unknown Latin words are *fingerspelled*, never "missing".

### Sign → Text — `SignToTextPage.tsx`
- Hooks: `useRecognitionService({url, enabled:true, threshold, onAccepted})`, `useCameraTracking({onVector: service.send, sending: recognising && connection==="open", …})`, `useSignLibrary`, `useRecognitionMetrics`, `useSpeechOutput`.
- Accepted sign → `words[]` with confidence; headline flash 2.2 s; auto-finish after 3.5 s pause (`autoFinishSentence`) → `toEnglish(glosses)` (grammar engine) → transcript + History + optional TTS.
- `CameraStage`: `<video>` (CSS-mirrored) + `<canvas>` overlay, `FramingGuide`, start/stop, recognise toggle, landmarks toggle, camera select, privacy note naming the service host.
- `RecognitionReadout`: prioritised state machine — accepted → offline → connecting → no-model → camera off → paused → no body → no hands → buffering (progress) → rejected candidate (reason + meter) → "No sign detected".
- Footer `<details>` lists the 36 verified signs from `recognition.json`.

### Landing — `LandingPage.tsx`
`IntroScene` (one-time welcome panel; `SigningHands` draws the ISLRTC `welcome` landmark recording in 2D), `Hero` (input box → `HeroStage` request), `HeroStage` (real `AvatarViewport`; cycles `DEMO_PHRASES` via the *local* translator until the visitor types; pauses rendering off-screen via IntersectionObserver; reduced-motion waits for Play), `FlowStrip`, `HowItWorks` + `HowItWorksVisuals` (`HandTrace` renders `pain`, `where`, `hello` recordings), `WhyItMatters`, `About`, `SiteFooter` (replay intro).

### History / Settings / Help
- History: filter by direction, search, export `.txt` (Blob download), clear (confirm dialog), per-entry replay (`?text=`), speak, delete.
- Settings: sections Language, Signer, Audio (voice list from `speechSynthesis.getVoices()`), Camera and microphone (threshold slider, service URL draft/save/reset), Accessibility, Privacy and data (retention).
- Help: getting started, camera tips, supported signs (`SUPPORTED_TOKENS`), what it can/can't do, privacy, "Running the recognition service" (`uvicorn backend.main:app --port 8000` from the VOX folder — not part of this repo), keyboard.

## Services / hooks

| Hook | Browser APIs | Notes |
|---|---|---|
| `services/camera/useCameraTracking.ts` | `getUserMedia`, `permissions.query`, `enumerateDevices`, `createImageBitmap`, Worker, rAF, canvas 2D | Consent-first (nothing until Start). Detect ≤30 fps, forward ≤15 fps and only when `body` seen. Distinct statuses: inactive/requesting/running/denied/unavailable/in-use/error. Stream tracks stopped on stop/unmount; worker terminated on unmount. |
| `services/recognition/useRecognitionService.ts` | WebSocket | Auto-retry 1.5/3/6/12/20 s then `gaveUp`; manual retry bumps a generation counter; threshold re-sent on change. |
| `services/speech/useSpeechInput.ts` | `SpeechRecognition` / `webkitSpeechRecognition` | Single utterance (`continuous:false`), interim results, mapped error codes. |
| `services/speech/useSpeechOutput.ts` | `speechSynthesis` | Picks saved voice, else en-IN, rate from settings. |
| `services/signs/prepareSpeech.ts` | fetch | Decides online vs offline once per session from `/api/config`. |
| `services/signs/useSignQueue.ts` | AbortController | Cancels stale translations. |
| `hooks/*` | matchMedia, IntersectionObserver, Fullscreen API | small utilities; `useReducedMotion` = app setting overrides OS. |

## Design system — `src/styles/index.css` (Tailwind v4 `@theme`)

- **Font**: Geist Variable (`@fontsource-variable/geist`).
- **Brand colours**: navy `#011638`, royal `#0D21A1` (primary actions, left hand overlay), gold `#EEC643` (accent, right hand overlay, progress), ice/canvas `#EFF0F2`; scales `brand-25…900`, `sky-25…500`, `gold-50…800`.
- **Semantic**: `surface #fff`, `subtle`, `line / line-soft / line-strong`, `ink / ink-2 / ink-3`, `stage / stage-2` (avatar backdrop), `success`, `danger`, `warning` (+ `-bg`).
- **Radii** 4/6/8/10/12 px; **shadows** xs→lg + `float` (navy-tinted); easing `--ease-out-soft: cubic-bezier(0.22,1,0.36,1)`.
- **Animations**: `rise`, `rise-lg`, `fade`, `draw`, `pulse-ring`, `marquee`, `shimmer`, `ripple`, `float`, `blink`, `wave` (inline). `html[data-motion="reduce"]` kills animation/transition globally.
- **Text size**: `html[data-text-size="large"|"larger"]` → 112.5 % / 125 % root font size.
- **Patterns**: `eyebrow` small caps labels, `container-page`, `hairline-grid` backdrop, `Arcs` brand motif around the signer and camera, uppercase tracked gloss labels with dot separators, status rows with coloured dots, `role="status"`/`aria-live` everywhere, `announce()` from `Toaster` for SR announcements.
- UI kit in `components/ui/` (Button/ButtonLink variants primary/secondary/danger, sizes; IconButton; Switch; Segmented; Select; Field; Card; Badge; Dialog; EmptyState; Status; Kbd; Toaster).

## Accessibility features present
Skip link, focusable `<main>`, ARIA live regions, meters/progressbars with values, `aria-pressed` toolbars, reduced-motion support (also stops landing demo autoplay), text-size setting, captions on the signer, speech always mirrored on screen, mobile bottom tab bar with safe-area padding. Verified no horizontal overflow at 375 px on Speech → Sign.
