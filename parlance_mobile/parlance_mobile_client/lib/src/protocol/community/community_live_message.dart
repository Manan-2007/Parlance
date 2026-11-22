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

/// A message in a meetup's live room. Deleted when the meetup ends.
abstract class CommunityLiveMessage
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityLiveMessage._({
    this.id,
    required this.threadId,
    required this.authorId,
    required this.text,
    required this.input,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory CommunityLiveMessage({
    int? id,
    required int threadId,
    required int authorId,
    required String text,
    required _iiihb1zv.CommunityInput input,
    DateTime? createdAt,
  }) = _CommunityLiveMessageImpl;

  factory CommunityLiveMessage.fromJson(
    Map<String, dynamic> jsonSerialization,
  ) {
    return CommunityLiveMessage(
      id: jsonSerialization['id'] as int?,
      threadId: jsonSerialization['threadId'] as int,
      authorId: jsonSerialization['authorId'] as int,
      text: jsonSerialization['text'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int threadId;

  int authorId;

  String text;

  _iiihb1zv.CommunityInput input;

  DateTime createdAt;

  /// Returns a shallow copy of this [CommunityLiveMessage]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityLiveMessage copyWith({
    int? id,
    int? threadId,
    int? authorId,
    String? text,
    _iiihb1zv.CommunityInput? input,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityLiveMessage',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'text': text,
      'input': input.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityLiveMessage',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'text': text,
      'input': input.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityLiveMessageImpl extends CommunityLiveMessage {
  _CommunityLiveMessageImpl({
    int? id,
    required int threadId,
    required int authorId,
    required String text,
    required _iiihb1zv.CommunityInput input,
    DateTime? createdAt,
  }) : super._(
         id: id,
         threadId: threadId,
         authorId: authorId,
         text: text,
         input: input,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [CommunityLiveMessage]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityLiveMessage copyWith({
    Object? id = _Undefined,
    int? threadId,
    int? authorId,
    String? text,
    _iiihb1zv.CommunityInput? input,
    DateTime? createdAt,
  }) {
    return CommunityLiveMessage(
      id: id is int? ? id : this.id,
      threadId: threadId ?? this.threadId,
      authorId: authorId ?? this.authorId,
      text: text ?? this.text,
      input: input ?? this.input,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
