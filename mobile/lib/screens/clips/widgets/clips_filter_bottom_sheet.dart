import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../../core/theme.dart';
import '../../../providers/clips_provider.dart';

class ClipsFilterBottomSheet extends StatelessWidget {
  const ClipsFilterBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const ClipsFilterBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clips = Provider.of<ClipsProvider>(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.borderSubtle,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.slidersHorizontal, size: 18, color: AppTheme.textPrimary),
                    const SizedBox(width: 8),
                    Text(
                      'Filter & Sort Clips',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                if (clips.hasActiveFilters)
                  TextButton(
                    onPressed: () => clips.resetFilters(),
                    child: Text(
                      'Reset All',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.urgencyRed,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            // Section 1: Sort By
            Text(
              'SORT BY',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _buildSortChip(context, clips, 'newest', 'Newest First', LucideIcons.arrowDown),
                _buildSortChip(context, clips, 'oldest', 'Oldest First', LucideIcons.arrowUp),
                _buildSortChip(context, clips, 'title', 'Title (A-Z)', LucideIcons.type),
                _buildSortChip(context, clips, 'deadline', 'Upcoming Deadline', LucideIcons.calendarDays),
              ],
            ),
            const SizedBox(height: 20),

            // Section 2: Starred Toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.star, size: 16, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Favorites & Starred Only',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                  Switch.adaptive(
                    value: clips.favoritesOnly,
                    activeTrackColor: AppTheme.primaryViolet,
                    onChanged: (val) => clips.setFavoritesOnly(val),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Section 3: Content Type Filter
            Text(
              'CONTENT TYPE',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildTypeChip(context, clips, 'all', 'All', LucideIcons.layers),
                _buildTypeChip(context, clips, 'video', 'Video', LucideIcons.video),
                _buildTypeChip(context, clips, 'article', 'Article', LucideIcons.fileText),
                _buildTypeChip(context, clips, 'audio', 'Audio', LucideIcons.headphones),
                _buildTypeChip(context, clips, 'code', 'Code', LucideIcons.code),
                _buildTypeChip(context, clips, 'job', 'Jobs', LucideIcons.briefcase),
              ],
            ),
            const SizedBox(height: 20),

            // Section 4: Deadline Filter
            Text(
              'DEADLINE & SCHEDULE',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildDeadlineChip(context, clips, 'all', 'All Dates'),
                _buildDeadlineChip(context, clips, 'has_deadline', 'Has Deadline'),
                _buildDeadlineChip(context, clips, 'this_week', 'Due This Week'),
                _buildDeadlineChip(context, clips, 'overdue', 'Overdue'),
                _buildDeadlineChip(context, clips, 'upcoming', 'Upcoming'),
              ],
            ),
            const SizedBox(height: 20),

            // Section 5: Sync Status
            Text(
              'SYNC STATUS',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _buildStatusChip(context, clips, 'all', 'All Statuses')),
                const SizedBox(width: 8),
                Expanded(child: _buildStatusChip(context, clips, 'synced', 'Synced')),
                const SizedBox(width: 8),
                Expanded(child: _buildStatusChip(context, clips, 'pending', 'Pending')),
              ],
            ),
            const SizedBox(height: 24),

            // Action Button
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryViolet,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'Show ${clips.clips.length} Clips',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortChip(
    BuildContext context,
    ClipsProvider clips,
    String key,
    String label,
    IconData icon,
  ) {
    final isSelected = clips.sortBy == key;
    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: isSelected ? Colors.white : AppTheme.textMuted,
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: isSelected,
      selectedColor: AppTheme.primaryViolet,
      backgroundColor: AppTheme.surfaceMuted,
      labelStyle: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textPrimary,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
      ),
      onSelected: (_) => clips.setSortBy(key),
    );
  }

  Widget _buildTypeChip(
    BuildContext context,
    ClipsProvider clips,
    String key,
    String label,
    IconData icon,
  ) {
    final isSelected = clips.selectedContentType == key;
    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: isSelected ? Colors.white : AppTheme.textMuted,
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: isSelected,
      selectedColor: AppTheme.primaryViolet,
      backgroundColor: AppTheme.surfaceMuted,
      labelStyle: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textPrimary,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
      ),
      onSelected: (_) => clips.setContentType(key),
    );
  }

  Widget _buildDeadlineChip(
    BuildContext context,
    ClipsProvider clips,
    String key,
    String label,
  ) {
    final isSelected = clips.selectedDeadlineFilter == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppTheme.primaryViolet,
      backgroundColor: AppTheme.surfaceMuted,
      labelStyle: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textPrimary,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
      ),
      onSelected: (_) => clips.setDeadlineFilter(key),
    );
  }

  Widget _buildStatusChip(
    BuildContext context,
    ClipsProvider clips,
    String status,
    String label,
  ) {
    final isSelected = clips.selectedStatus == status;
    return GestureDetector(
      onTap: () => clips.setFilterStatus(status),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryViolet : AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? Colors.white : AppTheme.textPrimary,
            ),
          ),
        ),
      ),
    );
  }
}
