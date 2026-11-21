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
import '../rooms/member_role.dart' as _ivyg998y;
import '../rooms/utterance_kind.dart' as _i3ygd6vy;

/// Something said in a room: a signed word, speech, typed text or a card.
abstract class Utterance
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  Utterance._({
    this.id,
    required this.roomId,
    required this.memberId,
    required this.role,
    required this.kind,
    required this.text,
    this.hindi,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Utterance({
    int? id,
    required int roomId,
    required int memberId,
    required _ivyg998y.MemberRole role,
    required _i3ygd6vy.UtteranceKind kind,
    required String text,
    String? hindi,
    DateTime? createdAt,
  }) = _UtteranceImpl;

  factory Utterance.fromJson(Map<String, dynamic> jsonSerialization) {
    return Utterance(
      id: jsonSerialization['id'] as int?,
      roomId: jsonSerialization['roomId'] as int,
      memberId: jsonSerialization['memberId'] as int,
      role: _ivyg998y.MemberRole.fromJson(
        (jsonSerialization['role'] as String),
      ),
      kind: _i3ygd6vy.UtteranceKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      text: jsonSerialization['text'] as String,
      hindi: jsonSerialization['hindi'] as String?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int roomId;

  int memberId;

  _ivyg998y.MemberRole role;

  _i3ygd6vy.UtteranceKind kind;

  String text;

  /// Hindi, when the message has one (cards and replies).
  String? hindi;

  DateTime createdAt;

  /// Returns a shallow copy of this [Utterance]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  Utterance copyWith({
    int? id,
    int? roomId,
    int? memberId,
    _ivyg998y.MemberRole? role,
    _i3ygd6vy.UtteranceKind? kind,
    String? text,
    String? hindi,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'Utterance',
      if (id != null) 'id': id,
      'roomId': roomId,
      'memberId': memberId,
      'role': role.toJson(),
      'kind': kind.toJson(),
      'text': text,
      if (hindi != null) 'hindi': hindi,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'Utterance',
      if (id != null) 'id': id,
      'roomId': roomId,
      'memberId': memberId,
      'role': role.toJson(),
      'kind': kind.toJson(),
      'text': text,
      if (hindi != null) 'hindi': hindi,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _UtteranceImpl extends Utterance {
  _UtteranceImpl({
    int? id,
    required int roomId,
    required int memberId,
    required _ivyg998y.MemberRole role,
    required _i3ygd6vy.UtteranceKind kind,
    required String text,
    String? hindi,
    DateTime? createdAt,
  }) : super._(
         id: id,
         roomId: roomId,
         memberId: memberId,
         role: role,
         kind: kind,
         text: text,
         hindi: hindi,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [Utterance]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  Utterance copyWith({
    Object? id = _Undefined,
    int? roomId,
    int? memberId,
    _ivyg998y.MemberRole? role,
    _i3ygd6vy.UtteranceKind? kind,
    String? text,
    Object? hindi = _Undefined,
    DateTime? createdAt,
  }) {
    return Utterance(
      id: id is int? ? id : this.id,
      roomId: roomId ?? this.roomId,
      memberId: memberId ?? this.memberId,
      role: role ?? this.role,
      kind: kind ?? this.kind,
      text: text ?? this.text,
      hindi: hindi is String? ? hindi : this.hindi,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
