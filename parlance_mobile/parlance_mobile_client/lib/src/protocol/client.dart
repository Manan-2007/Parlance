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
import 'dart:async' as _ida;
import 'package:http/http.dart' as _i85jenna;
import 'package:parlance_mobile_client/src/protocol/community/community_author.dart'
    as _iwcxaguc;
import 'package:parlance_mobile_client/src/protocol/community/community_event.dart'
    as _ir0ag590;
import 'package:parlance_mobile_client/src/protocol/community/community_input.dart'
    as _i0uwrkyu;
import 'package:parlance_mobile_client/src/protocol/community/community_kind.dart'
    as _ig7i6uby;
import 'package:parlance_mobile_client/src/protocol/community/community_live_message_view.dart'
    as _i07c5ol7;
import 'package:parlance_mobile_client/src/protocol/community/community_live_room.dart'
    as _i82wj25m;
import 'package:parlance_mobile_client/src/protocol/community/community_post.dart'
    as _i8e19teb;
import 'package:parlance_mobile_client/src/protocol/community/community_reply_view.dart'
    as _iku3rf73;
import 'package:parlance_mobile_client/src/protocol/community/community_space.dart'
    as _i4zztl7n;
import 'package:parlance_mobile_client/src/protocol/community/community_target.dart'
    as _ilhdyced;
import 'package:parlance_mobile_client/src/protocol/community/community_thread_detail.dart'
    as _ix2cfxoy;
import 'package:parlance_mobile_client/src/protocol/config/app_settings.dart'
    as _ida0onrg;
import 'package:parlance_mobile_client/src/protocol/contribute/contribution_stats.dart'
    as _iw64po29;
import 'package:parlance_mobile_client/src/protocol/contribute/contribution_status.dart'
    as _in4qnmkq;
import 'package:parlance_mobile_client/src/protocol/contribute/contribution_summary.dart'
    as _i18zrkqi;
import 'package:parlance_mobile_client/src/protocol/contribute/contribution_word.dart'
    as _i8i2vtw8;
import 'package:parlance_mobile_client/src/protocol/contribute/review_item.dart'
    as _i6rpmp3c;
import 'package:parlance_mobile_client/src/protocol/contribute/review_verdict.dart'
    as _irvelhmk;
import 'package:parlance_mobile_client/src/protocol/greetings/greeting.dart'
    as _ia6ix618;
import 'package:parlance_mobile_client/src/protocol/recognition/sign_frame.dart'
    as _icwofdsv;
import 'package:parlance_mobile_client/src/protocol/recognition/sign_result.dart'
    as _ieimjpcj;
import 'package:parlance_mobile_client/src/protocol/rooms/member_role.dart'
    as _i1ku0jze;
import 'package:parlance_mobile_client/src/protocol/rooms/room_event.dart'
    as _ik2bvkz9;
import 'package:parlance_mobile_client/src/protocol/rooms/room_info.dart'
    as _i0thh3ij;
import 'package:parlance_mobile_client/src/protocol/rooms/utterance.dart'
    as _icrhd708;
import 'package:parlance_mobile_client/src/protocol/rooms/utterance_kind.dart'
    as _igmiwm7x;
import 'package:serverpod_auth_core_client/serverpod_auth_core_client.dart'
    as _iacc;
import 'package:serverpod_auth_idp_client/serverpod_auth_idp_client.dart'
    as _iaic;
import 'package:serverpod_client/serverpod_client.dart' as _isc;
import 'protocol.dart' as _il2as5qe;

/// Lets each phone get its own account without an email, so a conversation can
/// start in seconds. The account only identifies the phone to its rooms.
/// {@category Endpoint}
class EndpointAnonymousIdp extends _iaic.EndpointAnonymousIdpBase {
  EndpointAnonymousIdp(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'anonymousIdp';

  /// Creates a new anonymous account and returns its session.
  ///
  /// Invokes the [AnonymousIdp.beforeAnonymousAccount] callback if configured,
  /// which may prevent account creation if the endpoint is protected.
  @override
  _ida.Future<_iacc.AuthSuccess> login({String? token}) =>
      caller.callServerEndpoint<_iacc.AuthSuccess>(
        'anonymousIdp',
        'login',
        {'token': token},
      );
}

/// By extending [EmailOtpIdpBaseEndpoint], the email identity provider
/// endpoints, including the passwordless sign-in with one-time passwords, are
/// made available on the server and enable the corresponding sign-in widget on
/// the client.
///
/// Extend [EmailIdpBaseEndpoint] instead for the password based sign-in only.
/// {@category Endpoint}
class EndpointEmailIdp extends _iaic.EndpointEmailOtpIdpBase {
  EndpointEmailIdp(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'emailIdp';

  /// Starts a passwordless login by sending a one-time password to [email].
  ///
  /// The code is sent whether or not an account is registered for the email.
  /// If none is, verifying the code lets the user create a new account.
  ///
  /// Always returns a login request ID, which must be passed to
  /// [verifyOtpLoginCode] together with the one-time password.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.policyViolation] if the email is
  ///   not valid.
  /// - [EmailAccountRequestExceptionReason.tooManyAttempts] if too many
  ///   one-time passwords have been requested for the email.
  @override
  _ida.Future<_isc.UuidValue> startOtpLogin({required String email}) =>
      caller.callServerEndpoint<_isc.UuidValue>(
        'emailIdp',
        'startOtpLogin',
        {'email': email},
      );

  /// Verifies a one-time password and returns a token to complete the login.
  ///
  /// If [EmailAccountOtpVerificationResult.accountExists] is `true`, pass the
  /// token to [finishOtpLogin] to sign in. Otherwise, have the user accept the
  /// terms (and optionally set a password if
  /// [EmailAccountOtpVerificationResult.allowPassword] is `true`) and pass it
  /// to [finishOtpRegistration] to create the account.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.expired] if the login request has
  ///   already expired.
  /// - [EmailAccountRequestExceptionReason.tooManyAttempts] if the user has
  ///   made too many attempts to verify the code.
  /// - [EmailAccountRequestExceptionReason.invalid] if no request exists for
  ///   the given [otpLoginRequestId] or [verificationCode] is invalid.
  @override
  _ida.Future<_iaic.EmailAccountOtpVerificationResult> verifyOtpLoginCode({
    required _isc.UuidValue otpLoginRequestId,
    required String verificationCode,
  }) => caller.callServerEndpoint<_iaic.EmailAccountOtpVerificationResult>(
    'emailIdp',
    'verifyOtpLoginCode',
    {
      'otpLoginRequestId': otpLoginRequestId,
      'verificationCode': verificationCode,
    },
  );

  /// Completes a passwordless login for an existing account and returns a new
  /// session.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.expired] if the login request has
  ///   already expired.
  /// - [EmailAccountRequestExceptionReason.invalid] if the [otpLoginToken] is
  ///   invalid or no account exists for the email.
  ///
  /// Throws an [AuthUserBlockedException] if the auth user is blocked.
  @override
  _ida.Future<_iacc.AuthSuccess> finishOtpLogin({
    required String otpLoginToken,
  }) => caller.callServerEndpoint<_iacc.AuthSuccess>(
    'emailIdp',
    'finishOtpLogin',
    {'otpLoginToken': otpLoginToken},
  );

  /// Completes a passwordless login for an email without an account, by
  /// creating a new auth user with a profile and attaching the verified email
  /// to it.
  ///
  /// Must only be called after the user accepted the terms. The [password] is
  /// optional, and may only be set if
  /// [EmailAccountOtpVerificationResult.allowPassword] was `true`.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.expired] if the login request has
  ///   already expired.
  /// - [EmailAccountRequestExceptionReason.policyViolation] if a password is
  ///   given but not allowed, or it does not comply with the password policy.
  /// - [EmailAccountRequestExceptionReason.invalid] if the [otpLoginToken] is
  ///   invalid or an account already exists for the email.
  ///
  /// Returns a session for the newly created user.
  @override
  _ida.Future<_iacc.AuthSuccess> finishOtpRegistration({
    required String otpLoginToken,
    String? password,
  }) => caller.callServerEndpoint<_iacc.AuthSuccess>(
    'emailIdp',
    'finishOtpRegistration',
    {
      'otpLoginToken': otpLoginToken,
      'password': password,
    },
  );

  /// Logs in the user and returns a new session.
  ///
  /// Throws an [EmailAccountLoginException] in case of errors, with reason:
  /// - [EmailAccountLoginExceptionReason.invalidCredentials] if the email or
  ///   password is incorrect.
  /// - [EmailAccountLoginExceptionReason.tooManyAttempts] if there have been
  ///   too many failed login attempts.
  ///
  /// Throws an [AuthUserBlockedException] if the auth user is blocked.
  @override
  _ida.Future<_iacc.AuthSuccess> login({
    required String email,
    required String password,
  }) => caller.callServerEndpoint<_iacc.AuthSuccess>(
    'emailIdp',
    'login',
    {
      'email': email,
      'password': password,
    },
  );

  /// Starts the registration for a new user account with an email-based login
  /// associated to it.
  ///
  /// Upon successful completion of this method, an email will have been
  /// sent to [email] with a verification link, which the user must open to
  /// complete the registration.
  ///
  /// Always returns a account request ID, which can be used to complete the
  /// registration. If the email is already registered, the returned ID will not
  /// be valid.
  @override
  _ida.Future<_isc.UuidValue> startRegistration({required String email}) =>
      caller.callServerEndpoint<_isc.UuidValue>(
        'emailIdp',
        'startRegistration',
        {'email': email},
      );

  /// Verifies an account request code and returns a token
  /// that can be used to complete the account creation.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.expired] if the account request has
  ///   already expired.
  /// - [EmailAccountRequestExceptionReason.policyViolation] if the password
  ///   does not comply with the password policy.
  /// - [EmailAccountRequestExceptionReason.invalid] if no request exists
  ///   for the given [accountRequestId] or [verificationCode] is invalid.
  @override
  _ida.Future<String> verifyRegistrationCode({
    required _isc.UuidValue accountRequestId,
    required String verificationCode,
  }) => caller.callServerEndpoint<String>(
    'emailIdp',
    'verifyRegistrationCode',
    {
      'accountRequestId': accountRequestId,
      'verificationCode': verificationCode,
    },
  );

  /// Completes a new account registration, creating a new auth user with a
  /// profile and attaching the given email account to it.
  ///
  /// Throws an [EmailAccountRequestException] in case of errors, with reason:
  /// - [EmailAccountRequestExceptionReason.expired] if the account request has
  ///   already expired.
  /// - [EmailAccountRequestExceptionReason.policyViolation] if the password
  ///   does not comply with the password policy.
  /// - [EmailAccountRequestExceptionReason.invalid] if the [registrationToken]
  ///   is invalid.
  ///
  /// Throws an [AuthUserBlockedException] if the auth user is blocked.
  ///
  /// Returns a session for the newly created user.
  @override
  _ida.Future<_iacc.AuthSuccess> finishRegistration({
    required String registrationToken,
    required String password,
  }) => caller.callServerEndpoint<_iacc.AuthSuccess>(
    'emailIdp',
    'finishRegistration',
    {
      'registrationToken': registrationToken,
      'password': password,
    },
  );

  /// Requests a password reset for [email].
  ///
  /// If the email address is registered, an email with reset instructions will
  /// be send out. If the email is unknown, this method will have no effect.
  ///
  /// Always returns a password reset request ID, which can be used to complete
  /// the reset. If the email is not registered, the returned ID will not be
  /// valid.
  ///
  /// Throws an [EmailAccountPasswordResetException] in case of errors, with reason:
  /// - [EmailAccountPasswordResetExceptionReason.tooManyAttempts] if the user has
  ///   made too many attempts trying to request a password reset.
  ///
  @override
  _ida.Future<_isc.UuidValue> startPasswordReset({required String email}) =>
      caller.callServerEndpoint<_isc.UuidValue>(
        'emailIdp',
        'startPasswordReset',
        {'email': email},
      );

  /// Verifies a password reset code and returns a finishPasswordResetToken
  /// that can be used to finish the password reset.
  ///
  /// Throws an [EmailAccountPasswordResetException] in case of errors, with reason:
  /// - [EmailAccountPasswordResetExceptionReason.expired] if the password reset
  ///   request has already expired.
  /// - [EmailAccountPasswordResetExceptionReason.tooManyAttempts] if the user has
  ///   made too many attempts trying to verify the password reset.
  /// - [EmailAccountPasswordResetExceptionReason.invalid] if no request exists
  ///   for the given [passwordResetRequestId] or [verificationCode] is invalid.
  ///
  /// If multiple steps are required to complete the password reset, this endpoint
  /// should be overridden to return credentials for the next step instead
  /// of the credentials for setting the password.
  @override
  _ida.Future<String> verifyPasswordResetCode({
    required _isc.UuidValue passwordResetRequestId,
    required String verificationCode,
  }) => caller.callServerEndpoint<String>(
    'emailIdp',
    'verifyPasswordResetCode',
    {
      'passwordResetRequestId': passwordResetRequestId,
      'verificationCode': verificationCode,
    },
  );

  /// Completes a password reset request by setting a new password.
  ///
  /// The [verificationCode] returned from [verifyPasswordResetCode] is used to
  /// validate the password reset request.
  ///
  /// Throws an [EmailAccountPasswordResetException] in case of errors, with reason:
  /// - [EmailAccountPasswordResetExceptionReason.expired] if the password reset
  ///   request has already expired.
  /// - [EmailAccountPasswordResetExceptionReason.policyViolation] if the new
  ///   password does not comply with the password policy.
  /// - [EmailAccountPasswordResetExceptionReason.invalid] if no request exists
  ///   for the given [passwordResetRequestId] or [verificationCode] is invalid.
  ///
  /// Throws an [AuthUserBlockedException] if the auth user is blocked.
  @override
  _ida.Future<void> finishPasswordReset({
    required String finishPasswordResetToken,
    required String newPassword,
  }) => caller.callServerEndpoint<void>(
    'emailIdp',
    'finishPasswordReset',
    {
      'finishPasswordResetToken': finishPasswordResetToken,
      'newPassword': newPassword,
    },
  );

  @override
  _ida.Future<bool> hasAccount() => caller.callServerEndpoint<bool>(
    'emailIdp',
    'hasAccount',
    {},
  );
}

/// By extending [RefreshJwtTokensEndpoint], the JWT token refresh endpoint
/// is made available on the server and enables automatic token refresh on the client.
/// {@category Endpoint}
class EndpointJwtRefresh extends _iacc.EndpointRefreshJwtTokens {
  EndpointJwtRefresh(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'jwtRefresh';

  /// Creates a new token pair for the given [refreshToken].
  ///
  /// If [refreshToken] is omitted, cookie-mode web clients fall back to the
  /// configured HttpOnly refresh cookie. When neither source is present this
  /// throws [RefreshTokenNotFoundException], the same public "no usable refresh
  /// credential" exception used for unknown refresh tokens.
  ///
  /// Can throw the following exceptions:
  /// -[RefreshTokenMalformedException]: refresh token is malformed and could
  ///   not be parsed. Not expected to happen for tokens issued by the server.
  /// -[RefreshTokenNotFoundException]: refresh token is unknown to the server.
  ///   Either the token was deleted or generated by a different server.
  /// -[RefreshTokenExpiredException]: refresh token has expired. Will happen
  ///   only if it has not been used within configured `refreshTokenLifetime`.
  /// -[RefreshTokenInvalidSecretException]: refresh token is incorrect, meaning
  ///   it does not refer to the current secret refresh token. This indicates
  ///   either a malfunctioning client or a malicious attempt by someone who has
  ///   obtained the refresh token. In this case the underlying refresh token
  ///   will be deleted, and access to it will expire fully when the last access
  ///   token is elapsed.
  ///
  /// This endpoint is unauthenticated, meaning the client won't include any
  /// authentication information with the call.
  @override
  _ida.Future<_iacc.AuthSuccess> refreshAccessToken({String? refreshToken}) =>
      caller.callServerEndpoint<_iacc.AuthSuccess>(
        'jwtRefresh',
        'refreshAccessToken',
        {'refreshToken': refreshToken},
        authenticated: false,
      );
}

/// Community: long-form discussion between Deaf and hard-of-hearing people,
/// their families and learners, plus live meetup rooms for people in the same
/// place ("Here, together"). The same rules as the website's version
/// (backend/community.py at the repo root).
///
/// Every method needs a signed-in account (the app signs in anonymously).
/// Posting needs a community name first ([join]). Only the author edits or
/// deletes a post or reply, only the asker marks the answer, only the meetup's
/// host opens or ends its live room. A live room's code is only given to the
/// host, to show at the venue, and its messages are deleted when the meetup
/// ends. Account ids never leave the server.
/// {@category Endpoint}
class EndpointCommunity extends _isc.EndpointRef {
  EndpointCommunity(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'community';

  /// You in the Community, or null if you have not chosen a name yet.
  _ida.Future<_iwcxaguc.CommunityAuthor?> me() =>
      caller.callServerEndpoint<_iwcxaguc.CommunityAuthor?>(
        'community',
        'me',
        {},
      );

  /// Joins with a name people will see (not necessarily a real name).
  _ida.Future<_iwcxaguc.CommunityAuthor> join(
    String handle,
    String city,
    List<String> ways,
  ) => caller.callServerEndpoint<_iwcxaguc.CommunityAuthor>(
    'community',
    'join',
    {
      'handle': handle,
      'city': city,
      'ways': ways,
    },
  );

  _ida.Future<_iwcxaguc.CommunityAuthor> updateMe(
    String city,
    List<String> ways,
  ) => caller.callServerEndpoint<_iwcxaguc.CommunityAuthor>(
    'community',
    'updateMe',
    {
      'city': city,
      'ways': ways,
    },
  );

  _ida.Future<List<_i4zztl7n.CommunitySpace>> listSpaces() =>
      caller.callServerEndpoint<List<_i4zztl7n.CommunitySpace>>(
        'community',
        'listSpaces',
        {},
      );

  /// Threads, newest activity first ([sort]: active, new, unanswered, meetups).
  _ida.Future<List<_i8e19teb.CommunityPost>> threads(
    String? space,
    String sort,
    String query,
    int offset,
  ) => caller.callServerEndpoint<List<_i8e19teb.CommunityPost>>(
    'community',
    'threads',
    {
      'space': space,
      'sort': sort,
      'query': query,
      'offset': offset,
    },
  );

  _ida.Future<_ix2cfxoy.CommunityThreadDetail> thread(int threadId) =>
      caller.callServerEndpoint<_ix2cfxoy.CommunityThreadDetail>(
        'community',
        'thread',
        {'threadId': threadId},
      );

  _ida.Future<_i8e19teb.CommunityPost> createThread(
    String space,
    _ig7i6uby.CommunityKind kind,
    String title,
    String body,
    _i0uwrkyu.CommunityInput input,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
  ) => caller.callServerEndpoint<_i8e19teb.CommunityPost>(
    'community',
    'createThread',
    {
      'space': space,
      'kind': kind,
      'title': title,
      'body': body,
      'input': input,
      'place': place,
      'city': city,
      'startsAt': startsAt,
      'endsAt': endsAt,
    },
  );

  _ida.Future<_i8e19teb.CommunityPost> editThread(
    int threadId,
    String title,
    String body,
  ) => caller.callServerEndpoint<_i8e19teb.CommunityPost>(
    'community',
    'editThread',
    {
      'threadId': threadId,
      'title': title,
      'body': body,
    },
  );

  _ida.Future<void> deleteThread(int threadId) =>
      caller.callServerEndpoint<void>(
        'community',
        'deleteThread',
        {'threadId': threadId},
      );

  _ida.Future<_iku3rf73.CommunityReplyView> reply(
    int threadId,
    String body,
    _i0uwrkyu.CommunityInput input,
    int? quoteId,
  ) => caller.callServerEndpoint<_iku3rf73.CommunityReplyView>(
    'community',
    'reply',
    {
      'threadId': threadId,
      'body': body,
      'input': input,
      'quoteId': quoteId,
    },
  );

  _ida.Future<_iku3rf73.CommunityReplyView> editReply(
    int replyId,
    String body,
  ) => caller.callServerEndpoint<_iku3rf73.CommunityReplyView>(
    'community',
    'editReply',
    {
      'replyId': replyId,
      'body': body,
    },
  );

  _ida.Future<void> deleteReply(int replyId) => caller.callServerEndpoint<void>(
    'community',
    'deleteReply',
    {'replyId': replyId},
  );

  /// Marks a post or reply as helpful (or not). Returns the new count.
  _ida.Future<int> setHelpful(
    _ilhdyced.CommunityTarget target,
    int id,
    bool on,
  ) => caller.callServerEndpoint<int>(
    'community',
    'setHelpful',
    {
      'target': target,
      'id': id,
      'on': on,
    },
  );

  /// Reports a post or reply. Returns whether it is now hidden for everyone.
  _ida.Future<bool> report(
    _ilhdyced.CommunityTarget target,
    int id,
    String reason,
  ) => caller.callServerEndpoint<bool>(
    'community',
    'report',
    {
      'target': target,
      'id': id,
      'reason': reason,
    },
  );

  _ida.Future<_i8e19teb.CommunityPost> setAnswer(
    int threadId,
    int? replyId,
  ) => caller.callServerEndpoint<_i8e19teb.CommunityPost>(
    'community',
    'setAnswer',
    {
      'threadId': threadId,
      'replyId': replyId,
    },
  );

  _ida.Future<_i8e19teb.CommunityPost> setGoing(
    int threadId,
    bool on,
  ) => caller.callServerEndpoint<_i8e19teb.CommunityPost>(
    'community',
    'setGoing',
    {
      'threadId': threadId,
      'on': on,
    },
  );

  _ida.Future<_i8e19teb.CommunityPost> startLive(int threadId) =>
      caller.callServerEndpoint<_i8e19teb.CommunityPost>(
        'community',
        'startLive',
        {'threadId': threadId},
      );

  _ida.Future<void> endLive(int threadId) => caller.callServerEndpoint<void>(
    'community',
    'endLive',
    {'threadId': threadId},
  );

  /// The live room with this code (anyone who has the code may read it).
  _ida.Future<_i82wj25m.CommunityLiveRoom> live(String code) =>
      caller.callServerEndpoint<_i82wj25m.CommunityLiveRoom>(
        'community',
        'live',
        {'code': code},
      );

  _ida.Future<_i07c5ol7.CommunityLiveMessageView> sayLive(
    String code,
    String text,
    _i0uwrkyu.CommunityInput input,
  ) => caller.callServerEndpoint<_i07c5ol7.CommunityLiveMessageView>(
    'community',
    'sayLive',
    {
      'code': code,
      'text': text,
      'input': input,
    },
  );

  /// Replies, edits and helpful counts in a thread, as they happen.
  _ida.Stream<_ir0ag590.CommunityEvent> listenThread(int threadId) =>
      caller.callStreamingServerEndpoint<
        _ida.Stream<_ir0ag590.CommunityEvent>,
        _ir0ag590.CommunityEvent
      >(
        'community',
        'listenThread',
        {'threadId': threadId},
        {},
      );

  /// Messages in a live room, as they happen, until it ends.
  _ida.Stream<_ir0ag590.CommunityEvent> listenLive(String code) =>
      caller.callStreamingServerEndpoint<
        _ida.Stream<_ir0ag590.CommunityEvent>,
        _ir0ag590.CommunityEvent
      >(
        'community',
        'listenLive',
        {'code': code},
        {},
      );
}

/// Tells the app where the 3D signer, the web app and the Android download are.
///
/// Values come from `config/passwords.yaml` or, on Serverpod Cloud, from
/// `serverpod cloud password set` (names `signerUrl`, `appUrl`,
/// `androidUrl`). They are addresses, not secrets, so no login is needed.
/// {@category Endpoint}
class EndpointSettings extends _isc.EndpointRef {
  EndpointSettings(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'settings';

  _ida.Future<_ida0onrg.AppSettings> get() =>
      caller.callServerEndpoint<_ida0onrg.AppSettings>(
        'settings',
        'get',
        {},
      );
}

/// "Help train Parlance": people who choose to can record signs so the sign
/// reader can be trained on data the Deaf community gave with consent (the
/// current model uses a research-only dataset, which blocks commercial use).
///
/// - Opt-in only, separate from using the app: nothing here is needed for any
///   other feature, and nothing is collected before [giveConsent].
/// - Hand positions only (the 141 numbers the recogniser reads), never video,
///   never a name. Reviewers never learn who recorded a sign.
/// - Fluent signers check each sign; two matching checks verify or reject it.
///   Only verified signs are meant for training.
/// - [withdraw] deletes the consent and every sign and check the person gave.
///
/// Every method needs a signed-in account; each checks what the caller may do.
/// {@category Endpoint}
class EndpointContribute extends _isc.EndpointRef {
  EndpointContribute(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'contribute';

  _ida.Future<List<_i8i2vtw8.ContributionWord>> vocabulary() =>
      caller.callServerEndpoint<List<_i8i2vtw8.ContributionWord>>(
        'contribute',
        'vocabulary',
        {},
      );

  _ida.Future<_iw64po29.ContributionStats> status() =>
      caller.callServerEndpoint<_iw64po29.ContributionStats>(
        'contribute',
        'status',
        {},
      );

  /// Agrees to the consent text of [version]. [decidesForSelf]: they are 18 or
  /// older and decide for themselves, or their lawful guardian agrees too.
  _ida.Future<_iw64po29.ContributionStats> giveConsent(
    String version,
    bool decidesForSelf,
  ) => caller.callServerEndpoint<_iw64po29.ContributionStats>(
    'contribute',
    'giveConsent',
    {
      'version': version,
      'decidesForSelf': decidesForSelf,
    },
  );

  /// Takes back consent and deletes every sign and check this person gave.
  /// Returns how many signs were deleted.
  _ida.Future<int> withdraw() => caller.callServerEndpoint<int>(
    'contribute',
    'withdraw',
    {},
  );

  /// Also check other people's signs (for fluent signers).
  _ida.Future<_iw64po29.ContributionStats> setReviewer(bool on) =>
      caller.callServerEndpoint<_iw64po29.ContributionStats>(
        'contribute',
        'setReviewer',
        {'on': on},
      );

  /// Saves one recorded sign: [frames] is [frameCount] x 141 numbers.
  _ida.Future<_i18zrkqi.ContributionSummary> contribute(
    String gloss,
    List<double> frames,
    int frameCount,
  ) => caller.callServerEndpoint<_i18zrkqi.ContributionSummary>(
    'contribute',
    'contribute',
    {
      'gloss': gloss,
      'frames': frames,
      'frameCount': frameCount,
    },
  );

  /// My signs, newest first.
  _ida.Future<List<_i18zrkqi.ContributionSummary>> mine() =>
      caller.callServerEndpoint<List<_i18zrkqi.ContributionSummary>>(
        'contribute',
        'mine',
        {},
      );

  _ida.Future<void> deleteContribution(int id) =>
      caller.callServerEndpoint<void>(
        'contribute',
        'deleteContribution',
        {'id': id},
      );

  /// Signs waiting for checks: not mine, not already checked by me.
  _ida.Future<List<_i6rpmp3c.ReviewItem>> reviewQueue() =>
      caller.callServerEndpoint<List<_i6rpmp3c.ReviewItem>>(
        'contribute',
        'reviewQueue',
        {},
      );

  /// Checks someone else's sign. Two matching checks decide it.
  _ida.Future<_in4qnmkq.ContributionStatus> review(
    int id,
    _irvelhmk.ReviewVerdict verdict,
  ) => caller.callServerEndpoint<_in4qnmkq.ContributionStatus>(
    'contribute',
    'review',
    {
      'id': id,
      'verdict': verdict,
    },
  );
}

/// This is an example endpoint that returns a greeting message through
/// its [hello] method.
/// {@category Endpoint}
class EndpointGreeting extends _isc.EndpointRef {
  EndpointGreeting(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'greeting';

  /// Returns a personalized greeting message: "Hello {name}".
  _ida.Future<_ia6ix618.Greeting> hello(String name) =>
      caller.callServerEndpoint<_ia6ix618.Greeting>(
        'greeting',
        'hello',
        {'name': name},
      );
}

/// Reads signs from a phone's hand landmarks, live.
///
/// The phone streams one [SignFrame] at a time (the next once the last one's
/// result has arrived) and receives a [SignResult] for each: words when a sign
/// is finished, suggestions when the recogniser is unsure. This is the
/// recogniser from the Parlance web app (parlance-isl/backend), ported to Dart
/// so it runs inside this server.
/// {@category Endpoint}
class EndpointSign extends _isc.EndpointRef {
  EndpointSign(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'sign';

  _ida.Stream<_ieimjpcj.SignResult> read(
    _ida.Stream<_icwofdsv.SignFrame> frames,
  ) =>
      caller.callStreamingServerEndpoint<
        _ida.Stream<_ieimjpcj.SignResult>,
        _ieimjpcj.SignResult
      >(
        'sign',
        'read',
        {},
        {'frames': frames},
      );
}

/// A live conversation between phones in the same place.
///
/// One phone starts a room and shows its six-digit code as a QR code. The other
/// phone scans it (in the app, or in any browser) and joins. Everything said in
/// the room (signed words, speech, typed text, cards) reaches every phone in it
/// at once through [listen].
///
/// Every method needs a signed-in account (anonymous is fine) and checks that
/// the caller is a member of the room before reading or writing it. Rooms
/// expire after [lifetime], and their messages are deleted with them.
/// {@category Endpoint}
class EndpointRoom extends _isc.EndpointRef {
  EndpointRoom(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'room';

  /// Starts a room and joins it as [role].
  _ida.Future<_i0thh3ij.RoomInfo> create(
    _i1ku0jze.MemberRole role,
    String name,
  ) => caller.callServerEndpoint<_i0thh3ij.RoomInfo>(
    'room',
    'create',
    {
      'role': role,
      'name': name,
    },
  );

  /// Joins the open room with [code] as [role]. Joining again returns the
  /// same membership, so a phone can reconnect after losing signal.
  _ida.Future<_i0thh3ij.RoomInfo> join(
    String code,
    _i1ku0jze.MemberRole role,
    String name,
  ) => caller.callServerEndpoint<_i0thh3ij.RoomInfo>(
    'room',
    'join',
    {
      'code': code,
      'role': role,
      'name': name,
    },
  );

  /// Says something in the room. Every phone in it receives it through [listen].
  _ida.Future<_icrhd708.Utterance> say(
    int roomId,
    _igmiwm7x.UtteranceKind kind,
    String text,
    String? hindi,
  ) => caller.callServerEndpoint<_icrhd708.Utterance>(
    'room',
    'say',
    {
      'roomId': roomId,
      'kind': kind,
      'text': text,
      'hindi': hindi,
    },
  );

  /// Shares words still being signed or spoken, so the other side sees them
  /// appear. Not saved. An empty [text] clears it.
  _ida.Future<void> live(
    int roomId,
    String text,
  ) => caller.callServerEndpoint<void>(
    'room',
    'live',
    {
      'roomId': roomId,
      'text': text,
    },
  );

  /// Everything that happens in the room from now on.
  _ida.Stream<_ik2bvkz9.RoomEvent> listen(int roomId) =>
      caller.callStreamingServerEndpoint<
        _ida.Stream<_ik2bvkz9.RoomEvent>,
        _ik2bvkz9.RoomEvent
      >(
        'room',
        'listen',
        {'roomId': roomId},
        {},
      );

  /// Leaves the room. When the last phone leaves, the room and its messages are
  /// deleted.
  _ida.Future<void> leave(int roomId) => caller.callServerEndpoint<void>(
    'room',
    'leave',
    {'roomId': roomId},
  );

  /// Ends the room for everyone and deletes its messages. Only the phone that
  /// started it can do this.
  _ida.Future<void> close(int roomId) => caller.callServerEndpoint<void>(
    'room',
    'close',
    {'roomId': roomId},
  );
}

/// Online translation for the phone app: English or Hindi text -> ISL tokens
/// for the 3D signer, by an AI model with the same ISL grammar prompt as the
/// website (assets/translation, exported by tool/export_translation_prompt.mjs).
///
/// The model's address and key stay on the server (passwords
/// `azureOpenAiEndpoint`, `azureOpenAiKey`, `azureOpenAiDeployment`; never in
/// the app). Needs a signed-in account (anonymous is fine), limits each account
/// to [perMinute] requests a minute, and only returns tokens the signer can
/// play. Returns an empty list when unavailable, so the app falls back to its
/// built-in offline rules.
/// {@category Endpoint}
class EndpointTranslate extends _isc.EndpointRef {
  EndpointTranslate(_isc.EndpointCaller caller) : super(caller);

  @override
  String get name => 'translate';

  _ida.Future<List<String>> toGloss(String text) =>
      caller.callServerEndpoint<List<String>>(
        'translate',
        'toGloss',
        {'text': text},
      );
}

class Modules {
  Modules(Client client) {
    serverpod_auth_idp = _iaic.Caller(client);
    serverpod_auth_core = _iacc.Caller(client);
  }

  late final _iaic.Caller serverpod_auth_idp;

  late final _iacc.Caller serverpod_auth_core;
}

class Client extends _isc.ServerpodClientShared {
  Client(
    String host, {
    dynamic securityContext,
    Duration? streamingConnectionTimeout,
    Duration? connectionTimeout,
    Function(
      _isc.MethodCallContext,
      Object,
      StackTrace,
    )?
    onFailedCall,
    Function(_isc.MethodCallContext)? onSucceededCall,
    bool? disconnectStreamsOnLostInternetConnection,
    _i85jenna.Client? httpClientOverride,
  }) : super(
         host,
         _il2as5qe.Protocol(),
         securityContext: securityContext,
         streamingConnectionTimeout: streamingConnectionTimeout,
         connectionTimeout: connectionTimeout,
         onFailedCall: onFailedCall,
         onSucceededCall: onSucceededCall,
         disconnectStreamsOnLostInternetConnection:
             disconnectStreamsOnLostInternetConnection,
         httpClientOverride: httpClientOverride,
       ) {
    anonymousIdp = EndpointAnonymousIdp(this);
    emailIdp = EndpointEmailIdp(this);
    jwtRefresh = EndpointJwtRefresh(this);
    community = EndpointCommunity(this);
    settings = EndpointSettings(this);
    contribute = EndpointContribute(this);
    greeting = EndpointGreeting(this);
    sign = EndpointSign(this);
    room = EndpointRoom(this);
    translate = EndpointTranslate(this);
    modules = Modules(this);
  }

  late final EndpointAnonymousIdp anonymousIdp;

  late final EndpointEmailIdp emailIdp;

  late final EndpointJwtRefresh jwtRefresh;

  late final EndpointCommunity community;

  late final EndpointSettings settings;

  late final EndpointContribute contribute;

  late final EndpointGreeting greeting;

  late final EndpointSign sign;

  late final EndpointRoom room;

  late final EndpointTranslate translate;

  late final Modules modules;

  @override
  Map<String, _isc.EndpointRef> get endpointRefLookup => {
    'anonymousIdp': anonymousIdp,
    'emailIdp': emailIdp,
    'jwtRefresh': jwtRefresh,
    'community': community,
    'settings': settings,
    'contribute': contribute,
    'greeting': greeting,
    'sign': sign,
    'room': room,
    'translate': translate,
  };

  @override
  Map<String, _isc.ModuleEndpointCaller> get moduleLookup => {
    'serverpod_auth_idp': modules.serverpod_auth_idp,
    'serverpod_auth_core': modules.serverpod_auth_core,
  };
}
