import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/intent_helper.dart';
import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import 'widgets/batch_actions_bar.dart';
import 'widgets/clip_detail_bottom_sheet.dart';
import 'widgets/clips_filter_bottom_sheet.dart';
import 'widgets/extracted_metadata_chips.dart';
import 'widgets/source_brand_badge.dart';

class ClipsScreen extends StatefulWidget {
  const ClipsScreen({super.key});

  @override
  State<ClipsScreen> createState() => _ClipsScreenState();
}

class _ClipsScreenState extends State<ClipsScreen> {
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  static const List<String> _intents = [
    'all',
    'learn',
    'apply',
    'track',
    'hire',
    'attend',
    'buy',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _cycleViewMode(ClipsProvider provider) {
    if (provider.viewMode == 'cards') {
      provider.setViewMode('list');
    } else if (provider.viewMode == 'list') {
      provider.setViewMode('grid');
    } else {
      provider.setViewMode('cards');
    }
  }

  IconData _getViewModeIcon(String mode) {
    switch (mode) {
      case 'list':
        return LucideIcons.list;
      case 'grid':
        return LucideIcons.layoutGrid;
      case 'cards':
      default:
        return LucideIcons.layers;
    }
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final displayedClips = clipsProvider.clips;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: SafeArea(
          top: true,
          bottom: false,
          child: Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: const BoxDecoration(
              color: AppTheme.surface,
              border: Border(
                bottom: BorderSide(color: AppTheme.borderSubtle, width: 1.0),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Title or Batch Mode Count
                Row(
                  children: [
                    if (clipsProvider.isBatchMode)
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 20, color: AppTheme.textPrimary),
                        onPressed: () => clipsProvider.exitBatchMode(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    if (clipsProvider.isBatchMode) const SizedBox(width: 8),
                    Text(
                      clipsProvider.isBatchMode
                          ? '${clipsProvider.selectedIds.length} Selected'
                          : 'All Clips',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),

                // Action Icons (Search, View Mode, Filter)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!clipsProvider.isBatchMode) ...[
                      // Search Toggle
                      IconButton(
                        icon: Icon(
                          _isSearching ? LucideIcons.x : LucideIcons.search,
                          size: 20,
                          color: _isSearching ? AppTheme.primaryViolet : AppTheme.textPrimary,
                        ),
                        splashRadius: 20,
                        onPressed: () {
                          setState(() {
                            _isSearching = !_isSearching;
                            if (!_isSearching) {
                              _searchController.clear();
                              clipsProvider.setSearchQuery('');
                            }
                          });
                        },
                      ),
                      // View Mode Switcher
                      IconButton(
                        icon: Icon(
                          _getViewModeIcon(clipsProvider.viewMode),
                          size: 19,
                          color: AppTheme.textPrimary,
                        ),
                        splashRadius: 20,
                        tooltip: 'Switch view layout',
                        onPressed: () => _cycleViewMode(clipsProvider),
                      ),
                      // Filter & Sort Bottom Sheet Trigger
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            icon: const Icon(
                              LucideIcons.slidersHorizontal,
                              size: 20,
                              color: AppTheme.textPrimary,
                            ),
                            splashRadius: 20,
                            onPressed: () => ClipsFilterBottomSheet.show(context),
                          ),
                          if (clipsProvider.hasActiveFilters)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppTheme.urgencyRed,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ] else ...[
                      // Batch Mode: Select All Button
                      TextButton(
                        onPressed: () => clipsProvider.selectAll(),
                        child: Text(
                          'Select All',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryViolet,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Expandable Search Input Bar
          if (_isSearching)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
              color: AppTheme.surface,
              child: TextField(
                controller: _searchController,
                autofocus: true,
                onChanged: (val) => clipsProvider.setSearchQuery(val),
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Search title, summary, domain, tags...',
                  hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppTheme.textMuted),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 14),
                          onPressed: () {
                            _searchController.clear();
                            clipsProvider.setSearchQuery('');
                          },
                        )
                      : null,
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

          // Intent Classification Toolbar (Exact Parity with Web Intent Pills)
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: const BoxDecoration(
              color: AppTheme.surface,
              border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
            ),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _intents.length,
              separatorBuilder: (_, index) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final intentKey = _intents[idx];
                final style = ClipIntentHelper.getStyle(intentKey);
                final isSelected = clipsProvider.selectedIntent == intentKey;
                final count = clipsProvider.countForIntent(intentKey);

                return GestureDetector(
                  onTap: () => clipsProvider.setIntent(intentKey),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSelected ? style.bgColor : AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? style.borderColor : AppTheme.borderSubtle,
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          style.icon,
                          size: 13,
                          color: isSelected ? style.textColor : AppTheme.textMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          style.displayName,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? style.textColor : AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Count badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? style.textColor.withValues(alpha: 0.15)
                                : AppTheme.borderSubtle,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$count',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? style.textColor : AppTheme.textMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Main Clips List / Grid / Empty State
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => clipsProvider.loadClips(),
              color: AppTheme.primaryViolet,
              child: clipsProvider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryViolet))
                  : displayedClips.isEmpty
                      ? _buildEmptyState(context, clipsProvider)
                      : _buildClipsContent(context, clipsProvider, displayedClips),
            ),
          ),

          // Batch Mode Bottom Floating Action Bar
          if (clipsProvider.isBatchMode) const BatchActionsBar(),
        ],
      ),
    );
  }

  // --- Layout Switcher ---

  Widget _buildClipsContent(
    BuildContext context,
    ClipsProvider provider,
    List<ClipModel> clips,
  ) {
    switch (provider.viewMode) {
      case 'list':
        return ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: clips.length,
          separatorBuilder: (_, index) => const SizedBox(height: 8),
          itemBuilder: (ctx, idx) => _buildCompactListItem(context, provider, clips[idx]),
        );
      case 'grid':
        return GridView.builder(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.78,
          ),
          itemCount: clips.length,
          itemBuilder: (ctx, idx) => _buildGridCardItem(context, provider, clips[idx]),
        );
      case 'cards':
      default:
        return ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: clips.length,
          itemBuilder: (ctx, idx) => _buildRichCardItem(context, provider, clips[idx]),
        );
    }
  }

  // --- View Mode 1: Rich Magazine Card (Default) ---

  Widget _buildRichCardItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);
    final isSelected = provider.selectedIds.contains(clip.id);
    final isFav = provider.isFavorite(clip.id);

    return Dismissible(
      key: Key(clip.id),
      direction: DismissDirection.horizontal,
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.endToStart) {
          // Swipe left -> Delete
          provider.deleteClip(clip.id);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Clip removed from vault')),
          );
          return true;
        } else {
          // Swipe right -> Toggle Favorite
          provider.toggleFavorite(clip.id);
          return false;
        }
      },
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        color: const Color(0xFFF59E0B),
        child: const Icon(LucideIcons.star, color: Colors.white, size: 22),
      ),
      secondaryBackground: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppTheme.urgencyRed,
        child: const Icon(LucideIcons.trash2, color: Colors.white, size: 22),
      ),
      child: GestureDetector(
        onTap: () {
          if (provider.isBatchMode) {
            provider.toggleSelection(clip.id);
          } else {
            ClipDetailBottomSheet.show(context, clip);
          }
        },
        onLongPress: () => provider.enterBatchMode(clip.id),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF0FDF4) : AppTheme.surfaceCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
              width: isSelected ? 1.5 : 1.0,
            ),
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
              // Top Row: Intent Badge + Domain + Star Action
              Row(
                children: [
                  if (provider.isBatchMode)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(
                        isSelected ? LucideIcons.circleCheck : LucideIcons.circle,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.inactiveGrey,
                        size: 18,
                      ),
                    ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: intentStyle.bgColor,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: intentStyle.borderColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(intentStyle.icon, size: 10, color: intentStyle.textColor),
                        const SizedBox(width: 4),
                        Text(
                          intentStyle.label,
                          style: GoogleFonts.inter(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: intentStyle.textColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: SourceBrandBadge(clip: clip),
                    ),
                  ),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: () => provider.toggleFavorite(clip.id),
                    child: Icon(
                      LucideIcons.star,
                      size: 16,
                      color: isFav ? const Color(0xFFF59E0B) : AppTheme.inactiveGrey,
                      fill: isFav ? 1.0 : 0.0,
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
                  color: AppTheme.textPrimary,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),

              // Summary
              if (clip.summary.isNotEmpty)
                Text(
                  clip.summary,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppTheme.textMuted,
                    height: 1.45,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

              // Extracted Metadata Preview Chips (salary, deadline, GitHub stars, price, reading time)
              ExtractedMetadataChips(clip: clip),
              const SizedBox(height: 10),

              // Footer: Tags + Destination Status + Link Button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        if (clip.deadlineDate != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.urgencyRedBg,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '⏰ DUE SOON',
                              style: GoogleFonts.inter(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.urgencyRed,
                              ),
                            ),
                          ),
                        ...clip.tags.take(2).map((t) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceMuted,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '#$t',
                                style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted),
                              ),
                            )),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        clip.exportStatus == 'done' ? '✓' : '⏳',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: clip.exportStatus == 'done'
                              ? AppTheme.trendGreen
                              : AppTheme.amberAlert,
                        ),
                      ),
                      const SizedBox(width: 4),
                      IconButton(
                        icon: const Icon(LucideIcons.externalLink, size: 15),
                        color: AppTheme.primaryViolet,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
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
            ],
          ),
        ),
      ),
    );
  }

  // --- View Mode 2: Compact List Item ---

  Widget _buildCompactListItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);
    final isFav = provider.isFavorite(clip.id);

    return GestureDetector(
      onTap: () => ClipDetailBottomSheet.show(context, clip),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: intentStyle.bgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(intentStyle.icon, size: 14, color: intentStyle.textColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clip.title,
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      SourceBrandBadge(
                        clip: clip,
                        fontSize: 9,
                        iconSize: 10,
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isFav)
              const Padding(
                padding: EdgeInsets.only(left: 6),
                child: Icon(LucideIcons.star, size: 14, color: Color(0xFFF59E0B)),
              ),
          ],
        ),
      ),
    );
  }

  // --- View Mode 3: Grid Card Item ---

  Widget _buildGridCardItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);

    return GestureDetector(
      onTap: () => ClipDetailBottomSheet.show(context, clip),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: intentStyle.bgColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    intentStyle.label,
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: intentStyle.textColor,
                    ),
                  ),
                ),
                SourceBrandBadge(
                  clip: clip,
                  showFormat: false,
                  fontSize: 8,
                  iconSize: 9,
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              clip.title,
              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            ExtractedMetadataChips(clip: clip, maxChips: 1),
            const Spacer(),
            Text(
              clip.summary,
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // --- Empty State ---

  Widget _buildEmptyState(BuildContext context, ClipsProvider provider) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
        Center(
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(LucideIcons.inbox, size: 32, color: AppTheme.inactiveGrey),
              ),
              const SizedBox(height: 16),
              Text(
                'No clips match your filters',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                provider.hasActiveFilters
                    ? 'Try resetting your intent, status, or search filters.'
                    : 'Save articles, links, or notes to build your vault.',
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                textAlign: TextAlign.center,
              ),
              if (provider.hasActiveFilters) ...[
                const SizedBox(height: 16),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryViolet,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => provider.resetFilters(),
                  child: const Text('Reset All Filters'),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
