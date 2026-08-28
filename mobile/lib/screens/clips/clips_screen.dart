import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';

class ClipsScreen extends StatefulWidget {
  const ClipsScreen({super.key});

  @override
  State<ClipsScreen> createState() => _ClipsScreenState();
}

class _ClipsScreenState extends State<ClipsScreen> {
  final List<String> _categories = [
    'All',
    'Jobs',
    'Articles',
    'Scholarships',
    'Events',
    'Tools',
  ];

  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);

    return Scaffold(
      backgroundColor: AppTheme.background,
      // Variation 2 — List screen header (Clips)
      appBar: AppHeader.list(
        title: 'All Clips',
        onSearchTap: () {
          setState(() {
            _isSearching = !_isSearching;
            if (!_isSearching) {
              _searchController.clear();
              clipsProvider.setSearchQuery('');
            }
          });
        },
        onFilterTap: () {
          // Open filter bottom sheet or cycle categories
        },
      ),
      body: Column(
        children: [
          // Search input bar if toggled
          if (_isSearching)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: TextField(
                controller: _searchController,
                autofocus: true,
                onChanged: (val) => clipsProvider.setSearchQuery(val),
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textWhite),
                decoration: InputDecoration(
                  hintText: 'Search title, tags, author, summary...',
                  hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.surfaceCard,
                  prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppTheme.textMuted),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                    borderSide: const BorderSide(color: AppTheme.primaryViolet),
                  ),
                ),
              ),
            ),

          // Horizontal Categories
          Container(
            height: 38,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final cat = _categories[idx];
                final isSelected = clipsProvider.selectedCategory.toLowerCase() == cat.toLowerCase();
                return GestureDetector(
                  onTap: () => clipsProvider.setCategory(cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                        width: 0.5,
                      ),
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
              },
            ),
          ),

          // Clips List
          Expanded(
            child: clipsProvider.isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryViolet))
                : clipsProvider.clips.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.inbox, size: 42, color: AppTheme.inactiveGrey),
                            const SizedBox(height: 12),
                            Text(
                              'No saved clips found',
                              style: GoogleFonts.outfit(fontSize: 16, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: clipsProvider.clips.length,
                        itemBuilder: (ctx, idx) {
                          final clip = clipsProvider.clips[idx];
                          return _buildClipItem(context, clip);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildClipItem(BuildContext context, ClipModel clip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tag and Sync Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: AppTheme.primaryViolet.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  clip.contentType.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryVioletLight,
                  ),
                ),
              ),
              Text(
                clip.exportStatus == 'done' ? '✓ SYNCED' : '⏳ PENDING',
                style: GoogleFonts.inter(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: clip.exportStatus == 'done' ? AppTheme.trendGreen : AppTheme.amberAlert,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Title
          Text(
            clip.title,
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.textWhite,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),

          // Summary
          Text(
            clip.summary,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),

          // Link & Tags Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: clip.tags.map((tag) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
                      ),
                      child: Text(
                        '#$tag',
                        style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                      ),
                    );
                  }).toList(),
                ),
              ),
              IconButton(
                icon: const Icon(LucideIcons.externalLink, size: 16, color: AppTheme.primaryVioletLight),
                onPressed: () async {
                  final uri = Uri.parse(clip.url);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
