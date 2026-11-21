import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../app/theme.dart';
import '../../providers/profile_provider.dart';
import '../../providers/room_provider.dart';
import '../../providers/speech_provider.dart';
import '../../widgets/parts.dart';
import 'card_data.dart';

/// Where are you? Each place has the cards you are likely to need there.
class CardsScreen extends StatelessWidget {
  const CardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Show a card')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Pick where you are, then show the card. They can tap a reply back.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Brand.ink2),
                  ),
                  const SizedBox(height: 16),
                  ActionTile(
                    icon: emergency.icon,
                    title: emergency.title,
                    body: emergency.hint,
                    background: Brand.danger,
                    foreground: Colors.white,
                    bordered: false,
                    onTap: () => context.push('/cards/emergency'),
                  ),
                  const SizedBox(height: 10),
                  for (final place in places) ...[
                    ActionTile(
                      icon: place.icon,
                      title: place.title,
                      body: place.hint,
                      onTap: () => context.push('/cards/${place.id}'),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The text a card shows, with any "About me" details or blank filled in.
({String en, String hi, String? extra}) resolveCard(
  CardDef card,
  Profile profile, {
  String? fill,
}) {
  String? extra;
  switch (card.profile) {
    case ProfileField.contact:
      if (profile.contactPhone.isNotEmpty) {
        extra =
            '${profile.contactName.isEmpty ? 'Contact' : profile.contactName}: ${profile.contactPhone}';
      }
    case ProfileField.conditions ||
        ProfileField.allergies ||
        ProfileField.medicines:
      extra = [
        if (profile.conditions.isNotEmpty) 'Conditions: ${profile.conditions}',
        if (profile.allergies.isNotEmpty) 'Allergies: ${profile.allergies}',
        if (profile.medicines.isNotEmpty) 'Medicines: ${profile.medicines}',
      ].join('\n');
      if (extra.isEmpty) extra = null;
    case null:
      break;
  }
  if (fill != null && fill.trim().isNotEmpty) extra = fill.trim();
  return (en: card.en, hi: card.hi, extra: extra);
}

class PlaceScreen extends ConsumerWidget {
  const PlaceScreen({super.key, required this.placeId});
  final String placeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final place = placeById(placeId);
    if (place == null) {
      return const Scaffold(
        body: Center(child: Text('That card set does not exist.')),
      );
    }
    final isEmergency = place == emergency;
    final text = Theme.of(context).textTheme;
    final cards = [if (isEmergency) deafCard, ...place.cards];
    return Scaffold(
      appBar: AppBar(title: Text(place.title)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (isEmergency) ...[
                    Text('Call directly', style: text.titleMedium),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final n in emergencyNumbers)
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: Brand.danger,
                            ),
                            onPressed: () =>
                                launchUrl(Uri.parse('tel:${n.number}')),
                            icon: const Icon(Icons.call_rounded),
                            label: Text('${n.number} · ${n.label}'),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'A call needs someone who can speak. Show a card to anyone nearby and ask them to call.',
                      style: text.bodyMedium?.copyWith(color: Brand.ink3),
                    ),
                    const SizedBox(height: 18),
                  ],
                  Text(place.hint, style: text.titleMedium),
                  const SizedBox(height: 8),
                  for (final card in cards)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Material(
                        color: isEmergency && card == deafCard
                            ? Brand.sunSoft
                            : Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                          side: const BorderSide(color: Brand.line),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () =>
                              context.push('/cards/${place.id}/${card.id}'),
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(18, 14, 12, 14),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        card.en,
                                        style: text.titleMedium?.copyWith(
                                          fontSize: 18,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(card.hi, style: text.bodyMedium),
                                      if (card.fill != null ||
                                          card.profile != null)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            top: 4,
                                          ),
                                          child: Text(
                                            card.fill != null
                                                ? 'You add: ${card.fill!.label.toLowerCase()}'
                                                : 'Uses About me',
                                            style: text.labelMedium?.copyWith(
                                              color: Brand.royal,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.open_in_full_rounded,
                                  color: Brand.royal,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
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

/// A card, full screen and as large as it fits, for someone across a counter.
class CardShowScreen extends ConsumerStatefulWidget {
  const CardShowScreen({
    super.key,
    required this.placeId,
    required this.cardId,
  });
  final String placeId;
  final String cardId;

  @override
  ConsumerState<CardShowScreen> createState() => _CardShowScreenState();
}

class _CardShowScreenState extends ConsumerState<CardShowScreen> {
  bool _turned = false;
  Line? _reply;
  String? _fill;

  @override
  void initState() {
    super.initState();
    unawaited(WakelockPlus.enable());
    final card = _card;
    if (card?.fill != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _askFill(card!));
    }
  }

  @override
  void dispose() {
    unawaited(WakelockPlus.disable());
    super.dispose();
  }

  Place? get _place => placeById(widget.placeId);
  CardDef? get _card {
    final place = _place;
    if (place == null) return null;
    if (widget.cardId == deafCard.id) return deafCard;
    return place.cards.where((c) => c.id == widget.cardId).firstOrNull;
  }

  Future<void> _askFill(CardDef card) async {
    final controller = TextEditingController(text: _fill);
    final value = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(card.fill!.label),
        content: TextField(
          controller: controller,
          autofocus: true,
          minLines: 1,
          maxLines: 4,
          decoration: InputDecoration(hintText: card.fill!.placeholder),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Skip'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('Show card'),
          ),
        ],
      ),
    );
    if (value != null && mounted) setState(() => _fill = value);
  }

  @override
  Widget build(BuildContext context) {
    final place = _place;
    final card = _card;
    if (place == null || card == null) {
      return const Scaffold(
        body: Center(child: Text('That card does not exist.')),
      );
    }
    final profile = ref.watch(profileProvider);
    final room = ref.watch(roomProvider);
    final shown = resolveCard(card, profile, fill: _fill);
    final urgent = place == emergency;
    final background = urgent ? Brand.danger : Brand.sun;
    final ink = urgent ? Colors.white : Brand.navy;
    final text = Theme.of(context).textTheme;
    final missing = card.profile != null && shown.extra == null;

    final face = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width - 40,
            ),
            child: Text(
              shown.en,
              textAlign: TextAlign.center,
              style: text.displayMedium?.copyWith(
                color: ink,
                fontSize: 46,
                height: 1.05,
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          shown.hi,
          textAlign: TextAlign.center,
          style: text.headlineSmall?.copyWith(
            color: ink.withValues(alpha: 0.9),
            fontWeight: FontWeight.w700,
          ),
        ),
        if (shown.extra != null) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: urgent ? 0.16 : 0.5),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Text(
              shown.extra!,
              textAlign: TextAlign.center,
              style: text.titleLarge?.copyWith(color: ink),
            ),
          ),
        ],
        if (_reply != null) ...[
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              children: [
                const Text(
                  'They replied',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: Brand.ink3,
                  ),
                ),
                Text(
                  _reply!.en,
                  textAlign: TextAlign.center,
                  style: text.headlineMedium,
                ),
                Text(
                  _reply!.hi,
                  textAlign: TextAlign.center,
                  style: text.titleMedium,
                ),
              ],
            ),
          ),
        ],
      ],
    );

    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Close',
                    color: ink,
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.close_rounded, size: 30),
                  ),
                  const Spacer(),
                  if (card.fill != null)
                    TextButton(
                      onPressed: () => _askFill(card),
                      style: TextButton.styleFrom(foregroundColor: ink),
                      child: Text('Edit ${card.fill!.label.toLowerCase()}'),
                    ),
                  IconButton(
                    tooltip: 'Read aloud',
                    color: ink,
                    onPressed: () => ref
                        .read(voiceProvider)
                        .say('${shown.en} ${shown.extra ?? ''}'),
                    icon: const Icon(Icons.volume_up_rounded),
                  ),
                  IconButton(
                    tooltip: _turned ? 'Turn back' : 'Turn for them',
                    color: ink,
                    onPressed: () => setState(() => _turned = !_turned),
                    icon: const Icon(Icons.screen_rotation_alt_rounded),
                  ),
                ],
              ),
            ),
            if (missing)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Notice(
                  message: 'Add your details in About me to show them here.',
                  action: 'About me',
                  onAction: () => context.push('/about'),
                ),
              ),
            Expanded(
              child: AnimatedRotation(
                turns: _turned ? 0.5 : 0,
                duration: MediaQuery.disableAnimationsOf(context)
                    ? Duration.zero
                    : const Duration(milliseconds: 300),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: MediaQuery.sizeOf(context).height * 0.5,
                    ),
                    child: Center(child: face),
                  ),
                ),
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              decoration: const BoxDecoration(
                color: Brand.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'For them: tap a reply',
                    style: text.labelLarge?.copyWith(color: Brand.ink3),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final reply in place.replies)
                        ChoiceChip(
                          label: Text(reply.en),
                          selected: _reply == reply,
                          onSelected: (_) {
                            setState(() => _reply = reply);
                            if (room.active) {
                              unawaited(
                                ref
                                    .read(roomProvider.notifier)
                                    .say(
                                      UtteranceKind.reply,
                                      reply.en,
                                      hindi: reply.hi,
                                    ),
                              );
                            }
                          },
                        ),
                    ],
                  ),
                  if (room.active) ...[
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      onPressed: () async {
                        await ref
                            .read(roomProvider.notifier)
                            .say(
                              UtteranceKind.card,
                              [
                                shown.en,
                                if (shown.extra != null) shown.extra!,
                              ].join('\n'),
                              hindi: shown.hi,
                            );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Sent to the conversation.'),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.send_rounded),
                      label: const Text('Send to the conversation'),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "About me": details cards can show, kept only on this phone.
class AboutMeScreen extends ConsumerStatefulWidget {
  const AboutMeScreen({super.key});

  @override
  ConsumerState<AboutMeScreen> createState() => _AboutMeScreenState();
}

class _AboutMeScreenState extends ConsumerState<AboutMeScreen> {
  late final Map<String, TextEditingController> _fields;

  @override
  void initState() {
    super.initState();
    final p = ref.read(profileProvider);
    _fields = {
      'name': TextEditingController(text: p.name),
      'contactName': TextEditingController(text: p.contactName),
      'contactPhone': TextEditingController(text: p.contactPhone),
      'conditions': TextEditingController(text: p.conditions),
      'allergies': TextEditingController(text: p.allergies),
      'medicines': TextEditingController(text: p.medicines),
    };
  }

  @override
  void dispose() {
    for (final c in _fields.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final p = ref.read(profileProvider);
    await ref
        .read(profileProvider.notifier)
        .update(
          p.copyWith(
            name: _fields['name']!.text,
            contactName: _fields['contactName']!.text,
            contactPhone: _fields['contactPhone']!.text,
            conditions: _fields['conditions']!.text,
            allergies: _fields['allergies']!.text,
            medicines: _fields['medicines']!.text,
          ),
        );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Saved on this phone.')));
      context.pop();
    }
  }

  Future<void> _clear() async {
    await ref.read(profileProvider.notifier).clearPersonal();
    for (final c in _fields.values) {
      c.clear();
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your details were deleted from this phone.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileProvider);
    final text = Theme.of(context).textTheme;
    Widget field(
      String key,
      String label, {
      String? hint,
      TextInputType? type,
      int lines = 1,
    }) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: _fields[key],
        keyboardType: type,
        minLines: 1,
        maxLines: lines,
        textCapitalization: TextCapitalization.sentences,
        decoration: InputDecoration(labelText: label, hintText: hint),
      ),
    );
    return Scaffold(
      appBar: AppBar(title: const Text('About me')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            PageBody(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Notice(
                    message:
                        'Kept only on this phone. A card shows these details only when you open it.',
                  ),
                  const SizedBox(height: 16),
                  field(
                    'name',
                    'Your name',
                    hint: 'Shown to the other phone in a conversation',
                  ),
                  Text('Emergency contact', style: text.titleMedium),
                  const SizedBox(height: 8),
                  field('contactName', 'Name', hint: 'e.g. Priya (sister)'),
                  field(
                    'contactPhone',
                    'Phone number',
                    type: TextInputType.phone,
                  ),
                  Text('Medical', style: text.titleMedium),
                  const SizedBox(height: 8),
                  field(
                    'conditions',
                    'Conditions',
                    hint: 'e.g. Deaf, diabetes',
                    lines: 3,
                  ),
                  field(
                    'allergies',
                    'Allergies',
                    hint: 'e.g. penicillin',
                    lines: 3,
                  ),
                  field(
                    'medicines',
                    'Medicines',
                    hint: 'e.g. insulin twice a day',
                    lines: 3,
                  ),
                  FilledButton(onPressed: _save, child: const Text('Save')),
                  const SizedBox(height: 24),
                  Text('Settings', style: text.titleMedium),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Read signed words aloud'),
                    subtitle: const Text(
                      'On the speaking side of a conversation',
                    ),
                    value: profile.readAloud,
                    onChanged: (v) => ref
                        .read(profileProvider.notifier)
                        .update(profile.copyWith(readAloud: v)),
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Speech language'),
                    trailing: SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'en_IN', label: Text('English')),
                        ButtonSegment(value: 'hi_IN', label: Text('हिंदी')),
                      ],
                      selected: {profile.speechLocale},
                      onSelectionChanged: (v) => ref
                          .read(profileProvider.notifier)
                          .update(profile.copyWith(speechLocale: v.first)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Brand.danger,
                    ),
                    onPressed: _clear,
                    icon: const Icon(Icons.delete_outline_rounded),
                    label: const Text('Delete my details'),
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
