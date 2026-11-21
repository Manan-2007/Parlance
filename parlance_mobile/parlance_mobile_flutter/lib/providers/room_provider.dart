import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../core/client.dart';
import '../core/session.dart';

enum RoomStatus { none, connecting, live, reconnecting, ended }

class RoomState {
  const RoomState({
    this.status = RoomStatus.none,
    this.room,
    this.me,
    this.members = const [],
    this.messages = const [],
    this.live = const {},
    this.error,
  });

  final RoomStatus status;
  final Room? room;
  final RoomMember? me;
  final List<RoomMember> members;
  final List<Utterance> messages;

  /// Words another phone is still signing or speaking, by member id.
  final Map<int, String> live;

  /// Something the person should know (and can act on).
  final String? error;

  bool get active => room != null && status != RoomStatus.ended;
  List<RoomMember> get others => [
    for (final m in members)
      if (m.id != me?.id) m,
  ];
  RoomMember? memberById(int id) =>
      members.where((m) => m.id == id).firstOrNull;

  RoomState copyWith({
    RoomStatus? status,
    Room? room,
    RoomMember? me,
    List<RoomMember>? members,
    List<Utterance>? messages,
    Map<int, String>? live,
    String? error,
    bool clearError = false,
  }) => RoomState(
    status: status ?? this.status,
    room: room ?? this.room,
    me: me ?? this.me,
    members: members ?? this.members,
    messages: messages ?? this.messages,
    live: live ?? this.live,
    error: clearError ? null : (error ?? this.error),
  );
}

/// The conversation this phone is in: starting, joining, sending, and the live
/// stream of everything said, with automatic reconnection when signal drops.
class RoomController extends Notifier<RoomState> {
  StreamSubscription<RoomEvent>? _events;
  Timer? _retry;
  int _attempt = 0;
  String? _liveSent;
  Timer? _liveTimer;
  String? _livePending;

  @override
  RoomState build() {
    ref.onDispose(_stop);
    return const RoomState();
  }

  Future<void> start(MemberRole role, String name) async {
    state = const RoomState(status: RoomStatus.connecting);
    try {
      await ensureSignedIn();
      _enter(await client.room.create(role, name));
    } catch (error) {
      state = RoomState(error: _message(error));
      rethrow;
    }
  }

  Future<void> join(String code, MemberRole role, String name) async {
    state = const RoomState(status: RoomStatus.connecting);
    try {
      await ensureSignedIn();
      _enter(await client.room.join(code, role, name));
    } catch (error) {
      state = RoomState(error: _message(error));
      rethrow;
    }
  }

  /// Sends a finished message to everyone in the room.
  Future<void> say(UtteranceKind kind, String text, {String? hindi}) async {
    final room = state.room;
    if (room == null || text.trim().isEmpty) return;
    clearLive();
    try {
      final sent = await client.room.say(room.id!, kind, text, hindi);
      _add(sent);
    } catch (error) {
      state = state.copyWith(error: _message(error));
    }
  }

  /// Shares words still in progress. Sent at most about four times a second.
  void live(String text) {
    _livePending = text;
    _liveTimer ??= Timer(const Duration(milliseconds: 250), () {
      _liveTimer = null;
      final pending = _livePending;
      final room = state.room;
      if (pending == null || room == null || pending == _liveSent) return;
      _liveSent = pending;
      unawaited(client.room.live(room.id!, pending).catchError((_) {}));
    });
  }

  void clearLive() {
    _liveTimer?.cancel();
    _liveTimer = null;
    _livePending = null;
    final room = state.room;
    if (room != null && (_liveSent ?? '').isNotEmpty) {
      unawaited(client.room.live(room.id!, '').catchError((_) {}));
    }
    _liveSent = '';
  }

  void dismissError() => state = state.copyWith(clearError: true);

  /// Leaves the room. The person who started it ends it for everyone.
  Future<void> leave() async {
    final room = state.room;
    final host =
        state.me != null && state.me!.id == state.members.firstOrNull?.id;
    _stop();
    state = const RoomState();
    if (room == null) return;
    try {
      if (host) {
        await client.room.close(room.id!);
      } else {
        await client.room.leave(room.id!);
      }
    } catch (_) {
      // Leaving is best effort; the room expires on its own.
    }
  }

  void _enter(RoomInfo info) {
    state = RoomState(
      status: RoomStatus.connecting,
      room: info.room,
      me: info.me,
      members: info.members,
      messages: info.history,
    );
    _listen();
  }

  void _listen() {
    final room = state.room;
    if (room == null) return;
    _events?.cancel();
    _events = client.room
        .listen(room.id!)
        .listen(
          (event) {
            _attempt = 0;
            if (state.status != RoomStatus.live) {
              state = state.copyWith(status: RoomStatus.live, clearError: true);
            }
            _handle(event);
          },
          onError: (Object error) => _lost(error),
          onDone: () => _lost(null),
        );
    // The stream sends nothing until something happens, so count it as live
    // once it has opened without an error.
    Future<void>.delayed(const Duration(milliseconds: 600), () {
      if (state.room?.id == room.id && state.status == RoomStatus.connecting) {
        state = state.copyWith(status: RoomStatus.live);
      }
    });
  }

  void _handle(RoomEvent event) {
    switch (event.kind) {
      case RoomEventKind.joined:
        final member = event.member!;
        if (!state.members.any((m) => m.id == member.id)) {
          state = state.copyWith(members: [...state.members, member]);
        }
      case RoomEventKind.left:
        final member = event.member!;
        state = state.copyWith(
          members: [
            for (final m in state.members)
              if (m.id != member.id) m,
          ],
          live: {...state.live}..remove(member.id),
        );
      case RoomEventKind.said:
        final utterance = event.utterance!;
        _add(utterance);
        state = state.copyWith(
          live: {...state.live}..remove(utterance.memberId),
        );
      case RoomEventKind.live:
        final member = event.member!;
        if (member.id == state.me?.id) return;
        final text = event.live ?? '';
        state = state.copyWith(
          live: text.isEmpty
              ? ({...state.live}..remove(member.id))
              : {...state.live, member.id!: text},
        );
      case RoomEventKind.closed:
        _stop();
        state = state.copyWith(status: RoomStatus.ended, live: const {});
    }
  }

  void _add(Utterance utterance) {
    if (state.messages.any((m) => m.id == utterance.id)) return;
    state = state.copyWith(messages: [...state.messages, utterance]);
  }

  void _lost(Object? error) {
    if (state.room == null || state.status == RoomStatus.ended) return;
    // "Not in this conversation" can mean this phone's account changed since
    // it joined; rejoining (below) fixes that. Any other refusal is final.
    final rejoinable =
        error is RoomException &&
        error.message.contains('not in this conversation') &&
        _attempt < 2;
    if (error is RoomException && !rejoinable) {
      _stop();
      state = state.copyWith(status: RoomStatus.ended, error: error.message);
      return;
    }
    state = state.copyWith(status: RoomStatus.reconnecting);
    _retry?.cancel();
    final delay = Duration(seconds: [1, 2, 4, 8, 15][_attempt.clamp(0, 4)]);
    _attempt++;
    _retry = Timer(delay, () async {
      final room = state.room;
      final me = state.me;
      if (room == null || me == null) return;
      try {
        // Rejoining returns the messages missed while offline.
        final info = await client.room.join(room.code, me.role, me.name);
        state = state.copyWith(
          members: info.members,
          messages: _merge(state.messages, info.history),
        );
        _listen();
      } on RoomException catch (e) {
        _stop();
        state = state.copyWith(status: RoomStatus.ended, error: e.message);
      } catch (e) {
        _lost(e);
      }
    });
  }

  List<Utterance> _merge(List<Utterance> current, List<Utterance> history) {
    final seen = {for (final m in current) m.id};
    final merged = [
      ...current,
      for (final m in history)
        if (!seen.contains(m.id)) m,
    ];
    merged.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return merged;
  }

  void _stop() {
    _events?.cancel();
    _events = null;
    _retry?.cancel();
    _retry = null;
    _liveTimer?.cancel();
    _liveTimer = null;
  }

  String _message(Object error) {
    if (error is RoomException) return error.message;
    return 'Could not reach Parlance. Check your internet connection and try again.';
  }
}

final roomProvider = NotifierProvider<RoomController, RoomState>(
  RoomController.new,
);

/// Where the recogniser, the 3D signer and the web app are.
final servicesProvider = FutureProvider<ServiceAddresses>(
  (ref) => ServiceAddresses.load(),
);
