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
import '../contribute/review_verdict.dart' as _ieue4as0;

/// A fluent signer's check of someone else's contributed sign.
abstract class ContributionReview
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  ContributionReview._({
    this.id,
    required this.contributionId,
    required this.verdict,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory ContributionReview({
    int? id,
    required int contributionId,
    required _ieue4as0.ReviewVerdict verdict,
    DateTime? createdAt,
  }) = _ContributionReviewImpl;

  factory ContributionReview.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionReview(
      id: jsonSerialization['id'] as int?,
      contributionId: jsonSerialization['contributionId'] as int,
      verdict: _ieue4as0.ReviewVerdict.fromJson(
        (jsonSerialization['verdict'] as String),
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

  int contributionId;

  _ieue4as0.ReviewVerdict verdict;

  DateTime createdAt;

  /// Returns a shallow copy of this [ContributionReview]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  ContributionReview copyWith({
    int? id,
    int? contributionId,
    _ieue4as0.ReviewVerdict? verdict,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionReview',
      if (id != null) 'id': id,
      'contributionId': contributionId,
      'verdict': verdict.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionReview',
      if (id != null) 'id': id,
      'contributionId': contributionId,
      'verdict': verdict.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ContributionReviewImpl extends ContributionReview {
  _ContributionReviewImpl({
    int? id,
    required int contributionId,
    required _ieue4as0.ReviewVerdict verdict,
    DateTime? createdAt,
  }) : super._(
         id: id,
         contributionId: contributionId,
         verdict: verdict,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [ContributionReview]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  ContributionReview copyWith({
    Object? id = _Undefined,
    int? contributionId,
    _ieue4as0.ReviewVerdict? verdict,
    DateTime? createdAt,
  }) {
    return ContributionReview(
      id: id is int? ? id : this.id,
      contributionId: contributionId ?? this.contributionId,
      verdict: verdict ?? this.verdict,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
