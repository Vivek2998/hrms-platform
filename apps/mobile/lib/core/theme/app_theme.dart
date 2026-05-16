import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand
  static const primary = Color(0xFF4F46E5); // Indigo-600
  static const primaryDark = Color(0xFF3730A3); // Indigo-800
  static const primaryLight = Color(0xFFEEF2FF); // Indigo-50

  // Gradients
  static const gradientStart = Color(0xFF4F46E5);
  static const gradientEnd = Color(0xFF7C3AED); // Violet-600

  // Semantic
  static const success = Color(0xFF10B981); // Emerald-500
  static const successLight = Color(0xFFD1FAE5); // Emerald-100
  static const warning = Color(0xFFF59E0B); // Amber-500
  static const warningLight = Color(0xFFFEF3C7); // Amber-100
  static const error = Color(0xFFEF4444); // Red-500
  static const errorLight = Color(0xFFFEE2E2); // Red-100
  static const info = Color(0xFF0EA5E9); // Sky-500
  static const infoLight = Color(0xFFE0F2FE); // Sky-100

  // Attendance status
  static const present = success;
  static const presentBg = successLight;
  static const late = warning;
  static const lateBg = warningLight;
  static const absent = error;
  static const absentBg = errorLight;
  static const onLeave = Color(0xFF6366F1); // Indigo-500
  static const onLeaveBg = Color(0xFFE0E7FF); // Indigo-100
  static const holiday = Color(0xFF8B5CF6); // Violet-500
  static const holidayBg = Color(0xFFEDE9FE); // Violet-100

  // Neutrals
  static const surface = Color(0xFFF8FAFC); // Slate-50
  static const white = Colors.white;

  static const LinearGradient brandGradient = LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppTheme {
  static const _seed = AppColors.primary;

  static ThemeData get light => _build(
        ColorScheme.fromSeed(
          seedColor: _seed,
          brightness: Brightness.light,
          primary: AppColors.primary,
          secondary: Color(0xFF0EA5E9),
          tertiary: Color(0xFF10B981),
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        isDark: false,
      );

  static ThemeData get dark => _build(
        ColorScheme.fromSeed(
          seedColor: _seed,
          brightness: Brightness.dark,
          primary: Color(0xFF818CF8), // Indigo-400
        ),
        isDark: true,
      );

  static ThemeData _build(ColorScheme scheme, {required bool isDark}) {
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    return base.copyWith(
      scaffoldBackgroundColor: isDark ? null : AppColors.surface,
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.inter(
          color: scheme.onSurface,
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: isDark ? scheme.surfaceContainer : Colors.white,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isDark
                ? scheme.outlineVariant.withAlpha(80)
                : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? scheme.surfaceContainerHighest
            : const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outlineVariant.withAlpha(128)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: TextStyle(color: scheme.onSurfaceVariant.withAlpha(160)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: BorderSide(color: scheme.primary),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        showCheckmark: false,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isDark ? scheme.surfaceContainer : Colors.white,
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.primaryLight,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: AppColors.primary, size: 24);
          }
          return IconThemeData(
            color: scheme.onSurfaceVariant.withAlpha(180),
            size: 24,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final base = GoogleFonts.inter(fontSize: 11);
          if (states.contains(WidgetState.selected)) {
            return base.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
            );
          }
          return base.copyWith(
            fontWeight: FontWeight.w500,
            color: scheme.onSurfaceVariant.withAlpha(180),
          );
        }),
      ),
      dividerTheme: const DividerThemeData(
        space: 0,
        thickness: 1,
        color: Color(0xFFE2E8F0),
      ),
      listTileTheme: ListTileThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}
