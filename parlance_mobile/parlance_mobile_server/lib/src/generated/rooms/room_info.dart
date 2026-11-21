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
import '../rooms/room.dart' as _ij8xg2ak;
import '../rooms/room_member.dart' as _iho9nprj;
import '../rooms/utterance.dart' as _iokymqix;

/// Returned when a phone starts or joins a room.
abstract class RoomInfo
    implements _is.SerializableModel, _is.ProtocolSerialization {
  RoomInfo._({
    required this.room,
    required this.me,
    required this.members,
    required this.history,
  });

  factory RoomInfo({
    required _ij8xg2ak.Room room,
    required _iho9nprj.RoomMember me,
    required List<_iho9nprj.RoomMember> members,
    required List<_iokymqix.Utterance> history,
  }) = _RoomInfoImpl;

  factory RoomInfo.fromJson(Map<String, dynamic> jsonSerialization) {
    return RoomInfo(
      room: _ireuocbz.Protocol().deserialize<_ij8xg2ak.Room>(
        jsonSerialization['room'],
      ),
      me: _ireuocbz.Protocol().deserialize<_iho9nprj.RoomMember>(
        jsonSerialization['me'],
      ),
      members: _ireuocbz.Protocol().deserialize<List<_iho9nprj.RoomMember>>(
        jsonSerialization['members'],
      ),
      history: _ireuocbz.Protocol().deserialize<List<_iokymqix.Utterance>>(
        jsonSerialization['history'],
      ),
    );
  }

  _ij8xg2ak.Room room;

  _iho9nprj.RoomMember me;

  List<_iho9nprj.RoomMember> members;

  /// Messages so far, oldest first.
  List<_iokymqix.Utterance> history;

  /// Returns a shallow copy of this [RoomInfo]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  RoomInfo copyWith({
    _ij8xg2ak.Room? room,
    _iho9nprj.RoomMember? me,
    List<_iho9nprj.RoomMember>? members,
    List<_iokymqix.Utterance>? history,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'RoomInfo',
      'room': room.toJson(),
      'me': me.toJson(),
      'members': members.toJson(valueToJson: (v) => v.toJson()),
      'history': history.toJson(valueToJson: (v) => v.toJson()),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'RoomInfo',
      'room': room.toJsonForProtocol(),
      'me': me.toJsonForProtocol(),
      'members': members.toJson(valueToJson: (v) => v.toJsonForProtocol()),
      'history': history.toJson(valueToJson: (v) => v.toJsonForProtocol()),
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _RoomInfoImpl extends RoomInfo {
  _RoomInfoImpl({
    required _ij8xg2ak.Room room,
    required _iho9nprj.RoomMember me,
    required List<_iho9nprj.RoomMember> members,
    required List<_iokymqix.Utterance> history,
  }) : super._(
         room: room,
         me: me,
         members: members,
         history: history,
       );

  /// Returns a shallow copy of this [RoomInfo]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  RoomInfo copyWith({
    _ij8xg2ak.Room? room,
    _iho9nprj.RoomMember? me,
    List<_iho9nprj.RoomMember>? members,
    List<_iokymqix.Utterance>? history,
  }) {
    return RoomInfo(
      room: room ?? this.room.copyWith(),
      me: me ?? this.me.copyWith(),
      members: members ?? this.members.map((e0) => e0.copyWith()).toList(),
      history: history ?? this.history.map((e0) => e0.copyWith()).toList(),
    );
  }
}
