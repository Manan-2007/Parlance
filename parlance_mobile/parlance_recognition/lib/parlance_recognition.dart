/// Parlance's ISL sign recogniser in pure Dart (no Flutter, no Serverpod, no
/// dart:io), shared by the Serverpod server and the phone app. A line-by-line
/// port of the web app's Python recogniser (repo root `backend/`); its answers
/// must stay the same (see the server's `test/unit/recognition_model_test.dart`).
library;

export 'src/features.dart';
export 'src/recognition_worker.dart';
export 'src/recognizer.dart';
export 'src/session.dart';
export 'src/transformer.dart';
