import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/fantasy_decorations.dart';
import '../../models/quest.dart';
import '../../state/quest_controller.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/gold_progress_bar.dart';
import '../../widgets/fantasy/ornamental_divider.dart';
import '../../widgets/fantasy/quest_card.dart';

/// Opening page of the adventurer's quest journal.
///
/// Hierarchy: Player header → Journey banner → Today's quests →
/// Featured weekly → Remaining quests.
class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.controller,
    required this.displayName,
    required this.level,
    required this.tier,
    required this.totalXp,
    required this.xpIntoLevel,
    required this.xpForCurrentLevel,
    required this.streakDays,
    required this.onViewAllQuests,
    required this.onQuestTap,
    required this.onNotifications,
  });

  final QuestController controller;
  final String displayName;
  final int level;
  final String tier;
  final int totalXp;
  final int xpIntoLevel;
  final int xpForCurrentLevel;
  final int streakDays;
  final VoidCallback onViewAllQuests;
  final ValueChanged<Quest> onQuestTap;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final dailyQuests = controller.homeQuests;
        final weeklyQuest = controller.featuredWeekly;
        final remaining = controller.remainingQuests;

        return CustomScrollView(
          key: const Key('home-screen'),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              sliver: SliverList.list(children: [
                // ─── Player header ─────────────────────────────
                _PlayerHeader(
                  displayName: displayName,
                  level: level,
                  tier: tier,
                  totalXp: totalXp,
                  xpIntoLevel: xpIntoLevel,
                  xpForCurrentLevel: xpForCurrentLevel,
                  onNotifications: onNotifications,
                ),

                const SizedBox(height: 18),

                // ─── Journey banner ────────────────────────────
                _JourneyBanner(streakDays: streakDays),

                const SizedBox(height: 22),

                // ─── Today's quests ────────────────────────────
                _SectionRow(
                  title: "✦  Today's Path",
                  trailing: controller.allDailyComplete
                      ? const Text(
                          'PATH CLEARED',
                          style: TextStyle(
                            color: AppColors.emerald,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.0,
                          ),
                        )
                      : Text(
                          '+${dailyQuests.fold<int>(0, (sum, q) => sum + q.xp)} XP',
                          style: const TextStyle(
                            color: AppColors.brightGold,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
                const SizedBox(height: 6),
                Text(
                  dailyQuests.isEmpty
                      ? 'Your path awaits. Quests will appear when the server is ready.'
                      : 'Complete all ${dailyQuests.length} daily quests to earn bonus XP.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 12),

                if (dailyQuests.isEmpty && controller.state == LoadingState.loaded)
                  _EmptyQuestNotice(),

                ...dailyQuests.map((quest) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: QuestCard(
                        quest: quest,
                        onTap: () => onQuestTap(quest),
                        onComplete: quest.canComplete
                            ? () => _handleComplete(context, quest)
                            : null,
                        isCompleting: controller.isCompleting(quest.id),
                      ),
                    )),

                // ─── Featured weekly quest ─────────────────────
                if (weeklyQuest != null) ...[
                  const SizedBox(height: 10),
                  const OrnamentalDivider(),
                  const SizedBox(height: 10),
                  _WeeklyBanner(
                    quest: weeklyQuest,
                    onTap: () => onQuestTap(weeklyQuest),
                  ),
                ],

                // ─── Remaining quests ──────────────────────────
                if (remaining.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  _SectionRow(
                    title: 'Upcoming Quests',
                    trailing: TextButton(
                      onPressed: onViewAllQuests,
                      child: const Text('View All'),
                    ),
                  ),
                  const SizedBox(height: 6),
                  ...remaining.map((quest) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: QuestCard(
                          quest: quest,
                          compact: true,
                          onTap: () => onQuestTap(quest),
                        ),
                      )),
                ],
              ]),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleComplete(BuildContext context, Quest quest) async {
    final result = await controller.completeQuest(quest.id);
    if (result != null && context.mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.auto_awesome_rounded,
                    color: AppColors.brightGold),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${quest.title} complete!',
                        style: const TextStyle(
                          color: AppColors.parchment,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '+${result.xpCredited} XP earned${result.bonusXp > 0 ? ' · +${result.bonusXp} bonus!' : ''}',
                        style: const TextStyle(color: AppColors.mutedText),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
    }
  }
}

// ─── Player Header ──────────────────────────────────────────────

class _PlayerHeader extends StatelessWidget {
  const _PlayerHeader({
    required this.displayName,
    required this.level,
    required this.tier,
    required this.totalXp,
    required this.xpIntoLevel,
    required this.xpForCurrentLevel,
    required this.onNotifications,
  });

  final String displayName;
  final int level;
  final String tier;
  final int totalXp;
  final int xpIntoLevel;
  final int xpForCurrentLevel;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar medallion
        _AvatarMedallion(displayName: displayName, level: level),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                displayName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 2),
              Text(
                '$tier  ✦',
                style: TextStyle(
                  color: AppColors.antiqueGold,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 8),
              GoldProgressBar(
                value: xpForCurrentLevel > 0
                    ? xpIntoLevel / xpForCurrentLevel
                    : 0,
                height: 6,
                showLabel: true,
                label: '$xpIntoLevel / $xpForCurrentLevel XP',
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Notifications',
          onPressed: onNotifications,
          icon: const Icon(
            Icons.notifications_none_rounded,
            color: AppColors.antiqueGold,
          ),
        ),
      ],
    );
  }
}

class _AvatarMedallion extends StatelessWidget {
  const _AvatarMedallion({required this.displayName, required this.level});

  final String displayName;
  final int level;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 60,
      height: 60,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer ring
          Container(
            width: 60,
            height: 60,
            decoration: FantasyDecorations.avatarMedallion(size: 60),
          ),
          // Inner circle
          Container(
            width: 52,
            height: 52,
            decoration: FantasyDecorations.avatarInner(),
            alignment: Alignment.center,
            child: Text(
              displayName.isNotEmpty
                  ? displayName[0].toUpperCase()
                  : '?',
              style: const TextStyle(
                color: AppColors.brightGold,
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          // Level badge
          Positioned(
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.deepBrown,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.antiqueGold, width: 1.5),
              ),
              child: Text(
                '$level',
                style: const TextStyle(
                  color: AppColors.brightGold,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Journey Banner ─────────────────────────────────────────────

class _JourneyBanner extends StatelessWidget {
  const _JourneyBanner({required this.streakDays});

  final int streakDays;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: FantasyDecorations.banner(),
      child: Row(
        children: [
          // Streak display
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.antiqueGold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderGold),
            ),
            child: Column(
              children: [
                Text(
                  '$streakDays',
                  style: const TextStyle(
                    fontFamily: 'Cinzel',
                    color: AppColors.brightGold,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.local_fire_department_rounded,
                      color: AppColors.error,
                      size: 12,
                    ),
                    const SizedBox(width: 3),
                    const Text(
                      'Day Streak',
                      style: TextStyle(
                        color: AppColors.mutedText,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  streakDays > 0
                      ? 'Keep it alive, legend.'
                      : 'Begin your journey today.',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  streakDays > 7
                      ? 'Your discipline is forging a path others dream of.'
                      : 'Every streak starts with a single step.',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Weekly Banner ──────────────────────────────────────────────

class _WeeklyBanner extends StatelessWidget {
  const _WeeklyBanner({required this.quest, this.onTap});

  final Quest quest;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: FantasyDecorations.banner(),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quest icon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.antiqueGold.withValues(alpha: 0.1),
                border: Border.all(color: AppColors.borderGold),
              ),
              child: const Icon(
                Icons.terrain_rounded,
                color: AppColors.antiqueGold,
                size: 24,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Weekly Expedition',
                        style: TextStyle(
                          fontFamily: 'Cinzel',
                          color: AppColors.parchment,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '+${quest.xp} XP',
                        style: const TextStyle(
                          color: AppColors.brightGold,
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    quest.title,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    quest.summary,
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 2,
                  ),
                  const SizedBox(height: 10),
                  GoldProgressBar(
                    value: quest.progress,
                    height: 5,
                    showLabel: true,
                    label: quest.target,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────

class _SectionRow extends StatelessWidget {
  const _SectionRow({required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _EmptyQuestNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      goldBorder: true,
      child: Column(
        children: [
          const Icon(Icons.auto_awesome_rounded,
              color: AppColors.antiqueGold, size: 32),
          const SizedBox(height: 12),
          Text(
            'No quests available',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Your path awaits. Quests will appear when the server generates them.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
