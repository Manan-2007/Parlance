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

/// What kind of post starts a thread.
enum CommunityKind implements _is.SerializableModel {
  discussion,

  /// The asker can mark one reply as the answer.
  question,

  /// Has a place and a time, and a live room on the day.
  meetup;

  static CommunityKind fromJson(String name) {
    switch (name) {
      case 'discussion':
        return CommunityKind.discussion;
      case 'question':
        return CommunityKind.question;
      case 'meetup':
        return CommunityKind.meetup;
      default:
        throw ArgumentError(
          'Value "$name" cannot be converted to "CommunityKind"',
        );
    }
  }

  @override
  String toJson() => name;

  @override
  String toString() => name;
}
