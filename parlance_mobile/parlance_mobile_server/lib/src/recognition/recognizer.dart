import 'dart:io';

import 'package:parlance_recognition/parlance_recognition.dart';

export 'package:parlance_recognition/parlance_recognition.dart';

/// The model files in [directory] (`assets/recognition/` in this package).
ModelFiles readModelFiles([String directory = 'assets/recognition']) =>
    ModelFiles(
      transformerJson: File('$directory/transformer.json').readAsStringSync(),
      transformerBin: File('$directory/transformer.bin').readAsBytesSync(),
      forestJson: File('$directory/forest.json').readAsStringSync(),
      forestBin: File('$directory/forest.bin').readAsBytesSync(),
    );

SignRecognizer? _loaded;

/// The recogniser, loaded once (tests and tools; the server itself uses
/// [sharedRecognitionWorker]).
SignRecognizer loadSignRecognizer([String directory = 'assets/recognition']) =>
    _loaded ??= SignRecognizer.fromFiles(readModelFiles(directory));

Future<RecognitionWorker>? _worker;

/// One background worker for every signer's session on this server.
Future<RecognitionWorker> sharedRecognitionWorker() =>
    _worker ??= RecognitionWorker.start(readModelFiles());
