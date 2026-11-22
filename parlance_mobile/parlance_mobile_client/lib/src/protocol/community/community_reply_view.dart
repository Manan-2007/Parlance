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
import 'package:parlance_mobile_client/src/protocol/protocol.dart' as _ipujn8bb;
import 'package:serverpod_client/serverpod_client.dart' as _isc;
import '../community/community_author.dart' as _i2ekm2lq;
import '../community/community_input.dart' as _iiihb1zv;

/// A reply as one person sees it.
abstract class CommunityReplyView
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityReplyView._({
    required this.id,
    required this.threadId,
    required this.body,
    required this.input,
    this.quoteId,
    required this.author,
    required this.createdAt,
    this.editedAt,
    required this.helpful,
    required this.myHelpful,
    required this.mine,
  });

  factory CommunityReplyView({
    required int id,
    required int threadId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
    DateTime? editedAt,
    required int helpful,
    required bool myHelpful,
    required bool mine,
  }) = _CommunityReplyViewImpl;

  factory CommunityReplyView.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityReplyView(
      id: jsonSerialization['id'] as int,
      threadId: jsonSerialization['threadId'] as int,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      quoteId: jsonSerialization['quoteId'] as int?,
      author: _ipujn8bb.Protocol().deserialize<_i2ekm2lq.CommunityAuthor>(
        jsonSerialization['author'],
      ),
      createdAt: _isc.DateTimeJsonExtension.fromJson(
        jsonSerialization['createdAt'],
      ),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      helpful: jsonSerialization['helpful'] as int,
      myHelpful: _isc.BoolJsonExtension.fromJson(
        jsonSerialization['myHelpful'],
      ),
      mine: _isc.BoolJsonExtension.fromJson(jsonSerialization['mine']),
    );
  }

  int id;

  int threadId;

  String body;

  _iiihb1zv.CommunityInput input;

  int? quoteId;

  _i2ekm2lq.CommunityAuthor author;

  DateTime createdAt;

  DateTime? editedAt;

  int helpful;

  bool myHelpful;

  bool mine;

  /// Returns a shallow copy of this [CommunityReplyView]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityReplyView copyWith({
    int? id,
    int? threadId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? quoteId,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    int? helpful,
    bool? myHelpful,
    bool? mine,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityReplyView',
      'id': id,
      'threadId': threadId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'author': author.toJson(),
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'helpful': helpful,
      'myHelpful': myHelpful,
      'mine': mine,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityReplyView',
      'id': id,
      'threadId': threadId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'author': author.toJsonForProtocol(),
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'helpful': helpful,
      'myHelpful': myHelpful,
      'mine': mine,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityReplyViewImpl extends CommunityReplyView {
  _CommunityReplyViewImpl({
    required int id,
    required int threadId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
    DateTime? editedAt,
    required int helpful,
    required bool myHelpful,
    required bool mine,
  }) : super._(
         id: id,
         threadId: threadId,
         body: body,
         input: input,
         quoteId: quoteId,
         author: author,
         createdAt: createdAt,
         editedAt: editedAt,
         helpful: helpful,
         myHelpful: myHelpful,
         mine: mine,
       );

  /// Returns a shallow copy of this [CommunityReplyView]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityReplyView copyWith({
    int? id,
    int? threadId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    Object? quoteId = _Undefined,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    int? helpful,
    bool? myHelpful,
    bool? mine,
  }) {
    return CommunityReplyView(
      id: id ?? this.id,
      threadId: threadId ?? this.threadId,
      body: body ?? this.body,
      input: input ?? this.input,
      quoteId: quoteId is int? ? quoteId : this.quoteId,
      author: author ?? this.author.copyWith(),
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _isc.UndefinedSentinel ? this.editedAt : editedAt,
      helpful: helpful ?? this.helpful,
      myHelpful: myHelpful ?? this.myHelpful,
      mine: mine ?? this.mine,
    );
  }
}
