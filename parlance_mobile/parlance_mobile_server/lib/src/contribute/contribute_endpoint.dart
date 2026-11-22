import 'dart:convert';
import 'dart:io';

import 'package:parlance_recognition/parlance_recognition.dart';
import 'package:serverpod/serverpod.dart';

import '../generated/protocol.dart';

/// "Help train Parlance": people who choose to can record signs so the sign
/// reader can be trained on data the Deaf community gave with consent (the
/// current model uses a research-only dataset, which blocks commercial use).
///
/// - Opt-in only, separate from using the app: nothing here is needed for any
///   other feature, and nothing is collected before [giveConsent].
/// - Hand positions only (the 141 numbers the recogniser reads), never video,
///   never a name. Reviewers never learn who recorded a sign.
/// - Fluent signers check each sign; two matching checks verify or reject it.
///   Only verified signs are meant for training.
/// - [withdraw] deletes the consent and every sign and check the person gave.
///
/// Every method needs a signed-in account; each checks what the caller may do.
class ContributeEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  /// Change this whenever the consent text in the app changes, so everyone is
  /// asked again.
  static const consentVersion = '2026-11-22';

  /// Numbers in one camera frame: two hands x 21 points x (x, y, z), then 15 zeros.
  static const landmarksPerFrame = 141;
  static const minFrames = 8;
  static const maxFrames = 150;
  static const perMinute = 30;
  static const votesToDecide = 2;

  static final _recent = <String, List<DateTime>>{};

  static List<ContributionWord>? _words;

  /// Words the sign reader knows (both of its word lists), A to Z.
  static List<ContributionWord> words([
    String directory = 'assets/recognition',
  ]) => _words ??= () {
    final byKey = <String, String>{};
    for (final file in ['transformer.json', 'forest.json']) {
      final meta =
          jsonDecode(File('$directory/$file').readAsStringSync())
              as Map<String, dynamic>;
      for (final label in (meta['labels'] as List).cast<String>()) {
        final key = glossKey(label);
        if (key.isEmpty || key == glossKey(noneLabel)) continue;
        // Keep the spelling with word breaks ("THANK_YOU" over "Thankyou").
        final readable = label.replaceAll('_', ' ').toLowerCase();
        final current = byKey[key];
        if (current == null ||
            ' '.allMatches(readable).length > ' '.allMatches(current).length) {
          byKey[key] = readable;
        }
      }
    }
    final list = [
      for (final e in byKey.entries)
        ContributionWord(key: e.key, label: e.value),
    ]..sort((a, b) => a.label.compareTo(b.label));
    return list;
  }();

  Future<List<ContributionWord>> vocabulary(Session session) async => words();

  Future<ContributionStats> status(Session session) async {
    final userId = _userId(session);
    final consent = await _consent(session, userId);
    final mine = await SignContribution.db.find(
      session,
      where: (t) => t.userId.equals(userId),
    );
    final reviewed = await ContributionReview.db.count(
      session,
      where: (t) => t.reviewerId.equals(userId),
    );
    return ContributionStats(
      consented: consent != null && consent.version == consentVersion,
      version: consent?.version,
      currentVersion: consentVersion,
      reviewer: consent?.reviewer ?? false,
      contributed: mine.length,
      verified: mine
          .where((c) => c.status == ContributionStatus.verified)
          .length,
      pending: mine.where((c) => c.status == ContributionStatus.pending).length,
      reviewed: reviewed,
    );
  }

  /// Agrees to the consent text of [version]. [decidesForSelf]: they are 18 or
  /// older and decide for themselves, or their lawful guardian agrees too.
  Future<ContributionStats> giveConsent(
    Session session,
    String version,
    bool decidesForSelf,
  ) async {
    final userId = _userId(session);
    if (version != consentVersion) {
      throw ContributionException(
        message: 'The consent text has changed. Read it again, then agree.',
      );
    }
    if (!decidesForSelf) {
      throw ContributionException(
        message:
            'You can contribute if you are 18 or older and decide for yourself, or if your guardian agrees too.',
      );
    }
    final existing = await _consent(session, userId);
    if (existing == null) {
      await ContributionConsent.db.insertRow(
        session,
        ContributionConsent(userId: userId, version: version, givenAt: _now()),
      );
    } else {
      await ContributionConsent.db.updateRow(
        session,
        existing.copyWith(version: version, givenAt: _now()),
      );
    }
    return status(session);
  }

  /// Takes back consent and deletes every sign and check this person gave.
  /// Returns how many signs were deleted.
  Future<int> withdraw(Session session) async {
    final userId = _userId(session);
    final mine = await SignContribution.db.find(
      session,
      where: (t) => t.userId.equals(userId),
    );
    final ids = {for (final c in mine) c.id!};
    if (ids.isNotEmpty) {
      await ContributionReview.db.deleteWhere(
        session,
        where: (t) => t.contributionId.inSet(ids),
      );
    }
    await SignContribution.db.deleteWhere(
      session,
      where: (t) => t.userId.equals(userId),
    );
    // Their checks of other people's signs go too; recount those signs.
    final theirReviews = await ContributionReview.db.find(
      session,
      where: (t) => t.reviewerId.equals(userId),
    );
    await ContributionReview.db.deleteWhere(
      session,
      where: (t) => t.reviewerId.equals(userId),
    );
    for (final contributionId in {
      for (final r in theirReviews) r.contributionId,
    }) {
      await _recount(session, contributionId);
    }
    await ContributionConsent.db.deleteWhere(
      session,
      where: (t) => t.userId.equals(userId),
    );
    return ids.length;
  }

  /// Also check other people's signs (for fluent signers).
  Future<ContributionStats> setReviewer(Session session, bool on) async {
    final userId = _userId(session);
    final consent = await _requireConsent(session, userId);
    await ContributionConsent.db.updateRow(
      session,
      consent.copyWith(reviewer: on),
    );
    return status(session);
  }

  /// Saves one recorded sign: [frames] is [frameCount] x 141 numbers.
  Future<ContributionSummary> contribute(
    Session session,
    String gloss,
    List<double> frames,
    int frameCount,
  ) async {
    final userId = _userId(session);
    await _requireConsent(session, userId);
    final key = glossKey(gloss);
    if (!words().any((w) => w.key == key)) {
      throw ContributionException(message: 'Choose a word from the list.');
    }
    if (frameCount < minFrames) {
      throw ContributionException(
        message:
            'That was too short. Sign the word once, then lower your hands.',
      );
    }
    if (frameCount > maxFrames) {
      throw ContributionException(
        message: 'That was too long. Record one sign at a time.',
      );
    }
    if (frames.length != frameCount * landmarksPerFrame ||
        frames.any((v) => !v.isFinite || v.abs() > 100)) {
      throw ContributionException(
        message: 'The recording did not come through. Try again.',
      );
    }
    _limit(userId);
    final saved = await SignContribution.db.insertRow(
      session,
      SignContribution(
        userId: userId,
        gloss: key,
        frames: frames,
        frameCount: frameCount,
        createdAt: _now(),
        status: ContributionStatus.pending,
      ),
    );
    return _summary(saved);
  }

  /// My signs, newest first.
  Future<List<ContributionSummary>> mine(Session session) async {
    final userId = _userId(session);
    final rows = await SignContribution.db.find(
      session,
      where: (t) => t.userId.equals(userId),
      orderBy: (t) => t.createdAt.desc(),
      limit: 200,
    );
    return [for (final r in rows) _summary(r)];
  }

  Future<void> deleteContribution(Session session, int id) async {
    final userId = _userId(session);
    final row = await SignContribution.db.findById(session, id);
    if (row == null || row.userId != userId) {
      throw ContributionException(message: 'That sign was not found.');
    }
    await ContributionReview.db.deleteWhere(
      session,
      where: (t) => t.contributionId.equals(id),
    );
    await SignContribution.db.deleteRow(session, row);
  }

  /// Signs waiting for checks: not mine, not already checked by me.
  Future<List<ReviewItem>> reviewQueue(Session session) async {
    final userId = _userId(session);
    await _requireReviewer(session, userId);
    final done = {
      for (final r in await ContributionReview.db.find(
        session,
        where: (t) => t.reviewerId.equals(userId),
      ))
        r.contributionId,
    };
    final rows = await SignContribution.db.find(
      session,
      where: (t) =>
          t.status.equals(ContributionStatus.pending) &
          t.userId.notEquals(userId),
      orderBy: (t) => t.createdAt,
      limit: 40,
    );
    return [
      for (final r in rows.where((r) => !done.contains(r.id)).take(10))
        ReviewItem(
          id: r.id!,
          gloss: r.gloss,
          frames: r.frames,
          frameCount: r.frameCount,
        ),
    ];
  }

  /// Checks someone else's sign. Two matching checks decide it.
  Future<ContributionStatus> review(
    Session session,
    int id,
    ReviewVerdict verdict,
  ) async {
    final userId = _userId(session);
    await _requireReviewer(session, userId);
    final row = await SignContribution.db.findById(session, id);
    if (row == null) {
      throw ContributionException(
        message: 'That sign was not found. It may have been deleted.',
      );
    }
    if (row.userId == userId) {
      throw ContributionException(message: 'You cannot check your own signs.');
    }
    final existing = await ContributionReview.db.findFirstRow(
      session,
      where: (t) => t.contributionId.equals(id) & t.reviewerId.equals(userId),
    );
    if (existing == null) {
      await ContributionReview.db.insertRow(
        session,
        ContributionReview(
          contributionId: id,
          reviewerId: userId,
          verdict: verdict,
          createdAt: _now(),
        ),
      );
    } else {
      await ContributionReview.db.updateRow(
        session,
        existing.copyWith(verdict: verdict, createdAt: _now()),
      );
    }
    return (await _recount(session, id))!.status;
  }

  // --- helpers ------------------------------------------------------------------

  /// Overridable in tests.
  static DateTime Function() clock = () => DateTime.now().toUtc();
  static DateTime _now() => clock();

  static void resetLimits() => _recent.clear();

  void _limit(String userId) {
    final now = _now();
    final stamps = (_recent[userId] ?? [])
      ..removeWhere((t) => now.difference(t) >= const Duration(minutes: 1));
    if (stamps.length >= perMinute) {
      throw ContributionException(
        message: 'You are recording very fast. Take a short break, then go on.',
      );
    }
    _recent[userId] = stamps..add(now);
  }

  String _userId(Session session) {
    final auth = session.authenticated;
    if (auth == null) {
      throw ContributionException(message: 'Please open Parlance again.');
    }
    return auth.userIdentifier;
  }

  Future<ContributionConsent?> _consent(Session session, String userId) =>
      ContributionConsent.db.findFirstRow(
        session,
        where: (t) => t.userId.equals(userId),
      );

  Future<ContributionConsent> _requireConsent(
    Session session,
    String userId,
  ) async {
    final consent = await _consent(session, userId);
    if (consent == null || consent.version != consentVersion) {
      throw ContributionException(
        message: 'Read and agree to how your signs are used first.',
      );
    }
    return consent;
  }

  Future<void> _requireReviewer(Session session, String userId) async {
    final consent = await _requireConsent(session, userId);
    if (!consent.reviewer) {
      throw ContributionException(
        message: 'Turn on "I sign ISL fluently" to check signs.',
      );
    }
  }

  Future<SignContribution?> _recount(Session session, int id) async {
    final row = await SignContribution.db.findById(session, id);
    if (row == null) return null;
    final reviews = await ContributionReview.db.find(
      session,
      where: (t) => t.contributionId.equals(id),
    );
    final correct = reviews
        .where((r) => r.verdict == ReviewVerdict.correct)
        .length;
    final wrong = reviews.where((r) => r.verdict == ReviewVerdict.wrong).length;
    final status = correct >= votesToDecide && correct > wrong
        ? ContributionStatus.verified
        : wrong >= votesToDecide && wrong > correct
        ? ContributionStatus.rejected
        : ContributionStatus.pending;
    return SignContribution.db.updateRow(
      session,
      row.copyWith(correctVotes: correct, wrongVotes: wrong, status: status),
    );
  }

  ContributionSummary _summary(SignContribution c) => ContributionSummary(
    id: c.id!,
    gloss: c.gloss,
    frameCount: c.frameCount,
    createdAt: c.createdAt,
    status: c.status,
  );
}
