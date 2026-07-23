import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:habbit_quests_mobile/app/app.dart';

void main() {
  final mockClient = MockClient((request) async {
    if (request.url.path.endsWith('/api/quests')) {
      return http.Response(jsonEncode([]), 200);
    }
    if (request.url.path.endsWith('/api/collectibles')) {
      return http.Response(jsonEncode([]), 200);
    }
    return http.Response('{}', 200);
  });

  testWidgets('app shell exposes the complete five-tab navigation',
      (tester) async {
    await tester.pumpWidget(HabbitQuestApp(httpClient: mockClient));
    await tester.pumpAndSettle();

    // The bottom nav should show all five tabs.
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Quests'), findsOneWidget);
    expect(find.text('Guild'), findsOneWidget);
    expect(find.text('Rewards'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Navigate to Quests.
    await tester.tap(find.byKey(const Key('nav-quests')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('quests-screen')), findsOneWidget);

    // Navigate to Guild.
    await tester.tap(find.byKey(const Key('nav-guild')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('guild-screen')), findsOneWidget);

    // Navigate to Rewards.
    await tester.tap(find.byKey(const Key('nav-rewards')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('rewards-screen')), findsOneWidget);

    // Navigate to Profile.
    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('profile-screen')), findsOneWidget);
  });

  testWidgets('guild screen shows coming soon state without fake data',
      (tester) async {
    await tester.pumpWidget(HabbitQuestApp(httpClient: mockClient));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('nav-guild')));
    await tester.pumpAndSettle();

    expect(find.text('Your guild hall is quiet.'), findsOneWidget);
    expect(
      find.text(
          'No simulated members. Only real guild activity will appear here.'),
      findsOneWidget,
    );
  });

  testWidgets('rewards screen shows empty collection state',
      (tester) async {
    await tester.pumpWidget(HabbitQuestApp(httpClient: mockClient));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('nav-rewards')));
    await tester.pumpAndSettle();

    expect(find.text('No relics yet.'), findsOneWidget);
  });

  testWidgets('profile screen shows default profile info',
      (tester) async {
    await tester.pumpWidget(HabbitQuestApp(httpClient: mockClient));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('nav-profile')));
    await tester.pumpAndSettle();

    expect(find.text('Adventurer'), findsOneWidget);
    expect(find.text('Profile'), findsWidgets);
  });

  testWidgets('device motion reduction keeps navigation functional',
      (tester) async {
    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(disableAnimations: true),
        child: HabbitQuestApp(httpClient: mockClient),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('nav-quests')));
    await tester.pump();
    expect(find.byKey(const Key('quests-screen')), findsOneWidget);
  });
}
