import 'dart:math';

import 'package:serverpod/serverpod.dart';

import '../generated/protocol.dart';
import 'community_seed.dart';

/// Community: long-form discussion between Deaf and hard-of-hearing people,
/// their families and learners, plus live meetup rooms for people in the same
/// place ("Here, together"). The same rules as the website's version
/// (backend/community.py at the repo root).
///
/// Every method needs a signed-in account (the app signs in anonymously).
/// Posting needs a community name first ([join]). Only the author edits or
/// deletes a post or reply, only the asker marks the answer, only the meetup's
/// host opens or ends its live room. A live room's code is only given to the
/// host, to show at the venue, and its messages are deleted when the meetup
/// ends. Account ids never leave the server.
class CommunityEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  static const spaces = [
    (
      'everyday',
      'Everyday life',
      'Shops, travel, neighbours, banks and getting things done.',
    ),
    (
      'work',
      'Work and jobs',
      'Interviews, workplace access, interpreters at work, careers.',
    ),
    (
      'study',
      'Study and exams',
      'School, college, exam support, ISL in the classroom.',
    ),
    (
      'health',
      'Health',
      'Doctors, hospitals, hearing aids, implants and feeling well.',
    ),
    (
      'rights',
      'Rights and documents',
      'UDID card, disability certificate, schemes and your rights.',
    ),
    (
      'family',
      'Family and friends',
      'Hearing families, CODAs, relationships, raising children.',
    ),
    (
      'learn-isl',
      'Learning ISL',
      'Regional signs, new words, finding practice partners.',
    ),
    (
      'tech',
      'Tech and tools',
      'Captions, video calls, apps and phones that work for you.',
    ),
    (
      'meetups',
      'Meetups',
      'Meet in person. The host opens a live room when you are there.',
    ),
  ];
  static final spaceIds = {for (final s in spaces) s.$1};
  static const ways = {
    'deaf',
    'hard-of-hearing',
    'deafblind',
    'family',
    'learning',
    'interpreter',
    'teacher',
  };
  static const reportReasons = {'spam', 'rude', 'unsafe', 'private', 'other'};

  static const hideAfterReports = 3;
  static const postsPerMinute = 6;
  static const livePerMinute = 20;
  static const liveOpensBefore = Duration(hours: 1);
  static const maxMeetup = Duration(hours: 12);

  static final _random = Random.secure();
  static final _recent = <String, List<DateTime>>{};

  static String threadChannel(int id) => 'community-thread-$id';
  static String liveChannel(String code) => 'community-live-$code';

  /// Overridable in tests.
  static DateTime Function() clock = () => DateTime.now().toUtc();

  // --- members --------------------------------------------------------------

  /// You in the Community, or null if you have not chosen a name yet.
  Future<CommunityAuthor?> me(Session session) async {
    final member = await _memberOrNull(session);
    return member == null ? null : _author(member);
  }

  /// Joins with a name people will see (not necessarily a real name).
  Future<CommunityAuthor> join(
    Session session,
    String handle,
    String city,
    List<String> ways,
  ) async {
    final userId = _userId(session);
    final existing = await _memberOrNull(session);
    if (existing != null) return _author(existing);
    final name = cleanHandle(handle);
    final key = name.toLowerCase();
    final taken = await CommunityMember.db.findFirstRow(
      session,
      where: (t) => t.handleKey.equals(key),
    );
    if (taken != null) {
      throw CommunityException(
        message: 'Someone already uses that name. Try another one.',
      );
    }
    final member = await CommunityMember.db.insertRow(
      session,
      CommunityMember(
        userId: userId,
        handle: name,
        handleKey: key,
        city: _city(city),
        ways: _ways(ways),
        joinedAt: clock(),
      ),
    );
    return _author(member);
  }

  Future<CommunityAuthor> updateMe(
    Session session,
    String city,
    List<String> ways,
  ) async {
    final member = await _member(session);
    final updated = await CommunityMember.db.updateRow(
      session,
      member.copyWith(city: _city(city), ways: _ways(ways)),
    );
    return _author(updated);
  }

  // --- spaces and threads -----------------------------------------------------

  Future<List<CommunitySpace>> listSpaces(Session session) async {
    await seedCommunity(session, clock());
    final result = <CommunitySpace>[];
    for (final (id, title, description) in spaces) {
      final visible = await CommunityThread.db.find(
        session,
        where: (t) =>
            t.space.equals(id) &
            t.deleted.equals(false) &
            t.hidden.equals(false),
        orderBy: (t) => t.lastActivityAt.desc(),
      );
      result.add(
        CommunitySpace(
          id: id,
          title: title,
          description: description,
          threads: visible.length,
          lastActivityAt: visible.firstOrNull?.lastActivityAt,
        ),
      );
    }
    return result;
  }

  /// Threads, newest activity first ([sort]: active, new, unanswered, meetups).
  Future<List<CommunityPost>> threads(
    Session session,
    String? space,
    String sort,
    String query,
    int offset,
  ) async {
    await seedCommunity(session, clock());
    final viewer = await _memberOrNull(session);
    if (space != null && !spaceIds.contains(space)) {
      throw CommunityException(message: 'That space does not exist.');
    }
    final now = clock();
    final needle = query.trim();
    final pattern =
        '%${needle.replaceAll(r'\', r'\\').replaceAll('%', r'\%').replaceAll('_', r'\_')}%';
    final rows = await CommunityThread.db.find(
      session,
      where: (t) {
        var where = t.deleted.equals(false) & t.hidden.equals(false);
        if (space != null) where = where & t.space.equals(space);
        if (needle.isNotEmpty) {
          where = where & (t.title.ilike(pattern) | t.body.ilike(pattern));
        }
        if (sort == 'unanswered') {
          where =
              where &
              t.kind.equals(CommunityKind.question) &
              t.answerId.equals(null);
        }
        if (sort == 'meetups') {
          where =
              where & t.kind.equals(CommunityKind.meetup) & (t.endsAt > now);
        }
        return where;
      },
      orderBy: (t) => switch (sort) {
        'new' || 'unanswered' => t.createdAt.desc(),
        'meetups' => t.startsAt,
        _ => t.lastActivityAt.desc(),
      },
      limit: 30,
      offset: max(0, offset),
    );
    return [for (final row in rows) await _post(session, row, viewer)];
  }

  Future<CommunityThreadDetail> thread(Session session, int threadId) async {
    final viewer = await _memberOrNull(session);
    final row = await _visibleThread(session, threadId, viewer);
    final replies = await CommunityReply.db.find(
      session,
      where: (t) =>
          t.threadId.equals(threadId) &
          t.deleted.equals(false) &
          (t.hidden.equals(false) | t.authorId.equals(viewer?.id ?? -1)),
      orderBy: (t) => t.createdAt,
    );
    return CommunityThreadDetail(
      post: await _post(session, row, viewer),
      replies: [for (final r in replies) await _reply(session, r, viewer)],
    );
  }

  Future<CommunityPost> createThread(
    Session session,
    String space,
    CommunityKind kind,
    String title,
    String body,
    CommunityInput input,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
  ) async {
    final me = await _member(session);
    if (!spaceIds.contains(space)) {
      throw CommunityException(message: 'Choose a space for your post.');
    }
    final cleanTitle = clean(title, 'Title', 4, 120);
    var cleanBody = body.trim();
    if (kind == CommunityKind.meetup && cleanBody.isEmpty) {
      cleanBody = 'Everyone is welcome.';
    }
    cleanBody = clean(
      cleanBody,
      'Post',
      kind == CommunityKind.meetup ? 1 : 10,
      4000,
      multiline: true,
    );
    final now = clock();
    String? cleanPlace;
    String? cleanCity;
    DateTime? starts;
    DateTime? ends;
    if (kind == CommunityKind.meetup) {
      cleanPlace = clean(place ?? '', 'Place', 2, 80);
      cleanCity = clean(city ?? '', 'City', 2, 40);
      starts = startsAt?.toUtc();
      ends = endsAt?.toUtc();
      if (starts == null || ends == null) {
        throw CommunityException(message: 'Add a start and end time.');
      }
      if (starts.isBefore(now.subtract(const Duration(minutes: 15)))) {
        throw CommunityException(
          message: 'The meetup starts in the past. Pick a later time.',
        );
      }
      if (starts.isAfter(now.add(const Duration(days: 180)))) {
        throw CommunityException(
          message: 'Meetups can be planned up to six months ahead.',
        );
      }
      if (!ends.isAfter(starts) || ends.isAfter(starts.add(maxMeetup))) {
        throw CommunityException(
          message: 'A meetup ends after it starts, and lasts at most 12 hours.',
        );
      }
    }
    _limit(session, 'post', postsPerMinute);
    final row = await CommunityThread.db.insertRow(
      session,
      CommunityThread(
        space: kind == CommunityKind.meetup ? 'meetups' : space,
        kind: kind,
        title: cleanTitle,
        body: cleanBody,
        input: input,
        authorId: me.id!,
        createdAt: now,
        lastActivityAt: now,
        place: cleanPlace,
        city: cleanCity,
        startsAt: starts,
        endsAt: ends,
      ),
    );
    if (kind == CommunityKind.meetup) {
      await _setMark(
        session,
        me,
        CommunityMarkKind.going,
        CommunityTarget.thread,
        row.id!,
        true,
      );
    }
    return _post(session, row, me);
  }

  Future<CommunityPost> editThread(
    Session session,
    int threadId,
    String title,
    String body,
  ) async {
    final me = await _member(session);
    final row = await _thread(session, threadId);
    if (row.authorId != me.id) {
      throw CommunityException(message: 'You can only edit your own posts.');
    }
    final updated = await CommunityThread.db.updateRow(
      session,
      row.copyWith(
        title: clean(title, 'Title', 4, 120),
        body: clean(
          body,
          'Post',
          row.kind == CommunityKind.meetup ? 1 : 10,
          4000,
          multiline: true,
        ),
        editedAt: clock(),
      ),
    );
    final post = await _post(session, updated, me);
    await _publishPost(session, updated);
    return post;
  }

  Future<void> deleteThread(Session session, int threadId) async {
    final me = await _member(session);
    final row = await _thread(session, threadId);
    if (row.authorId != me.id) {
      throw CommunityException(message: 'You can only delete your own posts.');
    }
    final code = row.liveCode;
    await CommunityThread.db.updateRow(
      session,
      row.copyWith(deleted: true, liveCode: null),
    );
    await CommunityLiveMessage.db.deleteWhere(
      session,
      where: (t) => t.threadId.equals(threadId),
    );
    await session.messages.postMessage(
      threadChannel(threadId),
      CommunityEvent(kind: CommunityEventKind.postRemoved, targetId: threadId),
    );
    if (code != null) {
      await session.messages.postMessage(
        liveChannel(code),
        CommunityEvent(kind: CommunityEventKind.liveEnded),
      );
    }
  }

  // --- replies ----------------------------------------------------------------

  Future<CommunityReplyView> reply(
    Session session,
    int threadId,
    String body,
    CommunityInput input,
    int? quoteId,
  ) async {
    final me = await _member(session);
    final text = clean(body, 'Reply', 1, 2000, multiline: true);
    final thread = await _visibleThread(session, threadId, me);
    int? quote = quoteId;
    if (quote != null) {
      final quoted = await CommunityReply.db.findFirstRow(
        session,
        where: (t) =>
            t.id.equals(quote) &
            t.threadId.equals(threadId) &
            t.deleted.equals(false) &
            t.hidden.equals(false),
      );
      if (quoted == null) quote = null;
    }
    _limit(session, 'post', postsPerMinute);
    final now = clock();
    final row = await CommunityReply.db.insertRow(
      session,
      CommunityReply(
        threadId: threadId,
        authorId: me.id!,
        body: text,
        input: input,
        quoteId: quote,
        createdAt: now,
      ),
    );
    await CommunityThread.db.updateRow(
      session,
      thread.copyWith(lastActivityAt: now),
    );
    final view = await _reply(session, row, me);
    await session.messages.postMessage(
      threadChannel(threadId),
      CommunityEvent(
        kind: CommunityEventKind.reply,
        reply: view.copyWith(mine: false, myHelpful: false),
      ),
    );
    return view;
  }

  Future<CommunityReplyView> editReply(
    Session session,
    int replyId,
    String body,
  ) async {
    final me = await _member(session);
    final row = await _replyRow(session, replyId);
    if (row.authorId != me.id) {
      throw CommunityException(message: 'You can only edit your own replies.');
    }
    final updated = await CommunityReply.db.updateRow(
      session,
      row.copyWith(
        body: clean(body, 'Reply', 1, 2000, multiline: true),
        editedAt: clock(),
      ),
    );
    final view = await _reply(session, updated, me);
    await session.messages.postMessage(
      threadChannel(row.threadId),
      CommunityEvent(
        kind: CommunityEventKind.replyUpdated,
        reply: view.copyWith(mine: false, myHelpful: false),
      ),
    );
    return view;
  }

  Future<void> deleteReply(Session session, int replyId) async {
    final me = await _member(session);
    final row = await _replyRow(session, replyId);
    if (row.authorId != me.id) {
      throw CommunityException(
        message: 'You can only delete your own replies.',
      );
    }
    await CommunityReply.db.updateRow(session, row.copyWith(deleted: true));
    await _clearAnswer(session, row.threadId, replyId);
    await session.messages.postMessage(
      threadChannel(row.threadId),
      CommunityEvent(kind: CommunityEventKind.replyRemoved, targetId: replyId),
    );
  }

  // --- helpful, answers, reports, going -----------------------------------------

  /// Marks a post or reply as helpful (or not). Returns the new count.
  Future<int> setHelpful(
    Session session,
    CommunityTarget target,
    int id,
    bool on,
  ) async {
    final me = await _member(session);
    final (authorId, threadId) = await _targetOwner(session, target, id);
    if (authorId == me.id) {
      throw CommunityException(
        message: 'You cannot mark your own post as helpful.',
      );
    }
    await _setMark(session, me, CommunityMarkKind.helpful, target, id, on);
    final count = await _count(session, CommunityMarkKind.helpful, target, id);
    await session.messages.postMessage(
      threadChannel(threadId),
      CommunityEvent(
        kind: CommunityEventKind.helpful,
        targetId: id,
        count: count,
        post: null,
      ),
    );
    return count;
  }

  /// Reports a post or reply. Returns whether it is now hidden for everyone.
  Future<bool> report(
    Session session,
    CommunityTarget target,
    int id,
    String reason,
  ) async {
    final me = await _member(session);
    if (!reportReasons.contains(reason)) {
      throw CommunityException(message: 'Choose why you are reporting this.');
    }
    final (authorId, threadId) = await _targetOwner(session, target, id);
    if (authorId == me.id) {
      throw CommunityException(
        message: 'You cannot report your own post. You can delete it instead.',
      );
    }
    final existing = await CommunityMark.db.findFirstRow(
      session,
      where: (t) =>
          t.memberId.equals(me.id) &
          t.kind.equals(CommunityMarkKind.report) &
          t.target.equals(target) &
          t.targetId.equals(id),
    );
    if (existing == null) {
      await CommunityMark.db.insertRow(
        session,
        CommunityMark(
          memberId: me.id!,
          kind: CommunityMarkKind.report,
          target: target,
          targetId: id,
          reason: reason,
          createdAt: clock(),
        ),
      );
    }
    final count = await _count(session, CommunityMarkKind.report, target, id);
    final hidden = count >= hideAfterReports;
    if (hidden) {
      if (target == CommunityTarget.thread) {
        final row = await _thread(session, id);
        await CommunityThread.db.updateRow(session, row.copyWith(hidden: true));
        await session.messages.postMessage(
          threadChannel(id),
          CommunityEvent(kind: CommunityEventKind.postRemoved, targetId: id),
        );
      } else {
        final row = await _replyRow(session, id);
        await CommunityReply.db.updateRow(session, row.copyWith(hidden: true));
        await _clearAnswer(session, threadId, id);
        await session.messages.postMessage(
          threadChannel(threadId),
          CommunityEvent(kind: CommunityEventKind.replyRemoved, targetId: id),
        );
      }
    }
    return hidden;
  }

  Future<CommunityPost> setAnswer(
    Session session,
    int threadId,
    int? replyId,
  ) async {
    final me = await _member(session);
    final row = await _thread(session, threadId);
    if (row.authorId != me.id) {
      throw CommunityException(
        message: 'Only the person who asked can choose the answer.',
      );
    }
    if (row.kind != CommunityKind.question) {
      throw CommunityException(message: 'Only questions have answers.');
    }
    if (replyId != null) {
      final found = await CommunityReply.db.findFirstRow(
        session,
        where: (t) =>
            t.id.equals(replyId) &
            t.threadId.equals(threadId) &
            t.deleted.equals(false) &
            t.hidden.equals(false),
      );
      if (found == null) {
        throw CommunityException(
          message: 'That reply is not in this question.',
        );
      }
    }
    final updated = await CommunityThread.db.updateRow(
      session,
      row.copyWith(answerId: replyId),
    );
    await _publishPost(session, updated);
    return _post(session, updated, me);
  }

  Future<CommunityPost> setGoing(Session session, int threadId, bool on) async {
    final me = await _member(session);
    final row = await _visibleThread(session, threadId, me);
    if (row.kind != CommunityKind.meetup) {
      throw CommunityException(message: 'Only meetups have a guest list.');
    }
    await _setMark(
      session,
      me,
      CommunityMarkKind.going,
      CommunityTarget.thread,
      threadId,
      on,
    );
    await _publishPost(session, row);
    return _post(session, row, me);
  }

  // --- live meetup rooms ("Here, together") --------------------------------------

  Future<CommunityPost> startLive(Session session, int threadId) async {
    final me = await _member(session);
    await _purgeLive(session);
    var row = await _thread(session, threadId);
    if (row.kind != CommunityKind.meetup) {
      throw CommunityException(message: 'Only meetups have a live room.');
    }
    if (row.authorId != me.id) {
      throw CommunityException(
        message: 'Only the host can open the live room.',
      );
    }
    final now = clock();
    if (now.isBefore(row.startsAt!.subtract(liveOpensBefore))) {
      throw CommunityException(
        message: 'The live room opens an hour before the meetup starts.',
      );
    }
    if (!now.isBefore(row.endsAt!)) {
      throw CommunityException(message: 'This meetup has ended.');
    }
    if (row.liveCode == null) {
      for (var attempt = 0; attempt < 50; attempt++) {
        final code = (_random.nextInt(900000) + 100000).toString();
        final taken = await CommunityThread.db.findFirstRow(
          session,
          where: (t) => t.liveCode.equals(code),
        );
        if (taken != null) continue;
        row = await CommunityThread.db.updateRow(
          session,
          row.copyWith(liveCode: code),
        );
        break;
      }
    }
    await _publishPost(session, row);
    return _post(session, row, me);
  }

  Future<void> endLive(Session session, int threadId) async {
    final me = await _member(session);
    final row = await _thread(session, threadId);
    if (row.authorId != me.id) {
      throw CommunityException(message: 'Only the host can end the live room.');
    }
    final code = row.liveCode;
    await CommunityLiveMessage.db.deleteWhere(
      session,
      where: (t) => t.threadId.equals(threadId),
    );
    final updated = await CommunityThread.db.updateRow(
      session,
      row.copyWith(liveCode: null),
    );
    if (code != null) {
      await session.messages.postMessage(
        liveChannel(code),
        CommunityEvent(kind: CommunityEventKind.liveEnded),
      );
    }
    await _publishPost(session, updated);
  }

  /// The live room with this code (anyone who has the code may read it).
  Future<CommunityLiveRoom> live(Session session, String code) async {
    final viewer = await _memberOrNull(session);
    await _purgeLive(session);
    final row = await _liveThread(session, code);
    final messages = await CommunityLiveMessage.db.find(
      session,
      where: (t) => t.threadId.equals(row.id),
      orderBy: (t) => t.id.desc(),
      limit: 200,
    );
    final host = await CommunityMember.db.findById(session, row.authorId);
    return CommunityLiveRoom(
      code: row.liveCode!,
      threadId: row.id!,
      title: row.title,
      place: row.place ?? '',
      city: row.city ?? '',
      startsAt: row.startsAt!,
      endsAt: row.endsAt!,
      host: _author(host!),
      isHost: viewer?.id == row.authorId,
      messages: [
        for (final m in messages.reversed) await _liveMessage(session, m),
      ],
    );
  }

  Future<CommunityLiveMessageView> sayLive(
    Session session,
    String code,
    String text,
    CommunityInput input,
  ) async {
    final me = await _member(session);
    await _purgeLive(session);
    final message = clean(text, 'Message', 1, 280);
    final row = await _liveThread(session, code);
    _limit(session, 'live', livePerMinute);
    final saved = await CommunityLiveMessage.db.insertRow(
      session,
      CommunityLiveMessage(
        threadId: row.id!,
        authorId: me.id!,
        text: message,
        input: input,
        createdAt: clock(),
      ),
    );
    final view = await _liveMessage(session, saved);
    await session.messages.postMessage(
      liveChannel(row.liveCode!),
      CommunityEvent(kind: CommunityEventKind.liveMessage, message: view),
    );
    return view;
  }

  /// Replies, edits and helpful counts in a thread, as they happen.
  Stream<CommunityEvent> listenThread(Session session, int threadId) async* {
    final viewer = await _memberOrNull(session);
    await _visibleThread(session, threadId, viewer);
    yield* session.messages.createStream<CommunityEvent>(
      threadChannel(threadId),
    );
  }

  /// Messages in a live room, as they happen, until it ends.
  Stream<CommunityEvent> listenLive(Session session, String code) async* {
    final row = await _liveThread(session, code);
    yield* session.messages.createStream<CommunityEvent>(
      liveChannel(row.liveCode!),
    );
  }

  // --- helpers --------------------------------------------------------------------

  static String clean(
    String text,
    String field,
    int low,
    int high, {
    bool multiline = false,
  }) {
    var value = text.replaceAll('\r\n', '\n').trim();
    value = multiline
        ? value.replaceAll(RegExp(r'\n{3,}'), '\n\n')
        : value.split(RegExp(r'\s+')).join(' ');
    if (value.length < low) {
      throw CommunityException(
        message: '$field is too short. Write at least $low characters.',
      );
    }
    if (value.length > high) {
      throw CommunityException(
        message: '$field is too long. Keep it under $high characters.',
      );
    }
    return value;
  }

  /// Letters in any script (with Devanagari vowel signs), digits, and _ . - or spaces inside.
  static String cleanHandle(String handle) {
    final name = clean(handle, 'Name', 3, 24);
    final ok = RegExp(
      r'^[\p{L}\p{N}_][\p{L}\p{M}\p{N}_ .\-]{1,22}[\p{L}\p{M}\p{N}_]$',
      unicode: true,
    ).hasMatch(name);
    if (!ok) {
      throw CommunityException(
        message:
            'Use letters, numbers, spaces, dots, dashes or underscores in your name.',
      );
    }
    return name;
  }

  static String _city(String city) =>
      city.trim().isEmpty ? '' : clean(city, 'City', 2, 40);

  static List<String> _ways(List<String> list) {
    if (list.any((w) => !ways.contains(w))) {
      throw CommunityException(
        message: 'Choose how you communicate from the list.',
      );
    }
    return list.toSet().toList()..sort();
  }

  String _userId(Session session) {
    final auth = session.authenticated;
    if (auth == null) {
      throw CommunityException(message: 'Please open Parlance again.');
    }
    return auth.userIdentifier;
  }

  Future<CommunityMember?> _memberOrNull(Session session) {
    final userId = _userId(session);
    return CommunityMember.db.findFirstRow(
      session,
      where: (t) => t.userId.equals(userId),
    );
  }

  Future<CommunityMember> _member(Session session) async {
    final member = await _memberOrNull(session);
    if (member == null) {
      throw CommunityException(
        message: 'Join the community first: choose a name to post with.',
      );
    }
    return member;
  }

  void _limit(Session session, String bucket, int perMinute) {
    final key = '${_userId(session)}/$bucket';
    final now = clock();
    final stamps = (_recent[key] ?? [])
      ..removeWhere((t) => now.difference(t) >= const Duration(minutes: 1));
    if (stamps.length >= perMinute) {
      throw CommunityException(
        message: 'You are posting very fast. Wait a minute, then try again.',
      );
    }
    _recent[key] = stamps..add(now);
  }

  /// Forgets rate limits (tests).
  static void resetLimits() => _recent.clear();

  CommunityAuthor _author(CommunityMember m) => CommunityAuthor(
    id: m.id!,
    handle: m.handle,
    city: m.city,
    ways: m.ways,
    sample: m.sample,
  );

  Future<CommunityAuthor> _authorById(Session session, int id) async {
    final member = await CommunityMember.db.findById(session, id);
    return member == null
        ? CommunityAuthor(
            id: id,
            handle: 'Someone',
            city: '',
            ways: [],
            sample: false,
          )
        : _author(member);
  }

  Future<CommunityThread> _thread(Session session, int id) async {
    final row = await CommunityThread.db.findById(session, id);
    if (row == null || row.deleted) {
      throw CommunityException(
        message: 'That post was not found. It may have been deleted.',
      );
    }
    return row;
  }

  Future<CommunityThread> _visibleThread(
    Session session,
    int id,
    CommunityMember? viewer,
  ) async {
    final row = await _thread(session, id);
    if (row.hidden && viewer?.id != row.authorId) {
      throw CommunityException(
        message: 'That post was hidden after several people reported it.',
      );
    }
    return row;
  }

  Future<CommunityReply> _replyRow(Session session, int id) async {
    final row = await CommunityReply.db.findById(session, id);
    if (row == null || row.deleted) {
      throw CommunityException(
        message: 'That reply was not found. It may have been deleted.',
      );
    }
    return row;
  }

  /// (author, thread) of a post or reply.
  Future<(int, int)> _targetOwner(
    Session session,
    CommunityTarget target,
    int id,
  ) async {
    if (target == CommunityTarget.thread) {
      final row = await _thread(session, id);
      return (row.authorId, row.id!);
    }
    final row = await _replyRow(session, id);
    return (row.authorId, row.threadId);
  }

  Future<void> _clearAnswer(Session session, int threadId, int replyId) async {
    final thread = await CommunityThread.db.findById(session, threadId);
    if (thread != null && thread.answerId == replyId) {
      final updated = await CommunityThread.db.updateRow(
        session,
        thread.copyWith(answerId: null),
      );
      await _publishPost(session, updated);
    }
  }

  Future<int> _count(
    Session session,
    CommunityMarkKind kind,
    CommunityTarget target,
    int id,
  ) => CommunityMark.db.count(
    session,
    where: (t) =>
        t.kind.equals(kind) & t.target.equals(target) & t.targetId.equals(id),
  );

  Future<bool> _has(
    Session session,
    CommunityMember? viewer,
    CommunityMarkKind kind,
    CommunityTarget target,
    int id,
  ) async {
    if (viewer == null) return false;
    final found = await CommunityMark.db.findFirstRow(
      session,
      where: (t) =>
          t.memberId.equals(viewer.id) &
          t.kind.equals(kind) &
          t.target.equals(target) &
          t.targetId.equals(id),
    );
    return found != null;
  }

  Future<void> _setMark(
    Session session,
    CommunityMember me,
    CommunityMarkKind kind,
    CommunityTarget target,
    int id,
    bool on,
  ) async {
    final existing = await CommunityMark.db.findFirstRow(
      session,
      where: (t) =>
          t.memberId.equals(me.id) &
          t.kind.equals(kind) &
          t.target.equals(target) &
          t.targetId.equals(id),
    );
    if (on && existing == null) {
      await CommunityMark.db.insertRow(
        session,
        CommunityMark(
          memberId: me.id!,
          kind: kind,
          target: target,
          targetId: id,
          createdAt: clock(),
        ),
      );
    } else if (!on && existing != null) {
      await CommunityMark.db.deleteRow(session, existing);
    }
  }

  Future<CommunityPost> _post(
    Session session,
    CommunityThread row,
    CommunityMember? viewer,
  ) async {
    final mine = viewer != null && viewer.id == row.authorId;
    final replies = await CommunityReply.db.count(
      session,
      where: (t) =>
          t.threadId.equals(row.id) &
          t.deleted.equals(false) &
          t.hidden.equals(false),
    );
    CommunityMeetup? meetup;
    if (row.kind == CommunityKind.meetup) {
      final live = row.liveCode != null && row.endsAt!.isAfter(clock());
      meetup = CommunityMeetup(
        place: row.place ?? '',
        city: row.city ?? '',
        startsAt: row.startsAt!,
        endsAt: row.endsAt!,
        going: await _count(
          session,
          CommunityMarkKind.going,
          CommunityTarget.thread,
          row.id!,
        ),
        imGoing: await _has(
          session,
          viewer,
          CommunityMarkKind.going,
          CommunityTarget.thread,
          row.id!,
        ),
        live: live,
        // The code is the way in, so only the host sees it (to show at the venue).
        code: live && mine ? row.liveCode : null,
      );
    }
    return CommunityPost(
      id: row.id!,
      space: row.space,
      kind: row.kind,
      title: row.title,
      body: row.body,
      input: row.input,
      author: await _authorById(session, row.authorId),
      createdAt: row.createdAt,
      editedAt: row.editedAt,
      lastActivityAt: row.lastActivityAt,
      replyCount: replies,
      helpful: await _count(
        session,
        CommunityMarkKind.helpful,
        CommunityTarget.thread,
        row.id!,
      ),
      myHelpful: await _has(
        session,
        viewer,
        CommunityMarkKind.helpful,
        CommunityTarget.thread,
        row.id!,
      ),
      answerId: row.answerId,
      hidden: row.hidden,
      mine: mine,
      meetup: meetup,
    );
  }

  /// Tells everyone following a thread that it changed (the public view).
  Future<void> _publishPost(Session session, CommunityThread row) async {
    await session.messages.postMessage(
      threadChannel(row.id!),
      CommunityEvent(
        kind: CommunityEventKind.postUpdated,
        post: await _post(session, row, null),
      ),
    );
  }

  Future<CommunityReplyView> _reply(
    Session session,
    CommunityReply row,
    CommunityMember? viewer,
  ) async => CommunityReplyView(
    id: row.id!,
    threadId: row.threadId,
    body: row.body,
    input: row.input,
    quoteId: row.quoteId,
    author: await _authorById(session, row.authorId),
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    helpful: await _count(
      session,
      CommunityMarkKind.helpful,
      CommunityTarget.reply,
      row.id!,
    ),
    myHelpful: await _has(
      session,
      viewer,
      CommunityMarkKind.helpful,
      CommunityTarget.reply,
      row.id!,
    ),
    mine: viewer != null && viewer.id == row.authorId,
  );

  Future<CommunityLiveMessageView> _liveMessage(
    Session session,
    CommunityLiveMessage m,
  ) async => CommunityLiveMessageView(
    id: m.id!,
    text: m.text,
    input: m.input,
    author: await _authorById(session, m.authorId),
    createdAt: m.createdAt,
  );

  Future<CommunityThread> _liveThread(Session session, String code) async {
    final digits = code.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 6) {
      throw CommunityException(message: 'The code has six digits.');
    }
    final now = clock();
    final row = await CommunityThread.db.findFirstRow(
      session,
      where: (t) =>
          t.liveCode.equals(digits) &
          t.deleted.equals(false) &
          (t.endsAt > now),
    );
    if (row == null) {
      throw CommunityException(
        message: 'No live meetup has that code. Check it with the host.',
      );
    }
    return row;
  }

  /// Ends rooms whose meetup is over and deletes their messages.
  Future<void> _purgeLive(Session session) async {
    final ended = await CommunityThread.db.find(
      session,
      where: (t) => t.liveCode.notEquals(null) & (t.endsAt <= clock()),
      limit: 50,
    );
    for (final row in ended) {
      await CommunityLiveMessage.db.deleteWhere(
        session,
        where: (t) => t.threadId.equals(row.id),
      );
      await CommunityThread.db.updateRow(session, row.copyWith(liveCode: null));
      await session.messages.postMessage(
        liveChannel(row.liveCode!),
        CommunityEvent(kind: CommunityEventKind.liveEnded),
      );
    }
  }
}
