import 'package:flutter_test/flutter_test.dart';
import 'package:habbit_quests_mobile/main.dart';

void main() {
  testWidgets('fantasy shell exposes the five primary tabs', (tester) async {
    await tester.pumpWidget(const HabbitQuestMobileApp());

    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Quests'), findsOneWidget);
    expect(find.text('Guild'), findsOneWidget);
    expect(find.text('Rewards'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    await tester.tap(find.text('Rewards'));
    await tester.pumpAndSettle();
    expect(find.text('SEASON CHEST'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('Wayfarer'), findsWidgets);
  });
}
