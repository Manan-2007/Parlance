import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../app/theme.dart';

/// The 3D signer in a web view (Android and iOS).
class SignerFrame extends StatefulWidget {
  const SignerFrame({super.key, required this.url});
  final Uri url;

  @override
  State<SignerFrame> createState() => _SignerFrameState();
}

class _SignerFrameState extends State<SignerFrame> {
  late final WebViewController _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Brand.paper)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) =>
              mounted ? setState(() => _loading = false) : null,
          onWebResourceError: (error) {
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(
                  () => _error =
                      'The signer could not load. Check your internet connection.',
                );
              }
            }
          },
        ),
      )
      ..loadRequest(widget.url);
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
        WebViewWidget(controller: _controller),
        if (_loading) const Center(child: CircularProgressIndicator()),
      ],
    );
  }
}
