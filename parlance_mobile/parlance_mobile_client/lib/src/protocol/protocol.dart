/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters
// ignore_for_file: invalid_use_of_internal_member
// ignore_for_file: dead_code, unnecessary_type_check

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:parlance_mobile_client/src/protocol/community/community_post.dart'
    as _i8e19teb;
import 'package:parlance_mobile_client/src/protocol/community/community_space.dart'
    as _i4zztl7n;
import 'package:serverpod_auth_core_client/serverpod_auth_core_client.dart'
    as _iacc;
import 'package:serverpod_auth_idp_client/serverpod_auth_idp_client.dart'
    as _iaic;
import 'package:serverpod_client/serverpod_client.dart' as _isc;
import 'community/community_author.dart' as _iegt1a7r;
import 'community/community_event.dart' as _ihb63zbz;
import 'community/community_event_kind.dart' as _ior3acp8;
import 'community/community_exception.dart' as _if5j8mqy;
import 'community/community_input.dart' as _i2t68c8j;
import 'community/community_kind.dart' as _ihuc1ngq;
import 'community/community_live_message.dart' as _i09av78f;
import 'community/community_live_message_view.dart' as _iru20fru;
import 'community/community_live_room.dart' as _i82ndp9n;
import 'community/community_mark.dart' as _i7vfxpt9;
import 'community/community_mark_kind.dart' as _iuqhq7xc;
import 'community/community_meetup.dart' as _ihmjr1od;
import 'community/community_member.dart' as _i5de81vi;
import 'community/community_post.dart' as _ikoxh2u0;
import 'community/community_reply.dart' as _id1r7uxk;
import 'community/community_reply_view.dart' as _igoe6lh9;
import 'community/community_space.dart' as _ixgpxqr0;
import 'community/community_target.dart' as _ik04a096;
import 'community/community_thread.dart' as _iq9mmxki;
import 'community/community_thread_detail.dart' as _intovxsm;
import 'config/app_settings.dart' as _i0thufz6;
import 'greetings/greeting.dart' as _izw8z7ou;
import 'recognition/sign_frame.dart' as _igp1gr56;
import 'recognition/sign_result.dart' as _i7e9t1p9;
import 'recognition/sign_suggestion.dart' as _i64yj8ms;
import 'rooms/member_role.dart' as _iqfxuo8h;
import 'rooms/room.dart' as _ix383f3m;
import 'rooms/room_event.dart' as _i2zch034;
import 'rooms/room_event_kind.dart' as _imqsw82k;
import 'rooms/room_exception.dart' as _ivgvjqjf;
import 'rooms/room_info.dart' as _i8t1omy8;
import 'rooms/room_member.dart' as _izcbgdsw;
import 'rooms/utterance.dart' as _i0zwdlr4;
import 'rooms/utterance_kind.dart' as _i6sm9ai0;
export 'community/community_author.dart';
export 'community/community_event.dart';
export 'community/community_event_kind.dart';
export 'community/community_exception.dart';
export 'community/community_input.dart';
export 'community/community_kind.dart';
export 'community/community_live_message.dart';
export 'community/community_live_message_view.dart';
export 'community/community_live_room.dart';
export 'community/community_mark.dart';
export 'community/community_mark_kind.dart';
export 'community/community_meetup.dart';
export 'community/community_member.dart';
export 'community/community_post.dart';
export 'community/community_reply.dart';
export 'community/community_reply_view.dart';
export 'community/community_space.dart';
export 'community/community_target.dart';
export 'community/community_thread.dart';
export 'community/community_thread_detail.dart';
export 'config/app_settings.dart';
export 'greetings/greeting.dart';
export 'recognition/sign_frame.dart';
export 'recognition/sign_result.dart';
export 'recognition/sign_suggestion.dart';
export 'rooms/member_role.dart';
export 'rooms/room.dart';
export 'rooms/room_event.dart';
export 'rooms/room_event_kind.dart';
export 'rooms/room_exception.dart';
export 'rooms/room_info.dart';
export 'rooms/room_member.dart';
export 'rooms/utterance.dart';
export 'rooms/utterance_kind.dart';
export 'client.dart';

class Protocol extends _isc.SerializationManager
    implements _isc.ProtocolDeserializationProvider {
  Protocol._();

  factory Protocol() => _instance;

  static final Protocol _instance = Protocol._().._registerHostProtocols();

  @override
  _isc.ProtocolDeserialization get deserializationMetadata =>
      _isc.ProtocolDeserialization.cached(
        this,
        types: const [
          _isc.getType<_iegt1a7r.CommunityAuthor>,
          _isc.getType<_ihb63zbz.CommunityEvent>,
          _isc.getType<_ior3acp8.CommunityEventKind>,
          _isc.getType<_if5j8mqy.CommunityException>,
          _isc.getType<_i2t68c8j.CommunityInput>,
          _isc.getType<_ihuc1ngq.CommunityKind>,
          _isc.getType<_i09av78f.CommunityLiveMessage>,
          _isc.getType<_iru20fru.CommunityLiveMessageView>,
          _isc.getType<_i82ndp9n.CommunityLiveRoom>,
          _isc.getType<_i7vfxpt9.CommunityMark>,
          _isc.getType<_iuqhq7xc.CommunityMarkKind>,
          _isc.getType<_ihmjr1od.CommunityMeetup>,
          _isc.getType<_i5de81vi.CommunityMember>,
          _isc.getType<_ikoxh2u0.CommunityPost>,
          _isc.getType<_id1r7uxk.CommunityReply>,
          _isc.getType<_igoe6lh9.CommunityReplyView>,
          _isc.getType<_ixgpxqr0.CommunitySpace>,
          _isc.getType<_ik04a096.CommunityTarget>,
          _isc.getType<_iq9mmxki.CommunityThread>,
          _isc.getType<_intovxsm.CommunityThreadDetail>,
          _isc.getType<_i0thufz6.AppSettings>,
          _isc.getType<_izw8z7ou.Greeting>,
          _isc.getType<_igp1gr56.SignFrame>,
          _isc.getType<_i7e9t1p9.SignResult>,
          _isc.getType<_i64yj8ms.SignSuggestion>,
          _isc.getType<_iqfxuo8h.MemberRole>,
          _isc.getType<_ix383f3m.Room>,
          _isc.getType<_i2zch034.RoomEvent>,
          _isc.getType<_imqsw82k.RoomEventKind>,
          _isc.getType<_ivgvjqjf.RoomException>,
          _isc.getType<_i8t1omy8.RoomInfo>,
          _isc.getType<_izcbgdsw.RoomMember>,
          _isc.getType<_i0zwdlr4.Utterance>,
          _isc.getType<_i6sm9ai0.UtteranceKind>,
          _isc.getType<_iegt1a7r.CommunityAuthor?>,
          _isc.getType<_ihb63zbz.CommunityEvent?>,
          _isc.getType<_ior3acp8.CommunityEventKind?>,
          _isc.getType<_if5j8mqy.CommunityException?>,
          _isc.getType<_i2t68c8j.CommunityInput?>,
          _isc.getType<_ihuc1ngq.CommunityKind?>,
          _isc.getType<_i09av78f.CommunityLiveMessage?>,
          _isc.getType<_iru20fru.CommunityLiveMessageView?>,
          _isc.getType<_i82ndp9n.CommunityLiveRoom?>,
          _isc.getType<_i7vfxpt9.CommunityMark?>,
          _isc.getType<_iuqhq7xc.CommunityMarkKind?>,
          _isc.getType<_ihmjr1od.CommunityMeetup?>,
          _isc.getType<_i5de81vi.CommunityMember?>,
          _isc.getType<_ikoxh2u0.CommunityPost?>,
          _isc.getType<_id1r7uxk.CommunityReply?>,
          _isc.getType<_igoe6lh9.CommunityReplyView?>,
          _isc.getType<_ixgpxqr0.CommunitySpace?>,
          _isc.getType<_ik04a096.CommunityTarget?>,
          _isc.getType<_iq9mmxki.CommunityThread?>,
          _isc.getType<_intovxsm.CommunityThreadDetail?>,
          _isc.getType<_i0thufz6.AppSettings?>,
          _isc.getType<_izw8z7ou.Greeting?>,
          _isc.getType<_igp1gr56.SignFrame?>,
          _isc.getType<_i7e9t1p9.SignResult?>,
          _isc.getType<_i64yj8ms.SignSuggestion?>,
          _isc.getType<_iqfxuo8h.MemberRole?>,
          _isc.getType<_ix383f3m.Room?>,
          _isc.getType<_i2zch034.RoomEvent?>,
          _isc.getType<_imqsw82k.RoomEventKind?>,
          _isc.getType<_ivgvjqjf.RoomException?>,
          _isc.getType<_i8t1omy8.RoomInfo?>,
          _isc.getType<_izcbgdsw.RoomMember?>,
          _isc.getType<_i0zwdlr4.Utterance?>,
          _isc.getType<_i6sm9ai0.UtteranceKind?>,
          _isc.getType<List<String>>,
          _isc.getType<List<_iru20fru.CommunityLiveMessageView>>,
          _isc.getType<List<_igoe6lh9.CommunityReplyView>>,
          _isc.getType<List<double>>,
          _isc.getType<List<double>?>,
          _isc.getType<List<_i64yj8ms.SignSuggestion>>,
          _isc.getType<List<_i64yj8ms.SignSuggestion>?>,
          _isc.getType<List<String>?>,
          _isc.getType<List<_izcbgdsw.RoomMember>>,
          _isc.getType<List<_i0zwdlr4.Utterance>>,
          _isc.getType<List<String>>,
          _isc.getType<List<_i4zztl7n.CommunitySpace>>,
          _isc.getType<List<_i8e19teb.CommunityPost>>,
        ],
        modules: const [
          _iaic.Protocol.new,
          _iacc.Protocol.new,
        ],
        classNames: const [
          'CommunityAuthor',
          'CommunityEvent',
          'CommunityEventKind',
          'CommunityException',
          'CommunityInput',
          'CommunityKind',
          'CommunityLiveMessage',
          'CommunityLiveMessageView',
          'CommunityLiveRoom',
          'CommunityMark',
          'CommunityMarkKind',
          'CommunityMeetup',
          'CommunityMember',
          'CommunityPost',
          'CommunityReply',
          'CommunityReplyView',
          'CommunitySpace',
          'CommunityTarget',
          'CommunityThread',
          'CommunityThreadDetail',
          'AppSettings',
          'Greeting',
          'SignFrame',
          'SignResult',
          'SignSuggestion',
          'MemberRole',
          'Room',
          'RoomEvent',
          'RoomEventKind',
          'RoomException',
          'RoomInfo',
          'RoomMember',
          'Utterance',
          'UtteranceKind',
        ],
      );

  static String? getClassNameFromObjectJson(dynamic data) =>
      _isc.ProtocolDeserialization.readClassName(data);

  @override
  T deserialize<T>(
    dynamic data, [
    Type? t,
  ]) {
    t ??= T;
    final rawDataClassName = _isc.ProtocolDeserialization.readClassName(data);
    final dataClassName = rawDataClassName;
    if (dataClassName != null && dataClassName != getClassNameForType(t)) {
      try {
        return deserializeByClassName({
          'className': dataClassName,
          'data': data,
        });
      } on _isc.DeserializationClassNameNotFoundException catch (_) {
        // If the className is not recognized (e.g., older client receiving
        // data with a new subtype), fall back to deserializing without the
        // className, using the expected type T.
      }
    }

    if (t == _iegt1a7r.CommunityAuthor) {
      return _iegt1a7r.CommunityAuthor.fromJson(data) as T;
    }
    if (t == _ihb63zbz.CommunityEvent) {
      return _ihb63zbz.CommunityEvent.fromJson(data) as T;
    }
    if (t == _ior3acp8.CommunityEventKind) {
      return _ior3acp8.CommunityEventKind.fromJson(data) as T;
    }
    if (t == _if5j8mqy.CommunityException) {
      return _if5j8mqy.CommunityException.fromJson(data) as T;
    }
    if (t == _i2t68c8j.CommunityInput) {
      return _i2t68c8j.CommunityInput.fromJson(data) as T;
    }
    if (t == _ihuc1ngq.CommunityKind) {
      return _ihuc1ngq.CommunityKind.fromJson(data) as T;
    }
    if (t == _i09av78f.CommunityLiveMessage) {
      return _i09av78f.CommunityLiveMessage.fromJson(data) as T;
    }
    if (t == _iru20fru.CommunityLiveMessageView) {
      return _iru20fru.CommunityLiveMessageView.fromJson(data) as T;
    }
    if (t == _i82ndp9n.CommunityLiveRoom) {
      return _i82ndp9n.CommunityLiveRoom.fromJson(data) as T;
    }
    if (t == _i7vfxpt9.CommunityMark) {
      return _i7vfxpt9.CommunityMark.fromJson(data) as T;
    }
    if (t == _iuqhq7xc.CommunityMarkKind) {
      return _iuqhq7xc.CommunityMarkKind.fromJson(data) as T;
    }
    if (t == _ihmjr1od.CommunityMeetup) {
      return _ihmjr1od.CommunityMeetup.fromJson(data) as T;
    }
    if (t == _i5de81vi.CommunityMember) {
      return _i5de81vi.CommunityMember.fromJson(data) as T;
    }
    if (t == _ikoxh2u0.CommunityPost) {
      return _ikoxh2u0.CommunityPost.fromJson(data) as T;
    }
    if (t == _id1r7uxk.CommunityReply) {
      return _id1r7uxk.CommunityReply.fromJson(data) as T;
    }
    if (t == _igoe6lh9.CommunityReplyView) {
      return _igoe6lh9.CommunityReplyView.fromJson(data) as T;
    }
    if (t == _ixgpxqr0.CommunitySpace) {
      return _ixgpxqr0.CommunitySpace.fromJson(data) as T;
    }
    if (t == _ik04a096.CommunityTarget) {
      return _ik04a096.CommunityTarget.fromJson(data) as T;
    }
    if (t == _iq9mmxki.CommunityThread) {
      return _iq9mmxki.CommunityThread.fromJson(data) as T;
    }
    if (t == _intovxsm.CommunityThreadDetail) {
      return _intovxsm.CommunityThreadDetail.fromJson(data) as T;
    }
    if (t == _i0thufz6.AppSettings) {
      return _i0thufz6.AppSettings.fromJson(data) as T;
    }
    if (t == _izw8z7ou.Greeting) {
      return _izw8z7ou.Greeting.fromJson(data) as T;
    }
    if (t == _igp1gr56.SignFrame) {
      return _igp1gr56.SignFrame.fromJson(data) as T;
    }
    if (t == _i7e9t1p9.SignResult) {
      return _i7e9t1p9.SignResult.fromJson(data) as T;
    }
    if (t == _i64yj8ms.SignSuggestion) {
      return _i64yj8ms.SignSuggestion.fromJson(data) as T;
    }
    if (t == _iqfxuo8h.MemberRole) {
      return _iqfxuo8h.MemberRole.fromJson(data) as T;
    }
    if (t == _ix383f3m.Room) {
      return _ix383f3m.Room.fromJson(data) as T;
    }
    if (t == _i2zch034.RoomEvent) {
      return _i2zch034.RoomEvent.fromJson(data) as T;
    }
    if (t == _imqsw82k.RoomEventKind) {
      return _imqsw82k.RoomEventKind.fromJson(data) as T;
    }
    if (t == _ivgvjqjf.RoomException) {
      return _ivgvjqjf.RoomException.fromJson(data) as T;
    }
    if (t == _i8t1omy8.RoomInfo) {
      return _i8t1omy8.RoomInfo.fromJson(data) as T;
    }
    if (t == _izcbgdsw.RoomMember) {
      return _izcbgdsw.RoomMember.fromJson(data) as T;
    }
    if (t == _i0zwdlr4.Utterance) {
      return _i0zwdlr4.Utterance.fromJson(data) as T;
    }
    if (t == _i6sm9ai0.UtteranceKind) {
      return _i6sm9ai0.UtteranceKind.fromJson(data) as T;
    }
    if (t == _isc.getType<_iegt1a7r.CommunityAuthor?>()) {
      return (data != null ? _iegt1a7r.CommunityAuthor.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ihb63zbz.CommunityEvent?>()) {
      return (data != null ? _ihb63zbz.CommunityEvent.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ior3acp8.CommunityEventKind?>()) {
      return (data != null ? _ior3acp8.CommunityEventKind.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_if5j8mqy.CommunityException?>()) {
      return (data != null ? _if5j8mqy.CommunityException.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_i2t68c8j.CommunityInput?>()) {
      return (data != null ? _i2t68c8j.CommunityInput.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ihuc1ngq.CommunityKind?>()) {
      return (data != null ? _ihuc1ngq.CommunityKind.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_i09av78f.CommunityLiveMessage?>()) {
      return (data != null
              ? _i09av78f.CommunityLiveMessage.fromJson(data)
              : null)
          as T;
    }
    if (t == _isc.getType<_iru20fru.CommunityLiveMessageView?>()) {
      return (data != null
              ? _iru20fru.CommunityLiveMessageView.fromJson(data)
              : null)
          as T;
    }
    if (t == _isc.getType<_i82ndp9n.CommunityLiveRoom?>()) {
      return (data != null ? _i82ndp9n.CommunityLiveRoom.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_i7vfxpt9.CommunityMark?>()) {
      return (data != null ? _i7vfxpt9.CommunityMark.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_iuqhq7xc.CommunityMarkKind?>()) {
      return (data != null ? _iuqhq7xc.CommunityMarkKind.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ihmjr1od.CommunityMeetup?>()) {
      return (data != null ? _ihmjr1od.CommunityMeetup.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_i5de81vi.CommunityMember?>()) {
      return (data != null ? _i5de81vi.CommunityMember.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ikoxh2u0.CommunityPost?>()) {
      return (data != null ? _ikoxh2u0.CommunityPost.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_id1r7uxk.CommunityReply?>()) {
      return (data != null ? _id1r7uxk.CommunityReply.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_igoe6lh9.CommunityReplyView?>()) {
      return (data != null ? _igoe6lh9.CommunityReplyView.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ixgpxqr0.CommunitySpace?>()) {
      return (data != null ? _ixgpxqr0.CommunitySpace.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ik04a096.CommunityTarget?>()) {
      return (data != null ? _ik04a096.CommunityTarget.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_iq9mmxki.CommunityThread?>()) {
      return (data != null ? _iq9mmxki.CommunityThread.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_intovxsm.CommunityThreadDetail?>()) {
      return (data != null
              ? _intovxsm.CommunityThreadDetail.fromJson(data)
              : null)
          as T;
    }
    if (t == _isc.getType<_i0thufz6.AppSettings?>()) {
      return (data != null ? _i0thufz6.AppSettings.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_izw8z7ou.Greeting?>()) {
      return (data != null ? _izw8z7ou.Greeting.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_igp1gr56.SignFrame?>()) {
      return (data != null ? _igp1gr56.SignFrame.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_i7e9t1p9.SignResult?>()) {
      return (data != null ? _i7e9t1p9.SignResult.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_i64yj8ms.SignSuggestion?>()) {
      return (data != null ? _i64yj8ms.SignSuggestion.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_iqfxuo8h.MemberRole?>()) {
      return (data != null ? _iqfxuo8h.MemberRole.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_ix383f3m.Room?>()) {
      return (data != null ? _ix383f3m.Room.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_i2zch034.RoomEvent?>()) {
      return (data != null ? _i2zch034.RoomEvent.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_imqsw82k.RoomEventKind?>()) {
      return (data != null ? _imqsw82k.RoomEventKind.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_ivgvjqjf.RoomException?>()) {
      return (data != null ? _ivgvjqjf.RoomException.fromJson(data) : null)
          as T;
    }
    if (t == _isc.getType<_i8t1omy8.RoomInfo?>()) {
      return (data != null ? _i8t1omy8.RoomInfo.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_izcbgdsw.RoomMember?>()) {
      return (data != null ? _izcbgdsw.RoomMember.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_i0zwdlr4.Utterance?>()) {
      return (data != null ? _i0zwdlr4.Utterance.fromJson(data) : null) as T;
    }
    if (t == _isc.getType<_i6sm9ai0.UtteranceKind?>()) {
      return (data != null ? _i6sm9ai0.UtteranceKind.fromJson(data) : null)
          as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_iru20fru.CommunityLiveMessageView>) {
      return (data as List)
              .map((e) => deserialize<_iru20fru.CommunityLiveMessageView>(e))
              .toList()
          as T;
    }
    if (t == List<_igoe6lh9.CommunityReplyView>) {
      return (data as List)
              .map((e) => deserialize<_igoe6lh9.CommunityReplyView>(e))
              .toList()
          as T;
    }
    if (t == List<double>) {
      return (data as List).map((e) => deserialize<double>(e)).toList() as T;
    }
    if (t == _isc.getType<List<double>?>()) {
      return (data != null
              ? (data as List).map((e) => deserialize<double>(e)).toList()
              : null)
          as T;
    }
    if (t == List<_i64yj8ms.SignSuggestion>) {
      return (data as List)
              .map((e) => deserialize<_i64yj8ms.SignSuggestion>(e))
              .toList()
          as T;
    }
    if (t == _isc.getType<List<_i64yj8ms.SignSuggestion>?>()) {
      return (data != null
              ? (data as List)
                    .map((e) => deserialize<_i64yj8ms.SignSuggestion>(e))
                    .toList()
              : null)
          as T;
    }
    if (t == _isc.getType<List<String>?>()) {
      return (data != null
              ? (data as List).map((e) => deserialize<String>(e)).toList()
              : null)
          as T;
    }
    if (t == List<_izcbgdsw.RoomMember>) {
      return (data as List)
              .map((e) => deserialize<_izcbgdsw.RoomMember>(e))
              .toList()
          as T;
    }
    if (t == List<_i0zwdlr4.Utterance>) {
      return (data as List)
              .map((e) => deserialize<_i0zwdlr4.Utterance>(e))
              .toList()
          as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_i4zztl7n.CommunitySpace>) {
      return (data as List)
              .map((e) => deserialize<_i4zztl7n.CommunitySpace>(e))
              .toList()
          as T;
    }
    if (t == List<_i8e19teb.CommunityPost>) {
      return (data as List)
              .map((e) => deserialize<_i8e19teb.CommunityPost>(e))
              .toList()
          as T;
    }
    final modules = deserializationMetadata.modulesForDeserialization(
      t,
      className: rawDataClassName,
    );
    for (final module in modules) {
      try {
        return module.deserialize<T>(data, t);
      } on _isc.DeserializationTypeNotFoundException catch (_) {}
    }

    return super.deserialize<T>(data, t);
  }

  static String? getClassNameForType(Type type) {
    return switch (type) {
      _iegt1a7r.CommunityAuthor => 'CommunityAuthor',
      _ihb63zbz.CommunityEvent => 'CommunityEvent',
      _ior3acp8.CommunityEventKind => 'CommunityEventKind',
      _if5j8mqy.CommunityException => 'CommunityException',
      _i2t68c8j.CommunityInput => 'CommunityInput',
      _ihuc1ngq.CommunityKind => 'CommunityKind',
      _i09av78f.CommunityLiveMessage => 'CommunityLiveMessage',
      _iru20fru.CommunityLiveMessageView => 'CommunityLiveMessageView',
      _i82ndp9n.CommunityLiveRoom => 'CommunityLiveRoom',
      _i7vfxpt9.CommunityMark => 'CommunityMark',
      _iuqhq7xc.CommunityMarkKind => 'CommunityMarkKind',
      _ihmjr1od.CommunityMeetup => 'CommunityMeetup',
      _i5de81vi.CommunityMember => 'CommunityMember',
      _ikoxh2u0.CommunityPost => 'CommunityPost',
      _id1r7uxk.CommunityReply => 'CommunityReply',
      _igoe6lh9.CommunityReplyView => 'CommunityReplyView',
      _ixgpxqr0.CommunitySpace => 'CommunitySpace',
      _ik04a096.CommunityTarget => 'CommunityTarget',
      _iq9mmxki.CommunityThread => 'CommunityThread',
      _intovxsm.CommunityThreadDetail => 'CommunityThreadDetail',
      _i0thufz6.AppSettings => 'AppSettings',
      _izw8z7ou.Greeting => 'Greeting',
      _igp1gr56.SignFrame => 'SignFrame',
      _i7e9t1p9.SignResult => 'SignResult',
      _i64yj8ms.SignSuggestion => 'SignSuggestion',
      _iqfxuo8h.MemberRole => 'MemberRole',
      _ix383f3m.Room => 'Room',
      _i2zch034.RoomEvent => 'RoomEvent',
      _imqsw82k.RoomEventKind => 'RoomEventKind',
      _ivgvjqjf.RoomException => 'RoomException',
      _i8t1omy8.RoomInfo => 'RoomInfo',
      _izcbgdsw.RoomMember => 'RoomMember',
      _i0zwdlr4.Utterance => 'Utterance',
      _i6sm9ai0.UtteranceKind => 'UtteranceKind',
      _ => null,
    };
  }

  @override
  String? getClassNameForObject(Object? data) {
    String? className = super.getClassNameForObject(data);
    if (className != null) return className;

    if (data is Map<String, dynamic> && data['__className__'] is String) {
      return (data['__className__'] as String).replaceFirst(
        'parlance_mobile.',
        '',
      );
    }

    switch (data) {
      case _iegt1a7r.CommunityAuthor():
        return 'CommunityAuthor';
      case _ihb63zbz.CommunityEvent():
        return 'CommunityEvent';
      case _ior3acp8.CommunityEventKind():
        return 'CommunityEventKind';
      case _if5j8mqy.CommunityException():
        return 'CommunityException';
      case _i2t68c8j.CommunityInput():
        return 'CommunityInput';
      case _ihuc1ngq.CommunityKind():
        return 'CommunityKind';
      case _i09av78f.CommunityLiveMessage():
        return 'CommunityLiveMessage';
      case _iru20fru.CommunityLiveMessageView():
        return 'CommunityLiveMessageView';
      case _i82ndp9n.CommunityLiveRoom():
        return 'CommunityLiveRoom';
      case _i7vfxpt9.CommunityMark():
        return 'CommunityMark';
      case _iuqhq7xc.CommunityMarkKind():
        return 'CommunityMarkKind';
      case _ihmjr1od.CommunityMeetup():
        return 'CommunityMeetup';
      case _i5de81vi.CommunityMember():
        return 'CommunityMember';
      case _ikoxh2u0.CommunityPost():
        return 'CommunityPost';
      case _id1r7uxk.CommunityReply():
        return 'CommunityReply';
      case _igoe6lh9.CommunityReplyView():
        return 'CommunityReplyView';
      case _ixgpxqr0.CommunitySpace():
        return 'CommunitySpace';
      case _ik04a096.CommunityTarget():
        return 'CommunityTarget';
      case _iq9mmxki.CommunityThread():
        return 'CommunityThread';
      case _intovxsm.CommunityThreadDetail():
        return 'CommunityThreadDetail';
      case _i0thufz6.AppSettings():
        return 'AppSettings';
      case _izw8z7ou.Greeting():
        return 'Greeting';
      case _igp1gr56.SignFrame():
        return 'SignFrame';
      case _i7e9t1p9.SignResult():
        return 'SignResult';
      case _i64yj8ms.SignSuggestion():
        return 'SignSuggestion';
      case _iqfxuo8h.MemberRole():
        return 'MemberRole';
      case _ix383f3m.Room():
        return 'Room';
      case _i2zch034.RoomEvent():
        return 'RoomEvent';
      case _imqsw82k.RoomEventKind():
        return 'RoomEventKind';
      case _ivgvjqjf.RoomException():
        return 'RoomException';
      case _i8t1omy8.RoomInfo():
        return 'RoomInfo';
      case _izcbgdsw.RoomMember():
        return 'RoomMember';
      case _i0zwdlr4.Utterance():
        return 'Utterance';
      case _i6sm9ai0.UtteranceKind():
        return 'UtteranceKind';
    }
    className = _iaic.Protocol().getClassNameForObject(data);
    if (className != null) {
      return className.contains('.')
          ? className
          : 'serverpod_auth_idp.$className';
    }
    className = _iacc.Protocol().getClassNameForObject(data);
    if (className != null) {
      return className.contains('.')
          ? className
          : 'serverpod_auth_core.$className';
    }
    return null;
  }

  @override
  dynamic deserializeByClassName(Map<String, dynamic> data) {
    var dataClassName = data['className'];
    if (dataClassName is! String) {
      return super.deserializeByClassName(data);
    }
    if (dataClassName == 'CommunityAuthor') {
      return deserialize<_iegt1a7r.CommunityAuthor>(data['data']);
    }
    if (dataClassName == 'CommunityEvent') {
      return deserialize<_ihb63zbz.CommunityEvent>(data['data']);
    }
    if (dataClassName == 'CommunityEventKind') {
      return deserialize<_ior3acp8.CommunityEventKind>(data['data']);
    }
    if (dataClassName == 'CommunityException') {
      return deserialize<_if5j8mqy.CommunityException>(data['data']);
    }
    if (dataClassName == 'CommunityInput') {
      return deserialize<_i2t68c8j.CommunityInput>(data['data']);
    }
    if (dataClassName == 'CommunityKind') {
      return deserialize<_ihuc1ngq.CommunityKind>(data['data']);
    }
    if (dataClassName == 'CommunityLiveMessage') {
      return deserialize<_i09av78f.CommunityLiveMessage>(data['data']);
    }
    if (dataClassName == 'CommunityLiveMessageView') {
      return deserialize<_iru20fru.CommunityLiveMessageView>(data['data']);
    }
    if (dataClassName == 'CommunityLiveRoom') {
      return deserialize<_i82ndp9n.CommunityLiveRoom>(data['data']);
    }
    if (dataClassName == 'CommunityMark') {
      return deserialize<_i7vfxpt9.CommunityMark>(data['data']);
    }
    if (dataClassName == 'CommunityMarkKind') {
      return deserialize<_iuqhq7xc.CommunityMarkKind>(data['data']);
    }
    if (dataClassName == 'CommunityMeetup') {
      return deserialize<_ihmjr1od.CommunityMeetup>(data['data']);
    }
    if (dataClassName == 'CommunityMember') {
      return deserialize<_i5de81vi.CommunityMember>(data['data']);
    }
    if (dataClassName == 'CommunityPost') {
      return deserialize<_ikoxh2u0.CommunityPost>(data['data']);
    }
    if (dataClassName == 'CommunityReply') {
      return deserialize<_id1r7uxk.CommunityReply>(data['data']);
    }
    if (dataClassName == 'CommunityReplyView') {
      return deserialize<_igoe6lh9.CommunityReplyView>(data['data']);
    }
    if (dataClassName == 'CommunitySpace') {
      return deserialize<_ixgpxqr0.CommunitySpace>(data['data']);
    }
    if (dataClassName == 'CommunityTarget') {
      return deserialize<_ik04a096.CommunityTarget>(data['data']);
    }
    if (dataClassName == 'CommunityThread') {
      return deserialize<_iq9mmxki.CommunityThread>(data['data']);
    }
    if (dataClassName == 'CommunityThreadDetail') {
      return deserialize<_intovxsm.CommunityThreadDetail>(data['data']);
    }
    if (dataClassName == 'AppSettings') {
      return deserialize<_i0thufz6.AppSettings>(data['data']);
    }
    if (dataClassName == 'Greeting') {
      return deserialize<_izw8z7ou.Greeting>(data['data']);
    }
    if (dataClassName == 'SignFrame') {
      return deserialize<_igp1gr56.SignFrame>(data['data']);
    }
    if (dataClassName == 'SignResult') {
      return deserialize<_i7e9t1p9.SignResult>(data['data']);
    }
    if (dataClassName == 'SignSuggestion') {
      return deserialize<_i64yj8ms.SignSuggestion>(data['data']);
    }
    if (dataClassName == 'MemberRole') {
      return deserialize<_iqfxuo8h.MemberRole>(data['data']);
    }
    if (dataClassName == 'Room') {
      return deserialize<_ix383f3m.Room>(data['data']);
    }
    if (dataClassName == 'RoomEvent') {
      return deserialize<_i2zch034.RoomEvent>(data['data']);
    }
    if (dataClassName == 'RoomEventKind') {
      return deserialize<_imqsw82k.RoomEventKind>(data['data']);
    }
    if (dataClassName == 'RoomException') {
      return deserialize<_ivgvjqjf.RoomException>(data['data']);
    }
    if (dataClassName == 'RoomInfo') {
      return deserialize<_i8t1omy8.RoomInfo>(data['data']);
    }
    if (dataClassName == 'RoomMember') {
      return deserialize<_izcbgdsw.RoomMember>(data['data']);
    }
    if (dataClassName == 'Utterance') {
      return deserialize<_i0zwdlr4.Utterance>(data['data']);
    }
    if (dataClassName == 'UtteranceKind') {
      return deserialize<_i6sm9ai0.UtteranceKind>(data['data']);
    }
    if (dataClassName.startsWith('serverpod_auth_idp.')) {
      return _iaic.Protocol().deserializeByClassName({
        ...data,
        'className': dataClassName.substring(19),
      });
    }
    if (dataClassName.startsWith('serverpod_auth_core.')) {
      return _iacc.Protocol().deserializeByClassName({
        ...data,
        'className': dataClassName.substring(20),
      });
    }
    return super.deserializeByClassName(data);
  }

  void _registerHostProtocols() {
    _iaic.Protocol().registerHostProtocol('parlance_mobile', this);
    _iacc.Protocol().registerHostProtocol('parlance_mobile', this);
  }

  @override
  String getModuleName() => 'parlance_mobile';

  /// Maps any `Record`s known to this [Protocol] to their JSON representation
  ///
  /// Throws in case the record type is not known.
  ///
  /// This method will return `null` (only) for `null` inputs.
  Map<String, dynamic>? mapRecordToJson(Record? record) {
    if (record == null) {
      return null;
    }
    try {
      return _iaic.Protocol().mapRecordToJson(record);
    } catch (_) {}
    try {
      return _iacc.Protocol().mapRecordToJson(record);
    } catch (_) {}
    throw Exception('Unsupported record type ${record.runtimeType}');
  }
}
