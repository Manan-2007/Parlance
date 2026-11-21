import 'dart:math';

import 'package:serverpod/serverpod.dart';

import '../generated/protocol.dart';

/// A live conversation between phones in the same place.
///
/// One phone starts a room and shows its six-digit code as a QR code. The other
/// phone scans it (in the app, or in any browser) and joins. Everything said in
/// the room (signed words, speech, typed text, cards) reaches every phone in it
/// at once through [listen].
///
/// Every method needs a signed-in account (anonymous is fine) and checks that
/// the caller is a member of the room before reading or writing it. Rooms
/// expire after [lifetime], and their messages are deleted with them.
class RoomEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  static const lifetime = Duration(hours: 3);
  static const maxMembers = 6;
  static const maxText = 600;
  static const maxName = 40;

  static final _random = Random.secure();

  static String channel(int roomId) => 'room-$roomId';

  /// Starts a room and joins it as [role].
  Future<RoomInfo> create(Session session, MemberRole role, String name) async {
    final userId = _userId(session);
    await _removeExpired(session);

    final room = await session.db.transaction((transaction) async {
      for (var attempt = 0; attempt < 20; attempt++) {
        final code = (_random.nextInt(900000) + 100000).toString();
        final taken = await Room.db.findFirstRow(
          session,
          where: (t) => t.code.equals(code),
          transaction: transaction,
        );
        if (taken != null) continue;
        return Room.db.insertRow(
          session,
          Room(
            code: code,
            hostId: userId,
            expiresAt: DateTime.now().toUtc().add(lifetime),
          ),
          transaction: transaction,
        );
      }
      throw RoomException(
        message: 'Could not start a conversation. Try again.',
      );
    });

    final me = await RoomMember.db.insertRow(
      session,
      RoomMember(
        roomId: room.id!,
        userId: userId,
        role: role,
        name: _cleanName(name, role),
      ),
    );
    return RoomInfo(room: room, me: me, members: [me], history: []);
  }

  /// Joins the open room with [code] as [role]. Joining again returns the
  /// same membership, so a phone can reconnect after losing signal.
  Future<RoomInfo> join(
    Session session,
    String code,
    MemberRole role,
    String name,
  ) async {
    final userId = _userId(session);
    final digits = code.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 6) {
      throw RoomException(message: 'The code has six digits.');
    }
    final room = await Room.db.findFirstRow(
      session,
      where: (t) => t.code.equals(digits),
    );
    if (room == null ||
        room.closed ||
        room.expiresAt.isBefore(DateTime.now().toUtc())) {
      throw RoomException(
        message: 'No conversation has that code. Check it, or start a new one.',
      );
    }

    var me = await RoomMember.db.findFirstRow(
      session,
      where: (t) => t.roomId.equals(room.id!) & t.userId.equals(userId),
    );
    if (me == null) {
      final count = await RoomMember.db.count(
        session,
        where: (t) => t.roomId.equals(room.id!),
      );
      if (count >= maxMembers) {
        throw RoomException(message: 'This conversation is full.');
      }
      me = await RoomMember.db.insertRow(
        session,
        RoomMember(
          roomId: room.id!,
          userId: userId,
          role: role,
          name: _cleanName(name, role),
        ),
      );
      await session.messages.postMessage(
        channel(room.id!),
        RoomEvent(kind: RoomEventKind.joined, member: me),
      );
    }

    return RoomInfo(
      room: room,
      me: me,
      members: await RoomMember.db.find(
        session,
        where: (t) => t.roomId.equals(room.id!),
        orderBy: (t) => t.joinedAt,
      ),
      history: await Utterance.db.find(
        session,
        where: (t) => t.roomId.equals(room.id!),
        orderBy: (t) => t.createdAt,
        limit: 200,
      ),
    );
  }

  /// Says something in the room. Every phone in it receives it through [listen].
  Future<Utterance> say(
    Session session,
    int roomId,
    UtteranceKind kind,
    String text,
    String? hindi,
  ) async {
    final me = await _member(session, roomId);
    final clean = text.trim();
    if (clean.isEmpty) {
      throw RoomException(message: 'There is nothing to send.');
    }
    if (clean.length > maxText || (hindi?.length ?? 0) > maxText) {
      throw RoomException(message: 'That message is too long.');
    }
    final utterance = await Utterance.db.insertRow(
      session,
      Utterance(
        roomId: roomId,
        memberId: me.id!,
        role: me.role,
        kind: kind,
        text: clean,
        hindi: hindi?.trim().isEmpty ?? true ? null : hindi!.trim(),
      ),
    );
    await session.messages.postMessage(
      channel(roomId),
      RoomEvent(kind: RoomEventKind.said, utterance: utterance),
    );
    return utterance;
  }

  /// Shares words still being signed or spoken, so the other side sees them
  /// appear. Not saved. An empty [text] clears it.
  Future<void> live(Session session, int roomId, String text) async {
    final me = await _member(session, roomId);
    final clean = text.trim();
    await session.messages.postMessage(
      channel(roomId),
      RoomEvent(
        kind: RoomEventKind.live,
        member: me,
        live: clean.length > maxText ? clean.substring(0, maxText) : clean,
      ),
    );
  }

  /// Everything that happens in the room from now on.
  Stream<RoomEvent> listen(Session session, int roomId) async* {
    await _member(session, roomId);
    yield* session.messages.createStream<RoomEvent>(channel(roomId));
  }

  /// Leaves the room. When the last phone leaves, the room and its messages are
  /// deleted.
  Future<void> leave(Session session, int roomId) async {
    final me = await _member(session, roomId);
    await RoomMember.db.deleteRow(session, me);
    await session.messages.postMessage(
      channel(roomId),
      RoomEvent(kind: RoomEventKind.left, member: me),
    );
    final left = await RoomMember.db.count(
      session,
      where: (t) => t.roomId.equals(roomId),
    );
    if (left == 0) await _delete(session, roomId);
  }

  /// Ends the room for everyone and deletes its messages. Only the phone that
  /// started it can do this.
  Future<void> close(Session session, int roomId) async {
    final userId = _userId(session);
    final room = await Room.db.findById(session, roomId);
    if (room == null || room.hostId != userId) {
      throw RoomException(
        message: 'Only the phone that started this conversation can end it.',
      );
    }
    await session.messages.postMessage(
      channel(roomId),
      RoomEvent(kind: RoomEventKind.closed),
    );
    await _delete(session, roomId);
  }

  String _userId(Session session) {
    final auth = session.authenticated;
    if (auth == null) {
      throw RoomException(message: 'Please open Parlance again.');
    }
    return auth.userIdentifier;
  }

  Future<RoomMember> _member(Session session, int roomId) async {
    final userId = _userId(session);
    final room = await Room.db.findById(session, roomId);
    if (room == null ||
        room.closed ||
        room.expiresAt.isBefore(DateTime.now().toUtc())) {
      throw RoomException(message: 'This conversation has ended.');
    }
    final me = await RoomMember.db.findFirstRow(
      session,
      where: (t) => t.roomId.equals(roomId) & t.userId.equals(userId),
    );
    if (me == null) {
      throw RoomException(message: 'You are not in this conversation.');
    }
    return me;
  }

  String _cleanName(String name, MemberRole role) {
    final clean = name.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (clean.isEmpty) return role == MemberRole.signer ? 'Signer' : 'Speaker';
    return clean.length > maxName ? clean.substring(0, maxName) : clean;
  }

  Future<void> _delete(Session session, int roomId) async {
    await Utterance.db.deleteWhere(
      session,
      where: (t) => t.roomId.equals(roomId),
    );
    await RoomMember.db.deleteWhere(
      session,
      where: (t) => t.roomId.equals(roomId),
    );
    await Room.db.deleteWhere(session, where: (t) => t.id.equals(roomId));
  }

  /// Deletes rooms past their expiry, so nothing is kept longer than needed.
  Future<void> _removeExpired(Session session) async {
    final expired = await Room.db.find(
      session,
      where: (t) => t.expiresAt < DateTime.now().toUtc(),
      limit: 50,
    );
    for (final room in expired) {
      await session.messages.postMessage(
        channel(room.id!),
        RoomEvent(kind: RoomEventKind.closed),
      );
      await _delete(session, room.id!);
    }
  }
}
