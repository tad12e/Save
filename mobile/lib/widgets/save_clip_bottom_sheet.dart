import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme.dart';
import '../providers/clips_provider.dart';
import '../screens/settings/clipper_settings_screen.dart' show ConfirmationMode;
import '../services/api_service.dart';
import '../services/sharing_service.dart';
import 'audio_recognition_dialog.dart';

class SaveClipBottomSheet extends StatefulWidget {
  final String? initialUrl;
  final String? initialNote;
  final String? platform;
  final bool isExternalShare;
  final String? confirmationMode;
  final String? defaultDestinationId;

  const SaveClipBottomSheet({
    super.key,
    this.initialUrl,
    this.initialNote,
    this.platform,
    this.isExternalShare = false,
    this.confirmationMode,
    this.defaultDestinationId,
  });

  static Future<void> show(
    BuildContext context, {
    String? initialUrl,
    String? initialNote,
    String? platform,
    bool isExternalShare = false,
    String? confirmationMode,
    String? defaultDestinationId,
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
        confirmationMode: confirmationMode,
        defaultDestinationId: defaultDestinationId,
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
  String _selectedDestination = 'google_sheets';
  ConfirmationMode _confirmationMode = ConfirmationMode.confirm;
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

    if (widget.defaultDestinationId != null && widget.defaultDestinationId!.isNotEmpty) {
      _selectedDestination = widget.defaultDestinationId!;
    }

    final modeParam = widget.confirmationMode?.toLowerCase();
    if (modeParam == 'auto') {
      _confirmationMode = ConfirmationMode.auto;
      _saveState = SaveState.saving;
      _statusSubtitle = '⚡ Auto-saving to Clipper…';
    } else if (modeParam == 'always_ask') {
      _confirmationMode = ConfirmationMode.alwaysAsk;
      _showDestPicker = true;
      _statusSubtitle = 'Select destination and options';
    } else {
      _confirmationMode = ConfirmationMode.confirm;
      _statusSubtitle = 'Choose a destination and tap Save';
    }

    _badgeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    // Fast-path: initialize mode and destinations, auto-saving immediately if in Auto Mode
    WidgetsBinding.instance.addPostFrameCallback((_) => _initModeAndDestinations());
  }

  Future<void> _initModeAndDestinations() async {
    final provider = Provider.of<ClipsProvider>(context, listen: false);

    // 1. If mode or destination weren't passed synchronously, load from SharedPreferences
    if (widget.confirmationMode == null || widget.defaultDestinationId == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final modeStr = prefs.getString('clipper_confirmation_mode') ?? 'confirm';
        final savedDefaultDest = prefs.getString('clipper_default_dest_id');

        if (mounted) {
          setState(() {
            if (widget.defaultDestinationId == null && savedDefaultDest != null && savedDefaultDest.isNotEmpty) {
              _selectedDestination = savedDefaultDest;
            }
            if (widget.confirmationMode == null) {
              if (modeStr == 'auto') {
                _confirmationMode = ConfirmationMode.auto;
                _saveState = SaveState.saving;
                _statusSubtitle = '⚡ Auto-saving to ${_getDestinationLabel(_selectedDestination)}…';
              } else if (modeStr == 'always_ask') {
                _confirmationMode = ConfirmationMode.alwaysAsk;
                _showDestPicker = true;
                _statusSubtitle = 'Select destination and options';
              } else {
                _confirmationMode = ConfirmationMode.confirm;
              }
            }
          });
        }
      } catch (_) {}
    }

    // 2. Fall back to provider default if not customized
    if (widget.defaultDestinationId == null && provider.selectedDestinationId.isNotEmpty && mounted) {
      if (_selectedDestination == 'google_sheets' && provider.selectedDestinationId != 'google_sheets') {
        setState(() {
          _selectedDestination = provider.selectedDestinationId;
        });
      }
    }

    // 3. AUTO MODE: Trigger background save immediately with zero extra clicks!
    if (_confirmationMode == ConfirmationMode.auto) {
      _handleSaveClip();
      return;
    }

    // 4. Background refresh without stalling the sheet
    provider.loadDestinations().then((_) {
      if (!mounted) return;
      setState(() {
        if (provider.selectedDestinationId.isNotEmpty && widget.defaultDestinationId == null && _selectedDestination == 'google_sheets') {
          _selectedDestination = provider.selectedDestinationId;
        }
      });
    }).catchError((_) {});
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
      ApiService.setDefaultDestination(destId).catchError((_) => false);
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

    if (res.ok) {
      _autoDismissTimer?.cancel();
      final dismissDelay = _confirmationMode == ConfirmationMode.auto
          ? const Duration(milliseconds: 850)
          : (widget.isExternalShare ? const Duration(milliseconds: 2000) : null);

      if (dismissDelay != null) {
        _autoDismissTimer = Timer(dismissDelay, () {
          if (mounted && !_showNotesField && !_showTagsField && !_showDestPicker && !_showDeadlinePicker) {
            _handleDismiss();
          }
        });
      }
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
        color: Colors.black.withValues(alpha: 0.45),
        alignment: Alignment.bottomCenter,
        child: GestureDetector(
          onTap: () {
            // Cancel auto-dismiss when user taps inside the modal to interact
            _autoDismissTimer?.cancel();
          },
          child: Container(
            width: double.infinity,
            constraints: BoxConstraints(
              maxHeight: mediaQuery.size.height * 0.88,
            ),
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 18,
              bottom: max(mediaQuery.viewInsets.bottom, mediaQuery.padding.bottom) + 16,
            ),
            decoration: const BoxDecoration(
              color: AppTheme.surface, // Clean crisp white surface
              borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              border: Border(
                top: BorderSide(color: AppTheme.borderSubtle, width: 1.0),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 28,
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
                            color: AppTheme.surfaceMuted,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: const Icon(
                            LucideIcons.x,
                            size: 16,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (_confirmationMode == ConfirmationMode.auto) ...[
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(LucideIcons.zap, size: 13, color: Color(0xFFD97706)),
                          const SizedBox(width: 5),
                          Text(
                            '⚡ AUTO MODE ACTIVE • ZERO-CLICK SAVE',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFB45309),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // ─── 1-Tap Mode Switcher: [Music Sync / Full Clip] ───
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(3.5),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.borderSubtle),
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
                                color: !_isMusicSyncMode ? AppTheme.primaryGreen : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: !_isMusicSyncMode
                                    ? [
                                        BoxShadow(
                                          color: AppTheme.primaryGreen.withValues(alpha: 0.3),
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
                                    color: !_isMusicSyncMode ? Colors.white : AppTheme.textMuted,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Full Clip Save',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: !_isMusicSyncMode ? Colors.white : AppTheme.textMuted,
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
                                color: _isMusicSyncMode ? AppTheme.primaryGreen : Colors.transparent,
                                borderRadius: BorderRadius.circular(9),
                                boxShadow: _isMusicSyncMode
                                    ? [
                                        BoxShadow(
                                          color: AppTheme.primaryGreen.withValues(alpha: 0.3),
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
                                    color: _isMusicSyncMode ? Colors.white : AppTheme.textMuted,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Music Sync',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: _isMusicSyncMode ? Colors.white : AppTheme.textMuted,
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
                              colors: [AppTheme.primaryGreen, AppTheme.primaryGreenLight],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryGreen.withValues(alpha: 0.35),
                                blurRadius: 18,
                                offset: const Offset(0, 6),
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
                        ? (_confirmationMode == ConfirmationMode.auto ? '⚡ Auto-saving…' : 'Saving…')
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
                      color: AppTheme.textPrimary,
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
                      color: AppTheme.textMuted,
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

                  // ─── Action Dock (5 Icon Actions: Trash, Tags, Notes, Reminder, Destination) ───
                  Padding(
                    padding: const EdgeInsets.only(top: 6, bottom: 12),
                    child: Row(
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
                  ),

                  // "Tap anywhere to dismiss" label
                  Text(
                    _confirmationMode == ConfirmationMode.auto && _saveState == SaveState.saved
                        ? 'Closing automatically… (tap to keep open)'
                        : 'Tap anywhere to dismiss',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      color: AppTheme.inactiveGrey,
                    ),
                  ),
                  const SizedBox(height: 6),
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
            color: isActive ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? AppTheme.primaryGreen : AppTheme.borderSubtle,
            ),
          ),
          child: Icon(
            icon,
            size: 15,
            color: isActive ? AppTheme.primaryGreen : AppTheme.textMuted,
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
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
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
                  color: AppTheme.primaryGreenBg,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(LucideIcons.link, size: 15, color: AppTheme.primaryGreen),
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
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      url.isEmpty ? 'Share a link to preview it here' : url,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
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
                color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(10),
                border: const Border(
                  left: BorderSide(color: AppTheme.primaryGreen, width: 2.5),
                ),
              ),
              child: Text(
                '"$highlight"',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: AppTheme.textPrimary,
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
              color: AppTheme.surfaceMuted,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.hardDrive, size: 16, color: AppTheme.primaryGreen),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Save to Vault (No external destination connected)',
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
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
            color: AppTheme.surfaceMuted,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: Row(
            children: [
              Text(
                'Saving to:',
                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: value,
                    isExpanded: true,
                    dropdownColor: AppTheme.surface,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                    icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppTheme.textMuted),
                    selectedItemBuilder: (context) {
                      return items.map((d) {
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              d.name,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildBrandIcon(d.provider, size: 16),
                          ],
                        );
                      }).toList();
                    },
                    items: items.map((d) {
                      return DropdownMenuItem<String>(
                        value: d.id,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildBrandIcon(d.provider, size: 16),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                d.name,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ),
                          ],
                        ),
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
                backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.75),
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
                    _confirmationMode == ConfirmationMode.auto
                        ? '⚡ Auto-saving to Clipper…'
                        : 'Saving to Clipper…',
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
              color: AppTheme.primaryGreenBg,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.check, size: 16, color: Color(0xFF166534)),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _savedDestinationName != null && _savedDestinationName!.isNotEmpty
                        ? 'Saved — ${_savedDestinationName!}'
                        : 'Saved — processing in background',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF166534)),
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
                foregroundColor: AppTheme.textPrimary,
                side: const BorderSide(color: AppTheme.borderSubtle),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: _handleOpenInApp,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.externalLink, size: 15, color: AppTheme.textPrimary),
                  const SizedBox(width: 8),
                  Text(
                    'Open in Clipper',
                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
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
              color: AppTheme.amberAlertBg,
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: AppTheme.borderAmber),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.circleAlert, size: 16, color: AppTheme.amberAlert),
                const SizedBox(width: 8),
                Text(
                  'Already saved previously',
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.amberAlert),
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
                foregroundColor: AppTheme.textPrimary,
                side: const BorderSide(color: AppTheme.borderSubtle),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
              ),
              onPressed: _handleOpenInApp,
              child: Text(
                'Open in Clipper',
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
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
              color: AppTheme.urgencyRedBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFFCA5A5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(LucideIcons.circleAlert, size: 16, color: AppTheme.urgencyRed),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _saveError ?? 'Failed to save',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.urgencyRed),
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
                backgroundColor: AppTheme.primaryGreen,
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
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                elevation: 0,
                shadowColor: AppTheme.primaryGreen.withValues(alpha: 0.3),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
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
                final isSheets = d.provider == 'google_sheets' || d.id == 'google_sheets';
                final isSpotify = d.provider == 'spotify' || d.id == 'spotify';
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: _buildQuickProviderButton(
                      label: d.name,
                      iconWidget: _buildBrandIcon(d.provider, size: 16),
                      bgColor: isSheets
                          ? AppTheme.primaryGreenBg
                          : isSpotify
                              ? const Color(0xFFDCFCE7)
                              : AppTheme.amberAlertBg,
                      borderColor: isSheets
                          ? const Color(0xFF86EFAC)
                          : isSpotify
                              ? const Color(0xFF4ADE80)
                              : AppTheme.borderAmber,
                      textColor: isSheets
                          ? const Color(0xFF166534)
                          : isSpotify
                              ? const Color(0xFF15803D)
                              : const Color(0xFF92400E),
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
                  backgroundColor: AppTheme.trendGreen,
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
            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
          ),
        ];
    }
  }

  Widget _buildQuickProviderButton({
    required String label,
    required Widget iconWidget,
    required Color bgColor,
    required Color borderColor,
    required Color textColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            iconWidget,
            const SizedBox(width: 7),
            Flexible(
              child: Text(
                'Save to $label',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
              ),
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
              color: _rememberDefault ? AppTheme.primaryGreen : AppTheme.surface,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: _rememberDefault ? AppTheme.primaryGreen : AppTheme.borderSubtle,
              ),
            ),
            child: _rememberDefault
                ? const Icon(LucideIcons.check, size: 13, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 8),
          Text(
            'Remember as default destination',
            style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
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
            color: isActive ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? AppTheme.primaryGreen : AppTheme.borderSubtle,
              width: 1.2,
            ),
          ),
          child: Icon(
            icon,
            size: 19,
            color: isActive ? AppTheme.primaryGreen : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildInlineNotesField() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: TextField(
        controller: _noteController,
        autofocus: true,
        style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Add a thought, highlight, or note…',
          hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
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
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
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
                  label: Text('#$tag', style: const TextStyle(fontSize: 11, color: Color(0xFF166534))),
                  backgroundColor: AppTheme.primaryGreenBg,
                  deleteIcon: const Icon(LucideIcons.x, size: 12, color: Color(0xFF166534)),
                  onDeleted: () => setState(() => _tags.remove(tag)),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          TextField(
            controller: _tagController,
            style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Type tag and press enter (e.g. ai, jobs)…',
              hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
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
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
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
                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                  ),
                );
              }
              final items = clips.destinations;
              return Wrap(
                spacing: 8,
                runSpacing: 8,
                children: items.map((d) {
                  final color = d.provider == 'google_sheets' || d.id == 'google_sheets'
                      ? const Color(0xFF166534)
                      : d.provider == 'notion' || d.id == 'notion'
                          ? const Color(0xFF92400E)
                          : AppTheme.primaryGreen;
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
            style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Target sheet / tab / table (optional)…',
              hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
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
          color: isSel ? AppTheme.primaryGreenBg : AppTheme.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSel ? AppTheme.primaryGreen : AppTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: isSel ? AppTheme.primaryGreen : AppTheme.textMuted),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                color: isSel ? AppTheme.primaryGreen : AppTheme.textMuted,
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
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            _selectedDeadline == null
                ? 'No deadline set'
                : 'Deadline: ${_selectedDeadline!.year}-${_selectedDeadline!.month.toString().padLeft(2, '0')}-${_selectedDeadline!.day.toString().padLeft(2, '0')}',
            style: GoogleFonts.inter(color: AppTheme.textPrimary, fontSize: 13),
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
            child: const Text('Pick Date', style: TextStyle(color: AppTheme.primaryGreen, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  static Widget _buildBrandIcon(String provider, {double size = 18}) {
    final p = provider.toLowerCase();
    if (p.contains('sheets') || p.contains('google')) {
      return GoogleSheetsBrandIcon(size: size);
    }
    if (p.contains('spotify')) {
      return SpotifyBrandIcon(size: size);
    }
    if (p.contains('notion')) {
      return NotionBrandIcon(size: size);
    }
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen,
        borderRadius: BorderRadius.circular(size * 0.22),
      ),
      child: Icon(LucideIcons.hardDrive, size: size * 0.6, color: Colors.white),
    );
  }
}

/// Authentic Google Sheets brand icon: emerald green document with white spreadsheet cells grid
class GoogleSheetsBrandIcon extends StatelessWidget {
  final double size;
  const GoogleSheetsBrandIcon({super.key, this.size = 18});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFF0F9D58), // Official Google Sheets Green
        borderRadius: BorderRadius.circular(size * 0.22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F9D58).withValues(alpha: 0.35),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: EdgeInsets.all(size * 0.16),
      child: CustomPaint(
        painter: _GoogleSheetsPainter(),
      ),
    );
  }
}

class _GoogleSheetsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    // Draw spreadsheet grid cells (2 columns x 3 rows)
    final cellW = (size.width - 1.5) / 2.0;
    final cellH = (size.height - 2.0) / 3.0;

    for (int r = 0; r < 3; r++) {
      for (int c = 0; c < 2; c++) {
        final rect = Rect.fromLTWH(
          c * (cellW + 1.5),
          r * (cellH + 1.0),
          cellW,
          cellH,
        );
        canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(0.8)), paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Authentic Spotify brand icon: Spotify green circle with curved wave arcs
class SpotifyBrandIcon extends StatelessWidget {
  final double size;
  const SpotifyBrandIcon({super.key, this.size = 18});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFF1DB954), // Spotify Green
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1DB954).withValues(alpha: 0.35),
            blurRadius: 2,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: EdgeInsets.all(size * 0.18),
      child: CustomPaint(
        painter: _SpotifyWavesPainter(),
      ),
    );
  }
}

class _SpotifyWavesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF121212)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = size.width * 0.16;

    final cx = size.width * 0.46;
    final r1 = Rect.fromCircle(center: Offset(cx, size.height * 1.05), radius: size.width * 0.72);
    final r2 = Rect.fromCircle(center: Offset(cx, size.height * 1.05), radius: size.width * 0.52);
    final r3 = Rect.fromCircle(center: Offset(cx, size.height * 1.05), radius: size.width * 0.32);

    canvas.drawArc(r1, -pi * 0.78, pi * 0.44, false, paint);
    paint.strokeWidth = size.width * 0.14;
    canvas.drawArc(r2, -pi * 0.78, pi * 0.40, false, paint);
    paint.strokeWidth = size.width * 0.12;
    canvas.drawArc(r3, -pi * 0.78, pi * 0.36, false, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Authentic Notion brand icon: Clean white tile with stylized 'N'
class NotionBrandIcon extends StatelessWidget {
  final double size;
  const NotionBrandIcon({super.key, this.size = 18});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(size * 0.22),
        border: Border.all(color: Colors.black12, width: 0.8),
      ),
      alignment: Alignment.center,
      child: Text(
        'N',
        style: GoogleFonts.outfit(
          fontSize: size * 0.65,
          fontWeight: FontWeight.w900,
          color: Colors.black,
          height: 1.0,
        ),
      ),
    );
  }
}
