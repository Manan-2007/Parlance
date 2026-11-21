# Parlance mobile — handbook for the next developer and their AI agent

Read this whole file before changing anything. It is the single source of
truth for how this app is built, deployed and tested, and what must not be
broken. If something here turns out to be wrong, fix this file in the same
commit.

## 1. What this is

Parlance on phones, built for the **HackBriven × Serverpod hackathon**
(Track 2, "Superpowers in your pocket"). It helps a Deaf person and a hearing
person talk in Indian Sign Language (ISL).

- **Conversation (two phones):** the Deaf person signs to the camera (or taps
  a card, or types); the other phone shows the words and reads them aloud.
  The hearing person talks; the Deaf person's phone shows big captions and
  can play them with the 3D signer. Joined by QR code or 6-digit code; the
  second person can join from any browser without installing anything.
- **Translate tab (Speech → Sign):** type or say English or Hindi; the 3D
  signer signs it. One phone, no QR code.
- **Learn tab:** the website's 6 units / 16 lessons. Watch each sign on the 3D
  avatar (or the ISLRTC recording), then "Your turn": sign it to the camera
  and the server's recogniser checks it.
- **Cards tab:** ready-made messages in English + Hindi (emergency, hospital,
  pharmacy, police, bank, railway, auto, shop), shown full screen; the other
  person taps a reply. Works with no second phone.

### Hard rules from the hackathon guide (do not break)

- **Stack: Flutter (Dart) app + Serverpod 4 backend (Dart) + Serverpod Cloud
  hosting. Nothing else.** No Vercel, no Firebase hosting, no Cloud Run, no
  separate Python/Node server. Everything the app needs is served by the
  Serverpod server.
- Serverpod must stay central (it is: rooms, live streams, auth, and sign
  recognition all run in it).
- No secrets in code, prompts or Git. Secrets/addresses go in
  `config/passwords.yaml` (gitignored) locally and `serverpod cloud password
  set` in the cloud.
- Every endpoint checks authorization (see §5).

## 2. Repository and where things live

Git repo: **https://github.com/tzxh45dhff-art/parlance** (branch `main`; the
team pushes finished work straight to `main`). The repo root is the Parlance
**website** (React/Vite, see the root `CLAUDE.md`). This app lives in
`parlance_mobile/` and *uses parts of the website*:

```
parlance/                         repo root = the website (React, Vite, TS)
├── src/, public/                 website code; the 3D signer and Learn data come from here
├── backend/                      the ORIGINAL Python recogniser (reference only, not deployed)
└── parlance_mobile/              THIS APP (a Dart workspace, created by `serverpod quickstart`)
    ├── AGENTS.md                 this file (CLAUDE.md points here)
    ├── README.md                 short version for humans
    ├── pubspec.yaml              workspace root (do not rename packages)
    ├── parlance_mobile_server/   Serverpod backend  → deployed to Serverpod Cloud
    ├── parlance_mobile_client/   GENERATED client — never edit by hand
    └── parlance_mobile_flutter/  Flutter app (Android, iOS, web)
```

The backend code lives in `parlance_mobile/parlance_mobile_server/`. There is
no other backend.

## 3. Versions (match these)

| Tool | Version | Notes |
|---|---|---|
| Flutter | **3.50.1** stable (Dart 3.14) | Serverpod 4 needs ≥ 3.44.4 |
| Serverpod CLI + packages | **4.1.2** | `dart install serverpod_cli` |
| Serverpod Cloud CLI | via `serverpod cloud …` | installs itself on first use |
| Riverpod | flutter_riverpod 3.x | state management (guide's choice) |
| go_router | 18.x | navigation |
| MediaPipe Tasks Vision | **1.0.0 on every platform** | Android Maven `com.google.mediapipe:tasks-vision:1.0.0`, iOS pod `MediaPipeTasksVision 1.0.0`, web `web/mediapipe/` (from npm 1.0.0) |
| Android | compileSdk 37, minSdk 24, AGP 9.3, Kotlin 2.4 | |
| iOS | 15.0+, CocoaPods for MediaPipe | Podfile in `ios/` |
| Node | ≥ 22 | only for building the website pieces (§6) |

Setup on a new machine: install Flutter (guide Part A/B), Android Studio with
an SDK and an emulator, then `dart install serverpod_cli`, and add
`~/Library/Application Support/Dart/install/bin` (macOS) to PATH. Then
`cd parlance_mobile && flutter pub get`, and `npm ci` at the repo root (needed
to build the signer and the website tests).

## 4. How the app works (architecture)

### 4.1 Flutter app (`parlance_mobile_flutter/lib/`)

- `main.dart` → `initializeClient()` (`core/client.dart`, generated Serverpod
  client) → quiet anonymous sign-in → `MaterialApp.router`.
- `app/router.dart`: go_router. `StatefulShellRoute` with a bottom
  `NavigationBar` = 4 tabs: `/` Home, `/translate`, `/learn`, `/cards`.
  Full-screen routes on the root navigator: `/talk`, `/join`, `/join/:code`,
  `/room`, `/room/sign`, `/practice/:gloss`, `/about`, lesson and card-show
  pages. The web build uses hash URLs: a room QR code encodes
  `https://<app>/#/join/123456`.
- `app/theme.dart`: Parlance colours (`Brand`): **tangerine = voice/hearing
  side, blue = hands/signing side, sun = cards, red = emergency only**. Fonts:
  Manrope (body) + Bricolage Grotesque (headings) via google_fonts. Keep this
  visual language for anything new.
- `core/session.dart`:
  - `ensureSignedIn()` — anonymous account; **concurrent calls share one
    attempt** (two parallel logins once created two accounts and broke rooms on
    slow networks — do not remove this).
  - `ServiceAddresses` — loaded from the server's `SettingsEndpoint`: `signer`,
    `app`, `android` (APK URL), `androidBuild`; helpers `signText`,
    `signGlosses`, `learnSign`, `learnSigns`, `joinLink`, `updateAvailable`.
- `providers/`: `room_provider.dart` (conversation state + live stream +
  reconnect/rejoin), `profile_provider.dart` ("About me", kept only on the
  phone in shared_preferences), `speech_provider.dart` (continuous speech
  captions with auto-restart; `Voice` = text-to-speech).
- `features/`:
  - `home/` Home tiles (+ "Update available" banner on Android, + "Get the
    Android app" for Android browsers).
  - `room/` start/join/scan (mobile_scanner)/conversation.
  - `translate/` Speech → Sign.
  - `learn/` `curriculum.dart` (loads `assets/learn/curriculum.json`, progress
    in shared_preferences) and `learn_screens.dart`.
  - `cards/` `card_data.dart` (GENERATED from the website, see §6) and screens.
  - `signer/` the 3D signer: a **web view** (Android/iOS, webview_flutter) or
    **iframe** (web) showing the website's embed pages served by Serverpod at
    `/signer/…`. `SignerView` is the inline widget.
  - `sign_camera/` the camera + sign reading (see §4.3).

### 4.2 Serverpod server (`parlance_mobile_server/lib/`)

- `server.dart`: auth (email OTP from the template + **anonymous**
  `AnonymousIdpConfig`), web routes:
  - `/` Flutter web app (`web/app`, `FlutterRoute`)
  - `/signer/` the website build used as the 3D signer (`web/signer`, `SpaRoute`)
  - `/get/parlance.apk` Android download (`web/get`, `StaticRoute`)
  - `/assets/assets/config.json` tells the web app its API URL (template).
- `src/rooms/`: models `Room`, `RoomMember`, `Utterance` (tables), enums,
  `RoomEvent`, `RoomInfo`, `RoomException`; `RoomEndpoint`:
  `create/join/say/live/listen/leave/close`. `requireLogin = true`; every call
  checks the caller is a member; rooms expire after 3 h and are deleted with
  their messages; account ids are `scope=serverOnly` (never sent to phones).
  Live events use `session.messages.postMessage/createStream` on channel
  `room-<id>` (single server instance; Redis would be needed to scale out).
- `src/config/`: `AppSettings` + `SettingsEndpoint` (no login) returning
  `signerUrl`, `appUrl`, `androidUrl`, `androidBuild` from passwords.
- `src/recognition/`: **the sign recogniser, ported from the website's Python
  `backend/` to Dart** (see §4.3). Weights in `assets/recognition/`
  (`transformer.bin` 24 MB, `forest.bin` 5 MB + JSON metadata).
- `migrations/`: generated; never hand-edit except as the template rules say.

### 4.3 Sign reading pipeline (the most fragile part — read before touching the camera)

```
camera (Android CameraX / iOS AVFoundation / web getUserMedia)
  → MediaPipe Hand Landmarker 1.0.0 on the phone (2 hands, confidence 0.3,
    VIDEO mode, CPU)  → {w, h, hands:[{label, score, points[63]}]}
  → Dart: HandAssigner + assembleFrame (frame_vector.dart) → 141 floats
  → RecognizerClient streams SignFrame to Serverpod SignEndpoint.read
  → RecognitionWorker isolate → RecognitionSession → SignRecognizer
    (transformer ensemble + forest suggestions) → SignResult back
  → word → room (`say`) or Learn practice result
```

Rules that MUST hold (the model was trained on exactly this):

1. **Landscape, 16:9, upright, NOT mirrored.** The recogniser was trained on
   16:9 landscape webcam video, as the camera sees it. The sign screen locks
   landscape on phones and refuses to send frames in portrait on the web.
   Only the on-screen *preview* is mirrored; never mirror the frames given to
   MediaPipe. Portrait framing distorts hand shapes ~3× and breaks recognition.
2. **The 141-float layout**: `[0:63]` Left block (21×xyz), `[63:126]` Right
   block, `[126:141]` pose = **always zeros** (recognition is hands-only).
   Raw MediaPipe normalised image coordinates — no smoothing, no aspect
   scaling. `frame_vector.dart` is a line-by-line port of the website's
   `src/engine/tracking.ts` (`HandAssigner`, `assembleFrame`);
   `test/frame_vector_test.dart` checks it frame by frame against fixtures
   produced by the website code. Keep them identical.
3. **Same model file everywhere**: `assets/models/hand_landmarker.task` is the
   one copy, loaded by Android (`SignCamera.kt`, via FlutterLoader), iOS
   (`AppDelegate.swift`, via `FlutterDartProject.lookupKey`) and web
   (`web/sign_camera.js`, `assets/assets/models/…`). Do not add copies.
4. **Timestamps** are the phone's monotonic clock in ms and must increase. The
   recogniser segments signs by them, so network delay does not matter.
5. **Frame streaming**: the client sends ~12 frames/s (min 75 ms apart) and at
   most 40 unanswered (`recognizer_client.dart`). Do NOT go back to "one frame
   in flight": the server is 0.5–2 s away and that dropped the frame rate to
   1–2/s, which reads nothing.
6. **Server-side recogniser parity**: `lib/src/recognition/` must keep giving
   the same answers as the Python original. Tests:
   `test/unit/recognition_model_test.dart` (matches ONNX probabilities within
   1e-4, and timing) and `tool/replay_check.dart <replays.jsonl>` (recorded
   sessions; the original author's recordings are personal data and are NOT in
   Git — make your own by replaying through `backend/` if needed). The server
   runs with `liveGuesses: false` (skips mid-sign guesses the UI never shows;
   finished-sign results are unchanged — `--final-only` checks this).
7. **Words vs suggestions**: confident signs arrive as `word`; unsure ones as
   `suggestions` ("Did you sign…?") that the signer taps (`confirm` with the
   `revision`). Suggestions stay until replaced (same rule as the website).
8. Recognition vocabulary ≈ 630 ISL words (ISL500 + INCLUDE + forest extras).
   It reads **one word at a time**; sign, then lower hands (or hold still).

9. **Release builds do not shrink code** (`isMinifyEnabled = false` in
   `android/app/build.gradle.kts`). R8 renamed MediaPipe's protobuf fields and
   its Flogger logger, and HandLandmarker then failed on every phone ("Field
   platform_ … not found", "no caller found on the stack"), while debug builds
   worked. Do not turn minify back on without testing a **release** APK on a
   real phone. `proguard-rules.pro` holds the keep-rules found so far.
10. On a phone the camera waits up to 3 s for the screen to turn to landscape,
    then starts anyway with "Turn your phone sideways" (some makers' rotation
    lock keeps portrait); frames are only sent in landscape.
11. If hand tracking cannot start, the screen shows the reason in small text
    under the message (exception class + message). Ask testers for a photo of
    it.

Native code locations:
- Android: `android/app/src/main/kotlin/space/serverpod/parlance_mobile/`
  `MainActivity.kt` (registers channel + view) and `SignCamera.kt` (platform
  view `parlance/sign_camera`, event channel `parlance/sign_camera/frames`,
  `SignCameraFrames` is a singleton `object`; keeps an error until Dart
  listens). Log tag: `ParlanceSignCamera` (`adb logcat | grep ParlanceSign`).
- iOS: all in `ios/Runner/AppDelegate.swift` (`SignCameraView`, front camera,
  `isVideoMirrored = false`, rotation follows the interface orientation).
- Web: `web/sign_camera.js` (`window.parlanceSignCamera.start/stop`) +
  `lib/features/sign_camera/camera_view_web.dart`.
- Dart side: `camera_view*.dart` (conditional imports), `sign_screen.dart`
  (conversation mode, or Learn practice mode when `target` is set).

### 4.4 The 3D signer (Ch22 avatar)

The app does not render 3D itself. It opens the **website's** pages, built
into `web/signer` and served by Serverpod at `/signer/`:
- `/signer/embed/sign?text=…` — translates English/Hindi to ISL and plays it.
- `/signer/embed/sign?glosses=a,b&text=…` — plays exact signs in order (Learn
  phrases) when the avatar has all of them, else translates `text`.
- `/signer/embed/learn?sign=hello` — one Learn sign (opens on the 3D avatar
  when it has an animation; tabs for the ISLRTC recording and official video).
- `/signer/embed/learn?signs=a,b` — ISLRTC recordings in order.

The avatar is **Ch22** (`public/assets/ch22.glb`, 2.0 MB, meshopt + WebP
compressed, loaded in `src/avatar/player.js` with `MeshoptDecoder`; materials
are softened there in `matte()` so it does not look like plastic). Keep using
this model; do not swap in another. Its animations are hand-made
approximations ("3D guide · approximate"); unknown words are fingerspelled.
Only 43 of the 86 Learn signs have avatar animations — the app uses the ISLRTC
recordings for phrases the avatar cannot sign fully (`Curriculum.animated`),
so lessons never teach a fingerspelled word by mistake.

The signer needs internet (it is served by the server).

## 5. Rules for writing code here

- Follow the guide's loop for every feature: Serverpod model (`.spy.yaml`) →
  migration → endpoint **with authorization checks** → generated client →
  Riverpod provider with loading/success/error → Flutter screen → test.
- Never edit `lib/src/generated/` or `parlance_mobile_client/`. Run
  `serverpod generate` after model/endpoint changes; `serverpod
  create-migration` after table changes (add `--force` only if data loss is
  intended).
- Endpoints that touch user data: `requireLogin => true` and check membership
  /ownership with `session.authenticated!.userIdentifier`. Throw
  `RoomException(message: …)` (or a new serializable exception) with a message
  the person can act on.
- Privacy: medical/contact details stay on the phone ("About me"); only the
  text of a card someone chooses to send goes to the server. Rooms are
  deleted after 3 h. Camera video never leaves the phone — only hand
  landmark numbers are sent.
- UI language: plain, short English; English + Hindi on cards (Hindi avoids
  gendered verb forms); colours as in §4.1; large text for the person
  reading; every error says what to do next; never colour alone.
- Accessibility: buttons have labels/tooltips; live content is readable;
  respect reduced motion (`MediaQuery.disableAnimationsOf`).
- **Do NOT run `dart fix --apply` on the Flutter package.** Flutter 3.50
  deprecates `package:flutter/material.dart` in favour of `material_ui`, and
  `dart fix` rewrites every import to `material_ui`, which is not a dependency
  and breaks Google Fonts types. If it happens, run
  `grep -rl material_ui lib test | xargs sed -i '' 's#package:material_ui/material_ui.dart#package:flutter/material.dart#'`.
  (The 15 "material.dart is deprecated" infos from `flutter analyze` are
  expected.) `dart fix` is fine in the server package.
- Server must pass `dart analyze --fatal-infos` (the guide's CI uses it).
- Card text is generated from the website: edit `src/features/cards/cardData.ts`
  first, then regenerate `lib/features/cards/card_data.dart` (the original
  generator was a one-off script; keep the two in step by hand if needed).
- Learn content is generated: `node parlance_mobile/parlance_mobile_flutter/tool/export_learn.mjs`
  (run from the repo root) after changing `src/learn/curriculum.ts`.
- Recogniser weights are generated by
  `parlance_mobile_server/tool/export_recognizer.py` — it needs PyTorch and the
  training checkpoints in `.research-cache/` that only exist on the original
  author's Mac. Do not regenerate or edit `assets/recognition/`; treat it as a
  binary asset.

## 6. Build, run and test

All commands from `parlance_mobile/` unless noted.

```bash
# Local server + database (embedded Postgres) + the app in a browser
serverpod start                     # or: cd parlance_mobile_server && serverpod runner start

# Tests
(cd parlance_mobile_server && dart analyze --fatal-infos && dart test)   # 14 tests
(cd parlance_mobile_flutter && flutter analyze && flutter test)          # 5 tests
(cd .. && npm test)                                                      # website, 51 tests

# Android emulator against the local server
(cd parlance_mobile_flutter && flutter run --dart-define=SERVER_URL=http://10.0.2.2:8080/)
```

Local `config/passwords.yaml` (gitignored; the template creates it) needs, under
`development:`: `signerUrl: 'http://localhost:8082/signer/embed/sign'` and
`appUrl: 'http://localhost:8082'`. Localhost addresses are rewritten
automatically for an emulator or a phone on Wi-Fi.

**Three built folders are gitignored but served by the server**, so they must
be (re)built before a deploy or the live site loses them:

| Folder | Build command (from `parlance_mobile/parlance_mobile_server`) |
|---|---|
| `web/app` (Flutter web app) | `cd ../parlance_mobile_flutter && flutter build web --base-href / --output ../parlance_mobile_server/web/app` |
| `web/signer` (3D signer, from the website) | `./tool/build_signer.sh` (needs `npm ci` at the repo root) |
| `web/get/parlance.apk` (Android download) | `./tool/build_android.sh https://parlance-isl.api.serverpod.space/` |

`.scloudignore` (server package) re-includes these three for deploys.

### Testing realities

- **The Android emulator on Apple M4 Macs cannot run MediaPipe**: it reports
  SME2/SVE CPU features the hypervisor does not support (SIGILL), and its
  OpenGL ES 3.0 cannot run the GPU path. `SignCamera.kt` uses the GPU on
  emulators and the CPU on phones; on an M4 emulator the sign screen shows
  "Hand tracking could not start" — that is expected. **Test the camera on a
  real Android phone**, or on the web build.
- **Web camera end-to-end test without a person**: Chrome's fake camera with a
  dataset clip: `--use-fake-device-for-media-stream
  --use-file-for-fake-video-capture=clip.y4m` (convert with ffmpeg, pad 1 s of
  rest before/after). Two browser contexts = two phones. This is how "hello",
  "help", "thank you" were verified live.
- The iOS native camera code compiles in theory but has **never been built or
  run** (Xcode licence was not accepted on the original Mac). iPhone users use
  the web app in Safari. If you build for iOS: `sudo xcodebuild -license
  accept`, then `flutter build ios`; `pod install` pulls MediaPipe.

### Debugging "the camera is not working"

1. Which platform? Android APK / iPhone Safari / desktop browser.
2. Permission: Android asks at runtime (`permission_handler`); iOS via
   `NSCameraUsageDescription`; web needs **HTTPS** (fine on serverpod.space)
   and a user gesture; iOS Safari needs `playsinline` (set).
3. Portrait? On web the screen says "Turn your phone sideways" and sends no
   frames — by design (§4.3 rule 1).
4. Read the small error text under "Hand tracking could not start" (rule 11).
   Android: `adb logcat | grep -E "ParlanceSignCamera|AndroidRuntime"`.
   Always test camera changes with a **release** APK (`flutter build apk
   --release` or `tool/build_android.sh`) — debug builds behave differently
   (rule 9).
   "Hand tracker could not start" → MediaPipe init failed (see emulator note).
   No frames → check the EventChannel listener (one shared stream in
   `camera_view_native.dart`; the layout must not rebuild the camera widget —
   it is wrapped in a `KeyedSubtree` inside one `Flex`).
5. Hands found but no words: status pill shows "Reading one/both hands"?
   Then check the recogniser stream (`serverpod cloud log`), the frame rate
   (rule 5) and that signs end (lower hands).
6. Never "fix" recognition by mirroring frames, scaling coordinates, smoothing
   the vector, changing MediaPipe versions or the model file.

## 7. Deploying (Serverpod Cloud)

- Cloud project: **`parlance-isl`** (Starter plan, database enabled), on the
  team's Serverpod Cloud account (the teammate's account, already logged in
  at https://console.serverpod.dev). URLs:
  - Web app: https://parlance-isl.serverpod.space
  - API: https://parlance-isl.api.serverpod.space
  - Signer: https://parlance-isl.serverpod.space/signer/embed/sign
  - Android APK: https://parlance-isl.serverpod.space/get/parlance.apk
- `parlance_mobile_server/scloud.yaml` links the folder to that project
  (committed). On a new laptop: `serverpod cloud auth login` (opens the
  browser; use the same account), then run commands from
  `parlance_mobile_server`.
- **What a deploy does:** `serverpod cloud deploy` zips the *local* folder
  (respecting `.gitignore` + `.scloudignore`), builds it in the cloud and
  rolls out a new version that **replaces the running code**. The database,
  its data and the cloud passwords are **kept**; pending migrations apply
  automatically. It deploys whatever is on your disk — not what is on GitHub —
  so pull `main` first and commit what you deploy.
- Cloud passwords already set (custom): `appUrl`, `signerUrl`, `androidUrl`,
  `androidBuild`. Auth/database secrets are managed by Serverpod Cloud
  (`AUTO (Platform)`) — never set them. List: `serverpod cloud password list`.
  A changed password takes effect after the next deploy.
- **Full release, in order** (from `parlance_mobile/parlance_mobile_server`):
  ```bash
  git pull
  (cd ../parlance_mobile_flutter && flutter build web --base-href / --output ../parlance_mobile_server/web/app)
  ./tool/build_signer.sh
  ./tool/build_android.sh https://parlance-isl.api.serverpod.space/   # also sets androidBuild
  serverpod cloud deploy --wet-run --show-files   # optional: check web/app, web/signer, web/get are included
  serverpod cloud deploy
  ```
  Server-only change? You still must have `web/app`, `web/signer` and
  `web/get` present locally, or the deploy removes them from the site.
- Check: `curl -s -X POST https://parlance-isl.api.serverpod.space/settings/get -H 'content-type: application/json' -d '{}'`;
  logs: `serverpod cloud log --since 10m`; status:
  `serverpod cloud status deployment show`.
- Serverpod Cloud's hackathon trial lasts 30 days.

### Android updates and the signing key (important)

- Android will only install an update **over** an existing app if both are
  signed with the **same key**. Builds are signed with the debug keystore of
  the machine that builds them (`~/.android/debug.keystore`).
- The APKs published so far were signed on the original author's Mac. Ask for
  that file and put it at `~/.android/debug.keystore` on your machine
  **before** building, so your APKs install over the current one. If you
  cannot get it, every tester must **uninstall Parlance once** before
  installing your first APK (Android says "App not installed" otherwise).
- `build_android.sh` stamps a build number (`--dart-define=APP_BUILD`) and
  sets the cloud password `androidBuild`; after the deploy, installed apps
  with an older build show "Update available" on Home.
- Server-only changes need no new APK. The iPhone web app updates on reload.

## 8. Git workflow

- Repo: https://github.com/tzxh45dhff-art/parlance — work on `main` (or a
  branch, then merge); push after tests pass. Commit messages: what changed and
  why, in plain words.
- Never commit: `config/passwords.yaml`, `web/app`, `web/signer`, `web/get`,
  `build/`, `.dart_tool/`, keystores, recordings of people, `.env` files.
- Do commit: generated client/protocol code and migrations (Serverpod
  projects commit them), `scloud.yaml`, `.scloudignore`,
  `assets/recognition/*`, `assets/learn/curriculum.json`.
- The website at the repo root has its own rules in the root `CLAUDE.md`
  (do not change the 141-float layout, `public/models/*.task`, or the
  smoothing/aspect logic; keep its tests passing with `npm test`).

## 9. Known limitations (say them honestly)

- Recognition: ~630 words, one at a time; trained on ISL500 (licensed for
  research/academic use only — fine for the hackathon demo, not for a public
  product) and INCLUDE (CC BY 4.0). Not verified on a real Android phone yet.
- 3D signer: approximate hand-made animations; unknown words fingerspelled;
  needs internet.
- Speech captions use the phone's/browser's own speech recogniser (English or
  Hindi); quality depends on the device. Firefox has none.
- Rooms run on one server instance (no Redis); fine for the demo.
- APK is ~89 MB (MediaPipe native libraries for arm + arm64).

## 10. Serverpod tooling notes (from the template)

The server and Flutter app can run under the Serverpod runner. If the
`serverpod` MCP server is available to your agent, prefer it for
`create_migration`, `apply_migrations`, `tail_server_logs`,
`tail_runner_logs`, `tail_flutter_logs`, `hot_reload`/`hot_restart`.
Otherwise use the CLI in the server package: `serverpod generate`,
`serverpod create-migration`, `serverpod runner start|status|stop`.

Checklist after changes, in order:

1. `dart analyze` (server: `--fatal-infos`), `dart format`
2. `serverpod generate`; `serverpod create-migration` if tables changed
3. Run tests (§6)
4. Check server and app logs
5. Commit, push, then deploy (§7) if the change should go live

The app can be driven by the Flutter driver: it is launched from
`parlance_mobile_flutter/lib/driver.dart` (text entry emulation off; set
`enableTextEntryEmulation: true` there to let an agent type).
