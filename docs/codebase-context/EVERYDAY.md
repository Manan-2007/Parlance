# Everyday tools: Home, Cards, captions, sound alerts, offline

How the workspace is organised and where each everyday feature lives.

## Navigation

- **Home** (`/app`, `src/features/home/HomePage.tsx`) lists everything by situation:
  Emergency first, then "Talk with someone" (Speech → Sign, Sign → Text, Live captions,
  Show a card), "Before you go out" (visit card), "At home" (sound alerts), "Keep learning"
  (continue lesson, sign of the day, signs for your work) and "Your things" (History,
  Settings, Help, install). The logo goes to Home.
- **Header** (`AppHeader.tsx`): direction switcher; Home, Cards, Learn with labels from `lg`;
  History, Settings, Help as icons with tooltips until `2xl`; a red **Emergency** button on
  every page; a "Listening" pill while sound alerts use the microphone.
- **Phone tabs** (`AppShell.tsx`): Home, Speech→Sign, Sign→Text, Cards, Learn.
- The fingerspelling page transition (`routeGate.ts shouldSpell`) now runs only between
  sections, never for `/app/cards*` (emergencies can't wait ~2 s).

## Cards (`src/features/cards/`, store `src/stores/cards.ts`)

For a Deaf person to be understood by someone who doesn't sign.

- `cardData.ts`: places (emergency, hospital, pharmacy, police, bank, railway, auto, shop),
  each with cards and the replies staff can tap. Every line is English + Hindi; Hindi avoids
  gendered verb forms. Cards can have a blank (`fill`) or use "About me" (`profile`).
- `CardScreen.tsx`: full-screen card (native `<dialog>`), screen wake lock, Read aloud,
  "Turn for them" (rotates 180° for someone across a counter). Their reply (tap, type, or
  speak) comes back as big text, and **See it in sign** lazy-loads the 3D signer
  (`SignReply.tsx`, reusing `SignerStage`).
- `SosPanel.tsx` (emergency only): opens SMS / WhatsApp / share with a message and map link
  to the emergency contact (`src/lib/visitCard.ts sosMessage`). Parlance sends nothing; the
  person presses Send in their app. `tel:` links for 112 / 108 / 101.
- **Visit card** (`VisitPage.tsx`): prepared before an appointment, shown full screen, or
  shared by QR code / link (`/app/cards/visit/view#…`, packed like decks, no server). The
  staff view has Print and a link to clinic signs.
- About me / visit card / own cards live in localStorage `parlance.cards.v1`; Settings →
  Cards and alerts edits or deletes them.
- Wired in where they are needed: Sign → Text offers "Show a card instead" when a sign isn't
  recognised or the service is offline; the hospital cards link to the visit card; work
  paths link to the cards their visitors may show.

## Live captions (Speech → Sign, `?view=captions`)

`CaptionsBoard.tsx`: continuous speech recognition (`useSpeechInput(..., { continuous: true })`
restarts the browser recognizer after silences), big text with size control, full screen,
copy / save as .txt, and **Sign** on any line (switches to the signer and plays it).

## Sound alerts (`/app/sound-alerts`)

- Engine and settings: `src/services/sound/useSoundAlerts.ts` (module-level, so listening
  continues on other pages). MediaPipe `@mediapipe/tasks-audio` + `public/models/yamnet.tflite`
  (Google's YAMNet, AudioSet labels); runtime staged to `public/mediapipe/audio-wasm` by
  `scripts/copy-assets.mjs`. About one classification per second at 16 kHz.
- `src/lib/soundAlerts.ts`: sound groups → YAMNet labels and thresholds (tested against the
  model's label list in `test/fixtures/yamnet_labels.txt`).
- `SoundAlertLayer.tsx` (mounted in `AppShell`): full-screen alert, ~1 flash/s (steady colour
  with reduced motion), vibration, optional notification when hidden; header pill.
- Checked in headless Chrome with a fake microphone playing a 3.1 kHz beep: heard as
  "Smoke detector, smoke alarm" and raised the Alarm alert.

## Learn extras

- **Signs for your work** (`src/learn/workPaths.ts`, `WorkPathPage.tsx`): clinic, police, bank,
  railway, shop and school paths, split into ~8-sign lessons taught by `planDeckLesson`
  (`/app/learn/work/:id/lesson?part=n`), plus a printable "Deaf-friendly desk" poster with a
  QR code to the cards.
- **Sign of the day** (`SignOfTheDay.tsx`): the same sign for everyone on a local day; on Learn
  and Home.

## Installable and offline

`public/manifest.webmanifest` (+ `public/icons/`), `src/app/pwa.tsx` (install button, iOS
instructions, service worker registration in production only) and `server/serviceWorker.js`,
which the Vite build turns into `dist/sw.js`: it precaches the app shell and every bundled
file (~3 MB), serves pages network-first with the cached shell offline, and caches models and
sign data on first use. Verified: after one visit, `/app/cards/emergency` and live captions
load with the network off.
