import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../models/quest.dart';
import 'category_emblem.dart';
import 'gold_progress_bar.dart';
import 'parchment_card.dart';

/// Quest card resembling a parchment notice in a dark quest board.
///
/// Shows: category, title, summary, XP, status, target, progress, rarity.
class QuestCard extends StatelessWidget {
  const QuestCard({
    super.key,
    required this.quest,
    this.onTap,
    this.onComplete,
    this.isCompleting = false,
    this.compact = false,
  });

  final Quest quest;
  final VoidCallback? onTap;
  final VoidCallback? onComplete;
  final bool isCompleting;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final categoryColor = AppColors.categoryColor(quest.category);
    final rarityColor = AppColors.rarityColor(quest.rarity);
    final theme = Theme.of(context);

    if (compact) return _buildCompact(context, theme, categoryColor);

    return ParchmentCard(
      accentColor: categoryColor,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ─── Header row: emblem + title + XP ──────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CategoryEmblem(category: quest.category, size: 40),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            quest.title,
                            style: theme.textTheme.titleMedium,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.antiqueGold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppColors.borderGold,
                              width: 0.5,
                            ),
                          ),
                          child: Text(
                            '+${quest.xp} XP',
                            style: const TextStyle(
                              color: AppColors.brightGold,
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      quest.summary,
                      style: theme.textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // ─── Category + Rarity badges ─────────────────────
          Row(
            children: [
              _Badge(
                label: quest.category.toUpperCase(),
                color: categoryColor,
              ),
              const SizedBox(width: 6),
              _Badge(
                label: quest.rarity,
                color: rarityColor,
              ),
              const Spacer(),
              Text(
                quest.status,
                style: TextStyle(
                  color: quest.isCompleted
                      ? AppColors.emerald
                      : AppColors.mutedText,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // ─── Progress bar + target ────────────────────────
          GoldProgressBar(
            value: quest.progress,
            color: categoryColor,
            height: 6,
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: Text(
                  quest.target,
                  style: theme.textTheme.bodySmall,
                ),
              ),
              if (quest.canComplete && onComplete != null)
                SizedBox(
                  height: 32,
                  child: FilledButton(
                    onPressed: isCompleting ? null : onComplete,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      textStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    child: isCompleting
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.ink,
                            ),
                          )
                        : const Text('Complete'),
                  ),
                ),
              if (quest.isCompleted)
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.emerald.withValues(alpha: 0.15),
                    border: Border.all(color: AppColors.emerald),
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: AppColors.emerald,
                    size: 18,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompact(
      BuildContext context, ThemeData theme, Color categoryColor) {
    return ParchmentCard(
      accentColor: categoryColor,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      onTap: onTap,
      child: Row(
        children: [
          CategoryEmblem(category: quest.category, size: 34),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  quest.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.parchment,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  quest.summary,
                  style: theme.textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            quest.target,
            style: const TextStyle(
              color: AppColors.mutedText,
              fontSize: 12,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '+${quest.xp} XP',
            style: const TextStyle(
              color: AppColors.brightGold,
              fontSize: 11,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(
            Icons.chevron_right_rounded,
            color: AppColors.mutedText,
            size: 18,
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 0.5,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 9,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
