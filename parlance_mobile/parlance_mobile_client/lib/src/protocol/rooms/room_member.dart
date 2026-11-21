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

/// One phone in a room.
abstract class RoomMember
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  RoomMember._({
    this.id,
    required this.roomId,
    required this.role,
    required this.name,
    DateTime? joinedAt,
  }) : joinedAt = joinedAt ?? DateTime.now();

  factory RoomMember({
    int? id,
    required int roomId,
    required _ivyg998y.MemberRole role,
    required String name,
    DateTime? joinedAt,
  }) = _RoomMemberImpl;

  factory RoomMember.fromJson(Map<String, dynamic> jsonSerialization) {
    return RoomMember(
      id: jsonSerialization['id'] as int?,
      roomId: jsonSerialization['roomId'] as int,
      role: _ivyg998y.MemberRole.fromJson(
        (jsonSerialization['role'] as String),
      ),
      name: jsonSerialization['name'] as String,
      joinedAt: jsonSerialization['joinedAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['joinedAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int roomId;

  _ivyg998y.MemberRole role;

  /// What the other side sees, e.g. "Asha" or "Front desk".
  String name;

  DateTime joinedAt;

  /// Returns a shallow copy of this [RoomMember]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  RoomMember copyWith({
    int? id,
    int? roomId,
    _ivyg998y.MemberRole? role,
    String? name,
    DateTime? joinedAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'RoomMember',
      if (id != null) 'id': id,
      'roomId': roomId,
      'role': role.toJson(),
      'name': name,
      'joinedAt': joinedAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'RoomMember',
      if (id != null) 'id': id,
      'roomId': roomId,
      'role': role.toJson(),
      'name': name,
      'joinedAt': joinedAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _RoomMemberImpl extends RoomMember {
  _RoomMemberImpl({
    int? id,
    required int roomId,
    required _ivyg998y.MemberRole role,
    required String name,
    DateTime? joinedAt,
  }) : super._(
         id: id,
         roomId: roomId,
         role: role,
         name: name,
         joinedAt: joinedAt,
       );

  /// Returns a shallow copy of this [RoomMember]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  RoomMember copyWith({
    Object? id = _Undefined,
    int? roomId,
    _ivyg998y.MemberRole? role,
    String? name,
    DateTime? joinedAt,
  }) {
    return RoomMember(
      id: id is int? ? id : this.id,
      roomId: roomId ?? this.roomId,
      role: role ?? this.role,
      name: name ?? this.name,
      joinedAt: joinedAt ?? this.joinedAt,
    );
  }
}
