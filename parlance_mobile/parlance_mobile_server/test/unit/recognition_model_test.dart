import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:parlance_mobile_server/src/recognition/recognizer.dart';
import 'package:parlance_mobile_server/src/recognition/transformer.dart';
import 'package:test/test.dart';

void main() {
  final meta =
      jsonDecode(File('assets/recognition/transformer.json').readAsStringSync())
          as Map<String, dynamic>;
  final model = SignTransformerEnsemble.load(
    meta,
    ByteData.sublistView(
      File('assets/recognition/transformer.bin').readAsBytesSync(),
    ),
  );
  final temperature = (meta['temperature'] as num).toDouble();

  test('the Dart transformer gives the shipped ONNX model\'s probabilities', () {
    // test/fixtures/recognition_model.json: windows scored by
    // parlance-isl/backend/models/isl-transformer.onnx (tool/export_recognizer.py).
    final windows =
        (jsonDecode(
                  File(
                    'test/fixtures/recognition_model.json',
                  ).readAsStringSync(),
                )['windows']
                as List)
            .cast<Map<String, dynamic>>();
    for (final w in windows) {
      final frames = [
        for (final f in (w['features'] as List))
          Float64List.fromList(
            (f as List).cast<num>().map((v) => v.toDouble()).toList(),
          ),
      ];
      final logits = model.logits(frames);
      final top = logits.map((v) => v / temperature).reduce(math.max);
      final probs = logits.map((v) => math.exp(v / temperature - top)).toList();
      final total = probs.reduce((a, b) => a + b);
      final expected = (w['probabilities'] as List).cast<num>();
      var worst = 0.0;
      for (var i = 0; i < probs.length; i++) {
        worst = math.max(worst, (probs[i] / total - expected[i]).abs());
      }
      expect(worst, lessThan(1e-4), reason: '${frames.length} frames');
    }
  });

  test('a full 48-frame window is fast enough to run live', () {
    final frames = List.generate(
      48,
      (i) => Float64List.fromList(
        List.generate(135, (c) => math.sin(i * 0.3 + c)),
      ),
    );
    model.logits(frames); // warm up
    final watch = Stopwatch()..start();
    for (var i = 0; i < 5; i++) {
      model.logits(frames);
    }
    final ms = watch.elapsedMilliseconds / 5;
    // ignore: avoid_print
    print('48-frame window: ${ms.toStringAsFixed(1)} ms');
    expect(ms, lessThan(400));
  });

  test('the recogniser loads with forest suggestions', () {
    final recognizer = SignRecognizer.load();
    expect(recognizer.labels.first, noneLabel);
    expect(recognizer.forestOnly, isNotEmpty);
  });
}
