import 'dart:async';
import 'dart:math' as math;

import 'package:parlance_mobile_server/src/generated/protocol.dart';
import 'package:test/test.dart';

import 'test_tools/serverpod_test_tools.dart';

/// A hand at (x, y) with a little spread, in the 141-number layout.
List<double> hand(double x, double y) {
  final v = List<double>.filled(141, 0);
  for (var i = 0; i < 21; i++) {
    v[i * 3] = x + (i % 5) * 0.012;
    v[i * 3 + 1] = y + (i ~/ 5) * 0.02;
    v[i * 3 + 2] = -0.01 * i;
  }
  return v;
}

void main() {
  withServerpod('Given the sign endpoint', (sessionBuilder, endpoints) {
    final signedIn = sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo('signer', {}),
    );

    test('a signed-out phone cannot read signs', () async {
      final frames = StreamController<SignFrame>();
      final refused = Completer<Object>();
      final results = <SignResult>[];
      final subscription = endpoints.sign
          .read(sessionBuilder, frames.stream)
          .listen(results.add, onError: refused.complete);
      frames.add(SignFrame(landmarks: List.filled(141, 0), timestamp: 1));
      final error = await refused.future.timeout(const Duration(seconds: 5));
      expect(error, isA<ServerpodUnauthenticatedException>());
      expect(results, isEmpty, reason: 'nothing is read without an account');
      await subscription.cancel();
      // Not awaited: a refused call never listens to its input.
      unawaited(frames.close());
    });

    test('it says ready, checks frames and reads a moving hand', () async {
      final frames = StreamController<SignFrame>();
      final results = StreamIterator(
        endpoints.sign.read(signedIn, frames.stream),
      );
      expect(await results.moveNext(), isTrue);
      expect(results.current.status, 'ready');
      expect(results.current.automatic, contains('hello'));

      frames.add(SignFrame(landmarks: [1, 2, 3], timestamp: 0, frameId: 1));
      await results.moveNext();
      expect(results.current.error, contains('141'));
      expect(results.current.frameId, 1);

      // 1.2 s of a moving hand, then the hand lowered.
      final responses = <SignResult>[];
      var t = 1000.0;
      for (var i = 0; i < 12; i++, t += 100) {
        frames.add(
          SignFrame(
            landmarks: hand(
              0.4 + 0.02 * math.sin(i.toDouble()),
              0.5 + 0.01 * i,
            ),
            timestamp: t,
            frameId: 10 + i,
          ),
        );
        await results.moveNext();
        responses.add(results.current);
      }
      for (var i = 0; i < 4; i++, t += 100) {
        frames.add(
          SignFrame(
            landmarks: List.filled(141, 0),
            timestamp: t,
            frameId: 30 + i,
          ),
        );
        await results.moveNext();
        responses.add(results.current);
      }
      expect(
        responses.first.buffered,
        1,
        reason: 'collects frames before guessing',
      );
      // Lowering the hands finishes the sign: a word, or a guess for a finished sign.
      expect(responses.any((r) => r.word != null || r.isFinal == true), isTrue);
      unawaited(frames.close());
      await results.cancel();
    });
  });
}
