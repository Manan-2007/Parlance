import 'package:serverpod/serverpod.dart';

import '../generated/protocol.dart';
import 'recognizer.dart';

/// Reads signs from a phone's hand landmarks, live.
///
/// The phone streams one [SignFrame] at a time (the next once the last one's
/// result has arrived) and receives a [SignResult] for each: words when a sign
/// is finished, suggestions when the recogniser is unsure. This is the
/// recogniser from the Parlance web app (parlance-isl/backend), ported to Dart
/// so it runs inside this server.
class SignEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  Stream<SignResult> read(Session session, Stream<SignFrame> frames) async* {
    final worker = await sharedRecognitionWorker();
    final id = RecognitionWorker.newSessionId();
    try {
      yield _result(await worker.call(id, 'open'));
      await for (final frame in frames) {
        Map<String, Object?> response;
        if (frame.reset == true) {
          response = await worker.call(id, 'reset');
        } else if (frame.confirm != null) {
          response = await worker.call(id, 'confirm', [
            frame.confirm!,
            frame.revision,
          ]);
        } else {
          final vector = frame.landmarks;
          final timestamp = frame.timestamp;
          if (vector == null ||
              vector.length != 141 ||
              vector.any((v) => !v.isFinite || v.abs() > 100)) {
            response = {'error': 'Expected 141 finite landmark coordinates'};
          } else if (timestamp == null || !timestamp.isFinite) {
            response = {'error': 'Invalid frame timestamp'};
          } else {
            response = await worker.call(id, 'feed', [vector, timestamp]);
          }
        }
        yield _result(response)..frameId = frame.frameId;
      }
    } finally {
      await worker.call(id, 'close');
    }
  }

  SignResult _result(Map<String, Object?> r) => SignResult(
    status: r['status'] as String?,
    word: r['word'] as String?,
    confirmed: r['confirmed'] as bool?,
    confidence: (r['confidence'] as num?)?.toDouble(),
    candidate: r['candidate'] as String?,
    reason: r['reason'] as String?,
    stableFor: r['stable_for'] as int?,
    suggestions: (r['suggestions'] as List?)
        ?.cast<Map<String, Object>>()
        .map(
          (s) => SignSuggestion(
            word: s['word'] as String,
            confidence: (s['confidence'] as num).toDouble(),
          ),
        )
        .toList(),
    revision: r['revision'] as int?,
    isFinal: r['final'] as bool?,
    buffered: r['buffered'] as int?,
    needed: r['needed'] as int?,
    error: r['error'] as String?,
    automatic: (r['automatic'] as List?)?.cast<String>(),
  );
}
