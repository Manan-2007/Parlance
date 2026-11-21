import 'package:flutter/material.dart';

import '../../app/theme.dart';
import 'signer_frame_stub.dart'
    if (dart.library.js_interop) 'signer_frame_web.dart'
    if (dart.library.io) 'signer_frame_native.dart';

/// Parlance's 3D signer (the Ch22 avatar from the website) inline on a page.
/// A new [url] loads a new page.
class SignerView extends StatelessWidget {
  const SignerView({super.key, required this.url, this.height = 440});
  final Uri url;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Brand.paper,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Brand.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: SignerFrame(key: ValueKey(url.toString()), url: url),
    );
  }
}
