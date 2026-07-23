import 'package:flutter_test/flutter_test.dart';
import 'package:habbit_quests_mobile/app_services.dart';

void main() {
  group('MobileProfile', () {
    test('maps the authenticated profile contract', () {
      final profile = MobileProfile.fromJson({
        'id': 'user-1',
        'displayName': 'Ari',
        'timezone': 'Asia/Kolkata',
        'primaryPath': 'Mind',
        'reminderTime': '20:30',
        'motionPreference': 'reduced',
        'onboardingCompletedAt': '2026-07-12T14:30:00.000Z',
        'tourVersionSeen': 1,
        'totalXp': 4250,
        'streakDays': 12,
      });

      expect(profile.id, 'user-1');
      expect(profile.onboardingCompletedAt, isNotNull);
      expect(profile.motionPreference, 'reduced');
      expect(profile.tourVersionSeen, 1);
      expect(profile.totalXp, 4250);
    });

    test('keeps safe defaults for a new profile', () {
      final profile = MobileProfile.fromJson({'id': 'user-2'});

      expect(profile.primaryPath, isNull);
      expect(profile.motionPreference, 'system');
      expect(profile.onboardingCompletedAt, isNull);
      expect(profile.streakDays, 0);
    });
  });

  test('MobileQuestAssignment maps server-owned assignment progress', () {
    final quest = MobileQuestAssignment.fromJson({
      'id': 'assignment-1',
      'title': 'Walk with purpose',
      'description': 'Take a mindful walk.',
      'category': 'Body',
      'verificationType': 'AUTO',
      'progressValue': 7,
      'targetValue': 10,
      'xpReward': 50,
      'status': 'active',
    });

    expect(quest.id, 'assignment-1');
    expect(quest.progressValue, 7);
    expect(quest.targetValue, 10);
    expect(quest.verificationType, 'AUTO');
  });
}
