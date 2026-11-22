import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/theme.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';

/// Everything Parlance does, by the situation you are in. Emergency is first.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final room = ref.watch(roomProvider);
    // On an Android phone's browser, offer the installed app (it signs faster).
    final services = ref.watch(servicesProvider).value;
    final android = kIsWeb && defaultTargetPlatform == TargetPlatform.android
        ? services?.android
        : null;
    // The installed Android app offers a newer build when one is deployed.
    final update = !kIsWeb && services?.updateAvailable == true
        ? services!.android
        : null;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Parlance',
                        style: text.titleMedium?.copyWith(
                          color: Brand.royal,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        tooltip: 'About me and settings',
                        onPressed: () => context.push('/about'),
                        icon: const Icon(Icons.person_outline_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'What do you need right now?',
                    style: text.displaySmall?.copyWith(
                      fontSize: 34,
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Talk with someone nearby, phone to phone, or show a card at a counter.',
                    style: text.bodyLarge?.copyWith(color: Brand.ink2),
                  ),
                  if (update != null) ...[
                    const SizedBox(height: 16),
                    ActionTile(
                      icon: Icons.system_update_rounded,
                      title: 'Update available',
                      body:
                          'A newer Parlance is ready. Tap to download, then install it over this one.',
                      background: Brand.sun,
                      bordered: false,
                      onTap: () => launchUrl(
                        update,
                        mode: LaunchMode.externalApplication,
                      ),
                    ),
                  ],
                  if (android != null) ...[
                    const SizedBox(height: 16),
                    ActionTile(
                      icon: Icons.android_rounded,
                      title: 'Get the Android app',
                      body:
                          'Signing runs faster in the app than in the browser.',
                      onTap: () => launchUrl(android),
                    ),
                  ],
                  const SizedBox(height: 22),
                  _EmergencyBar(onTap: () => context.go('/cards/emergency')),
                  if (room.active) ...[
                    const SizedBox(height: 12),
                    ActionTile(
                      icon: Icons.forum_rounded,
                      title: 'Back to the conversation',
                      body:
                          '${room.others.length + 1} ${room.others.isEmpty ? 'phone' : 'phones'} · code ${room.room!.code}',
                      background: Brand.navy,
                      foreground: Colors.white,
                      bordered: false,
                      onTap: () => context.push('/room'),
                    ),
                  ],
                  const SectionTitle(
                    'Talk with someone',
                    description: 'Each phone shows what the other one says.',
                  ),
                  ActionTile(
                    icon: Icons.sign_language_rounded,
                    title: 'Start a conversation',
                    body:
                        'Sign to your camera, they read it. They speak, you read it.',
                    background: Brand.hands,
                    foreground: Colors.white,
                    iconBackground: Colors.white.withValues(alpha: 0.16),
                    bordered: false,
                    onTap: () => context.push('/talk'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.qr_code_scanner_rounded,
                    title: 'Join with a code',
                    body: 'Scan their QR code or type the six digits.',
                    background: Brand.voice,
                    foreground: Brand.navy,
                    bordered: false,
                    onTap: () => context.push('/join'),
                  ),
                  const SectionTitle('On this phone'),
                  ActionTile(
                    icon: Icons.record_voice_over_rounded,
                    title: 'Speech → Sign',
                    body:
                        'Say or type something in English or Hindi. The 3D signer shows it in ISL.',
                    background: Brand.voiceSoft,
                    bordered: false,
                    onTap: () => context.go('/translate'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.school_rounded,
                    title: 'Learn ISL',
                    body:
                        'Short lessons: watch each sign, then sign it to your camera.',
                    background: Brand.handsSoft,
                    bordered: false,
                    onTap: () => context.go('/learn'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.style_rounded,
                    title: 'Show a card',
                    body:
                        'Hospital, pharmacy, police, bank, station: ready messages in English and Hindi.',
                    background: Brand.sun,
                    foreground: Brand.navy,
                    bordered: false,
                    onTap: () => context.go('/cards'),
                  ),
                  const SectionTitle(
                    'Community',
                    description:
                        'Long conversations with people who live it, and meetups in person.',
                  ),
                  ActionTile(
                    icon: Icons.forum_rounded,
                    title: 'Ask the community',
                    body:
                        'Work, exams, documents, health, family. Every post can be seen in sign.',
                    background: Brand.navy,
                    foreground: Colors.white,
                    iconBackground: Colors.white.withValues(alpha: 0.16),
                    bordered: false,
                    onTap: () => context.go('/community'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.podcasts_rounded,
                    title: 'At a meetup? Join live',
                    body:
                        "Type the host's code. Everyone there shares one screen of big messages.",
                    background: Brand.voiceSoft,
                    bordered: false,
                    onTap: () => context.push('/community/live'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.volunteer_activism_outlined,
                    title: 'Help train Parlance',
                    body:
                        'Optional: record signs (hand positions only, never video) to make the sign reader better.',
                    onTap: () => context.push('/contribute'),
                  ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.badge_outlined,
                    title: 'About me',
                    body:
                        'Emergency contact and medical details, kept only on this phone.',
                    onTap: () => context.push('/about'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmergencyBar extends StatelessWidget {
  const _EmergencyBar({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Material(
      color: Brand.danger,
      borderRadius: BorderRadius.circular(28),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.emergency_rounded, color: Brand.danger),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Emergency',
                      style: text.titleMedium?.copyWith(
                        color: Colors.white,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      'Ask for help, an ambulance or the police through someone nearby.',
                      style: text.bodyMedium?.copyWith(
                        color: Colors.white.withValues(alpha: 0.88),
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
