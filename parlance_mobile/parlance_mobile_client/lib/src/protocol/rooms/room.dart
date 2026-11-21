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

/// A live conversation between phones in the same place, joined with a short code.
/// Rooms expire after a few hours and their messages are deleted with them.
abstract class Room
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  Room._({
    this.id,
    required this.code,
    DateTime? createdAt,
    required this.expiresAt,
    bool? closed,
  }) : createdAt = createdAt ?? DateTime.now(),
       closed = closed ?? false;

  factory Room({
    int? id,
    required String code,
    DateTime? createdAt,
    required DateTime expiresAt,
    bool? closed,
  }) = _RoomImpl;

  factory Room.fromJson(Map<String, dynamic> jsonSerialization) {
    return Room(
      id: jsonSerialization['id'] as int?,
      code: jsonSerialization['code'] as String,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      expiresAt: _isc.DateTimeJsonExtension.fromJson(
        jsonSerialization['expiresAt'],
      ),
      closed: jsonSerialization['closed'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['closed']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  /// Six digits, shown as a QR code and read out to whoever joins.
  String code;

  DateTime createdAt;

  DateTime expiresAt;

  bool closed;

  /// Returns a shallow copy of this [Room]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  Room copyWith({
    int? id,
    String? code,
    DateTime? createdAt,
    DateTime? expiresAt,
    bool? closed,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'Room',
      if (id != null) 'id': id,
      'code': code,
      'createdAt': createdAt.toJson(),
      'expiresAt': expiresAt.toJson(),
      'closed': closed,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'Room',
      if (id != null) 'id': id,
      'code': code,
      'createdAt': createdAt.toJson(),
      'expiresAt': expiresAt.toJson(),
      'closed': closed,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _RoomImpl extends Room {
  _RoomImpl({
    int? id,
    required String code,
    DateTime? createdAt,
    required DateTime expiresAt,
    bool? closed,
  }) : super._(
         id: id,
         code: code,
         createdAt: createdAt,
         expiresAt: expiresAt,
         closed: closed,
       );

  /// Returns a shallow copy of this [Room]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  Room copyWith({
    Object? id = _Undefined,
    String? code,
    DateTime? createdAt,
    DateTime? expiresAt,
    bool? closed,
  }) {
    return Room(
      id: id is int? ? id : this.id,
      code: code ?? this.code,
      createdAt: createdAt ?? this.createdAt,
      expiresAt: expiresAt ?? this.expiresAt,
      closed: closed ?? this.closed,
    );
  }
}
