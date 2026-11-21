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

/// Which side of the conversation a phone is on.
enum MemberRole implements _is.SerializableModel {
  /// A Deaf or hard-of-hearing person who signs to the camera and reads captions.
  signer,

  /// A hearing person who speaks or types and reads the signed words.
  speaker;

  static MemberRole fromJson(String name) {
    switch (name) {
      case 'signer':
        return MemberRole.signer;
      case 'speaker':
        return MemberRole.speaker;
      default:
        throw ArgumentError(
          'Value "$name" cannot be converted to "MemberRole"',
        );
    }
  }

  @override
  String toJson() => name;

  @override
  String toString() => name;
}
