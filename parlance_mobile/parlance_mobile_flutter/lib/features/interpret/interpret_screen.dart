import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../app/theme.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../providers/speech_provider.dart';
import '../community/community_parts.dart' show Pill;
import '../../providers/translation_mode.dart';
import '../signer/live_signer.dart';

/// "Interpret a speaker": at a conference, a talk or a show with no signer on
/// stage, the phone listens to the speaker and the 3D signer signs what it
/// hears, continuously, with no button per line. Captions run underneath.
///
/// Signs words as they are heard and keeps up like a human interpreter: words
/// it has no sign for stay in the captions, and when the speaker is faster
/// than the avatar it skips the oldest signs (see the website's
/// `useLiveSignQueue`). Signs are approximate.
class InterpretScreen extends ConsumerStatefulWidget {
  const InterpretScreen({super.key});

  @override
  ConsumerState<InterpretScreen> createState() => _InterpretScreenState();
}

class _InterpretScreenState extends ConsumerState<InterpretScreen> {
  final _signer = LiveSignerController();
  late final SpeechController _speech;
  final _lines = <String>[];
  String _partial = '';
  bool _started = false;
  bool _autoTried = false;

  @override
  void initState() {
    super.initState();
    _speech = ref.read(speechProvider.notifier);
    unawaited(WakelockPlus.enable());
  }

  @override
  void dispose() {
    unawaited(_speech.stop());
    unawaited(WakelockPlus.disable());
    super.dispose();
  }

  Future<void> _start() async {
    _signer.reset();
    setState(() {
      _lines.clear();
      _partial = '';
      _started = true;
    });
    await _speech.start(
      locale: ref.read(profileProvider).speechLocale,
      onPartial: (words) {
        _signer.hear(words, false);
        if (mounted) setState(() => _partial = words);
      },
      onSentence: (words) {
        _signer.hear(words, true);
        if (!mounted) return;
        setState(() {
          _partial = '';
          _lines.add(words);
          if (_lines.length > 6) _lines.removeAt(0);
        });
      },
    );
  }

  Future<void> _stop() async {
    await _speech.stop();
    if (mounted) setState(() => _started = false);
  }

  Future<void> _setLanguage(String locale) async {
    final profile = ref.read(profileProvider);
    if (profile.speechLocale == locale) return;
    final wasOn = ref.read(speechProvider).on;
    if (wasOn) await _speech.stop();
    await ref
        .read(profileProvider.notifier)
        .update(profile.copyWith(speechLocale: locale));
    if (wasOn) await _start();
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final speech = ref.watch(speechProvider);
    final locale = ref.watch(profileProvider.select((p) => p.speechLocale));
    final live = ref.watch(servicesProvider).value?.signer?.resolve('live');
    final size = MediaQuery.sizeOf(context);
    final wide = size.width > size.height;

    // On a phone, start listening as soon as the signer is ready.
    if (!_autoTried && live != null && !kIsWeb) {
      _autoTried = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) unawaited(_start());
      });
    }

    final signer = Container(
      decoration: BoxDecoration(
        color: Brand.paper,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Brand.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: live == null
          ? const Center(child: CircularProgressIndicator())
          : LiveSignerFrame(
              key: ValueKey(live.toString()),
              url: live,
              controller: _signer,
            ),
    );

    final captions = Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: Brand.navy,
        borderRadius: BorderRadius.circular(28),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (speech.on)
                const Pill(
                  '● LIVE',
                  background: Brand.danger,
                  foreground: Colors.white,
                )
              else
                const Pill('Paused', background: Brand.paper),
              const SizedBox(width: 8),
              SegmentedButton<String>(
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  foregroundColor: Colors.white,
                  selectedForegroundColor: Brand.navy,
                  selectedBackgroundColor: Brand.sun,
                  side: const BorderSide(color: Colors.white38),
                ),
                segments: const [
                  ButtonSegment(value: 'en_IN', label: Text('English')),
                  ButtonSegment(value: 'hi_IN', label: Text('हिन्दी')),
                ],
                selected: {locale},
                onSelectionChanged: (v) => _setLanguage(v.first),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Row(
            children: [
              TranslationModeSwitch(fixed: true, dark: true),
            ],
          ),
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Text(
              'Live signing is always instant, so it uses the built-in rules.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: SingleChildScrollView(
              reverse: true,
              child: Semantics(
                liveRegion: true,
                child: Text(
                  [
                        ..._lines,
                        if (_partial.isNotEmpty) _partial,
                      ].join(' ').isEmpty
                      ? (speech.on
                            ? 'Listening to the speaker…'
                            : 'Press Start, then point the phone at the speaker.')
                      : [
                          ..._lines,
                          if (_partial.isNotEmpty) _partial,
                        ].join(' '),
                  style: text.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontSize: 24,
                    height: 1.25,
                  ),
                ),
              ),
            ),
          ),
          if (speech.error != null)
            Text(speech.error!, style: const TextStyle(color: Brand.sun)),
          const SizedBox(height: 8),
          if (speech.on)
            FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: Brand.danger),
              onPressed: _stop,
              icon: const Icon(Icons.stop_rounded),
              label: const Text('Stop'),
            )
          else
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: Brand.voice,
                foregroundColor: Brand.navy,
              ),
              onPressed: live == null ? null : _start,
              icon: const Icon(Icons.mic_rounded),
              label: Text(_started ? 'Start again' : 'Start interpreting'),
            ),
          const SizedBox(height: 4),
          Text(
            'Signs words as they are heard. Signs are approximate; words it has no sign for stay in the captions.',
            style: text.bodySmall?.copyWith(color: Colors.white70),
          ),
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Interpret a speaker')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
          child: wide
              ? Row(
                  children: [
                    Expanded(flex: 4, child: signer),
                    const SizedBox(width: 12),
                    Expanded(flex: 5, child: captions),
                  ],
                )
              : Column(
                  children: [
                    Expanded(flex: 5, child: signer),
                    const SizedBox(height: 12),
                    Expanded(flex: 4, child: captions),
                  ],
                ),
        ),
      ),
    );
  }
}
