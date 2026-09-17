import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/api_service.dart';
import '../services/sharing_service.dart';

class AudioRecognitionDialog extends StatefulWidget {
  final VoidCallback? onDismiss;
  final String? shareUrl;
  final String? titleHint;

  const AudioRecognitionDialog({super.key, this.onDismiss, this.shareUrl, this.titleHint});

  static Future<void> show(
    BuildContext context, {
    String? shareUrl,
    String? titleHint,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => AudioRecognitionDialog(shareUrl: shareUrl, titleHint: titleHint),
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
  Timer? _countdownTimer;
  int _countdown = 5;

  final AudioPlayer _previewPlayer = AudioPlayer();
  bool _isPlayingPreview = false;
  bool _isSavingToSpotify = false;
  bool _addedSuccess = false;

  MusicRecognitionResult? _track;
  String _recognizeError = '';
  List<SpotifyPlaylistRef> _playlists = const [SpotifyPlaylistRef(id: 'default', name: 'Clipper Tracks (Default)')];
  String _selectedPlaylist = 'default';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
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

    String audioPayload = 'SIMULATED_AUDIO_SNIPPET';
    String format = 'm4a';
    bool recorded = false;

    try {
      final status = await Permission.microphone.request();
      if (status.isGranted) {
        final started = await SharingService.startMusicCapture();
        if (started) {
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
            recorded = true;
          }
        }
      }
    } catch (_) {
      try {
        await SharingService.stopMusicCapture();
      } catch (_) {}
    }

    if (!mounted) return;
    setState(() => _state = RecognitionState.analyzing);

    final res = await ApiService.recognizeAudio(
      audioBase64: audioPayload,
      format: recorded ? format : 'webm',
      titleHint: _buildTitleHint(),
    );

    if (!mounted) return;
    if (res.success) {
      _playlists = await ApiService.fetchSpotifyPlaylists();
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
        _recognizeError = res.error.isNotEmpty ? res.error : 'No song recognized. Try again closer to the speaker.';
      });
    }
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
      await Future.delayed(const Duration(milliseconds: 1100));
      if (!mounted) return;
      Navigator.pop(context);
      widget.onDismiss?.call();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _countdownTimer?.cancel();
    _previewPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.headphones, size: 16, color: Color(0xFFA78BFA)),
                    const SizedBox(width: 8),
                    Text(
                      'Music Radar',
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, color: Color(0xFF94A3B8), size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 6),

            if (_state == RecognitionState.listening || _state == RecognitionState.analyzing) ...[
              const SizedBox(height: 10),
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
                              color: const Color(0xFF7C3AED).withValues(alpha: 1.0 - _pulseController.value),
                              width: 2.0,
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
                            color: const Color(0xFF7C3AED).withValues(alpha: 0.5),
                            blurRadius: 20,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        _state == RecognitionState.analyzing ? LucideIcons.sparkles : LucideIcons.mic,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                _state == RecognitionState.analyzing
                    ? 'Analyzing Audio Fingerprint…'
                    : 'Listening… ${_countdown}s',
                style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 6),
              Text(
                _state == RecognitionState.analyzing
                    ? 'Matching with Spotify & recognition database'
                    : 'Keep your phone close to the speaker or video sound',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
              ),
              const SizedBox(height: 24),
            ] else if (_state == RecognitionState.matchFound && _track != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: SizedBox(
                        width: 64,
                        height: 64,
                        child: _track!.artworkUrl.isNotEmpty
                            ? Image.network(
                                _track!.artworkUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, err, stack) => Container(
                                  color: const Color(0xFF7C3AED),
                                  child: const Icon(LucideIcons.music, color: Colors.white, size: 28),
                                ),
                              )
                            : Container(
                                color: const Color(0xFF7C3AED),
                                child: const Icon(LucideIcons.music, color: Colors.white, size: 28),
                              ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1DB954).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF1DB954).withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              _track!.isSimulated ? 'MATCHED VIA LINK HINT' : 'SPOTIFY MATCH',
                              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF1DB954)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _track!.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            _track!.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFA78BFA), fontWeight: FontWeight.w500),
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
                          size: 22,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _playlists.any((p) => p.id == _selectedPlaylist) ? _selectedPlaylist : _playlists.first.id,
                    isExpanded: true,
                    dropdownColor: const Color(0xFF1E293B),
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                    icon: const Icon(LucideIcons.chevronDown, size: 16, color: Color(0xFF94A3B8)),
                    items: _playlists
                        .map((p) => DropdownMenuItem<String>(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedPlaylist = v);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _addedSuccess ? const Color(0xFF065F46) : const Color(0xFF7C3AED),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  onPressed: _isSavingToSpotify ? null : _handleSaveToSpotify,
                  child: _isSavingToSpotify
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
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
              const SizedBox(height: 6),
              TextButton(
                onPressed: _startRecognitionFlow,
                child: Text(
                  'Identify Another Song 🔄',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                ),
              ),
            ] else ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFDC2626).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.4)),
                ),
                child: Text(
                  _recognizeError,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFFCA5A5)),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
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
              const SizedBox(height: 10),
            ],
          ],
        ),
      ),
    );
  }
}
