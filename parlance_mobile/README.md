# Parlance mobile

Two phones, one conversation. A Deaf person signs to their phone's camera; the
other phone shows the words and reads them aloud. The hearing person talks; the
Deaf person's phone shows big captions and can play them with the 3D signer.
Ready-made cards in English and Hindi work without a second phone.

Built with Flutter, Riverpod and Serverpod 4 for the HackBriven × Serverpod
hackathon (Track 2, "Superpowers in your pocket"): the camera reads signs, the
microphone hears speech, and Serverpod connects the phones and reads the signs.

Everything runs on **Serverpod Cloud**:

| Part | What it is |
|---|---|
| `parlance_mobile_flutter` | The app (Android, iPhone through the web app, web) |
| `parlance_mobile_server` | Rooms and live streams between phones, anonymous accounts, **sign recognition** (`SignEndpoint`, the web app's recogniser ported to Dart), and it serves the web app (`/`), the 3D signer (`/signer/`) and the Android download (`/get/parlance.apk`) |

The sign recogniser is the Parlance web app's (`backend/` at the repo root), ported to
Dart in `parlance_mobile_server/lib/src/recognition/`: the transformer ensemble
gives the shipped ONNX model's probabilities (test), and replaying 20,785
recorded frames gives the same response as the Python recogniser on every one
(`tool/replay_check.dart`).

## Run it on this computer

```bash
cd parlance_mobile_server && ./tool/build_signer.sh   # once: the 3D signer into web/signer
cd parlance_mobile && serverpod start                 # server, database and the app
```

An Android emulator reaches the server with
`flutter run --dart-define=SERVER_URL=http://10.0.2.2:8080/`. A phone on the same
Wi-Fi needs this computer's IP instead, and `publicHost` in
`config/development.yaml` set to it.

Tests: `dart test` in `parlance_mobile_server` (rooms, recognition, the sign
stream), `flutter test` in `parlance_mobile_flutter`.

## Deploy (Serverpod Cloud, hackathon credits)

You sign in yourself. From `parlance_mobile_server`:

```bash
./tool/build_signer.sh                       # the 3D signer
serverpod cloud launch                       # sign in, create the project, first deploy
serverpod cloud password set appUrl          # https://<project>.serverpod.space
serverpod cloud password set signerUrl       # https://<project>.serverpod.space/signer/embed/sign
serverpod cloud password set androidUrl      # https://<project>.serverpod.space/get/parlance.apk
./tool/build_android.sh https://<project>.api.serverpod.space/
serverpod cloud deploy
```

`.scloudignore` makes sure the built web app, signer and APK are uploaded.
Check with `serverpod cloud deploy --wet-run --show-files`.

## Share it with the team

- **Android**: open `https://<project>.serverpod.space/get/parlance.apk` on the
  phone, download, and allow installing from the browser when asked. (The web
  app's home page also shows a "Get the Android app" button on Android.)
- **iPhone**: open `https://<project>.serverpod.space` in Safari, then
  Share → Add to Home Screen. Sign with the phone turned sideways.
- Whoever joins a conversation needs nothing installed: scanning the QR code
  with any phone camera opens the web app straight into it.

## Demo (3 minutes)

1. Phone A: Start a conversation → I sign. Phone B scans the QR code.
2. Phone A: Sign → turn sideways → sign "hello". It appears on phone B and is
   read aloud. If the reader is unsure it asks "Did you sign…?"; tap the word.
3. Phone B: Talk, "What happened?" Big captions on phone A; "See it in sign"
   plays it with the 3D signer.
4. Phone A: Card → "I am Deaf. I need help." Phone B sees it in English and
   Hindi and taps a reply.
5. Show a card → Emergency: works with no second phone.

## Limits to say out loud

- About 630 ISL words (ISL500 + INCLUDE), one word at a time. The model is
  trained on ISL500, licensed for research only: fine for a hackathon demo, not
  for a public product.
- Speech captions use the phone's own recogniser (English or Hindi).
- The 3D signer is approximate; unknown words are fingerspelled.
- The Android emulator on Apple M4 Macs cannot run MediaPipe (it reports CPU
  features it does not have); use a real phone or the web app.
