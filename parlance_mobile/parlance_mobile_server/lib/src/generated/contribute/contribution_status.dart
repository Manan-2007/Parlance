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

enum ContributionStatus implements _is.SerializableModel {
  /// Waiting for fluent signers to check it.
  pending,

  /// Two or more checks agreed it is this sign. Used for training.
  verified,

  /// Two or more checks said it is not this sign. Not used.
  rejected;

  static ContributionStatus fromJson(String name) {
    switch (name) {
      case 'pending':
        return ContributionStatus.pending;
      case 'verified':
        return ContributionStatus.verified;
      case 'rejected':
        return ContributionStatus.rejected;
      default:
        throw ArgumentError(
          'Value "$name" cannot be converted to "ContributionStatus"',
        );
    }
  }

  @override
  String toJson() => name;

  @override
  String toString() => name;
}
