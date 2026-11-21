import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:parlance_mobile/core/session.dart';
import 'package:parlance_mobile/features/sign_camera/frame_vector.dart';

void main() {
  test('builds the same 141 numbers as the web app, frame by frame', () {
    // test/fixtures/hand_assignment.json was produced by the web app's own
    // HandAssigner + assembleFrame (parlance-isl/src/engine/tracking.ts) on a
    // sequence with a mid-sign label swap, a dropped hand, duplicate labels and
    // empty frames.
    final frames =
        jsonDecode(
              File('test/fixtures/hand_assignment.json').readAsStringSync(),
            )
            as List<dynamic>;
    final assigner = HandAssigner();
    for (var i = 0; i < frames.length; i++) {
      final frame = frames[i] as Map<String, dynamic>;
      final hand = HandFrame.fromMessage({
        'w': 1280,
        'h': 720,
        'hands': frame['hands'],
      });
      final vector = assembleFrame(assigner.assign(hand.detections));
      final expected = (frame['vector'] as List<dynamic>).cast<num>();
      expect(vector.length, featureDim);
      for (var j = 0; j < featureDim; j++) {
        // The web app stores Float32, so compare at float precision.
        expect(
          vector[j],
          closeTo(expected[j].toDouble(), 1e-6),
          reason: 'frame $i, value $j',
        );
      }
    }
  });

  test('a room code is read from a QR link or typed digits', () {
    expect(
      codeFrom('https://parlance.serverpod.space/#/join/482913'),
      '482913',
    );
    expect(codeFrom('482 913'.replaceAll(' ', '')), '482913');
    expect(codeFrom('12345'), isNull);
  });
}
