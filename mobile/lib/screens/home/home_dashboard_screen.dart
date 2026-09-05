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
import '../feed/feed_screen.dart';

class HomeDashboardScreen extends StatelessWidget {
  final Function(int tabIndex) onNavigateTab;
  final VoidCallback? onNotificationTap;

  const HomeDashboardScreen({
    super.key,
    required this.onNavigateTab,
    this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final allClips = clipsProvider.clips;
    final totalCount = allClips.isNotEmpty ? allClips.length : 48;
    final expiringCount = 2; // Expiring soon clips

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.home(
        greeting: 'Save',
        subtitle: 'Personal Knowledge Vault',
        userInitials: 'T',
        notificationCount: expiringCount,
        onNotificationTap: onNotificationTap,
        onAvatarTap: () => onNavigateTab(4), // Navigate to Profile/Settings
      ),
      body: RefreshIndicator(
        onRefresh: () => Provider.of<ClipsProvider>(context, listen: false).loadClips(),
        color: const Color(0xFF2D6A4F),
        backgroundColor: Colors.white,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section 1: Overview Summary Cards (2x2 Grid)
              _buildStatsGrid(totalCount, expiringCount),
              const SizedBox(height: 14),

              // Section 2: Urgency Alert Strip
              if (expiringCount > 0) ...[
                _buildUrgencyAlertStrip(context, expiringCount),
                const SizedBox(height: 14),
              ],

              // Section 3: Weekly AI Digest Card
              _buildWeeklyDigestCard(context),
              const SizedBox(height: 20),

              // Section 4: Analytics Insights Teaser Banner
              _buildAnalyticsTeaserCard(context),
              const SizedBox(height: 20),

              // Section 5: Collections Vaults Grid
              _buildCollectionsSection(context),
              const SizedBox(height: 20),

              // Section 6: Recent Saves List
              _buildRecentSavesSection(context, allClips),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 1: 2×2 Overview Stats Grid
  // ---------------------------------------------------------------------------
  Widget _buildStatsGrid(int totalClips, int expiringCount) {
    return Column(
      children: [
        Row(
          children: [
            // Card 1: Total Saves
            Expanded(
              child: _buildMiniCard(
                icon: LucideIcons.bookmark,
                iconBgColor: const Color(0xFFDCFCE7),
                iconColor: const Color(0xFF16A34A),
                numberText: '$totalClips',
                label: 'Total Saved',
                trendText: '+12 this week',
                trendColor: const Color(0xFF16A34A),
              ),
            ),
            const SizedBox(width: 12),
            // Card 2: Collections
            Expanded(
              child: _buildMiniCard(
                icon: LucideIcons.folder,
                iconBgColor: const Color(0xFFF1F5F9),
                iconColor: const Color(0xFF2D6A4F),
                numberText: '6',
                label: 'Collections',
                trendText: 'AI, Engineering...',
                trendColor: AppTheme.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            // Card 3: Expiring soon
            Expanded(
              child: _buildMiniCard(
                icon: LucideIcons.clock,
                iconBgColor: expiringCount > 0 ? AppTheme.amberAlertBg : const Color(0xFFF1F5F9),
                iconColor: expiringCount > 0 ? AppTheme.amberAlert : AppTheme.textMuted,
                numberText: '$expiringCount',
                label: expiringCount > 0 ? 'Act Now' : 'Expiring Soon',
                trendText: expiringCount > 0 ? 'Review & export' : 'All clear',
                trendColor: expiringCount > 0 ? AppTheme.amberAlert : const Color(0xFF16A34A),
              ),
            ),
            const SizedBox(width: 12),
            // Card 4: AI Enriched
            Expanded(
              child: _buildMiniCard(
                icon: LucideIcons.sparkles,
                iconBgColor: const Color(0xFFDCFCE7),
                iconColor: const Color(0xFF16A34A),
                numberText: '98%',
                label: 'AI Processed',
                trendText: 'Auto-categorized',
                trendColor: const Color(0xFF16A34A),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMiniCard({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String numberText,
    required String label,
    required String trendText,
    required Color trendColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Icon(icon, size: 16, color: iconColor),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            numberText,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            trendText,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: trendColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 2: Urgency Alert Strip
  // ---------------------------------------------------------------------------
  Widget _buildUrgencyAlertStrip(BuildContext context, int expiringCount) {
    return GestureDetector(
      onTap: () => onNavigateTab(1), // Go to Feed tab
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.amberAlertBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderAmber, width: 1.0),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.triangleAlert, size: 18, color: AppTheme.amberAlert),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '⚠️ $expiringCount clips expire tomorrow — tap to review',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF92400E),
                ),
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 16, color: AppTheme.amberAlert),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 3: Weekly AI Digest Card
  // ---------------------------------------------------------------------------
  Widget _buildWeeklyDigestCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(
              left: BorderSide(
                color: Color(0xFF2D6A4F),
                width: 4,
              ),
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.sparkles, size: 16, color: Color(0xFF2D6A4F)),
                      const SizedBox(width: 6),
                      Text(
                        "This week's digest",
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'AI SUMMARY',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Captured 14 senior engineering roles with focus on React & AI, and 4 scholarship deadlines in robotics and systems.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  height: 1.45,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () => onNavigateTab(1), // Go to Feed
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View full digest',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D6A4F),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(LucideIcons.arrowRight, size: 14, color: Color(0xFF2D6A4F)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 4: Analytics Teaser Card (Jumps to Analytics Tab)
  // ---------------------------------------------------------------------------
  Widget _buildAnalyticsTeaserCard(BuildContext context) {
    return GestureDetector(
      onTap: () => onNavigateTab(3), // Navigate to Analytics Tab
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(LucideIcons.chartColumn, size: 20, color: Color(0xFF16A34A)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Saving Analytics & Heatmap',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'View daily rhythm, density & category breakdown',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 18, color: Color(0xFF2D6A4F)),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 5: Collections Section
  // ---------------------------------------------------------------------------
  Widget _buildCollectionsSection(BuildContext context) {
    final collections = [
      {
        'title': 'AI & Machine Learning',
        'count': 342,
        'recent': '+12 new',
        'icon': LucideIcons.bot,
        'accent': const Color(0xFF10B981),
      },
      {
        'title': 'Engineering & Systems',
        'count': 418,
        'recent': '+8 new',
        'icon': LucideIcons.code,
        'accent': const Color(0xFF2D6A4F),
      },
      {
        'title': 'Research & Papers',
        'count': 186,
        'recent': '+5 new',
        'icon': LucideIcons.fileText,
        'accent': const Color(0xFF06B6D4),
      },
      {
        'title': 'Design & UI/UX',
        'count': 224,
        'recent': '+14 new',
        'icon': LucideIcons.palette,
        'accent': const Color(0xFFF59E0B),
      },
      {
        'title': 'Electronics & IoT',
        'count': 95,
        'recent': '+2 new',
        'icon': LucideIcons.cpu,
        'accent': const Color(0xFF8B5CF6),
      },
      {
        'title': 'Product & Inspiration',
        'count': 104,
        'recent': '+11 new',
        'icon': LucideIcons.sparkles,
        'accent': const Color(0xFFEC4899),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Collections',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab(1), // Go to Feed
              child: Row(
                children: [
                  Text(
                    'View all (6)',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2D6A4F),
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(LucideIcons.chevronRight, size: 14, color: Color(0xFF2D6A4F)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Column(
          children: [
            Row(
              children: [
                Expanded(child: _buildCollectionCard(collections[0])),
                const SizedBox(width: 12),
                Expanded(child: _buildCollectionCard(collections[1])),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildCollectionCard(collections[2])),
                const SizedBox(width: 12),
                Expanded(child: _buildCollectionCard(collections[3])),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCollectionCard(Map<String, dynamic> col) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: (col['accent'] as Color).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  col['icon'] as IconData,
                  size: 16,
                  color: col['accent'] as Color,
                ),
              ),
              Text(
                '${col['count']}',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            col['title'] as String,
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            col['recent'] as String,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF16A34A),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 6: Recent Saves Section
  // ---------------------------------------------------------------------------
  Widget _buildRecentSavesSection(BuildContext context, List<ClipModel> allClips) {
    final sampleRecentSaves = allClips.isNotEmpty
        ? allClips.take(3).toList()
        : [
            ClipModel(
              id: '1',
              url: 'https://uxdesign.cc/designing-better-ai-interfaces',
              title: 'Designing Better AI Interfaces & Canvas Workflows',
              summary: 'Comprehensive design system guide for AI canvas and node streaming.',
              contentType: 'Articles',
              tags: ['ai', 'design'],
              sourcePlatform: 'web',
              sourceAuthor: 'uxdesign.cc',
              status: 'done',
              exportStatus: 'done',
              createdAt: DateTime.now().subtract(const Duration(minutes: 12)),
            ),
            ClipModel(
              id: '2',
              url: 'https://arxiv.org/abs/2403.09812',
              title: 'Understanding Transformers & KV Cache Optimization',
              summary: 'Deep architectural paper analyzing multi-head latency and throughput.',
              contentType: 'Research',
              tags: ['ml', 'system-design'],
              sourcePlatform: 'arxiv.org',
              sourceAuthor: 'Ashish Vaswani et al.',
              status: 'done',
              exportStatus: 'done',
              createdAt: DateTime.now().subtract(const Duration(minutes: 34)),
            ),
            ClipModel(
              id: '3',
              url: 'https://github.com/kicad/automation-guide',
              title: 'KiCad 8.0 PCB Automation & Python Scripting Guide',
              summary: 'Step-by-step schematic generation and automated Gerber export.',
              contentType: 'Hardware',
              tags: ['pcb', 'automation'],
              sourcePlatform: 'github.com',
              sourceAuthor: 'KiCad Guild',
              status: 'done',
              exportStatus: 'done',
              createdAt: DateTime.now().subtract(const Duration(hours: 1)),
            ),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Saves',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab(1), // Jump to Feed tab
              child: Row(
                children: [
                  Text(
                    'See all (48)',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2D6A4F),
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(LucideIcons.chevronRight, size: 14, color: Color(0xFF2D6A4F)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...sampleRecentSaves.map((clip) => _buildRecentClipCard(context, clip)),
      ],
    );
  }

  Widget _buildRecentClipCard(BuildContext context, ClipModel clip) {
    return GestureDetector(
      onTap: () => XStyleInAppBrowserModal.show(context, clip),
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
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
                Text(
                  clip.sourceAuthor.isNotEmpty ? clip.sourceAuthor : 'web',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              clip.title,
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              clip.summary,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppTheme.textMuted,
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
