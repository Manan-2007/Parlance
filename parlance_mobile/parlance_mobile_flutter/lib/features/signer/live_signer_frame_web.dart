import 'dart:convert';
import 'dart:js_interop';
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

import 'live_signer_controller.dart';

/// The live signer in an iframe (web); words reach it by postMessage.
class LiveSignerFrame extends StatefulWidget {
  const LiveSignerFrame({
    super.key,
    required this.url,
    required this.controller,
  });
  final Uri url;
  final LiveSignerController controller;

  @override
  State<LiveSignerFrame> createState() => _LiveSignerFrameState();
}

class _LiveSignerFrameState extends State<LiveSignerFrame> {
  late final String _type = 'parlance-live-signer-${identityHashCode(this)}';
  web.HTMLIFrameElement? _frame;

  void _post(Map<String, Object?> message) {
    _frame?.contentWindow?.postMessage(jsonEncode(message).toJS, '*'.toJS);
  }

  @override
  void initState() {
    super.initState();
    ui_web.platformViewRegistry.registerViewFactory(_type, (int id) {
      return _frame = web.HTMLIFrameElement()
        ..src = widget.url.toString()
        ..allow = 'autoplay'
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%';
    });
    widget.controller.attach(
      (text, isFinal) => _post({'live': true, 'text': text, 'final': isFinal}),
      () => _post({'live': true, 'reset': true}),
    );
  }

  @override
  void dispose() {
    widget.controller.detach();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => HtmlElementView(viewType: _type);
}
