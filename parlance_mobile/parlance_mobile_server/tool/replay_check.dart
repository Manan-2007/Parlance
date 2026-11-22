// Replays sessions recorded from the Python recogniser through the Dart port
// and reports where they differ. Each line: {"in": {landmarks, timestamp},
// "out": <Python response>}.
//   dart run tool/replay_check.dart <replay.jsonl>...
import 'dart:convert';
import 'dart:io';

import 'package:parlance_mobile_server/src/recognition/recognizer.dart';

String summary(Map<String, Object?> r) {
  final parts = <String>[];
  for (final key in [
    'word',
    'error',
    'buffered',
    'reason',
    'candidate',
    'final',
  ]) {
    if (r[key] != null) parts.add('$key=${r[key]}');
  }
  final s = r['suggestions'];
  if (s is List && s.isNotEmpty) {
    parts.add('suggest=${s.map((e) => (e as Map)['word']).join(',')}');
  }
  return parts.join(' ');
}

/// --final-only: compare only words and finished-sign results, with the
/// server's setting (no guesses while a sign is still going).
void main(List<String> args) {
  final finalOnly = args.contains('--final-only');
  final paths = [
    for (final a in args)
      if (!a.startsWith('--')) a,
  ];
  final model = loadSignRecognizer();
  var frames = 0, differ = 0, words = 0, wordMismatch = 0;
  for (final path in paths) {
    final session = RecognitionSession(model, liveGuesses: !finalOnly);
    final pyWords = <String>[], dartWords = <String>[];
    for (final line in File(path).readAsLinesSync()) {
      final rec = jsonDecode(line) as Map<String, dynamic>;
      final input = rec['in'] as Map<String, dynamic>;
      final expected = (rec['out'] as Map).cast<String, Object?>();
      final got = session.feed(
        (input['landmarks'] as List)
            .cast<num>()
            .map((v) => v.toDouble())
            .toList(),
        (input['timestamp'] as num).toDouble(),
      );
      frames++;
      if (expected['word'] != null) pyWords.add('${expected['word']}');
      if (got['word'] != null) dartWords.add('${got['word']}');
      final compared =
          !finalOnly ||
          expected['word'] != null ||
          expected['final'] == true ||
          got['word'] != null ||
          got['final'] == true;
      if (compared && summary(expected) != summary(got)) {
        differ++;
        if (differ <= 8) {
          stdout.writeln(
            '  ${path.split('/').last} frame $frames\n    python: ${summary(expected)}\n    dart:   ${summary(got)}',
          );
        }
      }
    }
    words += pyWords.length;
    if (pyWords.join(' ') != dartWords.join(' ')) wordMismatch++;
    stdout.writeln(
      '${path.split('/').last}: python words [${pyWords.join(' ')}] dart words [${dartWords.join(' ')}]',
    );
  }
  stdout.writeln(
    '$frames frames, $differ responses differ, $words words, $wordMismatch sessions with different words',
  );
}
