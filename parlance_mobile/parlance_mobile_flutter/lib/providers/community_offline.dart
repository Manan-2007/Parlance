import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/client.dart';
import '../core/session.dart';

/// Community without internet: the posts you last saw are kept on this phone
/// to read, and posts and replies you write are kept in an outbox and sent, in
/// order, when the connection comes back.
///
/// A [CommunityException] is the server saying no (it reached it), so it is
/// never treated as "offline".
bool isOffline(Object error) => error is! CommunityException;

const _cachePrefix = 'community.saved.';
const _outboxKey = 'community.outbox.v1';

/// Whether the Community screens are showing saved posts right now.
class CommunityOfflineFlag extends Notifier<bool> {
  @override
  bool build() => false;

  void set(bool offline) {
    if (state != offline) state = offline;
  }
}

final communityOfflineProvider = NotifierProvider<CommunityOfflineFlag, bool>(
  CommunityOfflineFlag.new,
);

/// Fetches with [fetch]; saves what arrives under [key]; without internet,
/// returns what was saved last time (or fails if nothing was).
Future<T> savedOrFetch<T>(
  Ref ref,
  String key,
  Future<T> Function() fetch,
  Object? Function(T value) encode,
  T Function(Object? json) decode,
) async {
  try {
    final value = await fetch();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_cachePrefix$key', jsonEncode(encode(value)));
    } catch (error) {
      debugPrint('Community: could not save $key: $error');
    }
    ref.read(communityOfflineProvider.notifier).set(false);
    unawaited(ref.read(communityOutboxProvider.notifier).flush());
    return value;
  } catch (error) {
    if (!isOffline(error)) rethrow;
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('$_cachePrefix$key');
    if (saved == null) rethrow;
    ref.read(communityOfflineProvider.notifier).set(true);
    return decode(jsonDecode(saved));
  }
}

/// Something written without internet, waiting to be sent.
class PendingPost {
  const PendingPost({
    required this.id,
    required this.kind,
    required this.body,
    required this.input,
    this.threadId,
    this.quoteId,
    this.space,
    this.postKind,
    this.title,
    this.place,
    this.city,
    this.startsAt,
    this.endsAt,
  });

  /// 'reply' or 'post'.
  final String kind;
  final int id;
  final String body;
  final CommunityInput input;
  final int? threadId;
  final int? quoteId;
  final String? space;
  final CommunityKind? postKind;
  final String? title;
  final String? place;
  final String? city;
  final DateTime? startsAt;
  final DateTime? endsAt;

  bool get isReply => kind == 'reply';

  Map<String, Object?> toJson() => {
    'id': id,
    'kind': kind,
    'body': body,
    'input': input.name,
    'threadId': threadId,
    'quoteId': quoteId,
    'space': space,
    'postKind': postKind?.name,
    'title': title,
    'place': place,
    'city': city,
    'startsAt': startsAt?.toUtc().toIso8601String(),
    'endsAt': endsAt?.toUtc().toIso8601String(),
  };

  factory PendingPost.fromJson(Map<String, Object?> j) => PendingPost(
    id: j['id'] as int,
    kind: j['kind'] as String,
    body: j['body'] as String,
    input: CommunityInput.values.byName(j['input'] as String),
    threadId: j['threadId'] as int?,
    quoteId: j['quoteId'] as int?,
    space: j['space'] as String?,
    postKind: j['postKind'] == null
        ? null
        : CommunityKind.values.byName(j['postKind'] as String),
    title: j['title'] as String?,
    place: j['place'] as String?,
    city: j['city'] as String?,
    startsAt: j['startsAt'] == null
        ? null
        : DateTime.parse(j['startsAt'] as String),
    endsAt: j['endsAt'] == null ? null : DateTime.parse(j['endsAt'] as String),
  );
}

class OutboxState {
  const OutboxState({
    this.pending = const [],
    this.problems = const [],
    this.sent = 0,
  });

  final List<PendingPost> pending;

  /// Posts the server refused when they were finally sent (with its reason).
  final List<String> problems;

  /// How many were sent since the app started (to refresh lists).
  final int sent;
}

/// Posts and replies written without internet, sent when it comes back.
class CommunityOutbox extends Notifier<OutboxState> {
  Timer? _timer;
  bool _flushing = false;

  @override
  OutboxState build() {
    ref.onDispose(() => _timer?.cancel());
    unawaited(_load());
    return const OutboxState();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_outboxKey);
    if (raw == null) return;
    final pending = [
      for (final item in jsonDecode(raw) as List)
        PendingPost.fromJson((item as Map).cast<String, Object?>()),
    ];
    state = OutboxState(
      pending: pending,
      problems: state.problems,
      sent: state.sent,
    );
    _schedule();
  }

  Future<void> _save(List<PendingPost> pending) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _outboxKey,
      jsonEncode([for (final p in pending) p.toJson()]),
    );
  }

  Future<void> add(PendingPost post) async {
    final pending = [...state.pending, post];
    state = OutboxState(
      pending: pending,
      problems: state.problems,
      sent: state.sent,
    );
    await _save(pending);
    _schedule();
  }

  void dismissProblems() =>
      state = OutboxState(pending: state.pending, sent: state.sent);

  /// Tries again every 30 seconds while something is waiting.
  void _schedule() {
    _timer?.cancel();
    if (state.pending.isEmpty) return;
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => flush());
  }

  /// Sends what is waiting, oldest first; stops at the first sign of no internet.
  Future<void> flush() async {
    if (_flushing || state.pending.isEmpty) return;
    _flushing = true;
    try {
      await ensureSignedIn();
      while (state.pending.isNotEmpty) {
        final next = state.pending.first;
        String? problem;
        try {
          if (next.isReply) {
            await client.community.reply(
              next.threadId!,
              next.body,
              next.input,
              next.quoteId,
            );
          } else {
            await client.community.createThread(
              next.space!,
              next.postKind!,
              next.title!,
              next.body,
              next.input,
              next.place,
              next.city,
              next.startsAt,
              next.endsAt,
            );
          }
        } on CommunityException catch (e) {
          problem =
              '"${_short(next.title ?? next.body)}" was not posted: ${e.message}';
        }
        final rest = state.pending.skip(1).toList();
        state = OutboxState(
          pending: rest,
          problems: [...state.problems, ?problem],
          sent: state.sent + (problem == null ? 1 : 0),
        );
        await _save(rest);
      }
    } catch (_) {
      // Still offline: keep everything for the next try.
    } finally {
      _flushing = false;
      _schedule();
    }
  }

  static String _short(String text) =>
      text.length > 40 ? '${text.substring(0, 40)}…' : text;
}

final communityOutboxProvider = NotifierProvider<CommunityOutbox, OutboxState>(
  CommunityOutbox.new,
);

/// A fresh id for a pending post (the time it was written).
int pendingId() => DateTime.now().microsecondsSinceEpoch;
