import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/fantasy_decorations.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/gold_progress_bar.dart';
import '../../widgets/fantasy/ornamental_divider.dart';

/// Profile screen with fantasy theme.
///
/// Uses profile data from the API. Preserves sign out and tour replay.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({
    super.key,
    required this.displayName,
    required this.level,
    required this.tier,
    required this.totalXp,
    required this.xpIntoLevel,
    required this.xpForCurrentLevel,
    required this.streakDays,
    required this.primaryPath,
    required this.reminderTime,
    required this.timezone,
    required this.motionPreference,
    this.onReplayTour,
    this.onSignOut,
  });

  final String displayName;
  final int level;
  final String tier;
  final int totalXp;
  final int xpIntoLevel;
  final int xpForCurrentLevel;
  final int streakDays;
  final String? primaryPath;
  final String? reminderTime;
  final String timezone;
  final String motionPreference;
  final VoidCallback? onReplayTour;
  final Future<void> Function()? onSignOut;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return CustomScrollView(
      key: const Key('profile-screen'),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
          sliver: SliverList.list(children: [
            // ─── Page header ──────────────────────────────
            Text('WAYFARER', style: theme.textTheme.labelSmall),
            const SizedBox(height: 6),
            Text('Profile', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 6),
            Text(
              'Your progress, without the pressure.',
              style: theme.textTheme.bodyMedium,
            ),

            const SizedBox(height: 20),

            // ─── Avatar + stats ───────────────────────────
            FantasyPanel(
              goldBorder: true,
              child: Row(
                children: [
                  // Avatar
                  SizedBox(
                    width: 64,
                    height: 64,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration:
                              FantasyDecorations.avatarMedallion(size: 64),
                        ),
                        Container(
                          width: 56,
                          height: 56,
                          decoration: FantasyDecorations.avatarInner(),
                          alignment: Alignment.center,
                          child: Text(
                            displayName.isNotEmpty
                                ? displayName[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: AppColors.brightGold,
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(displayName,
                            style: theme.textTheme.headlineSmall),
                        const SizedBox(height: 2),
                        Text(
                          'Level $level · $tier · $totalXp total XP',
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(height: 10),
                        GoldProgressBar(
                          value: xpForCurrentLevel > 0
                              ? xpIntoLevel / xpForCurrentLevel
                              : 0,
                          height: 6,
                          showLabel: true,
                          label:
                              '$xpIntoLevel / $xpForCurrentLevel XP to next level',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ─── Stats row ────────────────────────────────
            Row(
              children: [
                Expanded(
                  child: _MiniStat(
                      value: '$streakDays', label: 'Day Streak'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child:
                      _MiniStat(value: '$level', label: 'Level'),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MiniStat(
                      value: '$totalXp', label: 'Total XP'),
                ),
              ],
            ),

            const SizedBox(height: 22),
            const OrnamentalDivider(),
            const SizedBox(height: 14),

            // ─── Settings ─────────────────────────────────
            Text('Settings', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 12),

            FantasyPanel(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.explore_outlined,
                        color: AppColors.antiqueGold),
                    title: const Text('Primary path'),
                    subtitle: Text(primaryPath ?? 'Not selected'),
                  ),
                  Divider(height: 1, color: AppColors.border),
                  ListTile(
                    leading: const Icon(Icons.notifications_none_rounded,
                        color: AppColors.antiqueGold),
                    title: const Text('Reminder'),
                    subtitle: Text(
                        '${reminderTime ?? 'Not set'} · $timezone'),
                  ),
                  Divider(height: 1, color: AppColors.border),
                  ListTile(
                    leading: const Icon(Icons.animation_rounded,
                        color: AppColors.antiqueGold),
                    title: const Text('Motion'),
                    subtitle: Text(motionPreference),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 18),

            if (onReplayTour != null)
              OutlinedButton.icon(
                onPressed: onReplayTour,
                icon: const Icon(Icons.replay_rounded),
                label: const Text('Replay tour'),
              ),

            if (onSignOut != null) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: onSignOut,
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign out'),
              ),
            ],
          ]),
        ),
      ],
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: AppColors.brightGold,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
