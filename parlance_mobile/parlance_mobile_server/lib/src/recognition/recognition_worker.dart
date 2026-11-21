import 'dart:async';
import 'dart:isolate';

import 'recognizer.dart';
import 'session.dart';

/// Runs every signer's recognition session on one background isolate, so the
/// ~80 ms transformer passes never hold up the server's other requests.
class RecognitionWorker {
  RecognitionWorker._(this._commands);

  final SendPort _commands;
  final _pending = <int, Completer<Map<String, Object?>>>{};
  int _next = 0;

  static Future<RecognitionWorker>? _shared;
  static Future<RecognitionWorker> get shared => _shared ??= _start();

  static Future<RecognitionWorker> _start() async {
    final replies = ReceivePort();
    final ready = Completer<SendPort>();
    late RecognitionWorker worker;
    replies.listen((message) {
      if (message is SendPort) {
        ready.complete(message);
      } else if (message is List) {
        worker._pending
            .remove(message[0] as int)
            ?.complete((message[1] as Map).cast<String, Object?>());
      }
    });
    await Isolate.spawn(_main, replies.sendPort, debugName: 'sign-recognition');
    worker = RecognitionWorker._(await ready.future);
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

  static void _main(SendPort replies) {
    final commands = ReceivePort();
    replies.send(commands.sendPort);
    final model = SignRecognizer.load();
    final sessions = <int, RecognitionSession>{};
    commands.listen((message) {
      final [request as int, id as int, command as String, data] =
          message as List;
      Map<String, Object?> result;
      try {
        final session = sessions[id] ??= RecognitionSession(
          model,
          liveGuesses: false,
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
