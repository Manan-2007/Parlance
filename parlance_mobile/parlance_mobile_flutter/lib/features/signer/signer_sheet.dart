import 'package:flutter/material.dart';

import '../../app/theme.dart';
import 'signer_frame_stub.dart'
    if (dart.library.js_interop) 'signer_frame_web.dart'
    if (dart.library.io) 'signer_frame_native.dart';

/// Plays [text] in Indian Sign Language with Parlance's 3D signer.
///
/// The signer is the web app's three.js avatar, shown in a web view (or an
/// iframe on the web), so the app and the website sign the same way.
Future<void> showSigner(BuildContext context, Uri signer, String text) {
  final url = signer.replace(
    queryParameters: {...signer.queryParameters, 'text': text},
  );
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Brand.surface,
    builder: (context) => SafeArea(
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.82,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 4),
              child: Text(text, style: Theme.of(context).textTheme.titleLarge),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Text(
                'The 3D signer is approximate. Words it does not know are fingerspelled.',
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: SignerFrame(url: url),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
