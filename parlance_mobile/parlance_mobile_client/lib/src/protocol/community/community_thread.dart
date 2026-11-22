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
import '../community/community_kind.dart' as _izt6ewmw;

/// A post that starts a conversation: a discussion, a question or a meetup.
abstract class CommunityThread
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityThread._({
    this.id,
    required this.space,
    required this.kind,
    required this.title,
    required this.body,
    required this.input,
    required this.authorId,
    DateTime? createdAt,
    this.editedAt,
    DateTime? lastActivityAt,
    this.answerId,
    bool? hidden,
    bool? deleted,
    this.place,
    this.city,
    this.startsAt,
    this.endsAt,
  }) : createdAt = createdAt ?? DateTime.now(),
       lastActivityAt = lastActivityAt ?? DateTime.now(),
       hidden = hidden ?? false,
       deleted = deleted ?? false;

  factory CommunityThread({
    int? id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required int authorId,
    DateTime? createdAt,
    DateTime? editedAt,
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
  }) = _CommunityThreadImpl;

  factory CommunityThread.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityThread(
      id: jsonSerialization['id'] as int?,
      space: jsonSerialization['space'] as String,
      kind: _izt6ewmw.CommunityKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      title: jsonSerialization['title'] as String,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      authorId: jsonSerialization['authorId'] as int,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      lastActivityAt: jsonSerialization['lastActivityAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(
              jsonSerialization['lastActivityAt'],
            ),
      answerId: jsonSerialization['answerId'] as int?,
      hidden: jsonSerialization['hidden'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['hidden']),
      deleted: jsonSerialization['deleted'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['deleted']),
      place: jsonSerialization['place'] as String?,
      city: jsonSerialization['city'] as String?,
      startsAt: jsonSerialization['startsAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['startsAt']),
      endsAt: jsonSerialization['endsAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['endsAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  String space;

  _izt6ewmw.CommunityKind kind;

  String title;

  String body;

  _iiihb1zv.CommunityInput input;

  int authorId;

  DateTime createdAt;

  DateTime? editedAt;

  DateTime lastActivityAt;

  /// The reply the asker chose as the answer (questions only).
  int? answerId;

  /// Hidden after several people reported it.
  bool hidden;

  bool deleted;

  /// Meetups only.
  String? place;

  String? city;

  DateTime? startsAt;

  DateTime? endsAt;

  /// Returns a shallow copy of this [CommunityThread]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityThread copyWith({
    int? id,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? authorId,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt = const _isc.$UndefinedDateTime(),
    DateTime? endsAt = const _isc.$UndefinedDateTime(),
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityThread',
      if (id != null) 'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'authorId': authorId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'deleted': deleted,
      if (place != null) 'place': place,
      if (city != null) 'city': city,
      if (startsAt != null) 'startsAt': startsAt?.toJson(),
      if (endsAt != null) 'endsAt': endsAt?.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityThread',
      if (id != null) 'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'authorId': authorId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'deleted': deleted,
      if (place != null) 'place': place,
      if (city != null) 'city': city,
      if (startsAt != null) 'startsAt': startsAt?.toJson(),
      if (endsAt != null) 'endsAt': endsAt?.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityThreadImpl extends CommunityThread {
  _CommunityThreadImpl({
    int? id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required int authorId,
    DateTime? createdAt,
    DateTime? editedAt,
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
  }) : super._(
         id: id,
         space: space,
         kind: kind,
         title: title,
         body: body,
         input: input,
         authorId: authorId,
         createdAt: createdAt,
         editedAt: editedAt,
         lastActivityAt: lastActivityAt,
         answerId: answerId,
         hidden: hidden,
         deleted: deleted,
         place: place,
         city: city,
         startsAt: startsAt,
         endsAt: endsAt,
       );

  /// Returns a shallow copy of this [CommunityThread]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityThread copyWith({
    Object? id = _Undefined,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? authorId,
    DateTime? createdAt,
    DateTime? editedAt = const _isc.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    Object? answerId = _Undefined,
    bool? hidden,
    bool? deleted,
    Object? place = _Undefined,
    Object? city = _Undefined,
    DateTime? startsAt = const _isc.$UndefinedDateTime(),
    DateTime? endsAt = const _isc.$UndefinedDateTime(),
  }) {
    return CommunityThread(
      id: id is int? ? id : this.id,
      space: space ?? this.space,
      kind: kind ?? this.kind,
      title: title ?? this.title,
      body: body ?? this.body,
      input: input ?? this.input,
      authorId: authorId ?? this.authorId,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _isc.UndefinedSentinel ? this.editedAt : editedAt,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      answerId: answerId is int? ? answerId : this.answerId,
      hidden: hidden ?? this.hidden,
      deleted: deleted ?? this.deleted,
      place: place is String? ? place : this.place,
      city: city is String? ? city : this.city,
      startsAt: startsAt is _isc.UndefinedSentinel ? this.startsAt : startsAt,
      endsAt: endsAt is _isc.UndefinedSentinel ? this.endsAt : endsAt,
    );
  }
}
