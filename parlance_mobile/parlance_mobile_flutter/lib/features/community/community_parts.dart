import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../../app/theme.dart';
import '../../providers/community_provider.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../providers/speech_provider.dart';
import '../signer/signer_sheet.dart';

/// How each space looks (the same as the website).
const spaceStyle = <String, (IconData, Color, Color, String)>{
  'everyday': (
    Icons.shopping_bag_outlined,
    Brand.sun,
    Brand.navy,
    'Everyday life',
  ),
  'work': (
    Icons.work_outline_rounded,
    Brand.hands,
    Colors.white,
    'Work and jobs',
  ),
  'study': (
    Icons.menu_book_rounded,
    Color(0xFF2F7D5B),
    Colors.white,
    'Study and exams',
  ),
  'health': (Icons.monitor_heart_outlined, Brand.voice, Brand.navy, 'Health'),
  'rights': (
    Icons.balance_rounded,
    Brand.navy,
    Colors.white,
    'Rights and documents',
  ),
  'family': (
    Icons.people_outline_rounded,
    Brand.sun,
    Brand.navy,
    'Family and friends',
  ),
  'learn-isl': (
    Icons.sign_language_rounded,
    Color(0xFF2F7D5B),
    Colors.white,
    'Learning ISL',
  ),
  'tech': (
    Icons.smartphone_rounded,
    Brand.hands,
    Colors.white,
    'Tech and tools',
  ),
  'meetups': (Icons.place_outlined, Brand.voice, Brand.navy, 'Meetups'),
};

const wayLabels = {
  'deaf': 'Deaf',
  'hard-of-hearing': 'Hard of hearing',
  'deafblind': 'DeafBlind',
  'family': 'Family or CODA',
  'learning': 'Learning ISL',
  'interpreter': 'Interpreter',
  'teacher': 'Teacher',
};

const reportReasons = {
  'spam': 'Spam or advertising',
  'rude': 'Rude or hateful',
  'unsafe': 'Unsafe or harmful advice',
  'private': "Shares someone's private details",
  'other': 'Something else',
};

String timeAgo(DateTime time) {
  final diff = DateTime.now().toUtc().difference(time.toUtc());
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inHours < 1) return '${diff.inMinutes} min ago';
  if (diff.inDays < 1) return '${diff.inHours} h ago';
  if (diff.inDays == 1) return 'yesterday';
  if (diff.inDays < 7) return '${diff.inDays} days ago';
  final local = time.toLocal();
  return '${local.day}/${local.month}/${local.year}';
}

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

String clock(DateTime time) {
  final t = time.toLocal();
  final h = t.hour % 12 == 0 ? 12 : t.hour % 12;
  return '$h:${t.minute.toString().padLeft(2, '0')} ${t.hour < 12 ? 'am' : 'pm'}';
}

String meetupWhen(CommunityMeetup m) {
  final s = m.startsAt.toLocal();
  return '${_weekdays[s.weekday - 1]} ${s.day} ${_months[s.month - 1]}, ${clock(m.startsAt)} – ${clock(m.endsAt)}';
}

String formatCode(String code) =>
    code.length == 6 ? '${code.substring(0, 3)} ${code.substring(3)}' : code;

void toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

class SpaceIcon extends StatelessWidget {
  const SpaceIcon(this.space, {super.key, this.size = 40});
  final String space;
  final double size;

  @override
  Widget build(BuildContext context) {
    final (icon, background, foreground, _) =
        spaceStyle[space] ?? spaceStyle['everyday']!;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Icon(icon, color: foreground, size: size * 0.5),
    );
  }
}

class Pill extends StatelessWidget {
  const Pill(
    this.label, {
    super.key,
    this.background = Brand.handsSoft,
    this.foreground = Brand.navy,
    this.icon,
  });
  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: foreground),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: foreground,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

/// Who wrote it, how they describe themselves, when, and how it was written.
class AuthorLine extends StatelessWidget {
  const AuthorLine({
    super.key,
    required this.author,
    required this.at,
    this.input,
    this.edited = false,
  });
  final CommunityAuthor author;
  final DateTime at;
  final CommunityInput? input;
  final bool edited;

  @override
  Widget build(BuildContext context) {
    final small = Theme.of(
      context,
    ).textTheme.bodySmall?.copyWith(color: Brand.ink3);
    return Wrap(
      spacing: 6,
      runSpacing: 4,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: Brand.handsSoft,
          child: Text(
            author.handle.characters.first.toUpperCase(),
            style: const TextStyle(
              color: Brand.handsDeep,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        Text(
          author.handle,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            color: Brand.navy,
          ),
        ),
        if (author.city.isNotEmpty) Text(author.city, style: small),
        for (final way in author.ways.take(2))
          Pill(
            wayLabels[way] ?? way,
            background:
                const {'deaf', 'hard-of-hearing', 'deafblind'}.contains(way)
                ? Brand.handsSoft
                : Brand.paper,
          ),
        if (author.sample)
          const Tooltip(
            message: 'Written by Parlance as an example, not by a real person',
            child: Pill(
              'Sample',
              background: Brand.sunSoft,
              foreground: Brand.sunDeep,
            ),
          ),
        Text('· ${timeAgo(at)}${edited ? ' (edited)' : ''}', style: small),
        if (input == CommunityInput.signed)
          const Pill('Signed', icon: Icons.sign_language_rounded)
        else if (input == CommunityInput.spoken)
          const Pill(
            'Spoken',
            background: Brand.voiceSoft,
            icon: Icons.mic_rounded,
          ),
      ],
    );
  }
}

class PostCard extends StatelessWidget {
  const PostCard({super.key, required this.post});
  final CommunityPost post;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final meetup = post.meetup;
    return Material(
      color: Brand.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: Brand.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/community/t/${post.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 6,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  SpaceIcon(post.space, size: 26),
                  Text(
                    spaceStyle[post.space]?.$4 ?? post.space,
                    style: text.bodySmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: Brand.ink3,
                    ),
                  ),
                  if (post.kind == CommunityKind.question)
                    const Pill('Question'),
                  if (post.kind == CommunityKind.meetup)
                    const Pill('Meetup', background: Brand.voiceSoft),
                  if (post.answerId != null)
                    const Pill(
                      'Answered',
                      background: Color(0xFFD8EEDF),
                      icon: Icons.check_circle_rounded,
                    ),
                  if (meetup?.live ?? false)
                    const Pill(
                      'Live now',
                      background: Brand.dangerSoft,
                      foreground: Brand.danger,
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                post.title,
                style: text.titleMedium?.copyWith(fontSize: 18, height: 1.25),
              ),
              const SizedBox(height: 4),
              if (meetup != null) ...[
                _IconText(Icons.event_rounded, meetupWhen(meetup)),
                _IconText(
                  Icons.place_outlined,
                  '${meetup.place}, ${meetup.city}',
                ),
              ] else
                Text(
                  post.body,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: text.bodyMedium,
                ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: AuthorLine(author: post.author, at: post.createdAt),
                  ),
                  const SizedBox(width: 8),
                  Semantics(
                    label:
                        '${post.replyCount} replies, ${post.helpful} found it helpful',
                    child: ExcludeSemantics(
                      child: Row(
                        children: [
                          const Icon(
                            Icons.forum_outlined,
                            size: 16,
                            color: Brand.ink3,
                          ),
                          Text(' ${post.replyCount}  ', style: text.bodySmall),
                          const Icon(
                            Icons.thumb_up_alt_outlined,
                            size: 16,
                            color: Brand.ink3,
                          ),
                          Text(' ${post.helpful}', style: text.bodySmall),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IconText extends StatelessWidget {
  const _IconText(this.icon, this.label);
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 2),
    child: Row(
      children: [
        Icon(icon, size: 17, color: Brand.ink3),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Brand.ink2,
            ),
          ),
        ),
      ],
    ),
  );
}

/// Choose a name to post with. Reading never needs this.
class JoinCard extends ConsumerStatefulWidget {
  const JoinCard({super.key});

  @override
  ConsumerState<JoinCard> createState() => _JoinCardState();
}

class _JoinCardState extends ConsumerState<JoinCard> {
  final _handle = TextEditingController();
  final _city = TextEditingController();
  final _ways = <String>{};
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _handle.dispose();
    _city.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    final name = _handle.text.trim();
    if (name.length < 3) {
      setState(() => _error = 'Use at least 3 characters for your name.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(communityMeProvider.notifier)
          .join(name, _city.text.trim(), _ways.toList());
      if (mounted) toast(context, 'Welcome, $name.');
    } catch (e) {
      if (mounted) setState(() => _error = communityError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Brand.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Join to post and reply', style: text.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Pick a name people will see. It does not need to be your real name. Reading is open to everyone.',
            style: text.bodyMedium,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _handle,
            maxLength: 24,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Your community name',
              hintText: 'For example: Asha_signs',
            ),
          ),
          TextField(
            controller: _city,
            maxLength: 40,
            decoration: const InputDecoration(
              labelText: 'City (optional)',
              hintText: 'Helps find meetups near you',
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'How do you describe yourself? (optional)',
            style: text.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final MapEntry(:key, :value) in wayLabels.entries)
                FilterChip(
                  label: Text(value),
                  selected: _ways.contains(key),
                  onSelected: (on) =>
                      setState(() => on ? _ways.add(key) : _ways.remove(key)),
                ),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: const TextStyle(
                color: Brand.danger,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _busy ? null : _join,
            child: Text(_busy ? 'Joining…' : 'Join the community'),
          ),
          const SizedBox(height: 8),
          Text(
            'Do not share medical or contact details in posts.',
            style: text.bodySmall?.copyWith(color: Brand.ink3),
          ),
        ],
      ),
    );
  }
}

/// "See in sign" (the 3D signer) and "Read aloud" for any text.
class SeeAndHear extends ConsumerWidget {
  const SeeAndHear({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signer = ref.watch(servicesProvider).value?.signer;
    return Wrap(
      spacing: 6,
      children: [
        if (signer != null)
          OutlinedButton.icon(
            onPressed: () => showSigner(
              context,
              signer,
              text.length > 600 ? text.substring(0, 600) : text,
            ),
            icon: const Icon(Icons.accessibility_new_rounded, size: 18),
            label: const Text('See in sign'),
          ),
        OutlinedButton.icon(
          onPressed: () => unawaited(ref.read(voiceProvider).say(text)),
          icon: const Icon(Icons.volume_up_rounded, size: 18),
          label: const Text('Read aloud'),
        ),
      ],
    );
  }
}

/// A text box you can type into or speak into. [onInput] says how it was written.
class PostBox extends ConsumerStatefulWidget {
  const PostBox({
    super.key,
    required this.controller,
    required this.label,
    required this.onInput,
    this.hint,
    this.maxLength = 2000,
    this.minLines = 3,
  });
  final TextEditingController controller;
  final String label;
  final String? hint;
  final int maxLength;
  final int minLines;
  final ValueChanged<CommunityInput> onInput;

  @override
  ConsumerState<PostBox> createState() => _PostBoxState();
}

class _PostBoxState extends ConsumerState<PostBox> {
  String _before = '';
  late final SpeechController _speech;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _speech = ref.read(speechProvider.notifier);
  }

  Future<void> _mic() async {
    final speech = _speech;
    if (ref.read(speechProvider).on) {
      await speech.stop();
      return;
    }
    _started = true;
    _before = widget.controller.text.trimRight();
    String join(String words) => _before.isEmpty ? words : '$_before $words';
    await speech.start(
      locale: ref.read(profileProvider).speechLocale,
      onPartial: (partial) => widget.controller.text = join(partial),
      onSentence: (sentence) {
        widget.controller.text = join(sentence);
        _before = widget.controller.text;
        widget.onInput(CommunityInput.spoken);
      },
    );
  }

  @override
  void dispose() {
    // Leaving the screen stops the microphone this box turned on.
    if (_started) unawaited(_speech.stop());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final speech = ref.watch(speechProvider);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: widget.controller,
          minLines: widget.minLines,
          maxLines: 10,
          maxLength: widget.maxLength,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.hint,
            alignLabelWithHint: true,
          ),
        ),
        Row(
          children: [
            FilledButton.tonalIcon(
              style: FilledButton.styleFrom(
                backgroundColor: speech.on ? Brand.voice : Brand.voiceSoft,
                foregroundColor: Brand.navy,
              ),
              onPressed: _mic,
              icon: Icon(speech.on ? Icons.stop_rounded : Icons.mic_rounded),
              label: Text(speech.on ? 'Stop' : 'Speak'),
            ),
            if (speech.error != null) ...[
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  speech.error!,
                  style: const TextStyle(color: Brand.danger, fontSize: 12),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

Future<String?> askReportReason(BuildContext context) => showDialog<String>(
  context: context,
  builder: (context) => SimpleDialog(
    title: const Text('Why are you reporting this?'),
    children: [
      const Padding(
        padding: EdgeInsets.fromLTRB(24, 0, 24, 8),
        child: Text(
          'Reports are anonymous. A post is hidden once several people report it.',
        ),
      ),
      for (final MapEntry(:key, :value) in reportReasons.entries)
        SimpleDialogOption(
          onPressed: () => Navigator.pop(context, key),
          child: Text(value),
        ),
    ],
  ),
);

Future<bool> confirm(
  BuildContext context,
  String title,
  String body,
  String action,
) async =>
    await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Brand.danger),
            onPressed: () => Navigator.pop(context, true),
            child: Text(action),
          ),
        ],
      ),
    ) ??
    false;
