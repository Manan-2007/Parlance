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
import '../rooms/room_event_kind.dart' as _i036xyk5;
import '../rooms/room_member.dart' as _iho9nprj;
import '../rooms/utterance.dart' as _iokymqix;

/// What every phone in a room receives, live.
abstract class RoomEvent
    implements _is.SerializableModel, _is.ProtocolSerialization {
  RoomEvent._({
    required this.kind,
    this.member,
    this.utterance,
    this.live,
  });

  factory RoomEvent({
    required _i036xyk5.RoomEventKind kind,
    _iho9nprj.RoomMember? member,
    _iokymqix.Utterance? utterance,
    String? live,
  }) = _RoomEventImpl;

  factory RoomEvent.fromJson(Map<String, dynamic> jsonSerialization) {
    return RoomEvent(
      kind: _i036xyk5.RoomEventKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      member: jsonSerialization['member'] == null
          ? null
          : _ireuocbz.Protocol().deserialize<_iho9nprj.RoomMember>(
              jsonSerialization['member'],
            ),
      utterance: jsonSerialization['utterance'] == null
          ? null
          : _ireuocbz.Protocol().deserialize<_iokymqix.Utterance>(
              jsonSerialization['utterance'],
            ),
      live: jsonSerialization['live'] as String?,
    );
  }

  _i036xyk5.RoomEventKind kind;

  _iho9nprj.RoomMember? member;

  _iokymqix.Utterance? utterance;

  /// Words in progress ("hel...", or a sign the camera is still reading).
  String? live;

  /// Returns a shallow copy of this [RoomEvent]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  RoomEvent copyWith({
    _i036xyk5.RoomEventKind? kind,
    _iho9nprj.RoomMember? member = const _UndefinedRoomEvent$member(),
    _iokymqix.Utterance? utterance = const _UndefinedRoomEvent$utterance(),
    String? live,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'RoomEvent',
      'kind': kind.toJson(),
      if (member != null) 'member': member?.toJson(),
      if (utterance != null) 'utterance': utterance?.toJson(),
      if (live != null) 'live': live,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'RoomEvent',
      'kind': kind.toJson(),
      if (member != null) 'member': member?.toJsonForProtocol(),
      if (utterance != null) 'utterance': utterance?.toJsonForProtocol(),
      if (live != null) 'live': live,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _UndefinedRoomEvent$member extends _is.UndefinedSentinel
    implements _iho9nprj.RoomMember {
  const _UndefinedRoomEvent$member();
}

class _UndefinedRoomEvent$utterance extends _is.UndefinedSentinel
    implements _iokymqix.Utterance {
  const _UndefinedRoomEvent$utterance();
}

class _RoomEventImpl extends RoomEvent {
  _RoomEventImpl({
    required _i036xyk5.RoomEventKind kind,
    _iho9nprj.RoomMember? member,
    _iokymqix.Utterance? utterance,
    String? live,
  }) : super._(
         kind: kind,
         member: member,
         utterance: utterance,
         live: live,
       );

  /// Returns a shallow copy of this [RoomEvent]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  RoomEvent copyWith({
    _i036xyk5.RoomEventKind? kind,
    _iho9nprj.RoomMember? member = const _UndefinedRoomEvent$member(),
    _iokymqix.Utterance? utterance = const _UndefinedRoomEvent$utterance(),
    Object? live = _Undefined,
  }) {
    return RoomEvent(
      kind: kind ?? this.kind,
      member: member is _is.UndefinedSentinel
          ? this.member?.copyWith()
          : member,
      utterance: utterance is _is.UndefinedSentinel
          ? this.utterance?.copyWith()
          : utterance,
      live: live is String? ? live : this.live,
    );
  }
}
