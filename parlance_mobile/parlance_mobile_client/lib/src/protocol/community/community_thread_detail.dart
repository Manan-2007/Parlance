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
import '../community/community_post.dart' as _imxc34uz;
import '../community/community_reply_view.dart' as _imm73fjr;

/// A thread with its replies, oldest first.
abstract class CommunityThreadDetail
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityThreadDetail._({
    required this.post,
    required this.replies,
  });

  factory CommunityThreadDetail({
    required _imxc34uz.CommunityPost post,
    required List<_imm73fjr.CommunityReplyView> replies,
  }) = _CommunityThreadDetailImpl;

  factory CommunityThreadDetail.fromJson(
    Map<String, dynamic> jsonSerialization,
  ) {
    return CommunityThreadDetail(
      post: _ipujn8bb.Protocol().deserialize<_imxc34uz.CommunityPost>(
        jsonSerialization['post'],
      ),
      replies: _ipujn8bb.Protocol()
          .deserialize<List<_imm73fjr.CommunityReplyView>>(
            jsonSerialization['replies'],
          ),
    );
  }

  _imxc34uz.CommunityPost post;

  List<_imm73fjr.CommunityReplyView> replies;

  /// Returns a shallow copy of this [CommunityThreadDetail]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityThreadDetail copyWith({
    _imxc34uz.CommunityPost? post,
    List<_imm73fjr.CommunityReplyView>? replies,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityThreadDetail',
      'post': post.toJson(),
      'replies': replies.toJson(valueToJson: (v) => v.toJson()),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityThreadDetail',
      'post': post.toJsonForProtocol(),
      'replies': replies.toJson(valueToJson: (v) => v.toJsonForProtocol()),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _CommunityThreadDetailImpl extends CommunityThreadDetail {
  _CommunityThreadDetailImpl({
    required _imxc34uz.CommunityPost post,
    required List<_imm73fjr.CommunityReplyView> replies,
  }) : super._(
         post: post,
         replies: replies,
       );

  /// Returns a shallow copy of this [CommunityThreadDetail]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityThreadDetail copyWith({
    _imxc34uz.CommunityPost? post,
    List<_imm73fjr.CommunityReplyView>? replies,
  }) {
    return CommunityThreadDetail(
      post: post ?? this.post.copyWith(),
      replies: replies ?? this.replies.map((e0) => e0.copyWith()).toList(),
    );
  }
}
