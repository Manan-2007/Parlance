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
import 'package:serverpod_client/serverpod_client.dart' as _isc;
import '../community/community_input.dart' as _iiihb1zv;

/// A reply in a thread.
abstract class CommunityReply
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityReply._({
    this.id,
    required this.threadId,
    required this.authorId,
    required this.body,
    required this.input,
    this.quoteId,
    DateTime? createdAt,
    this.editedAt,
    bool? hidden,
    bool? deleted,
  }) : createdAt = createdAt ?? DateTime.now(),
       hidden = hidden ?? false,
       deleted = deleted ?? false;

  factory CommunityReply({
    int? id,
    required int threadId,
    required int authorId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt,
    bool? hidden,
    bool? deleted,
  }) = _CommunityReplyImpl;

  factory CommunityReply.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityReply(
      id: jsonSerialization['id'] as int?,
      threadId: jsonSerialization['threadId'] as int,
      authorId: jsonSerialization['authorId'] as int,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      quoteId: jsonSerialization['quoteId'] as int?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      hidden: jsonSerialization['hidden'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['hidden']),
      deleted: jsonSerialization['deleted'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['deleted']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int threadId;

  int authorId;

  String body;

  _iiihb1zv.CommunityInput input;

  /// The reply this one answers, if any.
  int? quoteId;

  DateTime createdAt;

  DateTime? editedAt;

  bool hidden;

  bool deleted;

  /// Returns a shallow copy of this [CommunityReply]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityReply copyWith({
    int? id,
    int? threadId,
    int? authorId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    bool? hidden,
    bool? deleted,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityReply',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'hidden': hidden,
      'deleted': deleted,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityReply',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'hidden': hidden,
      'deleted': deleted,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityReplyImpl extends CommunityReply {
  _CommunityReplyImpl({
    int? id,
    required int threadId,
    required int authorId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt,
    bool? hidden,
    bool? deleted,
  }) : super._(
         id: id,
         threadId: threadId,
         authorId: authorId,
         body: body,
         input: input,
         quoteId: quoteId,
         createdAt: createdAt,
         editedAt: editedAt,
         hidden: hidden,
         deleted: deleted,
       );

  /// Returns a shallow copy of this [CommunityReply]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityReply copyWith({
    Object? id = _Undefined,
    int? threadId,
    int? authorId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    Object? quoteId = _Undefined,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    bool? hidden,
    bool? deleted,
  }) {
    return CommunityReply(
      id: id is int? ? id : this.id,
      threadId: threadId ?? this.threadId,
      authorId: authorId ?? this.authorId,
      body: body ?? this.body,
      input: input ?? this.input,
      quoteId: quoteId is int? ? quoteId : this.quoteId,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _isc.UndefinedSentinel ? this.editedAt : editedAt,
      hidden: hidden ?? this.hidden,
      deleted: deleted ?? this.deleted,
    );
  }
}
