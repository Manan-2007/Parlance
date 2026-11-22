import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:parlance_recognition/parlance_recognition.dart';

import 'offline_server_stub.dart' if (dart.library.io) 'offline_server_io.dart';

/// What works on this phone without internet.
///
/// Built into the Android and iOS apps by tool/prepare_offline.sh:
/// - the sign recogniser's model, run on the phone ([offlineRecognizer]);
/// - the website's 3D signer, served to the web view from inside the app
///   ([offlineSignerBase]).
///
/// The web app always uses the server (it is online by definition), and an
/// app built without the offline files falls back to the server too.
abstract final class Offline {
  static const _recognition = 'assets/offline/recognition';

  static Future<RecognitionWorker?>? _worker;

  /// The sign recogniser running on this phone, or null if this build has no
  /// offline model (or this is the web app).
  static Future<RecognitionWorker?> recognizer() =>
      _worker ??= _startRecognizer();

  static Future<RecognitionWorker?> _startRecognizer() async {
    if (kIsWeb) return null;
    try {
      final files = ModelFiles(
        transformerJson: await rootBundle.loadString(
          '$_recognition/transformer.json',
        ),
        transformerBin: _bytes(
          await rootBundle.load('$_recognition/transformer.bin'),
        ),
        forestJson: await rootBundle.loadString('$_recognition/forest.json'),
        forestBin: _bytes(await rootBundle.load('$_recognition/forest.bin')),
      );
      return await RecognitionWorker.start(files);
    } catch (error) {
      debugPrint('Offline sign reader unavailable: $error');
      return null;
    }
  }

  static Uint8List _bytes(ByteData data) =>
      data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);

  static Future<Uri?>? _signer;

  /// `http://127.0.0.1:<port>/signer/` serving the bundled 3D signer, or null
  /// when this build has none (or this is the web app).
  static Future<Uri?> signerBase() => _signer ??= startSignerServer(rootBundle);
}
