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
import '../community/community_author.dart' as _i2ekm2lq;
import '../community/community_input.dart' as _iiihb1zv;

abstract class CommunityLiveMessageView
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityLiveMessageView._({
    required this.id,
    required this.text,
    required this.input,
    required this.author,
    required this.createdAt,
  });

  factory CommunityLiveMessageView({
    required int id,
    required String text,
    required _iiihb1zv.CommunityInput input,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
  }) = _CommunityLiveMessageViewImpl;

  factory CommunityLiveMessageView.fromJson(
    Map<String, dynamic> jsonSerialization,
  ) {
    return CommunityLiveMessageView(
      id: jsonSerialization['id'] as int,
      text: jsonSerialization['text'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      author: _ipujn8bb.Protocol().deserialize<_i2ekm2lq.CommunityAuthor>(
        jsonSerialization['author'],
      ),
      createdAt: _isc.DateTimeJsonExtension.fromJson(
        jsonSerialization['createdAt'],
      ),
    );
  }

  int id;

  String text;

  _iiihb1zv.CommunityInput input;

  _i2ekm2lq.CommunityAuthor author;

  DateTime createdAt;

  /// Returns a shallow copy of this [CommunityLiveMessageView]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityLiveMessageView copyWith({
    int? id,
    String? text,
    _iiihb1zv.CommunityInput? input,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityLiveMessageView',
      'id': id,
      'text': text,
      'input': input.toJson(),
      'author': author.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityLiveMessageView',
      'id': id,
      'text': text,
      'input': input.toJson(),
      'author': author.toJsonForProtocol(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _CommunityLiveMessageViewImpl extends CommunityLiveMessageView {
  _CommunityLiveMessageViewImpl({
    required int id,
    required String text,
    required _iiihb1zv.CommunityInput input,
    required _i2ekm2lq.CommunityAuthor author,
    required DateTime createdAt,
  }) : super._(
         id: id,
         text: text,
         input: input,
         author: author,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [CommunityLiveMessageView]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityLiveMessageView copyWith({
    int? id,
    String? text,
    _iiihb1zv.CommunityInput? input,
    _i2ekm2lq.CommunityAuthor? author,
    DateTime? createdAt,
  }) {
    return CommunityLiveMessageView(
      id: id ?? this.id,
      text: text ?? this.text,
      input: input ?? this.input,
      author: author ?? this.author.copyWith(),
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
