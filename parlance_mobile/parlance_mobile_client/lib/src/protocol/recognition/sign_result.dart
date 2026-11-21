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
import '../recognition/sign_suggestion.dart' as _i2070m9z;

/// What the recogniser says after each frame (same fields as the web app's
/// recogniser messages).
abstract class SignResult
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  SignResult._({
    this.status,
    this.word,
    this.confirmed,
    this.confidence,
    this.candidate,
    this.reason,
    this.stableFor,
    this.suggestions,
    this.revision,
    this.isFinal,
    this.buffered,
    this.needed,
    this.error,
    this.frameId,
    this.automatic,
  });

  factory SignResult({
    String? status,
    String? word,
    bool? confirmed,
    double? confidence,
    String? candidate,
    String? reason,
    int? stableFor,
    List<_i2070m9z.SignSuggestion>? suggestions,
    int? revision,
    bool? isFinal,
    int? buffered,
    int? needed,
    String? error,
    int? frameId,
    List<String>? automatic,
  }) = _SignResultImpl;

  factory SignResult.fromJson(Map<String, dynamic> jsonSerialization) {
    return SignResult(
      status: jsonSerialization['status'] as String?,
      word: jsonSerialization['word'] as String?,
      confirmed: jsonSerialization['confirmed'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['confirmed']),
      confidence: (jsonSerialization['confidence'] as num?)?.toDouble(),
      candidate: jsonSerialization['candidate'] as String?,
      reason: jsonSerialization['reason'] as String?,
      stableFor: jsonSerialization['stableFor'] as int?,
      suggestions: jsonSerialization['suggestions'] == null
          ? null
          : _ipujn8bb.Protocol().deserialize<List<_i2070m9z.SignSuggestion>>(
              jsonSerialization['suggestions'],
            ),
      revision: jsonSerialization['revision'] as int?,
      isFinal: jsonSerialization['isFinal'] == null
          ? null
          : _isc.BoolJsonExtension.fromJson(jsonSerialization['isFinal']),
      buffered: jsonSerialization['buffered'] as int?,
      needed: jsonSerialization['needed'] as int?,
      error: jsonSerialization['error'] as String?,
      frameId: jsonSerialization['frameId'] as int?,
      automatic: jsonSerialization['automatic'] == null
          ? null
          : _ipujn8bb.Protocol().deserialize<List<String>>(
              jsonSerialization['automatic'],
            ),
    );
  }

  /// "ready", "listening", "reset".
  String? status;

  /// A finished, accepted word.
  String? word;

  bool? confirmed;

  double? confidence;

  /// The current best guess and why it was not accepted.
  String? candidate;

  String? reason;

  int? stableFor;

  /// Words to offer the signer when unsure.
  List<_i2070m9z.SignSuggestion>? suggestions;

  int? revision;

  /// Whether the guess is for a finished sign.
  bool? isFinal;

  int? buffered;

  int? needed;

  String? error;

  int? frameId;

  /// Words the recogniser accepts without a tap (sent with "ready").
  List<String>? automatic;

  /// Returns a shallow copy of this [SignResult]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  SignResult copyWith({
    String? status,
    String? word,
    bool? confirmed,
    double? confidence,
    String? candidate,
    String? reason,
    int? stableFor,
    List<_i2070m9z.SignSuggestion>? suggestions =
        const _isc.$UndefinedList<_i2070m9z.SignSuggestion>(),
    int? revision,
    bool? isFinal,
    int? buffered,
    int? needed,
    String? error,
    int? frameId,
    List<String>? automatic = const _isc.$UndefinedList<String>(),
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'SignResult',
      if (status != null) 'status': status,
      if (word != null) 'word': word,
      if (confirmed != null) 'confirmed': confirmed,
      if (confidence != null) 'confidence': confidence,
      if (candidate != null) 'candidate': candidate,
      if (reason != null) 'reason': reason,
      if (stableFor != null) 'stableFor': stableFor,
      if (suggestions != null)
        'suggestions': suggestions?.toJson(valueToJson: (v) => v.toJson()),
      if (revision != null) 'revision': revision,
      if (isFinal != null) 'isFinal': isFinal,
      if (buffered != null) 'buffered': buffered,
      if (needed != null) 'needed': needed,
      if (error != null) 'error': error,
      if (frameId != null) 'frameId': frameId,
      if (automatic != null) 'automatic': automatic?.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'SignResult',
      if (status != null) 'status': status,
      if (word != null) 'word': word,
      if (confirmed != null) 'confirmed': confirmed,
      if (confidence != null) 'confidence': confidence,
      if (candidate != null) 'candidate': candidate,
      if (reason != null) 'reason': reason,
      if (stableFor != null) 'stableFor': stableFor,
      if (suggestions != null)
        'suggestions': suggestions?.toJson(
          valueToJson: (v) => v.toJsonForProtocol(),
        ),
      if (revision != null) 'revision': revision,
      if (isFinal != null) 'isFinal': isFinal,
      if (buffered != null) 'buffered': buffered,
      if (needed != null) 'needed': needed,
      if (error != null) 'error': error,
      if (frameId != null) 'frameId': frameId,
      if (automatic != null) 'automatic': automatic?.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SignResultImpl extends SignResult {
  _SignResultImpl({
    String? status,
    String? word,
    bool? confirmed,
    double? confidence,
    String? candidate,
    String? reason,
    int? stableFor,
    List<_i2070m9z.SignSuggestion>? suggestions,
    int? revision,
    bool? isFinal,
    int? buffered,
    int? needed,
    String? error,
    int? frameId,
    List<String>? automatic,
  }) : super._(
         status: status,
         word: word,
         confirmed: confirmed,
         confidence: confidence,
         candidate: candidate,
         reason: reason,
         stableFor: stableFor,
         suggestions: suggestions,
         revision: revision,
         isFinal: isFinal,
         buffered: buffered,
         needed: needed,
         error: error,
         frameId: frameId,
         automatic: automatic,
       );

  /// Returns a shallow copy of this [SignResult]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  SignResult copyWith({
    Object? status = _Undefined,
    Object? word = _Undefined,
    Object? confirmed = _Undefined,
    Object? confidence = _Undefined,
    Object? candidate = _Undefined,
    Object? reason = _Undefined,
    Object? stableFor = _Undefined,
    List<_i2070m9z.SignSuggestion>? suggestions =
        const _isc.$UndefinedList<_i2070m9z.SignSuggestion>(),
    Object? revision = _Undefined,
    Object? isFinal = _Undefined,
    Object? buffered = _Undefined,
    Object? needed = _Undefined,
    Object? error = _Undefined,
    Object? frameId = _Undefined,
    List<String>? automatic = const _isc.$UndefinedList<String>(),
  }) {
    return SignResult(
      status: status is String? ? status : this.status,
      word: word is String? ? word : this.word,
      confirmed: confirmed is bool? ? confirmed : this.confirmed,
      confidence: confidence is double? ? confidence : this.confidence,
      candidate: candidate is String? ? candidate : this.candidate,
      reason: reason is String? ? reason : this.reason,
      stableFor: stableFor is int? ? stableFor : this.stableFor,
      suggestions: suggestions is _isc.UndefinedSentinel
          ? this.suggestions?.map((e0) => e0.copyWith()).toList()
          : suggestions,
      revision: revision is int? ? revision : this.revision,
      isFinal: isFinal is bool? ? isFinal : this.isFinal,
      buffered: buffered is int? ? buffered : this.buffered,
      needed: needed is int? ? needed : this.needed,
      error: error is String? ? error : this.error,
      frameId: frameId is int? ? frameId : this.frameId,
      automatic: automatic is _isc.UndefinedSentinel
          ? this.automatic?.map((e0) => e0).toList()
          : automatic,
    );
  }
}
