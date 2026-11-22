import 'dart:async';

import 'package:flutter/material.dart';

import '../../app/theme.dart';

/// Plays a recorded sign as moving hands: the 21 points of each hand joined
/// like a skeleton, on a loop. [frames] is frames x 141 numbers (the
/// recogniser's layout: left hand x,y,z for 21 points, then the right hand,
/// then 15 zeros); a hand that is all zeros was not seen in that frame.
///
/// Drawn as in a mirror, like the camera preview, so it looks like the signer.
class HandsReplay extends StatefulWidget {
  const HandsReplay({super.key, required this.frames});
  final List<double> frames;

  @override
  State<HandsReplay> createState() => _HandsReplayState();
}

class _HandsReplayState extends State<HandsReplay> {
  Timer? _timer;
  int _frame = 0;

  int get _count => widget.frames.length ~/ 141;

  @override
  void initState() {
    super.initState();
    // About the speed it was recorded at (12 frames a second), with a pause
    // at the end of each loop.
    _timer = Timer.periodic(const Duration(milliseconds: 85), (_) {
      if (!mounted || _count == 0) return;
      setState(() => _frame = (_frame + 1) % (_count + 6));
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shown = _frame.clamp(0, _count == 0 ? 0 : _count - 1);
    return Semantics(
      label: 'Recorded hand movement, frame ${shown + 1} of $_count',
      child: Container(
        color: Brand.navy,
        child: CustomPaint(
          painter: _HandsPainter(widget.frames, shown),
          size: Size.infinite,
        ),
      ),
    );
  }
}

/// MediaPipe's hand skeleton: thumb, four fingers, and the palm.
const _bones = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

class _HandsPainter extends CustomPainter {
  _HandsPainter(this.frames, this.frame);
  final List<double> frames;
  final int frame;

  @override
  void paint(Canvas canvas, Size size) {
    if (frames.length < 141) return;
    final base = frame * 141;
    final colors = [Brand.sun, Brand.voice];
    for (var hand = 0; hand < 2; hand++) {
      final start = base + hand * 63;
      final points = <Offset>[
        for (var i = 0; i < 21; i++)
          // Mirror x (1 - x), like the camera preview.
          Offset(
            (1 - frames[start + i * 3]) * size.width,
            frames[start + i * 3 + 1] * size.height,
          ),
      ];
      final seen = [
        for (var i = 0; i < 63; i++) frames[start + i],
      ].any((v) => v != 0);
      if (!seen) continue;
      final line = Paint()
        ..color = colors[hand].withValues(alpha: 0.9)
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round;
      for (final [a, b] in _bones) {
        canvas.drawLine(points[a], points[b], line);
      }
      final dot = Paint()..color = Colors.white;
      for (final p in points) {
        canvas.drawCircle(p, 3.5, dot);
      }
    }
  }

  @override
  bool shouldRepaint(_HandsPainter old) =>
      old.frame != frame || old.frames != frames;
}
