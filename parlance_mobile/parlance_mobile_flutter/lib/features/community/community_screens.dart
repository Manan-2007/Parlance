import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../app/theme.dart';
import '../../core/client.dart';
import '../../core/session.dart';
import '../../providers/community_offline.dart';
import '../../providers/community_provider.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';
import 'community_parts.dart';

/// Community home: long conversations with people who share the same everyday
/// problems (not a fast group chat), spaces, and meetups with a live room.
class CommunityScreen extends ConsumerWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final me = ref.watch(communityMeProvider);
    final spaces = ref.watch(communitySpacesProvider);
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/community/new'),
        icon: const Icon(Icons.edit_rounded),
        label: const Text('New post'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(communitySpacesProvider);
            ref.invalidate(communityThreadsProvider);
            ref.invalidate(communityMeProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 96),
            children: [
              PageBody(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Community',
                      style: text.displaySmall?.copyWith(fontSize: 34),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Talk in depth with people who live it: Deaf and hard-of-hearing people, their families and learners. Ask, share what worked, and meet in person.',
                      style: text.bodyLarge?.copyWith(color: Brand.ink2),
                    ),
                    const OfflineBanners(),
                    const SizedBox(height: 16),
                    ActionTile(
                      icon: Icons.podcasts_rounded,
                      title: 'At a meetup? Join live',
                      body:
                          "Type the host's code. Everyone there shares one screen of big messages.",
                      background: Brand.voice,
                      bordered: false,
                      onTap: () => context.push('/community/live'),
                    ),
                    const SizedBox(height: 16),
                    switch (me) {
                      AsyncData(value: final author?) => Text(
                        'You post as ${author.handle}${author.city.isEmpty ? '' : ' from ${author.city}'}.',
                        style: text.bodyMedium,
                      ),
                      AsyncData() => const JoinCard(),
                      AsyncError(:final error) => Notice(
                        message: communityError(error),
                        danger: true,
                        action: 'Try again',
                        onAction: () => ref.invalidate(communityMeProvider),
                      ),
                      _ => const SizedBox.shrink(),
                    },
                    const SectionTitle('Spaces'),
                    switch (spaces) {
                      AsyncData(value: final list) => Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final space in list)
                            ActionChip(
                              avatar: SpaceIcon(space.id, size: 24),
                              label: Text('${space.title} · ${space.threads}'),
                              onPressed: () =>
                                  context.push('/community/s/${space.id}'),
                            ),
                        ],
                      ),
                      AsyncError(:final error) => Notice(
                        message: communityError(error),
                        danger: true,
                      ),
                      _ => const LinearProgressIndicator(),
                    },
                    const SectionTitle('Latest from everyone'),
                    const ThreadList(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Threads, sortable and searchable, optionally in one space.
/// "You're offline" and "N posts waiting to send", for the Community home.
class OfflineBanners extends ConsumerWidget {
  const OfflineBanners({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offline = ref.watch(communityOfflineProvider);
    final outbox = ref.watch(communityOutboxProvider);
    // When queued posts go out, show them in the lists.
    ref.listen(communityOutboxProvider.select((o) => o.sent), (_, _) {
      ref.invalidate(communityThreadsProvider);
      ref.invalidate(communitySpacesProvider);
    });
    final waiting = outbox.pending.length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (offline) ...[
          const SizedBox(height: 12),
          const Notice(
            message:
                "You're offline. Showing posts saved on this phone. You can still write; it is sent when you're back online.",
          ),
        ],
        if (waiting > 0) ...[
          const SizedBox(height: 12),
          Notice(
            message:
                '$waiting ${waiting == 1 ? 'post is' : 'posts are'} waiting to send.',
            action: 'Send now',
            onAction: () => ref.read(communityOutboxProvider.notifier).flush(),
          ),
        ],
        for (final problem in outbox.problems) ...[
          const SizedBox(height: 12),
          Notice(
            message: problem,
            danger: true,
            action: 'OK',
            onAction: () =>
                ref.read(communityOutboxProvider.notifier).dismissProblems(),
          ),
        ],
      ],
    );
  }
}

class ThreadList extends ConsumerStatefulWidget {
  const ThreadList({super.key, this.space});
  final String? space;

  @override
  ConsumerState<ThreadList> createState() => _ThreadListState();
}

class _ThreadListState extends ConsumerState<ThreadList> {
  late String _sort = widget.space == 'meetups' ? 'meetups' : 'active';
  String _search = '';
  final _field = TextEditingController();

  @override
  void dispose() {
    _field.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final threads = ref.watch(
      communityThreadsProvider((
        space: widget.space,
        sort: _sort,
        search: _search,
      )),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            for (final (value, label) in [
              ('active', 'Active'),
              ('new', 'New'),
              if (widget.space != 'meetups') ('unanswered', 'Unanswered'),
              ('meetups', 'Meetups'),
            ])
              ChoiceChip(
                label: Text(label),
                selected: _sort == value,
                onSelected: (_) => setState(() => _sort = value),
              ),
          ],
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _field,
          textInputAction: TextInputAction.search,
          onSubmitted: (value) => setState(() => _search = value.trim()),
          decoration: InputDecoration(
            hintText: 'Search posts',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: _search.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Clear search',
                    onPressed: () => setState(() {
                      _field.clear();
                      _search = '';
                    }),
                    icon: const Icon(Icons.close_rounded),
                  ),
          ),
        ),
        const SizedBox(height: 12),
        switch (threads) {
          AsyncData(value: final list) when list.isEmpty => Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              _search.isNotEmpty
                  ? 'No posts match your search.'
                  : 'Nothing here yet. Be the first to start a conversation.',
              textAlign: TextAlign.center,
            ),
          ),
          AsyncData(value: final list) => Column(
            children: [
              for (final post in list) ...[
                PostCard(post: post),
                const SizedBox(height: 10),
              ],
            ],
          ),
          AsyncError(:final error) => Notice(
            message: communityError(error),
            danger: true,
            action: 'Try again',
            onAction: () => ref.invalidate(communityThreadsProvider),
          ),
          _ => const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
        },
      ],
    );
  }
}

class SpaceScreen extends StatelessWidget {
  const SpaceScreen({super.key, required this.spaceId});
  final String spaceId;

  @override
  Widget build(BuildContext context) {
    final style = spaceStyle[spaceId];
    final meetups = spaceId == 'meetups';
    return Scaffold(
      appBar: AppBar(title: Text(style?.$4 ?? 'Community')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(
          '/community/new?space=$spaceId${meetups ? '&kind=meetup' : ''}',
        ),
        icon: const Icon(Icons.edit_rounded),
        label: Text(meetups ? 'Plan a meetup' : 'New post'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
        children: [PageBody(child: ThreadList(space: spaceId))],
      ),
    );
  }
}

/// Write a discussion, a question or a meetup.
class NewPostScreen extends ConsumerStatefulWidget {
  const NewPostScreen({super.key, this.space, this.kind});
  final String? space;
  final String? kind;

  @override
  ConsumerState<NewPostScreen> createState() => _NewPostScreenState();
}

class _NewPostScreenState extends ConsumerState<NewPostScreen> {
  late CommunityKind _kind = switch (widget.kind) {
    'meetup' => CommunityKind.meetup,
    'question' => CommunityKind.question,
    _ => CommunityKind.discussion,
  };
  late String _space =
      spaceStyle.containsKey(widget.space) && widget.space != 'meetups'
      ? widget.space!
      : 'everyday';
  final _title = TextEditingController();
  final _body = TextEditingController();
  final _place = TextEditingController();
  final _city = TextEditingController();
  CommunityInput _input = CommunityInput.typed;
  late DateTime _start = _tomorrowAtTen();
  Duration _length = const Duration(hours: 2);
  bool _busy = false;
  String? _error;

  static DateTime _tomorrowAtTen() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day + 1, 10);
  }

  @override
  void initState() {
    super.initState();
    _city.text = ref.read(communityMeProvider).value?.city ?? '';
  }

  @override
  void dispose() {
    for (final c in [_title, _body, _place, _city]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final day = await showDatePicker(
      context: context,
      initialDate: _start.isBefore(now) ? now : _start,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 180)),
    );
    if (day != null) {
      setState(
        () => _start = DateTime(
          day.year,
          day.month,
          day.day,
          _start.hour,
          _start.minute,
        ),
      );
    }
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_start),
    );
    if (time != null) {
      setState(
        () => _start = DateTime(
          _start.year,
          _start.month,
          _start.day,
          time.hour,
          time.minute,
        ),
      );
    }
  }

  Future<void> _post() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ensureSignedIn();
      final meetup = _kind == CommunityKind.meetup;
      final post = await client.community.createThread(
        meetup ? 'meetups' : _space,
        _kind,
        _title.text,
        _body.text,
        _input,
        meetup ? _place.text : null,
        meetup ? _city.text : null,
        meetup ? _start.toUtc() : null,
        meetup ? _start.add(_length).toUtc() : null,
      );
      ref.invalidate(communityThreadsProvider);
      ref.invalidate(communitySpacesProvider);
      if (mounted) context.pushReplacement('/community/t/${post.id}');
    } catch (e) {
      if (isOffline(e) && _title.text.trim().length >= 4) {
        final meetup = _kind == CommunityKind.meetup;
        await ref
            .read(communityOutboxProvider.notifier)
            .add(
              PendingPost(
                id: pendingId(),
                kind: 'post',
                space: meetup ? 'meetups' : _space,
                postKind: _kind,
                title: _title.text.trim(),
                body: _body.text.trim(),
                input: _input,
                place: meetup ? _place.text.trim() : null,
                city: meetup ? _city.text.trim() : null,
                startsAt: meetup ? _start.toUtc() : null,
                endsAt: meetup ? _start.add(_length).toUtc() : null,
              ),
            );
        if (mounted) {
          toast(
            context,
            "You're offline. Saved on this phone; it will be posted when you're back online.",
          );
          context.pop();
        }
      } else if (mounted) {
        setState(() => _error = communityError(e));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final me = ref.watch(communityMeProvider);
    final meetup = _kind == CommunityKind.meetup;
    final local = MaterialLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(meetup ? 'Plan a meetup' : 'New post')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        children: [
          PageBody(
            child: me.value == null
                ? (me.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : const JoinCard())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SegmentedButton<CommunityKind>(
                        showSelectedIcon: false,
                        segments: const [
                          ButtonSegment(
                            value: CommunityKind.discussion,
                            label: Text('Discussion'),
                          ),
                          ButtonSegment(
                            value: CommunityKind.question,
                            label: Text('Question'),
                          ),
                          ButtonSegment(
                            value: CommunityKind.meetup,
                            label: Text('Meetup'),
                          ),
                        ],
                        selected: {_kind},
                        onSelectionChanged: (value) =>
                            setState(() => _kind = value.first),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        switch (_kind) {
                          CommunityKind.discussion =>
                            'Share an experience or start a conversation. Long posts are welcome.',
                          CommunityKind.question =>
                            'Ask something specific. You can mark the reply that helped as the answer.',
                          CommunityKind.meetup =>
                            'On the day you open a live room, and everyone there joins with your code.',
                        },
                        style: text.bodySmall?.copyWith(color: Brand.ink3),
                      ),
                      const SizedBox(height: 14),
                      if (!meetup) ...[
                        DropdownButtonFormField<String>(
                          initialValue: _space,
                          decoration: const InputDecoration(labelText: 'Space'),
                          items: [
                            for (final MapEntry(:key, :value)
                                in spaceStyle.entries)
                              if (key != 'meetups')
                                DropdownMenuItem(
                                  value: key,
                                  child: Text(value.$4),
                                ),
                          ],
                          onChanged: (value) =>
                              setState(() => _space = value ?? _space),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _title,
                        maxLength: 120,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          labelText: _kind == CommunityKind.question
                              ? 'Your question in one line'
                              : 'Title',
                        ),
                      ),
                      if (meetup) ...[
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              onPressed: _pickDate,
                              icon: const Icon(Icons.event_rounded),
                              label: Text(local.formatMediumDate(_start)),
                            ),
                            OutlinedButton.icon(
                              onPressed: _pickTime,
                              icon: const Icon(Icons.schedule_rounded),
                              label: Text(
                                local.formatTimeOfDay(
                                  TimeOfDay.fromDateTime(_start),
                                ),
                              ),
                            ),
                            DropdownButton<Duration>(
                              value: _length,
                              items: [
                                for (final h in [1, 2, 3, 4, 6])
                                  DropdownMenuItem(
                                    value: Duration(hours: h),
                                    child: Text('$h hour${h == 1 ? '' : 's'}'),
                                  ),
                              ],
                              onChanged: (value) =>
                                  setState(() => _length = value ?? _length),
                            ),
                            TextButton(
                              onPressed: () =>
                                  setState(() => _start = DateTime.now()),
                              child: const Text('Starting now'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _place,
                          maxLength: 80,
                          decoration: const InputDecoration(
                            labelText: 'Place',
                            hintText:
                                'A public place, e.g. a park gate or library',
                          ),
                        ),
                        TextField(
                          controller: _city,
                          maxLength: 40,
                          decoration: const InputDecoration(labelText: 'City'),
                        ),
                      ],
                      const SizedBox(height: 4),
                      PostBox(
                        controller: _body,
                        label: meetup ? 'Details (optional)' : 'Your post',
                        hint: meetup
                            ? 'Who is it for? Is it beginner-friendly?'
                            : 'Write as much as you need. Type, or tap Speak.',
                        maxLength: 4000,
                        minLines: meetup ? 2 : 6,
                        onInput: (input) => _input = input,
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 10),
                        Notice(message: _error!, danger: true),
                      ],
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _busy ? null : _post,
                        icon: const Icon(Icons.send_rounded),
                        label: Text(
                          _busy
                              ? 'Posting…'
                              : meetup
                              ? 'Post meetup'
                              : 'Post',
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Keep medical and contact details private.',
                        style: text.bodySmall?.copyWith(color: Brand.ink3),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

/// A thread: the post, its replies (live), and the meetup's live room for the host.
class ThreadScreen extends ConsumerStatefulWidget {
  const ThreadScreen({super.key, required this.threadId});
  final int threadId;

  @override
  ConsumerState<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends ConsumerState<ThreadScreen> {
  final _reply = TextEditingController();
  CommunityInput _input = CommunityInput.typed;
  CommunityReplyView? _quote;
  bool _busy = false;

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  ThreadController get _thread =>
      ref.read(communityThreadProvider(widget.threadId).notifier);

  Future<void> _run(Future<void> Function() action, [String? done]) async {
    try {
      await action();
      if (done != null && mounted) toast(context, done);
    } catch (e) {
      if (mounted) toast(context, communityError(e));
    }
  }

  Future<void> _send() async {
    if (_reply.text.trim().isEmpty) return;
    setState(() => _busy = true);
    void clear() {
      _reply.clear();
      setState(() {
        _quote = null;
        _input = CommunityInput.typed;
      });
    }

    try {
      await _thread.reply(_reply.text, _input, _quote?.id);
      clear();
      if (mounted) toast(context, 'Reply posted.');
    } catch (e) {
      if (isOffline(e)) {
        await ref
            .read(communityOutboxProvider.notifier)
            .add(
              PendingPost(
                id: pendingId(),
                kind: 'reply',
                threadId: widget.threadId,
                quoteId: _quote?.id,
                body: _reply.text.trim(),
                input: _input,
              ),
            );
        clear();
        if (mounted) {
          toast(
            context,
            "You're offline. Your reply will be posted when you're back online.",
          );
        }
      } else if (mounted) {
        toast(context, communityError(e));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final detail = ref.watch(communityThreadProvider(widget.threadId));
    final me = ref.watch(communityMeProvider).value;
    final removed = ref
        .watch(communityThreadProvider(widget.threadId).notifier)
        .removed;
    return Scaffold(
      appBar: AppBar(
        title: Text(spaceStyle[detail.value?.post.space]?.$4 ?? 'Community'),
      ),
      body: switch (detail) {
        AsyncError(:final error) when detail.value == null => Padding(
          padding: const EdgeInsets.all(20),
          child: Notice(
            message: communityError(error),
            danger: true,
            action: 'Try again',
            onAction: () =>
                ref.invalidate(communityThreadProvider(widget.threadId)),
          ),
        ),
        AsyncValue(value: final d?) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (removed)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: Notice(
                        message:
                            'This post was removed by its author or hidden after reports.',
                        danger: true,
                      ),
                    ),
                  Wrap(
                    spacing: 6,
                    children: [
                      if (d.post.kind == CommunityKind.question)
                        const Pill('Question'),
                      if (d.post.kind == CommunityKind.meetup)
                        const Pill('Meetup', background: Brand.voiceSoft),
                      if (d.post.answerId != null)
                        const Pill(
                          'Answered',
                          background: Color(0xFFD8EEDF),
                          icon: Icons.check_circle_rounded,
                        ),
                      if (d.post.hidden)
                        const Pill(
                          'Hidden after reports (only you see it)',
                          background: Brand.dangerSoft,
                          foreground: Brand.danger,
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(d.post.title, style: text.headlineSmall),
                  const SizedBox(height: 8),
                  AuthorLine(
                    author: d.post.author,
                    at: d.post.createdAt,
                    input: d.post.input,
                    edited: d.post.editedAt != null,
                  ),
                  if (d.post.meetup != null)
                    _MeetupPanel(post: d.post, thread: _thread, run: _run),
                  const SizedBox(height: 14),
                  SelectableText(
                    d.post.body,
                    style: text.bodyLarge?.copyWith(
                      fontSize: 18,
                      color: Brand.navy,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      SeeAndHear(text: '${d.post.title}. ${d.post.body}'),
                      _HelpfulButton(
                        count: d.post.helpful,
                        on: d.post.myHelpful,
                        enabled: me != null && !d.post.mine,
                        onToggle: (on) => _run(
                          () => _thread.helpful(
                            CommunityTarget.thread,
                            d.post.id,
                            on,
                          ),
                        ),
                      ),
                      if (d.post.mine)
                        TextButton.icon(
                          onPressed: () async {
                            if (!await confirm(
                              context,
                              'Delete this post?',
                              'The post and its replies disappear for everyone. This cannot be undone.',
                              'Delete',
                            )) {
                              return;
                            }
                            await _run(() async {
                              await _thread.deletePost();
                              ref.invalidate(communityThreadsProvider);
                              if (context.mounted) context.pop();
                            }, 'Post deleted.');
                          },
                          icon: const Icon(Icons.delete_outline_rounded),
                          label: const Text('Delete'),
                        )
                      else if (me != null)
                        TextButton.icon(
                          onPressed: () async {
                            final reason = await askReportReason(context);
                            if (reason == null) return;
                            await _run(
                              () => _thread.report(
                                CommunityTarget.thread,
                                d.post.id,
                                reason,
                              ),
                              'Thank you. It is hidden once a few people report it.',
                            );
                          },
                          icon: const Icon(Icons.flag_outlined),
                          label: const Text('Report'),
                        ),
                    ],
                  ),
                  SectionTitle(
                    d.replies.isEmpty
                        ? 'No replies yet'
                        : d.replies.length == 1
                        ? '1 reply'
                        : '${d.replies.length} replies',
                  ),
                  for (final reply in d.replies) ...[
                    _ReplyTile(
                      reply: reply,
                      quoted: d.replies
                          .where((r) => r.id == reply.quoteId)
                          .firstOrNull,
                      isAnswer: reply.id == d.post.answerId,
                      canAnswer:
                          d.post.mine &&
                          d.post.kind == CommunityKind.question &&
                          !reply.mine,
                      signedIn: me != null,
                      onQuote: () => setState(() => _quote = reply),
                      onHelpful: (on) => _run(
                        () => _thread.helpful(
                          CommunityTarget.reply,
                          reply.id,
                          on,
                        ),
                      ),
                      onAnswer: (on) => _run(
                        () => _thread.answer(on ? reply.id : null),
                        on ? 'Marked as the answer.' : 'Answer removed.',
                      ),
                      onDelete: () async {
                        if (!await confirm(
                          context,
                          'Delete this reply?',
                          'It disappears for everyone. This cannot be undone.',
                          'Delete',
                        )) {
                          return;
                        }
                        await _run(() => _thread.deleteReply(reply.id));
                      },
                      onReport: () async {
                        final reason = await askReportReason(context);
                        if (reason == null) return;
                        await _run(
                          () => _thread.report(
                            CommunityTarget.reply,
                            reply.id,
                            reason,
                          ),
                          'Thank you for reporting.',
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                  ],
                  for (final waiting
                      in ref
                          .watch(communityOutboxProvider)
                          .pending
                          .where(
                            (p) => p.isReply && p.threadId == widget.threadId,
                          )) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: Brand.paper,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Brand.lineStrong),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Pill(
                            'Waiting to send',
                            background: Brand.sunSoft,
                            foreground: Brand.sunDeep,
                            icon: Icons.schedule_rounded,
                          ),
                          const SizedBox(height: 6),
                          Text(waiting.body, style: text.bodyLarge),
                        ],
                      ),
                    ),
                  ],
                  const SectionTitle('Your reply'),
                  if (me == null)
                    const JoinCard()
                  else ...[
                    if (_quote != null)
                      Container(
                        padding: const EdgeInsets.fromLTRB(12, 6, 4, 6),
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: Brand.paper,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Replying to ${_quote!.author.handle}: ${_quote!.body}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              tooltip: 'Cancel reply to',
                              onPressed: () => setState(() => _quote = null),
                              icon: const Icon(Icons.close_rounded),
                            ),
                          ],
                        ),
                      ),
                    PostBox(
                      controller: _reply,
                      label: 'Write a reply',
                      hint: 'Share what worked for you.',
                      onInput: (i) => _input = i,
                    ),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      onPressed: _busy ? null : _send,
                      icon: const Icon(Icons.send_rounded),
                      label: Text(_busy ? 'Posting…' : 'Post reply'),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}

class _HelpfulButton extends StatelessWidget {
  const _HelpfulButton({
    required this.count,
    required this.on,
    required this.enabled,
    required this.onToggle,
  });
  final int count;
  final bool on;
  final bool enabled;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    final label = Text('Helpful${count > 0 ? ' · $count' : ''}');
    final icon = Icon(
      on ? Icons.thumb_up_alt_rounded : Icons.thumb_up_alt_outlined,
      size: 18,
    );
    return Semantics(
      toggled: on,
      child: on
          ? FilledButton.icon(
              onPressed: enabled ? () => onToggle(false) : null,
              icon: icon,
              label: label,
            )
          : OutlinedButton.icon(
              onPressed: enabled ? () => onToggle(true) : null,
              icon: icon,
              label: label,
            ),
    );
  }
}

class _ReplyTile extends StatelessWidget {
  const _ReplyTile({
    required this.reply,
    required this.quoted,
    required this.isAnswer,
    required this.canAnswer,
    required this.signedIn,
    required this.onQuote,
    required this.onHelpful,
    required this.onAnswer,
    required this.onDelete,
    required this.onReport,
  });
  final CommunityReplyView reply;
  final CommunityReplyView? quoted;
  final bool isAnswer;
  final bool canAnswer;
  final bool signedIn;
  final VoidCallback onQuote;
  final ValueChanged<bool> onHelpful;
  final ValueChanged<bool> onAnswer;
  final VoidCallback onDelete;
  final VoidCallback onReport;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isAnswer ? const Color(0xFF2F7D5B) : Brand.line,
          width: isAnswer ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isAnswer) ...[
            const Pill(
              'Answer',
              background: Color(0xFFD8EEDF),
              icon: Icons.check_circle_rounded,
            ),
            const SizedBox(height: 6),
          ],
          AuthorLine(
            author: reply.author,
            at: reply.createdAt,
            input: reply.input,
            edited: reply.editedAt != null,
          ),
          if (quoted != null)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: const BoxDecoration(
                color: Brand.paper,
                border: Border(left: BorderSide(color: Brand.royal, width: 3)),
              ),
              child: Text(
                '${quoted!.author.handle}: ${quoted!.body}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          const SizedBox(height: 8),
          SelectableText(
            reply.body,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: Brand.navy, fontSize: 17),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: [
              SeeAndHear(text: reply.body),
              _HelpfulButton(
                count: reply.helpful,
                on: reply.myHelpful,
                enabled: signedIn && !reply.mine,
                onToggle: onHelpful,
              ),
              if (signedIn)
                TextButton.icon(
                  onPressed: onQuote,
                  icon: const Icon(Icons.reply_rounded),
                  label: const Text('Reply to this'),
                ),
              if (canAnswer)
                TextButton.icon(
                  onPressed: () => onAnswer(!isAnswer),
                  icon: Icon(
                    isAnswer
                        ? Icons.check_circle_rounded
                        : Icons.check_circle_outline_rounded,
                  ),
                  label: Text(isAnswer ? 'The answer' : 'Mark as answer'),
                ),
              if (reply.mine)
                TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline_rounded),
                  label: const Text('Delete'),
                )
              else if (signedIn)
                TextButton.icon(
                  onPressed: onReport,
                  icon: const Icon(Icons.flag_outlined),
                  label: const Text('Report'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// When and where, who is going, and the live room (the host shows its code).
class _MeetupPanel extends ConsumerWidget {
  const _MeetupPanel({
    required this.post,
    required this.thread,
    required this.run,
  });
  final CommunityPost post;
  final ThreadController thread;
  final Future<void> Function(Future<void> Function() action, [String? done])
  run;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final meetup = post.meetup!;
    final now = DateTime.now().toUtc();
    final ended = !now.isBefore(meetup.endsAt);
    final opensSoon = now.isBefore(
      meetup.startsAt.subtract(const Duration(hours: 1)),
    );
    final me = ref.watch(communityMeProvider).value;
    final app = ref.watch(servicesProvider).value?.app;
    final code = meetup.code;
    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Brand.voiceSoft,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(meetupWhen(meetup), style: text.titleMedium),
          const SizedBox(height: 4),
          Text(
            '${meetup.place}, ${meetup.city}',
            style: text.bodyLarge?.copyWith(color: Brand.navy),
          ),
          Text('${meetup.going} going', style: text.bodyMedium),
          const SizedBox(height: 10),
          if (ended)
            const Pill('This meetup has ended', background: Brand.paper)
          else ...[
            if (me != null && !post.mine)
              meetup.imGoing
                  ? FilledButton(
                      onPressed: () => run(() => thread.going(false)),
                      child: const Text("You're going"),
                    )
                  : OutlinedButton(
                      onPressed: () => run(() => thread.going(true)),
                      child: const Text("I'm going"),
                    ),
            if (meetup.live && !post.mine) ...[
              const SizedBox(height: 8),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Brand.voice,
                  foregroundColor: Brand.navy,
                ),
                onPressed: () => context.push('/community/live'),
                icon: const Icon(Icons.podcasts_rounded),
                label: const Text("Live now: enter the host's code"),
              ),
            ],
            if (post.mine && meetup.live && code != null) ...[
              Center(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: QrImageView(
                    data: app == null
                        ? code
                        : app
                              .replace(fragment: '/community/live/$code')
                              .toString(),
                    size: 190,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Brand.navy,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Brand.navy,
                    ),
                    semanticsLabel:
                        'QR code to join the live room, code ${formatCode(code)}',
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(child: Text('Live room code', style: text.bodySmall)),
              Center(
                child: SelectableText(
                  formatCode(code),
                  style: text.displaySmall?.copyWith(letterSpacing: 4),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Show this at the meetup. People scan it or type the code. Messages are deleted when the meetup ends.',
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: [
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: Brand.voice,
                      foregroundColor: Brand.navy,
                    ),
                    onPressed: () => context.push('/community/live/$code'),
                    icon: const Icon(Icons.podcasts_rounded),
                    label: const Text('Open live room'),
                  ),
                  TextButton(
                    onPressed: () async {
                      if (!await confirm(
                        context,
                        'End the live room?',
                        'Everyone in it is told it has ended, and its messages are deleted.',
                        'End',
                      )) {
                        return;
                      }
                      await run(thread.endLive, 'Live room ended.');
                    },
                    child: const Text('End live room'),
                  ),
                ],
              ),
            ] else if (post.mine) ...[
              Text(
                opensSoon
                    ? 'You can open the live room from an hour before the start.'
                    : 'When people arrive, open the live room. Everyone there joins with your code.',
              ),
              const SizedBox(height: 8),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Brand.voice,
                  foregroundColor: Brand.navy,
                ),
                onPressed: opensSoon ? null : () => run(thread.startLive),
                icon: const Icon(Icons.podcasts_rounded),
                label: const Text('Open live room'),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
