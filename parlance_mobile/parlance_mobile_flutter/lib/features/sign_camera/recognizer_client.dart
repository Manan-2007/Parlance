import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:parlance_recognition/parlance_recognition.dart';

import '../../core/client.dart';
import '../../core/offline.dart';
import '../../core/session.dart';

/// A word the recogniser is considering, or offers for the signer to tap.
class Candidate {
  const Candidate(this.word, this.confidence);
  final String word;
  final double confidence;
}

enum RecognizerStatus { connecting, ready, offline }

class RecognizerState {
  const RecognizerState({
    this.status = RecognizerStatus.connecting,
    this.candidate,
    this.suggestions = const [],
    this.buffered,
    this.error,
  });

  final RecognizerStatus status;

  /// The current best guess while the sign is still going.
  final Candidate? candidate;

  /// Words to tap when the recogniser is unsure.
  final List<Candidate> suggestions;

  /// Frames collected towards the first guess (have, need).
  final (int, int)? buffered;
  final String? error;
}

/// Sends hand landmarks to the sign recogniser and turns its answers into
/// words: words back when a sign is finished, suggestions when it is unsure.
///
/// On Android and iOS the recogniser runs on the phone (the same Dart code as
/// the server, package parlance_recognition, in a background isolate), so
/// signing works without internet. The web app, or a build without the offline
/// model, streams to the Serverpod server (`SignEndpoint.read`) instead.
class RecognizerClient {
  RecognizerClient({required this.onWord, required this.onState});

  /// A finished, accepted word.
  final void Function(String word, double confidence) onWord;
  final void Function(RecognizerState state) onState;

  StreamController<SignFrame>? _frames;
  StreamSubscription<SignResult>? _sub;
  final _clock = Stopwatch()..start();
  int _nextFrame = 0;
  int? _pending;
  int _minimumFrame = 0;
  int _revision = 0;
  int _attempt = 0;
  bool _closed = false;
  Timer? _retry;
  RecognizerState _state = const RecognizerState();

  RecognitionWorker? _local;
  int? _localSession;

  /// Whether signs are read on this phone (works without internet) rather
  /// than by the server.
  bool get onDevice => _local != null;

  Future<void> connect() async {
    _closed = false;
    _emit(
      RecognizerState(status: RecognizerStatus.connecting, error: _state.error),
    );
    final local = await Offline.recognizer();
    if (_closed) return;
    if (local != null) {
      _local = local;
      final id = _localSession = RecognitionWorker.newSessionId();
      _message(await local.call(id, 'open'));
      return;
    }
    try {
      await ensureSignedIn();
      if (_closed) return;
      final frames = _frames = StreamController<SignFrame>();
      _sub = client.sign
          .read(frames.stream)
          .listen(
            (result) {
              _attempt = 0;
              _message(_asMap(result));
            },
            onError: (Object _) => _lost(),
            onDone: _lost,
          );
    } catch (_) {
      _lost();
    }
  }

  void close() {
    _closed = true;
    final local = _local;
    final id = _localSession;
    if (local != null && id != null) unawaited(local.call(id, 'close'));
    _localSession = null;
    _retry?.cancel();
    _sub?.cancel();
    _frames?.close();
    _frames = null;
  }

  /// Frames are streamed without waiting for each answer: the server may be
  /// far away (half a second or more), and the recogniser segments signs by
  /// these timestamps, so network delay never changes what it reads. About
  /// 12 frames a second (the recogniser samples every 90 ms), and never more
  /// than [maxInFlight] unanswered, so a slow link cannot build a backlog.
  static const minIntervalMs = 75.0;
  static const maxInFlight = 40;
  double _lastSent = -double.infinity;

  void send(List<double> vector) {
    final frames = _frames;
    final local = _local;
    final session = _localSession;
    if ((frames == null && session == null) ||
        _state.status != RecognizerStatus.ready) {
      return;
    }
    final now = _clock.elapsedMicroseconds / 1000.0;
    if (now - _lastSent < minIntervalMs) return;
    if (_pending != null && _nextFrame - _pending! >= maxInFlight) return;
    _lastSent = now;
    final frameId = _nextFrame++;
    _pending ??= frameId;
    if (local != null && session != null) {
      // On the phone: the isolate answers in order, like the server stream.
      unawaited(
        local.call(session, 'feed', [vector, now]).then((result) {
          if (_localSession == session) {
            _message({...result, 'frameId': frameId});
          }
        }),
      );
      return;
    }
    frames!.add(
      SignFrame(
        landmarks: vector,
        timestamp: now,
        frameId: frameId,
      ),
    );
  }

  /// Taps a suggested word.
  void confirm(String word) {
    final session = _localSession;
    if (session != null) {
      unawaited(
        _local!.call(session, 'confirm', [word, _revision]).then(_message),
      );
    }
    _frames?.add(SignFrame(confirm: word, revision: _revision));
    _emit(RecognizerState(status: _state.status, candidate: _state.candidate));
  }

  /// Forgets the sign in progress.
  void reset() {
    _minimumFrame = _nextFrame;
    final session = _localSession;
    if (session != null) {
      unawaited(_local!.call(session, 'reset').then(_message));
    }
    _frames?.add(SignFrame(reset: true));
    _emit(RecognizerState(status: _state.status));
  }

  Map<String, dynamic> _asMap(SignResult r) => {
    if (r.status != null) 'status': r.status,
    if (r.word != null) 'word': r.word,
    if (r.confidence != null) 'confidence': r.confidence,
    if (r.candidate != null) 'candidate': r.candidate,
    if (r.reason != null) 'reason': r.reason,
    if (r.suggestions != null)
      'suggestions': [
        for (final s in r.suggestions!)
          {'word': s.word, 'confidence': s.confidence},
      ],
    if (r.revision != null) 'revision': r.revision,
    if (r.isFinal != null) 'final': r.isFinal,
    if (r.buffered != null) 'buffered': r.buffered,
    if (r.needed != null) 'needed': r.needed,
    if (r.error != null) 'error': r.error,
    if (r.frameId != null) 'frameId': r.frameId,
  };

  /// Mirrors the web app's handling (useRecognitionService.ts): suggestions
  /// stay until a word, new suggestions or new buffering replace them; the
  /// "hands resting" messages between signs change nothing.
  void _message(Map<String, dynamic> msg) {
    final frameId = msg['frameId'];
    // _pending is the oldest unanswered frame; answers arrive in order.
    if (frameId is int && _pending != null && frameId >= _pending!) {
      _pending = frameId + 1 < _nextFrame ? frameId + 1 : null;
    }
    if (frameId is int && frameId < _minimumFrame) return;

    var candidate = _state.candidate;
    var suggestions = _state.suggestions;
    var buffered = _state.buffered;
    var error = _state.error;
    var changed = false;

    if (msg['suggestions'] is List) {
      _revision = (msg['revision'] as num?)?.toInt() ?? _revision;
      suggestions = [
        for (final s
            in (msg['suggestions'] as List).whereType<Map<String, dynamic>>())
          if (s['word'] is String && s['confidence'] is num)
            Candidate(s['word'] as String, (s['confidence'] as num).toDouble()),
      ];
      changed = true;
    }
    if (msg['status'] == 'ready') {
      _emit(const RecognizerState(status: RecognizerStatus.ready));
      return;
    }
    if (msg['word'] is String) {
      onWord(
        msg['word'] as String,
        (msg['confidence'] as num?)?.toDouble() ?? 0,
      );
      candidate = null;
      suggestions = const [];
      buffered = null;
      error = null;
      changed = true;
    } else if (msg['error'] is String) {
      error = msg['error'] as String;
      changed = true;
    } else if (msg['candidate'] is String) {
      // Mid-sign guesses are not answers; only a finished sign's guess is shown.
      candidate = msg['final'] != false
          ? Candidate(
              msg['candidate'] as String,
              (msg['confidence'] as num?)?.toDouble() ?? 0,
            )
          : null;
      buffered = null;
      changed = true;
    } else if (msg['buffered'] != null) {
      buffered = (
        (msg['buffered'] as num).toInt(),
        (msg['needed'] as num? ?? 5).toInt(),
      );
      candidate = null;
      suggestions = const [];
      changed = true;
    } else if (msg['status'] == 'reset' || msg['status'] == 'configured') {
      candidate = null;
      suggestions = const [];
      buffered = null;
      changed = true;
    }
    if (changed) {
      _emit(
        RecognizerState(
          status: RecognizerStatus.ready,
          candidate: candidate,
          suggestions: suggestions,
          buffered: buffered,
          error: error,
        ),
      );
    }
  }

  void _lost() {
    if (_closed) return;
    _sub?.cancel();
    _frames?.close();
    _frames = null;
    _pending = null;
    _emit(
      RecognizerState(
        status: _attempt >= 3
            ? RecognizerStatus.offline
            : RecognizerStatus.connecting,
        error: _attempt >= 3
            ? 'The sign reader is offline. Type or use a card meanwhile.'
            : null,
      ),
    );
    _retry?.cancel();
    final delay = Duration(seconds: [1, 2, 4, 8, 15][_attempt.clamp(0, 4)]);
    _attempt++;
    _retry = Timer(delay, () {
      if (!_closed) connect();
    });
  }

  void _emit(RecognizerState state) {
    _state = state;
    onState(state);
    if (kDebugMode && state.error != null) {
      debugPrint('Recognizer: ${state.error}');
    }
  }
}
