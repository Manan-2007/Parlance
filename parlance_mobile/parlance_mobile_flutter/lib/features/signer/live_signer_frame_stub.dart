import 'package:flutter/material.dart';

import 'live_signer_controller.dart';

class LiveSignerFrame extends StatelessWidget {
  const LiveSignerFrame({
    super.key,
    required this.url,
    required this.controller,
  });
  final Uri url;
  final LiveSignerController controller;

  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('The 3D signer is not available here.'));
}
