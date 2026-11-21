import 'package:serverpod_auth_idp_server/providers/anonymous.dart';

/// Lets each phone get its own account without an email, so a conversation can
/// start in seconds. The account only identifies the phone to its rooms.
class AnonymousIdpEndpoint extends AnonymousIdpBaseEndpoint {}
