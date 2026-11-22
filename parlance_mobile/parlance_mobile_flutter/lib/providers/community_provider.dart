import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../core/client.dart';
import '../core/session.dart';

/// A message the person can act on, for any Community error.
String communityError(Object error) {
  if (error is CommunityException) return error.message;
  return 'Could not reach Parlance. Check your internet connection and try again.';
}

/// You in the Community: null until you choose a name.
class CommunityMeController extends AsyncNotifier<CommunityAuthor?> {
  @override
  Future<CommunityAuthor?> build() async {
    await ensureSignedIn();
    return client.community.me();
  }

  Future<void> join(String handle, String city, List<String> ways) async {
    await ensureSignedIn();
    final me = await client.community.join(handle, city, ways);
    state = AsyncData(me);
  }
}

final communityMeProvider =
    AsyncNotifierProvider<CommunityMeController, CommunityAuthor?>(
      CommunityMeController.new,
    );

final communitySpacesProvider =
    FutureProvider.autoDispose<List<CommunitySpace>>((ref) async {
      await ensureSignedIn();
      return client.community.listSpaces();
    });

/// Which threads to list.
typedef ThreadQuery = ({String? space, String sort, String search});

final communityThreadsProvider = FutureProvider.autoDispose
    .family<List<CommunityPost>, ThreadQuery>((ref, query) async {
      await ensureSignedIn();
      return client.community.threads(query.space, query.sort, query.search, 0);
    });

/// One thread with its replies, kept up to date while it is open.
class ThreadController extends AsyncNotifier<CommunityThreadDetail> {
  ThreadController(this.threadId);
  final int threadId;

  StreamSubscription<CommunityEvent>? _events;
  Timer? _retry;

  /// Set when the post was deleted or hidden while it was open.
  bool removed = false;

  @override
  Future<CommunityThreadDetail> build() async {
    ref.onDispose(() {
      _events?.cancel();
      _retry?.cancel();
    });
    await ensureSignedIn();
    final detail = await client.community.thread(threadId);
    _listen();
    return detail;
  }

  void _listen() {
    _events?.cancel();
    _events = client.community
        .listenThread(threadId)
        .listen(
          _handle,
          onError: (_) => _reconnect(),
          onDone: _reconnect,
        );
  }

  void _reconnect() {
    _retry?.cancel();
    if (removed) return;
    _retry = Timer(const Duration(seconds: 3), () async {
      try {
        final detail = await client.community.thread(threadId);
        state = AsyncData(detail);
        _listen();
      } catch (_) {
        _reconnect();
      }
    });
  }

  CommunityThreadDetail? get _now => state.value;

  void _set(CommunityThreadDetail detail) => state = AsyncData(detail);

  void _handle(CommunityEvent event) {
    final now = _now;
    if (now == null) return;
    switch (event.kind) {
      case CommunityEventKind.reply:
        final reply = event.reply!;
        if (now.replies.any((r) => r.id == reply.id)) return;
        _set(
          now.copyWith(
            replies: [...now.replies, reply],
            post: now.post.copyWith(replyCount: now.post.replyCount + 1),
          ),
        );
      case CommunityEventKind.replyUpdated:
        final reply = event.reply!;
        _set(
          now.copyWith(
            replies: [
              for (final r in now.replies)
                r.id == reply.id
                    ? reply.copyWith(mine: r.mine, myHelpful: r.myHelpful)
                    : r,
            ],
          ),
        );
      case CommunityEventKind.replyRemoved:
        _removeReply(event.targetId!);
      case CommunityEventKind.postUpdated:
        final post = event.post!;
        // Keep this viewer's own flags; the broadcast copy is the public view.
        final meetup = post.meetup == null || now.post.meetup == null
            ? post.meetup
            : post.meetup!.copyWith(
                code: now.post.meetup!.code,
                imGoing: now.post.meetup!.imGoing,
              );
        _set(
          now.copyWith(
            post: post.copyWith(
              mine: now.post.mine,
              myHelpful: now.post.myHelpful,
              meetup: meetup,
            ),
          ),
        );
      case CommunityEventKind.postRemoved:
        removed = true;
        _set(now.copyWith());
      case CommunityEventKind.helpful:
        final id = event.targetId!;
        final count = event.count ?? 0;
        if (id == now.post.id) {
          _set(now.copyWith(post: now.post.copyWith(helpful: count)));
        } else {
          _set(
            now.copyWith(
              replies: [
                for (final r in now.replies)
                  r.id == id ? r.copyWith(helpful: count) : r,
              ],
            ),
          );
        }
      case CommunityEventKind.liveMessage:
      case CommunityEventKind.liveEnded:
        break;
    }
  }

  void _removeReply(int id) {
    final now = _now;
    if (now == null || !now.replies.any((r) => r.id == id)) return;
    _set(
      now.copyWith(
        replies: [
          for (final r in now.replies)
            if (r.id != id) r,
        ],
        post: now.post.copyWith(
          replyCount: now.post.replyCount > 0 ? now.post.replyCount - 1 : 0,
          answerId: now.post.answerId == id ? null : now.post.answerId,
        ),
      ),
    );
  }

  Future<void> reply(String body, CommunityInput input, int? quoteId) async {
    final sent = await client.community.reply(threadId, body, input, quoteId);
    _handle(CommunityEvent(kind: CommunityEventKind.reply, reply: sent));
    // The broadcast copy has mine = false; keep ours.
    final now = _now;
    if (now != null) {
      _set(
        now.copyWith(
          replies: [for (final r in now.replies) r.id == sent.id ? sent : r],
        ),
      );
    }
  }

  Future<void> helpful(CommunityTarget target, int id, bool on) async {
    final count = await client.community.setHelpful(target, id, on);
    final now = _now;
    if (now == null) return;
    if (target == CommunityTarget.thread) {
      _set(
        now.copyWith(
          post: now.post.copyWith(helpful: count, myHelpful: on),
        ),
      );
    } else {
      _set(
        now.copyWith(
          replies: [
            for (final r in now.replies)
              r.id == id ? r.copyWith(helpful: count, myHelpful: on) : r,
          ],
        ),
      );
    }
  }

  Future<bool> report(CommunityTarget target, int id, String reason) async {
    final hidden = await client.community.report(target, id, reason);
    if (hidden && target == CommunityTarget.reply) _removeReply(id);
    if (hidden && target == CommunityTarget.thread) removed = true;
    return hidden;
  }

  Future<void> answer(int? replyId) =>
      _post(() => client.community.setAnswer(threadId, replyId));

  Future<void> going(bool on) =>
      _post(() => client.community.setGoing(threadId, on));

  Future<void> startLive() => _post(() => client.community.startLive(threadId));

  Future<void> endLive() async {
    await client.community.endLive(threadId);
    final now = _now;
    if (now?.post.meetup == null) return;
    _set(
      now!.copyWith(
        post: now.post.copyWith(
          meetup: now.post.meetup!.copyWith(live: false, code: null),
        ),
      ),
    );
  }

  Future<void> deleteReply(int id) async {
    await client.community.deleteReply(id);
    _removeReply(id);
  }

  Future<void> deletePost() async {
    await client.community.deleteThread(threadId);
    removed = true;
  }

  Future<void> _post(Future<CommunityPost> Function() action) async {
    final post = await action();
    final now = _now;
    if (now != null) _set(now.copyWith(post: post));
  }
}

final communityThreadProvider = AsyncNotifierProvider.autoDispose
    .family<ThreadController, CommunityThreadDetail, int>(
      ThreadController.new,
    );

/// A meetup's live room, with messages arriving as they are sent.
class LiveRoomState {
  const LiveRoomState({
    required this.room,
    this.messages = const [],
    this.ended = false,
  });
  final CommunityLiveRoom room;
  final List<CommunityLiveMessageView> messages;
  final bool ended;

  LiveRoomState copyWith({
    List<CommunityLiveMessageView>? messages,
    bool? ended,
  }) => LiveRoomState(
    room: room,
    messages: messages ?? this.messages,
    ended: ended ?? this.ended,
  );
}

class LiveRoomController extends AsyncNotifier<LiveRoomState> {
  LiveRoomController(this.code);
  final String code;

  StreamSubscription<CommunityEvent>? _events;
  Timer? _retry;
  Timer? _end;

  @override
  Future<LiveRoomState> build() async {
    ref.onDispose(() {
      _events?.cancel();
      _retry?.cancel();
      _end?.cancel();
    });
    await ensureSignedIn();
    final room = await client.community.live(code);
    _listen();
    final left = room.endsAt.difference(DateTime.now().toUtc());
    _end = Timer(left.isNegative ? Duration.zero : left, _ended);
    return LiveRoomState(room: room, messages: room.messages);
  }

  void _listen() {
    _events?.cancel();
    _events = client.community
        .listenLive(code)
        .listen(
          (event) {
            final now = state.value;
            if (now == null) return;
            if (event.kind == CommunityEventKind.liveMessage) {
              final message = event.message!;
              if (now.messages.any((m) => m.id == message.id)) return;
              state = AsyncData(
                now.copyWith(messages: [...now.messages, message]),
              );
            } else if (event.kind == CommunityEventKind.liveEnded) {
              _ended();
            }
          },
          onError: (Object error) {
            if (error is CommunityException) {
              _ended();
            } else {
              _reconnect();
            }
          },
          onDone: _reconnect,
        );
  }

  void _reconnect() {
    _retry?.cancel();
    if (state.value?.ended ?? false) return;
    _retry = Timer(const Duration(seconds: 3), () async {
      try {
        final room = await client.community.live(code);
        final now = state.value;
        state = AsyncData(
          now == null
              ? LiveRoomState(room: room, messages: room.messages)
              : now.copyWith(messages: room.messages),
        );
        _listen();
      } on CommunityException {
        _ended();
      } catch (_) {
        _reconnect();
      }
    });
  }

  void _ended() {
    _events?.cancel();
    final now = state.value;
    if (now != null) state = AsyncData(now.copyWith(ended: true));
  }

  Future<void> say(String text, CommunityInput input) async {
    final sent = await client.community.sayLive(code, text, input);
    final now = state.value;
    if (now == null || now.messages.any((m) => m.id == sent.id)) return;
    state = AsyncData(now.copyWith(messages: [...now.messages, sent]));
  }
}

final communityLiveProvider = AsyncNotifierProvider.autoDispose
    .family<LiveRoomController, LiveRoomState, String>(
      LiveRoomController.new,
    );
