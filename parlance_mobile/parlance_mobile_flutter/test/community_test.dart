import 'package:flutter_test/flutter_test.dart';
import 'package:parlance_mobile_client/parlance_mobile_client.dart';
import 'package:parlance_mobile/features/community/community_parts.dart';

void main() {
  test('live codes read in two groups of three', () {
    expect(formatCode('147259'), '147 259');
    expect(formatCode('12'), '12');
  });

  test('times stay short', () {
    final now = DateTime.now().toUtc();
    expect(timeAgo(now.subtract(const Duration(seconds: 5))), 'just now');
    expect(timeAgo(now.subtract(const Duration(minutes: 5))), '5 min ago');
    expect(timeAgo(now.subtract(const Duration(hours: 3))), '3 h ago');
    expect(timeAgo(now.subtract(const Duration(hours: 30))), 'yesterday');
  });

  test('every space the server offers has a look, and meetups show their time', () {
    for (final id in ['everyday', 'work', 'study', 'health', 'rights', 'family', 'learn-isl', 'tech', 'meetups']) {
      expect(spaceStyle.containsKey(id), isTrue, reason: id);
    }
    final starts = DateTime(2027, 1, 10, 22);
    final meetup = CommunityMeetup(
      place: 'Park',
      city: 'Pune',
      startsAt: starts,
      endsAt: starts.add(const Duration(hours: 2)),
      going: 1,
      imGoing: false,
      live: false,
    );
    expect(meetupWhen(meetup), 'Sun 10 Jan, 10:00 pm – 12:00 am');
  });
}
