import 'package:parlance_mobile_server/src/contribute/contribute_endpoint.dart';
import 'package:parlance_mobile_server/src/generated/protocol.dart';
import 'package:test/test.dart';

import 'test_tools/serverpod_test_tools.dart';

void main() {
  withServerpod('Given the contribute endpoint', (sessionBuilder, endpoints) {
    TestSessionBuilder as(String user) => sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo(user, {}),
    );
    final contribute = endpoints.contribute;
    final asha = as('asha');
    final ravi = as('ravi');
    final meera = as('meera');
    const version = ContributeEndpoint.consentVersion;

    Matcher refused(String text) => throwsA(
      isA<ContributionException>().having((e) => e.message, 'message', contains(text)),
    );

    /// A 20-frame recording of one hand (141 numbers a frame).
    List<double> recording([int frames = 20]) => [
      for (var f = 0; f < frames; f++)
        for (var i = 0; i < 141; i++) i < 63 ? 0.3 + i * 0.002 + f * 0.001 : 0.0,
    ];

    setUp(ContributeEndpoint.resetLimits);

    test('a signed-out phone cannot contribute', () async {
      await expectLater(
        contribute.status(sessionBuilder),
        throwsA(isA<ServerpodUnauthenticatedException>()),
      );
    });

    test('nothing is saved before consent, and consent is for the current text only', () async {
      final word = (await contribute.vocabulary(asha)).first.key;
      await expectLater(contribute.contribute(asha, word, recording(), 20), refused('agree'));
      expect((await contribute.status(asha)).consented, isFalse);
      await expectLater(contribute.giveConsent(asha, '2020-01-01', true), refused('changed'));
      await expectLater(contribute.giveConsent(asha, version, false), refused('guardian'));
      expect((await contribute.giveConsent(asha, version, true)).consented, isTrue);
    });

    test('only known words and real recordings are accepted', () async {
      await contribute.giveConsent(asha, version, true);
      final words = await contribute.vocabulary(asha);
      expect(words.length, greaterThan(400));
      expect(words.any((w) => w.key == 'none' || w.key.isEmpty), isFalse);
      final word = words.firstWhere((w) => w.key == 'help').key;
      await expectLater(contribute.contribute(asha, 'notaword', recording(), 20), refused('from the list'));
      await expectLater(contribute.contribute(asha, word, recording(4), 4), refused('too short'));
      await expectLater(contribute.contribute(asha, word, recording(20), 21), refused('did not come through'));
      final saved = await contribute.contribute(asha, word, recording(), 20);
      expect(saved.status, ContributionStatus.pending);
      expect(saved.toJsonForProtocol().containsKey('userId'), isFalse);
      expect((await contribute.mine(asha)).single.gloss, 'help');
    });

    test('fluent signers check signs; two matching checks decide; never your own', () async {
      for (final p in [asha, ravi, meera]) {
        await contribute.giveConsent(p, version, true);
      }
      final saved = await contribute.contribute(asha, 'help', recording(), 20);
      await expectLater(contribute.reviewQueue(ravi), refused('fluently'));
      await contribute.setReviewer(asha, true);
      await contribute.setReviewer(ravi, true);
      await contribute.setReviewer(meera, true);

      expect(await contribute.reviewQueue(asha), isEmpty, reason: 'your own signs are not offered');
      await expectLater(contribute.review(asha, saved.id, ReviewVerdict.correct), refused('your own'));
      final item = (await contribute.reviewQueue(ravi)).single;
      expect(item.frames.length, 20 * 141);
      expect(item.toJsonForProtocol().containsKey('userId'), isFalse, reason: 'reviewers never learn who signed');

      expect(await contribute.review(ravi, saved.id, ReviewVerdict.correct), ContributionStatus.pending);
      expect(await contribute.reviewQueue(ravi), isEmpty, reason: 'already checked');
      expect(await contribute.review(meera, saved.id, ReviewVerdict.correct), ContributionStatus.verified);
      expect((await contribute.status(asha)).verified, 1);
    });

    test('withdrawing deletes every sign and check the person gave', () async {
      for (final p in [asha, ravi, meera]) {
        await contribute.giveConsent(p, version, true);
        await contribute.setReviewer(p, true);
      }
      final ashas = await contribute.contribute(asha, 'help', recording(), 20);
      final ravis = await contribute.contribute(ravi, 'help', recording(), 20);
      await contribute.review(ravi, ashas.id, ReviewVerdict.correct);
      await contribute.review(asha, ravis.id, ReviewVerdict.correct);
      await contribute.review(meera, ravis.id, ReviewVerdict.correct);
      expect((await contribute.mine(ravi)).single.status, ContributionStatus.verified);

      expect(await contribute.withdraw(asha), 1);
      final stats = await contribute.status(asha);
      expect((stats.consented, stats.contributed, stats.reviewed), (false, 0, 0));
      expect(await SignContribution.db.count(sessionBuilder.build(), where: (t) => t.id.equals(ashas.id)), 0);
      // Asha's check of Ravi's sign is gone, so it no longer has two checks.
      expect((await contribute.mine(ravi)).single.status, ContributionStatus.pending);
    });

    test('you can delete one of your signs, but not someone else\'s', () async {
      await contribute.giveConsent(asha, version, true);
      final saved = await contribute.contribute(asha, 'help', recording(), 20);
      await expectLater(contribute.deleteContribution(ravi, saved.id), refused('not found'));
      await contribute.deleteContribution(asha, saved.id);
      expect(await contribute.mine(asha), isEmpty);
    });
  });
}
