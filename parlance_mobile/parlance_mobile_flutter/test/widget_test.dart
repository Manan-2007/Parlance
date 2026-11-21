import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parlance_mobile/app/theme.dart';
import 'package:parlance_mobile/features/cards/card_data.dart';
import 'package:parlance_mobile/features/cards/cards_screens.dart';
import 'package:parlance_mobile/providers/profile_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('every card and reply has English and Hindi', () {
    for (final place in [emergency, ...places]) {
      for (final line in [...place.cards, ...place.replies]) {
        expect(line.en.trim(), isNotEmpty, reason: place.id);
        expect(line.hi.trim(), isNotEmpty, reason: '${place.id}: ${line.en}');
      }
    }
  });

  test('a card shows About me details only when it uses them', () {
    const profile = Profile(
      contactName: 'Priya',
      contactPhone: '98100 00000',
      allergies: 'penicillin',
    );
    final contact = emergency.cards.firstWhere(
      (c) => c.profile == ProfileField.contact,
    );
    expect(resolveCard(contact, profile).extra, 'Priya: 98100 00000');
    final help = emergency.cards.firstWhere((c) => c.id == 'help');
    expect(resolveCard(help, profile).extra, isNull);
  });

  testWidgets('the emergency card set opens with call buttons', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: buildTheme(),
          home: const PlaceScreen(placeId: 'emergency'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('112 · All emergencies'), findsOneWidget);
    expect(find.text(deafCard.en), findsOneWidget);
  });
}
