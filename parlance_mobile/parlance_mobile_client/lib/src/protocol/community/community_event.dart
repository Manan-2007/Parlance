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
import '../community/community_event_kind.dart' as _i22x18is;
import '../community/community_live_message_view.dart' as _izgzlnrw;
import '../community/community_post.dart' as _imxc34uz;
import '../community/community_reply_view.dart' as _imm73fjr;

/// Something that changed in a thread or a live room, sent to everyone following it.
abstract class CommunityEvent
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityEvent._({
    required this.kind,
    this.reply,
    this.post,
    this.message,
    this.targetId,
    this.count,
  });

  factory CommunityEvent({
    required _i22x18is.CommunityEventKind kind,
    _imm73fjr.CommunityReplyView? reply,
    _imxc34uz.CommunityPost? post,
    _izgzlnrw.CommunityLiveMessageView? message,
    int? targetId,
    int? count,
  }) = _CommunityEventImpl;

  factory CommunityEvent.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityEvent(
      kind: _i22x18is.CommunityEventKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      reply: jsonSerialization['reply'] == null
          ? null
          : _ipujn8bb.Protocol().deserialize<_imm73fjr.CommunityReplyView>(
              jsonSerialization['reply'],
            ),
      post: jsonSerialization['post'] == null
          ? null
          : _ipujn8bb.Protocol().deserialize<_imxc34uz.CommunityPost>(
              jsonSerialization['post'],
            ),
      message: jsonSerialization['message'] == null
          ? null
          : _ipujn8bb.Protocol()
                .deserialize<_izgzlnrw.CommunityLiveMessageView>(
                  jsonSerialization['message'],
                ),
      targetId: jsonSerialization['targetId'] as int?,
      count: jsonSerialization['count'] as int?,
    );
  }

  _i22x18is.CommunityEventKind kind;

  _imm73fjr.CommunityReplyView? reply;

  _imxc34uz.CommunityPost? post;

  _izgzlnrw.CommunityLiveMessageView? message;

  /// The reply or post the change is about.
  int? targetId;

  /// Helpful count, or people following now (presence).
  int? count;

  /// Returns a shallow copy of this [CommunityEvent]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityEvent copyWith({
    _i22x18is.CommunityEventKind? kind,
    _imm73fjr.CommunityReplyView? reply =
        const _UndefinedCommunityEvent$reply(),
    _imxc34uz.CommunityPost? post = const _UndefinedCommunityEvent$post(),
    _izgzlnrw.CommunityLiveMessageView? message =
        const _UndefinedCommunityEvent$message(),
    int? targetId,
    int? count,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityEvent',
      'kind': kind.toJson(),
      if (reply != null) 'reply': reply?.toJson(),
      if (post != null) 'post': post?.toJson(),
      if (message != null) 'message': message?.toJson(),
      if (targetId != null) 'targetId': targetId,
      if (count != null) 'count': count,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityEvent',
      'kind': kind.toJson(),
      if (reply != null) 'reply': reply?.toJsonForProtocol(),
      if (post != null) 'post': post?.toJsonForProtocol(),
      if (message != null) 'message': message?.toJsonForProtocol(),
      if (targetId != null) 'targetId': targetId,
      if (count != null) 'count': count,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _UndefinedCommunityEvent$reply extends _isc.UndefinedSentinel
    implements _imm73fjr.CommunityReplyView {
  const _UndefinedCommunityEvent$reply();
}

class _UndefinedCommunityEvent$post extends _isc.UndefinedSentinel
    implements _imxc34uz.CommunityPost {
  const _UndefinedCommunityEvent$post();
}

class _UndefinedCommunityEvent$message extends _isc.UndefinedSentinel
    implements _izgzlnrw.CommunityLiveMessageView {
  const _UndefinedCommunityEvent$message();
}

class _CommunityEventImpl extends CommunityEvent {
  _CommunityEventImpl({
    required _i22x18is.CommunityEventKind kind,
    _imm73fjr.CommunityReplyView? reply,
    _imxc34uz.CommunityPost? post,
    _izgzlnrw.CommunityLiveMessageView? message,
    int? targetId,
    int? count,
  }) : super._(
         kind: kind,
         reply: reply,
         post: post,
         message: message,
         targetId: targetId,
         count: count,
       );

  /// Returns a shallow copy of this [CommunityEvent]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityEvent copyWith({
    _i22x18is.CommunityEventKind? kind,
    _imm73fjr.CommunityReplyView? reply =
        const _UndefinedCommunityEvent$reply(),
    _imxc34uz.CommunityPost? post = const _UndefinedCommunityEvent$post(),
    _izgzlnrw.CommunityLiveMessageView? message =
        const _UndefinedCommunityEvent$message(),
    Object? targetId = _Undefined,
    Object? count = _Undefined,
  }) {
    return CommunityEvent(
      kind: kind ?? this.kind,
      reply: reply is _isc.UndefinedSentinel ? this.reply?.copyWith() : reply,
      post: post is _isc.UndefinedSentinel ? this.post?.copyWith() : post,
      message: message is _isc.UndefinedSentinel
          ? this.message?.copyWith()
          : message,
      targetId: targetId is int? ? targetId : this.targetId,
      count: count is int? ? count : this.count,
    );
  }
}
