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

/// A topic area that holds threads.
abstract class CommunitySpace
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunitySpace._({
    required this.id,
    required this.title,
    required this.description,
    required this.threads,
    this.lastActivityAt,
  });

  factory CommunitySpace({
    required String id,
    required String title,
    required String description,
    required int threads,
    DateTime? lastActivityAt,
  }) = _CommunitySpaceImpl;

  factory CommunitySpace.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunitySpace(
      id: jsonSerialization['id'] as String,
      title: jsonSerialization['title'] as String,
      description: jsonSerialization['description'] as String,
      threads: jsonSerialization['threads'] as int,
      lastActivityAt: jsonSerialization['lastActivityAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(
              jsonSerialization['lastActivityAt'],
            ),
    );
  }

  String id;

  String title;

  String description;

  int threads;

  DateTime? lastActivityAt;

  /// Returns a shallow copy of this [CommunitySpace]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunitySpace copyWith({
    String? id,
    String? title,
    String? description,
    int? threads,
    DateTime? lastActivityAt = const _isc.$UndefinedDateTime(),
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunitySpace',
      'id': id,
      'title': title,
      'description': description,
      'threads': threads,
      if (lastActivityAt != null) 'lastActivityAt': lastActivityAt?.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunitySpace',
      'id': id,
      'title': title,
      'description': description,
      'threads': threads,
      if (lastActivityAt != null) 'lastActivityAt': lastActivityAt?.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _CommunitySpaceImpl extends CommunitySpace {
  _CommunitySpaceImpl({
    required String id,
    required String title,
    required String description,
    required int threads,
    DateTime? lastActivityAt,
  }) : super._(
         id: id,
         title: title,
         description: description,
         threads: threads,
         lastActivityAt: lastActivityAt,
       );

  /// Returns a shallow copy of this [CommunitySpace]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunitySpace copyWith({
    String? id,
    String? title,
    String? description,
    int? threads,
    DateTime? lastActivityAt = const _isc.$UndefinedDateTime(),
  }) {
    return CommunitySpace(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      threads: threads ?? this.threads,
      lastActivityAt: lastActivityAt is _isc.UndefinedSentinel
          ? this.lastActivityAt
          : lastActivityAt,
    );
  }
}
