import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme.dart';
import '../../../providers/clips_provider.dart';
import 'batch_destination_sheet.dart';
import 'batch_export_sheet.dart';

class BatchActionsBar extends StatelessWidget {
  const BatchActionsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ClipsProvider>(context);
    final selectedCount = provider.selectedIds.length;
    final totalCount = provider.clips.length;
    final isAllSelected = selectedCount > 0 && selectedCount == totalCount;
    final allStarred = provider.areAllSelectedStarred;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: const Border(
          top: BorderSide(color: AppTheme.borderSubtle, width: 1.0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top Control Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.textMuted),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        splashRadius: 16,
                        onPressed: () => provider.exitBatchMode(),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '$selectedCount of $totalCount Selected',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: Icon(
                      isAllSelected ? LucideIcons.checkCheck : LucideIcons.check,
                      size: 14,
                      color: AppTheme.primaryViolet,
                    ),
                    label: Text(
                      isAllSelected ? 'Deselect All' : 'Select All',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryViolet,
                      ),
                    ),
                    onPressed: () {
                      if (isAllSelected) {
                        provider.deselectAll();
                      } else {
                        provider.selectAll();
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 4 Action Buttons Row
              Row(
                children: [
                  // 1. Push to Destination
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: LucideIcons.cloudUpload,
                      label: 'Push',
                      color: AppTheme.primaryViolet,
                      bgColor: AppTheme.primaryVioletBg,
                      enabled: selectedCount > 0,
                      onTap: () => BatchDestinationSheet.show(context),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 2. Favorite / Star Toggle
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: LucideIcons.star,
                      label: allStarred ? 'Unstar' : 'Star',
                      color: const Color(0xFFD97706),
                      bgColor: const Color(0xFFFEF3C7),
                      enabled: selectedCount > 0,
                      onTap: () => provider.toggleStarSelectedClips(),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 3. Export
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: LucideIcons.share2,
                      label: 'Export',
                      color: const Color(0xFF2563EB),
                      bgColor: const Color(0xFFEFF6FF),
                      enabled: selectedCount > 0,
                      onTap: () => BatchExportSheet.show(context),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 4. Delete
                  Expanded(
                    child: _buildActionButton(
                      context: context,
                      icon: LucideIcons.trash2,
                      label: 'Delete',
                      color: AppTheme.urgencyRed,
                      bgColor: AppTheme.urgencyRedBg,
                      enabled: selectedCount > 0,
                      onTap: () => _confirmDelete(context, provider, selectedCount),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required Color bgColor,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return Material(
      color: enabled ? bgColor : AppTheme.surfaceMuted,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: enabled ? color : AppTheme.inactiveGrey,
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: enabled ? color : AppTheme.inactiveGrey,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, ClipsProvider provider, int count) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(LucideIcons.trash2, color: AppTheme.urgencyRed, size: 20),
            const SizedBox(width: 8),
            Text(
              'Delete $count Clips?',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to remove $count selected clip(s) from your vault? This action cannot be undone.',
          style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: AppTheme.textMuted, fontWeight: FontWeight.w500),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.urgencyRed,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              provider.deleteSelectedClips();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$count clips removed from vault'),
                  backgroundColor: AppTheme.urgencyRed,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
