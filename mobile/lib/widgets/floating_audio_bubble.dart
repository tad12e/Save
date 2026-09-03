import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'audio_recognition_dialog.dart';

class FloatingAudioBubble extends StatefulWidget {
  const FloatingAudioBubble({super.key});

  @override
  State<FloatingAudioBubble> createState() => _FloatingAudioBubbleState();
}

class _FloatingAudioBubbleState extends State<FloatingAudioBubble> {
  Offset _position = const Offset(16, 200);

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: Draggable(
        feedback: _buildBubble(isDragging: true),
        childWhenDragging: const SizedBox.shrink(),
        onDragEnd: (details) {
          final size = MediaQuery.of(context).size;
          // Snap bubble to nearest left or right edge
          final snapX = details.offset.dx > size.width / 2 ? size.width - 68 : 16.0;
          final clampY = details.offset.dy.clamp(60.0, size.height - 120.0);
          setState(() {
            _position = Offset(snapX, clampY);
          });
        },
        child: GestureDetector(
          onTap: () => AudioRecognitionDialog.show(context),
          child: _buildBubble(isDragging: false),
        ),
      ),
    );
  }

  Widget _buildBubble({required bool isDragging}) {
    return Material(
      color: Colors.transparent,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7C3AED).withOpacity(isDragging ? 0.7 : 0.45),
              blurRadius: isDragging ? 16 : 10,
              spreadRadius: isDragging ? 3 : 1,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
        ),
        child: const Icon(
          LucideIcons.mic,
          color: Colors.white,
          size: 22,
        ),
      ),
    );
  }
}
