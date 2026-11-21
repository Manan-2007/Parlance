import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../app/theme.dart';
import '../../providers/room_provider.dart';
import 'camera_view.dart';
import 'frame_vector.dart';
import 'recognizer_client.dart';

bool get _isPhone =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS);

/// Signing to the camera, in landscape.
///
/// The recogniser was trained on 16:9 landscape webcam video, so the phone is
/// turned sideways: in portrait the hands would be measured on a different
/// shape and read wrongly. Each finished sign goes straight to the
/// conversation; when the recogniser is unsure it offers words to tap.
///
/// With a [target], it is a Learn practice instead: nothing goes to a
/// conversation, the learner signs the target word, and the screen closes
/// with `true` once the recogniser reads it.
class SignScreen extends ConsumerStatefulWidget {
  const SignScreen({super.key, this.target, this.targetEnglish});

  /// A gloss to practise, e.g. "thankyou".
  final String? target;
  final String? targetEnglish;

  @override
  ConsumerState<SignScreen> createState() => _SignScreenState();
}

class _SignScreenState extends ConsumerState<SignScreen> {
  RecognizerClient? _recognizer;
  RecognizerState _state = const RecognizerState();
  final _assigner = HandAssigner();
  HandFrame? _frame;
  int _hands = 0;
  String? _cameraError;
  bool _permitted = !_isPhone;

  /// Some phones do not turn to landscape (rotation locked by the maker's
  /// settings). After a moment the camera starts anyway and asks to turn.
  bool _turnWaitOver = false;
  Timer? _turnTimer;
  bool _needsSettings = false;
  final _sent = <String>[];
  final _cameraKey = GlobalKey();
  bool get _practice => widget.target != null;

  /// Practice: what the recogniser made of the last finished sign.
  String? _readAs;
  bool _passed = false;

  String _key(String word) =>
      word.toLowerCase().replaceAll(RegExp('[^a-z0-9]'), '');

  void _practiceResult(String word) {
    final hit = _key(word) == _key(widget.target!);
    setState(() {
      _readAs = word;
      _passed = _passed || hit;
    });
    if (hit) {
      HapticFeedback.heavyImpact();
      Future<void>.delayed(const Duration(milliseconds: 1400), () {
        if (mounted) context.pop(true);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    unawaited(WakelockPlus.enable());
    if (_isPhone) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
      unawaited(_askCamera());
      _turnTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) setState(() => _turnWaitOver = true);
      });
    }
  }

  Future<void> _askCamera() async {
    // iOS asks for the camera itself when the capture session starts.
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      setState(() => _permitted = true);
      return;
    }
    final status = await Permission.camera.request();
    if (!mounted) return;
    setState(() {
      _permitted = status.isGranted;
      _needsSettings = status.isPermanentlyDenied;
      if (!status.isGranted) {
        _cameraError = status.isPermanentlyDenied
            ? 'Camera access is off for Parlance. Turn it on in Settings to sign.'
            : 'Allow the camera to sign. Video stays on this phone; only hand positions are sent.';
      }
    });
  }

  void _connect() {
    if (_recognizer != null) return;
    _recognizer = RecognizerClient(
      onWord: (word, confidence) {
        if (_practice) {
          _practiceResult(word);
          return;
        }
        setState(() => _sent.add(word));
        unawaited(
          ref.read(roomProvider.notifier).say(UtteranceKind.sign, word),
        );
        HapticFeedback.mediumImpact();
      },
      onState: (state) {
        if (!mounted) return;
        setState(() => _state = state);
        if (_practice) {
          // Unsure readings count when the target is the reader's best guess.
          final best =
              state.suggestions.firstOrNull?.word ?? state.candidate?.word;
          if (best != null &&
              (state.suggestions.isNotEmpty || state.candidate != null) &&
              !_passed) {
            if (_key(best) == _key(widget.target!)) {
              _practiceResult(best);
            } else if (state.suggestions.isNotEmpty)
              setState(() => _readAs = best);
          }
          return;
        }
        final candidate = state.candidate?.word;
        final room = ref.read(roomProvider.notifier);
        if (candidate != null) {
          room.live('$candidate?');
        }
      },
    );
    unawaited(_recognizer!.connect());
  }

  @override
  void dispose() {
    _turnTimer?.cancel();
    _recognizer?.close();
    if (!_practice) ref.read(roomProvider.notifier).clearLive();
    unawaited(WakelockPlus.disable());
    if (_isPhone) {
      SystemChrome.setPreferredOrientations(DeviceOrientation.values);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
    super.dispose();
  }

  void _onFrame(HandFrame frame, bool upright) {
    final blocks = _assigner.assign(frame.detections);
    final hands = blocks.where((b) => b != null).length;
    if (upright) _recognizer?.send(assembleFrame(blocks));
    if (hands != _hands ||
        frame.detections.isNotEmpty ||
        _frame?.detections.isNotEmpty == true) {
      setState(() {
        _frame = frame;
        _hands = hands;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final room = ref.watch(roomProvider);
    final size = MediaQuery.sizeOf(context);
    final portrait = size.height > size.width;
    if (_recognizer == null) {
      // Connecting reports its status straight away, which must not happen
      // while this frame is being built.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _connect();
      });
    }

    final lastHeard = room.messages.lastWhere(
      (m) => m.memberId != room.me?.id,
      orElse: () => Utterance(
        roomId: 0,
        memberId: 0,
        role: MemberRole.speaker,
        kind: UtteranceKind.typed,
        text: '',
      ),
    );
    final liveText = room.live.values.where((t) => t.isNotEmpty).lastOrNull;

    Widget camera;
    if (_cameraError != null) {
      camera = _Message(
        icon: Icons.videocam_off_rounded,
        text: _cameraError!,
        action: _needsSettings ? 'Open settings' : null,
        onAction: openAppSettings,
      );
    } else if (!_permitted || (_isPhone && portrait && !_turnWaitOver)) {
      // On a phone the screen is still turning to landscape: start the camera
      // once it has, so it starts once.
      camera = const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    } else {
      camera = Stack(
        fit: StackFit.expand,
        children: [
          SignCameraView(
            onFrame: (frame) => _onFrame(frame, !portrait),
            onError: (message) => setState(() => _cameraError = message),
          ),
          if (_frame != null) CustomPaint(painter: _HandsPainter(_frame!)),
          Positioned(
            left: 12,
            top: 12,
            child: _StatusPill(state: _state, hands: _hands),
          ),
          if (portrait)
            const _Message(
              icon: Icons.screen_rotation_rounded,
              text:
                  'Turn your phone sideways to sign. Signs are read in landscape, like a webcam.',
            ),
        ],
      );
    }

    final panel = _practice
        ? _PracticePanel(
            english: widget.targetEnglish ?? widget.target!,
            readAs: _readAs,
            passed: _passed,
            onDone: () => context.pop(_passed),
          )
        : _Panel(
            heard: lastHeard.text,
            live: liveText,
            state: _state,
            sent: _sent,
            onConfirm: (word) => _recognizer?.confirm(word),
            onDone: () => context.pop(),
          );

    return Scaffold(
      backgroundColor: Brand.navy,
      body: SafeArea(
        // One Flex either way, so turning the phone keeps the camera running
        // instead of rebuilding it.
        child: Flex(
          direction: portrait ? Axis.vertical : Axis.horizontal,
          children: [
            Expanded(
              flex: portrait ? 58 : 62,
              child: KeyedSubtree(key: _cameraKey, child: camera),
            ),
            Expanded(flex: portrait ? 42 : 38, child: panel),
          ],
        ),
      ),
    );
  }
}

class _PracticePanel extends StatelessWidget {
  const _PracticePanel({
    required this.english,
    required this.readAs,
    required this.passed,
    required this.onDone,
  });

  final String english;
  final String? readAs;
  final bool passed;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final wrong = readAs != null && !passed;
    return Container(
      color: passed ? Brand.handsSoft : Brand.paper,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                'Your turn: sign',
                style: text.labelLarge?.copyWith(color: Brand.ink3),
              ),
              const Spacer(),
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size(64, 44)),
                onPressed: onDone,
                child: Text(passed ? 'Next' : 'Skip'),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            english,
            style: text.headlineMedium?.copyWith(fontSize: 34, height: 1.05),
          ),
          const Spacer(),
          if (passed)
            Row(
              children: [
                const Icon(
                  Icons.check_circle_rounded,
                  color: Brand.hands,
                  size: 30,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Read as ${english.toLowerCase()}. Well signed!',
                    style: text.titleMedium?.copyWith(color: Brand.handsDeep),
                  ),
                ),
              ],
            )
          else if (wrong)
            Text(
              'That looked like "$readAs". Watch the sign again, then try once more.',
              style: text.titleMedium?.copyWith(color: Brand.ink2),
            )
          else
            Text(
              'Sign it, then lower your hands. The reader checks your hands only, not your face.',
              style: text.titleMedium?.copyWith(color: Brand.ink3),
            ),
        ],
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({
    required this.heard,
    required this.live,
    required this.state,
    required this.sent,
    required this.onConfirm,
    required this.onDone,
  });

  final String heard;
  final String? live;
  final RecognizerState state;
  final List<String> sent;
  final void Function(String word) onConfirm;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final candidate = state.candidate;
    return Container(
      color: Brand.paper,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                'They said',
                style: text.labelLarge?.copyWith(color: Brand.ink3),
              ),
              const Spacer(),
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size(64, 44)),
                onPressed: onDone,
                child: const Text('Done'),
              ),
            ],
          ),
          Expanded(
            child: SingleChildScrollView(
              reverse: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    heard.isEmpty
                        ? 'Their words appear here while you sign.'
                        : heard,
                    style: text.headlineSmall?.copyWith(
                      fontSize: heard.isEmpty ? 18 : 26,
                      color: heard.isEmpty ? Brand.ink3 : Brand.navy,
                      height: 1.15,
                    ),
                  ),
                  if (live != null)
                    Text(
                      live!,
                      style: text.titleLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                        color: Brand.ink2,
                      ),
                    ),
                ],
              ),
            ),
          ),
          const Divider(height: 20),
          if (state.suggestions.isNotEmpty) ...[
            Text(
              'Did you sign…',
              style: text.labelLarge?.copyWith(color: Brand.ink3),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                for (final s in state.suggestions.take(4))
                  ActionChip(
                    backgroundColor: Brand.handsSoft,
                    label: Text(s.word),
                    onPressed: () => onConfirm(s.word),
                  ),
              ],
            ),
          ] else if (candidate != null)
            Text(
              'Reading: ${candidate.word}?',
              style: text.titleMedium?.copyWith(color: Brand.handsDeep),
            )
          else
            Text(
              sent.isEmpty
                  ? 'Sign one word at a time, then lower your hands.'
                  : 'Sent: ${sent.reversed.take(6).toList().reversed.join(' · ')}',
              style: text.titleMedium?.copyWith(
                color: sent.isEmpty ? Brand.ink3 : Brand.handsDeep,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.state, required this.hands});
  final RecognizerState state;
  final int hands;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (state.status) {
      RecognizerStatus.connecting => ('Connecting…', Brand.ink3),
      RecognizerStatus.offline => ('Sign reader offline', Brand.danger),
      RecognizerStatus.ready =>
        hands == 0
            ? ('Show your hands', Brand.ink3)
            : (
                'Reading ${hands == 2 ? 'both hands' : 'one hand'}',
                Brand.hands,
              ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              color: Brand.navy,
            ),
          ),
        ],
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.text,
    this.action,
    this.onAction,
  });
  final IconData icon;
  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Brand.navy.withValues(alpha: 0.92),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 42),
          const SizedBox(height: 12),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (action != null) ...[
            const SizedBox(height: 12),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Brand.navy,
              ),
              onPressed: onAction,
              child: Text(action!),
            ),
          ],
        ],
      ),
    );
  }
}

/// Dots on the tracked hands, drawn over the mirrored preview (the preview
/// fills its box like `object-fit: cover`).
class _HandsPainter extends CustomPainter {
  _HandsPainter(this.frame);
  final HandFrame frame;

  @override
  void paint(Canvas canvas, Size size) {
    if (frame.width == 0 || frame.height == 0) return;
    final scale = math.max(
      size.width / frame.width,
      size.height / frame.height,
    );
    final dx = (size.width - frame.width * scale) / 2;
    final dy = (size.height - frame.height * scale) / 2;
    final dot = Paint()..color = Brand.sun;
    final ring = Paint()
      ..color = Brand.navy
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    for (final hand in frame.detections) {
      for (final p in hand.landmarks) {
        final offset = Offset(
          dx + (1 - p.x) * frame.width * scale,
          dy + p.y * frame.height * scale,
        );
        canvas.drawCircle(offset, 4.5, dot);
        canvas.drawCircle(offset, 4.5, ring);
      }
    }
  }

  @override
  bool shouldRepaint(_HandsPainter old) => old.frame != frame;
}
