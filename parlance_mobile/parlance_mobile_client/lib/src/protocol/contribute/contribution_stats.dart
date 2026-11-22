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

/// Where someone stands: consent, and what they gave.
abstract class ContributionStats
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  ContributionStats._({
    required this.consented,
    this.version,
    required this.currentVersion,
    required this.reviewer,
    required this.contributed,
    required this.verified,
    required this.pending,
    required this.reviewed,
  });

  factory ContributionStats({
    required bool consented,
    String? version,
    required String currentVersion,
    required bool reviewer,
    required int contributed,
    required int verified,
    required int pending,
    required int reviewed,
  }) = _ContributionStatsImpl;

  factory ContributionStats.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionStats(
      consented: _isc.BoolJsonExtension.fromJson(
        jsonSerialization['consented'],
      ),
      version: jsonSerialization['version'] as String?,
      currentVersion: jsonSerialization['currentVersion'] as String,
      reviewer: _isc.BoolJsonExtension.fromJson(jsonSerialization['reviewer']),
      contributed: jsonSerialization['contributed'] as int,
      verified: jsonSerialization['verified'] as int,
      pending: jsonSerialization['pending'] as int,
      reviewed: jsonSerialization['reviewed'] as int,
    );
  }

  bool consented;

  /// The consent text version they agreed to (null if none).
  String? version;

  /// The version the app must show and ask for now.
  String currentVersion;

  bool reviewer;

  int contributed;

  int verified;

  int pending;

  /// Checks they did of other people's signs.
  int reviewed;

  /// Returns a shallow copy of this [ContributionStats]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  ContributionStats copyWith({
    bool? consented,
    String? version,
    String? currentVersion,
    bool? reviewer,
    int? contributed,
    int? verified,
    int? pending,
    int? reviewed,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionStats',
      'consented': consented,
      if (version != null) 'version': version,
      'currentVersion': currentVersion,
      'reviewer': reviewer,
      'contributed': contributed,
      'verified': verified,
      'pending': pending,
      'reviewed': reviewed,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionStats',
      'consented': consented,
      if (version != null) 'version': version,
      'currentVersion': currentVersion,
      'reviewer': reviewer,
      'contributed': contributed,
      'verified': verified,
      'pending': pending,
      'reviewed': reviewed,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ContributionStatsImpl extends ContributionStats {
  _ContributionStatsImpl({
    required bool consented,
    String? version,
    required String currentVersion,
    required bool reviewer,
    required int contributed,
    required int verified,
    required int pending,
    required int reviewed,
  }) : super._(
         consented: consented,
         version: version,
         currentVersion: currentVersion,
         reviewer: reviewer,
         contributed: contributed,
         verified: verified,
         pending: pending,
         reviewed: reviewed,
       );

  /// Returns a shallow copy of this [ContributionStats]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  ContributionStats copyWith({
    bool? consented,
    Object? version = _Undefined,
    String? currentVersion,
    bool? reviewer,
    int? contributed,
    int? verified,
    int? pending,
    int? reviewed,
  }) {
    return ContributionStats(
      consented: consented ?? this.consented,
      version: version is String? ? version : this.version,
      currentVersion: currentVersion ?? this.currentVersion,
      reviewer: reviewer ?? this.reviewer,
      contributed: contributed ?? this.contributed,
      verified: verified ?? this.verified,
      pending: pending ?? this.pending,
      reviewed: reviewed ?? this.reviewed,
    );
  }
}
