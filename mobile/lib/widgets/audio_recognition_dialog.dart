import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/clips_provider.dart';

class AudioRecognitionDialog extends StatefulWidget {
  final VoidCallback? onDismiss;

  const AudioRecognitionDialog({super.key, this.onDismiss});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AudioRecognitionDialog(),
    );
  }

  @override
  State<AudioRecognitionDialog> createState() => _AudioRecognitionDialogState();
}

enum RecognitionState { listening, analyzing, matchFound, noMatch }

class _AudioRecognitionDialogState extends State<AudioRecognitionDialog>
    with SingleTickerProviderStateMixin {
  RecognitionState _state = RecognitionState.listening;
  late AnimationController _pulseController;
  Timer? _listeningTimer;

  // Mock recognized song details (or populated from backend)
  String _songTitle = 'Tikur Sew';
  String _artistName = 'Teddy Afro';
  String _albumArt =
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
  String _selectedPlaylist = 'Clipper Tracks (Default)';
  bool _isSavingToSpotify = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    _startRecognitionFlow();
  }

  void _startRecognitionFlow() {
    setState(() => _state = RecognitionState.listening);

    // Simulate 4s listening window, then 1s analyze, then display match result
    _listeningTimer = Timer(const Duration(milliseconds: 3800), () {
      if (!mounted) return;
      setState(() => _state = RecognitionState.analyzing);

      Timer(const Duration(milliseconds: 1200), () {
        if (!mounted) return;
        setState(() {
          _state = RecognitionState.matchFound;
        });
      });
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _listeningTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleSaveToSpotify() async {
    setState(() => _isSavingToSpotify = true);
    final provider = Provider.of<ClipsProvider>(context, listen: false);

    final success = await provider.createClip(
      'https://open.spotify.com/track/teddy-afro-tikur-sew',
      selectedText: 'Identified via Clipper Audio Fingerprinting | Playlist: $_selectedPlaylist',
    );

    if (mounted) {
      setState(() => _isSavingToSpotify = false);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(LucideIcons.music, color: Colors.white, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  success
                      ? '🎵 "$_songTitle" added to Spotify playlist!'
                      : 'Saved to Clipper Vault!',
                  style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF7C3AED),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: Color(0xFF334155), width: 1.0),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Close Icon
          Align(
            alignment: Alignment.topRight,
            child: IconButton(
              icon: const Icon(LucideIcons.x, color: AppTheme.inactiveGrey, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          if (_state == RecognitionState.listening || _state == RecognitionState.analyzing) ...[
            const SizedBox(height: 10),
            // Pulsing Concentric Radar Rings
            SizedBox(
              width: 180,
              height: 180,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        width: 120 + (_pulseController.value * 60),
                        height: 120 + (_pulseController.value * 60),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF7C3AED).withOpacity(1.0 - _pulseController.value),
                            width: 2.0,
                          ),
                        ),
                      );
                    },
                  ),
                  AnimatedBuilder(
                    animation: _pulseController,
                    builder: (context, child) {
                      return Container(
                        width: 90 + (_pulseController.value * 40),
                        height: 90 + (_pulseController.value * 40),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFA855F7).withOpacity(1.0 - _pulseController.value),
                            width: 2.5,
                          ),
                        ),
                      );
                    },
                  ),
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF7C3AED).withOpacity(0.5),
                          blurRadius: 20,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      _state == RecognitionState.analyzing
                          ? LucideIcons.sparkles
                          : LucideIcons.mic,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _state == RecognitionState.analyzing
                  ? 'Analyzing Audio Fingerprint…'
                  : 'Listening for Music Nearby…',
              style: GoogleFonts.outfit(
                fontSize: 19,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _state == RecognitionState.analyzing
                  ? 'Matching with Spotify & ACRCloud database'
                  : 'Keep your phone close to the speaker or video sound',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 28),
          ] else if (_state == RecognitionState.matchFound) ...[
            // ─── Match Result Card ───
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF334155)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Album Art
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      width: 72,
                      height: 72,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                        ),
                      ),
                      child: Image.network(
                        _albumArt,
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => const Icon(
                          LucideIcons.music,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1DB954).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFF1DB954).withOpacity(0.4)),
                              ),
                              child: Text(
                                'SPOTIFY MATCH',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF1DB954),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _songTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _artistName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFFA78BFA),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Playlist Selection Chip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.folder, size: 16, color: Color(0xFFA78BFA)),
                  const SizedBox(width: 10),
                  Text(
                    'Target Playlist:',
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _selectedPlaylist,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Action: Save & Sync to Spotify
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                onPressed: _isSavingToSpotify ? null : _handleSaveToSpotify,
                child: _isSavingToSpotify
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.check, size: 18, color: Colors.white),
                          const SizedBox(width: 8),
                          Text(
                            'Add to Spotify Playlist',
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 10),

            // Secondary Action: Listen Again
            TextButton(
              onPressed: _startRecognitionFlow,
              child: Text(
                'Identify Another Song 🔄',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
