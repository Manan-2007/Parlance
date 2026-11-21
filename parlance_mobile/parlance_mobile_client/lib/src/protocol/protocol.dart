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
import 'package:serverpod_auth_core_client/serverpod_auth_core_client.dart'
    as _iacc;
import 'package:serverpod_auth_idp_client/serverpod_auth_idp_client.dart'
    as _iaic;
import 'package:serverpod_client/serverpod_client.dart' as _isc;
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
          _isc.getType<List<double>>,
          _isc.getType<List<double>?>,
          _isc.getType<List<_i64yj8ms.SignSuggestion>>,
          _isc.getType<List<_i64yj8ms.SignSuggestion>?>,
          _isc.getType<List<String>>,
          _isc.getType<List<String>?>,
          _isc.getType<List<_izcbgdsw.RoomMember>>,
          _isc.getType<List<_i0zwdlr4.Utterance>>,
        ],
        modules: const [
          _iaic.Protocol.new,
          _iacc.Protocol.new,
        ],
        classNames: const [
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
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
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
