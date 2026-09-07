import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:habbit_quests_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Quest completion flow: details -> complete -> reward',
      (WidgetTester tester) async {
    // Launch the app
    app.main();
    await tester.pumpAndSettle();

    // Verify home screen loads quests. Wait for the mock API to load.
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();

    // Find the "Complete Quest" button is not on the screen initially
    expect(find.text('Complete Quest'), findsNothing);

    // Find the first quest (usually wrapped in InkWell or GestureDetector)
    // We can just tap the first text that looks like a quest title.
    // Let's find any text that isn't empty, but ideally we'd look for a specific widget.
    // Since we don't know the exact widget, we tap the center of the screen to see if we hit a card,
    // or better, find a widget by type.
    final cardFinder = find.byType(Card).first;
    if (cardFinder.evaluate().isNotEmpty) {
      await tester.tap(cardFinder);
      await tester.pumpAndSettle();
    } else {
      // Fallback
      await tester.tap(find.byType(InkWell).first);
      await tester.pumpAndSettle();
    }

    // Verify the detail sheet is shown
    expect(find.text('Complete Quest'), findsOneWidget);

    // Tap "Complete Quest"
    await tester.tap(find.text('Complete Quest'));
    await tester.pump(); // Start animation
    await tester.pump(const Duration(seconds: 2)); // Wait for API response

    // Verify the success snackbar or completion UI
    expect(find.textContaining('complete!'), findsWidgets);

    // Dismiss sheet
    await tester.tapAt(const Offset(10, 10)); // Tap outside
    await tester.pumpAndSettle();
  });
}
