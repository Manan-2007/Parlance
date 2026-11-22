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

enum CommunityEventKind implements _isc.SerializableModel {
  /// `reply` is set.
  reply,
  replyUpdated,

  /// `targetId` is the removed reply.
  replyRemoved,

  /// `post` is set (the public view: no host code, no personal flags).
  postUpdated,
  postRemoved,

  /// `targetId` and `count`; `post` is set when it is the thread itself.
  helpful,

  /// `message` is set.
  liveMessage,
  liveEnded;

  static CommunityEventKind fromJson(String name) {
    switch (name) {
      case 'reply':
        return CommunityEventKind.reply;
      case 'replyUpdated':
        return CommunityEventKind.replyUpdated;
      case 'replyRemoved':
        return CommunityEventKind.replyRemoved;
      case 'postUpdated':
        return CommunityEventKind.postUpdated;
      case 'postRemoved':
        return CommunityEventKind.postRemoved;
      case 'helpful':
        return CommunityEventKind.helpful;
      case 'liveMessage':
        return CommunityEventKind.liveMessage;
      case 'liveEnded':
        return CommunityEventKind.liveEnded;
      default:
        throw ArgumentError(
          'Value "$name" cannot be converted to "CommunityEventKind"',
        );
    }
  }

  @override
  String toJson() => name;

  @override
  String toString() => name;
}
