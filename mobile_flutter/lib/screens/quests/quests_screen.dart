import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../models/quest.dart';
import '../../state/quest_controller.dart';
import '../../widgets/fantasy/quest_card.dart';

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
  });

  final QuestController controller;
  final ValueChanged<Quest> onQuestTap;

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
                // ─── Page header ─────────────────────────────
                Text(
                  'ADVENTURE LOG',
                  style: theme.textTheme.labelSmall,
                ),
                const SizedBox(height: 6),
                Text('Quests', style: theme.textTheme.headlineLarge),
                const SizedBox(height: 6),
                Text(
                  'Choose a path and keep moving.',
                  style: theme.textTheme.bodyMedium,
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
                      ...['Not Started', 'In Progress', 'Awaiting Proof', 'Completed']
                          .map((status) => Padding(
                                padding: const EdgeInsets.only(left: 6),
                                child: _FilterChip(
                                  label: status,
                                  selected: controller.statusFilter == status,
                                  onTap: () =>
                                      controller.setStatusFilter(status),
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

// ─── Weekly progress bar ────────────────────────────────────────

class _WeeklyProgress extends StatelessWidget {
  const _WeeklyProgress({required this.controller});

  final QuestController controller;

  @override
  Widget build(BuildContext context) {
    final total = controller.quests.length;
    final completed =
        controller.quests.where((q) => q.isCompleted).length;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.panelRaised,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.flag_rounded, color: AppColors.antiqueGold, size: 18),
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
              Icon(icon, size: small ? 14 : 16,
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
