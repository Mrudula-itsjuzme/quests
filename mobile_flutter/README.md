# HABBIT Quest Mobile

Flutter phone UI for the standalone HABBIT Quest app.

This version is a compact, gamified dark-fantasy mobile experience. The primary
quest loop is interactive: players can log progress, submit a short reflection,
complete quests, earn XP, claim a reward, contribute to the guild, filter the
quest log, and update profile preferences.

Tabs:

- Home: daily progress, streak, XP, active quests, and weekly challenge.
- Quests: category filters, daily quest actions, and the weekly quest.
- Guild: shared quest progress, contribution action, party, and guild note.
- Rewards: daily claim, reward track, coins, and unlocked collection items.
- Profile: level, XP, quest stats, reminders, reset time, and accessibility.

The UI currently keeps its demo session state in memory. Backend authentication
and synchronization can be connected as the next mobile integration slice.

## Run

```bash
cd mobile_flutter
flutter pub get
flutter run
```

## Validate

```bash
cd mobile_flutter
dart format lib
flutter analyze
flutter test
```
