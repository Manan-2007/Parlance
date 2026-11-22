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

/// Someone who joined the Community with a name of their choice.
abstract class CommunityMember
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityMember._({
    this.id,
    required this.handle,
    required this.city,
    required this.ways,
    bool? sample,
    DateTime? joinedAt,
  }) : sample = sample ?? false,
       joinedAt = joinedAt ?? DateTime.now();

  factory CommunityMember({
    int? id,
    required String handle,
    required String city,
    required List<String> ways,
    bool? sample,
    DateTime? joinedAt,
  }) = _CommunityMemberImpl;

  factory CommunityMember.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityMember(
      id: jsonSerialization['id'] as int?,
      handle: jsonSerialization['handle'] as String,
      city: jsonSerialization['city'] as String,
      ways: _ipujn8bb.Protocol().deserialize<List<String>>(
        jsonSerialization['ways'],
      ),
      sample: jsonSerialization['sample'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['sample']),
      joinedAt: jsonSerialization['joinedAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['joinedAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  /// The name people see. Not a real name unless they want it to be.
  String handle;

  String city;

  /// How they describe themselves: deaf, hard-of-hearing, deafblind, family, learning, interpreter, teacher.
  List<String> ways;

  /// Written by Parlance as an example, not by a real person.
  bool sample;

  DateTime joinedAt;

  /// Returns a shallow copy of this [CommunityMember]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityMember copyWith({
    int? id,
    String? handle,
    String? city,
    List<String>? ways,
    bool? sample,
    DateTime? joinedAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityMember',
      if (id != null) 'id': id,
      'handle': handle,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
      'joinedAt': joinedAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityMember',
      if (id != null) 'id': id,
      'handle': handle,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
      'joinedAt': joinedAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityMemberImpl extends CommunityMember {
  _CommunityMemberImpl({
    int? id,
    required String handle,
    required String city,
    required List<String> ways,
    bool? sample,
    DateTime? joinedAt,
  }) : super._(
         id: id,
         handle: handle,
         city: city,
         ways: ways,
         sample: sample,
         joinedAt: joinedAt,
       );

  /// Returns a shallow copy of this [CommunityMember]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityMember copyWith({
    Object? id = _Undefined,
    String? handle,
    String? city,
    List<String>? ways,
    bool? sample,
    DateTime? joinedAt,
  }) {
    return CommunityMember(
      id: id is int? ? id : this.id,
      handle: handle ?? this.handle,
      city: city ?? this.city,
      ways: ways ?? this.ways.map((e0) => e0).toList(),
      sample: sample ?? this.sample,
      joinedAt: joinedAt ?? this.joinedAt,
    );
  }
}
