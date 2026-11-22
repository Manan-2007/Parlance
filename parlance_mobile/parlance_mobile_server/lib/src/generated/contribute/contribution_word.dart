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

/// A word the sign reader knows, that people can record.
abstract class ContributionWord
    implements _is.SerializableModel, _is.ProtocolSerialization {
  ContributionWord._({
    required this.key,
    required this.label,
  });

  factory ContributionWord({
    required String key,
    required String label,
  }) = _ContributionWordImpl;

  factory ContributionWord.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionWord(
      key: jsonSerialization['key'] as String,
      label: jsonSerialization['label'] as String,
    );
  }

  String key;

  String label;

  /// Returns a shallow copy of this [ContributionWord]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  ContributionWord copyWith({
    String? key,
    String? label,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionWord',
      'key': key,
      'label': label,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionWord',
      'key': key,
      'label': label,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _ContributionWordImpl extends ContributionWord {
  _ContributionWordImpl({
    required String key,
    required String label,
  }) : super._(
         key: key,
         label: label,
       );

  /// Returns a shallow copy of this [ContributionWord]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  ContributionWord copyWith({
    String? key,
    String? label,
  }) {
    return ContributionWord(
      key: key ?? this.key,
      label: label ?? this.label,
    );
  }
}
