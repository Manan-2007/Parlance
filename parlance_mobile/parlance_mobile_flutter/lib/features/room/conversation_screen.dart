import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../app/theme.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../providers/speech_provider.dart';
import '../../widgets/parts.dart';
import '../cards/card_data.dart';
import '../signer/signer_sheet.dart';

/// One conversation, from this phone's side. The signer sees speech as big
/// captions; the speaker sees signed words and hears them read aloud.
class ConversationScreen extends ConsumerStatefulWidget {
  const ConversationScreen({super.key, this.invite = false});
  final bool invite;

  @override
  ConsumerState<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends ConsumerState<ConversationScreen> {
  final _typed = TextEditingController();
  final _spoken = <int>{};

  @override
  void initState() {
    super.initState();
    unawaited(WakelockPlus.enable());
    final messages = ref.read(roomProvider).messages;
    _spoken.addAll([for (final m in messages) m.id!]);
    if (widget.invite) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && ref.read(roomProvider).others.isEmpty) {
          showInvite(context, ref);
        }
      });
    }
  }

  @override
  void dispose() {
    unawaited(WakelockPlus.disable());
    _typed.dispose();
    super.dispose();
  }

  /// The hearing side hears each signed word as it arrives.
  void _readAloud(RoomState room) {
    final me = room.me;
    final profile = ref.read(profileProvider);
    for (final message in room.messages) {
      if (_spoken.contains(message.id)) continue;
      _spoken.add(message.id!);
      if (me == null || message.memberId == me.id) continue;
      if (me.role == MemberRole.speaker &&
          profile.readAloud &&
          message.role == MemberRole.signer) {
        unawaited(ref.read(voiceProvider).say(message.text));
      }
    }
  }

  Future<void> _send(UtteranceKind kind, String text, {String? hindi}) async {
    if (text.trim().isEmpty) return;
    await ref.read(roomProvider.notifier).say(kind, text, hindi: hindi);
  }

  Future<void> _end() async {
    final room = ref.read(roomProvider);
    final host = room.me?.id == room.members.firstOrNull?.id;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          host ? 'End this conversation?' : 'Leave this conversation?',
        ),
        content: Text(
          host
              ? 'It ends on every phone, and its messages are deleted.'
              : 'You can join again with the same code while it is open.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Stay'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(host ? 'End it' : 'Leave'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(speechProvider.notifier).stop();
    await ref.read(roomProvider.notifier).leave();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(roomProvider);
    ref.listen(roomProvider, (_, next) => _readAloud(next));
    final me = room.me;
    if (me == null || room.room == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Conversation')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  room.error ?? 'This conversation has ended.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/'),
                  child: const Text('Go home'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    final signer = me.role == MemberRole.signer;
    final others = room.others;
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              others.isEmpty
                  ? 'Waiting for them to join'
                  : 'With ${others.map((m) => m.name).join(', ')}',
            ),
            Text(
              'Code ${room.room!.code} · you ${signer ? 'sign' : 'speak'}',
              style: text.bodySmall?.copyWith(
                color: Brand.ink3,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Show the code',
            onPressed: () => showInvite(context, ref),
            icon: const Icon(Icons.qr_code_2_rounded),
          ),
          IconButton(
            tooltip: signer ? 'End or leave' : 'Leave',
            onPressed: _end,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (room.status == RoomStatus.reconnecting)
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Notice(
                  message:
                      'Reconnecting… Messages will arrive when the signal is back.',
                ),
              ),
            if (room.status == RoomStatus.ended)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Notice(
                  message: room.error ?? 'This conversation has ended.',
                  action: 'Home',
                  onAction: () => context.go('/'),
                ),
              ),
            if (room.error != null && room.status != RoomStatus.ended)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Notice(
                  message: room.error!,
                  danger: true,
                  action: 'OK',
                  onAction: ref.read(roomProvider.notifier).dismissError,
                ),
              ),
            Expanded(
              child: _Transcript(room: room, signer: signer),
            ),
            if (room.status != RoomStatus.ended)
              signer
                  ? _SignerDock(typed: _typed, onSend: _send)
                  : _SpeakerDock(typed: _typed, onSend: _send),
          ],
        ),
      ),
    );
  }
}

/// The QR code and code, big, for the other phone to scan.
Future<void> showInvite(BuildContext context, WidgetRef ref) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Brand.surface,
    builder: (context) => Consumer(
      builder: (context, ref, _) {
        final room = ref.watch(roomProvider);
        final services = ref.watch(servicesProvider).value;
        final code = room.room?.code ?? '';
        final link = services?.joinLink(code) ?? code;
        final text = Theme.of(context).textTheme;
        final joined = room.others.isNotEmpty;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  joined ? 'They have joined' : 'Ask them to scan this',
                  style: text.headlineSmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  'With the Parlance app, or with their phone camera to open it in a browser.',
                  style: text.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Brand.line),
                  ),
                  child: QrImageView(
                    data: link,
                    size: 230,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Brand.navy,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Brand.navy,
                    ),
                    semanticsLabel: 'QR code to join this conversation',
                  ),
                ),
                const SizedBox(height: 16),
                Text('or type the code', style: text.bodyMedium),
                SelectableText(
                  code.length == 6
                      ? '${code.substring(0, 3)} ${code.substring(3)}'
                      : code,
                  style: text.displaySmall?.copyWith(letterSpacing: 6),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(joined ? 'Start talking' : 'Done'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
}

/// A run of messages from one person, shown as one bubble (signed words join
/// into a line as they arrive).
class _Group {
  _Group(this.first);
  final Utterance first;
  final List<Utterance> items = [];
}

List<_Group> _group(List<Utterance> messages) {
  final groups = <_Group>[];
  for (final m in messages) {
    final last = groups.lastOrNull;
    final joins =
        last != null &&
        last.first.memberId == m.memberId &&
        last.first.kind == UtteranceKind.sign &&
        m.kind == UtteranceKind.sign &&
        m.createdAt.difference(last.items.last.createdAt).inSeconds < 12;
    if (joins) {
      last.items.add(m);
    } else {
      groups.add(_Group(m)..items.add(m));
    }
  }
  return groups;
}

class _Transcript extends ConsumerWidget {
  const _Transcript({required this.room, required this.signer});
  final RoomState room;
  final bool signer;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groups = _group(room.messages);
    final live = room.live.entries.where((e) => e.value.isNotEmpty).toList();
    final text = Theme.of(context).textTheme;
    if (groups.isEmpty && live.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            room.others.isEmpty
                ? 'When they join, everything you both say appears here.'
                : signer
                ? 'Sign, tap a card or type below. What they say appears here in big text.'
                : 'Tap the microphone and talk, or type. Their signs appear here and are read aloud.',
            style: text.titleMedium?.copyWith(
              color: Brand.ink3,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    final items = <Widget>[
      for (final entry in live)
        _LiveBubble(member: room.memberById(entry.key), text: entry.value),
      for (final group in groups.reversed)
        _Bubble(
          group: group,
          mine: group.first.memberId == room.me?.id,
          reader: room.me?.role ?? MemberRole.speaker,
        ),
    ];
    return ListView(
      reverse: true,
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
      children: items,
    );
  }
}

class _Bubble extends ConsumerWidget {
  const _Bubble({
    required this.group,
    required this.mine,
    required this.reader,
  });
  final _Group group;
  final bool mine;
  final MemberRole reader;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final first = group.first;
    final text = Theme.of(context).textTheme;
    final words = group.items.map((m) => m.text).join(' ');
    final sentence = first.kind == UtteranceKind.sign
        ? _capitalise(words)
        : words;
    final (color, ink, label, icon) = switch (first.kind) {
      UtteranceKind.sign => (
        Brand.hands,
        Colors.white,
        'Signed',
        Icons.sign_language_rounded,
      ),
      UtteranceKind.speech => (
        Brand.voice,
        Brand.navy,
        'Spoken',
        Icons.record_voice_over_rounded,
      ),
      UtteranceKind.card => (
        Brand.sun,
        Brand.navy,
        'Card',
        Icons.style_rounded,
      ),
      UtteranceKind.reply => (
        Brand.surface,
        Brand.navy,
        'Reply',
        Icons.touch_app_rounded,
      ),
      UtteranceKind.typed => (
        Brand.surface,
        Brand.navy,
        'Typed',
        Icons.keyboard_rounded,
      ),
    };
    // Captions for the person reading them are large; your own lines stay smaller.
    final size = mine ? 18.0 : (reader == MemberRole.signer ? 30.0 : 26.0);
    final services = ref.watch(servicesProvider).value;
    final canSign =
        !mine && reader == MemberRole.signer && services?.signer != null;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * (mine ? 0.8 : 0.94),
        ),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 5),
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          decoration: BoxDecoration(
            color: color,
            border: color == Brand.surface
                ? Border.all(color: Brand.line)
                : null,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(24),
              topRight: const Radius.circular(24),
              bottomLeft: Radius.circular(mine ? 24 : 6),
              bottomRight: Radius.circular(mine ? 6 : 24),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 15, color: ink.withValues(alpha: 0.75)),
                  const SizedBox(width: 5),
                  Text(
                    mine ? 'You · $label' : label,
                    style: text.labelMedium?.copyWith(
                      color: ink.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                sentence,
                style: text.headlineSmall?.copyWith(
                  color: ink,
                  fontSize: size,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (first.hindi != null && group.items.length == 1) ...[
                const SizedBox(height: 4),
                Text(
                  first.hindi!,
                  style: text.titleMedium?.copyWith(
                    color: ink.withValues(alpha: 0.85),
                    fontSize: size * 0.7,
                  ),
                ),
              ],
              if (canSign)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      foregroundColor: ink,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      visualDensity: VisualDensity.compact,
                    ),
                    onPressed: () =>
                        showSigner(context, services!.signer!, sentence),
                    icon: const Icon(Icons.accessibility_new_rounded, size: 20),
                    label: const Text('See it in sign'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

String _capitalise(String text) =>
    text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);

class _LiveBubble extends StatelessWidget {
  const _LiveBubble({required this.member, required this.text});
  final RoomMember? member;
  final String text;

  @override
  Widget build(BuildContext context) {
    final signing = member?.role == MemberRole.signer;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 5),
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
        decoration: BoxDecoration(
          color: (signing ? Brand.handsSoft : Brand.voiceSoft),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              signing ? 'Signing…' : 'Speaking…',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: Brand.ink2,
              ),
            ),
            Text(
              text,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                fontStyle: FontStyle.italic,
                color: Brand.navy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const _signerReplies = [
  Line(en: 'Yes.', hi: 'हाँ।'),
  Line(en: 'No.', hi: 'नहीं।'),
  Line(en: 'Please write it down.', hi: 'कृपया लिखकर बताइए।'),
  Line(en: 'Please say it again, slowly.', hi: 'कृपया फिर से, धीरे बोलिए।'),
  Line(en: 'Thank you.', hi: 'धन्यवाद।'),
];

const _speakerReplies = [
  Line(en: 'Yes.', hi: 'हाँ।'),
  Line(en: 'No.', hi: 'नहीं।'),
  Line(en: 'Please wait here.', hi: 'कृपया यहाँ इंतज़ार कीजिए।'),
  Line(en: 'One moment, please.', hi: 'एक पल रुकिए।'),
  Line(en: 'Please sign that again.', hi: 'कृपया फिर से इशारा कीजिए।'),
];

class _Replies extends StatelessWidget {
  const _Replies({required this.lines, required this.onSend});
  final List<Line> lines;
  final Future<void> Function(UtteranceKind, String, {String? hindi}) onSend;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: lines.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final line = lines[index];
          return ActionChip(
            label: Text(line.en),
            onPressed: () =>
                onSend(UtteranceKind.reply, line.en, hindi: line.hi),
          );
        },
      ),
    );
  }
}

class _TypeField extends StatelessWidget {
  const _TypeField({required this.controller, required this.onSend});
  final TextEditingController controller;
  final Future<void> Function(UtteranceKind, String, {String? hindi}) onSend;

  void _submit() {
    final value = controller.text.trim();
    if (value.isEmpty) return;
    controller.clear();
    onSend(UtteranceKind.typed, value);
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      minLines: 1,
      maxLines: 3,
      maxLength: 600,
      textCapitalization: TextCapitalization.sentences,
      textInputAction: TextInputAction.send,
      onSubmitted: (_) => _submit(),
      decoration: InputDecoration(
        hintText: 'Type a message',
        counterText: '',
        suffixIcon: IconButton(
          tooltip: 'Send',
          onPressed: _submit,
          icon: const Icon(Icons.send_rounded, color: Brand.royal),
        ),
      ),
    );
  }
}

class _SignerDock extends ConsumerWidget {
  const _SignerDock({required this.typed, required this.onSend});
  final TextEditingController typed;
  final Future<void> Function(UtteranceKind, String, {String? hindi}) onSend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _Dock(
      children: [
        _Replies(lines: _signerReplies, onSend: onSend),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Brand.hands,
                    minimumSize: const Size(64, 58),
                  ),
                  onPressed: () => context.push('/room/sign'),
                  icon: const Icon(Icons.videocam_rounded),
                  label: const Text('Sign'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Brand.sun,
                    foregroundColor: Brand.navy,
                    minimumSize: const Size(64, 58),
                  ),
                  onPressed: () => _pickCard(context, onSend),
                  icon: const Icon(Icons.style_rounded),
                  label: const Text('Card'),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          child: _TypeField(controller: typed, onSend: onSend),
        ),
      ],
    );
  }
}

Future<void> _pickCard(
  BuildContext context,
  Future<void> Function(UtteranceKind, String, {String? hindi}) onSend,
) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Brand.surface,
    builder: (context) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      builder: (context, scroll) => ListView(
        controller: scroll,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          Text('Send a card', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(
            'It appears on their phone in English and Hindi.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          for (final place in [emergency, ...places]) ...[
            Padding(
              padding: const EdgeInsets.only(top: 18, bottom: 6),
              child: Row(
                children: [
                  Icon(
                    place.icon,
                    color: place == emergency ? Brand.danger : Brand.royal,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    place.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ),
            for (final card in [
              if (place == emergency) deafCard,
              ...place.cards.where((c) => c.fill == null && c.profile == null),
            ])
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Material(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Brand.line),
                  ),
                  child: ListTile(
                    title: Text(
                      card.en,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Brand.navy,
                      ),
                    ),
                    subtitle: Text(card.hi),
                    trailing: const Icon(
                      Icons.send_rounded,
                      color: Brand.royal,
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      onSend(UtteranceKind.card, card.en, hindi: card.hi);
                    },
                  ),
                ),
              ),
          ],
        ],
      ),
    ),
  );
}

class _SpeakerDock extends ConsumerWidget {
  const _SpeakerDock({required this.typed, required this.onSend});
  final TextEditingController typed;
  final Future<void> Function(UtteranceKind, String, {String? hindi}) onSend;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final speech = ref.watch(speechProvider);
    final profile = ref.watch(profileProvider);
    final hindi = profile.speechLocale == 'hi_IN';
    Future<void> toggle() async {
      final mic = ref.read(speechProvider.notifier);
      if (speech.on) {
        await mic.stop();
        ref.read(roomProvider.notifier).clearLive();
        return;
      }
      await mic.start(
        locale: profile.speechLocale,
        onSentence: (sentence) => onSend(UtteranceKind.speech, sentence),
        onPartial: (partial) => ref.read(roomProvider.notifier).live(partial),
      );
    }

    return _Dock(
      children: [
        if (speech.error != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: Notice(message: speech.error!, danger: true),
          ),
        if (speech.partial.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Text(
              speech.partial,
              style: const TextStyle(
                fontSize: 20,
                fontStyle: FontStyle.italic,
                color: Brand.ink2,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        _Replies(lines: _speakerReplies, onSend: onSend),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: speech.on ? Brand.danger : Brand.voice,
                    foregroundColor: speech.on ? Colors.white : Brand.navy,
                    minimumSize: const Size(64, 58),
                  ),
                  onPressed: toggle,
                  icon: Icon(
                    speech.on ? Icons.stop_rounded : Icons.mic_rounded,
                  ),
                  label: Text(speech.on ? 'Stop listening' : 'Talk'),
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(72, 58),
                ),
                onPressed: () => ref
                    .read(profileProvider.notifier)
                    .update(
                      profile.copyWith(speechLocale: hindi ? 'en_IN' : 'hi_IN'),
                    ),
                child: Text(
                  hindi ? 'हिंदी' : 'English',
                  semanticsLabel: hindi
                      ? 'Speech language Hindi. Switch to English.'
                      : 'Speech language English. Switch to Hindi.',
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                tooltip: profile.readAloud
                    ? 'Stop reading signs aloud'
                    : 'Read signs aloud',
                onPressed: () => ref
                    .read(profileProvider.notifier)
                    .update(profile.copyWith(readAloud: !profile.readAloud)),
                icon: Icon(
                  profile.readAloud
                      ? Icons.volume_up_rounded
                      : Icons.volume_off_rounded,
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
          child: _TypeField(controller: typed, onSend: onSend),
        ),
      ],
    );
  }
}

class _Dock extends StatelessWidget {
  const _Dock({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 10, bottom: 10),
      decoration: const BoxDecoration(
        color: Brand.surface,
        border: Border(top: BorderSide(color: Brand.line)),
      ),
      child: PageBody(
        maxWidth: 720,
        child: Column(mainAxisSize: MainAxisSize.min, children: children),
      ),
    );
  }
}
