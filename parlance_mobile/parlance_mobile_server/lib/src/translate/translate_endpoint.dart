import 'dart:convert';
import 'dart:io';

import 'package:serverpod/serverpod.dart';

/// Online translation for the phone app: English or Hindi text -> ISL tokens
/// for the 3D signer, by an AI model with the same ISL grammar prompt as the
/// website (assets/translation, exported by tool/export_translation_prompt.mjs).
///
/// The model's address and key stay on the server (passwords
/// `azureOpenAiEndpoint`, `azureOpenAiKey`, `azureOpenAiDeployment`; never in
/// the app). Needs a signed-in account (anonymous is fine), limits each account
/// to [perMinute] requests a minute, and only returns tokens the signer can
/// play. Returns an empty list when unavailable, so the app falls back to its
/// built-in offline rules.
class TranslateEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  static const maxText = 600;
  static const maxTokens = 40;
  static const perMinute = 20;

  static final _recent = <String, List<DateTime>>{};
  static String? _prompt;
  static Set<String>? _tokens;

  static String get _systemPrompt =>
      _prompt ??= File('assets/translation/isl_prompt.txt').readAsStringSync();
  static Set<String> get _vocabulary => _tokens ??= {
    for (final t
        in jsonDecode(File('assets/translation/tokens.json').readAsStringSync())
            as List)
      t as String,
  };

  Future<List<String>> toGloss(Session session, String text) async {
    final userId = session.authenticated?.userIdentifier;
    if (userId == null) return const [];
    final clean = text.trim();
    if (clean.isEmpty || clean.length > maxText) return const [];
    final endpoint = session.passwords['azureOpenAiEndpoint'];
    final key = session.passwords['azureOpenAiKey'];
    final deployment = session.passwords['azureOpenAiDeployment'];
    if (endpoint == null || key == null || deployment == null) return const [];
    if (!_allow(userId)) return const [];

    try {
      final base = endpoint.replaceAll(RegExp(r'/$'), '');
      final version = session.passwords['azureOpenAiVersion'] ?? '2024-10-21';
      final url = Uri.parse(
        '$base/openai/deployments/$deployment/chat/completions?api-version=$version',
      );
      final client = HttpClient()
        ..connectionTimeout = const Duration(seconds: 4);
      try {
        final request = await client
            .postUrl(url)
            .timeout(const Duration(seconds: 4));
        request.headers
          ..set('api-key', key)
          ..contentType = ContentType.json;
        request.write(
          jsonEncode({
            'messages': [
              {'role': 'system', 'content': _systemPrompt},
              {'role': 'user', 'content': clean},
            ],
            'temperature': 0,
            'max_completion_tokens': 1000,
            'response_format': {'type': 'json_object'},
          }),
        );
        final response = await request.close().timeout(
          const Duration(seconds: 8),
        );
        if (response.statusCode != 200) return const [];
        final body = await response.transform(utf8.decoder).join();
        final content =
            ((jsonDecode(body) as Map)['choices'] as List)
                    .first['message']['content']
                as String;
        final decoded = jsonDecode(content);
        final raw = decoded is List
            ? decoded
            : (decoded as Map)['tokens'] as List;
        return sanitize([for (final t in raw) t.toString()]);
      } finally {
        client.close(force: true);
      }
    } catch (error) {
      session.log(
        'Online translation unavailable: $error',
        level: LogLevel.warning,
      );
      return const [];
    }
  }

  /// Keeps only tokens the signer can play: its vocabulary, or letters and
  /// digits joined by hyphens (fingerspelling and numbers).
  static List<String> sanitize(
    Iterable<String> tokens, {
    Set<String>? vocabulary,
  }) {
    final known = vocabulary ?? _vocabulary;
    final spelled = RegExp(r'^[A-Z0-9]+(-[A-Z0-9]+)*$');
    return [
      for (final t in tokens)
        if (known.contains(t.trim().toUpperCase()) ||
            spelled.hasMatch(t.trim().toUpperCase()))
          t.trim().toUpperCase(),
    ].take(maxTokens).toList();
  }

  bool _allow(String userId) {
    final now = DateTime.now().toUtc();
    final stamps = (_recent[userId] ?? [])
      ..removeWhere((t) => now.difference(t) >= const Duration(minutes: 1));
    if (stamps.length >= perMinute) return false;
    _recent[userId] = stamps..add(now);
    return true;
  }
}
