import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'audio_recognition_dialog.dart';

/// Global controller to toggle and manage the Floating Music Bubble
class FloatingBubbleManager {
  static final ValueNotifier<bool> isVisible = ValueNotifier<bool>(false);

  static void show() {
    isVisible.value = true;
  }

  static void hide() {
    isVisible.value = false;
  }

  static void toggle() {
    isVisible.value = !isVisible.value;
  }
}

/// A draggable, animated floating music bubble widget for 1-tap background
/// audio fingerprinting over TikTok, Instagram, YouTube, and feeds.
class FloatingMusicBubbleOverlay extends StatefulWidget {
  final Widget? child;

  const FloatingMusicBubbleOverlay({super.key, this.child});

  @override
  State<FloatingMusicBubbleOverlay> createState() => _FloatingMusicBubbleOverlayState();
}

class _FloatingMusicBubbleOverlayState extends State<FloatingMusicBubbleOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseScale;
  late Animation<double> _glowAnimation;

  Offset _position = const Offset(24, 220);
  bool _isDragging = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _pulseScale = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 4.0, end: 14.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _onTapBubble() {
    AudioRecognitionDialog.show(
      context,
      titleHint: 'Floating Bubble 1-Tap Fingerprint',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (widget.child != null) widget.child!,
        ValueListenableBuilder<bool>(
          valueListenable: FloatingBubbleManager.isVisible,
          builder: (context, visible, _) {
            if (!visible) return const SizedBox.shrink();

            final screenSize = MediaQuery.of(context).size;
            final bubbleSize = 64.0;

            // Clamp position within safe screen boundaries
            final clampedX = _position.dx.clamp(12.0, screenSize.width - bubbleSize - 12.0);
            final clampedY = _position.dy.clamp(60.0, screenSize.height - bubbleSize - 80.0);

            return Positioned(
              left: clampedX,
              top: clampedY,
              child: Material(
                color: Colors.transparent,
                child: GestureDetector(
                  onPanStart: (_) => setState(() => _isDragging = true),
                  onPanUpdate: (details) {
                    setState(() {
                      _position += details.delta;
                    });
                  },
                  onPanEnd: (_) {
                    setState(() {
                      _isDragging = false;
                      // Snap to nearest horizontal edge (left or right)
                      final screenW = MediaQuery.of(context).size.width;
                      final targetX = _position.dx < (screenW / 2) ? 16.0 : (screenW - bubbleSize - 16.0);
                      _position = Offset(targetX, _position.dy);
                    });
                  },
                  onTap: _onTapBubble,
                  child: AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      final scale = _isDragging ? 1.15 : _pulseScale.value;
                      final glow = _glowAnimation.value;

                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: bubbleSize,
                          height: bubbleSize,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                Color(0xFF8B5CF6), // Vibrant Purple
                                Color(0xFF6D28D9), // Deep Violet
                                Color(0xFF059669), // Emerald Accent
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF8B5CF6).withValues(alpha: 0.55),
                                blurRadius: glow,
                                spreadRadius: _isDragging ? 4 : 2,
                                offset: const Offset(0, 3),
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.35),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.85),
                              width: 2.2,
                            ),
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Pulse ripple ring
                              Container(
                                width: bubbleSize * 0.75,
                                height: bubbleSize * 0.75,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withValues(alpha: 0.15),
                                ),
                              ),
                              // Music radar icon
                              const Icon(
                                LucideIcons.disc,
                                color: Colors.white,
                                size: 28,
                              ),
                              // Mini "1-Tap" badge
                              Positioned(
                                bottom: 4,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'RADAR',
                                    style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontSize: 7,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
