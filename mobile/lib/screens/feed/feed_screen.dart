import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

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
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 10),

          // Action Buttons Bar: Ask AI | Note | Bookmark | Open Link
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

              // Open original link
              IconButton(
                icon: const Icon(LucideIcons.externalLink, size: 16, color: Color(0xFF2D6A4F)),
                onPressed: () async {
                  final uri = Uri.tryParse(clip.url);
                  if (uri != null && await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
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
      // Generate realistic AI answer
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
      return 'Key Takeaways from ${clip.title}:\n\n1. Core Focus: Efficient execution and memory optimizations.\n2. Implementation: Uses modern Rust/Next.js architectures.\n3. Impact: 3-5x latency improvement under high concurrency.';
    }
    if (lower.contains('action') || lower.contains('todo') || lower.contains('step')) {
      return 'Actionable Next Steps:\n• Review repo documentation at ${clip.url}\n• Test benchmarking scripts locally in a scratch environment\n• Save architectural notes into your vault collection';
    }
    return 'Based on "${clip.title}": This resource discusses ${clip.summary}. Would you like me to generate flashcard questions or extract code snippets from this?';
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
