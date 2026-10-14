import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme.dart';
import '../services/api_service.dart';
import '../services/sharing_service.dart';

class AudioRecognitionDialog extends StatefulWidget {
  final VoidCallback? onDismiss;
  final String? shareUrl;
  final String? titleHint;
  final bool isDirectOverlay;

  const AudioRecognitionDialog({
    super.key,
    this.onDismiss,
    this.shareUrl,
    this.titleHint,
    this.isDirectOverlay = false,
  });

  /// Presents the full-screen translucent Music Radar overlay directly over
  /// the source app (matching target design with glowing animated waveform visualizer).
  static Future<void> show(
    BuildContext context, {
    String? shareUrl,
    String? titleHint,
    bool isDirectOverlay = false,
  }) {
    return showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'AudioRecognition',
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 220),
      pageBuilder: (ctx, anim1, anim2) => AudioRecognitionDialog(
        shareUrl: shareUrl,
        titleHint: titleHint,
        isDirectOverlay: isDirectOverlay,
      ),
      transitionBuilder: (ctx, anim1, anim2, child) {
        return FadeTransition(opacity: anim1, child: child);
      },
    );
  }

  @override
  State<AudioRecognitionDialog> createState() => _AudioRecognitionDialogState();
}

enum RecognitionState { listening, analyzing, matchFound, noMatch }

class _AudioRecognitionDialogState extends State<AudioRecognitionDialog> {
  RecognitionState _state = RecognitionState.listening;
  Timer? _countdownTimer;
  int _countdown = 5;

  final AudioPlayer _previewPlayer = AudioPlayer();
  bool _isPlayingPreview = false;
  bool _isSavingToSpotify = false;
  bool _addedSuccess = false;

  MusicRecognitionResult? _track;
  String _recognizeError = '';
  List<SpotifyPlaylistRef> _playlists = const [];
  String _selectedPlaylist = '';

  @override
  void initState() {
    super.initState();
    _previewPlayer.onPlayerComplete.listen((_) {
      if (mounted) setState(() => _isPlayingPreview = false);
    });
    _startRecognitionFlow();
  }

  String _buildTitleHint() {
    final hint = (widget.titleHint ?? '').trim();
    final url = (widget.shareUrl ?? '').trim();
    if (hint.isNotEmpty && url.isNotEmpty) return '$hint $url';
    if (hint.isNotEmpty) return hint;
    return url;
  }

  Future<void> _startRecognitionFlow() async {
    if (!mounted) return;
    setState(() {
      _state = RecognitionState.listening;
      _recognizeError = '';
      _track = null;
      _countdown = 5;
    });

    String? audioPayload;
    String format = 'm4a';

    try {
      final status = await Permission.microphone.request();
      if (!status.isGranted) {
        if (!mounted) return;
        setState(() {
          _state = RecognitionState.noMatch;
          _recognizeError = 'Microphone permission denied. Cannot capture audio.';
        });
        return;
      }

      final started = await SharingService.startMusicCapture();
      if (!started) {
        if (!mounted) return;
        setState(() {
          _state = RecognitionState.noMatch;
          _recognizeError = 'Could not access microphone to capture audio.';
        });
        return;
      }

      _countdownTimer?.cancel();
      _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (!mounted) {
          t.cancel();
          return;
        }
        setState(() => _countdown = (_countdown - 1).clamp(0, 5));
      });
      await Future.delayed(const Duration(seconds: 5));
      _countdownTimer?.cancel();
      final dataUrl = await SharingService.stopMusicCapture();
      if (dataUrl != null && dataUrl.isNotEmpty) {
        audioPayload = dataUrl;
      }
    } catch (e) {
      try {
        await SharingService.stopMusicCapture();
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _state = RecognitionState.noMatch;
        _recognizeError = 'Audio capture failed: $e';
      });
      return;
    }

    if (audioPayload == null || audioPayload.isEmpty) {
      if (!mounted) return;
      setState(() {
        _state = RecognitionState.noMatch;
        _recognizeError = 'No audio captured. Please try again.';
      });
      return;
    }

    if (!mounted) return;
    setState(() => _state = RecognitionState.analyzing);

    final res = await ApiService.recognizeAudio(
      audioBase64: audioPayload,
      format: format,
      titleHint: _buildTitleHint(),
    );

    if (!mounted) return;
    if (res.success && !res.isSimulated) {
      _playlists = await ApiService.fetchSpotifyPlaylists();
      _saveTrackToHistory(res);
      setState(() {
        _track = res;
        _state = RecognitionState.matchFound;
        if (_playlists.isNotEmpty) {
          _selectedPlaylist = _playlists.first.id;
        }
      });
    } else {
      setState(() {
        _state = RecognitionState.noMatch;
        _recognizeError = res.error.isNotEmpty
            ? res.error
            : 'No song recognized. Please try again closer to the speaker.';
      });
    }
  }

  Future<void> _saveTrackToHistory(MusicRecognitionResult track) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getStringList('recognized_music_history') ?? [];
      final item = jsonEncode({
        'title': track.title,
        'artist': track.artist,
        'artworkUrl': track.artworkUrl,
        'previewUrl': track.previewUrl,
        'spotifyUrl': track.spotifyUrl,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
      raw.removeWhere((e) {
        try {
          final m = jsonDecode(e);
          return m['title'] == track.title && m['artist'] == track.artist;
        } catch (_) {
          return false;
        }
      });
      raw.insert(0, item);
      if (raw.length > 25) raw.removeLast();
      await prefs.setStringList('recognized_music_history', raw);
    } catch (_) {}
  }

  Future<void> _togglePreview() async {
    final url = _track?.previewUrl ?? '';
    if (url.isEmpty) return;
    try {
      if (_isPlayingPreview) {
        await _previewPlayer.stop();
        if (mounted) setState(() => _isPlayingPreview = false);
      } else {
        await _previewPlayer.play(UrlSource(url));
        if (mounted) setState(() => _isPlayingPreview = true);
      }
    } catch (_) {}
  }

  Future<void> _handleSaveToSpotify() async {
    final track = _track;
    if (track == null) return;
    setState(() => _isSavingToSpotify = true);
    final ok = await ApiService.addTrackToSpotify(
      playlistId: _selectedPlaylist,
      trackId: track.spotifyId,
      trackUri: track.spotifyUri,
      query: '${track.title} ${track.artist}'.trim(),
    );
    if (!mounted) return;
    setState(() {
      _isSavingToSpotify = false;
      _addedSuccess = ok;
    });
    if (ok) {
      await Future.delayed(const Duration(milliseconds: 1000));
      if (!mounted) return;
      _handleDismiss();
    }
  }

  void _handleDismiss() {
    _countdownTimer?.cancel();
    _previewPlayer.stop();
    try {
      SharingService.stopMusicCapture();
    } catch (_) {}

    widget.onDismiss?.call();

    if (widget.isDirectOverlay) {
      SharingService.closeShareOverlay();
    } else {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      } else {
        SharingService.closeShareOverlay();
      }
    }
  }

  void _showHistoryModal() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList('recognized_music_history') ?? [];
    final List<Map<String, dynamic>> items = [];
    for (final str in raw) {
      try {
        final m = jsonDecode(str) as Map<String, dynamic>;
        items.add(m);
      } catch (_) {}
    }

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: BoxDecoration(
          color: const Color(0xFF131722).withValues(alpha: 0.96),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Colors.white.withValues(alpha: 0.12), width: 1.2),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.history, color: Color(0xFF818CF8), size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Recognized Songs History',
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, color: Colors.white70, size: 20),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Center(
                  child: Text(
                    'No songs identified yet.\nTap Listen to identify music anytime!',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 13, color: Colors.white54),
                  ),
                ),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 320),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: items.length,
                  separatorBuilder: (_, __) => Divider(color: Colors.white.withValues(alpha: 0.08), height: 14),
                  itemBuilder: (context, idx) {
                    final song = items[idx];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 44,
                          height: 44,
                          color: const Color(0xFF1E2433),
                          child: (song['artworkUrl'] != null && song['artworkUrl'].toString().isNotEmpty)
                              ? Image.network(
                                  song['artworkUrl'],
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(LucideIcons.music, color: Colors.white54, size: 20),
                                )
                              : const Icon(LucideIcons.music, color: Colors.white54, size: 20),
                        ),
                      ),
                      title: Text(
                        song['title'] ?? 'Unknown Track',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                      subtitle: Text(
                        song['artist'] ?? 'Unknown Artist',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF818CF8)),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _previewPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background Scrim: Translucent gradient allowing the video/app underneath to be seen
          Positioned.fill(
            child: GestureDetector(
              onTap: _handleDismiss,
              behavior: HitTestBehavior.opaque,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.85),
                      Colors.black.withValues(alpha: 0.55),
                      Colors.black.withValues(alpha: 0.80),
                    ],
                    stops: const [0.0, 0.45, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // Main Interactive Overlay
          SafeArea(
            child: Column(
              children: [
                // Top Bar: Dismiss (X) on left, History on right
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Circular translucent X button
                      GestureDetector(
                        onTap: _handleDismiss,
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.50),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                              width: 1.0,
                            ),
                          ),
                          child: const Icon(LucideIcons.x, color: Colors.white, size: 22),
                        ),
                      ),
                      // Circular translucent History button
                      GestureDetector(
                        onTap: _showHistoryModal,
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.50),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                              width: 1.0,
                            ),
                          ),
                          child: const Icon(LucideIcons.history, color: Colors.white, size: 22),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 2),

                // Center Content: Listening Waveform OR Match Card OR No Match Card
                if (_state == RecognitionState.listening || _state == RecognitionState.analyzing) ...[
                  // Animated 7-Bar Equalizer Waveform with soft glowing aura (Image 1 target design)
                  _AnimatedWaveform(isAnalyzing: _state == RecognitionState.analyzing),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 28),
                    child: Text(
                      'Identifying music from your device',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 21,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _state == RecognitionState.analyzing
                        ? 'Matching audio fingerprint…'
                        : 'Listening… ${_countdown}s',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.70),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Keep your phone close to the speaker or video sound',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.40),
                    ),
                  ),
                ] else if (_state == RecognitionState.matchFound && _track != null) ...[
                  // Glassmorphic Result Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 24),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF131722).withValues(alpha: 0.94),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.14),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.45),
                          blurRadius: 36,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: SizedBox(
                                width: 68,
                                height: 68,
                                child: _track!.artworkUrl.isNotEmpty
                                    ? Image.network(
                                        _track!.artworkUrl,
                                        fit: BoxFit.cover,
                                        errorBuilder: (ctx, err, stack) => Container(
                                          color: const Color(0xFF1E2433),
                                          child: const Icon(LucideIcons.music, color: Color(0xFF818CF8), size: 28),
                                        ),
                                      )
                                    : Container(
                                        color: const Color(0xFF1E2433),
                                        child: const Icon(LucideIcons.music, color: Color(0xFF818CF8), size: 28),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF166534).withValues(alpha: 0.4),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.6)),
                                    ),
                                    child: Text(
                                      _track!.isSimulated ? 'MATCHED VIA LINK' : 'SPOTIFY MATCH',
                                      style: GoogleFonts.inter(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF86EFAC),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    _track!.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.outfit(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  Text(
                                    _track!.artist,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: const Color(0xFF818CF8),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (_track!.previewUrl.isNotEmpty)
                              IconButton(
                                onPressed: _togglePreview,
                                icon: Icon(
                                  _isPlayingPreview ? LucideIcons.pause : LucideIcons.play,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        if (_playlists.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _playlists.any((p) => p.id == _selectedPlaylist)
                                    ? _selectedPlaylist
                                    : _playlists.first.id,
                                isExpanded: true,
                                dropdownColor: const Color(0xFF1E2433),
                                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                                icon: const Icon(LucideIcons.chevronDown, size: 16, color: Colors.white70),
                                items: _playlists
                                    .map((p) => DropdownMenuItem<String>(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis)))
                                    .toList(),
                                onChanged: (v) {
                                  if (v != null) setState(() => _selectedPlaylist = v);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _addedSuccess ? const Color(0xFF166534) : const Color(0xFF6366F1),
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
                                        Icon(_addedSuccess ? LucideIcons.check : LucideIcons.plus, size: 18, color: Colors.white),
                                        const SizedBox(width: 8),
                                        Text(
                                          _addedSuccess ? 'Added to Playlist ✓' : 'Add to Spotify Playlist',
                                          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: TextButton(
                                onPressed: _startRecognitionFlow,
                                child: Text(
                                  'Identify Another 🔄',
                                  style: GoogleFonts.inter(fontSize: 13, color: Colors.white70, fontWeight: FontWeight.w500),
                                ),
                              ),
                            ),
                            Expanded(
                              child: TextButton(
                                onPressed: _handleDismiss,
                                child: Text(
                                  'Done',
                                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF818CF8), fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // No Match / Error Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 24),
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: const Color(0xFF131722).withValues(alpha: 0.94),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.12),
                        width: 1.2,
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.circleAlert, color: Color(0xFFF87171), size: 28),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Could Not Identify Song',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _recognizeError.isNotEmpty
                              ? _recognizeError
                              : 'No match found. Please make sure the audio is playing and your phone microphone is unblocked.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(fontSize: 12.5, color: Colors.white70),
                        ),
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          height: 46,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6366F1),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                            onPressed: _startRecognitionFlow,
                            child: Text(
                              'Try Again',
                              style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _handleDismiss,
                          child: Text(
                            'Dismiss',
                            style: GoogleFonts.inter(fontSize: 13, color: Colors.white54),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const Spacer(flex: 3),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Dynamic 7-bar audio waveform visualizer with glowing radial aura
/// replicating Image 1 design.
class _AnimatedWaveform extends StatefulWidget {
  final bool isAnalyzing;
  const _AnimatedWaveform({this.isAnalyzing = false});

  @override
  State<_AnimatedWaveform> createState() => _AnimatedWaveformState();
}

class _AnimatedWaveformState extends State<_AnimatedWaveform>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  // Symmetrical baseline heights for the 7 bars:
  // [18, 34, 58, 84, 58, 34, 18]
  static const List<double> _baseHeights = [18.0, 34.0, 58.0, 84.0, 58.0, 34.0, 18.0];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final t = _controller.value * 2 * pi;
        return SizedBox(
          width: 240,
          height: 180,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Radial luminous aura matching Image 1
              Container(
                width: 170,
                height: 170,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF6366F1).withValues(alpha: 0.55),
                      const Color(0xFF3B82F6).withValues(alpha: 0.35),
                      const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.40, 0.70, 1.0],
                  ),
                ),
              ),

              // 7 animated vertical equalizer bars
              Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: List.generate(7, (index) {
                  final baseH = _baseHeights[index];
                  // Phase offset creates an organic sound wave motion
                  final phase = index * 0.9;
                  final wave = (sin(t + phase) + 1.0) / 2.0; // 0.0 to 1.0
                  final height = baseH * (0.35 + 0.75 * wave);

                  return Container(
                    width: 7.0,
                    height: height,
                    margin: const EdgeInsets.symmetric(horizontal: 4.5),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(6.0),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.white.withValues(alpha: 0.45),
                          blurRadius: 6,
                          spreadRadius: 0.5,
                        ),
                      ],
                    ),
                  );
                }),
              ),
            ],
          ),
        );
      },
    );
  }
}
