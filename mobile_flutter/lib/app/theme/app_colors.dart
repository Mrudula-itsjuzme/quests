import 'package:flutter/material.dart';

/// Dark medieval fantasy color palette.
///
/// Designed around leather, parchment, bronze, emerald, burgundy, and
/// antique gold. Every value is intentionally muted to feel ancient
/// and torchlit rather than modern or neon.
class AppColors {
  AppColors._();

  // ─── Backgrounds ─────────────────────────────────────────────
  static const ink = Color(0xFF070A0B);
  static const deepBrown = Color(0xFF120E0A);
  static const panel = Color(0xFF131718);
  static const panelRaised = Color(0xFF1A1E1E);

  // ─── Gold spectrum ───────────────────────────────────────────
  static const antiqueGold = Color(0xFFC89A4B);
  static const brightGold = Color(0xFFE7C477);
  static const goldDim = Color(0xFF6A5632);

  // ─── Parchment ───────────────────────────────────────────────
  static const parchment = Color(0xFFE8D2A7);
  static const parchmentDark = Color(0xFFB99B69);
  static const parchmentSurface = Color(0xFF2A2318);

  // ─── Accents ─────────────────────────────────────────────────
  static const forest = Color(0xFF355B3B);
  static const emerald = Color(0xFF56875A);
  static const burgundy = Color(0xFF672F38);
  static const violet = Color(0xFF665080);
  static const amber = Color(0xFFB8863A);

  // ─── Text ────────────────────────────────────────────────────
  static const mutedText = Color(0xFFA99A83);
  static const dimText = Color(0xFF6B6358);

  // ─── Borders & lines ─────────────────────────────────────────
  static const border = Color(0xFF2E2A24);
  static const borderGold = Color(0xFF5A4A30);

  // ─── Status ──────────────────────────────────────────────────
  static const error = Color(0xFFD36A43);
  static const success = Color(0xFF56875A);

  /// Category accent color.
  static Color categoryColor(String category) => switch (category) {
        'Mind' => violet,
        'Body' => forest,
        'Discovery' => amber,
        _ => antiqueGold,
      };

  /// Rarity accent color.
  static Color rarityColor(String rarity) => switch (rarity) {
        'Common' => mutedText,
        'Uncommon' => emerald,
        'Rare' => const Color(0xFF4A7FBF),
        'Epic' => violet,
        'Legendary' => brightGold,
        _ => mutedText,
      };
}
