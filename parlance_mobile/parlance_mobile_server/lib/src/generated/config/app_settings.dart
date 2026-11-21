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
import 'package:serverpod/serverpod.dart' as _is;

/// Addresses the app needs. Set on the server, so a phone never needs
/// rebuilding when one of them moves.
abstract class AppSettings
    implements _is.SerializableModel, _is.ProtocolSerialization {
  AppSettings._({
    this.signerUrl,
    this.appUrl,
    this.androidUrl,
    this.androidBuild,
  });

  factory AppSettings({
    String? signerUrl,
    String? appUrl,
    String? androidUrl,
    int? androidBuild,
  }) = _AppSettingsImpl;

  factory AppSettings.fromJson(Map<String, dynamic> jsonSerialization) {
    return AppSettings(
      signerUrl: jsonSerialization['signerUrl'] as String?,
      appUrl: jsonSerialization['appUrl'] as String?,
      androidUrl: jsonSerialization['androidUrl'] as String?,
      androidBuild: jsonSerialization['androidBuild'] as int?,
    );
  }

  /// Web page that plays text in ISL with the 3D signer.
  String? signerUrl;

  /// Public web address of this app, used in QR codes so anyone can join from a browser.
  String? appUrl;

  /// Where to download the Android app (shown to Android visitors of the web app).
  String? androidUrl;

  /// Build number of the newest Android app at androidUrl; older apps offer to update.
  int? androidBuild;

  /// Returns a shallow copy of this [AppSettings]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  AppSettings copyWith({
    String? signerUrl,
    String? appUrl,
    String? androidUrl,
    int? androidBuild,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'AppSettings',
      if (signerUrl != null) 'signerUrl': signerUrl,
      if (appUrl != null) 'appUrl': appUrl,
      if (androidUrl != null) 'androidUrl': androidUrl,
      if (androidBuild != null) 'androidBuild': androidBuild,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'AppSettings',
      if (signerUrl != null) 'signerUrl': signerUrl,
      if (appUrl != null) 'appUrl': appUrl,
      if (androidUrl != null) 'androidUrl': androidUrl,
      if (androidBuild != null) 'androidBuild': androidBuild,
    };
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _AppSettingsImpl extends AppSettings {
  _AppSettingsImpl({
    String? signerUrl,
    String? appUrl,
    String? androidUrl,
    int? androidBuild,
  }) : super._(
         signerUrl: signerUrl,
         appUrl: appUrl,
         androidUrl: androidUrl,
         androidBuild: androidBuild,
       );

  /// Returns a shallow copy of this [AppSettings]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  AppSettings copyWith({
    Object? signerUrl = _Undefined,
    Object? appUrl = _Undefined,
    Object? androidUrl = _Undefined,
    Object? androidBuild = _Undefined,
  }) {
    return AppSettings(
      signerUrl: signerUrl is String? ? signerUrl : this.signerUrl,
      appUrl: appUrl is String? ? appUrl : this.appUrl,
      androidUrl: androidUrl is String? ? androidUrl : this.androidUrl,
      androidBuild: androidBuild is int? ? androidBuild : this.androidBuild,
    );
  }
}
