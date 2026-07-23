import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../models/collectible.dart';
import '../../state/quest_controller.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/ornamental_divider.dart';

/// Rewards screen populated from `/api/collectibles`.
///
/// No hardcoded chest ownership or unlocked collectibles.
class RewardsScreen extends StatelessWidget {
  const RewardsScreen({
    super.key,
    required this.controller,
    required this.level,
    required this.streakDays,
  });

  final QuestController controller;
  final int level;
  final int streakDays;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final collectibles = controller.collectibles;

        return CustomScrollView(
          key: const Key('rewards-screen'),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
              sliver: SliverList.list(children: [
                // ─── Page header ──────────────────────────────
                Text('TREASURE ROOM', style: theme.textTheme.labelSmall),
                const SizedBox(height: 6),
                Text('Rewards', style: theme.textTheme.headlineLarge),
                const SizedBox(height: 6),
                Text(
                  '${collectibles.length} verified relics collected.',
                  style: theme.textTheme.bodyMedium,
                ),

                const SizedBox(height: 18),

                // ─── Stats row ────────────────────────────────
                Row(
                  children: [
                    Expanded(
                      child: _StatTile(value: '$level', label: 'Level'),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatTile(
                          value: '$streakDays', label: 'Day Streak'),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatTile(
                          value: '${collectibles.length}', label: 'Relics'),
                    ),
                  ],
                ),

                const SizedBox(height: 22),
                const OrnamentalDivider(),
                const SizedBox(height: 14),

                // ─── Quest relics ─────────────────────────────
                Text('Quest Relics', style: theme.textTheme.headlineSmall),
                const SizedBox(height: 12),

                if (collectibles.isEmpty)
                  _EmptyCollection()
                else
                  ...collectibles.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CollectibleCard(collectible: item),
                      )),
              ]),
            ),
          ],
        );
      },
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              color: AppColors.brightGold,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 3),
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

class _CollectibleCard extends StatelessWidget {
  const _CollectibleCard({required this.collectible});

  final Collectible collectible;

  @override
  Widget build(BuildContext context) {
    final rarityColor = AppColors.rarityColor(collectible.rarity);
    final theme = Theme.of(context);

    return FantasyPanel(
      goldBorder: true,
      child: Row(
        children: [
          // Relic icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: rarityColor.withValues(alpha: 0.12),
              border: Border.all(
                color: rarityColor.withValues(alpha: 0.4),
                width: 1.5,
              ),
            ),
            child: Icon(
              Icons.auto_awesome_rounded,
              color: rarityColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  collectible.title,
                  style: theme.textTheme.titleMedium,
                ),
                if (collectible.caption.isNotEmpty)
                  Text(
                    collectible.caption,
                    style: theme.textTheme.bodySmall,
                    maxLines: 2,
                  ),
                if (collectible.unlockedAt != null)
                  Text(
                    'Unlocked ${_formatDate(collectible.unlockedAt!)}',
                    style: TextStyle(
                      color: AppColors.dimText,
                      fontSize: 10,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                collectible.rarity,
                style: TextStyle(
                  color: rarityColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                collectible.category,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final date = DateTime.parse(iso);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return '';
    }
  }
}

class _EmptyCollection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      goldBorder: true,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.antiqueGold.withValues(alpha: 0.1),
              border: Border.all(color: AppColors.borderGold),
            ),
            child: const Icon(
              Icons.inventory_2_outlined,
              color: AppColors.antiqueGold,
              size: 26,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'No relics yet.',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 6),
          Text(
            'Complete verified quests to begin your collection. Each completed quest may yield a unique relic.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
