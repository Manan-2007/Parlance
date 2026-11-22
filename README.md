# Parlance

Parlance includes Learn lessons, camera practice, Teach decks, fingerspelling,
practice logs and shareable community reviews alongside its translation studios.

Parlance pairs the interface from [Manan-2007/testing1](https://github.com/Manan-2007/testing1/tree/0305de29875abc96b2eec0a7554b2905f6046d9f) with the supplied Ch22 avatar and the English/Hindi signing engine carried over from the local project.

## Run locally

Requires Node.js 22.18 or newer and Python 3.11 or newer.

**One command:** `./start.sh` (macOS, Linux) or `start.bat` (Windows). The first
run installs the website packages and a Python environment in `.venv`; every run
starts the website and the local Python service, then opens
http://localhost:4173 in your browser. `./start.sh community` opens the
Community directly. Press Ctrl+C to stop. (The phone app is separate: it uses the
APK and Serverpod Cloud.)

By hand:

```sh
npm ci
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
npm run dev
```

Python 3.11 or newer runs camera recognition. On Windows, activate the environment
with `.venv\Scripts\activate`. `npm run dev` starts the FastAPI service on port 8000
and Vite on port 4173. Use `npm run dev:web` to run the web app separately or
`npm run dev:api` to start recognition in an activated Python environment.

Open [the local app](http://127.0.0.1:4173). Use the landing-page demo or open the **Speech → Sign** studio. The studio supports typed English and Hindi, browser voice input, replay, speed, mirroring, and a sign timeline.

**Learn** (`/app/learn`, also the default `/app` destination) includes six lesson
units and 239 reference signs, spaced review, personal recordings and shareable
decks. Practice comparison uses body anchors only in these learning flows;
Sign → Text keeps the faster hand-only tracker. Camera access is explicit.
Reviews are self-reported community feedback, not verified signer credentials,
and reviews of the old Remy rig do not apply to Ch22.

Text translation runs locally by default. To enable Gemini, copy `.env.example` to `.env`, add `GEMINI_API_KEY`, and restart. The key stays on the server.

For Azure neural voice output, set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`
in `.env` and restart. Speech defaults to Neerja's Indian English voice with an
empathetic style and gentle pacing. Settings also offers Ava, Hindi through Swara,
and the device's voices. Text selected for Azure speech is sent to the configured
Speech resource. `/api/speech` returns audio while credentials stay server-side.

Open **Sign → Text**, press **Start camera**, and allow camera access. Sign one word
at a time and lower your hands briefly between words. The browser tracks hands
locally and sends landmark coordinates to the bundled FastAPI service. The service
uses the original project's trained temporal forest, with 150 word classes and
52 words eligible for automatic insertion. Uncertain suggestions need an explicit
tap before they enter the transcript. Recognised words can be edited, saved to
history, and spoken aloud.

Tracking uses resized frames and a hand-only detector in a worker, with at most
one recognition request in flight. The recognizer uses variable windows starting
at five samples, samples at 10 Hz, and resets between separate signs. Camera pause,
stop and reconnect discard old evidence. The default model score threshold is
56%. Existing saved settings retain the user's selected threshold.

Automatic insertion requires repeated eligible predictions and at least 250 ms
of a hold while hands are actually observed. Losing tracking or moving out of
view does not satisfy that hold. A moving sign that never settles remains a
suggestion for confirmation; this conservative rule does not make the legacy
classifier a continuous-sign recognizer.

The default WebSocket address uses `/recognition/ws` through the web server's
proxy. Change the address in Settings or set `VITE_PARLANCE_WS` for a remote
service. Static deployments need to route that path to FastAPI. Only landmark
coordinates are transmitted. Camera images are processed on the device.

Live webcam accuracy still needs evaluation with new signers. The copied model
inherits research/academic source restrictions. Attribution, provenance and the
original evaluation are in [backend/models](backend/models/README.md).

The completed [candidate comparison](training/CANDIDATE_RESULTS.md) found no
experimental replacement ready for deployment. Data preparation and benchmark
commands are in [training/README.md](training/README.md). Without an ISL signer,
you can still record ordinary-activity controls using the [local evaluation
recorder](http://127.0.0.1:4173/evaluation-recorder.html). It records video only,
uploads nothing, and exports a ZIP for local unwanted-word-insertion checks.

## Build and test

- `npm run build` typechecks the project and builds web assets into `dist/`.
- `npm run start` previews the built app.
- `npm test` checks gloss output, animation coverage on Ch22/Remy/YBot, Learn practice, review scheduling, recording/deck validation and integration contracts.
- `npm run test:api` checks model loading, features, acceptance, repeat suppression and resets.

## Project layout

- `src/features/` and `src/components/` contain the imported Parlance UI.
- `src/avatar/` renders Ch22 and maps the existing YBot-relative word, letter and digit animations onto its rig, including numbered Mixamo bone prefixes. `public/assets/ch22.glb` comes from the supplied `Ch22_nonPBR.fbx`, normalized to 1.8m and packaged with embedded 1024px textures and non-metallic materials. Its provenance is in `public/assets/ch22.provenance.json`. `public/assets/ybot.glb` is the reference rig, and Remy remains a rig-coverage fixture.
- `src/translation/` and `src/services/signs/prepareSpeech.ts` turn text into the UI queue.
- `server/` provides the optional translation API in local dev and preview.
- `backend/` contains the FastAPI WebSocket word recognizer and its trained model.
- `src/learn/` and `src/features/learn/` contain the learning logic and pages; `src/features/teach/` contains personal recording and deck flows.
- `public/signs/` contains 239 ISLRTC landmark references, official video links in `sources.json`, the camera vocabulary and recognition metadata. These reference files do not automatically add word animations to the avatar translator.

The sign animations still need linguistic review on the current avatar. Changing
the character does not establish correct hand shapes, grammar or facial signing.

Rebuild a supplied avatar with Blender and Python/Pillow:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/import-avatar.py -- /absolute/path/to/model.fbx .research-cache/avatar/model.glb
python3 scripts/optimize-avatar.py .research-cache/avatar/model.glb public/assets/ch22.glb --non-pbr
```
