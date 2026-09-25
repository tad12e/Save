import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme.dart';
import '../../../providers/clips_provider.dart';

class BatchExportSheet extends StatelessWidget {
  const BatchExportSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const BatchExportSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ClipsProvider>(context);
    final count = provider.selectedIds.length;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
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

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.share2, size: 20, color: Color(0xFF1D4ED8)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Export $count Selected Clips',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'Choose an export format or share to external apps',
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Option 1: Copy Markdown
            _buildExportOption(
              context: context,
              icon: LucideIcons.fileText,
              iconColor: const Color(0xFF0F766E),
              iconBg: const Color(0xFFF0FDFA),
              title: 'Copy as Markdown',
              subtitle: 'Formatted title, url, summary and tags list for notes',
              onTap: () {
                final md = provider.exportSelectedClipsMarkdown();
                Clipboard.setData(ClipboardData(text: md));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$count clips copied as Markdown to clipboard!'),
                    backgroundColor: AppTheme.trendGreen,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            // Option 2: Copy JSON
            _buildExportOption(
              context: context,
              icon: LucideIcons.code,
              iconColor: const Color(0xFF6D28D9),
              iconBg: const Color(0xFFF5F3FF),
              title: 'Copy as JSON',
              subtitle: 'Structured raw JSON schema for developers and backup',
              onTap: () {
                final json = provider.exportSelectedClipsJson();
                Clipboard.setData(ClipboardData(text: json));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$count clips copied as JSON to clipboard!'),
                    backgroundColor: AppTheme.trendGreen,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            // Option 3: Quick Text Summary
            _buildExportOption(
              context: context,
              icon: LucideIcons.copy,
              iconColor: const Color(0xFFB45309),
              iconBg: const Color(0xFFFEF3C7),
              title: 'Copy Plain Text URLs',
              subtitle: 'List of clean URLs for quick messaging or pasting',
              onTap: () {
                final selectedClips = provider.allClips.where((c) => provider.selectedIds.contains(c.id)).toList();
                final text = selectedClips.map((c) => '${c.title}\n${c.url}').join('\n\n');
                Clipboard.setData(ClipboardData(text: text));
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$count URLs copied to clipboard!'),
                    backgroundColor: AppTheme.trendGreen,
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExportOption({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 18, color: AppTheme.inactiveGrey),
          ],
        ),
      ),
    );
  }
}
