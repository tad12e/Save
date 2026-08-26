import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Matching Web OLED Amber Design)
  static const Color background = Color(0xFF050505);
  static const Color surface = Color(0xFF0A0A0A);
  static const Color surfaceCard = Color(0xFF101010);
  static const Color primaryAmber = Color(0xFFF59E0B);
  static const Color primaryAmberLight = Color(0xFFFBBF24);
  static const Color accentEmerald = Color(0xFF10B981);
  static const Color textWhite = Color(0xFFFFFFFF);
  static const Color textMuted = Color(0xFFA8A29E);
  static const Color borderSubtle = Color(0x1FFFFFFF);
  static const Color borderAmber = Color(0x4DF59E0B);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: primaryAmber,
      colorScheme: const ColorScheme.dark(
        primary: primaryAmber,
        secondary: primaryAmberLight,
        surface: surface,
        error: Colors.redAccent,
      ),
      textTheme: TextTheme(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textWhite,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textWhite,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 16,
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
        labelSmall: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          letterSpacing: 1.1,
          color: primaryAmber,
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
          side: BorderSide(color: borderSubtle, width: 1),
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
      ),
    );
  }
}
