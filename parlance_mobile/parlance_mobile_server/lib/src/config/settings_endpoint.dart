import 'package:serverpod/serverpod.dart';

import '../generated/protocol.dart';

/// Tells the app where the 3D signer, the web app and the Android download are.
///
/// Values come from `config/passwords.yaml` or, on Serverpod Cloud, from
/// `serverpod cloud password set` (names `signerUrl`, `appUrl`,
/// `androidUrl`). They are addresses, not secrets, so no login is needed.
class SettingsEndpoint extends Endpoint {
  Future<AppSettings> get(Session session) async {
    String? value(String name) {
      final text = session.passwords[name]?.trim();
      return text == null || text.isEmpty ? null : text;
    }

    return AppSettings(
      signerUrl: value('signerUrl'),
      appUrl: value('appUrl'),
      androidUrl: value('androidUrl'),
      androidBuild: int.tryParse(value('androidBuild') ?? ''),
    );
  }
}
