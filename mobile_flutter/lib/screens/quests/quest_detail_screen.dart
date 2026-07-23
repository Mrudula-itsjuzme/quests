import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../models/quest.dart';
import '../../state/quest_controller.dart';
import '../../widgets/fantasy/category_emblem.dart';
import '../../widgets/fantasy/gold_progress_bar.dart';
import '../../widgets/fantasy/ornamental_divider.dart';

/// Full quest detail shown as a bottom sheet.
///
/// Displays all quest fields: title, summary, detail, category, rarity,
/// xp, status, target, instructions, proofType, cadence, progress.
class QuestDetailSheet extends StatelessWidget {
  const QuestDetailSheet({
    super.key,
    required this.quest,
    required this.controller,
  });

  final Quest quest;
  final QuestController controller;

  /// Show this sheet from any screen.
  static Future<void> show(
    BuildContext context, {
    required Quest quest,
    required QuestController controller,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.panel,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => QuestDetailSheet(quest: quest, controller: controller),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final categoryColor = AppColors.categoryColor(quest.category);
    final rarityColor = AppColors.rarityColor(quest.rarity);

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      expand: false,
      builder: (context, scrollController) {
        return ListenableBuilder(
          listenable: controller,
          builder: (context, _) {
            // Get the live version of this quest from the controller
            final liveQuest = controller.quests.firstWhere(
              (q) => q.id == quest.id,
              orElse: () => quest,
            );
            final isCompleting = controller.isCompleting(liveQuest.id);

            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              children: [
                // ─── Handle ──────────────────────────────
                Center(
                  child: Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // ─── Category emblem + title ─────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CategoryEmblem(category: liveQuest.category, size: 50),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            liveQuest.title,
                            style: theme.textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              _InfoBadge(
                                label: liveQuest.category,
                                color: categoryColor,
                              ),
                              const SizedBox(width: 6),
                              _InfoBadge(
                                label: liveQuest.rarity,
                                color: rarityColor,
                              ),
                              const SizedBox(width: 6),
                              _InfoBadge(
                                label: liveQuest.cadence.toUpperCase(),
                                color: AppColors.mutedText,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // ─── XP + Status row ─────────────────────
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.panelRaised,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.borderGold),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome_rounded,
                          color: AppColors.brightGold, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        '+${liveQuest.xp} XP',
                        style: const TextStyle(
                          color: AppColors.brightGold,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: liveQuest.isCompleted
                              ? AppColors.emerald.withValues(alpha: 0.15)
                              : AppColors.deepBrown,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: liveQuest.isCompleted
                                ? AppColors.emerald
                                : AppColors.border,
                          ),
                        ),
                        child: Text(
                          liveQuest.status,
                          style: TextStyle(
                            color: liveQuest.isCompleted
                                ? AppColors.emerald
                                : AppColors.parchmentDark,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ─── Progress ────────────────────────────
                GoldProgressBar(
                  value: liveQuest.progress,
                  color: categoryColor,
                  height: 8,
                  showLabel: true,
                  label: liveQuest.target,
                ),

                const SizedBox(height: 18),
                const OrnamentalDivider(),
                const SizedBox(height: 14),

                // ─── Summary ─────────────────────────────
                if (liveQuest.summary.isNotEmpty) ...[
                  Text(liveQuest.summary, style: theme.textTheme.bodyLarge),
                  const SizedBox(height: 10),
                ],

                // ─── Detail ──────────────────────────────
                if (liveQuest.detail.isNotEmpty &&
                    liveQuest.detail != liveQuest.summary) ...[
                  Text(liveQuest.detail, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 14),
                ],

                // ─── Instructions ────────────────────────
                if (liveQuest.instructions.isNotEmpty) ...[
                  Text('Instructions',
                      style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...liveQuest.instructions.asMap().entries.map((entry) =>
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.antiqueGold
                                    .withValues(alpha: 0.1),
                                border: Border.all(
                                    color: AppColors.borderGold, width: 0.5),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '${entry.key + 1}',
                                style: const TextStyle(
                                  color: AppColors.antiqueGold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                entry.value,
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 10),
                ],

                // ─── Proof type ──────────────────────────
                Row(
                  children: [
                    const Icon(Icons.verified_outlined,
                        color: AppColors.mutedText, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      'Proof: ${liveQuest.proofType}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // ─── Complete button ─────────────────────
                if (liveQuest.canComplete)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: FilledButton(
                      onPressed:
                          isCompleting ? null : () => _complete(context),
                      child: isCompleting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.ink,
                              ),
                            )
                          : const Text('Complete Quest'),
                    ),
                  ),

                if (liveQuest.isCompleted)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.emerald.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.emerald),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_rounded,
                            color: AppColors.emerald, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Quest Completed',
                          style: TextStyle(
                            color: AppColors.emerald,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _complete(BuildContext context) async {
    final result = await controller.completeQuest(quest.id);
    if (result != null && context.mounted) {
      // Show reward reveal
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            duration: const Duration(seconds: 4),
            content: Row(
              children: [
                const Icon(Icons.auto_awesome_rounded,
                    color: AppColors.brightGold, size: 24),
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
                        '+${result.xpCredited} XP earned${result.bonusXp > 0 ? ' · +${result.bonusXp} daily bonus!' : ''}',
                        style: const TextStyle(color: AppColors.mutedText),
                      ),
                      if (result.collectible != null)
                        Text(
                          'New relic: ${result.collectible!.title}',
                          style: const TextStyle(
                            color: AppColors.brightGold,
                            fontWeight: FontWeight.w600,
                          ),
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

class _InfoBadge extends StatelessWidget {
  const _InfoBadge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 0.5),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}
