import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Violet & Dark Palette)
  static const Color primaryViolet = Color(0xFF7C3AED);
  static const Color primaryVioletLight = Color(0xFF8B5CF6);
  static const Color primaryVioletMuted = Color(0x337C3AED);
  
  static const Color background = Color(0xFF0F0F1A);
  static const Color surface = Color(0xFF141424);
  static const Color surfaceCard = Color(0xFF1A1A2E);
  
  static const Color inactiveGrey = Color(0xFF64748B);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color borderSubtle = Color(0x14FFFFFF); // rgba(255, 255, 255, 0.08)
  
  static const Color amberAlert = Color(0xFFF59E0B);
  static const Color trendGreen = Color(0xFF10B981);
  static const Color urgencyRed = Color(0xFFEF4444);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primaryViolet,
      colorScheme: const ColorScheme.dark(
        primary: primaryViolet,
        secondary: primaryVioletLight,
        surface: surface,
        error: urgencyRed,
      ),
      textTheme: TextTheme(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: textWhite,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textWhite,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textWhite,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textWhite,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textWhite,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textMuted,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.normal,
          color: textMuted,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: inactiveGrey,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: const CardThemeData(
        color: surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: borderSubtle, width: 0.5),
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
    );
  }
}
