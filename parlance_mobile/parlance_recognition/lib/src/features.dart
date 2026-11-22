// Port of parlance-isl/backend/model.py (frame_features, temporal_embedding,
// movement). Keep the two in step: the models were trained on exactly these.
import 'dart:math' as math;
import 'dart:typed_data';

const frameSize = 135;
const windowsMs = [600, 1000, 1600, 2400, 3800];

String glossKey(String label) => label.toLowerCase().replaceAll('_', '');

/// 141 raw landmark numbers -> 135 hand features: each present hand relative
/// to its wrist and scaled to unit size, sorted by wrist x, plus presence,
/// wrist positions and the vector between the two wrists.
Float64List frameFeatures(List<double> vector) {
  final hands = <List<List<double>>>[];
  for (var h = 0; h < 2; h++) {
    final points = [
      for (var i = 0; i < 21; i++)
        [
          vector[h * 63 + i * 3],
          vector[h * 63 + i * 3 + 1],
          vector[h * 63 + i * 3 + 2],
        ],
    ];
    if (points.any((p) => p[0] != 0 || p[1] != 0 || p[2] != 0)) {
      hands.add(points);
    }
  }
  // numpy argsort (quicksort) on two values: stable enough for distinct x;
  // equal wrist x keeps the original order.
  if (hands.length == 2 && hands[1][0][0] < hands[0][0][0]) {
    final first = hands.removeAt(0);
    hands.add(first);
  }
  final result = Float64List(frameSize);
  final scales = <double>[];
  for (var index = 0; index < hands.length; index++) {
    final hand = hands[index];
    final wrist = hand[0];
    var scale = 0.0;
    final relative = [
      for (final p in hand) [p[0] - wrist[0], p[1] - wrist[1], p[2] - wrist[2]],
    ];
    for (final r in relative) {
      scale = math.max(
        scale,
        math.sqrt(r[0] * r[0] + r[1] * r[1] + r[2] * r[2]),
      );
    }
    if (scale < 1e-6) continue;
    for (var i = 0; i < 21; i++) {
      for (var c = 0; c < 3; c++) {
        result[index * 63 + i * 3 + c] = relative[i][c] / scale;
      }
    }
    result[126 + index] = 1;
    result[128 + index * 2] = wrist[0];
    result[129 + index * 2] = wrist[1];
    scales.add(scale);
  }
  if (hands.length == 2 && scales.length == 2) {
    final mean = (scales[0] + scales[1]) / 2;
    for (var c = 0; c < 3; c++) {
      result[132 + c] = ((hands[1][0][c] - hands[0][0][c]) / mean).clamp(
        -12.0,
        12.0,
      );
    }
  }
  return result;
}

/// Summary of a window for the forest: mean, std, min, max and 12 resampled
/// frames, 16 x 135 values.
Float32List temporalEmbedding(List<Float64List> frames) {
  final n = frames.length;
  final out = Float32List(frameSize * 16);
  for (var c = 0; c < frameSize; c++) {
    var sum = 0.0, low = double.infinity, high = -double.infinity;
    for (final f in frames) {
      sum += f[c];
      low = math.min(low, f[c]);
      high = math.max(high, f[c]);
    }
    final mean = sum / n;
    var variance = 0.0;
    for (final f in frames) {
      variance += (f[c] - mean) * (f[c] - mean);
    }
    out[c] = mean;
    out[frameSize + c] = math.sqrt(variance / n);
    out[frameSize * 2 + c] = low;
    out[frameSize * 3 + c] = high;
  }
  for (var s = 0; s < 12; s++) {
    final position = n == 1 ? 0.0 : s * (n - 1) / 11;
    final lo = position.floor(), hi = position.ceil();
    final mix = position - lo;
    for (var c = 0; c < frameSize; c++) {
      out[frameSize * (4 + s) + c] =
          frames[lo][c] * (1 - mix) + frames[hi][c] * mix;
    }
  }
  return out;
}

/// How much the hands moved between two feature frames.
double movement(Float64List previous, Float64List current) {
  var shape = 0.0;
  for (var i = 0; i < 126; i++) {
    shape += (previous[i] - current[i]) * (previous[i] - current[i]);
  }
  var wrists = 0.0;
  for (var i = 128; i < 132; i++) {
    wrists += (previous[i] - current[i]) * (previous[i] - current[i]);
  }
  return math.sqrt(shape / 126 + wrists * 4);
}
