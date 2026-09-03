import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';
import '../../widgets/save_clip_bottom_sheet.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  String _selectedCategory = 'All';
  final TextEditingController _aiChatController = TextEditingController();
  final Set<String> _favoritedClipIds = {};
  final Map<String, List<String>> _clipNotes = {};

  final List<String> _categories = [
    'All',
    'AI & ML',
    'Engineering',
    'Research',
    'Design',
    'Hardware',
    'Articles',
  ];

  @override
  void dispose() {
    _aiChatController.dispose();
    super.dispose();
  }

  void _openXStyleInAppBrowser(BuildContext context, ClipModel clip) {
    final isFavorited = _favoritedClipIds.contains(clip.id);
    XStyleInAppBrowserModal.show(
      context,
      clip,
      isFavorited: isFavorited,
      onToggleFavorite: () {
        setState(() {
          if (_favoritedClipIds.contains(clip.id)) {
            _favoritedClipIds.remove(clip.id);
          } else {
            _favoritedClipIds.add(clip.id);
          }
        });
      },
    );
  }

  void _openAiChatForClip(BuildContext context, ClipModel clip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => _ClipAiChatSheet(clip: clip),
    );
  }

  void _openAddNoteDialog(BuildContext context, ClipModel clip) {
    final noteController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          left: 20,
          right: 20,
          top: 20,
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
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.pencil, size: 16, color: Color(0xFF16A34A)),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Add Thought / Note',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.inactiveGrey),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Attach your personal thoughts or insights to "${clip.title}":',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 14),
            TextField(
              controller: noteController,
              maxLines: 3,
              autofocus: true,
              style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'e.g. Remember to try this prompt technique in our next sprint...',
                hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
                filled: true,
                fillColor: AppTheme.surfaceMuted,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF2D6A4F)),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D6A4F),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  final text = noteController.text.trim();
                  if (text.isNotEmpty) {
                    setState(() {
                      _clipNotes.putIfAbsent(clip.id, () => []).add(text);
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Note saved to vault ✓'),
                        backgroundColor: const Color(0xFF2D6A4F),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    );
                  }
                },
                child: Text(
                  'Save Note',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final allClips = clipsProvider.clips.isNotEmpty
        ? clipsProvider.clips
        : _getDemoFeedClips();

    final filteredClips = _selectedCategory == 'All'
        ? allClips
        : allClips.where((c) => c.contentType.toLowerCase() == _selectedCategory.toLowerCase()).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.list(
        title: 'Knowledge Feed',
        onSearchTap: () {},
        onFilterTap: () => SaveClipBottomSheet.show(context),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: AI Ask Your Vault Bar
            _buildAiAskVaultBar(context),
            const SizedBox(height: 16),

            // Section 2: Category Filter Pills
            _buildCategoryChips(),
            const SizedBox(height: 16),

            // Section 3: Feed Stream Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Stream (${filteredClips.length})',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Real-time sync',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Section 4: Feed Cards List
            ...filteredClips.map((clip) => _buildFeedCard(context, clip)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 1: AI "Ask your Vault" Chat Bar
  // ---------------------------------------------------------------------------
  Widget _buildAiAskVaultBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF86EFAC), width: 1.0),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2D6A4F).withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(LucideIcons.sparkles, size: 16, color: Color(0xFF16A34A)),
              ),
              const SizedBox(width: 8),
              Text(
                'Talk to Your Vault',
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'AI ASSISTANT',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Input field
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _aiChatController,
                  style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Ask anything about your saved links, articles, notes...',
                    hintStyle: GoogleFonts.inter(fontSize: 12, color: AppTheme.inactiveGrey),
                    filled: true,
                    fillColor: AppTheme.surfaceMuted,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.borderSubtle),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.borderSubtle),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF2D6A4F)),
                    ),
                  ),
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) {
                      _showVaultAnswerDialog(context, val.trim());
                      _aiChatController.clear();
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () {
                  final text = _aiChatController.text.trim();
                  if (text.isNotEmpty) {
                    _showVaultAnswerDialog(context, text);
                    _aiChatController.clear();
                  }
                },
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2D6A4F),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.arrowUp, size: 18, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Quick Prompt Suggestion Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _buildPromptPill(context, '💡 Summarize last 5 saves'),
                _buildPromptPill(context, '🤖 Key LLM trends saved'),
                _buildPromptPill(context, '⚡ Top engineering tools'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromptPill(BuildContext context, String text) {
    return GestureDetector(
      onTap: () => _showVaultAnswerDialog(context, text),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimary,
          ),
        ),
      ),
    );
  }

  void _showVaultAnswerDialog(BuildContext context, String query) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.bot, size: 18, color: Color(0xFF16A34A)),
                ),
                const SizedBox(width: 10),
                Text(
                  'Vault AI Insight',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Text(
                'Question: "$query"',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              'Based on your 1,369 saved clips across 6 collections:\n\n'
              '• Your latest saves focus heavily on LLM context windows, KV cache memory reduction, and React node-based canvas architectures.\n'
              '• Recommended next read: "Understanding Transformers & KV Cache Optimization" (arXiv:2403.09812).\n'
              '• 2 items in your jobs pipeline require follow-up before tomorrow.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppTheme.textPrimary,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D6A4F),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: Text('Done', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 2: Category Filter Chips
  // ---------------------------------------------------------------------------
  Widget _buildCategoryChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: _categories.map((cat) {
          final isSelected = _selectedCategory == cat;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedCategory = cat;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF2D6A4F) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? const Color(0xFF2D6A4F) : AppTheme.borderSubtle,
                  width: 1.0,
                ),
                boxShadow: [
                  if (isSelected)
                    BoxShadow(
                      color: const Color(0xFF2D6A4F).withValues(alpha: 0.2),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                ],
              ),
              child: Text(
                cat,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : AppTheme.textMuted,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 3: Interactive Feed Card
  // ---------------------------------------------------------------------------
  Widget _buildFeedCard(BuildContext context, ClipModel clip) {
    final isFavorited = _favoritedClipIds.contains(clip.id);
    final notes = _clipNotes[clip.id] ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Metadata Row: Source author, Category Pill, Time Ago
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Center(
                      child: Icon(
                        _getSourceIcon(clip.sourcePlatform),
                        size: 14,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    clip.sourceAuthor.isNotEmpty ? clip.sourceAuthor : 'Web Vault',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      clip.contentType.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                '12m ago',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Title
          Text(
            clip.title,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 6),

          // Summary
          Text(
            clip.summary,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 10),

          // Tags
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: clip.tags.map((t) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 0.5),
                ),
                child: Text(
                  '#$t',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textMuted,
                  ),
                ),
              );
            }).toList(),
          ),

          // Optional user notes
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: const Border(left: BorderSide(color: Color(0xFF16A34A), width: 3)),
              ),
              child: Text(
                'Note: ${notes.last}',
                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF166534)),
              ),
            ),
          ],
          const SizedBox(height: 10),

          // X-Style Embedded Link Preview Card (Tappable to open In-App Browser)
          GestureDetector(
            onTap: () => _openXStyleInAppBrowser(context, clip),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
              ),
              child: Row(
                children: [
                  Container(
                    width: 68,
                    height: 68,
                    decoration: const BoxDecoration(
                      color: Color(0xFF1E293B),
                      borderRadius: BorderRadius.horizontal(left: Radius.circular(11)),
                    ),
                    child: Center(
                      child: Icon(
                        _getSourceIcon(clip.sourcePlatform),
                        size: 26,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            clip.title,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            Uri.tryParse(clip.url)?.host.isNotEmpty == true
                                ? Uri.tryParse(clip.url)!.host
                                : clip.url,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(right: 12),
                    child: Icon(LucideIcons.chevronRight, size: 16, color: AppTheme.inactiveGrey),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 10),

          // Action Buttons Bar: Ask AI | Note | Bookmark | Open Link (X In-App Browser)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Talk / Ask AI Button
              GestureDetector(
                onTap: () => _openAiChatForClip(context, clip),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.sparkles, size: 14, color: Color(0xFF16A34A)),
                      const SizedBox(width: 6),
                      Text(
                        'Ask AI',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Add Note Button
              GestureDetector(
                onTap: () => _openAddNoteDialog(context, clip),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.pencil, size: 13, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        'Add Note',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Favorite toggle
              IconButton(
                icon: Icon(
                  isFavorited ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                  size: 18,
                  color: isFavorited ? const Color(0xFF16A34A) : AppTheme.inactiveGrey,
                ),
                onPressed: () {
                  setState(() {
                    if (isFavorited) {
                      _favoritedClipIds.remove(clip.id);
                    } else {
                      _favoritedClipIds.add(clip.id);
                    }
                  });
                },
                splashRadius: 18,
              ),

              // Open X-Style In-App Browser
              IconButton(
                icon: const Icon(LucideIcons.externalLink, size: 16, color: Color(0xFF2D6A4F)),
                onPressed: () => _openXStyleInAppBrowser(context, clip),
                splashRadius: 18,
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getSourceIcon(String platform) {
    if (platform.contains('github')) return LucideIcons.code;
    if (platform.contains('twitter') || platform.contains('x')) return LucideIcons.messageSquare;
    if (platform.contains('linkedin')) return LucideIcons.briefcase;
    return LucideIcons.globe;
  }

  List<ClipModel> _getDemoFeedClips() {
    return [
      ClipModel(
        id: '0',
        url: 'https://habeshahistory.com/the-dahlak-sultanate',
        title: 'The Dahlak Sultanate: A Medieval History (8th–16th AD) | Habesha History',
        summary: 'A naval force sent by Sulayman ibn Abd al-Malik swiftly retaliated, capturing the Dahlak Islands (an event that likely coincided with the sacking of Adulis). Under Umayyad control, the islands were transformed into a remote prison, earning the nickname "Island of Thorns", where dissidents and criminals were exiled throughout the 8th century AD. This practice continued under the Abbasid Caliphate.',
        contentType: 'Research',
        tags: ['history', 'medieval', 'dahlak', 'redsea', 'eritrea'],
        sourcePlatform: 'web',
        sourceAuthor: 'Habesha History',
        status: 'done',
        exportStatus: 'done',
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      ClipModel(
        id: '1',
        url: 'https://arxiv.org/abs/2403.09812',
        title: 'Understanding Transformers & KV Cache Optimization in Large Models',
        summary: 'Deep architectural paper analyzing multi-head latency reduction, speculative decoding, and vLLM throughput performance.',
        contentType: 'Research',
        tags: ['ml', 'transformers', 'vllm', 'system-design'],
        sourcePlatform: 'web',
        sourceAuthor: 'arXiv Research',
        status: 'done',
        exportStatus: 'done',
        createdAt: DateTime.now().subtract(const Duration(minutes: 12)),
      ),
      ClipModel(
        id: '2',
        url: 'https://uxdesign.cc/designing-better-ai-interfaces',
        title: 'Designing Better AI Interfaces: Real-Time Canvas Workflows & Streaming Nodes',
        summary: 'Comprehensive design system guide for AI canvas interactions, token streaming feedback, and non-blocking generation UI.',
        contentType: 'Design',
        tags: ['ai', 'design', 'canvas', 'ux'],
        sourcePlatform: 'web',
        sourceAuthor: 'UX Collective',
        status: 'done',
        exportStatus: 'done',
        createdAt: DateTime.now().subtract(const Duration(minutes: 45)),
      ),
      ClipModel(
        id: '3',
        url: 'https://github.com/astral-sh/uv',
        title: 'Astral UV: Extremely Fast Python Package Manager Written in Rust',
        summary: 'Replacing pip, pip-tools, and virtualenv with an extremely fast 10-100x Rust-based unified workspace resolver.',
        contentType: 'Engineering',
        tags: ['python', 'rust', 'tools', 'performance'],
        sourcePlatform: 'github.com',
        sourceAuthor: 'Astral Software',
        status: 'done',
        exportStatus: 'done',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      ClipModel(
        id: '4',
        url: 'https://vercel.com/careers/senior-frontend',
        title: 'Senior Frontend Engineer (Next.js Runtimes & AI Applications)',
        summary: 'Remote worldwide role offering \$160k - \$190k + equity. Work on edge runtime optimizations and streaming server components.',
        contentType: 'Jobs',
        tags: ['react', 'nextjs', 'remote', 'jobs'],
        sourcePlatform: 'linkedin',
        sourceAuthor: 'Vercel Careers',
        status: 'done',
        exportStatus: 'done',
        createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      ),
    ];
  }
}

// =============================================================================
// AI CHAT BOTTOM SHEET FOR A SPECIFIC CLIP
// =============================================================================

class _ClipAiChatSheet extends StatefulWidget {
  final ClipModel clip;

  const _ClipAiChatSheet({required this.clip});

  @override
  State<_ClipAiChatSheet> createState() => _ClipAiChatSheetState();
}

class _ClipAiChatSheetState extends State<_ClipAiChatSheet> {
  final TextEditingController _msgController = TextEditingController();
  final List<Map<String, String>> _messages = [];

  @override
  void initState() {
    super.initState();
    _messages.add({
      'role': 'ai',
      'text': 'Hi! I’ve analyzed "${widget.clip.title}". What would you like to know or extract from this save?',
    });
  }

  @override
  void dispose() {
    _msgController.dispose();
    super.dispose();
  }

  void _sendMessage(String query) {
    if (query.trim().isEmpty) return;
    setState(() {
      _messages.add({'role': 'user', 'text': query.trim()});
      _messages.add({
        'role': 'ai',
        'text': _generateAiResponse(query.trim(), widget.clip),
      });
    });
    _msgController.clear();
  }

  String _generateAiResponse(String query, ClipModel clip) {
    final lower = query.toLowerCase();
    if (lower.contains('summar') || lower.contains('brief')) {
      return 'Key Takeaways from ${clip.title}:\n\n1. Core Focus: Historical maritime trade and territorial sovereignty.\n2. Strategic Importance: Controlled the Red Sea commercial routes between the Horn of Africa, Yemen, and Egypt.\n3. Archeological Impact: Over 300 Kufic and Arabic funerary inscriptions discovered in Dahlak Kebir.';
    }
    if (lower.contains('action') || lower.contains('todo') || lower.contains('step')) {
      return 'Actionable Next Steps:\n• Review historical sources at ${clip.url}\n• Tag with #history, #medieval-archaeology, and #redsea in your vault\n• Share key historical points with your study group';
    }
    return 'Based on "${clip.title}": ${clip.summary}\n\nWould you like me to extract key dates, historical figures, or create a quiz on this topic?';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(LucideIcons.sparkles, size: 16, color: Color(0xFF16A34A)),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Talk with Clip',
                          style: GoogleFonts.outfit(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          widget.clip.title,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppTheme.textMuted,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.inactiveGrey),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Messages List
            Expanded(
              child: ListView.builder(
                itemCount: _messages.length,
                itemBuilder: (ctx, i) {
                  final msg = _messages[i];
                  final isAi = msg['role'] == 'ai';

                  return Align(
                    alignment: isAi ? Alignment.centerLeft : Alignment.centerRight,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(12),
                      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                      decoration: BoxDecoration(
                        color: isAi ? const Color(0xFFF8FAFC) : const Color(0xFF2D6A4F),
                        borderRadius: BorderRadius.circular(14),
                        border: isAi ? Border.all(color: const Color(0xFFE2E8F0)) : null,
                      ),
                      child: Text(
                        msg['text'] ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: isAi ? AppTheme.textPrimary : Colors.white,
                          height: 1.4,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Quick Prompt Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildChip('3 Key Takeaways'),
                  const SizedBox(width: 6),
                  _buildChip('Explain Simply'),
                  const SizedBox(width: 6),
                  _buildChip('Action Items'),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Input Row
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgController,
                    style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Ask about this clip...',
                      hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
                      filled: true,
                      fillColor: AppTheme.surfaceMuted,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.borderSubtle),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.borderSubtle),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF2D6A4F)),
                      ),
                    ),
                    onSubmitted: _sendMessage,
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _sendMessage(_msgController.text),
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2D6A4F),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.send, size: 18, color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String label) {
    return GestureDetector(
      onTap: () => _sendMessage(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFDCFCE7),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF16A34A)),
        ),
      ),
    );
  }
}

// =============================================================================
// IN-APP BROWSER WITH REAL ARTICLE READER & DOCKED FEED CLIP CARD
// =============================================================================

class XStyleInAppBrowserModal extends StatefulWidget {
  final ClipModel clip;
  final bool isFavorited;
  final VoidCallback? onToggleFavorite;

  const XStyleInAppBrowserModal({
    super.key,
    required this.clip,
    this.isFavorited = false,
    this.onToggleFavorite,
  });

  static void show(
    BuildContext context,
    ClipModel clip, {
    bool isFavorited = false,
    VoidCallback? onToggleFavorite,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: false,
      builder: (ctx) => XStyleInAppBrowserModal(
        clip: clip,
        isFavorited: isFavorited,
        onToggleFavorite: onToggleFavorite,
      ),
    );
  }

  @override
  State<XStyleInAppBrowserModal> createState() => _XStyleInAppBrowserModalState();
}

class _XStyleInAppBrowserModalState extends State<XStyleInAppBrowserModal> {
  late final WebViewController _webViewController;
  bool _isLoading = true;
  double _progress = 0.0;
  bool _isDockedExpanded = true;
  bool _isRefreshing = false;
  late bool _isFavorited;

  @override
  void initState() {
    super.initState();
    _isFavorited = widget.isFavorited;
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F141C))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _progress = progress / 100.0;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
        ),
      );

    final uri = Uri.tryParse(widget.clip.url);
    if (uri != null) {
      _webViewController.loadRequest(uri);
    }
  }

  String get _domain {
    final uri = Uri.tryParse(widget.clip.url);
    if (uri != null && uri.host.isNotEmpty) {
      return uri.host;
    }
    return 'habeshahistory.com';
  }

  void _handleRefresh() async {
    setState(() => _isRefreshing = true);
    _webViewController.reload();
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() => _isRefreshing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Reloaded $_domain'),
          duration: const Duration(seconds: 1),
          backgroundColor: const Color(0xFF1E293B),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(LucideIcons.copy, color: Colors.white, size: 20),
                title: Text('Copy article link', style: GoogleFonts.inter(color: Colors.white, fontSize: 14)),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: widget.clip.url));
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Article link copied to clipboard ✓'),
                      backgroundColor: Color(0xFF16A34A),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.externalLink, color: Colors.white, size: 20),
                title: Text('Open live website in external browser', style: GoogleFonts.inter(color: Colors.white, fontSize: 14)),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.tryParse(widget.clip.url);
                  if (uri != null && await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.share2, color: Colors.white, size: 20),
                title: Text('Share clip to vault members...', style: GoogleFonts.inter(color: Colors.white, fontSize: 14)),
                onTap: () => Navigator.pop(ctx),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final sheetHeight = mediaQuery.size.height * 0.94;

    return Container(
      height: sheetHeight,
      decoration: const BoxDecoration(
        color: Color(0xFF0F141C), // Obsidian dark theme matching in-app browser
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          // Drag handle pill at top (swipe down to dismiss)
          GestureDetector(
            onVerticalDragEnd: (details) {
              if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
                Navigator.pop(context);
              }
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.only(top: 8, bottom: 4),
              width: double.infinity,
              alignment: Alignment.center,
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),

          // 1. Top In-App Browser Header (Domain + Breadcrumb + Controls)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFF1E293B), width: 1)),
            ),
            child: Row(
              children: [
                // Favicon / Globe icon
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      widget.clip.sourcePlatform.contains('github')
                          ? LucideIcons.code
                          : LucideIcons.globe,
                      size: 18,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Title and Breadcrumb
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _domain,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Home / ${widget.clip.contentType.toLowerCase()}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF94A3B8),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // 3-dots more menu
                IconButton(
                  icon: const Icon(LucideIcons.ellipsis, size: 20, color: Colors.white),
                  onPressed: () => _showMoreMenu(context),
                  visualDensity: VisualDensity.compact,
                ),
                // X (Close) button
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),

          // 2. Real Web Page Main Content Area (Live WebView Widget)
          Expanded(
            child: Stack(
              children: [
                // Live WebView Engine rendering the real website with full scroll support
                WebViewWidget(
                  controller: _webViewController,
                  gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                    Factory<OneSequenceGestureRecognizer>(
                      () => EagerGestureRecognizer(),
                    ),
                  },
                ),

                // Top Loading progress bar
                if (_isLoading && _progress < 1.0)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: LinearProgressIndicator(
                      value: _progress > 0 ? _progress : null,
                      backgroundColor: Colors.transparent,
                      color: const Color(0xFF16A34A),
                      minHeight: 2.5,
                    ),
                  ),

                // 3. Floating Bottom Controls: In-App Browser Pill + Docked Real Feed Box Card
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // In-App Browser Navigation Pill Bar (← | domain.com ⋮ | ↻)
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF000000).withValues(alpha: 0.92),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: const Color(0xFF334155), width: 1),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.5),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Back Arrow (Go back in web history if possible, or close)
                            IconButton(
                              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white, size: 20),
                              onPressed: () async {
                                if (await _webViewController.canGoBack()) {
                                  await _webViewController.goBack();
                                } else {
                                  if (context.mounted) Navigator.pop(context);
                                }
                              },
                              visualDensity: VisualDensity.compact,
                            ),

                            // Center URL Pill with 3 vertical dots (e.g. habeshahistory.com ⋮)
                            InkWell(
                              onTap: () => _showMoreMenu(context),
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1E293B),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      _domain,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(LucideIcons.ellipsisVertical, size: 14, color: Color(0xFF94A3B8)),
                                  ],
                                ),
                              ),
                            ),

                            // Refresh button ↻
                            IconButton(
                              icon: _isRefreshing
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(LucideIcons.rotateCw, color: Colors.white, size: 19),
                              onPressed: _handleRefresh,
                              visualDensity: VisualDensity.compact,
                            ),
                          ],
                        ),
                      ),

                      // Docked Real Feed Box Card (from our app's Knowledge Feed)
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _isDockedExpanded = !_isDockedExpanded;
                          });
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: const BoxDecoration(
                            color: Color(0xFF000000), // Pure black matching bottom dock
                            border: Border(
                              top: BorderSide(color: Color(0xFF262626), width: 1.0),
                            ),
                          ),
                          child: SafeArea(
                            top: false,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Drag indicator line
                                Center(
                                  child: Container(
                                    width: 32,
                                    height: 3,
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF525252),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                ),

                                // Feed Box Header: Source Platform + Source Name + Category Pill + Saved to Vault
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1E293B),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Center(
                                            child: Icon(
                                              widget.clip.sourcePlatform.contains('github')
                                                  ? LucideIcons.code
                                                  : LucideIcons.globe,
                                              size: 13,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          widget.clip.sourceAuthor.isNotEmpty
                                              ? widget.clip.sourceAuthor
                                              : _domain,
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.white,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFDCFCE7),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            widget.clip.contentType.toUpperCase(),
                                            style: GoogleFonts.inter(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF166534),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF166534).withValues(alpha: 0.3),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: const Color(0xFF16A34A), width: 0.8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(LucideIcons.check, size: 11, color: Color(0xFF4ADE80)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Saved in Vault',
                                            style: GoogleFonts.inter(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF4ADE80),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Clip Title
                                Text(
                                  widget.clip.title,
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),

                                // Summary snippet
                                Text(
                                  widget.clip.summary,
                                  style: GoogleFonts.inter(
                                    fontSize: 11.5,
                                    color: const Color(0xFFA1A1AA),
                                    height: 1.35,
                                  ),
                                  maxLines: _isDockedExpanded ? 2 : 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),

                                // Tags
                                if (_isDockedExpanded)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Wrap(
                                      spacing: 6,
                                      runSpacing: 4,
                                      children: widget.clip.tags.map((t) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF18181B),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: const Color(0xFF27272A)),
                                          ),
                                          child: Text(
                                            '#$t',
                                            style: GoogleFonts.inter(
                                              fontSize: 9.5,
                                              color: const Color(0xFF71717A),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),

                                // Action Buttons Row: Ask AI | Add Note | Favorite Toggle | Share
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Ask AI
                                    InkWell(
                                      onTap: () {
                                        Navigator.pop(context);
                                        showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          backgroundColor: Colors.white,
                                          shape: const RoundedRectangleBorder(
                                            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                                          ),
                                          builder: (ctx) => _ClipAiChatSheet(clip: widget.clip),
                                        );
                                      },
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.sparkles, size: 13, color: Color(0xFF16A34A)),
                                            const SizedBox(width: 5),
                                            Text(
                                              'Ask AI',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: const Color(0xFF16A34A),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Add Note
                                    InkWell(
                                      onTap: () {
                                        Navigator.pop(context);
                                      },
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF18181B),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: const Color(0xFF27272A)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.pencil, size: 12, color: Color(0xFFA1A1AA)),
                                            const SizedBox(width: 5),
                                            Text(
                                              'Add Note',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: const Color(0xFFA1A1AA),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Bookmark / Vault Favorite
                                    IconButton(
                                      icon: Icon(
                                        _isFavorited ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                                        size: 18,
                                        color: _isFavorited ? const Color(0xFF10B981) : const Color(0xFF71717A),
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _isFavorited = !_isFavorited;
                                        });
                                        widget.onToggleFavorite?.call();
                                      },
                                      visualDensity: VisualDensity.compact,
                                    ),

                                    // Share
                                    IconButton(
                                      icon: const Icon(LucideIcons.share2, size: 16, color: Color(0xFF71717A)),
                                      onPressed: () => _showMoreMenu(context),
                                      visualDensity: VisualDensity.compact,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


