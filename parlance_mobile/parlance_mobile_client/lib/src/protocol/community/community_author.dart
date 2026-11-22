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

/// Who wrote something, as everyone sees it.
abstract class CommunityAuthor
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityAuthor._({
    required this.id,
    required this.handle,
    required this.city,
    required this.ways,
    required this.sample,
  });

  factory CommunityAuthor({
    required int id,
    required String handle,
    required String city,
    required List<String> ways,
    required bool sample,
  }) = _CommunityAuthorImpl;

  factory CommunityAuthor.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityAuthor(
      id: jsonSerialization['id'] as int,
      handle: jsonSerialization['handle'] as String,
      city: jsonSerialization['city'] as String,
      ways: _ipujn8bb.Protocol().deserialize<List<String>>(
        jsonSerialization['ways'],
      ),
      sample: _isc.BoolJsonExtension.fromJson(jsonSerialization['sample']),
    );
  }

  int id;

  String handle;

  String city;

  List<String> ways;

  bool sample;

  /// Returns a shallow copy of this [CommunityAuthor]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityAuthor copyWith({
    int? id,
    String? handle,
    String? city,
    List<String>? ways,
    bool? sample,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityAuthor',
      'id': id,
      'handle': handle,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityAuthor',
      'id': id,
      'handle': handle,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _CommunityAuthorImpl extends CommunityAuthor {
  _CommunityAuthorImpl({
    required int id,
    required String handle,
    required String city,
    required List<String> ways,
    required bool sample,
  }) : super._(
         id: id,
         handle: handle,
         city: city,
         ways: ways,
         sample: sample,
       );

  /// Returns a shallow copy of this [CommunityAuthor]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityAuthor copyWith({
    int? id,
    String? handle,
    String? city,
    List<String>? ways,
    bool? sample,
  }) {
    return CommunityAuthor(
      id: id ?? this.id,
      handle: handle ?? this.handle,
      city: city ?? this.city,
      ways: ways ?? this.ways.map((e0) => e0).toList(),
      sample: sample ?? this.sample,
    );
  }
}
