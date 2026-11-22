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

/// Where and when a meetup is, who is going, and its live room.
abstract class CommunityMeetup
    implements _isc.SerializableModel, _isc.ProtocolSerialization {
  CommunityMeetup._({
    required this.place,
    required this.city,
    required this.startsAt,
    required this.endsAt,
    required this.going,
    required this.imGoing,
    required this.live,
    this.code,
  });

  factory CommunityMeetup({
    required String place,
    required String city,
    required DateTime startsAt,
    required DateTime endsAt,
    required int going,
    required bool imGoing,
    required bool live,
    String? code,
  }) = _CommunityMeetupImpl;

  factory CommunityMeetup.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityMeetup(
      place: jsonSerialization['place'] as String,
      city: jsonSerialization['city'] as String,
      startsAt: _isc.DateTimeJsonExtension.fromJson(
        jsonSerialization['startsAt'],
      ),
      endsAt: _isc.DateTimeJsonExtension.fromJson(jsonSerialization['endsAt']),
      going: jsonSerialization['going'] as int,
      imGoing: _isc.BoolJsonExtension.fromJson(jsonSerialization['imGoing']),
      live: _isc.BoolJsonExtension.fromJson(jsonSerialization['live']),
      code: jsonSerialization['code'] as String?,
    );
  }

  String place;

  String city;

  DateTime startsAt;

  DateTime endsAt;

  int going;

  bool imGoing;

  bool live;

  /// The live room's code. Only the host receives it, to show at the venue.
  String? code;

  /// Returns a shallow copy of this [CommunityMeetup]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  CommunityMeetup copyWith({
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    int? going,
    bool? imGoing,
    bool? live,
    String? code,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityMeetup',
      'place': place,
      'city': city,
      'startsAt': startsAt.toJson(),
      'endsAt': endsAt.toJson(),
      'going': going,
      'imGoing': imGoing,
      'live': live,
      if (code != null) 'code': code,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityMeetup',
      'place': place,
      'city': city,
      'startsAt': startsAt.toJson(),
      'endsAt': endsAt.toJson(),
      'going': going,
      'imGoing': imGoing,
      'live': live,
      if (code != null) 'code': code,
    };
  }

  @override
  String toString() {
    return _isc.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityMeetupImpl extends CommunityMeetup {
  _CommunityMeetupImpl({
    required String place,
    required String city,
    required DateTime startsAt,
    required DateTime endsAt,
    required int going,
    required bool imGoing,
    required bool live,
    String? code,
  }) : super._(
         place: place,
         city: city,
         startsAt: startsAt,
         endsAt: endsAt,
         going: going,
         imGoing: imGoing,
         live: live,
         code: code,
       );

  /// Returns a shallow copy of this [CommunityMeetup]
  /// with some or all fields replaced by the given arguments.
  @_isc.useResult
  @override
  CommunityMeetup copyWith({
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    int? going,
    bool? imGoing,
    bool? live,
    Object? code = _Undefined,
  }) {
    return CommunityMeetup(
      place: place ?? this.place,
      city: city ?? this.city,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      going: going ?? this.going,
      imGoing: imGoing ?? this.imGoing,
      live: live ?? this.live,
      code: code is String? ? code : this.code,
    );
  }
}
