import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/router.dart';
import 'app/theme.dart';
import 'core/client.dart';
import 'core/session.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeClient();
  // Sign in quietly in the background, so starting a conversation is instant.
  unawaited(ensureSignedIn().catchError((Object _) {}));
  runApp(const ProviderScope(child: ParlanceApp()));
}

class ParlanceApp extends StatelessWidget {
  const ParlanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Parlance',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      routerConfig: router,
    );
  }
}
