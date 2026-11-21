import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

/// The 3D signer in an iframe (web).
class SignerFrame extends StatelessWidget {
  const SignerFrame({super.key, required this.url});
  final Uri url;

  @override
  Widget build(BuildContext context) {
    final type = 'parlance-signer-${url.hashCode}';
    ui_web.platformViewRegistry.registerViewFactory(type, (int id) {
      return web.HTMLIFrameElement()
        ..src = url.toString()
        ..allow = 'autoplay'
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%';
    });
    return HtmlElementView(viewType: type);
  }
}
