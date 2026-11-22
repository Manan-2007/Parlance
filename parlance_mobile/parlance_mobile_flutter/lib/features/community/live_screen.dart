import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../app/theme.dart';
import '../../core/session.dart';
import '../../providers/community_provider.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';
import 'community_parts.dart';

/// Type the six digits the host shows at the meetup.
class LiveJoinScreen extends StatefulWidget {
  const LiveJoinScreen({super.key});

  @override
  State<LiveJoinScreen> createState() => _LiveJoinScreenState();
}

class _LiveJoinScreenState extends State<LiveJoinScreen> {
  final _code = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _join() {
    final code = codeFrom(_code.text.replaceAll(' ', ''));
    if (code == null) {
      setState(() => _error = 'The code has six digits.');
      return;
    }
    context.pushReplacement('/community/live/$code');
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Join a live meetup')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          PageBody(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'At a meetup, the host shows a QR code and a six-digit code. Everyone who is there joins the same live room and talks on one shared screen.',
                  style: text.bodyLarge,
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _code,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  style: text.headlineMedium?.copyWith(letterSpacing: 6),
                  textAlign: TextAlign.center,
                  onSubmitted: (_) => _join(),
                  decoration: InputDecoration(
                    labelText: 'Code',
                    hintText: '123456',
                    errorText: _error,
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _join,
                  icon: const Icon(Icons.podcasts_rounded),
                  label: const Text('Join'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// "Here, together": one shared wall of big messages for everyone at a meetup.
class LiveScreen extends ConsumerStatefulWidget {
  const LiveScreen({super.key, required this.code});
  final String code;

  @override
  ConsumerState<LiveScreen> createState() => _LiveScreenState();
}

class _LiveScreenState extends ConsumerState<LiveScreen> {
  static const quick = [
    'Hello!',
    'Nice to meet you',
    'Can you sign that again, slowly?',
    'Where are you sitting?',
    'Thank you',
    'I need a break',
  ];

  final _text = TextEditingController();
  final _scroll = ScrollController();
  CommunityInput _input = CommunityInput.typed;
  bool _busy = false;
  bool _showCode = false;

  @override
  void initState() {
    super.initState();
    unawaited(WakelockPlus.enable());
  }

  @override
  void dispose() {
    unawaited(WakelockPlus.disable());
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send(String message, CommunityInput input) async {
    if (message.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      await ref
          .read(communityLiveProvider(widget.code).notifier)
          .say(message.trim(), input);
      if (message == _text.text) _text.clear();
      _input = CommunityInput.typed;
    } catch (e) {
      if (mounted) toast(context, communityError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final live = ref.watch(communityLiveProvider(widget.code));
    final me = ref.watch(communityMeProvider).value;
    final app = ref.watch(servicesProvider).value?.app;
    ref.listen(communityLiveProvider(widget.code), (before, after) {
      if ((after.value?.messages.length ?? 0) !=
          (before?.value?.messages.length ?? 0)) {
        _toBottom();
      }
    });
    return Scaffold(
      appBar: AppBar(
        title: const Text('Here, together'),
        actions: [
          TextButton(
            onPressed: () => setState(() => _showCode = !_showCode),
            child: Text(
              _showCode ? 'Hide code' : 'Code ${formatCode(widget.code)}',
            ),
          ),
        ],
      ),
      body: switch (live) {
        AsyncError(:final error) when live.value == null => Padding(
          padding: const EdgeInsets.all(20),
          child: Notice(
            message: communityError(error),
            danger: true,
            action: 'Another code',
            onAction: () => context.pushReplacement('/community/live'),
          ),
        ),
        AsyncValue(value: final state?) => SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(state.room.title, style: text.headlineSmall),
                    Text(
                      '${state.room.place}, ${state.room.city} · ${state.ended ? 'Ended' : 'Ends ${clock(state.room.endsAt)}'}',
                      style: text.bodyMedium,
                    ),
                    if (_showCode) ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: QrImageView(
                              data: app == null
                                  ? widget.code
                                  : app
                                        .replace(
                                          fragment:
                                              '/community/live/${widget.code}',
                                        )
                                        .toString(),
                              size: 120,
                              semanticsLabel: 'QR code to join this live room',
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  formatCode(widget.code),
                                  style: text.headlineMedium?.copyWith(
                                    letterSpacing: 4,
                                  ),
                                ),
                                const Text(
                                  'Someone next to you can scan this, or type the code.',
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Brand.navy,
                    borderRadius: BorderRadius.circular(28),
                  ),
                  child: state.messages.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'Nobody has written yet. Say hello: type it or speak it.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scroll,
                          padding: const EdgeInsets.all(12),
                          itemCount: state.messages.length,
                          itemBuilder: (context, i) {
                            final message = state.messages[i];
                            final mine = message.author.id == me?.id;
                            return Align(
                              alignment: mine
                                  ? Alignment.centerRight
                                  : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.fromLTRB(
                                  14,
                                  10,
                                  14,
                                  8,
                                ),
                                constraints: const BoxConstraints(
                                  maxWidth: 520,
                                ),
                                decoration: BoxDecoration(
                                  color: mine ? Brand.sun : Brand.surface,
                                  borderRadius: BorderRadius.circular(22),
                                ),
                                child: Semantics(
                                  liveRegion: i == state.messages.length - 1,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      AuthorLine(
                                        author: message.author,
                                        at: message.createdAt,
                                        input: message.input,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        message.text,
                                        style: text.headlineSmall?.copyWith(
                                          fontSize: 26,
                                          height: 1.2,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      SeeAndHear(text: message.text),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ),
              if (state.ended)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Notice(
                        message:
                            'This live room has ended. Its messages are deleted. Keep talking in the meetup thread.',
                      ),
                      const SizedBox(height: 10),
                      FilledButton(
                        onPressed: () => context.pushReplacement(
                          '/community/t/${state.room.threadId}',
                        ),
                        child: const Text('Go to the meetup thread'),
                      ),
                    ],
                  ),
                )
              else if (me == null)
                const Padding(padding: EdgeInsets.all(16), child: JoinCard())
              else
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SizedBox(
                        height: 40,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            for (final q in quick)
                              Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: ActionChip(
                                  label: Text(q),
                                  onPressed: _busy
                                      ? null
                                      : () => _send(q, CommunityInput.typed),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: PostBox(
                              controller: _text,
                              label: 'Your message',
                              maxLength: 280,
                              minLines: 1,
                              onInput: (input) => _input = input,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 52),
                            child: IconButton.filled(
                              tooltip: 'Send to the room',
                              onPressed: _busy
                                  ? null
                                  : () => _send(_text.text, _input),
                              icon: const Icon(Icons.send_rounded),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}
