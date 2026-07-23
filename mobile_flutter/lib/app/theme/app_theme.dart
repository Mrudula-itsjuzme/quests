import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Complete Material 3 theme wrapped in a medieval fantasy palette.
///
/// * Cinzel for headlines (fantasy serif).
/// * Default sans-serif for body text (clear, readable).
class AppTheme {
  AppTheme._();

  static const _cinzel = 'Cinzel';

  static ThemeData dark() => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.ink,
        useMaterial3: true,
        fontFamily: null, // system default for body
        colorScheme: const ColorScheme.dark(
          primary: AppColors.antiqueGold,
          secondary: AppColors.emerald,
          surface: AppColors.panel,
          error: AppColors.error,
          onPrimary: AppColors.ink,
          onSecondary: AppColors.parchment,
          onSurface: AppColors.parchment,
          onError: AppColors.parchment,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontFamily: _cinzel,
            color: AppColors.parchment,
            fontSize: 34,
            fontWeight: FontWeight.w700,
            height: 1.05,
            letterSpacing: 0.4,
          ),
          headlineLarge: TextStyle(
            fontFamily: _cinzel,
            color: AppColors.parchment,
            fontSize: 28,
            fontWeight: FontWeight.w700,
            height: 1.1,
            letterSpacing: 0.2,
          ),
          headlineMedium: TextStyle(
            fontFamily: _cinzel,
            color: AppColors.parchment,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            height: 1.15,
          ),
          headlineSmall: TextStyle(
            fontFamily: _cinzel,
            color: AppColors.parchment,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            height: 1.2,
          ),
          titleLarge: TextStyle(
            color: AppColors.parchment,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
          titleMedium: TextStyle(
            color: AppColors.parchment,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
          titleSmall: TextStyle(
            color: AppColors.parchmentDark,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: TextStyle(
            color: AppColors.parchmentDark,
            fontSize: 15,
            height: 1.4,
          ),
          bodyMedium: TextStyle(
            color: AppColors.parchmentDark,
            fontSize: 14,
            height: 1.35,
          ),
          bodySmall: TextStyle(
            color: AppColors.mutedText,
            fontSize: 12,
            height: 1.3,
          ),
          labelLarge: TextStyle(
            color: AppColors.parchment,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.4,
          ),
          labelSmall: TextStyle(
            color: AppColors.antiqueGold,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.4,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.antiqueGold,
            foregroundColor: AppColors.ink,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.antiqueGold,
            side: const BorderSide(color: AppColors.borderGold),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.antiqueGold,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.deepBrown,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.antiqueGold),
          ),
          labelStyle: const TextStyle(color: AppColors.mutedText),
          hintStyle: const TextStyle(color: AppColors.dimText),
        ),
        dividerColor: AppColors.border,
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.panelRaised,
          shape: RoundedRectangleBorder(
            side: const BorderSide(color: AppColors.borderGold),
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.panel,
          selectedColor: AppColors.antiqueGold.withValues(alpha: 0.15),
          side: const BorderSide(color: AppColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          labelStyle: const TextStyle(
            color: AppColors.mutedText,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
}
