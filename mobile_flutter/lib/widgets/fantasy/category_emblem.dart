import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';

/// Circular emblem for quest categories.
///
/// Mind → deep violet book icon
/// Body → forest green walk icon
/// Discovery → amber explore icon
class CategoryEmblem extends StatelessWidget {
  const CategoryEmblem({
    super.key,
    required this.category,
    this.size = 44,
  });

  final String category;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = AppColors.categoryColor(category);
    final icon = _icon;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.12),
        border: Border.all(
          color: color.withValues(alpha: 0.45),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.12),
            blurRadius: 6,
          ),
        ],
      ),
      child: Icon(
        icon,
        color: color,
        size: size * 0.48,
      ),
    );
  }

  IconData get _icon => switch (category) {
        'Mind' => Icons.menu_book_rounded,
        'Body' => Icons.directions_walk_rounded,
        'Discovery' => Icons.explore_rounded,
        _ => Icons.auto_awesome_rounded,
      };
}
