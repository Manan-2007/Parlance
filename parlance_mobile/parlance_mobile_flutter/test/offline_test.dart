import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parlance_mobile/core/offline.dart';
import 'package:parlance_mobile/core/offline_server_io.dart';

/// The offline files come from tool/prepare_offline.sh (gitignored); without
/// them these checks are skipped and the app falls back to the server.
Future<bool> _prepared(String asset) async {
  try {
    await rootBundle.load(asset);
    return true;
  } catch (_) {
    return false;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  // flutter_test blocks real HTTP; the signer server is on this machine.
  HttpOverrides.global = null;

  test('pages of the signer app are index.html, files are themselves', () {
    expect(signerAssetFor(''), 'index.html');
    expect(signerAssetFor('embed/sign'), 'index.html');
    expect(signerAssetFor('embed/learn'), 'index.html');
    expect(signerAssetFor('assets/index-1.js'), 'assets/index-1.js');
    expect(signerAssetFor('signs/manifest.json'), 'signs/manifest.json');
  });

  test('the recogniser runs on the phone from the bundled model', () async {
    if (!await _prepared('assets/offline/recognition/transformer.json')) {
      markTestSkipped('Run tool/prepare_offline.sh first');
      return;
    }
    final worker = await Offline.recognizer();
    expect(worker, isNotNull);
    final ready = await worker!.call(1, 'open');
    expect(ready['status'], 'ready');
    expect((ready['automatic'] as List), isNotEmpty);
    // A resting frame (no hands) is read without error.
    final answer = await worker.call(1, 'feed', [List<double>.filled(141, 0), 0.0]);
    expect(answer.containsKey('error'), isFalse, reason: '$answer');
  });

  test('the bundled 3D signer is served from this phone', () async {
    if (!await _prepared('assets/offline/signer/index.html')) {
      markTestSkipped('Run tool/prepare_offline.sh first');
      return;
    }
    final base = await Offline.signerBase();
    expect(base, isNotNull);
    expect(base!.host, '127.0.0.1');
    final http = HttpClient();
    Future<(int, String, String)> get(String path) async {
      final response = await (await http.getUrl(base.resolve(path))).close();
      final body = await response.transform(const Utf8Decoder(allowMalformed: true)).join();
      return (response.statusCode, response.headers.contentType?.mimeType ?? '', body);
    }

    final page = await get('embed/sign?text=hello');
    expect(page.$1, 200);
    expect(page.$2, 'text/html');
    final script = RegExp(r'src="/signer/(assets/[^"]+\.js)"').firstMatch(page.$3)?.group(1);
    expect(script, isNotNull, reason: 'the page loads its script from /signer/assets/');
    final js = await get(script!);
    expect((js.$1, js.$2), (200, 'text/javascript'));
    expect((await get('assets/ch22.glb')).$1, 200);
    expect((await get('assets/nothing-here.js')).$1, 404);
    http.close(force: true);
  });
}
