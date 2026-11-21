import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// "About me" and preferences. Kept only on this phone: cards are shown from
/// here, and only the text of a card you send goes to a conversation.
class Profile {
  const Profile({
    this.name = '',
    this.role,
    this.contactName = '',
    this.contactPhone = '',
    this.allergies = '',
    this.medicines = '',
    this.conditions = '',
    this.speechLocale = 'en_IN',
    this.readAloud = true,
  });

  final String name;

  /// How this person usually takes part. Null until they choose.
  final MemberRole? role;
  final String contactName;
  final String contactPhone;
  final String allergies;
  final String medicines;
  final String conditions;

  /// The language speech is heard in: en_IN or hi_IN.
  final String speechLocale;

  /// Read signed words aloud on the hearing side.
  final bool readAloud;

  bool get hasMedical =>
      allergies.isNotEmpty || medicines.isNotEmpty || conditions.isNotEmpty;

  Profile copyWith({
    String? name,
    MemberRole? role,
    String? contactName,
    String? contactPhone,
    String? allergies,
    String? medicines,
    String? conditions,
    String? speechLocale,
    bool? readAloud,
  }) => Profile(
    name: name ?? this.name,
    role: role ?? this.role,
    contactName: contactName ?? this.contactName,
    contactPhone: contactPhone ?? this.contactPhone,
    allergies: allergies ?? this.allergies,
    medicines: medicines ?? this.medicines,
    conditions: conditions ?? this.conditions,
    speechLocale: speechLocale ?? this.speechLocale,
    readAloud: readAloud ?? this.readAloud,
  );
}

class ProfileController extends Notifier<Profile> {
  static const _prefix = 'parlance.profile.';
  SharedPreferences? _prefs;

  @override
  Profile build() {
    _load();
    return const Profile();
  }

  Future<void> _load() async {
    final prefs = _prefs = await SharedPreferences.getInstance();
    String text(String key) => prefs.getString('$_prefix$key') ?? '';
    final role = prefs.getString('${_prefix}role');
    state = Profile(
      name: text('name'),
      role: role == null
          ? null
          : MemberRole.values.where((r) => r.name == role).firstOrNull,
      contactName: text('contactName'),
      contactPhone: text('contactPhone'),
      allergies: text('allergies'),
      medicines: text('medicines'),
      conditions: text('conditions'),
      speechLocale: prefs.getString('${_prefix}speechLocale') ?? 'en_IN',
      readAloud: prefs.getBool('${_prefix}readAloud') ?? true,
    );
  }

  Future<void> update(Profile profile) async {
    state = profile;
    final prefs = _prefs ??= await SharedPreferences.getInstance();
    final values = {
      'name': profile.name,
      'contactName': profile.contactName,
      'contactPhone': profile.contactPhone,
      'allergies': profile.allergies,
      'medicines': profile.medicines,
      'conditions': profile.conditions,
      'speechLocale': profile.speechLocale,
    };
    for (final entry in values.entries) {
      await prefs.setString('$_prefix${entry.key}', entry.value.trim());
    }
    if (profile.role != null) {
      await prefs.setString('${_prefix}role', profile.role!.name);
    }
    await prefs.setBool('${_prefix}readAloud', profile.readAloud);
  }

  /// Deletes everything "About me" holds.
  Future<void> clearPersonal() => update(
    Profile(
      role: state.role,
      speechLocale: state.speechLocale,
      readAloud: state.readAloud,
    ),
  );
}

final profileProvider = NotifierProvider<ProfileController, Profile>(
  ProfileController.new,
);
