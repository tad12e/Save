import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors (Green & White Theme Palette)
  static const Color primaryGreen = Color(0xFF2D6A4F); // Deep Forest Green
  static const Color primaryGreenLight = Color(0xFF40916C); // Vibrant Green
  static const Color primaryGreenMuted = Color(0x1F2D6A4F); // rgba(45, 106, 79, 0.12)
  static const Color primaryGreenBg = Color(0xFFDCFCE7); // Soft Mint Green Tint
  
  // Brand Colors (Violet Light Palette - secondary)
  static const Color primaryViolet = Color(0xFF2D6A4F);
  static const Color primaryVioletLight = Color(0xFF40916C);
  static const Color primaryVioletMuted = Color(0x1F2D6A4F);
  static const Color primaryVioletBg = Color(0xFFDCFCE7);
  
  // Backgrounds & Surfaces (Light Theme)
  static const Color background = Color(0xFFF8FAFC); // Slate-50 off-white
  static const Color surface = Color(0xFFFFFFFF); // Pure crisp white
  static const Color surfaceCard = Color(0xFFFFFFFF); // White cards
  static const Color surfaceMuted = Color(0xFFF1F5F9); // Slate-100 container fill
  
  // Text & Typography Colors
  static const Color textPrimary = Color(0xFF0F172A); // Slate-900 high-contrast
  static const Color textWhite = Color(0xFF0F172A); // Alias for compatibility
  static const Color textMuted = Color(0xFF64748B); // Slate-500 secondary
  static const Color inactiveGrey = Color(0xFF94A3B8); // Slate-400 inactive
  
  // Borders & Dividers
  static const Color borderSubtle = Color(0xFFE2E8F0); // Slate-200 clean light border
  static const Color borderLight = Color(0xFFF1F5F9); // Slate-100 very subtle border
  
  // Status Colors
  static const Color amberAlert = Color(0xFFD97706); // Amber-600
  static const Color amberAlertBg = Color(0xFFFEF3C7); // Amber-100
  static const Color primaryAmber = Color(0xFFD97706);
  static const Color borderAmber = Color(0xFFFDE68A);
  
  static const Color trendGreen = Color(0xFF059669); // Emerald-600
  static const Color trendGreenBg = Color(0xFFD1FAE5); // Emerald-100
  
  static const Color urgencyRed = Color(0xFFDC2626); // Red-600
  static const Color urgencyRedBg = Color(0xFFFEE2E2); // Red-100

  // Light Theme Definition
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: background,
      primaryColor: primaryViolet,
      canvasColor: surface,
      cardColor: surfaceCard,
      dividerColor: borderSubtle,
      colorScheme: const ColorScheme.light(
        primary: primaryViolet,
        secondary: primaryVioletLight,
        surface: surface,
        error: urgencyRed,
      ),
      textTheme: TextTheme(
        headlineLarge: GoogleFonts.outfit(
          fontSize: 26,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textPrimary,
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
        backgroundColor: surface,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: const CardThemeData(
        color: surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: borderSubtle, width: 1.0),
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
    );
  }

  // Backward compatibility alias for darkTheme getter
  static ThemeData get darkTheme => lightTheme;
}

