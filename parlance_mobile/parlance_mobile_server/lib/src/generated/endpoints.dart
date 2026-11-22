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
import 'package:parlance_mobile_server/src/generated/community/community_input.dart'
    as _i5e6kyyo;
import 'package:parlance_mobile_server/src/generated/community/community_kind.dart'
    as _iz8cwg6u;
import 'package:parlance_mobile_server/src/generated/community/community_target.dart'
    as _i7w1c01y;
import 'package:parlance_mobile_server/src/generated/contribute/review_verdict.dart'
    as _i8p3pzfw;
import 'package:parlance_mobile_server/src/generated/recognition/sign_frame.dart'
    as _i1wpk667;
import 'package:parlance_mobile_server/src/generated/rooms/member_role.dart'
    as _i85yyyme;
import 'package:parlance_mobile_server/src/generated/rooms/utterance_kind.dart'
    as _i0ajzskv;
import 'package:serverpod/serverpod.dart' as _is;
import 'package:serverpod_auth_core_server/serverpod_auth_core_server.dart'
    as _iacs;
import 'package:serverpod_auth_idp_server/serverpod_auth_idp_server.dart'
    as _iais;
import '../auth/anonymous_idp_endpoint.dart' as _in0zita6;
import '../auth/email_idp_endpoint.dart' as _iuc1hd5t;
import '../auth/jwt_refresh_endpoint.dart' as _inwq3ztq;
import '../community/community_endpoint.dart' as _ishdpybd;
import '../config/settings_endpoint.dart' as _ijyziccz;
import '../contribute/contribute_endpoint.dart' as _ilnokq2e;
import '../greetings/greeting_endpoint.dart' as _il624ik7;
import '../recognition/sign_endpoint.dart' as _imbbl2vy;
import '../rooms/room_endpoint.dart' as _idkvzxf4;
import '../translate/translate_endpoint.dart' as _i5w4l7pc;

class Endpoints extends _is.EndpointDispatch {
  @override
  void initializeEndpoints(_is.Server server) {
    initializeOwnEndpoints(server);
    modules['serverpod_auth_idp'] = _iais.Endpoints()
      ..initializeOwnEndpoints(server);
    modules['serverpod_auth_core'] = _iacs.Endpoints()
      ..initializeOwnEndpoints(server);
  }

  @override
  void initializeOwnEndpoints(_is.Server server) {
    var endpoints = <String, _is.Endpoint>{
      'anonymousIdp': _in0zita6.AnonymousIdpEndpoint()
        ..initialize(
          server,
          'anonymousIdp',
          null,
        ),
      'emailIdp': _iuc1hd5t.EmailIdpEndpoint()
        ..initialize(
          server,
          'emailIdp',
          null,
        ),
      'jwtRefresh': _inwq3ztq.JwtRefreshEndpoint()
        ..initialize(
          server,
          'jwtRefresh',
          null,
        ),
      'community': _ishdpybd.CommunityEndpoint()
        ..initialize(
          server,
          'community',
          null,
        ),
      'settings': _ijyziccz.SettingsEndpoint()
        ..initialize(
          server,
          'settings',
          null,
        ),
      'contribute': _ilnokq2e.ContributeEndpoint()
        ..initialize(
          server,
          'contribute',
          null,
        ),
      'greeting': _il624ik7.GreetingEndpoint()
        ..initialize(
          server,
          'greeting',
          null,
        ),
      'sign': _imbbl2vy.SignEndpoint()
        ..initialize(
          server,
          'sign',
          null,
        ),
      'room': _idkvzxf4.RoomEndpoint()
        ..initialize(
          server,
          'room',
          null,
        ),
      'translate': _i5w4l7pc.TranslateEndpoint()
        ..initialize(
          server,
          'translate',
          null,
        ),
    };
    connectors['anonymousIdp'] = _is.EndpointConnector(
      name: 'anonymousIdp',
      endpoint: endpoints['anonymousIdp']!,
      methodConnectors: {
        'login': _is.MethodConnector(
          name: 'login',
          params: {
            'token': _is.ParameterDescription(
              name: 'token',
              type: _is.getType<String?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['anonymousIdp'] as _in0zita6.AnonymousIdpEndpoint)
                      .login(
                        session,
                        token: params['token'],
                      ),
        ),
      },
    );
    connectors['emailIdp'] = _is.EndpointConnector(
      name: 'emailIdp',
      endpoint: endpoints['emailIdp']!,
      methodConnectors: {
        'startOtpLogin': _is.MethodConnector(
          name: 'startOtpLogin',
          params: {
            'email': _is.ParameterDescription(
              name: 'email',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .startOtpLogin(
                    session,
                    email: params['email'],
                  ),
        ),
        'verifyOtpLoginCode': _is.MethodConnector(
          name: 'verifyOtpLoginCode',
          params: {
            'otpLoginRequestId': _is.ParameterDescription(
              name: 'otpLoginRequestId',
              type: _is.getType<_is.UuidValue>(),
              nullable: false,
            ),
            'verificationCode': _is.ParameterDescription(
              name: 'verificationCode',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .verifyOtpLoginCode(
                    session,
                    otpLoginRequestId: params['otpLoginRequestId'],
                    verificationCode: params['verificationCode'],
                  ),
        ),
        'finishOtpLogin': _is.MethodConnector(
          name: 'finishOtpLogin',
          params: {
            'otpLoginToken': _is.ParameterDescription(
              name: 'otpLoginToken',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .finishOtpLogin(
                    session,
                    otpLoginToken: params['otpLoginToken'],
                  ),
        ),
        'finishOtpRegistration': _is.MethodConnector(
          name: 'finishOtpRegistration',
          params: {
            'otpLoginToken': _is.ParameterDescription(
              name: 'otpLoginToken',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'password': _is.ParameterDescription(
              name: 'password',
              type: _is.getType<String?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .finishOtpRegistration(
                    session,
                    otpLoginToken: params['otpLoginToken'],
                    password: params['password'],
                  ),
        ),
        'login': _is.MethodConnector(
          name: 'login',
          params: {
            'email': _is.ParameterDescription(
              name: 'email',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'password': _is.ParameterDescription(
              name: 'password',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint).login(
                    session,
                    email: params['email'],
                    password: params['password'],
                  ),
        ),
        'startRegistration': _is.MethodConnector(
          name: 'startRegistration',
          params: {
            'email': _is.ParameterDescription(
              name: 'email',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .startRegistration(
                    session,
                    email: params['email'],
                  ),
        ),
        'verifyRegistrationCode': _is.MethodConnector(
          name: 'verifyRegistrationCode',
          params: {
            'accountRequestId': _is.ParameterDescription(
              name: 'accountRequestId',
              type: _is.getType<_is.UuidValue>(),
              nullable: false,
            ),
            'verificationCode': _is.ParameterDescription(
              name: 'verificationCode',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .verifyRegistrationCode(
                    session,
                    accountRequestId: params['accountRequestId'],
                    verificationCode: params['verificationCode'],
                  ),
        ),
        'finishRegistration': _is.MethodConnector(
          name: 'finishRegistration',
          params: {
            'registrationToken': _is.ParameterDescription(
              name: 'registrationToken',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'password': _is.ParameterDescription(
              name: 'password',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .finishRegistration(
                    session,
                    registrationToken: params['registrationToken'],
                    password: params['password'],
                  ),
        ),
        'startPasswordReset': _is.MethodConnector(
          name: 'startPasswordReset',
          params: {
            'email': _is.ParameterDescription(
              name: 'email',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .startPasswordReset(
                    session,
                    email: params['email'],
                  ),
        ),
        'verifyPasswordResetCode': _is.MethodConnector(
          name: 'verifyPasswordResetCode',
          params: {
            'passwordResetRequestId': _is.ParameterDescription(
              name: 'passwordResetRequestId',
              type: _is.getType<_is.UuidValue>(),
              nullable: false,
            ),
            'verificationCode': _is.ParameterDescription(
              name: 'verificationCode',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .verifyPasswordResetCode(
                    session,
                    passwordResetRequestId: params['passwordResetRequestId'],
                    verificationCode: params['verificationCode'],
                  ),
        ),
        'finishPasswordReset': _is.MethodConnector(
          name: 'finishPasswordReset',
          params: {
            'finishPasswordResetToken': _is.ParameterDescription(
              name: 'finishPasswordResetToken',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'newPassword': _is.ParameterDescription(
              name: 'newPassword',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .finishPasswordReset(
                    session,
                    finishPasswordResetToken:
                        params['finishPasswordResetToken'],
                    newPassword: params['newPassword'],
                  ),
        ),
        'hasAccount': _is.MethodConnector(
          name: 'hasAccount',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['emailIdp'] as _iuc1hd5t.EmailIdpEndpoint)
                  .hasAccount(session),
        ),
      },
    );
    connectors['jwtRefresh'] = _is.EndpointConnector(
      name: 'jwtRefresh',
      endpoint: endpoints['jwtRefresh']!,
      methodConnectors: {
        'refreshAccessToken': _is.MethodConnector(
          name: 'refreshAccessToken',
          params: {
            'refreshToken': _is.ParameterDescription(
              name: 'refreshToken',
              type: _is.getType<String?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['jwtRefresh'] as _inwq3ztq.JwtRefreshEndpoint)
                      .refreshAccessToken(
                        session,
                        refreshToken: params['refreshToken'],
                      ),
        ),
      },
    );
    connectors['community'] = _is.EndpointConnector(
      name: 'community',
      endpoint: endpoints['community']!,
      methodConnectors: {
        'me': _is.MethodConnector(
          name: 'me',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .me(session),
        ),
        'join': _is.MethodConnector(
          name: 'join',
          params: {
            'handle': _is.ParameterDescription(
              name: 'handle',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'city': _is.ParameterDescription(
              name: 'city',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'ways': _is.ParameterDescription(
              name: 'ways',
              type: _is.getType<List<String>>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['community'] as _ishdpybd.CommunityEndpoint).join(
                    session,
                    params['handle'],
                    params['city'],
                    params['ways'],
                  ),
        ),
        'updateMe': _is.MethodConnector(
          name: 'updateMe',
          params: {
            'city': _is.ParameterDescription(
              name: 'city',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'ways': _is.ParameterDescription(
              name: 'ways',
              type: _is.getType<List<String>>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .updateMe(
                    session,
                    params['city'],
                    params['ways'],
                  ),
        ),
        'listSpaces': _is.MethodConnector(
          name: 'listSpaces',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .listSpaces(session),
        ),
        'threads': _is.MethodConnector(
          name: 'threads',
          params: {
            'space': _is.ParameterDescription(
              name: 'space',
              type: _is.getType<String?>(),
              nullable: true,
            ),
            'sort': _is.ParameterDescription(
              name: 'sort',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'query': _is.ParameterDescription(
              name: 'query',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'offset': _is.ParameterDescription(
              name: 'offset',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .threads(
                    session,
                    params['space'],
                    params['sort'],
                    params['query'],
                    params['offset'],
                  ),
        ),
        'thread': _is.MethodConnector(
          name: 'thread',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .thread(
                    session,
                    params['threadId'],
                  ),
        ),
        'createThread': _is.MethodConnector(
          name: 'createThread',
          params: {
            'space': _is.ParameterDescription(
              name: 'space',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'kind': _is.ParameterDescription(
              name: 'kind',
              type: _is.getType<_iz8cwg6u.CommunityKind>(),
              nullable: false,
            ),
            'title': _is.ParameterDescription(
              name: 'title',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'body': _is.ParameterDescription(
              name: 'body',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'input': _is.ParameterDescription(
              name: 'input',
              type: _is.getType<_i5e6kyyo.CommunityInput>(),
              nullable: false,
            ),
            'place': _is.ParameterDescription(
              name: 'place',
              type: _is.getType<String?>(),
              nullable: true,
            ),
            'city': _is.ParameterDescription(
              name: 'city',
              type: _is.getType<String?>(),
              nullable: true,
            ),
            'startsAt': _is.ParameterDescription(
              name: 'startsAt',
              type: _is.getType<DateTime?>(),
              nullable: true,
            ),
            'endsAt': _is.ParameterDescription(
              name: 'endsAt',
              type: _is.getType<DateTime?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .createThread(
                    session,
                    params['space'],
                    params['kind'],
                    params['title'],
                    params['body'],
                    params['input'],
                    params['place'],
                    params['city'],
                    params['startsAt'],
                    params['endsAt'],
                  ),
        ),
        'editThread': _is.MethodConnector(
          name: 'editThread',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'title': _is.ParameterDescription(
              name: 'title',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'body': _is.ParameterDescription(
              name: 'body',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .editThread(
                    session,
                    params['threadId'],
                    params['title'],
                    params['body'],
                  ),
        ),
        'deleteThread': _is.MethodConnector(
          name: 'deleteThread',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .deleteThread(
                    session,
                    params['threadId'],
                  ),
        ),
        'reply': _is.MethodConnector(
          name: 'reply',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'body': _is.ParameterDescription(
              name: 'body',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'input': _is.ParameterDescription(
              name: 'input',
              type: _is.getType<_i5e6kyyo.CommunityInput>(),
              nullable: false,
            ),
            'quoteId': _is.ParameterDescription(
              name: 'quoteId',
              type: _is.getType<int?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['community'] as _ishdpybd.CommunityEndpoint).reply(
                    session,
                    params['threadId'],
                    params['body'],
                    params['input'],
                    params['quoteId'],
                  ),
        ),
        'editReply': _is.MethodConnector(
          name: 'editReply',
          params: {
            'replyId': _is.ParameterDescription(
              name: 'replyId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'body': _is.ParameterDescription(
              name: 'body',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .editReply(
                    session,
                    params['replyId'],
                    params['body'],
                  ),
        ),
        'deleteReply': _is.MethodConnector(
          name: 'deleteReply',
          params: {
            'replyId': _is.ParameterDescription(
              name: 'replyId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .deleteReply(
                    session,
                    params['replyId'],
                  ),
        ),
        'setHelpful': _is.MethodConnector(
          name: 'setHelpful',
          params: {
            'target': _is.ParameterDescription(
              name: 'target',
              type: _is.getType<_i7w1c01y.CommunityTarget>(),
              nullable: false,
            ),
            'id': _is.ParameterDescription(
              name: 'id',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'on': _is.ParameterDescription(
              name: 'on',
              type: _is.getType<bool>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .setHelpful(
                    session,
                    params['target'],
                    params['id'],
                    params['on'],
                  ),
        ),
        'report': _is.MethodConnector(
          name: 'report',
          params: {
            'target': _is.ParameterDescription(
              name: 'target',
              type: _is.getType<_i7w1c01y.CommunityTarget>(),
              nullable: false,
            ),
            'id': _is.ParameterDescription(
              name: 'id',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'reason': _is.ParameterDescription(
              name: 'reason',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .report(
                    session,
                    params['target'],
                    params['id'],
                    params['reason'],
                  ),
        ),
        'setAnswer': _is.MethodConnector(
          name: 'setAnswer',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'replyId': _is.ParameterDescription(
              name: 'replyId',
              type: _is.getType<int?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .setAnswer(
                    session,
                    params['threadId'],
                    params['replyId'],
                  ),
        ),
        'setGoing': _is.MethodConnector(
          name: 'setGoing',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'on': _is.ParameterDescription(
              name: 'on',
              type: _is.getType<bool>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .setGoing(
                    session,
                    params['threadId'],
                    params['on'],
                  ),
        ),
        'startLive': _is.MethodConnector(
          name: 'startLive',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .startLive(
                    session,
                    params['threadId'],
                  ),
        ),
        'endLive': _is.MethodConnector(
          name: 'endLive',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .endLive(
                    session,
                    params['threadId'],
                  ),
        ),
        'live': _is.MethodConnector(
          name: 'live',
          params: {
            'code': _is.ParameterDescription(
              name: 'code',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['community'] as _ishdpybd.CommunityEndpoint).live(
                    session,
                    params['code'],
                  ),
        ),
        'sayLive': _is.MethodConnector(
          name: 'sayLive',
          params: {
            'code': _is.ParameterDescription(
              name: 'code',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'text': _is.ParameterDescription(
              name: 'text',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'input': _is.ParameterDescription(
              name: 'input',
              type: _is.getType<_i5e6kyyo.CommunityInput>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .sayLive(
                    session,
                    params['code'],
                    params['text'],
                    params['input'],
                  ),
        ),
        'listenThread': _is.MethodStreamConnector(
          name: 'listenThread',
          params: {
            'threadId': _is.ParameterDescription(
              name: 'threadId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          streamParams: {},
          returnType: _is.MethodStreamReturnType.streamType,
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
                Map<String, Stream> streamParams,
              ) => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .listenThread(
                    session,
                    params['threadId'],
                  ),
        ),
        'listenLive': _is.MethodStreamConnector(
          name: 'listenLive',
          params: {
            'code': _is.ParameterDescription(
              name: 'code',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          streamParams: {},
          returnType: _is.MethodStreamReturnType.streamType,
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
                Map<String, Stream> streamParams,
              ) => (endpoints['community'] as _ishdpybd.CommunityEndpoint)
                  .listenLive(
                    session,
                    params['code'],
                  ),
        ),
      },
    );
    connectors['settings'] = _is.EndpointConnector(
      name: 'settings',
      endpoint: endpoints['settings']!,
      methodConnectors: {
        'get': _is.MethodConnector(
          name: 'get',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['settings'] as _ijyziccz.SettingsEndpoint)
                  .get(session),
        ),
      },
    );
    connectors['contribute'] = _is.EndpointConnector(
      name: 'contribute',
      endpoint: endpoints['contribute']!,
      methodConnectors: {
        'vocabulary': _is.MethodConnector(
          name: 'vocabulary',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .vocabulary(session),
        ),
        'status': _is.MethodConnector(
          name: 'status',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .status(session),
        ),
        'giveConsent': _is.MethodConnector(
          name: 'giveConsent',
          params: {
            'version': _is.ParameterDescription(
              name: 'version',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'decidesForSelf': _is.ParameterDescription(
              name: 'decidesForSelf',
              type: _is.getType<bool>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .giveConsent(
                        session,
                        params['version'],
                        params['decidesForSelf'],
                      ),
        ),
        'withdraw': _is.MethodConnector(
          name: 'withdraw',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .withdraw(session),
        ),
        'setReviewer': _is.MethodConnector(
          name: 'setReviewer',
          params: {
            'on': _is.ParameterDescription(
              name: 'on',
              type: _is.getType<bool>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .setReviewer(
                        session,
                        params['on'],
                      ),
        ),
        'contribute': _is.MethodConnector(
          name: 'contribute',
          params: {
            'gloss': _is.ParameterDescription(
              name: 'gloss',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'frames': _is.ParameterDescription(
              name: 'frames',
              type: _is.getType<List<double>>(),
              nullable: false,
            ),
            'frameCount': _is.ParameterDescription(
              name: 'frameCount',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .contribute(
                        session,
                        params['gloss'],
                        params['frames'],
                        params['frameCount'],
                      ),
        ),
        'mine': _is.MethodConnector(
          name: 'mine',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .mine(session),
        ),
        'deleteContribution': _is.MethodConnector(
          name: 'deleteContribution',
          params: {
            'id': _is.ParameterDescription(
              name: 'id',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .deleteContribution(
                        session,
                        params['id'],
                      ),
        ),
        'reviewQueue': _is.MethodConnector(
          name: 'reviewQueue',
          params: {},
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .reviewQueue(session),
        ),
        'review': _is.MethodConnector(
          name: 'review',
          params: {
            'id': _is.ParameterDescription(
              name: 'id',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'verdict': _is.ParameterDescription(
              name: 'verdict',
              type: _is.getType<_i8p3pzfw.ReviewVerdict>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['contribute'] as _ilnokq2e.ContributeEndpoint)
                      .review(
                        session,
                        params['id'],
                        params['verdict'],
                      ),
        ),
      },
    );
    connectors['greeting'] = _is.EndpointConnector(
      name: 'greeting',
      endpoint: endpoints['greeting']!,
      methodConnectors: {
        'hello': _is.MethodConnector(
          name: 'hello',
          params: {
            'name': _is.ParameterDescription(
              name: 'name',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async =>
                  (endpoints['greeting'] as _il624ik7.GreetingEndpoint).hello(
                    session,
                    params['name'],
                  ),
        ),
      },
    );
    connectors['sign'] = _is.EndpointConnector(
      name: 'sign',
      endpoint: endpoints['sign']!,
      methodConnectors: {
        'read': _is.MethodStreamConnector(
          name: 'read',
          params: {},
          streamParams: {
            'frames': _is.StreamParameterDescription<_i1wpk667.SignFrame>(
              name: 'frames',
              nullable: false,
            ),
          },
          returnType: _is.MethodStreamReturnType.streamType,
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
                Map<String, Stream> streamParams,
              ) => (endpoints['sign'] as _imbbl2vy.SignEndpoint).read(
                session,
                streamParams['frames']!.cast<_i1wpk667.SignFrame>(),
              ),
        ),
      },
    );
    connectors['room'] = _is.EndpointConnector(
      name: 'room',
      endpoint: endpoints['room']!,
      methodConnectors: {
        'create': _is.MethodConnector(
          name: 'create',
          params: {
            'role': _is.ParameterDescription(
              name: 'role',
              type: _is.getType<_i85yyyme.MemberRole>(),
              nullable: false,
            ),
            'name': _is.ParameterDescription(
              name: 'name',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).create(
                session,
                params['role'],
                params['name'],
              ),
        ),
        'join': _is.MethodConnector(
          name: 'join',
          params: {
            'code': _is.ParameterDescription(
              name: 'code',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'role': _is.ParameterDescription(
              name: 'role',
              type: _is.getType<_i85yyyme.MemberRole>(),
              nullable: false,
            ),
            'name': _is.ParameterDescription(
              name: 'name',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).join(
                session,
                params['code'],
                params['role'],
                params['name'],
              ),
        ),
        'say': _is.MethodConnector(
          name: 'say',
          params: {
            'roomId': _is.ParameterDescription(
              name: 'roomId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'kind': _is.ParameterDescription(
              name: 'kind',
              type: _is.getType<_i0ajzskv.UtteranceKind>(),
              nullable: false,
            ),
            'text': _is.ParameterDescription(
              name: 'text',
              type: _is.getType<String>(),
              nullable: false,
            ),
            'hindi': _is.ParameterDescription(
              name: 'hindi',
              type: _is.getType<String?>(),
              nullable: true,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).say(
                session,
                params['roomId'],
                params['kind'],
                params['text'],
                params['hindi'],
              ),
        ),
        'live': _is.MethodConnector(
          name: 'live',
          params: {
            'roomId': _is.ParameterDescription(
              name: 'roomId',
              type: _is.getType<int>(),
              nullable: false,
            ),
            'text': _is.ParameterDescription(
              name: 'text',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).live(
                session,
                params['roomId'],
                params['text'],
              ),
        ),
        'leave': _is.MethodConnector(
          name: 'leave',
          params: {
            'roomId': _is.ParameterDescription(
              name: 'roomId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).leave(
                session,
                params['roomId'],
              ),
        ),
        'close': _is.MethodConnector(
          name: 'close',
          params: {
            'roomId': _is.ParameterDescription(
              name: 'roomId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['room'] as _idkvzxf4.RoomEndpoint).close(
                session,
                params['roomId'],
              ),
        ),
        'listen': _is.MethodStreamConnector(
          name: 'listen',
          params: {
            'roomId': _is.ParameterDescription(
              name: 'roomId',
              type: _is.getType<int>(),
              nullable: false,
            ),
          },
          streamParams: {},
          returnType: _is.MethodStreamReturnType.streamType,
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
                Map<String, Stream> streamParams,
              ) => (endpoints['room'] as _idkvzxf4.RoomEndpoint).listen(
                session,
                params['roomId'],
              ),
        ),
      },
    );
    connectors['translate'] = _is.EndpointConnector(
      name: 'translate',
      endpoint: endpoints['translate']!,
      methodConnectors: {
        'toGloss': _is.MethodConnector(
          name: 'toGloss',
          params: {
            'text': _is.ParameterDescription(
              name: 'text',
              type: _is.getType<String>(),
              nullable: false,
            ),
          },
          call:
              (
                _is.Session session,
                Map<String, dynamic> params,
              ) async => (endpoints['translate'] as _i5w4l7pc.TranslateEndpoint)
                  .toGloss(
                    session,
                    params['text'],
                  ),
        ),
      },
    );
  }
}
