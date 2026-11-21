import 'dart:async';

import 'package:parlance_mobile_server/src/generated/protocol.dart';
import 'package:test/test.dart';

import 'test_tools/serverpod_test_tools.dart';

void main() {
  withServerpod('Given the room endpoint', (sessionBuilder, endpoints) {
    TestSessionBuilder as(String user) => sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo(user, {}),
    );

    test('a signed-out phone cannot start a room', () async {
      await expectLater(
        endpoints.room.create(sessionBuilder, MemberRole.signer, 'Asha'),
        throwsA(isA<ServerpodUnauthenticatedException>()),
      );
    });

    test('a second phone joins with the code and sees the history', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      expect(started.room.code, matches(RegExp(r'^\d{6}$')));
      expect(
        started.room.toJsonForProtocol().containsKey('hostId'),
        isFalse,
        reason: 'account ids never leave the server',
      );
      await endpoints.room.say(
        as('signer'),
        started.room.id!,
        UtteranceKind.sign,
        'hello',
        null,
      );

      final joined = await endpoints.room.join(
        as('desk'),
        started.room.code,
        MemberRole.speaker,
        '  Front   desk ',
      );
      expect(joined.me.name, 'Front desk');
      expect(joined.members.map((m) => m.role), [
        MemberRole.signer,
        MemberRole.speaker,
      ]);
      expect(joined.history.single.text, 'hello');
      expect(
        joined.members.every(
          (m) => !m.toJsonForProtocol().containsKey('userId'),
        ),
        isTrue,
      );

      final again = await endpoints.room.join(
        as('desk'),
        started.room.code,
        MemberRole.speaker,
        'Desk',
      );
      expect(
        again.me.id,
        joined.me.id,
        reason: 'rejoining keeps the same membership',
      );
    });

    test('someone outside the room cannot read or write it', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      final id = started.room.id!;
      await expectLater(
        endpoints.room.say(as('stranger'), id, UtteranceKind.typed, 'hi', null),
        throwsA(isA<RoomException>()),
      );
      await expectLater(
        endpoints.room.listen(as('stranger'), id).first,
        throwsA(isA<RoomException>()),
      );
      await expectLater(
        endpoints.room.close(as('stranger'), id),
        throwsA(isA<RoomException>()),
      );
    });

    test('a wrong code is explained', () async {
      await expectLater(
        endpoints.room.join(as('desk'), '12', MemberRole.speaker, 'Desk'),
        throwsA(
          isA<RoomException>().having(
            (e) => e.message,
            'message',
            contains('six digits'),
          ),
        ),
      );
      await expectLater(
        endpoints.room.join(as('desk'), '000000', MemberRole.speaker, 'Desk'),
        throwsA(isA<RoomException>()),
      );
    });

    test('messages reach the other phone live', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      final id = started.room.id!;
      await endpoints.room.join(
        as('desk'),
        started.room.code,
        MemberRole.speaker,
        'Desk',
      );

      final events = <RoomEvent>[];
      final subscription = endpoints.room
          .listen(as('desk'), id)
          .listen(events.add);
      await Future<void>.delayed(const Duration(milliseconds: 200));

      await endpoints.room.live(as('signer'), id, 'hel');
      await endpoints.room.say(
        as('signer'),
        id,
        UtteranceKind.sign,
        'hello',
        null,
      );
      await Future<void>.delayed(const Duration(milliseconds: 200));
      await subscription.cancel();

      expect(events.map((e) => e.kind), [
        RoomEventKind.live,
        RoomEventKind.said,
      ]);
      expect(events.first.live, 'hel');
      expect(events.last.utterance!.text, 'hello');
      expect(events.last.utterance!.role, MemberRole.signer);
    });

    test('the last phone leaving deletes the room and its messages', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      final id = started.room.id!;
      await endpoints.room.say(
        as('signer'),
        id,
        UtteranceKind.typed,
        'my name is Asha',
        null,
      );
      await endpoints.room.leave(as('signer'), id);

      final session = sessionBuilder.build();
      expect(await Room.db.findById(session, id), isNull);
      expect(
        await Utterance.db.count(session, where: (t) => t.roomId.equals(id)),
        0,
      );
    });

    test('only the phone that started a room can end it', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      await endpoints.room.join(
        as('desk'),
        started.room.code,
        MemberRole.speaker,
        'Desk',
      );
      await expectLater(
        endpoints.room.close(as('desk'), started.room.id!),
        throwsA(isA<RoomException>()),
      );
      await endpoints.room.close(as('signer'), started.room.id!);
      await expectLater(
        endpoints.room.join(
          as('desk'),
          started.room.code,
          MemberRole.speaker,
          'Desk',
        ),
        throwsA(isA<RoomException>()),
      );
    });

    test('empty and very long messages are refused', () async {
      final started = await endpoints.room.create(
        as('signer'),
        MemberRole.signer,
        'Asha',
      );
      await expectLater(
        endpoints.room.say(
          as('signer'),
          started.room.id!,
          UtteranceKind.typed,
          '   ',
          null,
        ),
        throwsA(isA<RoomException>()),
      );
      await expectLater(
        endpoints.room.say(
          as('signer'),
          started.room.id!,
          UtteranceKind.typed,
          'a' * 601,
          null,
        ),
        throwsA(isA<RoomException>()),
      );
    });
  });
}
