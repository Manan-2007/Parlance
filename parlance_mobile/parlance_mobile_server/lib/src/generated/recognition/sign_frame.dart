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
import 'package:parlance_mobile_server/src/generated/protocol.dart'
    as _ireuocbz;
import 'package:serverpod/serverpod.dart' as _is;

/// One message from the sign camera to the recogniser: a frame of hand
/// landmarks, or a control (reset, or confirming a suggested word).
abstract class SignFrame
    implements _is.SerializableModel, _is.ProtocolSerialization {
  SignFrame._({
    this.landmarks,
    this.timestamp,
    this.frameId,
    this.reset,
    this.confirm,
    this.revision,
  });

  factory SignFrame({
    List<double>? landmarks,
    double? timestamp,
    int? frameId,
    bool? reset,
    String? confirm,
    int? revision,
  }) = _SignFrameImpl;

  factory SignFrame.fromJson(Map<String, dynamic> jsonSerialization) {
    return SignFrame(
      landmarks: jsonSerialization['landmarks'] == null
          ? null
          : _ireuocbz.Protocol().deserialize<List<double>>(
              jsonSerialization['landmarks'],
            ),
      timestamp: (jsonSerialization['timestamp'] as num?)?.toDouble(),
      frameId: jsonSerialization['frameId'] as int?,
      reset: jsonSerialization['reset'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['reset']),
      confirm: jsonSerialization['confirm'] as String?,
      revision: jsonSerialization['revision'] as int?,
    );
  }

  /// 141 numbers: two hands x 21 landmarks x (x, y, z), then 15 zeros.
  List<double>? landmarks;

  /// Milliseconds on the phone's clock; must increase.
  double? timestamp;

  int? frameId;

  /// Forget the sign in progress.
  bool? reset;

  /// A suggested word the signer tapped, with the revision it came from.
  String? confirm;

  int? revision;

  /// Returns a shallow copy of this [SignFrame]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  SignFrame copyWith({
    List<double>? landmarks = const _is.$UndefinedList<double>(),
    double? timestamp,
    int? frameId,
    bool? reset,
    String? confirm,
    int? revision,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'SignFrame',
      if (landmarks != null) 'landmarks': landmarks?.toJson(),
      if (timestamp != null) 'timestamp': timestamp,
      if (frameId != null) 'frameId': frameId,
      if (reset != null) 'reset': reset,
      if (confirm != null) 'confirm': confirm,
      if (revision != null) 'revision': revision,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'SignFrame',
      if (landmarks != null) 'landmarks': landmarks?.toJson(),
      if (timestamp != null) 'timestamp': timestamp,
      if (frameId != null) 'frameId': frameId,
      if (reset != null) 'reset': reset,
      if (confirm != null) 'confirm': confirm,
      if (revision != null) 'revision': revision,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SignFrameImpl extends SignFrame {
  _SignFrameImpl({
    List<double>? landmarks,
    double? timestamp,
    int? frameId,
    bool? reset,
    String? confirm,
    int? revision,
  }) : super._(
         landmarks: landmarks,
         timestamp: timestamp,
         frameId: frameId,
         reset: reset,
         confirm: confirm,
         revision: revision,
       );

  /// Returns a shallow copy of this [SignFrame]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  SignFrame copyWith({
    List<double>? landmarks = const _is.$UndefinedList<double>(),
    Object? timestamp = _Undefined,
    Object? frameId = _Undefined,
    Object? reset = _Undefined,
    Object? confirm = _Undefined,
    Object? revision = _Undefined,
  }) {
    return SignFrame(
      landmarks: landmarks is _is.UndefinedSentinel
          ? this.landmarks?.map((e0) => e0).toList()
          : landmarks,
      timestamp: timestamp is double? ? timestamp : this.timestamp,
      frameId: frameId is int? ? frameId : this.frameId,
      reset: reset is bool? ? reset : this.reset,
      confirm: confirm is String? ? confirm : this.confirm,
      revision: revision is int? ? revision : this.revision,
    );
  }
}
