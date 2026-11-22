import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../app/theme.dart';
import 'live_signer_controller.dart';

/// The live signer in a web view (Android and iOS); words reach it through
/// `window.parlanceLive.hear(text, isFinal)`.
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
  late final WebViewController _web;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Brand.paper)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (error) {
            if ((error.isForMainFrame ?? true) && mounted) {
              setState(
                () => _error =
                    'The signer could not load. Check your internet connection.',
              );
            }
          },
        ),
      )
      ..loadRequest(widget.url);
    widget.controller.attach(
      (text, isFinal) => _web.runJavaScript(
        'window.parlanceLive && window.parlanceLive.hear(${jsonEncode(text)}, $isFinal);',
      ),
      () => _web.runJavaScript(
        'window.parlanceLive && window.parlanceLive.reset();',
      ),
    );
  }

  @override
  void dispose() {
    widget.controller.detach();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error!, textAlign: TextAlign.center),
        ),
      );
    }
    return Stack(
      children: [
        WebViewWidget(controller: _web),
        if (_loading) const Center(child: CircularProgressIndicator()),
      ],
    );
  }
}
