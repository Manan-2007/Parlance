// Port of parlance-isl/backend/transformer.py, model.py (TemporalForest) and
// hybrid.py: the transformer decides; the forest only adds up to two
// suggestions for everyday words the transformer does not know.
import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';

import 'features.dart';
import 'transformer.dart';

const noneLabel = '__NONE__';
const forestSuggestionMin = 0.2;

class Suggestion {
  const Suggestion(this.word, this.confidence);
  final String word;
  final double confidence;
  Map<String, Object> toJson() => {'word': word, 'confidence': confidence};
}

class Decision {
  Decision({
    required this.candidate,
    required this.confidence,
    required this.reason,
    required this.eligible,
    required this.candidates,
  });

  String candidate;
  double confidence;
  String reason;
  bool eligible;
  List<Suggestion> candidates;
}

/// One window, as each model wants it.
class RecognitionWindow {
  RecognitionWindow(this.frames, this.embedding);
  final List<Float64List> frames;
  final Float32List embedding;
}

class TemporalForest {
  TemporalForest(Map<String, dynamic> meta, ByteData binary)
    : nodes = binary.buffer.asFloat32List(
        binary.offsetInBytes,
        binary.lengthInBytes ~/ 4,
      ),
      roots = (meta['roots'] as List).cast<int>(),
      labels = (meta['labels'] as List).cast<String>(),
      automatic = (meta['autoAccept'] as List).cast<String>().toSet(),
      threshold = (meta['threshold'] as num).toDouble(),
      margin = (meta['margin'] as num).toDouble();

  final Float32List nodes;
  final List<int> roots;
  final List<String> labels;
  final Set<String> automatic;
  final double threshold;
  final double margin;
  final _round = Float32List(1);

  Decision predict(List<Float32List> windows, double threshold) {
    final results = <Decision>[];
    for (final features in windows) {
      final scores = Float64List(labels.length);
      for (final root in roots) {
        var index = root;
        for (var step = 0; step < 100 && nodes[index * 10] >= 0; step++) {
          final column = nodes[index * 10].toInt();
          final right = features[column] > nodes[index * 10 + 1];
          index = nodes[index * 10 + (right ? 3 : 2)].toInt();
        }
        for (final slot in [4, 6, 8]) {
          // numpy divides the float32 leaf weight in float32 before adding.
          _round[0] = nodes[index * 10 + slot + 1] / roots.length;
          scores[nodes[index * 10 + slot].toInt()] += _round[0];
        }
      }
      final ranked = List<int>.generate(labels.length, (i) => i)
        ..sort(
          (a, b) => scores[a] != scores[b]
              ? scores[b].compareTo(scores[a])
              : a.compareTo(b),
        );
      final best = ranked[0], second = ranked[1];
      final label = labels[best];
      final confidence = scores[best];
      var reason = 'unstable';
      if (label == noneLabel) {
        reason = 'resting';
      } else if (!automatic.contains(label)) {
        reason = 'unverified';
      } else if (confidence < math.max(threshold, this.threshold) ||
          confidence - scores[second] < margin) {
        reason = 'low-confidence';
      }
      results.add(
        Decision(
          candidate: glossKey(label),
          confidence: confidence,
          reason: reason,
          eligible: reason == 'unstable',
          candidates: [
            for (final i in ranked)
              if (labels[i] != noneLabel && scores[i] >= 0.12)
                Suggestion(glossKey(labels[i]), scores[i]),
          ].take(3).toList(),
        ),
      );
    }
    final whole = results.last.candidate;
    final accepted = [
      for (final r in results)
        if (r.eligible && r.candidate == whole) r,
    ];
    if (accepted.isNotEmpty) {
      return accepted.reduce((a, b) => b.confidence > a.confidence ? b : a);
    }
    final best = results.reduce((a, b) => b.confidence > a.confidence ? b : a);
    return Decision(
      candidate: best.candidate,
      confidence: best.confidence,
      reason: best.reason,
      eligible: false,
      candidates: best.candidates,
    );
  }
}

/// The recogniser's model: `transformer.json`/`.bin` and `forest.json`/`.bin`.
class ModelFiles {
  const ModelFiles({
    required this.transformerJson,
    required this.transformerBin,
    required this.forestJson,
    required this.forestBin,
  });

  final String transformerJson;
  final Uint8List transformerBin;
  final String forestJson;
  final Uint8List forestBin;

  static const names = [
    'transformer.json',
    'transformer.bin',
    'forest.json',
    'forest.bin',
  ];
}

/// The transformer with forest suggestions (`HybridRecognizer`).
class SignRecognizer {
  SignRecognizer._(this.meta, this._transformer, this._forest)
    : labels = (meta['labels'] as List).cast<String>(),
      automatic = (meta['autoAccept'] as List).cast<String>().toSet(),
      threshold = (meta['threshold'] as num).toDouble(),
      margin = (meta['margin'] as num).toDouble(),
      temperature = (meta['temperature'] as num).toDouble(),
      maxFrames = meta['maxFrames'] as int,
      commitOnRelease = meta['commitOnRelease'] == true,
      releaseMs = (meta['releaseMs'] as num? ?? 220).toDouble(),
      rejoinMs = (meta['rejoinMs'] as num? ?? 0).toDouble(),
      settleMs = (meta['settleMs'] as num? ?? 0).toDouble(),
      restartMs = (meta['restartMs'] as num? ?? 0).toDouble() {
    final known = {for (final l in labels) glossKey(l)};
    forestOnly = {
      for (final l in _forest.labels)
        if (l != noneLabel) glossKey(l),
    }..removeAll(known);
  }

  final Map<String, dynamic> meta;
  final SignTransformerEnsemble _transformer;
  final TemporalForest _forest;
  final List<String> labels;
  final Set<String> automatic;
  final double threshold;
  final double margin;
  final double temperature;
  final int maxFrames;
  final bool commitOnRelease;
  final double releaseMs;
  final double rejoinMs;
  final double settleMs;
  final double restartMs;
  late final Set<String> forestOnly;

  /// Builds the recogniser from the four model files in
  /// `assets/recognition/` (read from disk on the server, from the app's
  /// assets on a phone).
  factory SignRecognizer.fromFiles(ModelFiles files) {
    final meta = jsonDecode(files.transformerJson) as Map<String, dynamic>;
    if (meta['format'] != 'isl-transformer-v1' ||
        meta['frameSize'] != frameSize) {
      throw StateError('Unsupported recognition model');
    }
    return SignRecognizer._(
      meta,
      SignTransformerEnsemble.load(
        meta,
        ByteData.sublistView(files.transformerBin),
      ),
      TemporalForest(
        jsonDecode(files.forestJson) as Map<String, dynamic>,
        ByteData.sublistView(files.forestBin),
      ),
    );
  }

  List<String> get automaticWords => [
    for (final l in meta['autoAccept'] as List) glossKey(l as String),
  ];

  RecognitionWindow window(List<Float64List> frames) {
    final start = math.max(0, frames.length - maxFrames);
    return RecognitionWindow(frames.sublist(start), temporalEmbedding(frames));
  }

  Decision _transformerDecision(
    List<RecognitionWindow> windows,
    double threshold,
  ) {
    // Only the longest window decides (transformer.py returns results[-1]),
    // and windows are scored independently, so only it is computed.
    final logits = _transformer.logits(windows.last.frames);
    var top = -double.infinity;
    for (final v in logits) {
      top = math.max(top, v / temperature);
    }
    final row = Float64List(logits.length);
    var total = 0.0;
    for (var i = 0; i < logits.length; i++) {
      row[i] = math.exp(logits[i] / temperature - top);
      total += row[i];
    }
    for (var i = 0; i < row.length; i++) {
      row[i] /= total;
    }
    final ranked = List<int>.generate(row.length, (i) => i)
      ..sort(
        (a, b) => row[a] != row[b] ? row[b].compareTo(row[a]) : a.compareTo(b),
      );
    final best = ranked[0], second = ranked[1];
    final label = labels[best];
    final confidence = row[best];
    var reason = 'unstable';
    if (label == noneLabel) {
      reason = 'resting';
    } else if (!automatic.contains(label)) {
      reason = 'unverified';
    } else if (confidence < math.max(threshold, this.threshold) ||
        confidence - row[second] < margin) {
      reason = 'low-confidence';
    }
    return Decision(
      candidate: glossKey(label),
      confidence: confidence,
      reason: reason,
      eligible: reason == 'unstable',
      candidates: [
        for (final i in ranked.take(4))
          if (labels[i] != noneLabel && row[i] >= 0.12)
            Suggestion(glossKey(labels[i]), row[i]),
      ].take(3).toList(),
    );
  }

  Decision predict(List<RecognitionWindow> windows, double threshold) {
    final decision = _transformerDecision(windows, threshold);
    if (decision.eligible) return decision;
    final forest = _forest.predict([
      for (final w in windows) w.embedding,
    ], threshold);
    final extra = [
      for (final c in forest.candidates)
        if (forestOnly.contains(c.word) && c.confidence >= forestSuggestionMin)
          c,
    ].take(2).toList();
    if (extra.isEmpty) return decision;
    final merged = Decision(
      candidate: decision.candidate,
      confidence: decision.confidence,
      reason: decision.reason,
      eligible: decision.eligible,
      candidates: [...decision.candidates.take(3), ...extra],
    );
    if (decision.reason == 'resting') {
      merged
        ..candidate = extra.first.word
        ..confidence = extra.first.confidence
        ..reason = 'unverified';
    }
    return merged;
  }
}
