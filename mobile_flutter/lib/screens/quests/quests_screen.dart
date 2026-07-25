import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../models/quest.dart';
import '../../state/quest_controller.dart';
import '../../widgets/fantasy/quest_card.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/gold_progress_bar.dart';
import '../../widgets/fantasy/reference_components.dart';

/// The functional core quest log screen.
///
/// Features:
/// * Category filters: All / Mind / Body / Discovery
/// * Status filters: Not Started / In Progress / Awaiting Proof / Completed
/// * All quest data from loaded API responses
class QuestsScreen extends StatelessWidget {
  const QuestsScreen({
    super.key,
    required this.controller,
    required this.onQuestTap,
    required this.displayName,
    required this.level,
    required this.totalXp,
    required this.streakDays,
  });

  final QuestController controller;
  final ValueChanged<Quest> onQuestTap;
  final String displayName;
  final int level;
  final int totalXp;
  final int streakDays;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final filtered = controller.filteredQuests;
        final theme = Theme.of(context);

        return CustomScrollView(
          key: const Key('quests-screen'),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              sliver: SliverList.list(children: [
                ReferencePlayerHeader(
                  page: 'Quests',
                  displayName: displayName,
                  level: level,
                  totalXp: totalXp,
                ),
                const SizedBox(height: 14),
                _FocusHero(
                    quest: controller.quests.isEmpty
                        ? null
                        : controller.quests.first),
                const SizedBox(height: 12),
                _CadenceTabs(controller: controller),
                const SizedBox(height: 16),
                // ─── Page header ─────────────────────────────
                Text(
                  'ACTIVE QUESTS',
                  style: theme.textTheme.labelSmall,
                ),

                const SizedBox(height: 18),

                // ─── Category filters ────────────────────────
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All',
                        selected: controller.categoryFilter == null,
                        onTap: () => controller.setCategoryFilter(null),
                      ),
                      ...['Mind', 'Body', 'Discovery'].map((cat) => Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: _FilterChip(
                              label: cat,
                              icon: _categoryIcon(cat),
                              selected: controller.categoryFilter == cat,
                              onTap: () => controller.setCategoryFilter(cat),
                            ),
                          )),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                // ─── Status filters ──────────────────────────
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All statuses',
                        selected: controller.statusFilter == null,
                        onTap: () => controller.setStatusFilter(null),
                        small: true,
                      ),
                      ...[
                        'Not Started',
                        'In Progress',
                        'Awaiting Proof',
                        'Completed'
                      ].map((status) => Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: _FilterChip(
                              label: status,
                              selected: controller.statusFilter == status,
                              onTap: () => controller.setStatusFilter(status),
                              small: true,
                            ),
                          )),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // ─── Weekly progress summary ─────────────────
                _WeeklyProgress(controller: controller),

                const SizedBox(height: 14),

                Row(children: [
                  Expanded(
                      child: _ProgressPanel(
                          icon: Icons.local_fire_department_rounded,
                          value: '$streakDays',
                          label: 'day streak')),
                  const SizedBox(width: 10),
                  Expanded(
                      child: _ProgressPanel(
                          icon: Icons.explore_rounded,
                          value: _rank(totalXp),
                          label: 'path rank')),
                ]),

                const SizedBox(height: 14),

                // ─── Quest list ──────────────────────────────
                if (filtered.isEmpty)
                  _EmptyFilterNotice()
                else
                  ...filtered.map((quest) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: QuestCard(
                          quest: quest,
                          onTap: () => onQuestTap(quest),
                          onComplete: quest.canComplete
                              ? () => _handleComplete(context, quest)
                              : null,
                          isCompleting: controller.isCompleting(quest.id),
                        ),
                      )),
              ]),
            ),
          ],
        );
      },
    );
  }

  String _rank(int xp) {
    if (xp >= 2000) return 'Gold I';
    if (xp >= 1000) return 'Silver II';
    if (xp >= 500) return 'Novice III';
    return 'Novice I';
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
                  child: Text(
                    '${quest.title} complete! +${result.xpCredited} XP',
                    style: const TextStyle(color: AppColors.parchment),
                  ),
                ),
              ],
            ),
          ),
        );
    }
  }

  IconData _categoryIcon(String cat) => switch (cat) {
        'Mind' => Icons.menu_book_rounded,
        'Body' => Icons.directions_walk_rounded,
        _ => Icons.explore_rounded,
      };
}

class _FocusHero extends StatelessWidget {
  const _FocusHero({required this.quest});
  final Quest? quest;

  @override
  Widget build(BuildContext context) {
    final value = quest?.progress ?? 0;
    return FantasyPanel(
      goldBorder: true,
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text("◆  TODAY'S FOCUS  ◆",
            style: TextStyle(
                color: AppColors.brightGold,
                fontFamily: 'Cinzel',
                letterSpacing: 1)),
        const SizedBox(height: 12),
        Row(children: [
          GoldProgressRing(
            value: value,
            size: 126,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.menu_book_rounded,
                  color: AppColors.brightGold, size: 32),
              Text('${(value * 100).round()}%',
                  style: const TextStyle(
                      color: AppColors.parchment, fontWeight: FontWeight.w800)),
            ]),
          ),
          const SizedBox(width: 16),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(quest?.title ?? "The Scholar's Path",
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(quest?.summary ?? 'Generate a quest to begin your path.',
                    maxLines: 3, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 10),
                GoldProgressBar(value: value, height: 7),
                const SizedBox(height: 8),
                const Text('Knowledge is a blade. Sharpen it.',
                    style: TextStyle(
                        color: AppColors.antiqueGold,
                        fontFamily: 'Cinzel',
                        fontStyle: FontStyle.italic)),
              ])),
        ]),
        const WayfarerPortrait(height: 220),
      ]),
    );
  }
}

class _CadenceTabs extends StatelessWidget {
  const _CadenceTabs({required this.controller});
  final QuestController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: AppColors.panel,
          border: Border.all(color: AppColors.borderGold),
          borderRadius: BorderRadius.circular(16)),
      child: Row(children: [
        _item(context, 'Daily', Icons.wb_sunny_outlined, null),
        _item(context, 'Weekly', Icons.calendar_month_outlined, null),
        _item(context, 'Story', Icons.menu_book_outlined,
            'Story quests are not available yet.'),
        _item(context, 'Event', Icons.auto_awesome_outlined,
            'There is no active event.'),
      ]),
    );
  }

  Widget _item(
          BuildContext context, String label, IconData icon, String? notice) =>
      Expanded(
        child: InkWell(
          onTap: () {
            if (notice != null)
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(notice)));
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(children: [
              Icon(icon,
                  size: 19,
                  color: notice == null
                      ? AppColors.brightGold
                      : AppColors.mutedText),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(fontSize: 10))
            ]),
          ),
        ),
      );
}

class _ProgressPanel extends StatelessWidget {
  const _ProgressPanel(
      {required this.icon, required this.value, required this.label});
  final IconData icon;
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => FantasyPanel(
        child: Column(children: [
          Icon(icon, color: AppColors.brightGold, size: 34),
          const SizedBox(height: 5),
          Text(value,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ]),
      );
}

// ─── Weekly progress bar ────────────────────────────────────────

class _WeeklyProgress extends StatelessWidget {
  const _WeeklyProgress({required this.controller});

  final QuestController controller;

  @override
  Widget build(BuildContext context) {
    final total = controller.quests.length;
    final completed = controller.quests.where((q) => q.isCompleted).length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.panelRaised,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.flag_rounded,
              color: AppColors.antiqueGold, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '$completed of $total quests completed',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          Text(
            '${total > 0 ? ((completed / total) * 100).round() : 0}%',
            style: const TextStyle(
              color: AppColors.brightGold,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Filter chip ────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
    this.small = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final bool small;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: EdgeInsets.symmetric(
          horizontal: small ? 10 : 14,
          vertical: small ? 6 : 8,
        ),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.antiqueGold.withValues(alpha: 0.15)
              : AppColors.panel,
          borderRadius: BorderRadius.circular(small ? 8 : 10),
          border: Border.all(
            color: selected ? AppColors.antiqueGold : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon,
                  size: small ? 14 : 16,
                  color: selected ? AppColors.parchment : AppColors.mutedText),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                color: selected ? AppColors.parchment : AppColors.mutedText,
                fontSize: small ? 11 : 13,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFilterNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Column(
        children: [
          const Icon(Icons.search_off_rounded,
              color: AppColors.mutedText, size: 36),
          const SizedBox(height: 12),
          Text(
            'No quests match these filters.',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Try adjusting your category or status selection.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
