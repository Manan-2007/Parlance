// Port of parlance-isl/backend/recognition.py: per-camera word segmentation,
// confidence gates and repeat suppression. Results are the same dictionaries
// the Python WebSocket sends, so the app reads them the same way.
import 'dart:math' as math;
import 'dart:typed_data';

import 'features.dart';
import 'recognizer.dart';

typedef Result = Map<String, Object?>;

class RecognitionSession {
  RecognitionSession(this.model, {this.liveGuesses = true})
    : threshold = model.threshold,
      commitOnRelease = model.commitOnRelease,
      releaseMs = model.releaseMs,
      rejoinMs = model.rejoinMs,
      settleMs = model.settleMs,
      restartMs = model.restartMs {
    reset();
  }

  final SignRecognizer model;

  /// Whether to guess every 250 ms while a sign is still going, as the Python
  /// recogniser does. With settleMs set (the shipped model), those guesses are
  /// never shown or committed: words come only when a sign ends. The server
  /// turns them off to spend the model only on finished signs; finished-sign
  /// results are the same either way (tool/replay_check.dart --final-only).
  final bool liveGuesses;
  double threshold;
  final bool commitOnRelease;
  final double releaseMs;
  final double rejoinMs;
  final double settleMs;
  final double restartMs;
  int revision = 0;

  final List<(double, Float64List)> frames = [];
  double lastTime = -double.infinity;
  double lastPresent = -double.infinity;
  double lastSample = -double.infinity;
  double lastQuery = -double.infinity;
  double lastMoving = -double.infinity;
  Float64List? previous;
  (String, int) agreement = ('', 0);
  String? committed;
  bool released = false;
  bool decided = false;
  List<Suggestion> suggestions = [];
  Result result = {'status': 'listening', 'reason': 'resting'};

  void reset() {
    frames.clear();
    lastTime = -double.infinity;
    lastPresent = -double.infinity;
    lastSample = -double.infinity;
    lastQuery = -double.infinity;
    lastMoving = -double.infinity;
    previous = null;
    agreement = ('', 0);
    committed = null;
    released = false;
    decided = false;
    suggestions = [];
    revision += 1;
    result = {'status': 'listening', 'reason': 'resting'};
  }

  void startSign() {
    final last = frames.isEmpty ? null : frames.last;
    frames
      ..clear()
      ..addAll([?last]);
    committed = null;
    decided = false;
    agreement = ('', 0);
    suggestions = [];
    lastQuery = -double.infinity;
    revision += 1;
    result = {'status': 'listening', 'reason': 'resting'};
  }

  Result confirm(String word, int? atRevision) {
    final candidate = suggestions.where((c) => c.word == word).firstOrNull;
    if (committed != null || atRevision != revision || candidate == null) {
      return {'error': 'That suggestion has expired. Sign the word again.'};
    }
    committed = candidate.word;
    suggestions = [];
    return {...candidate.toJson(), 'confirmed': true};
  }

  Result predict(double now, {bool isFinal = false}) {
    final windows = <RecognitionWindow>[];
    final sizes = <int>{};
    for (final duration in windowsMs) {
      final chosen = [
        for (final f in frames)
          if (f.$1 >= frames.last.$1 - duration) f.$2,
      ];
      if (chosen.length >= 5 && !sizes.contains(chosen.length)) {
        windows.add(model.window(chosen));
        sizes.add(chosen.length);
      }
    }
    if (windows.isEmpty) {
      return {'status': 'listening', 'buffered': frames.length, 'needed': 5};
    }
    lastQuery = now;
    final decision = model.predict(windows, threshold);
    final word = decision.candidate;
    final same = agreement.$1 == word;
    final count = same && decision.eligible
        ? agreement.$2 + 1
        : (decision.eligible ? 1 : 0);
    agreement = (word, count);
    var settled = count >= 2 && lastPresent - lastMoving >= 250;
    if (settleMs > 0) settled = false;
    if (isFinal && commitOnRelease) settled = true;
    final span = isFinal
        ? <String, Object?>{
            'span': [frames.first.$1, frames.last.$1],
          }
        : <String, Object?>{};
    if (decision.eligible && settled) {
      committed = word;
      suggestions = [];
      return {
        'word': word,
        'confidence': decision.confidence,
        'confirmed': false,
        ...span,
      };
    }
    revision += 1;
    suggestions = isFinal || now - lastMoving >= 250 ? decision.candidates : [];
    result = {
      'status': 'listening',
      'candidate': word,
      'confidence': decision.confidence,
      'reason': decision.reason,
      'stable_for': count,
      'suggestions': [for (final s in suggestions) s.toJson()],
      'revision': revision,
      'final': isFinal || settleMs == 0,
      ...span,
    };
    return result;
  }

  Result feed(List<double> vector, double now) {
    if (now <= lastTime) return {'error': 'Frame timestamps must increase.'};
    if (now - lastTime > 1200) reset();
    lastTime = now;
    var present = false;
    for (var i = 0; i < 126; i++) {
      if (vector[i] != 0) {
        present = true;
        break;
      }
    }
    if (!present) {
      if (!released && now - lastPresent >= releaseMs) {
        released = true;
        if (frames.length >= 5 && committed == null && !decided) {
          return predict(now, isFinal: true);
        }
      }
      return {'status': 'listening', 'reason': 'resting'};
    }
    if (released) {
      if (committed == null && now - lastPresent <= rejoinMs) {
        released = false; // a tracking dropout: continue the same sign
      } else {
        reset();
        lastTime = now;
      }
    }
    lastPresent = now;
    if (now - lastSample >= 90) {
      final features = frameFeatures(vector);
      final moving = previous != null && movement(previous!, features) > 0.025;
      if (moving) {
        final rested = now - lastMoving >= restartMs;
        if (restartMs > 0 &&
            rested &&
            (committed != null || decided || frames.length > 1)) {
          startSign();
        }
        lastMoving = now;
        decided = false;
      }
      previous = features;
      lastSample = now;
      if (committed == null) {
        frames.add((now, features));
        frames.removeWhere((f) => f.$1 < now - 4000);
      }
    }
    if (committed != null) {
      return {
        'status': 'listening',
        'candidate': committed,
        'reason': 'already-emitted',
        'confidence': 1,
        'stable_for': 0,
      };
    }
    if (frames.length < 5) {
      return {'status': 'listening', 'buffered': frames.length, 'needed': 5};
    }
    if (settleMs > 0 &&
        !decided &&
        lastMoving > -double.infinity &&
        now - lastMoving >= settleMs) {
      decided = true; // hands settled in view: the sign is over
      return predict(now, isFinal: true);
    }
    if (decided) return result;
    if (liveGuesses && now - lastQuery >= 250) return predict(now);
    return result;
  }

  static double clampThreshold(double value, SignRecognizer model) =>
      math.max(model.threshold, value);
}
