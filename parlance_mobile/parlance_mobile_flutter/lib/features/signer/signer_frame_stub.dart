import 'package:flutter/material.dart';

class SignerFrame extends StatelessWidget {
  const SignerFrame({super.key, required this.url});
  final Uri url;

  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('The 3D signer is not available here.'));
}
