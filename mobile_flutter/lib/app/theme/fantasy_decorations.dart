import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Reusable decoration factories for the fantasy quest journal UI.
class FantasyDecorations {
  FantasyDecorations._();

  /// Standard dark panel decoration.
  static BoxDecoration panel({bool raised = false, bool goldBorder = false}) =>
      BoxDecoration(
        color: raised ? AppColors.panelRaised : AppColors.panel,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: goldBorder ? AppColors.borderGold : AppColors.border,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x30000000),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      );

  /// Parchment surface for quest cards.
  static BoxDecoration parchmentCard({Color? accentColor}) => BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.parchmentSurface,
            Color(0xFF1E1A14),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: accentColor?.withValues(alpha: 0.4) ?? AppColors.borderGold,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x20000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
          // Inner shadow simulation via layered container
        ],
      );

  /// Cinematic banner decoration (journey / weekly quest).
  static BoxDecoration banner() => BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF1A1510),
            Color(0xFF0E0C08),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGold),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      );

  /// Ornate gold border for avatar medallion.
  static BoxDecoration avatarMedallion({double size = 60}) => BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.brightGold,
            AppColors.antiqueGold,
            AppColors.goldDim,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.antiqueGold.withValues(alpha: 0.3),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      );

  /// Inner medallion for avatar content.
  static BoxDecoration avatarInner() => const BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.deepBrown,
      );

  /// Category emblem ring decoration.
  static BoxDecoration emblemRing(Color color) => BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.12),
        border: Border.all(
          color: color.withValues(alpha: 0.5),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.15),
            blurRadius: 8,
          ),
        ],
      );

  /// Bottom navigation bar decoration.
  static BoxDecoration bottomNav() => const BoxDecoration(
        color: Color(0xFF0C0F0E),
        border: Border(
          top: BorderSide(color: AppColors.borderGold, width: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x60000000),
            blurRadius: 12,
            offset: Offset(0, -4),
          ),
        ],
      );

  /// Rarity shimmer gradient (for rare+ quest borders).
  static LinearGradient rarityShimmer(String rarity) {
    final color = AppColors.rarityColor(rarity);
    return LinearGradient(
      colors: [
        color.withValues(alpha: 0.0),
        color.withValues(alpha: 0.3),
        color.withValues(alpha: 0.0),
      ],
    );
  }
}
