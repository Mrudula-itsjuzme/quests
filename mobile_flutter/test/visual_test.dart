import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:habbit_quests_mobile/app/app.dart';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'dart:convert';

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

  testWidgets('home renders at the target phone viewport', (tester) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(HabbitQuestApp(httpClient: mockClient));
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(QuestShell),
      matchesGoldenFile('goldens/home-390x844.png'),
    );
  });
}
