import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

const _root = 'assets/offline/signer';

const _types = {
  'html': 'text/html; charset=utf-8',
  'js': 'text/javascript; charset=utf-8',
  'mjs': 'text/javascript; charset=utf-8',
  'css': 'text/css; charset=utf-8',
  'json': 'application/json',
  'webmanifest': 'application/manifest+json',
  'svg': 'image/svg+xml',
  'png': 'image/png',
  'webp': 'image/webp',
  'glb': 'model/gltf-binary',
  'wasm': 'application/wasm',
  'woff2': 'font/woff2',
  'txt': 'text/plain; charset=utf-8',
};

/// Serves the 3D signer bundled in the app at `http://127.0.0.1:<port>/signer/`
/// (the path it was built for), so the web view works without internet. Only
/// this phone can reach it: it listens on the loopback address.
///
/// Returns null when the app was built without the signer.
Future<Uri?> startSignerServer(AssetBundle bundle) async {
  try {
    await bundle.load('$_root/index.html');
  } catch (_) {
    return null;
  }
  try {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    server.listen((request) => _serve(bundle, request));
    return Uri.parse('http://127.0.0.1:${server.port}/signer/');
  } catch (error) {
    debugPrint('Offline signer could not start: $error');
    return null;
  }
}

Future<void> _serve(AssetBundle bundle, HttpRequest request) async {
  final response = request.response;
  try {
    final path = request.uri.path;
    if (request.method != 'GET' && request.method != 'HEAD' ||
        !path.startsWith('/signer/')) {
      response.statusCode = HttpStatus.notFound;
      return;
    }
    final relative = path.substring('/signer/'.length);
    if (relative.split('/').contains('..')) {
      response.statusCode = HttpStatus.forbidden;
      return;
    }
    final file = signerAssetFor(relative);
    ByteData data;
    try {
      data = await bundle.load('$_root/$file');
    } catch (_) {
      response.statusCode = HttpStatus.notFound;
      return;
    }
    final extension = file.contains('.')
        ? file.split('.').last.toLowerCase()
        : '';
    response.headers
      ..set(
        HttpHeaders.contentTypeHeader,
        _types[extension] ?? 'application/octet-stream',
      )
      ..set(HttpHeaders.cacheControlHeader, 'no-cache');
    if (request.method == 'GET') {
      response.add(
        data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
      );
    }
  } finally {
    await response.close();
  }
}

/// The bundled file for a path under /signer/: pages of the single-page app
/// (no file extension, e.g. `embed/sign`) are `index.html`.
@visibleForTesting
String signerAssetFor(String relative) {
  if (relative.isEmpty || !relative.split('/').last.contains('.')) {
    return 'index.html';
  }
  return relative;
}
