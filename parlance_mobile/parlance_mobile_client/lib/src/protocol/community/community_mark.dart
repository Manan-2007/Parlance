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
import '../community/community_mark_kind.dart' as _i92g8nq1;
import '../community/community_target.dart' as _i9cc7j0c;

/// One person's "helpful", report, or "I'm going" on a post or reply.
abstract class CommunityMark
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityMark._({
    this.id,
    required this.memberId,
    required this.kind,
    required this.target,
    required this.targetId,
    this.reason,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory CommunityMark({
    int? id,
    required int memberId,
    required _i92g8nq1.CommunityMarkKind kind,
    required _i9cc7j0c.CommunityTarget target,
    required int targetId,
    String? reason,
    DateTime? createdAt,
  }) = _CommunityMarkImpl;

  factory CommunityMark.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityMark(
      id: jsonSerialization['id'] as int?,
      memberId: jsonSerialization['memberId'] as int,
      kind: _i92g8nq1.CommunityMarkKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      target: _i9cc7j0c.CommunityTarget.fromJson(
        (jsonSerialization['target'] as String),
      ),
      targetId: jsonSerialization['targetId'] as int,
      reason: jsonSerialization['reason'] as String?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  int memberId;

  _i92g8nq1.CommunityMarkKind kind;

  _i9cc7j0c.CommunityTarget target;

  int targetId;

  /// Why it was reported (reports only).
  String? reason;

  DateTime createdAt;

  /// Returns a shallow copy of this [CommunityMark]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityMark copyWith({
    int? id,
    int? memberId,
    _i92g8nq1.CommunityMarkKind? kind,
    _i9cc7j0c.CommunityTarget? target,
    int? targetId,
    String? reason,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityMark',
      if (id != null) 'id': id,
      'memberId': memberId,
      'kind': kind.toJson(),
      'target': target.toJson(),
      'targetId': targetId,
      if (reason != null) 'reason': reason,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityMark',
      if (id != null) 'id': id,
      'memberId': memberId,
      'kind': kind.toJson(),
      'target': target.toJson(),
      'targetId': targetId,
      if (reason != null) 'reason': reason,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityMarkImpl extends CommunityMark {
  _CommunityMarkImpl({
    int? id,
    required int memberId,
    required _i92g8nq1.CommunityMarkKind kind,
    required _i9cc7j0c.CommunityTarget target,
    required int targetId,
    String? reason,
    DateTime? createdAt,
  }) : super._(
         id: id,
         memberId: memberId,
         kind: kind,
         target: target,
         targetId: targetId,
         reason: reason,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [CommunityMark]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityMark copyWith({
    Object? id = _Undefined,
    int? memberId,
    _i92g8nq1.CommunityMarkKind? kind,
    _i9cc7j0c.CommunityTarget? target,
    int? targetId,
    Object? reason = _Undefined,
    DateTime? createdAt,
  }) {
    return CommunityMark(
      id: id is int? ? id : this.id,
      memberId: memberId ?? this.memberId,
      kind: kind ?? this.kind,
      target: target ?? this.target,
      targetId: targetId ?? this.targetId,
      reason: reason is String? ? reason : this.reason,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
