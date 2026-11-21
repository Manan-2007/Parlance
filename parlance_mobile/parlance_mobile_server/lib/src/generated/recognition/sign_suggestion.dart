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
import 'package:serverpod/serverpod.dart' as _is;

abstract class SignSuggestion
    implements _is.SerializableModel, _is.ProtocolSerialization {
  SignSuggestion._({
    required this.word,
    required this.confidence,
  });

  factory SignSuggestion({
    required String word,
    required double confidence,
  }) = _SignSuggestionImpl;

  factory SignSuggestion.fromJson(Map<String, dynamic> jsonSerialization) {
    return SignSuggestion(
      word: jsonSerialization['word'] as String,
      confidence: (jsonSerialization['confidence'] as num).toDouble(),
    );
  }

  String word;

  double confidence;

  /// Returns a shallow copy of this [SignSuggestion]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  SignSuggestion copyWith({
    String? word,
    double? confidence,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'SignSuggestion',
      'word': word,
      'confidence': confidence,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'SignSuggestion',
      'word': word,
      'confidence': confidence,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _SignSuggestionImpl extends SignSuggestion {
  _SignSuggestionImpl({
    required String word,
    required double confidence,
  }) : super._(
         word: word,
         confidence: confidence,
       );

  /// Returns a shallow copy of this [SignSuggestion]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  SignSuggestion copyWith({
    String? word,
    double? confidence,
  }) {
    return SignSuggestion(
      word: word ?? this.word,
      confidence: confidence ?? this.confidence,
    );
  }
}
