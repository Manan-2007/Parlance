// The 141-float frame contract, ported from the web app
// (parlance-isl/src/engine/landmarks.ts and tracking.ts). Keep them in step:
// the recogniser was trained on exactly this layout.
//
//     [  0 : 63 ]  Left block:  21 hand landmarks x (x, y, z)
//     [ 63 :126 ]  Right block: 21 hand landmarks x (x, y, z)
//     [126 :141 ]  Pose, always zeros for recognition (hands only)
//
// Values are MediaPipe's normalised image coordinates of the raw, un-mirrored,
// upright camera frame. No smoothing, no aspect scaling. The server normalises.
import 'dart:math' as math;

const handOrder = ['Left', 'Right'];
const landmarksPerHand = 21;
const featuresPerHand = landmarksPerHand * 3; // 63
const handsDim = featuresPerHand * 2; // 126
const featureDim = handsDim + 15; // 141

const _wrist = 0;

/// The furthest a wrist moves between frames and still counts as the same hand.
const maxWristTravel = 0.25;

class Landmark {
  const Landmark(this.x, this.y, this.z);
  final double x;
  final double y;
  final double z;
}

/// One hand MediaPipe found in a frame.
class Detection {
  const Detection({
    required this.landmarks,
    required this.label,
    required this.score,
  });
  final List<Landmark> landmarks;

  /// MediaPipe's handedness, "Left" or "Right".
  final String label;
  final double score;
}

/// Everything a camera frame produced.
class HandFrame {
  const HandFrame({
    required this.detections,
    required this.width,
    required this.height,
  });
  final List<Detection> detections;
  final int width;
  final int height;

  /// Decodes the flat message the native and web cameras send:
  /// `{w, h, hands: [{label, score, points: [x, y, z, ...63]}]}`.
  factory HandFrame.fromMessage(Map<Object?, Object?> message) {
    final hands = (message['hands'] as List<Object?>? ?? const []);
    return HandFrame(
      width: (message['w'] as num?)?.toInt() ?? 0,
      height: (message['h'] as num?)?.toInt() ?? 0,
      detections: [
        for (final raw in hands.cast<Map<Object?, Object?>>())
          Detection(
            label: raw['label'] as String? ?? '',
            score: (raw['score'] as num?)?.toDouble() ?? 0,
            landmarks: _points(raw['points'] as List<Object?>? ?? const []),
          ),
      ],
    );
  }

  static List<Landmark> _points(List<Object?> flat) => [
    for (var i = 0; i + 2 < flat.length; i += 3)
      Landmark(
        (flat[i] as num).toDouble(),
        (flat[i + 1] as num).toDouble(),
        (flat[i + 2] as num).toDouble(),
      ),
  ];
}

/// Assigns detections to the Left/Right blocks with memory (port of
/// `HandAssigner` in tracking.ts).
///
/// MediaPipe's label is trusted while unambiguous. When both hands are present
/// and the labels disagree with where the hands were a frame ago, continuity
/// wins: a hand does not teleport across the body, but the classifier will
/// happily relabel it.
class HandAssigner {
  final List<List<Landmark>?> _previous = [null, null];
  final List<int> _stale = [0, 0];

  void reset() {
    _previous[0] = _previous[1] = null;
    _stale[0] = _stale[1] = 0;
  }

  /// Index 0 = Left block, 1 = Right block.
  List<List<Landmark>?> assign(List<Detection> all) {
    final detections = [
      for (final d in all)
        if (d.landmarks.isNotEmpty) d,
    ];
    final assigned = <List<Landmark>?>[null, null];

    if (detections.isEmpty) {
      _stale[0]++;
      _stale[1]++;
      return assigned;
    }

    final byLabel = <Detection?>[null, null];
    for (final d in detections) {
      final block = handOrder.indexOf(d.label);
      if (block < 0) continue;
      final current = byLabel[block];
      if (current == null || d.score > current.score) byLabel[block] = d;
    }

    if (detections.length >= 2 && byLabel[0] != null && byLabel[1] != null) {
      final straight = _travel(0, byLabel[0]!) + _travel(1, byLabel[1]!);
      final swapped = _travel(0, byLabel[1]!) + _travel(1, byLabel[0]!);
      if (swapped + 1e-6 < straight) {
        assigned[0] = byLabel[1]!.landmarks;
        assigned[1] = byLabel[0]!.landmarks;
      } else {
        assigned[0] = byLabel[0]!.landmarks;
        assigned[1] = byLabel[1]!.landmarks;
      }
    } else {
      for (final d in detections) {
        final labelBlock = handOrder.indexOf(d.label);
        var block = labelBlock >= 0 ? labelBlock : 0;
        final near = _nearest(d);
        if (near != null && assigned[near] == null) block = near;
        if (assigned[block] != null) block = block == 0 ? 1 : 0;
        if (assigned[block] == null) assigned[block] = d.landmarks;
      }
    }

    for (var block = 0; block < 2; block++) {
      if (assigned[block] != null) {
        _previous[block] = assigned[block];
        _stale[block] = 0;
      } else {
        _stale[block]++;
        if (_stale[block] > 10) _previous[block] = null;
      }
    }
    return assigned;
  }

  double _travel(int block, Detection d) {
    final previous = _previous[block];
    if (previous == null) return 0;
    final a = previous[_wrist];
    final b = d.landmarks[_wrist];
    return math.sqrt(math.pow(a.x - b.x, 2) + math.pow(a.y - b.y, 2));
  }

  int? _nearest(Detection d) {
    int? best;
    var bestDistance = maxWristTravel;
    for (var block = 0; block < 2; block++) {
      if (_previous[block] == null) continue;
      final distance = _travel(block, d);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = block;
      }
    }
    return best;
  }
}

/// Builds the 141 numbers from assigned blocks (`assembleFrame` with no pose
/// and no aspect scaling, as the web app sends for recognition).
List<double> assembleFrame(List<List<Landmark>?> blocks) {
  final vector = List<double>.filled(featureDim, 0);
  for (var block = 0; block < 2; block++) {
    final landmarks = blocks[block];
    if (landmarks == null) continue;
    final offset = block * featuresPerHand;
    final count = math.min(landmarksPerHand, landmarks.length);
    for (var i = 0; i < count; i++) {
      final base = offset + i * 3;
      vector[base] = landmarks[i].x;
      vector[base + 1] = landmarks[i].y;
      vector[base + 2] = landmarks[i].z;
    }
  }
  return vector;
}
