import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/clips_provider.dart';

class SaveClipBottomSheet extends StatefulWidget {
  final String? initialUrl;
  final String? initialNote;
  final String? platform;

  const SaveClipBottomSheet({
    super.key,
    this.initialUrl,
    this.initialNote,
    this.platform,
  });

  static Future<void> show(
    BuildContext context, {
    String? initialUrl,
    String? initialNote,
    String? platform,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SaveClipBottomSheet(
        initialUrl: initialUrl,
        initialNote: initialNote,
        platform: platform,
      ),
    );
  }

  @override
  State<SaveClipBottomSheet> createState() => _SaveClipBottomSheetState();
}

class _SaveClipBottomSheetState extends State<SaveClipBottomSheet> {
  late final TextEditingController _urlController;
  late final TextEditingController _noteController;
  bool _isSaving = false;
  late bool _isMusicMode;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: widget.initialUrl ?? '');
    _noteController = TextEditingController(text: widget.initialNote ?? '');
    
    // Auto-detect if incoming content is music-oriented or video
    final plat = widget.platform?.toLowerCase() ?? '';
    _isMusicMode = plat == 'spotify' || plat == 'music';
  }

  @override
  void dispose() {
    _urlController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  String _getPlatformLabel(String? platform) {
    switch (platform?.toLowerCase()) {
      case 'spotify':
        return '🎵 Spotify Track';
      case 'tiktok':
        return '🎬 TikTok Video';
      case 'linkedin':
        return '💼 LinkedIn Post';
      case 'youtube':
        return '▶️ YouTube Video';
      case 'instagram':
        return '📸 Instagram Reel';
      case 'twitter':
        return '𝕏 X (Twitter)';
      case 'github':
        return '🛠️ GitHub Repo';
      case 'reddit':
        return '🤖 Reddit Post';
      default:
        return '📌 Web Link';
    }
  }

  Future<void> _handleSave() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    setState(() => _isSaving = true);
    final provider = Provider.of<ClipsProvider>(context, listen: false);
    
    final success = await provider.createClip(
      url,
      selectedText: _noteController.text.trim(),
    );

    if (mounted) {
      setState(() => _isSaving = false);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(
                _isMusicMode ? LucideIcons.music : LucideIcons.check,
                color: Colors.white,
                size: 18,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _isMusicMode
                      ? (success ? 'Extracting music & syncing to Spotify…' : 'Could not sync song. Check network.')
                      : (success ? 'Clip saved & queued for AI processing!' : 'Could not save clip. Check network.'),
                  style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          backgroundColor: success ? const Color(0xFF7C3AED) : AppTheme.urgencyRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.of(context).viewInsets;
    final platformTag = widget.platform ?? (widget.initialUrl != null ? 'web' : null);

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(color: AppTheme.borderSubtle, width: 1.0),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF7C3AED).withOpacity(0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(
                      _isMusicMode ? LucideIcons.music : LucideIcons.bookmark,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Save to Clipper',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      if (platformTag != null)
                        Text(
                          _getPlatformLabel(platformTag),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFFA78BFA),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20, color: AppTheme.inactiveGrey),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ─── Mode Selector Toggle (Music Sync vs Full Clip) ───
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppTheme.surfaceMuted,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isMusicMode = true),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _isMusicMode ? const Color(0xFF7C3AED) : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: _isMusicMode
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF7C3AED).withOpacity(0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : [],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.music,
                            size: 15,
                            color: _isMusicMode ? Colors.white : AppTheme.textMuted,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Music Sync',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: _isMusicMode ? FontWeight.bold : FontWeight.w500,
                              color: _isMusicMode ? Colors.white : AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isMusicMode = false),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: !_isMusicMode ? const Color(0xFF7C3AED) : Colors.transparent,
                        borderRadius: BorderRadius.circular(9),
                        boxShadow: !_isMusicMode
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF7C3AED).withOpacity(0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : [],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.bookmark,
                            size: 15,
                            color: !_isMusicMode ? Colors.white : AppTheme.textMuted,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Full Clip',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: !_isMusicMode ? FontWeight.bold : FontWeight.w500,
                              color: !_isMusicMode ? Colors.white : AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // URL Input
          Text(
            'SHARED LINK / URL',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _urlController,
            autofocus: widget.initialUrl == null || widget.initialUrl!.isEmpty,
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'https://...',
              hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
              filled: true,
              fillColor: AppTheme.surfaceMuted,
              prefixIcon: const Icon(LucideIcons.link, size: 16, color: Color(0xFF7C3AED)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF7C3AED)),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Note Input
          Text(
            _isMusicMode ? 'TARGET PLAYLIST / NOTE' : 'NOTES OR CONTEXT (OPTIONAL)',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _noteController,
            maxLines: 2,
            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: _isMusicMode
                  ? 'Add note or specific playlist (Default: Liked Songs)...'
                  : 'Add note, tags, or context...',
              hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
              filled: true,
              fillColor: AppTheme.surfaceMuted,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF7C3AED)),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Submit button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isSaving ? null : _handleSave,
              child: _isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _isMusicMode ? LucideIcons.music : LucideIcons.check,
                          size: 18,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isMusicMode ? 'Sync Song to Spotify' : 'Save Video to Vault',
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
        ],
      ),
    );
  }
}
