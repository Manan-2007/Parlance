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
import 'package:parlance_mobile_server/src/generated/protocol.dart'
    as _ireuocbz;
import 'package:serverpod/serverpod.dart' as _is;
import '../community/community_author.dart' as _i2ekm2lq;
import '../community/community_live_message_view.dart' as _izgzlnrw;

/// A meetup's live room ("Here, together").
abstract class CommunityLiveRoom
    implements _is.SerializableModel, _is.ProtocolSerialization {
  CommunityLiveRoom._({
    required this.code,
    required this.threadId,
    required this.title,
    required this.place,
    required this.city,
    required this.startsAt,
    required this.endsAt,
    required this.host,
    required this.isHost,
    required this.messages,
  });

  factory CommunityLiveRoom({
    required String code,
    required int threadId,
    required String title,
    required String place,
    required String city,
    required DateTime startsAt,
    required DateTime endsAt,
    required _i2ekm2lq.CommunityAuthor host,
    required bool isHost,
    required List<_izgzlnrw.CommunityLiveMessageView> messages,
  }) = _CommunityLiveRoomImpl;

  factory CommunityLiveRoom.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityLiveRoom(
      code: jsonSerialization['code'] as String,
      threadId: jsonSerialization['threadId'] as int,
      title: jsonSerialization['title'] as String,
      place: jsonSerialization['place'] as String,
      city: jsonSerialization['city'] as String,
      startsAt: _is.DateTimeJsonExtension.fromJson(
        jsonSerialization['startsAt'],
      ),
      endsAt: _is.DateTimeJsonExtension.fromJson(jsonSerialization['endsAt']),
      host: _ireuocbz.Protocol().deserialize<_i2ekm2lq.CommunityAuthor>(
        jsonSerialization['host'],
      ),
      isHost: _is.BoolJsonExtension.fromJson(jsonSerialization['isHost']),
      messages: _ireuocbz.Protocol()
          .deserialize<List<_izgzlnrw.CommunityLiveMessageView>>(
            jsonSerialization['messages'],
          ),
    );
  }

  String code;

  int threadId;

  String title;

  String place;

  String city;

  DateTime startsAt;

  DateTime endsAt;

  _i2ekm2lq.CommunityAuthor host;

  bool isHost;

  /// Oldest first.
  List<_izgzlnrw.CommunityLiveMessageView> messages;

  /// Returns a shallow copy of this [CommunityLiveRoom]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityLiveRoom copyWith({
    String? code,
    int? threadId,
    String? title,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    _i2ekm2lq.CommunityAuthor? host,
    bool? isHost,
    List<_izgzlnrw.CommunityLiveMessageView>? messages,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityLiveRoom',
      'code': code,
      'threadId': threadId,
      'title': title,
      'place': place,
      'city': city,
      'startsAt': startsAt.toJson(),
      'endsAt': endsAt.toJson(),
      'host': host.toJson(),
      'isHost': isHost,
      'messages': messages.toJson(valueToJson: (v) => v.toJson()),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityLiveRoom',
      'code': code,
      'threadId': threadId,
      'title': title,
      'place': place,
      'city': city,
      'startsAt': startsAt.toJson(),
      'endsAt': endsAt.toJson(),
      'host': host.toJsonForProtocol(),
      'isHost': isHost,
      'messages': messages.toJson(valueToJson: (v) => v.toJsonForProtocol()),
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _CommunityLiveRoomImpl extends CommunityLiveRoom {
  _CommunityLiveRoomImpl({
    required String code,
    required int threadId,
    required String title,
    required String place,
    required String city,
    required DateTime startsAt,
    required DateTime endsAt,
    required _i2ekm2lq.CommunityAuthor host,
    required bool isHost,
    required List<_izgzlnrw.CommunityLiveMessageView> messages,
  }) : super._(
         code: code,
         threadId: threadId,
         title: title,
         place: place,
         city: city,
         startsAt: startsAt,
         endsAt: endsAt,
         host: host,
         isHost: isHost,
         messages: messages,
       );

  /// Returns a shallow copy of this [CommunityLiveRoom]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityLiveRoom copyWith({
    String? code,
    int? threadId,
    String? title,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    _i2ekm2lq.CommunityAuthor? host,
    bool? isHost,
    List<_izgzlnrw.CommunityLiveMessageView>? messages,
  }) {
    return CommunityLiveRoom(
      code: code ?? this.code,
      threadId: threadId ?? this.threadId,
      title: title ?? this.title,
      place: place ?? this.place,
      city: city ?? this.city,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      host: host ?? this.host.copyWith(),
      isHost: isHost ?? this.isHost,
      messages: messages ?? this.messages.map((e0) => e0.copyWith()).toList(),
    );
  }
}
