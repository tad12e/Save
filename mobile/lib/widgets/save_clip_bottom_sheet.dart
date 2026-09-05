import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/clips_provider.dart';
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

enum SaveState { saving, saved, error, deleted }

class _SaveClipBottomSheetState extends State<SaveClipBottomSheet>
    with SingleTickerProviderStateMixin {
  late final TextEditingController _noteController;
  late final TextEditingController _tagController;
  SaveState _saveState = SaveState.saving;
  String _selectedDestination = 'google_sheets';
  String? _statusSubtitle;
  bool _showNotesField = false;
  bool _showTagsField = false;
  bool _showDestPicker = false;
  bool _showDeadlinePicker = false;
  DateTime? _selectedDeadline;
  final List<String> _tags = [];
  Timer? _autoDismissTimer;
  late AnimationController _badgeAnimController;

  @override
  void initState() {
    super.initState();
    _noteController = TextEditingController(text: widget.initialNote ?? '');
    _tagController = TextEditingController();

    _badgeAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    // Auto-save immediately upon opening from share sheet
    _triggerAutoSave();
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _badgeAnimController.dispose();
    _noteController.dispose();
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _triggerAutoSave() async {
    final url = (widget.initialUrl ?? '').trim();
    if (url.isEmpty) {
      setState(() {
        _saveState = SaveState.error;
        _statusSubtitle = 'No valid link detected';
      });
      return;
    }

    setState(() {
      _saveState = SaveState.saving;
      _statusSubtitle = 'Saving to Clipper…';
    });

    final provider = Provider.of<ClipsProvider>(context, listen: false);

    // Perform save
    final success = await provider.createClip(
      url,
      selectedText: _noteController.text.trim(),
      destinationId: _selectedDestination,
    );

    if (mounted) {
      setState(() {
        if (success) {
          _saveState = SaveState.saved;
          _statusSubtitle = _getDestinationLabel(_selectedDestination);
        } else {
          _saveState = SaveState.error;
          _statusSubtitle = 'Saved offline • Will sync when connected';
        }
      });

      // If user doesn't interact, auto-dismiss and return cleanly to Twitter/Instagram
      if (widget.isExternalShare) {
        _autoDismissTimer = Timer(const Duration(seconds: 4), () {
          if (mounted && !_showNotesField && !_showTagsField && !_showDestPicker) {
            _handleDismiss();
          }
        });
      }
    }
  }

  String _getDestinationLabel(String dest) {
    switch (dest) {
      case 'notion':
        return 'Synced to Notion Workspace';
      case 'vault':
        return 'Saved to Vault • Moved to Inbox';
      case 'spotify':
        return 'Synced to Spotify Playlist';
      default:
        return 'Synced to Google Sheets • AI Tagging';
    }
  }

  void _handleDismiss() {
    _autoDismissTimer?.cancel();
    Navigator.of(context, rootNavigator: true).pop();
    if (widget.isExternalShare) {
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
    Navigator.of(context, rootNavigator: true).pop();
    // Keeps Clipper in foreground so user can read/browse their saves
  }

  void _handleMusicRadar() {
    _autoDismissTimer?.cancel();
    Navigator.of(context, rootNavigator: true).pop();
    AudioRecognitionDialog.show(context);
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
                  // Top close button
                  Align(
                    alignment: Alignment.topRight,
                    child: GestureDetector(
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
                  ),
                  const SizedBox(height: 12),

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
                    _statusSubtitle ?? 'Synced to Google Sheets',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(height: 28),

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

                  // ─── Primary Action Pill Button ───
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isMusicHint
                            ? const Color(0xFF10B981)
                            : const Color(0xFF1F2336),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                          side: const BorderSide(
                            color: Color(0xFF2E334D),
                            width: 1.0,
                          ),
                        ),
                      ),
                      onPressed: isMusicHint ? _handleMusicRadar : _handleOpenInApp,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isMusicHint ? LucideIcons.music : LucideIcons.externalLink,
                            size: 16,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isMusicHint ? 'Identify Music & Sync' : 'Open in Clipper',
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
                  const SizedBox(height: 12),

                  // "Tap anywhere to dismiss" label
                  Text(
                    'Tap anywhere to dismiss',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w400,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 28),

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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildDestChoice('google_sheets', 'Sheets', LucideIcons.table, const Color(0xFF10B981)),
          _buildDestChoice('notion', 'Notion', LucideIcons.fileText, const Color(0xFFF59E0B)),
          _buildDestChoice('vault', 'Vault', LucideIcons.hardDrive, const Color(0xFF8B5CF6)),
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
        });
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
