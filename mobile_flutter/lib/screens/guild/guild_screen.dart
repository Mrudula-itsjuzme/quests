import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../widgets/fantasy/fantasy_panel.dart';
import '../../widgets/fantasy/ornamental_divider.dart';

/// Guild screen preserved from the existing RemoteGuildScreen.
///
/// Visually refreshed with fantasy theme but keeps "coming soon"
/// sections clearly marked. No fake leaderboards or simulated members.
class GuildScreen extends StatelessWidget {
  const GuildScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return CustomScrollView(
      key: const Key('guild-screen'),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
          sliver: SliverList.list(children: [
            // ─── Page header ──────────────────────────────
            Text('THE OAKBOUND', style: theme.textTheme.labelSmall),
            const SizedBox(height: 6),
            Text('Guild', style: theme.textTheme.headlineLarge),
            const SizedBox(height: 6),
            Text(
              'Shared momentum, when the guild is ready.',
              style: theme.textTheme.bodyMedium,
            ),

            const SizedBox(height: 22),

            // ─── Guild hall ───────────────────────────────
            FantasyPanel(
              goldBorder: true,
              child: Column(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.emerald.withValues(alpha: 0.12),
                      border: Border.all(
                        color: AppColors.emerald.withValues(alpha: 0.4),
                        width: 1.5,
                      ),
                    ),
                    child: const Icon(
                      Icons.groups_rounded,
                      color: AppColors.emerald,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Your guild hall is quiet.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Live membership and leaderboards are not connected yet.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium,
                  ),

                  const SizedBox(height: 18),
                  const OrnamentalDivider(),
                  const SizedBox(height: 14),

                  Row(
                    children: [
                      const Icon(Icons.verified_user_outlined,
                          color: AppColors.emerald, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'No simulated members. Only real guild activity will appear here.',
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 22),

            // ─── Coming soon sections ─────────────────────
            _ComingSoonTile(
              icon: Icons.shield_rounded,
              title: 'Guild Quests',
              description: 'Shared challenges requiring team coordination.',
            ),
            const SizedBox(height: 10),
            _ComingSoonTile(
              icon: Icons.leaderboard_rounded,
              title: 'Leaderboard',
              description:
                  'Weekly rankings based on real quest completions.',
            ),
            const SizedBox(height: 10),
            _ComingSoonTile(
              icon: Icons.forum_rounded,
              title: 'Guild Chat',
              description: 'Share progress and encourage fellow adventurers.',
            ),

            const SizedBox(height: 22),

            // ─── Guild note ───────────────────────────────
            FantasyPanel(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.format_quote_rounded,
                      color: AppColors.antiqueGold, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '"Consistency beats intensity."',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "— Today's guild note",
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ]),
        ),
      ],
    );
  }
}

class _ComingSoonTile extends StatelessWidget {
  const _ComingSoonTile({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return FantasyPanel(
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.mutedText.withValues(alpha: 0.08),
              border: Border.all(
                color: AppColors.border,
              ),
            ),
            child: Icon(icon, color: AppColors.mutedText, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(description,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'SOON',
              style: TextStyle(
                color: AppColors.dimText,
                fontSize: 9,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
