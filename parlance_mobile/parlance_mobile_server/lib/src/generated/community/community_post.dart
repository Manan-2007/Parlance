/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters
// ignore_for_file: invalid_use_of_internal_member

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:parlance_mobile_server/src/generated/protocol.dart'
    as _ireuocbz;
import 'package:serverpod/serverpod.dart' as _is;
import '../community/community_author.dart' as _i2ekm2lq;
import '../community/community_input.dart' as _iiihb1zv;
import '../community/community_kind.dart' as _izt6ewmw;
import '../community/community_meetup.dart' as _iyr7z15v;

/// A thread as one person sees it.
abstract class CommunityPost
    implements _is.SerializableModel, _is.ProtocolSerialization {
  CommunityPost._({
    required this.id,
    required this.space,
    required this.kind,
    required this.title,
    required this.body,
    required this.input,
    required this.author,
    required this.createdAt,
    this.editedAt,
    required this.lastActivityAt,
    required this.replyCount,
    required this.helpful,
    required this.myHelpful,
    this.answerId,
    required this.hidden,
    required this.mine,
    this.meetup,
  });

  factory CommunityPost({
    required int id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
    DateTime? editedAt,
    required DateTime lastActivityAt,
    required int replyCount,
    required int helpful,
    required bool myHelpful,
    int? answerId,
    required bool hidden,
    required bool mine,
    _iyr7z15v.CommunityMeetup? meetup,
  }) = _CommunityPostImpl;

  factory CommunityPost.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityPost(
      id: jsonSerialization['id'] as int,
      space: jsonSerialization['space'] as String,
      kind: _izt6ewmw.CommunityKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      title: jsonSerialization['title'] as String,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      author: _ireuocbz.Protocol().deserialize<_i2ekm2lq.CommunityAuthor>(
        jsonSerialization['author'],
      ),
      createdAt: _is.DateTimeJsonExtension.fromJson(
        jsonSerialization['createdAt'],
      ),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      lastActivityAt: _is.DateTimeJsonExtension.fromJson(
        jsonSerialization['lastActivityAt'],
      ),
      replyCount: jsonSerialization['replyCount'] as int,
      helpful: jsonSerialization['helpful'] as int,
      myHelpful: _is.BoolJsonExtension.fromJson(jsonSerialization['myHelpful']),
      answerId: jsonSerialization['answerId'] as int?,
      hidden: _is.BoolJsonExtension.fromJson(jsonSerialization['hidden']),
      mine: _is.BoolJsonExtension.fromJson(jsonSerialization['mine']),
      meetup: jsonSerialization['meetup'] == null
          ? null
          : _ireuocbz.Protocol().deserialize<_iyr7z15v.CommunityMeetup>(
              jsonSerialization['meetup'],
            ),
    );
  }

  int id;

  String space;

  _izt6ewmw.CommunityKind kind;

  String title;

  String body;

  _iiihb1zv.CommunityInput input;

  _i2ekm2lq.CommunityAuthor author;

  DateTime createdAt;

  DateTime? editedAt;

  DateTime lastActivityAt;

  int replyCount;

  int helpful;

  bool myHelpful;

  int? answerId;

  bool hidden;

  bool mine;

  _iyr7z15v.CommunityMeetup? meetup;

  /// Returns a shallow copy of this [CommunityPost]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityPost copyWith({
    int? id,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    int? replyCount,
    int? helpful,
    bool? myHelpful,
    int? answerId,
    bool? hidden,
    bool? mine,
    _iyr7z15v.CommunityMeetup? meetup = const _UndefinedCommunityPost$meetup(),
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityPost',
      'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'author': author.toJson(),
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      'replyCount': replyCount,
      'helpful': helpful,
      'myHelpful': myHelpful,
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'mine': mine,
      if (meetup != null) 'meetup': meetup?.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityPost',
      'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'author': author.toJsonForProtocol(),
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      'replyCount': replyCount,
      'helpful': helpful,
      'myHelpful': myHelpful,
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'mine': mine,
      if (meetup != null) 'meetup': meetup?.toJsonForProtocol(),
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _UndefinedCommunityPost$meetup extends _is.UndefinedSentinel
    implements _iyr7z15v.CommunityMeetup {
  const _UndefinedCommunityPost$meetup();
}

class _CommunityPostImpl extends CommunityPost {
  _CommunityPostImpl({
    required int id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
    DateTime? editedAt,
    required DateTime lastActivityAt,
    required int replyCount,
    required int helpful,
    required bool myHelpful,
    int? answerId,
    required bool hidden,
    required bool mine,
    _iyr7z15v.CommunityMeetup? meetup,
  }) : super._(
         id: id,
         space: space,
         kind: kind,
         title: title,
         body: body,
         input: input,
         author: author,
         createdAt: createdAt,
         editedAt: editedAt,
         lastActivityAt: lastActivityAt,
         replyCount: replyCount,
         helpful: helpful,
         myHelpful: myHelpful,
         answerId: answerId,
         hidden: hidden,
         mine: mine,
         meetup: meetup,
       );

  /// Returns a shallow copy of this [CommunityPost]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityPost copyWith({
    int? id,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    int? replyCount,
    int? helpful,
    bool? myHelpful,
    Object? answerId = _Undefined,
    bool? hidden,
    bool? mine,
    _iyr7z15v.CommunityMeetup? meetup = const _UndefinedCommunityPost$meetup(),
  }) {
    return CommunityPost(
      id: id ?? this.id,
      space: space ?? this.space,
      kind: kind ?? this.kind,
      title: title ?? this.title,
      body: body ?? this.body,
      input: input ?? this.input,
      author: author ?? this.author.copyWith(),
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _is.UndefinedSentinel ? this.editedAt : editedAt,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      replyCount: replyCount ?? this.replyCount,
      helpful: helpful ?? this.helpful,
      myHelpful: myHelpful ?? this.myHelpful,
      answerId: answerId is int? ? answerId : this.answerId,
      hidden: hidden ?? this.hidden,
      mine: mine ?? this.mine,
      meetup: meetup is _is.UndefinedSentinel
          ? this.meetup?.copyWith()
          : meetup,
    );
  }
}
