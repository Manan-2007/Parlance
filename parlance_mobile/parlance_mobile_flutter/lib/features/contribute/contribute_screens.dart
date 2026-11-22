import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';

import '../../app/theme.dart';
import '../../core/client.dart';
import '../../providers/contribute_provider.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';
import '../signer/signer_sheet.dart';
import 'hands_replay.dart';

void _toast(BuildContext context, String message) =>
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));

/// "Help train Parlance": opt-in recording of signs to train the sign reader.
/// Consent first, then record, check other people's signs, see and delete
/// what you gave, or withdraw and delete everything.
class ContributeScreen extends ConsumerWidget {
  const ContributeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(contributeStatusProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Help train Parlance')),
      body: switch (status) {
        AsyncData(value: final s) when !s.consented => _ConsentView(
          version: s.currentVersion,
          changed: s.version != null,
        ),
        AsyncData(value: final s) => _Dashboard(stats: s),
        AsyncError(:final error) => Padding(
          padding: const EdgeInsets.all(20),
          child: Notice(
            message: contributeError(error),
            danger: true,
            action: 'Try again',
            onAction: () => ref.invalidate(contributeStatusProvider),
          ),
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}

/// The consent text, in plain words. Agreeing is separate from using the app.
class _ConsentView extends ConsumerStatefulWidget {
  const _ConsentView({required this.version, required this.changed});
  final String version;
  final bool changed;

  @override
  ConsumerState<_ConsentView> createState() => _ConsentViewState();
}

class _ConsentViewState extends ConsumerState<_ConsentView> {
  bool _forSelf = false;
  bool _busy = false;
  String? _error;

  static const _points = [
    (
      Icons.sign_language_rounded,
      'Why',
      "Parlance's sign reader was trained on research videos that cannot be used commercially. To make it better, and usable by hospitals, banks and offices, it needs signs recorded by the Deaf community, with permission.",
    ),
    (
      Icons.pan_tool_alt_outlined,
      'What is kept',
      'The word you chose, and the positions of your hands while you sign it: numbers for 21 points on each hand. Never video or photos, never your face, never your name.',
    ),
    (
      Icons.model_training_rounded,
      'How it is used',
      "Only to train and test Parlance's sign reader. Fluent signers check each sign first. It is not sold.",
    ),
    (
      Icons.visibility_outlined,
      'Who sees it',
      'The Parlance team, and fluent signers who check signs. They see moving dots of hands and the word, not who you are.',
    ),
    (
      Icons.delete_outline_rounded,
      'How long',
      "Until you delete it. You can delete one sign, or withdraw and delete everything, at any time on this screen. It is kept on Parlance's server.",
    ),
    (
      Icons.check_circle_outline_rounded,
      'Your choice',
      'Saying no changes nothing else in the app.',
    ),
  ];

  Future<void> _agree() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await client.contribute.giveConsent(widget.version, _forSelf);
      ref.invalidate(contributeStatusProvider);
    } catch (e) {
      if (mounted) setState(() => _error = contributeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
      children: [
        PageBody(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Teach the sign reader your signs',
                style: text.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                widget.changed
                    ? 'How your signs are used has changed. Please read it again.'
                    : 'Optional. Read how it works first.',
                style: text.bodyLarge,
              ),
              const SizedBox(height: 16),
              for (final (icon, title, body) in _points)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(icon, color: Brand.hands),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title, style: text.titleMedium),
                            Text(body, style: text.bodyMedium),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              CheckboxListTile(
                value: _forSelf,
                onChanged: (v) => setState(() => _forSelf = v ?? false),
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                title: const Text(
                  'I am 18 or older and decide for myself, or my guardian has agreed to this too.',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Notice(message: _error!, danger: true),
              ],
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _forSelf && !_busy ? _agree : null,
                child: Text(_busy ? 'Saving…' : 'I agree'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => context.pop(),
                child: const Text('Not now'),
              ),
              const SizedBox(height: 12),
              Text(
                'Consent text version ${widget.version}',
                style: text.bodySmall?.copyWith(color: Brand.ink3),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Dashboard extends ConsumerWidget {
  const _Dashboard({required this.stats});
  final ContributionStats stats;

  Future<void> _withdraw(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdraw and delete everything?'),
        content: Text(
          'This deletes your consent, all ${stats.contributed} of your recorded signs, and your checks of other people\'s signs. It cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Brand.danger),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete everything'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      final deleted = await client.contribute.withdraw();
      ref.invalidate(contributeStatusProvider);
      if (context.mounted) {
        _toast(context, 'Done. $deleted signs and your consent were deleted.');
      }
    } catch (e) {
      if (context.mounted) _toast(context, contributeError(e));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(contributeStatusProvider),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          PageBody(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Thank you for helping', style: text.headlineSmall),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _Stat(stats.contributed, 'signs recorded'),
                    _Stat(stats.verified, 'checked and used'),
                    _Stat(stats.pending, 'waiting for checks'),
                    if (stats.reviewer)
                      _Stat(stats.reviewed, 'signs you checked'),
                  ],
                ),
                const SizedBox(height: 16),
                ActionTile(
                  icon: Icons.fiber_manual_record_rounded,
                  title: 'Record a sign',
                  body:
                      'Pick a word, sign it once to the camera. Only hand positions are kept.',
                  background: Brand.hands,
                  foreground: Colors.white,
                  iconBackground: Colors.white.withValues(alpha: 0.16),
                  bordered: false,
                  onTap: () => context.push('/contribute/words'),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  value: stats.reviewer,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('I sign ISL fluently'),
                  subtitle: const Text(
                    "Check other people's signs. You never see who recorded them.",
                  ),
                  onChanged: (on) async {
                    try {
                      await client.contribute.setReviewer(on);
                      ref.invalidate(contributeStatusProvider);
                    } catch (e) {
                      if (context.mounted) _toast(context, contributeError(e));
                    }
                  },
                ),
                if (stats.reviewer) ...[
                  const SizedBox(height: 8),
                  ActionTile(
                    icon: Icons.fact_check_outlined,
                    title: 'Check signs',
                    body: 'Watch a recorded sign and say if it is the word.',
                    background: Brand.handsSoft,
                    bordered: false,
                    onTap: () => context.push('/contribute/review'),
                  ),
                ],
                const SizedBox(height: 12),
                ActionTile(
                  icon: Icons.list_alt_rounded,
                  title: 'My signs',
                  body: 'See what you recorded, and delete any of it.',
                  onTap: () => context.push('/contribute/mine'),
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Brand.danger,
                  ),
                  onPressed: () => _withdraw(context, ref),
                  icon: const Icon(Icons.delete_forever_outlined),
                  label: const Text('Withdraw and delete everything'),
                ),
                const SizedBox(height: 8),
                Text(
                  'You agreed to consent text version ${stats.version}.',
                  style: text.bodySmall?.copyWith(color: Brand.ink3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label);
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    width: 150,
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Brand.surface,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Brand.line),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$value', style: Theme.of(context).textTheme.headlineMedium),
        Text(label),
      ],
    ),
  );
}

/// Pick a word to record (the words the sign reader knows).
class ContributeWordsScreen extends ConsumerStatefulWidget {
  const ContributeWordsScreen({super.key});

  @override
  ConsumerState<ContributeWordsScreen> createState() =>
      _ContributeWordsScreenState();
}

class _ContributeWordsScreenState extends ConsumerState<ContributeWordsScreen> {
  String _search = '';

  Future<void> _record(ContributionWord word) async {
    final frames = await context.push<List<double>>(
      '/contribute/record/${Uri.encodeComponent(word.key)}?label=${Uri.encodeComponent(word.label)}',
    );
    if (frames == null || frames.isEmpty || !mounted) return;
    final count = frames.length ~/ 141;
    final send = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send your sign of "${word.label}"?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: HandsReplay(frames: frames),
            ),
            const SizedBox(height: 8),
            Text('$count frames of hand positions. No video.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Discard'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Send'),
          ),
        ],
      ),
    );
    if (send != true || !mounted) return;
    try {
      await client.contribute.contribute(word.key, frames, count);
      ref.invalidate(contributeStatusProvider);
      if (mounted) {
        _toast(
          context,
          'Thank you. Your sign of "${word.label}" was sent for checking.',
        );
      }
    } catch (e) {
      if (mounted) _toast(context, contributeError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final words = ref.watch(contributeWordsProvider);
    final signer = ref.watch(servicesProvider).value;
    return Scaffold(
      appBar: AppBar(title: const Text('Choose a word')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: TextField(
              autofocus: true,
              onChanged: (v) =>
                  setState(() => _search = v.trim().toLowerCase()),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                hintText: 'Search the words',
              ),
            ),
          ),
          Expanded(
            child: switch (words) {
              AsyncData(value: final list) => Builder(
                builder: (context) {
                  final shown = list
                      .where(
                        (w) => _search.isEmpty || w.label.contains(_search),
                      )
                      .toList();
                  return ListView.builder(
                    itemCount: shown.length,
                    itemBuilder: (context, i) {
                      final word = shown[i];
                      return ListTile(
                        title: Text(word.label),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (signer?.signer != null)
                              IconButton(
                                tooltip: 'See how it is signed',
                                icon: const Icon(
                                  Icons.accessibility_new_rounded,
                                ),
                                onPressed: () => showSigner(
                                  context,
                                  signer!.signer!,
                                  word.label,
                                ),
                              ),
                            const Icon(
                              Icons.fiber_manual_record_rounded,
                              color: Brand.danger,
                            ),
                          ],
                        ),
                        onTap: () => _record(word),
                      );
                    },
                  );
                },
              ),
              AsyncError(:final error) => Padding(
                padding: const EdgeInsets.all(20),
                child: Notice(message: contributeError(error), danger: true),
              ),
              _ => const Center(child: CircularProgressIndicator()),
            },
          ),
        ],
      ),
    );
  }
}

/// Check other people's signs (fluent signers). Never shows who recorded them.
class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({super.key});

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  final _done = <int>{};
  bool _busy = false;

  Future<void> _verdict(ReviewItem item, ReviewVerdict verdict) async {
    setState(() => _busy = true);
    try {
      await client.contribute.review(item.id, verdict);
      setState(() => _done.add(item.id));
    } catch (e) {
      if (mounted) _toast(context, contributeError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final queue = ref.watch(reviewQueueProvider);
    final services = ref.watch(servicesProvider).value;
    return Scaffold(
      appBar: AppBar(title: const Text('Check signs')),
      body: switch (queue) {
        AsyncData(value: final list) => Builder(
          builder: (context) {
            final next = list.where((i) => !_done.contains(i.id)).firstOrNull;
            if (next == null) {
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Notice(
                      message: 'Nothing to check right now. Thank you!',
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: () => ref.invalidate(reviewQueueProvider),
                      child: const Text('Look again'),
                    ),
                  ],
                ),
              );
            }
            final word = next.gloss;
            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                PageBody(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Is this the sign for', style: text.bodyLarge),
                      Text(
                        word,
                        style: text.displaySmall?.copyWith(fontSize: 36),
                      ),
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: AspectRatio(
                          aspectRatio: 16 / 9,
                          child: HandsReplay(
                            key: ValueKey(next.id),
                            frames: next.frames,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Hands shown as in a mirror. Played on a loop.',
                        style: text.bodySmall?.copyWith(color: Brand.ink3),
                      ),
                      if (services?.signer != null)
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton.icon(
                            onPressed: () =>
                                showSigner(context, services!.signer!, word),
                            icon: const Icon(Icons.accessibility_new_rounded),
                            label: const Text('See the reference sign'),
                          ),
                        ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _busy
                            ? null
                            : () => _verdict(next, ReviewVerdict.correct),
                        icon: const Icon(Icons.check_rounded),
                        label: Text('Yes, it is "$word"'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _busy
                            ? null
                            : () => _verdict(next, ReviewVerdict.wrong),
                        icon: const Icon(Icons.close_rounded),
                        label: const Text('No, it is not'),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _busy
                            ? null
                            : () => _verdict(next, ReviewVerdict.unsure),
                        child: const Text('Not sure, skip'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
        AsyncError(:final error) => Padding(
          padding: const EdgeInsets.all(20),
          child: Notice(message: contributeError(error), danger: true),
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}

/// What I recorded, with delete.
class MySignsScreen extends ConsumerWidget {
  const MySignsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mine = ref.watch(mySignsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My signs')),
      body: switch (mine) {
        AsyncData(value: final list) when list.isEmpty => const Padding(
          padding: EdgeInsets.all(20),
          child: Notice(message: 'You have not recorded any signs yet.'),
        ),
        AsyncData(value: final list) => ListView(
          children: [
            for (final sign in list)
              ListTile(
                title: Text(sign.gloss),
                subtitle: Text(switch (sign.status) {
                  ContributionStatus.pending =>
                    'Waiting for checks · ${sign.frameCount} frames',
                  ContributionStatus.verified =>
                    'Checked and used for training',
                  ContributionStatus.rejected =>
                    'Checkers said it was not this sign; not used',
                }),
                trailing: IconButton(
                  tooltip: 'Delete this sign',
                  icon: const Icon(Icons.delete_outline_rounded),
                  onPressed: () async {
                    try {
                      await client.contribute.deleteContribution(sign.id);
                      ref.invalidate(mySignsProvider);
                      ref.invalidate(contributeStatusProvider);
                      if (context.mounted) _toast(context, 'Deleted.');
                    } catch (e) {
                      if (context.mounted) _toast(context, contributeError(e));
                    }
                  },
                ),
              ),
          ],
        ),
        AsyncError(:final error) => Padding(
          padding: const EdgeInsets.all(20),
          child: Notice(message: contributeError(error), danger: true),
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}
