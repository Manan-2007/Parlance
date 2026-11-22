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
import '../contribute/contribution_status.dart' as _ioqavim0;

/// One of my contributed signs, as I see it.
abstract class ContributionSummary
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  ContributionSummary._({
    required this.id,
    required this.gloss,
    required this.frameCount,
    required this.createdAt,
    required this.status,
  });

  factory ContributionSummary({
    required int id,
    required String gloss,
    required int frameCount,
    required DateTime createdAt,
    required _ioqavim0.ContributionStatus status,
  }) = _ContributionSummaryImpl;

  factory ContributionSummary.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionSummary(
      id: jsonSerialization['id'] as int,
      gloss: jsonSerialization['gloss'] as String,
      frameCount: jsonSerialization['frameCount'] as int,
      createdAt: _isc.DateTimeJsonExtension.fromJson(
        jsonSerialization['createdAt'],
      ),
      status: _ioqavim0.ContributionStatus.fromJson(
        (jsonSerialization['status'] as String),
      ),
    );
  }

  int id;

  String gloss;

  int frameCount;

  DateTime createdAt;

  _ioqavim0.ContributionStatus status;

  /// Returns a shallow copy of this [ContributionSummary]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  ContributionSummary copyWith({
    int? id,
    String? gloss,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionSummary',
      'id': id,
      'gloss': gloss,
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionSummary',
      'id': id,
      'gloss': gloss,
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _ContributionSummaryImpl extends ContributionSummary {
  _ContributionSummaryImpl({
    required int id,
    required String gloss,
    required int frameCount,
    required DateTime createdAt,
    required _ioqavim0.ContributionStatus status,
  }) : super._(
         id: id,
         gloss: gloss,
         frameCount: frameCount,
         createdAt: createdAt,
         status: status,
       );

  /// Returns a shallow copy of this [ContributionSummary]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  ContributionSummary copyWith({
    int? id,
    String? gloss,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
  }) {
    return ContributionSummary(
      id: id ?? this.id,
      gloss: gloss ?? this.gloss,
      frameCount: frameCount ?? this.frameCount,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
    );
  }
}
