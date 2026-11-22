import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/theme.dart';
import '../../providers/translation_mode.dart';
import 'signer_frame_stub.dart'
    if (dart.library.js_interop) 'signer_frame_web.dart'
    if (dart.library.io) 'signer_frame_native.dart';

/// Plays [text] in Indian Sign Language with Parlance's 3D signer.
///
/// The signer is the web app's three.js avatar, shown in a web view (or an
/// iframe on the web), so the app and the website sign the same way. The
/// Online | Offline switch chooses how [text] is translated (AI or built-in
/// rules); [signer] is the signer page the text is sent to.
Future<void> showSigner(BuildContext context, Uri signer, String text) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Brand.surface,
    builder: (context) => _SignerSheet(text: text),
  );
}

class _SignerSheet extends ConsumerWidget {
  const _SignerSheet({required this.text});
  final String text;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final source = ref.watch(signSourceProvider(text));
    final mode = ref.watch(translationModeProvider);
    return SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.82,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
              child: Text(text, style: Theme.of(context).textTheme.titleLarge),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
              child: Wrap(
                spacing: 10,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  const TranslationModeSwitch(),
                  Text(
                    switch (source) {
                      AsyncData(value: final s) when s.viaAi =>
                        'Translated online (AI).',
                      AsyncData() when mode == TranslationMode.online =>
                        'Online unavailable: used the built-in rules.',
                      AsyncData() => 'Built-in rules, no internet needed.',
                      _ => 'Translating…',
                    },
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Text(
                'The 3D signer is approximate. Words it does not know are fingerspelled.',
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: switch (source) {
                    AsyncData(value: final s) when s.url != null => SignerFrame(
                      key: ValueKey(s.url.toString()),
                      url: s.url!,
                    ),
                    AsyncError() => const Center(
                      child: Text(
                        'The signer could not load. Check your internet connection.',
                      ),
                    ),
                    _ => const Center(child: CircularProgressIndicator()),
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
