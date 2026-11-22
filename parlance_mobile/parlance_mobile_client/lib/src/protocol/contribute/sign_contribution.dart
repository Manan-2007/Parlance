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
import '../contribute/contribution_status.dart' as _ioqavim0;

/// One recorded sign: hand positions only (never video), and the word.
abstract class SignContribution
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  SignContribution._({
    this.id,
    required this.gloss,
    required this.frames,
    required this.frameCount,
    DateTime? createdAt,
    required this.status,
    int? correctVotes,
    int? wrongVotes,
  }) : createdAt = createdAt ?? DateTime.now(),
       correctVotes = correctVotes ?? 0,
       wrongVotes = wrongVotes ?? 0;

  factory SignContribution({
    int? id,
    required String gloss,
    required List<double> frames,
    required int frameCount,
    DateTime? createdAt,
    required _ioqavim0.ContributionStatus status,
    int? correctVotes,
    int? wrongVotes,
  }) = _SignContributionImpl;

  factory SignContribution.fromJson(Map<String, dynamic> jsonSerialization) {
    return SignContribution(
      id: jsonSerialization['id'] as int?,
      gloss: jsonSerialization['gloss'] as String,
      frames: _ipujn8bb.Protocol().deserialize<List<double>>(
        jsonSerialization['frames'],
      ),
      frameCount: jsonSerialization['frameCount'] as int,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _isc.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      status: _ioqavim0.ContributionStatus.fromJson(
        (jsonSerialization['status'] as String),
      ),
      correctVotes: jsonSerialization['correctVotes'] as int?,
      wrongVotes: jsonSerialization['wrongVotes'] as int?,
    );
  }

  /// The database id, set if the object has been inserted into the
  /// database or if it has been fetched from the database. Otherwise,
  /// the id will be null.
  int? id;

  /// The recogniser's word key (glossKey), e.g. "thankyou".
  String gloss;

  /// frameCount x 141 numbers, the same layout the recogniser reads.
  List<double> frames;

  int frameCount;

  DateTime createdAt;

  _ioqavim0.ContributionStatus status;

  int correctVotes;

  int wrongVotes;

  /// Returns a shallow copy of this [SignContribution]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  SignContribution copyWith({
    int? id,
    String? gloss,
    List<double>? frames,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
    int? correctVotes,
    int? wrongVotes,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'SignContribution',
      if (id != null) 'id': id,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
      'correctVotes': correctVotes,
      'wrongVotes': wrongVotes,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'SignContribution',
      if (id != null) 'id': id,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
      'correctVotes': correctVotes,
      'wrongVotes': wrongVotes,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SignContributionImpl extends SignContribution {
  _SignContributionImpl({
    int? id,
    required String gloss,
    required List<double> frames,
    required int frameCount,
    DateTime? createdAt,
    required _ioqavim0.ContributionStatus status,
    int? correctVotes,
    int? wrongVotes,
  }) : super._(
         id: id,
         gloss: gloss,
         frames: frames,
         frameCount: frameCount,
         createdAt: createdAt,
         status: status,
         correctVotes: correctVotes,
         wrongVotes: wrongVotes,
       );

  /// Returns a shallow copy of this [SignContribution]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  SignContribution copyWith({
    Object? id = _Undefined,
    String? gloss,
    List<double>? frames,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
    int? correctVotes,
    int? wrongVotes,
  }) {
    return SignContribution(
      id: id is int? ? id : this.id,
      gloss: gloss ?? this.gloss,
      frames: frames ?? this.frames.map((e0) => e0).toList(),
      frameCount: frameCount ?? this.frameCount,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      correctVotes: correctVotes ?? this.correctVotes,
      wrongVotes: wrongVotes ?? this.wrongVotes,
    );
  }
}
