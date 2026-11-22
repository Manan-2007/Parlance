import 'package:parlance_mobile_server/src/community/community_endpoint.dart';
import 'package:parlance_mobile_server/src/generated/protocol.dart';
import 'package:test/test.dart';

import 'test_tools/serverpod_test_tools.dart';

void main() {
  withServerpod('Given the community endpoint', (sessionBuilder, endpoints) {
    TestSessionBuilder as(String user) => sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo(user, {}),
    );
    final community = endpoints.community;
    final asha = as('asha');
    final ravi = as('ravi');

    Matcher refused(String text) => throwsA(
      isA<CommunityException>().having((e) => e.message, 'message', contains(text)),
    );

    setUp(() {
      CommunityEndpoint.resetLimits();
      CommunityEndpoint.clock = () => DateTime.now().toUtc();
    });

    Future<CommunityPost> question() async {
      await community.join(asha, 'Asha', 'Pune', ['deaf']);
      await community.join(ravi, 'Ravi', '', ['learning']);
      return community.createThread(
        asha,
        'rights',
        CommunityKind.question,
        'Where do I renew my card?',
        'My disability certificate expires soon. Who renews it?',
        CommunityInput.typed,
        null,
        null,
        null,
        null,
      );
    }

    Future<CommunityPost> meetup({Duration startsIn = const Duration(minutes: 30)}) {
      final starts = DateTime.now().toUtc().add(startsIn);
      return community.createThread(
        asha,
        'meetups',
        CommunityKind.meetup,
        'ISL coffee morning',
        '',
        CommunityInput.typed,
        'City park gate',
        'Pune',
        starts,
        starts.add(const Duration(hours: 2)),
      );
    }

    test('a signed-out phone cannot read the community', () async {
      await expectLater(
        community.listSpaces(sessionBuilder),
        throwsA(isA<ServerpodUnauthenticatedException>()),
      );
    });

    test('names are unique, and posting needs a name', () async {
      await expectLater(
        community.reply(asha, 1, 'Hi', CommunityInput.typed, null),
        refused('Join the community first'),
      );
      final me = await community.join(asha, 'आशा के', '', []);
      expect(me.handle, 'आशा के', reason: 'Hindi names work');
      expect(me.toJsonForProtocol().containsKey('userId'), isFalse);
      await expectLater(community.join(ravi, 'आशा के', '', []), refused('already uses that name'));
      await expectLater(community.join(ravi, '<b>', '', []), refused('letters, numbers'));
      await expectLater(community.join(ravi, 'Ravi', '', ['wizard']), refused('from the list'));
    });

    test('sample posts appear on first use, labelled as samples', () async {
      final threads = await community.threads(asha, null, 'active', '', 0);
      expect(threads.length, greaterThanOrEqualTo(7));
      expect(threads.every((t) => t.author.sample), isTrue);
      expect(threads.any((t) => t.answerId != null), isTrue);
      expect((await community.threads(asha, null, 'meetups', '', 0)).length, 2);
    });

    test('only the author edits or deletes, only the asker marks the answer', () async {
      final post = await question();
      await expectLater(
        community.editThread(ravi, post.id, 'Changed title', 'Changed body text here'),
        refused('only edit your own'),
      );
      await expectLater(community.deleteThread(ravi, post.id), refused('only delete your own'));
      final reply = await community.reply(ravi, post.id, 'Ask at the district hospital.', CommunityInput.signed, null);
      expect(reply.input, CommunityInput.signed);
      await expectLater(community.editReply(asha, reply.id, 'Not mine'), refused('only edit your own'));
      await expectLater(community.setAnswer(ravi, post.id, reply.id), refused('Only the person who asked'));
      expect((await community.setAnswer(asha, post.id, reply.id)).answerId, reply.id);

      await community.deleteReply(ravi, reply.id);
      final detail = await community.thread(asha, post.id);
      expect(detail.replies, isEmpty);
      expect(detail.post.answerId, isNull);

      await community.deleteThread(asha, post.id);
      await expectLater(community.thread(ravi, post.id), refused('not found'));
    });

    test('helpful is one per person and never your own', () async {
      final post = await question();
      await expectLater(
        community.setHelpful(asha, CommunityTarget.thread, post.id, true),
        refused('your own post'),
      );
      await community.setHelpful(ravi, CommunityTarget.thread, post.id, true);
      expect(await community.setHelpful(ravi, CommunityTarget.thread, post.id, true), 1);
      expect((await community.thread(ravi, post.id)).post.myHelpful, isTrue);
      expect(await community.setHelpful(ravi, CommunityTarget.thread, post.id, false), 0);
    });

    test('a post is hidden after several people report it', () async {
      final post = await question();
      await expectLater(community.report(asha, CommunityTarget.thread, post.id, 'spam'), refused('your own post'));
      final reporters = [for (var i = 0; i < CommunityEndpoint.hideAfterReports; i++) as('reporter$i')];
      for (final (i, r) in reporters.indexed) {
        await community.join(r, 'Reporter $i', '', []);
      }
      expect(await community.report(reporters[0], CommunityTarget.thread, post.id, 'spam'), isFalse);
      expect(await community.report(reporters[0], CommunityTarget.thread, post.id, 'rude'), isFalse, reason: 'twice counts once');
      expect(await community.report(reporters[1], CommunityTarget.thread, post.id, 'spam'), isFalse);
      expect(await community.report(reporters[2], CommunityTarget.thread, post.id, 'spam'), isTrue);
      await expectLater(community.thread(ravi, post.id), refused('hidden'));
      expect((await community.thread(asha, post.id)).post.hidden, isTrue, reason: 'the author still sees it');
    });

    test('posting too fast is slowed down', () async {
      final post = await question();
      for (var i = 0; i < CommunityEndpoint.postsPerMinute - 1; i++) {
        await community.reply(asha, post.id, 'Update $i', CommunityInput.typed, null);
      }
      await expectLater(community.reply(asha, post.id, 'One more', CommunityInput.typed, null), refused('very fast'));
    });

    test('lists filter by space, answer and search', () async {
      await question();
      expect((await community.threads(ravi, 'rights', 'active', '', 0)).map((t) => t.title), contains('Where do I renew my card?'));
      expect((await community.threads(ravi, null, 'active', 'renew my card', 0)).single.space, 'rights');
      expect(await community.threads(ravi, null, 'active', '100%_', 0), isEmpty);
      await expectLater(community.threads(ravi, 'nowhere', 'active', '', 0), refused('does not exist'));
    });

    test('meetups check their times', () async {
      await question();
      await expectLater(meetup(startsIn: const Duration(hours: -2)), refused('in the past'));
      final planned = await meetup();
      expect(planned.meetup!.going, 1);
      expect((await community.setGoing(ravi, planned.id, true)).meetup!.imGoing, isTrue);
    });

    test('the live room belongs to the host and ends with the meetup', () async {
      await question();
      final far = await meetup(startsIn: const Duration(hours: 3));
      await expectLater(community.startLive(asha, far.id), refused('opens an hour before'));

      final planned = await meetup();
      await expectLater(community.startLive(ravi, planned.id), refused('Only the host'));
      final started = await community.startLive(asha, planned.id);
      final code = started.meetup!.code!;
      expect(code, matches(RegExp(r'^\d{6}$')));
      expect((await community.thread(ravi, planned.id)).post.meetup!.code, isNull, reason: 'only the host sees the code');
      expect((await community.thread(ravi, planned.id)).post.meetup!.live, isTrue);

      await community.sayLive(ravi, '${code.substring(0, 3)} ${code.substring(3)}', 'Hello from the window table', CommunityInput.signed);
      final room = await community.live(asha, code);
      expect(room.isHost, isTrue);
      expect(room.messages.single.text, 'Hello from the window table');
      await expectLater(community.live(ravi, '12'), refused('six digits'));

      CommunityEndpoint.clock = () => planned.meetup!.endsAt.add(const Duration(seconds: 1));
      await expectLater(community.live(ravi, code), refused('No live meetup'));
      expect(await CommunityLiveMessage.db.count(sessionBuilder.build()), 0, reason: 'messages are deleted');
    });

    test('the host can end the live room early', () async {
      await question();
      final planned = await meetup();
      final code = (await community.startLive(asha, planned.id)).meetup!.code!;
      await expectLater(community.endLive(ravi, planned.id), refused('Only the host'));
      await community.endLive(asha, planned.id);
      await expectLater(community.live(asha, code), refused('No live meetup'));
    });
  });
}
