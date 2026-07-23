import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/fantasy_decorations.dart';

/// Custom fantasy bottom navigation bar.
///
/// Active item uses antique gold with a subtle raised treatment.
/// Preserves: Home, Quests, Guild, Rewards, Profile.
class FantasyBottomNav extends StatelessWidget {
  const FantasyBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  static const _items = [
    (label: 'Home', icon: Icons.home_rounded),
    (label: 'Quests', icon: Icons.flag_rounded),
    (label: 'Guild', icon: Icons.shield_rounded),
    (label: 'Rewards', icon: Icons.inventory_2_rounded),
    (label: 'Profile', icon: Icons.person_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.paddingOf(context).bottom;
    return Container(
      decoration: FantasyDecorations.bottomNav(),
      padding: EdgeInsets.fromLTRB(6, 6, 6, 6 + bottomPadding),
      child: Row(
        children: List.generate(_items.length, (index) {
          final item = _items[index];
          final selected = selectedIndex == index;
          return Expanded(
            child: Semantics(
              selected: selected,
              button: true,
              label: item.label,
              child: InkWell(
                key: Key('nav-${item.label.toLowerCase()}'),
                onTap: () => onSelected(index),
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.antiqueGold.withValues(alpha: 0.12)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    border: selected
                        ? Border.all(
                            color: AppColors.borderGold,
                            width: 0.5,
                          )
                        : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        item.icon,
                        size: 22,
                        color: selected
                            ? AppColors.brightGold
                            : AppColors.mutedText,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        item.label,
                        style: TextStyle(
                          color: selected
                              ? AppColors.parchment
                              : AppColors.mutedText,
                          fontSize: 10,
                          fontWeight:
                              selected ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
