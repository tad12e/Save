import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/intent_helper.dart';
import '../../../core/theme.dart';
import '../../../models/clip_model.dart';
import '../../../providers/clips_provider.dart';
import 'extracted_metadata_chips.dart';
import 'source_brand_badge.dart';

class ClipDetailBottomSheet extends StatelessWidget {
  final ClipModel clip;

  const ClipDetailBottomSheet({super.key, required this.clip});

  static Future<void> show(BuildContext context, ClipModel clip) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ClipDetailBottomSheet(clip: clip),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final isFav = clipsProvider.isFavorite(clip.id);
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);
    final deadline = clip.deadlineDate;

    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.45,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppTheme.surfaceCard,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Scrollable Content
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  children: [
                    // Top Row: Intent badge + Domain + Star Button
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: intentStyle.bgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: intentStyle.borderColor),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(intentStyle.icon, size: 12, color: intentStyle.textColor),
                              const SizedBox(width: 4),
                              Text(
                                intentStyle.label,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
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
                        const SizedBox(width: 4),
                        IconButton(
                          icon: Icon(
                            isFav ? LucideIcons.star : LucideIcons.star,
                            color: isFav ? const Color(0xFFF59E0B) : AppTheme.inactiveGrey,
                            fill: isFav ? 1.0 : 0.0,
                            size: 20,
                          ),
                          onPressed: () => clipsProvider.toggleFavorite(clip.id),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Title
                    Text(
                      clip.title,
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Extracted Metadata Chips
                    ExtractedMetadataChips(clip: clip, maxChips: 6),
                    const SizedBox(height: 10),

                    // Date & Status
                    Row(
                      children: [
                        const Icon(LucideIcons.clock, size: 13, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          DateFormat('MMM d, yyyy • h:mm a').format(clip.createdAt),
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: clip.exportStatus == 'done' ? AppTheme.trendGreenBg : AppTheme.amberAlertBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            clip.exportStatus == 'done' ? '✓ Synced' : '⏳ Pending Sync',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: clip.exportStatus == 'done' ? AppTheme.trendGreen : AppTheme.amberAlert,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Structured Data Card (e.g. Deadline, Company, Salary)
                    if (deadline != null || clip.company != null || clip.salary != null)
                      Container(
                        padding: const EdgeInsets.all(14),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceMuted,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'EXTRACTED INTELLIGENCE',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                                color: AppTheme.textMuted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (deadline != null)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.calendarDays, size: 14, color: AppTheme.urgencyRed),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Deadline: ${DateFormat('yyyy-MM-dd').format(deadline)}',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.urgencyRed,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            if (clip.company != null)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.building, size: 14, color: AppTheme.textPrimary),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Company: ${clip.company}',
                                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary),
                                    ),
                                  ],
                                ),
                              ),
                            if (clip.salary != null)
                              Row(
                                children: [
                                  const Icon(LucideIcons.dollarSign, size: 14, color: AppTheme.trendGreen),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Compensation: ${clip.salary}',
                                    style: GoogleFonts.inter(fontSize: 12, color: AppTheme.trendGreen),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),

                    // Summary / Excerpt
                    Text(
                      'Summary & Notes',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderSubtle),
                      ),
                      child: Text(
                        clip.summary.isNotEmpty ? clip.summary : 'No summary provided for this clip.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          height: 1.6,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Tags
                    if (clip.tags.isNotEmpty) ...[
                      Text(
                        'Tags',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: clip.tags.map((tag) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceMuted,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.borderSubtle),
                            ),
                            child: Text(
                              '#$tag',
                              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textPrimary),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Synced Destinations
                    if (clip.destinations.isNotEmpty) ...[
                      Text(
                        'Synced Vaults',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: clip.destinations.map((d) {
                          return Chip(
                            label: Text(d, style: GoogleFonts.inter(fontSize: 11)),
                            avatar: const Icon(LucideIcons.check, size: 13, color: AppTheme.trendGreen),
                            backgroundColor: AppTheme.surfaceMuted,
                            side: const BorderSide(color: AppTheme.borderSubtle),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),

              // Bottom Action Bar
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                decoration: const BoxDecoration(
                  color: AppTheme.surface,
                  border: Border(top: BorderSide(color: AppTheme.borderSubtle)),
                ),
                child: Row(
                  children: [
                    // Copy Link Button
                    IconButton(
                      icon: const Icon(LucideIcons.copy, size: 18),
                      tooltip: 'Copy URL',
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: clip.url));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('URL copied to clipboard!')),
                        );
                      },
                    ),
                    // Delete Button
                    IconButton(
                      icon: const Icon(LucideIcons.trash2, size: 18, color: AppTheme.urgencyRed),
                      tooltip: 'Delete Clip',
                      onPressed: () {
                        clipsProvider.deleteClip(clip.id);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Clip removed from vault')),
                        );
                      },
                    ),
                    const Spacer(),
                    // Open in Browser Button
                    ElevatedButton.icon(
                      icon: const Icon(LucideIcons.externalLink, size: 14, color: Colors.white),
                      label: Text(
                        'Open Source',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryViolet,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        final uri = Uri.parse(clip.url);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
