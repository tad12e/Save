import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/clips_provider.dart';
import '../services/api_service.dart';
import '../services/sharing_service.dart';
import 'audio_recognition_dialog.dart';

class SaveClipBottomSheet extends StatefulWidget {
  final String? initialUrl;
  final String? initialNote;
  final String? platform;
  final bool isExternalShare;

  const SaveClipBottomSheet({
    super.key,
    this.initialUrl,
    this.initialNote,
    this.platform,
    this.isExternalShare = false,
  });

  static Future<void> show(
    BuildContext context, {
    String? initialUrl,
    String? initialNote,
    String? platform,
    bool isExternalShare = false,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.60),
      builder: (ctx) => SaveClipBottomSheet(
        initialUrl: initialUrl,
        initialNote: initialNote,
        platform: platform,
        isExternalShare: isExternalShare,
      ),
    );
  }

  @override
  State<SaveClipBottomSheet> createState() => _SaveClipBottomSheetState();
}

enum SaveState { idle, saving, saved, duplicate, error, deleted }

class _SaveClipBottomSheetState extends State<SaveClipBottomSheet>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _noteController;
  late final TextEditingController _tagController;
  late final TextEditingController _tableController;
  SaveState _saveState = SaveState.idle;
  String _selectedDestination = '';
  String? _statusSubtitle;
  String? _saveError;
  String? _savedDestinationName;
  bool _showNotesField = false;
  bool _showTagsField = false;
  bool _showDestPicker = false;
  bool _showDeadlinePicker = false;
  bool _isMusicSyncMode = false;
  bool _rememberDefault = true;
  DateTime? _selectedDeadline;
  final List<String> _tags = [];
  Timer? _autoDismissTimer;
  Timer? _countdownTimer;
  late AnimationController _badgeAnimController;

  @override
  void initState() {
    super.initState();
    _isMusicSyncMode = (widget.platform?.toLowerCase() == 'spotify') ||
        (widget.initialUrl?.toLowerCase().contains('/sound/') ?? false) ||
        (widget.initialUrl?.toLowerCase().contains('/audio/') ?? false);

    _noteController = TextEditingController(text: widget.initialNote ?? '');
    _tagController = TextEditingController();
    _tableController = TextEditingController();
    _statusSubtitle = 'Choose a destination and tap Save';

    _badgeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    // Manual-save like the browser extension: load destinations, wait for tap.
    WidgetsBinding.instance.addPostFrameCallback((_) => _initDestinations());
  }

  Future<void> _initDestinations() async {
    final provider = Provider.of<ClipsProvider>(context, listen: false);
    if (provider.destinations.isEmpty) {
      await provider.loadDestinations();
    }
    if (!mounted) return;
    setState(() {
      _selectedDestination = provider.selectedDestinationId.isNotEmpty
          ? provider.selectedDestinationId
          : 'google_sheets';
      _statusSubtitle = 'Choose a destination and tap Save';
    });
  }

  String _hostOf(String raw) {
    try {
      final uri = Uri.parse(raw.trim());
      return uri.host.isNotEmpty ? uri.host : raw.trim();
    } catch (_) {
      return raw.trim();
    }
  }

  Future<void> _handleSaveClip({String? destinationId}) async {
    final url = (widget.initialUrl ?? '').trim();
    if (url.isEmpty) {
      setState(() {
        _saveState = SaveState.error;
        _saveError = 'No valid link detected';
        _statusSubtitle = 'No valid link detected';
      });
      return;
    }
    final destId = destinationId ?? _selectedDestination;
    if (destId.isEmpty) {
      setState(() {
        _saveState = SaveState.error;
        _saveError = 'Pick a destination first';
        _statusSubtitle = 'Pick a destination first';
      });
      return;
    }

    setState(() {
      _saveState = SaveState.saving;
      _saveError = null;
      _statusSubtitle = 'Saving to Clipper…';
    });

    final provider = Provider.of<ClipsProvider>(context, listen: false);
    final deadlineStr = _selectedDeadline == null
        ? null
        : '${_selectedDeadline!.year}-${_selectedDeadline!.month.toString().padLeft(2, '0')}-${_selectedDeadline!.day.toString().padLeft(2, '0')}';

    final res = await provider.createClipDetailed(
      url,
      selectedText: _noteController.text.trim(),
      destinationId: destId,
      note: _noteController.text.trim().isEmpty ? null : _noteController.text.trim(),
      tags: _tags,
      deadline: deadlineStr,
      tableName: _tableController.text.trim().isEmpty ? null : _tableController.text.trim(),
    );

    if (!mounted) return;
    if (_rememberDefault) {
      provider.setDestination(destId);
      await ApiService.setDefaultDestination(destId);
    } else {
      provider.setDestination(destId);
    }
    setState(() {
      if (res.ok && res.duplicate) {
        _saveState = SaveState.duplicate;
        _statusSubtitle = 'Already saved previously';
      } else if (res.ok) {
        _saveState = SaveState.saved;
        _savedDestinationName = res.destinationName;
        _statusSubtitle = _getDestinationLabel(destId);
      } else {
        _saveState = SaveState.error;
        _saveError = res.error ?? 'Failed to save clip.';
        _statusSubtitle = 'Failed to save — try again';
      }
    });

    if ((res.ok) && widget.isExternalShare) {
      _autoDismissTimer?.cancel();
      _autoDismissTimer = Timer(const Duration(seconds: 4), () {
        if (mounted && !_showNotesField && !_showTagsField && !_showDestPicker && !_showDeadlinePicker) {
          _handleDismiss();
        }
      });
    }
  }

  Future<void> _handleQuickSaveToProvider(String providerKey) async {
    final provider = Provider.of<ClipsProvider>(context, listen: false);
    if (provider.destinations.isEmpty) {
      await provider.loadDestinations();
    }
    SaveDestination? match;
    for (final d in provider.destinations) {
      if (d.provider == providerKey || d.id == providerKey) {
        match = d;
        break;
      }
    }
    if (match == null) {
      if (!mounted) return;
      setState(() {
        _saveState = SaveState.error;
        _saveError = 'No $providerKey destination connected';
        _statusSubtitle = 'No $providerKey destination connected';
      });
      return;
    }
    setState(() => _selectedDestination = match!.id);
    await _handleSaveClip(destinationId: match.id);
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _countdownTimer?.cancel();
    _badgeAnimController.dispose();
    _noteController.dispose();
    _tagController.dispose();
    _tableController.dispose();
    super.dispose();
  }

  String _getDestinationLabel(String dest) {
    final provider = Provider.of<ClipsProvider>(context, listen: false);
    for (final d in provider.destinations) {
      if (d.id == dest) {
        if (d.provider == 'notion' || dest == 'notion') return 'Synced to ${d.name}';
        if (d.provider == 'vault' || d.provider == 'custom_db' || dest == 'vault') {
          return 'Saved to ${d.name} • Moved to Inbox';
        }
        if (d.provider == 'spotify' || dest == 'spotify') return 'Synced to Spotify Playlist';
        return 'Synced to ${d.name} • AI Tagging';
      }
    }
    switch (dest) {
      case 'notion':
        return 'Synced to Notion Workspace';
      case 'vault':
        return 'Saved to Vault • Moved to Inbox';
      case 'spotify':
        return 'Synced to Spotify Playlist';
      case 'google_sheets':
        return 'Synced to Google Sheets • AI Tagging';
      default:
        return 'Saved to Vault';
    }
  }

  void _handleDismiss() {
    _autoDismissTimer?.cancel();
    // Close the Flutter route first (if any), then finish the native
    // translucent share activity so Instagram / source app is revealed
    // underneath — user never leaves the app they shared from.
    if (Navigator.of(context, rootNavigator: true).canPop()) {
      Navigator.of(context, rootNavigator: true).pop();
    }
    if (widget.isExternalShare) {
      // Finish ShareHandlerActivity -> instant return to source app.
      SharingService.closeShareOverlay();
      // Fallback: also pop the Flutter engine for old MainActivity path.
      SystemNavigator.pop();
    }
  }

  void _handleDelete() {
    _autoDismissTimer?.cancel();
    setState(() {
      _saveState = SaveState.deleted;
      _statusSubtitle = 'Discarded from Clipper';
    });
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) _handleDismiss();
    });
  }

  void _handleOpenInApp() {
    _autoDismissTimer?.cancel();
    if (Navigator.of(context, rootNavigator: true).canPop()) {
      Navigator.of(context, rootNavigator: true).pop();
    }
    // Keeps Clipper in foreground so user can read/browse their saves
  }

  void _handleMusicRadar() {
    _autoDismissTimer?.cancel();
    AudioRecognitionDialog.show(
      context,
      shareUrl: widget.initialUrl,
      titleHint: _noteController.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final isMusicHint = (widget.platform?.toLowerCase() == 'spotify') ||
        (widget.initialUrl?.toLowerCase().contains('/sound/') ?? false) ||
        (widget.initialUrl?.toLowerCase().contains('/audio/') ?? false);

    return GestureDetector(
      onTap: _handleDismiss,
      behavior: HitTestBehavior.opaque,
      child: Container(
        color: Colors.transparent,
        alignment: Alignment.bottomCenter,
        child: GestureDetector(
          onTap: () {
            // Cancel auto-dismiss when user taps inside the modal to interact
            _autoDismissTimer?.cancel();
          },
          child: Container(
            width: double.infinity,
            constraints: BoxConstraints(
              maxHeight: mediaQuery.size.height * 0.76,
            ),
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 18,
              bottom: mediaQuery.viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Color(0xFF11131E), // Deep luxury dark slate from screenshot
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              border: Border(
                top: BorderSide(color: Color(0xFF272A3A), width: 1.2),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black54,
                  blurRadius: 30,
                  offset: Offset(0, -6),
                ),
              ],
            ),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top bar: music radar + configure + close (extension parity)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      _buildTopIcon(
                        icon: LucideIcons.headphones,
                        tooltip: 'Listen to Music',
                        isActive: false,
                        onTap: _handleMusicRadar,
                      ),
                      const SizedBox(width: 8),
                      _buildTopIcon(
                        icon: LucideIcons.settings2,
                        tooltip: 'Configure destination & tags',
                        isActive: _showDestPicker || _showTagsField || _showNotesField || _showDeadlinePicker,
                        onTap: () {
                          setState(() {
                            final open = !(_showDestPicker || _showTagsField || _showNotesField || _showDeadlinePicker);
                            _showDestPicker = open;
                            _showTagsField = false;
                            _showNotesField = false;
                            _showDeadlinePicker = false;
                          });
                        },
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _handleDismiss,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1C1F2E),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF2A2E44)),
                          ),
                          child: const Icon(
                            LucideIcons.x,
                            size: 16,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // ─── 1-Tap Mode Switcher: [Music Sync / Full Clip] ───
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(3.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF191D2C),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF282D42)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _isMusicSyncMode = false);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 7.5),
                              decoration: BoxDecoration(
                                color: !_isMusicSyncMode ? const Color(0xFF2D6A4F) : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: !_isMusicSyncMode
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF2D6A4F).withValues(alpha: 0.4),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                              ),
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    LucideIcons.bookmarkCheck,
                                    size: 13,
                                    color: !_isMusicSyncMode ? Colors.white : const Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Full Clip Save',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: !_isMusicSyncMode ? Colors.white : const Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _isMusicSyncMode = true);
                              _handleMusicRadar();
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 7.5),
                              decoration: BoxDecoration(
                                color: _isMusicSyncMode ? const Color(0xFF7C3AED) : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: _isMusicSyncMode
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : null,
                              ),
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    LucideIcons.music2,
                                    size: 13,
                                    color: _isMusicSyncMode ? Colors.white : const Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Music Sync',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: _isMusicSyncMode ? Colors.white : const Color(0xFF94A3B8),
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

                  // ─── Center Hero: Glowing Clipper Badge ───
                  AnimatedBuilder(
                    animation: _badgeAnimController,
                    builder: (context, child) {
                      final scale = _saveState == SaveState.saving
                          ? 0.96 + (_badgeAnimController.value * 0.08)
                          : 1.0;
                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 68,
                          height: 68,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF7C3AED), Color(0xFFA855F7)],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF7C3AED).withValues(alpha: 0.45),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Center(
                            child: _saveState == SaveState.saving
                                ? const SizedBox(
                                    width: 28,
                                    height: 28,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.8,
                                    ),
                                  )
                                : const Icon(
                                    LucideIcons.bookmark,
                                    size: 32,
                                    color: Colors.white,
                                  ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),

                  // ─── Title: Saved to Clipper ───
                  Text(
                    _saveState == SaveState.saving
                        ? 'Saving…'
                        : _saveState == SaveState.deleted
                            ? 'Removed'
                            : _saveState == SaveState.duplicate
                                ? 'Already Saved'
                                : _saveState == SaveState.error
                                    ? 'Save Failed'
                                    : _saveState == SaveState.idle
                                        ? 'Save to Clipper'
                                        : 'Saved to Clipper',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 6),

                  // ─── Subtitle: Destination & Sync status ───
                  Text(
                    _statusSubtitle ?? 'Choose a destination and tap Save',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF94A3B8),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),

                  // ─── Link preview card (extension parity) ───
                  _buildLinkPreviewCard(),
                  const SizedBox(height: 12),

                  // ─── Destination selector (extension parity) ───
                  _buildDestinationDropdown(),
                  const SizedBox(height: 16),

                  // ─── Save-state primary area (extension parity) ───
                  ..._buildSaveStateArea(isMusicHint),
                  const SizedBox(height: 12),

                  // ─── Inline Interactive Drawers (Notes, Tags, Destination) ───
                  if (_showNotesField) ...[
                    _buildInlineNotesField(),
                    const SizedBox(height: 16),
                  ],
                  if (_showTagsField) ...[
                    _buildInlineTagsField(),
                    const SizedBox(height: 16),
                  ],
                  if (_showDestPicker) ...[
                    _buildInlineDestPicker(),
                    const SizedBox(height: 16),
                  ],
                  if (_showDeadlinePicker) ...[
                    _buildInlineDeadlinePicker(),
                    const SizedBox(height: 16),
                  ],
                  if (_showDestPicker || _showTagsField || _showNotesField || _showDeadlinePicker) ...[
                    _buildRememberDefaultRow(),
                    const SizedBox(height: 16),
                  ],

                  // "Tap anywhere to dismiss" label
                  Text(
                    'Tap anywhere to dismiss',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ─── Bottom Dock (5 Icon Actions matching screenshot) ───
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // 1. Delete / Trash
                      _buildDockIcon(
                        icon: LucideIcons.trash2,
                        isActive: _saveState == SaveState.deleted,
                        onTap: _handleDelete,
                        tooltip: 'Discard',
                      ),
                      // 2. Tag
                      _buildDockIcon(
                        icon: LucideIcons.tag,
                        isActive: _showTagsField || _tags.isNotEmpty,
                        onTap: () {
                          setState(() {
                            _showTagsField = !_showTagsField;
                            _showNotesField = false;
                            _showDestPicker = false;
                            _showDeadlinePicker = false;
                          });
                        },
                        tooltip: 'Add Tags',
                      ),
                      // 3. Note / Context
                      _buildDockIcon(
                        icon: LucideIcons.messageSquare,
                        isActive: _showNotesField || _noteController.text.isNotEmpty,
                        onTap: () {
                          setState(() {
                            _showNotesField = !_showNotesField;
                            _showTagsField = false;
                            _showDestPicker = false;
                            _showDeadlinePicker = false;
                          });
                        },
                        tooltip: 'Add Note',
                      ),
                      // 4. Deadline / Clock
                      _buildDockIcon(
                        icon: LucideIcons.clock,
                        isActive: _showDeadlinePicker || _selectedDeadline != null,
                        onTap: () {
                          setState(() {
                            _showDeadlinePicker = !_showDeadlinePicker;
                            _showNotesField = false;
                            _showTagsField = false;
                            _showDestPicker = false;
                          });
                        },
                        tooltip: 'Set Reminder',
                      ),
                      // 5. Destination Drawer
                      _buildDockIcon(
                        icon: LucideIcons.archive,
                        isActive: _showDestPicker,
                        onTap: () {
                          setState(() {
                            _showDestPicker = !_showDestPicker;
                            _showNotesField = false;
                            _showTagsField = false;
                            _showDeadlinePicker = false;
                          });
                        },
                        tooltip: 'Change Destination',
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopIcon({
    required IconData icon,
    required String tooltip,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: tooltip,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isActive
                ? const Color(0xFF7C3AED).withValues(alpha: 0.25)
                : const Color(0xFF1C1F2E),
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? const Color(0xFF7C3AED) : const Color(0xFF2A2E44),
            ),
          ),
          child: Icon(
            icon,
            size: 15,
            color: isActive ? const Color(0xFFA78BFA) : const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }

  Widget _buildLinkPreviewCard() {
    final url = (widget.initialUrl ?? '').trim();
    final host = url.isEmpty ? '' : _hostOf(url);
    final highlight = _noteController.text.trim();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF181B28),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D3249)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(LucideIcons.link, size: 15, color: Color(0xFFA78BFA)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      host.isEmpty ? 'No link detected' : host,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      url.isEmpty ? 'Share a link to preview it here' : url,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (highlight.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
                border: const Border(
                  left: BorderSide(color: Color(0xFF7C3AED), width: 2.5),
                ),
              ),
              child: Text(
                '"$highlight"',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: const Color(0xFFCBD5E1),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDestinationDropdown() {
    return Consumer<ClipsProvider>(
      builder: (context, clips, _) {
        if (clips.destinations.isEmpty) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF181B28),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF2D3249)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.hardDrive, size: 16, color: Color(0xFF8B5CF6)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Save to Vault (No external destination connected)',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          );
        }

        final items = clips.destinations;
        String value = _selectedDestination;
        if (items.every((d) => d.id != value)) {
          value = items.first.id;
        }
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFF181B28),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF2D3249)),
          ),
          child: Row(
            children: [
              Text(
                'Saving to:',
                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: value,
                    isExpanded: true,
                    dropdownColor: const Color(0xFF181B28),
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                    icon: const Icon(LucideIcons.chevronDown, size: 16, color: Color(0xFF94A3B8)),
                    items: items.map((d) {
                      final label = d.name + (d.provider == 'google_sheets' ? ' 📊' : d.provider == 'notion' ? ' 📝' : '');
                      return DropdownMenuItem<String>(
                        value: d.id,
                        child: Text(label, overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      setState(() {
                        _selectedDestination = v;
                        _statusSubtitle = _getDestinationLabel(v);
                        if (_saveState == SaveState.error) {
                          _saveState = SaveState.idle;
                          _saveError = null;
                        }
                      });
                      Provider.of<ClipsProvider>(context, listen: false).setDestination(v);
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<Widget> _buildSaveStateArea(bool isMusicHint) {
    switch (_saveState) {
      case SaveState.saving:
        return [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED).withValues(alpha: 0.6),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: null,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Saving to Clipper…',
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ];
      case SaveState.saved:
        return [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              color: const Color(0xFF065F46).withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.check, size: 16, color: Color(0xFF6EE7B7)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _savedDestinationName != null && _savedDestinationName!.isNotEmpty
                        ? 'Saved — ${_savedDestinationName!}'
                        : 'Saved — processing in background',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF6EE7B7)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF2E334D)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: _handleOpenInApp,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.externalLink, size: 15, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    'Open in Clipper',
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ];
      case SaveState.duplicate:
        return [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.circleAlert, size: 16, color: Color(0xFFFBBF24)),
                const SizedBox(width: 8),
                Text(
                  'Already saved previously',
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFFFBBF24)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF2E334D)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: _handleOpenInApp,
              child: Text(
                'Open in Clipper',
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ),
          ),
        ];
      case SaveState.error:
        return [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFDC2626).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.circleAlert, size: 16, color: Color(0xFFFCA5A5)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _saveError ?? 'Failed to save',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFFFCA5A5)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: () => _handleSaveClip(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.bookmark, size: 16, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    'Try saving again',
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ];
      case SaveState.idle:
      case SaveState.deleted:
        final quickDests = Provider.of<ClipsProvider>(context, listen: false)
            .destinations
            .where((d) => d.provider != 'vault')
            .toList();
        return [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                  side: const BorderSide(color: Color(0xFF8B5CF6), width: 1.0),
                ),
              ),
              onPressed: () => _handleSaveClip(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.bookmark, size: 16, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    'Save now',
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
          if (quickDests.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(
              children: quickDests.take(2).map((d) {
                final isSheets = d.provider == 'google_sheets';
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: _buildQuickProviderButton(
                      label: d.name,
                      emoji: isSheets ? '📊' : '📝',
                      color: isSheets ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      onTap: () => _handleQuickSaveToProvider(d.provider),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          if (isMusicHint) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                ),
                onPressed: _handleMusicRadar,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.headphones, size: 16, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      'Listen to Music & Identify',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 10),
          Text(
            '💡 Tip: add a note before saving to attach AI context.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
          ),
        ];
    }
  }

  Widget _buildQuickProviderButton({
    required String label,
    required String emoji,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(
              'Save to $label',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRememberDefaultRow() {
    return GestureDetector(
      onTap: () => setState(() => _rememberDefault = !_rememberDefault),
      child: Row(
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: _rememberDefault ? const Color(0xFF7C3AED) : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: _rememberDefault ? const Color(0xFF7C3AED) : const Color(0xFF475569),
              ),
            ),
            child: _rememberDefault
                ? const Icon(LucideIcons.check, size: 13, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 8),
          Text(
            'Remember as default destination',
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Widget _buildDockIcon({
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
    required String tooltip,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: tooltip,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: isActive
                ? const Color(0xFF7C3AED).withValues(alpha: 0.25)
                : const Color(0xFF181B28),
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? const Color(0xFF7C3AED) : const Color(0xFF282C40),
              width: 1.3,
            ),
          ),
          child: Icon(
            icon,
            size: 19,
            color: isActive ? const Color(0xFFA78BFA) : const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }

  Widget _buildInlineNotesField() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF181B28),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D3249)),
      ),
      child: TextField(
        controller: _noteController,
        autofocus: true,
        style: GoogleFonts.inter(color: Colors.white, fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Add a thought, highlight, or note…',
          hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
          border: InputBorder.none,
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildInlineTagsField() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF181B28),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D3249)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              ..._tags.map(
                (tag) => Chip(
                  label: Text('#$tag', style: const TextStyle(fontSize: 11, color: Colors.white)),
                  backgroundColor: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                  deleteIcon: const Icon(LucideIcons.x, size: 12, color: Colors.white70),
                  onDeleted: () => setState(() => _tags.remove(tag)),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          TextField(
            controller: _tagController,
            style: GoogleFonts.inter(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Type tag and press enter (e.g. ai, jobs)…',
              hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
              border: InputBorder.none,
              isDense: true,
            ),
            onSubmitted: (val) {
              final tag = val.trim().replaceAll('#', '');
              if (tag.isNotEmpty && !_tags.contains(tag)) {
                setState(() {
                  _tags.add(tag);
                  _tagController.clear();
                });
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildInlineDestPicker() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF181B28),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D3249)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Consumer<ClipsProvider>(
            builder: (context, clips, _) {
              if (clips.destinations.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(
                    'No connected destinations. Clips will save directly to your Vault.',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                  ),
                );
              }
              final items = clips.destinations;
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: items.map((d) {
                  final color = d.provider == 'google_sheets' || d.id == 'google_sheets'
                      ? const Color(0xFF10B981)
                      : d.provider == 'notion' || d.id == 'notion'
                          ? const Color(0xFFF59E0B)
                          : const Color(0xFF8B5CF6);
                  final icon = d.provider == 'google_sheets' || d.id == 'google_sheets'
                      ? LucideIcons.table
                      : d.provider == 'notion' || d.id == 'notion'
                          ? LucideIcons.fileText
                          : LucideIcons.hardDrive;
                  return _buildDestChoice(d.id, d.name, icon, color);
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _tableController,
            style: GoogleFonts.inter(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Target sheet / tab / table (optional)…',
              hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
              border: InputBorder.none,
              isDense: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDestChoice(String id, String label, IconData icon, Color color) {
    final isSel = _selectedDestination == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedDestination = id;
          _statusSubtitle = _getDestinationLabel(id);
          _showDestPicker = false;
          if (_saveState == SaveState.error) {
            _saveState = SaveState.idle;
            _saveError = null;
          }
        });
        Provider.of<ClipsProvider>(context, listen: false).setDestination(id);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSel ? color.withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSel ? color : Colors.transparent),
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: isSel ? color : const Color(0xFF94A3B8)),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                color: isSel ? color : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineDeadlinePicker() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF181B28),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D3249)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _selectedDeadline == null
                ? 'No deadline set'
                : 'Deadline: ${_selectedDeadline!.year}-${_selectedDeadline!.month.toString().padLeft(2, '0')}-${_selectedDeadline!.day.toString().padLeft(2, '0')}',
            style: GoogleFonts.inter(color: Colors.white, fontSize: 13),
          ),
          TextButton(
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 7)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (picked != null) {
                setState(() => _selectedDeadline = picked);
              }
            },
            child: const Text('Pick Date', style: TextStyle(color: Color(0xFFA78BFA))),
          ),
        ],
      ),
    );
  }
}
