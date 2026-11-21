// The Learn curriculum, exported from the website (src/learn/curriculum.ts)
// by tool/export_learn.mjs into assets/learn/curriculum.json.
import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Phrase {
  Phrase(Map<String, dynamic> j)
    : id = j['id'] as String,
      english = j['english'] as String,
      literal = j['literal'] as String?,
      glosses = (j['glosses'] as List).cast<String>(),
      rules = (j['rules'] as List? ?? const []).cast<String>();
  final String id;
  final String english;
  final String? literal;
  final List<String> glosses;
  final List<String> rules;
}

class Lesson {
  Lesson(Map<String, dynamic> j)
    : id = j['id'] as String,
      title = j['title'] as String,
      summary = j['summary'] as String,
      signs = (j['signs'] as List).cast<String>(),
      phraseIds = (j['phrases'] as List? ?? const []).cast<String>();
  final String id;
  final String title;
  final String summary;
  final List<String> signs;
  final List<String> phraseIds;
}

class DialogueLine {
  DialogueLine(Map<String, dynamic> j)
    : you = j['who'] == 'you',
      english = j['english'] as String,
      glosses = (j['glosses'] as List).cast<String>();
  final bool you;
  final String english;
  final List<String> glosses;
}

class Unit {
  Unit(Map<String, dynamic> j)
    : id = j['id'] as String,
      title = j['title'] as String,
      tagline = j['tagline'] as String,
      situation = j['situation'] as String,
      icon = j['icon'] as String,
      lessons = [
        for (final l in j['lessons'] as List) Lesson(l as Map<String, dynamic>),
      ],
      phrases = [
        for (final p in j['phrases'] as List) Phrase(p as Map<String, dynamic>),
      ],
      dialogueTitle = (j['dialogue'] as Map?)?['title'] as String?,
      dialogueSetting = (j['dialogue'] as Map?)?['setting'] as String?,
      dialogue = [
        for (final l
            in ((j['dialogue'] as Map?)?['lines'] as List? ?? const []))
          DialogueLine(l as Map<String, dynamic>),
      ],
      etiquetteTitle = (j['etiquette'] as Map)['title'] as String,
      etiquette = ((j['etiquette'] as Map)['points'] as List).cast<String>();
  final String id;
  final String title;
  final String tagline;
  final String situation;
  final String icon;
  final List<Lesson> lessons;
  final List<Phrase> phrases;
  final String? dialogueTitle;
  final String? dialogueSetting;
  final List<DialogueLine> dialogue;
  final String etiquetteTitle;
  final List<String> etiquette;

  Phrase? phrase(String id) => phrases.where((p) => p.id == id).firstOrNull;
}

class SignInfo {
  const SignInfo(this.english, this.checkable, this.avatar);
  final String english;

  /// Whether the 3D avatar has an animation for this sign.
  final bool avatar;

  /// Whether the recogniser knows this sign, so practice can be checked.
  final bool checkable;
}

class Curriculum {
  Curriculum(Map<String, dynamic> j)
    : units = [
        for (final u in j['units'] as List) Unit(u as Map<String, dynamic>),
      ],
      grammar = {
        for (final e in (j['grammar'] as Map<String, dynamic>).entries)
          e.key: (
            (e.value as Map)['title'] as String,
            (e.value as Map)['body'] as String,
          ),
      },
      signs = {
        for (final e in (j['signs'] as Map<String, dynamic>).entries)
          e.key: SignInfo(
            (e.value as Map)['english'] as String,
            (e.value as Map)['checkable'] == true,
            (e.value as Map)['avatar'] == true,
          ),
      };

  final List<Unit> units;
  final Map<String, (String, String)> grammar;
  final Map<String, SignInfo> signs;

  Unit? unit(String id) => units.where((u) => u.id == id).firstOrNull;
  String english(String gloss) => signs[gloss]?.english ?? gloss;
  bool checkable(String gloss) => signs[gloss]?.checkable ?? false;

  /// The 3D avatar can sign all of these (else show the ISLRTC recordings).
  bool animated(List<String> glosses) =>
      glosses.every((g) => signs[g]?.avatar ?? false);

  /// The same sign for everyone on a given day.
  String signOfTheDay(DateTime day) {
    final all = signs.keys.toList()..sort();
    final index =
        DateTime.utc(day.year, day.month, day.day).millisecondsSinceEpoch ~/
        86400000;
    return all[index % all.length];
  }
}

final curriculumProvider = FutureProvider<Curriculum>((ref) async {
  final text = await rootBundle.loadString('assets/learn/curriculum.json');
  return Curriculum(jsonDecode(text) as Map<String, dynamic>);
});

/// Lessons finished and signs practised, kept on this phone.
class LearnProgress {
  const LearnProgress({this.lessons = const {}, this.practised = const {}});
  final Set<String> lessons;
  final Set<String> practised;
}

class LearnProgressController extends Notifier<LearnProgress> {
  static const _lessons = 'parlance.learn.lessons';
  static const _practised = 'parlance.learn.practised';

  @override
  LearnProgress build() {
    _load();
    return const LearnProgress();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = LearnProgress(
      lessons: (prefs.getStringList(_lessons) ?? const []).toSet(),
      practised: (prefs.getStringList(_practised) ?? const []).toSet(),
    );
  }

  Future<void> finishLesson(String unitId, String lessonId) async {
    state = LearnProgress(
      lessons: {...state.lessons, '$unitId/$lessonId'},
      practised: state.practised,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_lessons, state.lessons.toList());
  }

  Future<void> practised(String gloss) async {
    state = LearnProgress(
      lessons: state.lessons,
      practised: {...state.practised, gloss},
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_practised, state.practised.toList());
  }
}

final learnProgressProvider =
    NotifierProvider<LearnProgressController, LearnProgress>(
      LearnProgressController.new,
    );
