import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../../app/theme.dart';
import '../../core/session.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';
import 'scan_screen.dart';

/// "How will you take part?" Two big choices, coloured like everywhere else:
/// blue for signing, tangerine for speaking.
class RolePicker extends StatelessWidget {
  const RolePicker({super.key, required this.value, required this.onChanged});
  final MemberRole? value;
  final ValueChanged<MemberRole> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _RoleOption(
          selected: value == MemberRole.signer,
          icon: Icons.sign_language_rounded,
          title: 'I sign',
          body:
              'Sign to the camera or tap a card. Read what they say in big text.',
          color: Brand.hands,
          soft: Brand.handsSoft,
          onTap: () => onChanged(MemberRole.signer),
        ),
        const SizedBox(height: 10),
        _RoleOption(
          selected: value == MemberRole.speaker,
          icon: Icons.record_voice_over_rounded,
          title: 'I speak',
          body: 'Talk or type. Read their signs, and hear them read aloud.',
          color: Brand.voice,
          soft: Brand.voiceSoft,
          onTap: () => onChanged(MemberRole.speaker),
        ),
      ],
    );
  }
}

class _RoleOption extends StatelessWidget {
  const _RoleOption({
    required this.selected,
    required this.icon,
    required this.title,
    required this.body,
    required this.color,
    required this.soft,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String title;
  final String body;
  final Color color;
  final Color soft;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Semantics(
      selected: selected,
      button: true,
      child: Material(
        color: selected ? soft : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(
            color: selected ? color : Brand.line,
            width: selected ? 2.5 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: Colors.white),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: text.titleMedium?.copyWith(fontSize: 18),
                      ),
                      Text(body, style: text.bodyMedium),
                    ],
                  ),
                ),
                Icon(
                  selected
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_off_rounded,
                  color: selected ? color : Brand.lineStrong,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Starts a conversation. The other phone joins with the QR code shown next.
class StartScreen extends ConsumerStatefulWidget {
  const StartScreen({super.key});

  @override
  ConsumerState<StartScreen> createState() => _StartScreenState();
}

class _StartScreenState extends ConsumerState<StartScreen> {
  MemberRole? _role;
  final _name = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileProvider);
    _role = profile.role ?? MemberRole.signer;
    _name.text = profile.name;
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final role = _role;
    if (role == null || _busy) return;
    setState(() => _busy = true);
    final profiles = ref.read(profileProvider.notifier);
    await profiles.update(
      ref.read(profileProvider).copyWith(role: role, name: _name.text.trim()),
    );
    try {
      await ref.read(roomProvider.notifier).start(role, _name.text);
      if (mounted) context.pushReplacement('/room?invite=1');
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final error = ref.watch(roomProvider.select((s) => s.error));
    return Scaffold(
      appBar: AppBar(title: const Text('Start a conversation')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('How will you take part?', style: text.titleLarge),
                  const SizedBox(height: 12),
                  RolePicker(
                    value: _role,
                    onChanged: (role) => setState(() => _role = role),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    maxLength: 40,
                    decoration: const InputDecoration(
                      labelText: 'Your name (optional)',
                      hintText: 'Shown on their phone',
                      counterText: '',
                    ),
                    onSubmitted: (_) => _start(),
                  ),
                  const SizedBox(height: 16),
                  if (error != null) ...[
                    Notice(message: error, danger: true),
                    const SizedBox(height: 12),
                  ],
                  FilledButton.icon(
                    onPressed: _busy ? null : _start,
                    icon: _busy
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.qr_code_2_rounded),
                    label: Text(
                      _busy ? 'Starting…' : 'Start and show the code',
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'The other person scans the code with this app, or with their phone camera to join from a browser. Nothing to install.',
                    style: text.bodyMedium?.copyWith(color: Brand.ink3),
                    textAlign: TextAlign.center,
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

/// Joins a conversation by QR code or six-digit code.
class JoinScreen extends ConsumerStatefulWidget {
  const JoinScreen({super.key, this.code});
  final String? code;

  @override
  ConsumerState<JoinScreen> createState() => _JoinScreenState();
}

class _JoinScreenState extends ConsumerState<JoinScreen> {
  MemberRole? _role;
  final _code = TextEditingController();
  final _name = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileProvider);
    // Whoever shows the QR code is usually signing, so a person joining from a
    // link is most likely the one speaking.
    _role = widget.code != null
        ? MemberRole.speaker
        : (profile.role ?? MemberRole.speaker);
    _code.text = widget.code ?? '';
    _name.text = profile.name;
  }

  @override
  void dispose() {
    _code.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _scan() async {
    final scanned = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const ScanScreen()));
    final code = scanned == null ? null : codeFrom(scanned);
    if (code == null) return;
    setState(() => _code.text = code);
    await _join();
  }

  Future<void> _join() async {
    final role = _role;
    final code = codeFrom(_code.text);
    if (role == null || _busy) return;
    if (code == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('The code has six digits.')));
      return;
    }
    setState(() => _busy = true);
    await ref
        .read(profileProvider.notifier)
        .update(
          ref
              .read(profileProvider)
              .copyWith(role: role, name: _name.text.trim()),
        );
    try {
      await ref.read(roomProvider.notifier).join(code, role, _name.text);
      if (mounted) context.pushReplacement('/room');
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final error = ref.watch(roomProvider.select((s) => s.error));
    final canScan =
        !kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.android ||
            defaultTargetPlatform == TargetPlatform.iOS);
    return Scaffold(
      appBar: AppBar(title: const Text('Join a conversation')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (canScan) ...[
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Brand.voice,
                        foregroundColor: Brand.navy,
                        minimumSize: const Size(64, 60),
                      ),
                      onPressed: _busy ? null : _scan,
                      icon: const Icon(Icons.qr_code_scanner_rounded),
                      label: const Text('Scan their QR code'),
                    ),
                    const SizedBox(height: 18),
                    Text('Or type the code', style: text.titleMedium),
                    const SizedBox(height: 8),
                  ] else
                    Text(
                      'The six digits on their screen',
                      style: text.titleMedium,
                    ),
                  if (!canScan) const SizedBox(height: 8),
                  TextField(
                    controller: _code,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    textAlign: TextAlign.center,
                    style: text.headlineMedium?.copyWith(letterSpacing: 10),
                    decoration: const InputDecoration(hintText: '000000'),
                    onSubmitted: (_) => _join(),
                  ),
                  const SizedBox(height: 22),
                  Text('How will you take part?', style: text.titleMedium),
                  const SizedBox(height: 10),
                  RolePicker(
                    value: _role,
                    onChanged: (role) => setState(() => _role = role),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    maxLength: 40,
                    decoration: const InputDecoration(
                      labelText: 'Your name or role (optional)',
                      hintText: 'e.g. Front desk',
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (error != null) ...[
                    Notice(message: error, danger: true),
                    const SizedBox(height: 12),
                  ],
                  FilledButton(
                    onPressed: _busy ? null : _join,
                    child: Text(_busy ? 'Joining…' : 'Join'),
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
