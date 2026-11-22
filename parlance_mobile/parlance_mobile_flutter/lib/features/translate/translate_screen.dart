import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../providers/speech_provider.dart';
import '../../providers/translation_mode.dart';
import '../../widgets/parts.dart';
import '../signer/signer_view.dart';

const _examples = [
  'Hello, how are you?',
  'Thank you',
  'Where is the hospital?',
  'Please wait here',
  'What is your name?',
  'मुझे मदद चाहिए',
];

/// Speech or text to ISL on this phone alone: type or say something in
/// English or Hindi and Parlance's 3D signer signs it. No second phone or QR
/// code needed.
class TranslateScreen extends ConsumerStatefulWidget {
  const TranslateScreen({super.key});

  @override
  ConsumerState<TranslateScreen> createState() => _TranslateScreenState();
}

class _TranslateScreenState extends ConsumerState<TranslateScreen> {
  final _text = TextEditingController();
  String? _signing;
  final _recent = <String>[];

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  void _sign([String? value]) {
    final text = (value ?? _text.text).trim();
    if (text.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _text.text = text;
      _signing = text;
      _recent
        ..remove(text)
        ..insert(0, text);
      if (_recent.length > 6) _recent.removeLast();
    });
  }

  Future<void> _mic() async {
    final speech = ref.read(speechProvider.notifier);
    if (ref.read(speechProvider).on) {
      await speech.stop();
      return;
    }
    await speech.start(
      locale: ref.read(profileProvider).speechLocale,
      onPartial: (partial) => _text.text = partial,
      onSentence: (sentence) async {
        await speech.stop();
        _sign(sentence);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final services = ref.watch(servicesProvider);
    final speech = ref.watch(speechProvider);
    final profile = ref.watch(profileProvider);
    final hindi = profile.speechLocale == 'hi_IN';
    final source = _signing == null
        ? null
        : ref.watch(signSourceProvider(_signing!));
    final url = source?.value?.url;
    final mode = ref.watch(translationModeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Speech → Sign')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Say or type something in English or Hindi. The signer shows it in ISL.',
                    style: text.bodyLarge?.copyWith(color: Brand.ink2),
                  ),
                  const SizedBox(height: 10),
                  const TranslationModeSwitch(),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _text,
                    minLines: 1,
                    maxLines: 4,
                    maxLength: 300,
                    textCapitalization: TextCapitalization.sentences,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _sign(),
                    style: text.titleLarge,
                    decoration: InputDecoration(
                      hintText: hindi ? 'यहाँ लिखिए' : 'Type here',
                      counterText: '',
                      suffixIcon: _text.text.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Clear',
                              onPressed: () => setState(_text.clear),
                              icon: const Icon(Icons.close_rounded),
                            ),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  if (speech.error != null) ...[
                    const SizedBox(height: 8),
                    Notice(message: speech.error!, danger: true),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: speech.on
                                ? Brand.danger
                                : Brand.voice,
                            foregroundColor: speech.on
                                ? Colors.white
                                : Brand.navy,
                            minimumSize: const Size(64, 56),
                          ),
                          onPressed: _mic,
                          icon: Icon(
                            speech.on ? Icons.stop_rounded : Icons.mic_rounded,
                          ),
                          label: Text(speech.on ? 'Listening…' : 'Speak'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(64, 56),
                          ),
                          onPressed: _text.text.trim().isEmpty ? null : _sign,
                          icon: const Icon(Icons.sign_language_rounded),
                          label: const Text('Sign it'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(64, 56),
                        ),
                        onPressed: () => ref
                            .read(profileProvider.notifier)
                            .update(
                              profile.copyWith(
                                speechLocale: hindi ? 'en_IN' : 'hi_IN',
                              ),
                            ),
                        child: Text(
                          hindi ? 'हिं' : 'EN',
                          semanticsLabel: hindi
                              ? 'Hindi. Switch to English.'
                              : 'English. Switch to Hindi.',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  if (url != null) ...[
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        source?.value?.viaAi ?? false
                            ? 'Translated online (AI).'
                            : mode == TranslationMode.online
                            ? 'Online unavailable: used the built-in rules.'
                            : 'Built-in rules, no internet needed.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    SignerView(url: url, height: 470),
                  ] else if (_signing != null &&
                      (services.isLoading || (source?.isLoading ?? false)))
                    const SizedBox(
                      height: 200,
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_signing != null)
                    const Notice(
                      message:
                          'The signer could not be reached. Check your internet connection.',
                      danger: true,
                    )
                  else ...[
                    Text('Try', style: text.titleMedium),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final e in _examples)
                          ActionChip(label: Text(e), onPressed: () => _sign(e)),
                      ],
                    ),
                  ],
                  if (_recent.length > 1) ...[
                    const SizedBox(height: 18),
                    Text('Recent', style: text.titleMedium),
                    const SizedBox(height: 6),
                    for (final r in _recent.skip(1))
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(
                          Icons.history_rounded,
                          color: Brand.ink3,
                        ),
                        title: Text(r),
                        onTap: () => _sign(r),
                      ),
                  ],
                  const SizedBox(height: 10),
                  Text(
                    'The 3D signer is approximate. Words it does not know are fingerspelled.',
                    style: text.bodySmall?.copyWith(color: Brand.ink3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
