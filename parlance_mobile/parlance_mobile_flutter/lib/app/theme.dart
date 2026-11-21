import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Parlance's colours, the same tokens as the web app (`src/styles/index.css`).
///
/// Each direction keeps its own colour everywhere: tangerine is the voice
/// (speech, the hearing side), blue is the hands (signing), sun is a card, and
/// red is only for emergencies and errors.
abstract final class Brand {
  static const navy = Color(0xFF233059);
  static const royal = Color(0xFF3C5A99);
  static const ink2 = Color(0xFF4A5478);
  static const ink3 = Color(0xFF64687F);
  static const paper = Color(0xFFF4EDE0);
  static const surface = Color(0xFFFFFAF2);
  static const line = Color(0xFFE0D6C3);
  static const lineStrong = Color(0xFFCDBFA6);

  /// Speech and the hearing side.
  static const voice = Color(0xFFE3826B);
  static const voiceSoft = Color(0xFFF7DDD5);

  /// Signing and the Deaf side.
  static const hands = Color(0xFF3C5A99);
  static const handsSoft = Color(0xFFDDE3EF);
  static const handsDeep = Color(0xFF2A4275);

  /// Cards.
  static const sun = Color(0xFFE6C55C);
  static const sunSoft = Color(0xFFF6E9BF);
  static const sunDeep = Color(0xFF6B5418);

  static const danger = Color(0xFFA8382B);
  static const dangerSoft = Color(0xFFF6DCD6);
}

TextTheme _text(TextTheme base) {
  final body = GoogleFonts.manropeTextTheme(
    base,
  ).apply(bodyColor: Brand.navy, displayColor: Brand.navy);
  TextStyle? display(TextStyle? style) => GoogleFonts.bricolageGrotesque(
    textStyle: style,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.8,
  );
  return body.copyWith(
    displayLarge: display(body.displayLarge),
    displayMedium: display(body.displayMedium),
    displaySmall: display(body.displaySmall),
    headlineLarge: display(body.headlineLarge),
    headlineMedium: display(body.headlineMedium),
    headlineSmall: display(body.headlineSmall),
    titleLarge: display(body.titleLarge)?.copyWith(letterSpacing: -0.4),
    titleMedium: body.titleMedium?.copyWith(fontWeight: FontWeight.w800),
    labelLarge: body.labelLarge?.copyWith(fontWeight: FontWeight.w800),
    bodyLarge: body.bodyLarge?.copyWith(height: 1.45),
    bodyMedium: body.bodyMedium?.copyWith(height: 1.45, color: Brand.ink2),
  );
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.royal,
    primary: Brand.navy,
    onPrimary: Colors.white,
    secondary: Brand.voice,
    surface: Brand.surface,
    onSurface: Brand.navy,
    error: Brand.danger,
  );
  final base = ThemeData(colorScheme: scheme, useMaterial3: true);
  final shape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(999),
  );
  return base.copyWith(
    scaffoldBackgroundColor: Brand.paper,
    textTheme: _text(base.textTheme),
    appBarTheme: AppBarTheme(
      backgroundColor: Brand.paper,
      foregroundColor: Brand.navy,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.bricolageGrotesque(
        fontSize: 22,
        fontWeight: FontWeight.w800,
        color: Brand.navy,
        letterSpacing: -0.5,
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Brand.navy,
        foregroundColor: Colors.white,
        minimumSize: const Size(64, 52),
        padding: const EdgeInsets.symmetric(horizontal: 22),
        shape: shape,
        textStyle: GoogleFonts.manrope(
          fontSize: 16,
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: Brand.navy,
        minimumSize: const Size(64, 52),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        side: const BorderSide(color: Brand.lineStrong),
        shape: shape,
        textStyle: GoogleFonts.manrope(
          fontSize: 16,
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Brand.royal,
        minimumSize: const Size(48, 48),
        textStyle: GoogleFonts.manrope(
          fontSize: 15,
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Brand.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Brand.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: Brand.royal, width: 2),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      backgroundColor: Colors.white,
      side: const BorderSide(color: Brand.line),
      shape: shape,
      labelStyle: GoogleFonts.manrope(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: Brand.navy,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: Brand.navy,
      contentTextStyle: GoogleFonts.manrope(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    dividerTheme: const DividerThemeData(color: Brand.line, space: 1),
  );
}
