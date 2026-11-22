import 'dart:async';
import 'dart:isolate';

import 'recognizer.dart';
import 'session.dart';

/// Runs recognition sessions on one background isolate, so the ~80 ms
/// transformer passes never hold up anything else (the server's other
/// requests, or the phone's camera and screen).
///
/// The same worker runs in the Serverpod server (every signer's session) and
/// in the app on a phone (one session, offline). Commands: `open`, `feed`
/// ([vector, timestamp]), `reset`, `confirm` ([word, revision]), `close`; the
/// answers are the web app's recogniser messages as maps.
class RecognitionWorker {
  RecognitionWorker._(this._commands);

  final SendPort _commands;
  final _pending = <int, Completer<Map<String, Object?>>>{};
  int _next = 0;

  /// Starts the worker and loads [files] into it.
  static Future<RecognitionWorker> start(
    ModelFiles files, {
    bool liveGuesses = false,
  }) async {
    final replies = ReceivePort();
    final ready = Completer<SendPort>();
    final failed = Completer<Object>();
    late RecognitionWorker worker;
    replies.listen((message) {
      if (message is SendPort) {
        ready.complete(message);
      } else if (message is String) {
        failed.complete(message);
      } else if (message is List) {
        worker._pending
            .remove(message[0] as int)
            ?.complete((message[1] as Map).cast<String, Object?>());
      }
    });
    await Isolate.spawn(_main, [
      replies.sendPort,
      files.transformerJson,
      TransferableTypedData.fromList([files.transformerBin]),
      files.forestJson,
      TransferableTypedData.fromList([files.forestBin]),
      liveGuesses,
    ], debugName: 'sign-recognition');
    final port = await Future.any<Object>([ready.future, failed.future]);
    if (port is! SendPort)
      throw StateError('The sign reader could not start: $port');
    worker = RecognitionWorker._(port);
    return worker;
  }

  /// Sends [command] for the session [id]; returns the recogniser's response.
  Future<Map<String, Object?>> call(int id, String command, [Object? data]) {
    final request = _next++;
    final completer = _pending[request] = Completer();
    _commands.send([request, id, command, data]);
    return completer.future;
  }

  static int _ids = 0;
  static int newSessionId() => _ids++;

  static void _main(List<Object?> start) {
    final [
      replies as SendPort,
      transformerJson as String,
      transformerBin as TransferableTypedData,
      forestJson as String,
      forestBin as TransferableTypedData,
      liveGuesses as bool,
    ] = start;
    final SignRecognizer model;
    try {
      model = SignRecognizer.fromFiles(
        ModelFiles(
          transformerJson: transformerJson,
          transformerBin: transformerBin.materialize().asUint8List(),
          forestJson: forestJson,
          forestBin: forestBin.materialize().asUint8List(),
        ),
      );
    } catch (error) {
      replies.send('$error');
      return;
    }
    final commands = ReceivePort();
    replies.send(commands.sendPort);
    final sessions = <int, RecognitionSession>{};
    commands.listen((message) {
      final [request as int, id as int, command as String, data] =
          message as List;
      Map<String, Object?> result;
      try {
        final session = sessions[id] ??= RecognitionSession(
          model,
          liveGuesses: liveGuesses,
        );
        switch (command) {
          case 'open':
            result = {'status': 'ready', 'automatic': model.automaticWords};
          case 'feed':
            final [vector as List<double>, timestamp as double] = data as List;
            result = session.feed(vector, timestamp);
          case 'reset':
            session.reset();
            result = {'status': 'reset'};
          case 'confirm':
            final [word as String, revision as int?] = data as List;
            result = session.confirm(word, revision);
          case 'close':
            sessions.remove(id);
            result = {};
          default:
            result = {'error': 'Unknown command'};
        }
      } catch (error) {
        sessions[id]?.reset();
        result = {'error': 'Recognition failed. Please sign the word again.'};
      }
      replies.send([request, result]);
    });
  }
}
