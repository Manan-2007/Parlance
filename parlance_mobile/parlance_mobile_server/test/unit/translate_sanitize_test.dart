import 'package:parlance_mobile_server/src/translate/translate_endpoint.dart';
import 'package:test/test.dart';

void main() {
  test('only tokens the signer can play get through', () {
    final out = TranslateEndpoint.sanitize(
      ['hello', 'YOU', 'T-O-M-O-R-R-O-W', '1-1-2', 'drop table', '<script>', ' WATER '],
      vocabulary: {'HELLO', 'YOU', 'WATER'},
    );
    expect(out, ['HELLO', 'YOU', 'T-O-M-O-R-R-O-W', '1-1-2', 'WATER']);
  });

  test('never returns more than 40 tokens', () {
    final many = List.filled(100, 'YOU');
    expect(TranslateEndpoint.sanitize(many, vocabulary: {'YOU'}).length, TranslateEndpoint.maxTokens);
  });
}
