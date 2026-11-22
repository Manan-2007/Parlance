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

/// Someone's consent to contribute signs for training the sign reader.
/// Deleted, with everything they gave, when they withdraw.
abstract class ContributionConsent
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  ContributionConsent._({
    this.id,
    required this.version,
    DateTime? givenAt,
    bool? reviewer,
  }) : givenAt = givenAt ?? DateTime.now(),
       reviewer = reviewer ?? false;

  factory ContributionConsent({
    int? id,
    required String version,
    DateTime? givenAt,
    bool? reviewer,
  }) = _ContributionConsentImpl;

  factory ContributionConsent.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionConsent(
      id: jsonSerialization['id'] as int?,
      version: jsonSerialization['version'] as String,
      givenAt: jsonSerialization['givenAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['givenAt']),
      reviewer: jsonSerialization['reviewer'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['reviewer']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  /// Which consent text they agreed to (ContributeEndpoint.consentVersion).
  String version;

  DateTime givenAt;

  /// They also check other people's signs (self-reported fluent signer).
  bool reviewer;

  /// Returns a shallow copy of this [ContributionConsent]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  ContributionConsent copyWith({
    int? id,
    String? version,
    DateTime? givenAt,
    bool? reviewer,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionConsent',
      if (id != null) 'id': id,
      'version': version,
      'givenAt': givenAt.toJson(),
      'reviewer': reviewer,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionConsent',
      if (id != null) 'id': id,
      'version': version,
      'givenAt': givenAt.toJson(),
      'reviewer': reviewer,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ContributionConsentImpl extends ContributionConsent {
  _ContributionConsentImpl({
    int? id,
    required String version,
    DateTime? givenAt,
    bool? reviewer,
  }) : super._(
         id: id,
         version: version,
         givenAt: givenAt,
         reviewer: reviewer,
       );

  /// Returns a shallow copy of this [ContributionConsent]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  ContributionConsent copyWith({
    Object? id = _Undefined,
    String? version,
    DateTime? givenAt,
    bool? reviewer,
  }) {
    return ContributionConsent(
      id: id is int? ? id : this.id,
      version: version ?? this.version,
      givenAt: givenAt ?? this.givenAt,
      reviewer: reviewer ?? this.reviewer,
    );
  }
}
