import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';
import '../feed/feed_screen.dart';

/// Mobile Home Page matching Web Home Dashboard architecture.
/// Accommodates:
/// 1. Total Clips
/// 2. Apply Deadline
/// 3. Learn Backlog
/// 4. Sync Health
/// 5. Urgent Deadlines
/// 6. This Week
/// 7. Digest
/// 8. Goal
/// 9. Recent Clips with Intent Classification
class HomeDashboardScreen extends StatefulWidget {
  final Function(int tabIndex) onNavigateTab;
  final VoidCallback? onNotificationTap;

  const HomeDashboardScreen({
    super.key,
    required this.onNavigateTab,
    this.onNotificationTap,
  });

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  String _selectedIntent = 'all';

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final allClips = clipsProvider.clips;
    const expiringCount = 2;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.home(
        greeting: 'Save',
        subtitle: 'Personal Knowledge Vault',
        userInitials: 'T',
        notificationCount: expiringCount,
        onNotificationTap: widget.onNotificationTap,
        onAvatarTap: () => widget.onNavigateTab(4),
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
              // ===============================================================
              // 1-4. Header KPI Metrics Grid:
              // 1. Total Clips, 2. Apply Deadline, 3. Learn Backlog, 4. Sync Health
              // ===============================================================
              _buildKpiMetricsHeader(context, clipsProvider, expiringCount),
              const SizedBox(height: 18),

              // ===============================================================
              // 5. Urgent Deadlines Component Skeleton
              // ===============================================================
              _buildUrgentDeadlinesSkeleton(context, expiringCount),
              const SizedBox(height: 18),

              // ===============================================================
              // 6. This Week Component Skeleton (Save Streak & Top Tags)
              // ===============================================================
              _buildThisWeekSkeleton(context),
              const SizedBox(height: 18),

              // ===============================================================
              // 7. Digest Component Skeleton (Week Digest)
              // ===============================================================
              _buildWeekDigestSkeleton(context),
              const SizedBox(height: 18),

              // ===============================================================
              // 8. Goal Component Skeleton (Daily 10-Clip Goal Ring)
              // ===============================================================
              _buildDailyGoalSkeleton(context),
              const SizedBox(height: 18),

              // ===============================================================
              // 9. Recent Clips with Intent Classification Toolbar
              // ===============================================================
              _buildRecentClipsSkeleton(context, allClips),
              const SizedBox(height: 20),

              // ===============================================================
              // Preserved Secondary Sections: Collections & Analytics Teaser
              // ===============================================================
              _buildAnalyticsTeaserCard(context),
              const SizedBox(height: 18),
              _buildCollectionsSection(context),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 1-4. Header KPI 2×2 Grid (Total Clips, Apply, Learn, Sync Health)
  // ---------------------------------------------------------------------------
  Widget _buildKpiMetricsHeader(BuildContext context, ClipsProvider clips, int expiringCount) {
    return Column(
      children: [
        Row(
          children: [
            // 1. Total Clips (Part 4 Full Implementation)
            Expanded(
              child: _buildTotalClipsCard(context, clips),
            ),
            const SizedBox(width: 12),
            // 2. Apply Deadline
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.calendarDays,
                iconBg: const Color(0xFFFEF3C7),
                iconColor: const Color(0xFFD97706),
                label: 'Apply Deadlines',
                value: '$expiringCount',
                badgeText: '<48h left',
                badgeColor: const Color(0xFFDC2626),
                badgeBg: const Color(0xFFFEE2E2),
                sublabel: '2 active opportunities',
                onTap: () => widget.onNavigateTab(1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            // 3. Learn Backlog
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.graduationCap,
                iconBg: const Color(0xFFE0F2FE),
                iconColor: const Color(0xFF0284C7),
                label: 'Learn Backlog',
                value: '18',
                badgeText: 'Avg 4m read',
                badgeColor: const Color(0xFF0284C7),
                badgeBg: const Color(0xFFE0F2FE),
                sublabel: '5 flagged high priority',
                onTap: () => widget.onNavigateTab(1),
              ),
            ),
            const SizedBox(width: 12),
            // 4. Sync Health
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.network,
                iconBg: const Color(0xFFDCFCE7),
                iconColor: const Color(0xFF2D6A4F),
                label: 'Active Syncs',
                value: '2 Live',
                badgeText: 'Nominal',
                badgeColor: const Color(0xFF16A34A),
                badgeBg: const Color(0xFFDCFCE7),
                sublabel: 'Sheets, Notion, Vault',
                showPulse: true,
                onTap: () => widget.onNavigateTab(1),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// 1. Total Clips Component (Web Parity)
  Widget _buildTotalClipsCard(BuildContext context, ClipsProvider clips) {
    final totalCount = clips.totalClipsCount;
    final savedThisWeek = clips.savedThisWeekCount;
    final isLoading = clips.isLoading && clips.allClips.isEmpty;
    final hasError = clips.error != null && clips.allClips.isEmpty;

    final String valueText;
    final String sublabel;
    final String badgeText;
    final Color badgeColor;
    final Color badgeBg;

    if (isLoading) {
      valueText = '...';
      sublabel = 'Syncing vault...';
      badgeText = 'Loading';
      badgeColor = AppTheme.textMuted;
      badgeBg = const Color(0xFFF1F5F9);
    } else if (hasError) {
      valueText = '!';
      sublabel = 'Tap to retry sync';
      badgeText = 'Offline';
      badgeColor = const Color(0xFFDC2626);
      badgeBg = const Color(0xFFFEE2E2);
    } else if (totalCount == 0) {
      valueText = '0';
      sublabel = 'No saves yet';
      badgeText = 'Empty';
      badgeColor = AppTheme.textMuted;
      badgeBg = const Color(0xFFF1F5F9);
    } else {
      valueText = '$totalCount';
      sublabel = savedThisWeek == 1 ? '1 saved this week' : '$savedThisWeek saved this week';
      badgeText = '+12% mo';
      badgeColor = const Color(0xFF16A34A);
      badgeBg = const Color(0xFFDCFCE7);
    }

    return _buildKpiCard(
      icon: LucideIcons.bookmark,
      iconBg: const Color(0xFFDCFCE7),
      iconColor: const Color(0xFF16A34A),
      label: 'Total Clips',
      value: valueText,
      badgeText: badgeText,
      badgeColor: badgeColor,
      badgeBg: badgeBg,
      sublabel: sublabel,
      onTap: () {
        if (hasError) {
          clips.loadClips();
        } else {
          widget.onNavigateTab(1); // Jump to Feed/Clips view
        }
      },
    );
  }

  Widget _buildKpiCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String label,
    required String value,
    required String badgeText,
    required Color badgeColor,
    required Color badgeBg,
    required String sublabel,
    bool showPulse = false,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(13),
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
                    color: iconBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 16, color: iconColor),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showPulse) ...[
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: const BoxDecoration(
                            color: Color(0xFF16A34A),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                      Text(
                        badgeText,
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: badgeColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              sublabel,
              style: GoogleFonts.inter(
                fontSize: 10,
                color: AppTheme.textMuted,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Urgent Deadlines Skeleton
  // ---------------------------------------------------------------------------
  Widget _buildUrgentDeadlinesSkeleton(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(LucideIcons.alarmClock, size: 16, color: Color(0xFFD97706)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Urgent Deadlines',
                    style: GoogleFonts.outfit(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$count Actions',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFB45309),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Skeleton item
          _buildDeadlinesChecklistItem(
            title: 'Senior Staff Engineer - AI Infrastructure',
            dueText: 'Due Tomorrow',
            isUrgent: true,
          ),
          const SizedBox(height: 8),
          _buildDeadlinesChecklistItem(
            title: 'Robotics Research Grant Application',
            dueText: 'Due in 3 days',
            isUrgent: false,
          ),
        ],
      ),
    );
  }

  Widget _buildDeadlinesChecklistItem({
    required String title,
    required String dueText,
    required bool isUrgent,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isUrgent ? const Color(0xFFDC2626) : const Color(0xFFF59E0B),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  dueText,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    color: isUrgent ? const Color(0xFFDC2626) : AppTheme.textMuted,
                    fontWeight: isUrgent ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Snooze',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(LucideIcons.circleCheck, size: 16, color: Color(0xFF16A34A)),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 6. This Week Skeleton (Save Streak & Top Tags)
  // ---------------------------------------------------------------------------
  Widget _buildThisWeekSkeleton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.flame, size: 18, color: Color(0xFFEA580C)),
                  const SizedBox(width: 6),
                  Text(
                    'This Week & Save Streak',
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
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Best 14d',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFC2410C),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 7-day M-T-W-T-F-S-S dot matrix skeleton
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStreakDot('M', true),
              _buildStreakDot('T', true),
              _buildStreakDot('W', true),
              _buildStreakDot('T', true),
              _buildStreakDot('F', true),
              _buildStreakDot('S', false),
              _buildStreakDot('S', false),
            ],
          ),
          const SizedBox(height: 12),
          // Top Tags Chips
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _buildTagChip('ai', 14),
              _buildTagChip('engineering', 11),
              _buildTagChip('systems', 8),
              _buildTagChip('research', 6),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStreakDot(String day, bool active) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: active ? const Color(0xFFEA580C) : const Color(0xFFF1F5F9),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Icon(
              active ? LucideIcons.check : LucideIcons.minus,
              size: 14,
              color: active ? Colors.white : AppTheme.inactiveGrey,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          day,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: active ? const Color(0xFFEA580C) : AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildTagChip(String tag, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '#$tag ($count)',
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Digest Skeleton (Week Digest)
  // ---------------------------------------------------------------------------
  Widget _buildWeekDigestSkeleton(BuildContext context) {
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
                  Text(
                    'WEEK DIGEST',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: const Color(0xFF2D6A4F),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'AI SYNTHESIS',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '14 saves',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Top story: Designing Better AI Interfaces & Canvas Workflows. 4 opportunities tracked this week.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  height: 1.4,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 10),
              GestureDetector(
                onTap: () => widget.onNavigateTab(1),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View digest stream',
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
  // 8. Goal Skeleton (Daily 10-Clip Goal Ring)
  // ---------------------------------------------------------------------------
  Widget _buildDailyGoalSkeleton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
      child: Row(
        children: [
          // Radial progress ring placeholder
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF2D6A4F), width: 5),
            ),
            child: Center(
              child: Text(
                '3/10',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'DAILY GOAL',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: const Color(0xFF2D6A4F),
                      ),
                    ),
                    Text(
                      '30% done',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '3 of 10 items saved today',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: const LinearProgressIndicator(
                    value: 0.3,
                    minHeight: 6,
                    backgroundColor: Color(0xFFF1F5F9),
                    color: Color(0xFF2D6A4F),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Recent Clips & Intent Toolbar Skeleton
  // ---------------------------------------------------------------------------
  Widget _buildRecentClipsSkeleton(BuildContext context, List<ClipModel> allClips) {
    final sampleClips = allClips.isNotEmpty
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
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Clips',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onNavigateTab(1),
              child: Row(
                children: [
                  Text(
                    'See all (${allClips.length})',
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
        const SizedBox(height: 10),

        // Intent Filter Toolbar Skeleton
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: [
              _buildIntentFilterPill('All', 'all', allClips.length),
              _buildIntentFilterPill('Apply', 'apply', 4),
              _buildIntentFilterPill('Learn', 'learn', 18),
              _buildIntentFilterPill('Track', 'track', 7),
              _buildIntentFilterPill('Hire', 'hire', 2),
            ],
          ),
        ),
        const SizedBox(height: 12),

        ...sampleClips.map((clip) => _buildRecentClipCard(context, clip)),
      ],
    );
  }

  Widget _buildIntentFilterPill(String label, String id, int count) {
    final isSelected = _selectedIntent == id;
    return GestureDetector(
      onTap: () => setState(() => _selectedIntent = id),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2D6A4F) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF2D6A4F) : AppTheme.borderSubtle,
            width: 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? Colors.white : AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: GoogleFonts.inter(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppTheme.textMuted,
                ),
              ),
            ),
          ],
        ),
      ),
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
                    'LEARN',
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

  // ---------------------------------------------------------------------------
  // Preserved Secondary Sections: Analytics Teaser & Collections
  // ---------------------------------------------------------------------------
  Widget _buildAnalyticsTeaserCard(BuildContext context) {
    return GestureDetector(
      onTap: () => widget.onNavigateTab(3),
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
              onTap: () => widget.onNavigateTab(1),
              child: Row(
                children: [
                  Text(
                    'View all',
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
        Row(
          children: [
            Expanded(child: _buildCollectionCard(collections[0])),
            const SizedBox(width: 12),
            Expanded(child: _buildCollectionCard(collections[1])),
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
}
