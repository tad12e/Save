import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/theme.dart';
import '../main_navigation_shell.dart';
import 'sign_in_screen.dart';
import 'sign_up_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _slides = [
    {
      'title': 'Capture Anything in 1 Tap',
      'subtitle':
          'Clip web pages, research papers, jobs, and tweets directly into your personal knowledge vault from any app or browser.',
      'icon': LucideIcons.bookmarkCheck,
      'badge': 'INSTANT CLIPPER',
      'accent': const Color(0xFF2D6A4F),
      'bgAccent': const Color(0xFFDCFCE7),
    },
    {
      'title': 'AI-Powered Insights & Search',
      'subtitle':
          'Instant auto-summaries, smart topic tags, and a conversational feed to talk directly with your saved content.',
      'icon': LucideIcons.sparkles,
      'badge': 'AI KNOWLEDGE VAULT',
      'accent': const Color(0xFF16A34A),
      'bgAccent': const Color(0xFFDCFCE7),
    },
    {
      'title': 'Sync Across All Workspaces',
      'subtitle':
          'Seamlessly connects with your Chrome extension, Notion, Google Sheets, and export webhooks in real-time.',
      'icon': LucideIcons.refreshCw,
      'badge': 'UNIVERSAL SYNC',
      'accent': const Color(0xFF06B6D4),
      'bgAccent': const Color(0xFFE0F2FE),
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextSlide() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      _navigateToSignUp();
    }
  }

  void _previousSlide() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToSlide(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void _navigateToMainAsGuest() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const MainNavigationShell()),
    );
  }

  void _navigateToSignIn() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const SignInScreen()),
    );
  }

  void _navigateToSignUp() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const SignUpScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLastSlide = _currentPage == _slides.length - 1;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar: Logo & Skip to Guest
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2D6A4F),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(LucideIcons.bookmark, size: 16, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Save',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: _navigateToMainAsGuest,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Skip to Guest',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF2D6A4F),
                          ),
                        ),
                        const SizedBox(width: 2),
                        const Icon(LucideIcons.chevronRight, size: 14, color: Color(0xFF2D6A4F)),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Middle: Carousel with Previous / Next floating arrows
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _slides.length,
                    itemBuilder: (context, index) {
                      final slide = _slides[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Illustration Circle Icon Container
                            Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                color: slide['bgAccent'] as Color,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: (slide['accent'] as Color).withValues(alpha: 0.15),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Icon(
                                  slide['icon'] as IconData,
                                  size: 52,
                                  color: slide['accent'] as Color,
                                ),
                              ),
                            ),
                            const SizedBox(height: 28),

                            // Pill Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.borderSubtle),
                              ),
                              child: Text(
                                slide['badge'] as String,
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.6,
                                  color: slide['accent'] as Color,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),

                            // Title
                            Text(
                              slide['title'] as String,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                                height: 1.25,
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Subtitle
                            Text(
                              slide['subtitle'] as String,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppTheme.textMuted,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  // Left Arrow Button (Previous)
                  if (_currentPage > 0)
                    Positioned(
                      left: 12,
                      child: GestureDetector(
                        onTap: _previousSlide,
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.borderSubtle),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(LucideIcons.chevronLeft, size: 20, color: Color(0xFF2D6A4F)),
                        ),
                      ),
                    ),

                  // Right Arrow Button (Next)
                  if (!isLastSlide)
                    Positioned(
                      right: 12,
                      child: GestureDetector(
                        onTap: _nextSlide,
                        child: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.borderSubtle),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Icon(LucideIcons.chevronRight, size: 20, color: Color(0xFF2D6A4F)),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Indicator Dots Row (Clickable)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Back label button
                  SizedBox(
                    width: 60,
                    child: _currentPage > 0
                        ? GestureDetector(
                            onTap: _previousSlide,
                            child: Row(
                              children: [
                                const Icon(LucideIcons.arrowLeft, size: 14, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  'Back',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),

                  // Dots
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(
                      _slides.length,
                      (index) => GestureDetector(
                        onTap: () => _goToSlide(index),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _currentPage == index ? 24 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _currentPage == index
                                ? const Color(0xFF2D6A4F)
                                : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Next label button
                  SizedBox(
                    width: 60,
                    child: !isLastSlide
                        ? GestureDetector(
                            onTap: _nextSlide,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  'Next',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF2D6A4F),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(LucideIcons.arrowRight, size: 14, color: Color(0xFF2D6A4F)),
                              ],
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Bottom Action Buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  // Next Slide / Get Started Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2D6A4F),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: isLastSlide ? _navigateToSignUp : _nextSlide,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            isLastSlide ? 'Get Started' : 'Next Step',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Sign In Outline Button
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        side: const BorderSide(color: AppTheme.borderSubtle, width: 1.2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: _navigateToSignIn,
                      child: Text(
                        'I already have an account',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Explore as Guest Link
                  GestureDetector(
                    onTap: _navigateToMainAsGuest,
                    child: Padding(
                      padding: const EdgeInsets.all(6),
                      child: Text(
                        'Continue as Guest without account →',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
