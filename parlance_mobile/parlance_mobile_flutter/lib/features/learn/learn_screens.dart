import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/theme.dart';
import '../../providers/room_provider.dart';
import '../../widgets/parts.dart';
import '../signer/signer_view.dart';
import 'curriculum.dart';

const _unitIcons = {
  'hand': Icons.waving_hand_rounded,
  'ear': Icons.hearing_rounded,
  'stethoscope': Icons.medical_services_rounded,
  'siren': Icons.emergency_rounded,
  'clock': Icons.schedule_rounded,
  'shopping': Icons.shopping_bag_rounded,
};

Widget _loading(
  AsyncValue<Curriculum> value,
  Widget Function(Curriculum) builder,
) => value.when(
  data: builder,
  loading: () => const Center(child: CircularProgressIndicator()),
  error: (e, _) => Center(child: Text('Lessons could not load: $e')),
);

/// Opens practice for [gloss]; records it when the recogniser reads it.
Future<bool> practise(
  BuildContext context,
  WidgetRef ref,
  String gloss,
  String english,
) async {
  final ok = await context.push<bool>(
    '/practice/$gloss?en=${Uri.encodeQueryComponent(english)}',
  );
  if (ok == true)
    await ref.read(learnProgressProvider.notifier).practised(gloss);
  return ok == true;
}

/// Learn ISL: units built around real situations, from the website's course.
class LearnScreen extends ConsumerWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final progress = ref.watch(learnProgressProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Learn ISL')),
      body: _loading(ref.watch(curriculumProvider), (c) {
        final today = c.signOfTheDay(DateTime.now());
        final next = [
          for (final u in c.units)
            for (final l in u.lessons)
              if (!progress.lessons.contains('${u.id}/${l.id}')) (u, l),
        ].firstOrNull;
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Short lessons for meeting a Deaf person: watch each sign, then sign it to your camera.',
                    style: text.bodyLarge?.copyWith(color: Brand.ink2),
                  ),
                  const SizedBox(height: 16),
                  if (next != null)
                    ActionTile(
                      icon: Icons.play_arrow_rounded,
                      title: progress.lessons.isEmpty
                          ? 'Start the first lesson'
                          : 'Continue: ${next.$2.title}',
                      body: next.$1.title,
                      background: Brand.navy,
                      foreground: Colors.white,
                      bordered: false,
                      onTap: () =>
                          context.push('/learn/${next.$1.id}/${next.$2.id}'),
                    ),
                  const SizedBox(height: 12),
                  ActionTile(
                    icon: Icons.wb_sunny_rounded,
                    title: 'Sign of the day: ${c.english(today)}',
                    body: 'Watch it and try it.',
                    background: Brand.sun,
                    bordered: false,
                    onTap: () => context.push('/learn/sign/$today'),
                  ),
                  const SectionTitle('Units'),
                  for (final u in c.units) ...[
                    _UnitTile(
                      unit: u,
                      done: u.lessons
                          .where(
                            (l) => progress.lessons.contains('${u.id}/${l.id}'),
                          )
                          .length,
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _UnitTile extends StatelessWidget {
  const _UnitTile({required this.unit, required this.done});
  final Unit unit;
  final int done;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final total = unit.lessons.length;
    return Material(
      color: Brand.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: const BorderSide(color: Brand.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/learn/${unit.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: done == total ? Brand.hands : Brand.handsSoft,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  done == total
                      ? Icons.check_rounded
                      : _unitIcons[unit.icon] ?? Icons.school_rounded,
                  color: done == total ? Colors.white : Brand.handsDeep,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      unit.title,
                      style: text.titleMedium?.copyWith(fontSize: 17),
                    ),
                    Text(unit.tagline, style: text.bodyMedium),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(9),
                      child: LinearProgressIndicator(
                        value: total == 0 ? 0 : done / total,
                        minHeight: 6,
                        color: Brand.hands,
                        backgroundColor: Brand.line,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$done of $total lessons',
                      style: text.labelMedium?.copyWith(color: Brand.ink3),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class UnitScreen extends ConsumerWidget {
  const UnitScreen({super.key, required this.unitId});
  final String unitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final progress = ref.watch(learnProgressProvider);
    return _loading(ref.watch(curriculumProvider), (c) {
      final unit = c.unit(unitId);
      if (unit == null)
        return const Scaffold(
          body: Center(child: Text('That unit does not exist.')),
        );
      final services = ref.watch(servicesProvider).value;
      return Scaffold(
        appBar: AppBar(title: Text(unit.title)),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    unit.situation,
                    style: text.bodyLarge?.copyWith(color: Brand.ink2),
                  ),
                  const SectionTitle('Lessons'),
                  for (final l in unit.lessons)
                    Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: const BorderSide(color: Brand.line),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 6,
                        ),
                        leading: Icon(
                          progress.lessons.contains('${unit.id}/${l.id}')
                              ? Icons.check_circle_rounded
                              : Icons.play_circle_rounded,
                          color: Brand.hands,
                          size: 32,
                        ),
                        title: Text(l.title, style: text.titleMedium),
                        subtitle: Text(
                          '${l.summary}\n${l.signs.map(c.english).join(' · ')}',
                        ),
                        isThreeLine: true,
                        onTap: () => context.push('/learn/${unit.id}/${l.id}'),
                      ),
                    ),
                  if (unit.dialogue.isNotEmpty) ...[
                    SectionTitle(
                      unit.dialogueTitle ?? 'Conversation',
                      description: unit.dialogueSetting,
                    ),
                    for (final line in unit.dialogue)
                      Align(
                        alignment: line.you
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: line.you ? Brand.handsSoft : Colors.white,
                            border: Border.all(color: Brand.line),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                line.you ? 'You' : 'They',
                                style: text.labelMedium?.copyWith(
                                  color: Brand.ink3,
                                ),
                              ),
                              Text(line.english, style: text.titleMedium),
                              Text(
                                line.glosses
                                    .map((g) => g.toUpperCase())
                                    .join(' '),
                                style: text.labelMedium?.copyWith(
                                  color: Brand.royal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (services?.signer != null) ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () => showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          showDragHandle: true,
                          backgroundColor: Brand.surface,
                          builder: (_) => Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                            child: SignerView(
                              url:
                                  c.animated([
                                    for (final l in unit.dialogue) ...l.glosses,
                                  ])
                                  ? services!.signGlosses(
                                      [
                                        for (final l in unit.dialogue)
                                          ...l.glosses,
                                      ],
                                      unit.dialogue
                                          .map((l) => l.english)
                                          .join(' '),
                                    )!
                                  : services!.learnSigns([
                                      for (final l in unit.dialogue)
                                        ...l.glosses,
                                    ])!,
                              height: MediaQuery.sizeOf(context).height * 0.7,
                            ),
                          ),
                        ),
                        icon: const Icon(Icons.play_arrow_rounded),
                        label: const Text('Watch the conversation'),
                      ),
                    ],
                  ],
                  SectionTitle(unit.etiquetteTitle),
                  for (final p in unit.etiquette)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 3),
                            child: Icon(
                              Icons.lightbulb_outline_rounded,
                              size: 18,
                              color: Brand.sunDeep,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(p, style: text.bodyLarge)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    });
  }
}

/// One lesson: each sign in turn (watch it, then sign it to the camera), then
/// its phrases with the grammar behind them.
class LessonScreen extends ConsumerStatefulWidget {
  const LessonScreen({super.key, required this.unitId, required this.lessonId});
  final String unitId;
  final String lessonId;

  @override
  ConsumerState<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends ConsumerState<LessonScreen> {
  int _step = 0;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final progress = ref.watch(learnProgressProvider);
    final services = ref.watch(servicesProvider).value;
    return _loading(ref.watch(curriculumProvider), (c) {
      final unit = c.unit(widget.unitId);
      final lesson = unit?.lessons
          .where((l) => l.id == widget.lessonId)
          .firstOrNull;
      if (unit == null || lesson == null)
        return const Scaffold(
          body: Center(child: Text('That lesson does not exist.')),
        );
      final phrases = [for (final id in lesson.phraseIds) ?unit.phrase(id)];
      final total = lesson.signs.length + phrases.length;
      final step = _step.clamp(0, total - 1);
      final isSign = step < lesson.signs.length;
      final last = step == total - 1;

      Widget body;
      if (isSign) {
        final gloss = lesson.signs[step];
        final english = c.english(gloss);
        final url = services?.learnSign(gloss);
        body = Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Sign ${step + 1} of ${lesson.signs.length}',
              style: text.labelLarge?.copyWith(color: Brand.ink3),
            ),
            Row(
              children: [
                Expanded(
                  child: Text(
                    english,
                    style: text.displaySmall?.copyWith(fontSize: 38),
                  ),
                ),
                if (progress.practised.contains(gloss))
                  const Icon(
                    Icons.check_circle_rounded,
                    color: Brand.hands,
                    size: 32,
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (url != null)
              SignerView(url: url, height: 480)
            else
              const Notice(message: 'Connecting to Parlance…'),
            const SizedBox(height: 12),
            if (c.checkable(gloss))
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Brand.hands,
                  minimumSize: const Size(64, 56),
                ),
                onPressed: () => practise(context, ref, gloss, english),
                icon: const Icon(Icons.videocam_rounded),
                label: const Text('Your turn: sign it'),
              )
            else
              Text(
                'Copy the signer with your hands. The camera check does not know this sign yet.',
                style: text.bodyMedium?.copyWith(color: Brand.ink3),
              ),
          ],
        );
      } else {
        final phrase = phrases[step - lesson.signs.length];
        final url = c.animated(phrase.glosses)
            ? services?.signGlosses(phrase.glosses, phrase.english)
            : services?.learnSigns(phrase.glosses);
        body = Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Put it together',
              style: text.labelLarge?.copyWith(color: Brand.ink3),
            ),
            Text(phrase.english, style: text.headlineMedium),
            const SizedBox(height: 4),
            Text(
              'In ISL: ${phrase.glosses.map((g) => g.toUpperCase()).join(' ')}${phrase.literal != null ? '  ("${phrase.literal}")' : ''}',
              style: text.titleMedium?.copyWith(color: Brand.royal),
            ),
            const SizedBox(height: 10),
            if (url != null) SignerView(url: url, height: 440),
            for (final rule in phrase.rules)
              if (c.grammar[rule] != null)
                Container(
                  margin: const EdgeInsets.only(top: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Brand.sunSoft,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.grammar[rule]!.$1, style: text.titleMedium),
                      Text(
                        c.grammar[rule]!.$2,
                        style: text.bodyMedium?.copyWith(color: Brand.navy),
                      ),
                    ],
                  ),
                ),
          ],
        );
      }

      return Scaffold(
        appBar: AppBar(
          title: Text(lesson.title),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(6),
            child: LinearProgressIndicator(
              value: (step + 1) / total,
              color: Brand.hands,
              backgroundColor: Brand.line,
            ),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
          children: [PageBody(child: body)],
        ),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              children: [
                if (step > 0)
                  OutlinedButton(
                    onPressed: () => setState(() => _step = step - 1),
                    child: const Text('Back'),
                  ),
                const Spacer(),
                FilledButton(
                  onPressed: () async {
                    if (!last) {
                      setState(() => _step = step + 1);
                      return;
                    }
                    await ref
                        .read(learnProgressProvider.notifier)
                        .finishLesson(unit.id, lesson.id);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('${lesson.title}: done!')),
                      );
                      context.pop();
                    }
                  },
                  child: Text(last ? 'Finish' : 'Next'),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }
}

/// One sign on its own (the sign of the day).
class SignLearnScreen extends ConsumerWidget {
  const SignLearnScreen({super.key, required this.gloss});
  final String gloss;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final text = Theme.of(context).textTheme;
    final services = ref.watch(servicesProvider).value;
    return _loading(ref.watch(curriculumProvider), (c) {
      final english = c.english(gloss);
      final url = services?.learnSign(gloss);
      return Scaffold(
        appBar: AppBar(title: const Text('Sign of the day')),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    english,
                    style: text.displaySmall?.copyWith(fontSize: 38),
                  ),
                  const SizedBox(height: 10),
                  if (url != null) SignerView(url: url, height: 480),
                  const SizedBox(height: 12),
                  if (c.checkable(gloss))
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Brand.hands,
                        minimumSize: const Size(64, 56),
                      ),
                      onPressed: () => practise(context, ref, gloss, english),
                      icon: const Icon(Icons.videocam_rounded),
                      label: const Text('Your turn: sign it'),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    });
  }
}
