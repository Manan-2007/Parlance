import 'package:flutter/foundation.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

import 'client.dart';
import 'offline.dart';

/// Makes sure this phone has an account before it starts or joins a room.
///
/// The account is anonymous: no email or password, so a conversation can start
/// in seconds. It only identifies this phone to the rooms it is in, and is kept
/// on the phone by the auth session manager.
///
/// Calls that overlap (the quiet sign-in at start-up and a Join tap on a slow
/// connection) share one attempt. Two parallel logins would create two
/// accounts, and the room would be joined with one but listened to with the
/// other.
Future<void> ensureSignedIn() =>
    _signingIn ??= _signIn().whenComplete(() => _signingIn = null);

Future<void>? _signingIn;
bool _initialized = false;

Future<void> _signIn() async {
  if (!_initialized) {
    await client.auth.initialize();
    _initialized = true;
  }
  if (client.auth.isAuthenticated) return;
  final success = await client.anonymousIdp.login();
  await client.auth.updateSignedInUser(success);
}

/// The app's view of [AppSettings], with local addresses rewritten for the
/// device the app runs on (an Android emulator reaches this computer at
/// 10.0.2.2, a phone on Wi-Fi at the computer's address).
class ServiceAddresses {
  const ServiceAddresses({
    this.signer,
    this.app,
    this.android,
    this.androidBuild,
  });

  /// This app's build number (set by tool/build_android.sh).
  static const appBuild = int.fromEnvironment('APP_BUILD');

  /// The newest Android app's build number on the server.
  final int? androidBuild;

  /// Whether a newer Android app is waiting at [android].
  bool get updateAvailable =>
      android != null && appBuild > 0 && (androidBuild ?? 0) > appBuild;

  /// The 3D signer playing [text] (English or Hindi), translated to ISL.
  Uri? signText(String text) =>
      signer?.replace(queryParameters: {'text': text});

  /// The 3D signer playing these ISLRTC signs in order (a Learn phrase);
  /// [english] is translated instead if the avatar lacks one of them.
  Uri? signGlosses(List<String> glosses, String english) => signer?.replace(
    queryParameters: {'glosses': glosses.join(','), 'text': english},
  );

  /// The ISLRTC recordings of these signs in order (for phrases the 3D
  /// avatar cannot sign without fingerspelling).
  Uri? learnSigns(List<String> glosses) => signer
      ?.resolve('learn')
      .replace(queryParameters: {'signs': glosses.join(',')});

  /// Learn's view of one sign: the 3D avatar, the ISLRTC signer and the
  /// official video.
  Uri? learnSign(String gloss) =>
      signer?.resolve('learn').replace(queryParameters: {'sign': gloss});

  final Uri? signer;
  final Uri? app;

  /// Where to download the Android app.
  final Uri? android;

  /// The server's addresses, with the 3D signer bundled in the app (when it
  /// has one) used instead of the server's, so signing works offline. Without
  /// internet only the bundled signer is known.
  static Future<ServiceAddresses> load() async {
    final bundled = await Offline.signerBase();
    final bundledSigner = bundled?.resolve('embed/sign');
    AppSettings? settings;
    try {
      settings = await client.settings.get().timeout(const Duration(seconds: 8));
    } catch (error) {
      if (bundledSigner == null) rethrow;
      debugPrint('Parlance is offline; using the signer in the app. ($error)');
    }
    final server = Uri.parse(client.host);
    Uri? local(String? value) {
      if (value == null) return null;
      final uri = Uri.tryParse(value);
      if (uri == null) return null;
      const loopback = {'localhost', '127.0.0.1'};
      if (loopback.contains(uri.host) &&
          !loopback.contains(server.host) &&
          server.host.isNotEmpty) {
        return uri.replace(host: server.host);
      }
      return uri;
    }

    final addresses = ServiceAddresses(
      signer: bundledSigner ?? local(settings?.signerUrl),
      app: local(settings?.appUrl),
      android: local(settings?.androidUrl),
      androidBuild: settings?.androidBuild,
    );
    debugPrint(
      'Parlance services: signer=${addresses.signer} app=${addresses.app}',
    );
    return addresses;
  }

  /// The link in a room's QR code. Anyone can open it in a browser to join.
  String joinLink(String code) {
    final base = app;
    if (base == null) return code;
    return base.replace(fragment: '/join/$code').toString();
  }
}

/// Reads a six-digit room code out of a scanned QR code or typed text.
String? codeFrom(String text) {
  final match = RegExp(r'(?:join/)?(\d{6})(?!\d)').firstMatch(text);
  return match?.group(1);
}
