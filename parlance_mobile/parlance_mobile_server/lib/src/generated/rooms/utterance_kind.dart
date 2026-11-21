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

/// How a message was made.
enum UtteranceKind implements _is.SerializableModel {
  /// A word read from signing by the camera.
  sign,

  /// Speech heard by the microphone.
  speech,

  /// Typed text.
  typed,

  /// A ready-made card (emergency, clinic, counter...).
  card,

  /// A one-tap reply.
  reply;

  static UtteranceKind fromJson(String name) {
    switch (name) {
      case 'sign':
        return UtteranceKind.sign;
      case 'speech':
        return UtteranceKind.speech;
      case 'typed':
        return UtteranceKind.typed;
      case 'card':
        return UtteranceKind.card;
      case 'reply':
        return UtteranceKind.reply;
      default:
        throw ArgumentError(
          'Value "$name" cannot be converted to "UtteranceKind"',
        );
    }
  }

  @override
  String toJson() => name;

  @override
  String toString() => name;
}
