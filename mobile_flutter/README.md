# HABBIT Quest Mobile

Flutter phone UI for the standalone HABBIT Quest app.

This v1 is a polished static dark-fantasy mobile experience. It uses generated
raster art for the adventurer, chests, badges, and loot, while keeping layout,
navigation, cards, progress, and panels in Flutter.

Tabs:

- Home: overall score, streak, XP, wellness metrics, today's quests, and daily challenge.
- Quests: focus quest, active quests, weekly streak, path rank, and available quests.
- Guild: party members, friends online, co-op quests, leaderboard, guild war, and activity.
- Rewards: season chest, reward track, badges, loot, claimable rewards, and rank.
- Profile: avatar hero, level/XP, achievements, history, stats, gear, and customization.

There is no backend sync or local persistence in this static pass.

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
```
