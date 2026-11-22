import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app/theme.dart';
import '../core/client.dart';
import '../core/session.dart';
import 'room_provider.dart';

/// How text becomes signs. Online: an AI model on the Parlance server, better
/// ISL word order, needs internet. Offline: the built-in rules, instant, work
/// without internet. Online falls back to offline by itself when unavailable.
enum TranslationMode { online, offline }

class TranslationModeController extends Notifier<TranslationMode> {
  static const _key = 'parlance.translationMode';

  @override
  TranslationMode build() {
    unawaited(_load());
    return TranslationMode.online;
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString(_key) == 'offline') state = TranslationMode.offline;
  }

  Future<void> set(TranslationMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, mode.name);
  }
}

final translationModeProvider =
    NotifierProvider<TranslationModeController, TranslationMode>(
      TranslationModeController.new,
    );

/// The signer page for [text] and how it was translated.
class SignSource {
  const SignSource(this.url, {required this.viaAi});
  final Uri? url;

  /// The AI translation was used (online mode and it answered).
  final bool viaAi;
}

/// The signer page that signs [text], translated by the chosen mode.
final signSourceProvider = FutureProvider.autoDispose.family<SignSource, String>((
  ref,
  text,
) async {
  final services = await ref.watch(servicesProvider.future);
  final mode = ref.watch(translationModeProvider);
  List<String> tokens = const [];
  if (mode == TranslationMode.online) {
    try {
      await ensureSignedIn();
      tokens = await client.translate
          .toGloss(text)
          .timeout(const Duration(seconds: 6));
    } catch (_) {
      tokens =
          const []; // offline or unavailable: the page uses its built-in rules
    }
  }
  return SignSource(
    services.signText(text, tokens: tokens),
    viaAi: tokens.isNotEmpty,
  );
});

/// "Online | Offline" switch, shown wherever the phone signs text.
class TranslationModeSwitch extends ConsumerWidget {
  const TranslationModeSwitch({
    super.key,
    this.fixed = false,
    this.dark = false,
  });

  /// Always offline here (live signing must be instant); the switch is off.
  final bool fixed;
  final bool dark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = fixed
        ? TranslationMode.offline
        : ref.watch(translationModeProvider);
    return SegmentedButton<TranslationMode>(
      showSelectedIcon: false,
      style: SegmentedButton.styleFrom(
        visualDensity: VisualDensity.compact,
        foregroundColor: dark ? Colors.white : Brand.navy,
        selectedForegroundColor: Brand.navy,
        selectedBackgroundColor: dark ? Brand.sun : Brand.handsSoft,
        side: BorderSide(color: dark ? Colors.white38 : Brand.line),
      ),
      segments: [
        ButtonSegment(
          value: TranslationMode.online,
          enabled: !fixed,
          icon: const Icon(Icons.cloud_outlined, size: 18),
          label: const Text('Online'),
          tooltip: 'AI translation: better ISL word order, needs internet',
        ),
        const ButtonSegment(
          value: TranslationMode.offline,
          icon: Icon(Icons.cloud_off_outlined, size: 18),
          label: Text('Offline'),
          tooltip: 'Instant built-in rules, works without internet',
        ),
      ],
      selected: {mode},
      onSelectionChanged: fixed
          ? null
          : (v) => ref.read(translationModeProvider.notifier).set(v.first),
    );
  }
}
