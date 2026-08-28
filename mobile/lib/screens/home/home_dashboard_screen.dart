import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';
import '../../widgets/mini_area_chart.dart';

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
    final expiringCount = 2; // urgent clips expiring within 3 days

    return Scaffold(
      backgroundColor: AppTheme.background,
      // Section 1: Variation 1 — Home screen header
      appBar: AppHeader.home(
        greeting: 'Good morning, Tadiwos 👋',
        subtitle: 'You have $expiringCount items expiring soon',
        userInitials: 'T',
        notificationCount: expiringCount,
        onNotificationTap: onNotificationTap,
        onAvatarTap: () => onNavigateTab(3), // Navigate to Profile
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 2: Stats row — 4 mini cards in 2×2 grid
            _buildStatsGrid(totalCount, expiringCount),
            const SizedBox(height: 14),

            // Section 3: Urgency alert strip (shows when clips expire in 3 days or less)
            if (expiringCount > 0) ...[
              _buildUrgencyAlertStrip(context, expiringCount),
              const SizedBox(height: 14),
            ],

            // Section 4: Weekly digest card
            _buildWeeklyDigestCard(context),
            const SizedBox(height: 14),

            // Section 5: Clips over time mini chart (140px area chart)
            const MiniAreaChart(),
            const SizedBox(height: 20),

            // Section 6: Recent clips section (3 stacked cards)
            _buildRecentClipsSection(context, allClips),
            const SizedBox(height: 20),

            // Section 7: Jobs pipeline mini row
            _buildJobsPipelineRow(context),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 2: 2×2 Stats Grid
  // ---------------------------------------------------------------------------
  Widget _buildStatsGrid(int totalClips, int expiringCount) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = (constraints.maxWidth - 12) / 2;

        return Column(
          children: [
            Row(
              children: [
                // Card 1: Total clips
                SizedBox(
                  width: cardWidth,
                  child: _buildMiniCard(
                    icon: LucideIcons.bookmark,
                    iconBgColor: AppTheme.primaryViolet,
                    iconColor: Colors.white,
                    numberWidget: _buildAnimatedCount(totalClips),
                    label: 'Total clips',
                    trendText: '+12 this week',
                    trendColor: AppTheme.trendGreen,
                  ),
                ),
                const SizedBox(width: 12),
                // Card 2: This week
                SizedBox(
                  width: cardWidth,
                  child: _buildMiniCard(
                    icon: LucideIcons.calendar,
                    iconBgColor: AppTheme.background,
                    iconColor: AppTheme.textMuted,
                    numberWidget: Text(
                      '18',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                    label: 'This week',
                    trendText: 'vs 8 last week',
                    trendColor: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                // Card 3: Expiring soon
                SizedBox(
                  width: cardWidth,
                  child: _buildMiniCard(
                    icon: LucideIcons.clock,
                    iconBgColor: expiringCount > 0
                        ? AppTheme.urgencyRed.withValues(alpha: 0.15)
                        : AppTheme.background,
                    iconColor: expiringCount > 0 ? AppTheme.urgencyRed : AppTheme.textMuted,
                    numberWidget: Text(
                      '$expiringCount',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: expiringCount > 0 ? AppTheme.urgencyRed : AppTheme.textWhite,
                      ),
                    ),
                    label: expiringCount > 0 ? 'Act now' : 'Expiring soon',
                    trendText: expiringCount > 0 ? 'Review & export' : 'All clear',
                    trendColor: expiringCount > 0 ? AppTheme.urgencyRed : AppTheme.trendGreen,
                  ),
                ),
                const SizedBox(width: 12),
                // Card 4: Connected destinations
                SizedBox(
                  width: cardWidth,
                  child: _buildMiniCard(
                    icon: LucideIcons.plug,
                    iconBgColor: AppTheme.background,
                    iconColor: AppTheme.primaryVioletLight,
                    numberWidget: Text(
                      '4',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                    label: 'destinations',
                    trendText: 'Google Sheets, Notion...',
                    trendColor: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildMiniCard({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required Widget numberWidget,
    required String label,
    required String trendText,
    required Color trendColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon Circle
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
          // Number
          numberWidget,
          const SizedBox(height: 2),
          // Label
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 4),
          // Trend
          Text(
            trendText,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: trendColor,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedCount(int endVal) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: endVal),
      duration: const Duration(milliseconds: 900),
      builder: (context, val, _) {
        return Text(
          '$val',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppTheme.textWhite,
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Section 3: Urgency Alert Strip
  // ---------------------------------------------------------------------------
  Widget _buildUrgencyAlertStrip(BuildContext context, int expiringCount) {
    return GestureDetector(
      onTap: () {
        // Tapping opens clips filtered by expiry
        onNavigateTab(1); // Go to Clips
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.amberAlert,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, size: 18, color: Colors.black87),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                '⚠️ $expiringCount clips expire tomorrow — tap to review',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.black,
                ),
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 16, color: Colors.black54),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 4: Weekly Digest Card
  // ---------------------------------------------------------------------------
  Widget _buildWeeklyDigestCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(
              left: BorderSide(
                color: AppTheme.primaryViolet,
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
                      const Icon(LucideIcons.sparkles, size: 16, color: AppTheme.primaryVioletLight),
                      const SizedBox(width: 6),
                      Text(
                        "This week's digest",
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textWhite,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryViolet.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'AI SUMMARY',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryVioletLight,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Body: 2 line AI summary
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
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Opening full digest breakdown...'),
                      backgroundColor: AppTheme.surfaceCard,
                    ),
                  );
                },
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View full digest',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryVioletLight,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(LucideIcons.arrowRight, size: 14, color: AppTheme.primaryVioletLight),
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
  // Section 6: Recent Clips Section (3 clip cards stacked)
  // ---------------------------------------------------------------------------
  Widget _buildRecentClipsSection(BuildContext context, List<ClipModel> allClips) {
    // Take 3 items or use demo items if empty
    final displayClips = allClips.isNotEmpty
        ? allClips.take(3).toList()
        : [
            ClipModel(
              id: '1',
              url: 'https://vercel.com/careers/senior-frontend',
              title: 'Senior Frontend Engineer (Next.js & AI Apps)',
              summary: 'Remote worldwide role offering \$160k - \$190k + equity. Working on edge runtimes.',
              contentType: 'Jobs',
              tags: ['react', 'nextjs', 'remote'],
              sourcePlatform: 'linkedin',
              sourceAuthor: 'Vercel Careers',
              status: 'done',
              exportStatus: 'done',
              createdAt: DateTime.now().subtract(const Duration(hours: 2)),
            ),
            ClipModel(
              id: '2',
              url: 'https://news.ycombinator.com/item?id=384912',
              title: 'Building Universal Context Windows for Local LLMs',
              summary: 'Deep architectural discussion on embedding retrieval and prompt chunking optimization.',
              contentType: 'Articles',
              tags: ['ai', 'architecture'],
              sourcePlatform: 'x_twitter',
              sourceAuthor: '@karpathy',
              status: 'done',
              exportStatus: 'done',
              createdAt: DateTime.now().subtract(const Duration(hours: 5)),
            ),
            ClipModel(
              id: '3',
              url: 'https://github.com/astral-sh/uv',
              title: 'Astral UV: Extremely Fast Python Package Manager',
              summary: 'Replacing pip, pip-tools, virtualenv with an extremely fast 10-100x Rust-based engine.',
              contentType: 'Tools',
              tags: ['python', 'rust', 'tools'],
              sourcePlatform: 'web',
              sourceAuthor: 'Astral Software',
              status: 'done',
              exportStatus: 'pending',
              createdAt: DateTime.now().subtract(const Duration(hours: 12)),
            ),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title + See all
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent saves',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textWhite,
              ),
            ),
            GestureDetector(
              onTap: () => onNavigateTab(1), // Go to Clips tab
              child: Row(
                children: [
                  Text(
                    'See all',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primaryVioletLight,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(LucideIcons.arrowRight, size: 14, color: AppTheme.primaryVioletLight),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // 3 Cards stacked
        ...displayClips.map((clip) => _buildRecentClipCard(context, clip)),
      ],
    );
  }

  Widget _buildRecentClipCard(BuildContext context, ClipModel clip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
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
          const SizedBox(height: 6),
          Text(
            clip.title,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textWhite,
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
    );
  }

  // ---------------------------------------------------------------------------
  // Section 7: Jobs Pipeline Mini Row
  // ---------------------------------------------------------------------------
  Widget _buildJobsPipelineRow(BuildContext context) {
    return GestureDetector(
      onTap: () => onNavigateTab(2), // Jump to Jobs tab
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.briefcase, size: 16, color: AppTheme.primaryVioletLight),
                    const SizedBox(width: 8),
                    Text(
                      'Job pipeline',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textWhite,
                      ),
                    ),
                  ],
                ),
                const Icon(LucideIcons.chevronRight, size: 16, color: AppTheme.inactiveGrey),
              ],
            ),
            const SizedBox(height: 12),
            // 4 Column counts: Saved 12 | Applied 4 | Interview 2 | Offer 0
            Row(
              children: [
                _buildPipelineColumn('Saved', '12', AppTheme.primaryVioletLight),
                _buildPipelineDivider(),
                _buildPipelineColumn('Applied', '4', AppTheme.amberAlert),
                _buildPipelineDivider(),
                _buildPipelineColumn('Interview', '2', Colors.cyanAccent),
                _buildPipelineDivider(),
                _buildPipelineColumn('Offer', '0', AppTheme.trendGreen),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPipelineColumn(String stage, String count, Color accentColor) {
    return Expanded(
      child: Column(
        children: [
          Text(
            count,
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: accentColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            stage,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPipelineDivider() {
    return Container(
      width: 1,
      height: 24,
      color: AppTheme.borderSubtle,
    );
  }
}
