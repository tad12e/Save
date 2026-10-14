import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/intent_helper.dart';
import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';
import '../../widgets/save_clip_bottom_sheet.dart';
import '../clips/clips_screen.dart';
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
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;
    final allClips = clipsProvider.clips;

    // Real expiring clips (deadline in next 7 days or overdue, not done/archived)
    final now = DateTime.now();
    final sevenDaysAhead = now.add(const Duration(days: 7));
    final urgentClips = clipsProvider.allClips.where((c) {
      if (c.deadline == null) return false;
      if (c.status == 'done' || c.status == 'archived') return false;
      return c.deadline!.isBefore(sevenDaysAhead);
    }).toList();
    final expiringCount = urgentClips.length;

    // Dynamic greeting based on time of day and authenticated user
    final hour = now.hour;
    final timeGreeting = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';
    final displayName = user != null && user.name.trim().isNotEmpty
        ? user.name.trim().split(' ').first
        : (user != null && user.email.isNotEmpty ? user.email.split('@').first : 'there');
    final greeting = '$timeGreeting, $displayName 👋';

    // Dynamic user initials
    String userInitials = 'S';
    if (user != null) {
      if (user.name.trim().isNotEmpty) {
        final parts = user.name.trim().split(' ').where((p) => p.isNotEmpty).toList();
        if (parts.length >= 2) {
          userInitials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
        } else if (parts.isNotEmpty) {
          userInitials = parts[0][0].toUpperCase();
        }
      } else if (user.email.isNotEmpty) {
        userInitials = user.email[0].toUpperCase();
      }
    } else {
      userInitials = 'G'; // Guest mode
    }

    final subtitle = expiringCount > 0
        ? (expiringCount == 1 ? '1 item expiring soon' : '$expiringCount items expiring soon')
        : (clipsProvider.allClips.isEmpty
            ? 'Personal Knowledge Vault'
            : '${clipsProvider.totalClipsCount} items in your vault');

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.home(
        greeting: greeting,
        subtitle: subtitle,
        userInitials: userInitials,
        notificationCount: expiringCount,
        onNotificationTap: widget.onNotificationTap ?? () => _showNotificationsSheet(context, urgentClips),
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
              // 5. Urgent Deadlines Component (Real Clips with Live Snooze & Complete Actions)
              // ===============================================================
              _buildUrgentDeadlinesSection(context, clipsProvider),
              const SizedBox(height: 18),

              // ===============================================================
              // 6. This Week Component (Live Save Streak & Top Tags)
              // ===============================================================
              _buildThisWeekSection(context, clipsProvider),
              const SizedBox(height: 18),

              // ===============================================================
              // 7. Digest Component (Live Week Digest & AI Synthesis)
              // ===============================================================
              _buildWeekDigestSection(context, clipsProvider),
              const SizedBox(height: 18),

              // ===============================================================
              // 8. Goal Component (Live Daily 10-Clip Goal Tracker & Ring)
              // ===============================================================
              _buildDailyGoalSection(context, clipsProvider),
              const SizedBox(height: 18),

              // ===============================================================
              // 9. Recent Clips with Intent Classification Toolbar (Part 7)
              // ===============================================================
              _buildRecentClipsSection(context, clipsProvider),
              const SizedBox(height: 20),

              // ===============================================================
              // Preserved Secondary Sections: Collections (Part 8) & Analytics Teaser
              // ===============================================================
              _buildAnalyticsTeaserCard(context),
              const SizedBox(height: 18),
              _buildCollectionsSection(context, clipsProvider),
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
    // 2. Real Apply clips & active deadlines
    final applyClips = clips.allClips.where((c) =>
      c.intent.toLowerCase() == 'apply' ||
      (c.extraMetadata['intent']?.toString().toLowerCase() == 'apply')
    ).toList();
    final activeApplyDeadlines = applyClips.where((c) =>
      c.deadline != null && c.status != 'done' && c.status != 'archived'
    ).toList();
    final hasUrgent48h = activeApplyDeadlines.any((c) =>
      c.deadline!.difference(DateTime.now()).inHours <= 48
    );

    // 3. Real Learn clips & unread backlog
    final learnClips = clips.allClips.where((c) =>
      c.intent.toLowerCase() == 'learn' ||
      (c.extraMetadata['intent']?.toString().toLowerCase() == 'learn')
    ).toList();
    final learnBacklog = learnClips.where((c) =>
      c.status != 'done' && c.status != 'archived'
    ).toList();
    final learnCount = learnBacklog.isNotEmpty ? learnBacklog.length : learnClips.length;

    // 4. Real Active Syncs from connected destinations
    final activeDests = clips.destinations.where((d) => d.isActive).toList();
    final destNames = activeDests.isNotEmpty
        ? activeDests.map((d) => d.name).take(3).join(', ')
        : 'Tap to configure storage';

    return Column(
      children: [
        Row(
          children: [
            // 1. Total Clips (Real-time live vault count & weekly velocity)
            Expanded(
              child: _buildTotalClipsCard(context, clips),
            ),
            const SizedBox(width: 12),
            // 2. Apply Deadlines (Real opportunity deadlines & 48h countdown)
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.calendarDays,
                iconBg: const Color(0xFFFEF3C7),
                iconColor: const Color(0xFFD97706),
                label: 'Apply Deadlines',
                value: '${activeApplyDeadlines.isNotEmpty ? activeApplyDeadlines.length : applyClips.length}',
                badgeText: hasUrgent48h
                    ? '<48h left'
                    : (activeApplyDeadlines.isNotEmpty ? '${activeApplyDeadlines.length} Active' : '${applyClips.length} Total'),
                badgeColor: hasUrgent48h ? const Color(0xFFDC2626) : const Color(0xFFD97706),
                badgeBg: hasUrgent48h ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7),
                sublabel: activeApplyDeadlines.isNotEmpty
                    ? '${activeApplyDeadlines.length} active opportunities'
                    : (applyClips.isNotEmpty ? '${applyClips.length} opportunities tracked' : 'No deadlines pending'),
                onTap: () {
                  clips.setIntent('apply');
                  widget.onNavigateTab(2);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            // 3. Learn Backlog (Real study queue & estimated reading time)
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.graduationCap,
                iconBg: const Color(0xFFE0F2FE),
                iconColor: const Color(0xFF0284C7),
                label: 'Learn Backlog',
                value: '$learnCount',
                badgeText: learnBacklog.isNotEmpty ? '~${learnBacklog.length * 4}m read' : 'Up to date',
                badgeColor: const Color(0xFF0284C7),
                badgeBg: const Color(0xFFE0F2FE),
                sublabel: learnBacklog.isNotEmpty
                    ? '${learnBacklog.length} to study & review'
                    : (learnClips.isNotEmpty ? '${learnClips.length} items studied' : 'Save articles to study'),
                onTap: () {
                  clips.setIntent('learn');
                  widget.onNavigateTab(2);
                },
              ),
            ),
            const SizedBox(width: 12),
            // 4. Sync Health (Real destination connectivity status)
            Expanded(
              child: _buildKpiCard(
                icon: LucideIcons.network,
                iconBg: const Color(0xFFDCFCE7),
                iconColor: const Color(0xFF2D6A4F),
                label: 'Active Syncs',
                value: activeDests.isNotEmpty ? '${activeDests.length} Live' : '0 Connected',
                badgeText: activeDests.isNotEmpty ? 'Nominal' : 'Offline',
                badgeColor: activeDests.isNotEmpty ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                badgeBg: activeDests.isNotEmpty ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                sublabel: destNames,
                showPulse: activeDests.isNotEmpty,
                onTap: () => widget.onNavigateTab(4),
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
      badgeText = savedThisWeek > 0 ? '+$savedThisWeek wk' : 'Synced';
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
          clips.resetFilters();
          widget.onNavigateTab(2);
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
  // 5. Urgent Deadlines Component (Real Clips with Live Snooze & Complete Actions)
  // ---------------------------------------------------------------------------
  Widget _buildUrgentDeadlinesSection(BuildContext context, ClipsProvider clips) {
    final now = DateTime.now();
    final urgentClips = clips.allClips.where((c) {
      if (c.deadline == null) return false;
      return c.status != 'done' && c.status != 'archived';
    }).toList()
      ..sort((a, b) => a.deadline!.compareTo(b.deadline!));

    final count = urgentClips.length;

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
                      color: count > 0 ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      count > 0 ? LucideIcons.alarmClock : LucideIcons.circleCheck,
                      size: 16,
                      color: count > 0 ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                    ),
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
                  color: count > 0 ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  count > 0 ? '$count Actions' : 'All Clear',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: count > 0 ? const Color(0xFFB45309) : const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (urgentClips.isEmpty) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.circleCheck, size: 20, color: Color(0xFF16A34A)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'All Deadlines Cleared',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          'No opportunities or applications due in the next 7 days.',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            ...urgentClips.take(3).map((clip) {
              final daysLeft = clip.deadline!.difference(now).inDays;
              final isOverdue = clip.deadline!.isBefore(now);
              final dueText = isOverdue
                  ? 'Overdue'
                  : daysLeft == 0
                      ? 'Due Today'
                      : daysLeft == 1
                          ? 'Due Tomorrow'
                          : 'Due in $daysLeft days';
              final isUrgent = isOverdue || daysLeft <= 1;

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _buildDeadlinesChecklistItem(
                  context: context,
                  clips: clips,
                  clip: clip,
                  title: clip.title.isNotEmpty ? clip.title : clip.url,
                  dueText: dueText,
                  isUrgent: isUrgent,
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildDeadlinesChecklistItem({
    required BuildContext context,
    required ClipsProvider clips,
    required ClipModel clip,
    required String title,
    required String dueText,
    required bool isUrgent,
  }) {
    return GestureDetector(
      onTap: () => XStyleInAppBrowserModal.show(context, clip),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isUrgent ? const Color(0xFFFCA5A5) : AppTheme.borderSubtle,
          ),
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
            // Live Snooze button (+3 days)
            GestureDetector(
              onTap: () async {
                final currentDeadline = clip.deadline ?? DateTime.now();
                final newDate = currentDeadline.add(const Duration(days: 3));
                final dateStr = '${newDate.year}-${newDate.month.toString().padLeft(2, '0')}-${newDate.day.toString().padLeft(2, '0')}';
                await clips.updateClip(clip.id, deadline: dateStr);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Snoozed "${clip.title}" +3 days ✓'),
                      backgroundColor: const Color(0xFF2D6A4F),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
              behavior: HitTestBehavior.opaque,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                margin: const EdgeInsets.only(right: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '+3d',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
            ),
            // Live Complete button (marks status = 'done')
            GestureDetector(
              onTap: () async {
                await clips.updateClip(clip.id, status: 'done');
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Marked "${clip.title}" completed ✓'),
                      backgroundColor: const Color(0xFF16A34A),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
              behavior: HitTestBehavior.opaque,
              child: const Padding(
                padding: EdgeInsets.all(4),
                child: Icon(LucideIcons.circleCheck, size: 18, color: Color(0xFF16A34A)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 6. This Week Component (Live Save Streak & Top Tags)
  // ---------------------------------------------------------------------------
  Widget _buildThisWeekSection(BuildContext context, ClipsProvider clips) {
    final now = DateTime.now();

    // 1. Calculate real 7-day Monday through Sunday activity matrix
    final currentMonday = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final dayActiveList = <bool>[];
    for (int i = 0; i < 7; i++) {
      final dayStart = currentMonday.add(Duration(days: i));
      final dayEnd = dayStart.add(const Duration(days: 1));
      final hasSaves = clips.allClips.any((c) =>
        c.createdAt.isAfter(dayStart) && c.createdAt.isBefore(dayEnd)
      );
      dayActiveList.add(hasSaves);
    }

    // 2. Calculate consecutive saving days streak
    int streakDays = 0;
    var checkDate = DateTime(now.year, now.month, now.day);
    while (true) {
      final nextDay = checkDate.add(const Duration(days: 1));
      final hadSave = clips.allClips.any((c) =>
        c.createdAt.isAfter(checkDate) && c.createdAt.isBefore(nextDay)
      );
      if (hadSave) {
        streakDays++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      } else {
        if (checkDate.day == now.day && streakDays == 0) {
          checkDate = checkDate.subtract(const Duration(days: 1));
          continue;
        }
        break;
      }
    }

    // 3. Compute real top 4 tag frequencies from user clips
    final tagFreq = <String, int>{};
    for (final clip in clips.allClips) {
      for (final tag in clip.tags) {
        final clean = tag.trim().toLowerCase();
        if (clean.isNotEmpty) {
          tagFreq[clean] = (tagFreq[clean] ?? 0) + 1;
        }
      }
    }
    final sortedTags = tagFreq.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topTags = sortedTags.take(4).toList();

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
                  streakDays > 0 ? '$streakDays Day Streak 🔥' : 'Start Streak',
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
          // 7-day M-T-W-T-F-S-S real dot matrix
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(7, (index) {
              return _buildStreakDot(
                dayLabels[index],
                dayActiveList[index],
                isToday: (index + 1) == now.weekday,
              );
            }),
          ),
          const SizedBox(height: 12),
          // Top Tags Chips (Real & clickable to filter Clips)
          if (topTags.isNotEmpty) ...[
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: topTags.map((t) => _buildTagChip(
                context,
                clips,
                t.key,
                t.value,
              )).toList(),
            ),
          ] else ...[
            Text(
              'No tags yet — add tags to clips to see top trends here',
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStreakDot(String day, bool active, {bool isToday = false}) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: active ? const Color(0xFFEA580C) : const Color(0xFFF1F5F9),
            shape: BoxShape.circle,
            border: isToday
                ? Border.all(color: const Color(0xFFEA580C), width: 2)
                : null,
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
            color: isToday
                ? const Color(0xFFEA580C)
                : (active ? AppTheme.textPrimary : AppTheme.textMuted),
          ),
        ),
      ],
    );
  }

  Widget _buildTagChip(BuildContext context, ClipsProvider clips, String tag, int count) {
    return GestureDetector(
      onTap: () {
        clips.setSearchQuery('#$tag');
        widget.onNavigateTab(2); // Go to Clips with filter
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '#$tag',
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF2D6A4F),
              ),
            ),
            const SizedBox(width: 4),
            Text(
              '($count)',
              style: GoogleFonts.inter(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Digest Component (Live Week Digest & AI Synthesis)
  // ---------------------------------------------------------------------------
  Widget _buildWeekDigestSection(BuildContext context, ClipsProvider clips) {
    final now = DateTime.now();
    final sevenDaysAgo = now.subtract(const Duration(days: 7));
    final thisWeekClips = clips.allClips.where((c) => c.createdAt.isAfter(sevenDaysAgo)).toList();
    final weekSavesCount = thisWeekClips.length;

    // Top story calculation
    ClipModel? topClip;
    if (thisWeekClips.isNotEmpty) {
      topClip = thisWeekClips.firstWhere((c) => c.isFavorite, orElse: () => thisWeekClips.first);
    } else if (clips.allClips.isNotEmpty) {
      topClip = clips.allClips.first;
    }

    final int oppsCount = thisWeekClips.where((c) =>
      c.intent.toLowerCase() == 'apply' ||
      (c.extraMetadata['intent']?.toString().toLowerCase() == 'apply')
    ).length;

    final String storyHeadline;
    if (topClip != null) {
      final oppText = oppsCount > 0 ? ' • $oppsCount opportunities tracked this week' : '';
      storyHeadline = 'Top story: ${topClip.title}$oppText. ${topClip.summary.isNotEmpty ? topClip.summary : "Tap to open and synthesize takeaways."}';
    } else {
      storyHeadline = 'Your personal AI digest automatically synthesizes key insights, takeaways, and action items as you save content.';
    }

    return GestureDetector(
      onTap: () {
        if (topClip != null) {
          XStyleInAppBrowserModal.show(context, topClip);
        } else {
          widget.onNavigateTab(1); // Go to Feed
        }
      },
      child: Container(
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
                  weekSavesCount == 1 ? '1 save this week' : '$weekSavesCount saves this week',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  storyHeadline,
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
                  onTap: () => widget.onNavigateTab(1), // Go to Feed tab
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
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Goal Component (Live Daily 10-Clip Goal Tracker & Ring)
  // ---------------------------------------------------------------------------
  Widget _buildDailyGoalSection(BuildContext context, ClipsProvider clips) {
    final now = DateTime.now();
    final startOfToday = DateTime(now.year, now.month, now.day);
    final todaySaves = clips.allClips.where((c) => c.createdAt.isAfter(startOfToday)).length;
    const int dailyGoal = 10;
    final double progress = (todaySaves / dailyGoal).clamp(0.0, 1.0);
    final int pct = ((todaySaves / dailyGoal) * 100).round();
    final bool isGoalMet = todaySaves >= dailyGoal;

    return GestureDetector(
      onTap: () => SaveClipBottomSheet.show(context),
      behavior: HitTestBehavior.opaque,
      child: Container(
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
            // Dynamic Radial Goal Ring
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isGoalMet ? const Color(0xFF16A34A) : const Color(0xFF2D6A4F),
                  width: 5,
                ),
              ),
              child: Center(
                child: Text(
                  '$todaySaves/$dailyGoal',
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
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isGoalMet ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isGoalMet ? 'Goal Met! 🎉' : '$pct% done',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isGoalMet ? const Color(0xFF16A34A) : const Color(0xFF2D6A4F),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isGoalMet
                        ? 'Target achieved ($todaySaves saves today) 🚀'
                        : '$todaySaves of $dailyGoal items saved today',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 6,
                      backgroundColor: const Color(0xFFF1F5F9),
                      color: isGoalMet ? const Color(0xFF16A34A) : const Color(0xFF2D6A4F),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 9. Recent Clips with Intent Classification Toolbar (Part 7 - Live)
  // ---------------------------------------------------------------------------
  Widget _buildRecentClipsSection(BuildContext context, ClipsProvider clips) {
    // 1. Available intents for the toolbar
    const intentTabs = [
      {'id': 'all', 'label': 'All'},
      {'id': 'watch', 'label': 'Watch'},
      {'id': 'apply', 'label': 'Apply'},
      {'id': 'learn', 'label': 'Learn'},
      {'id': 'track', 'label': 'Track'},
      {'id': 'hire', 'label': 'Hire'},
      {'id': 'attend', 'label': 'Attend'},
      {'id': 'buy', 'label': 'Buy'},
    ];

    // Helper to get real count for any intent
    int getIntentCount(String id) {
      if (id == 'all') return clips.allClips.length;
      return clips.allClips.where((c) {
        return ClipIntentHelper.detectIntent(c) == id;
      }).length;
    }

    // 2. Filter clips by selected intent
    final List<ClipModel> filteredClips;
    if (_selectedIntent == 'all') {
      filteredClips = List<ClipModel>.from(clips.allClips);
    } else {
      filteredClips = clips.allClips.where((c) {
        return ClipIntentHelper.detectIntent(c) == _selectedIntent;
      }).toList();
    }

    // Sort by newest first
    filteredClips.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final displayClips = filteredClips.take(4).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  'Recent Clips',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                if (_selectedIntent != 'all') ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: ClipIntentHelper.getStyle(_selectedIntent).bgColor,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: ClipIntentHelper.getStyle(_selectedIntent).borderColor,
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      _selectedIntent.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: ClipIntentHelper.getStyle(_selectedIntent).textColor,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            GestureDetector(
              onTap: () {
                clips.setIntent(_selectedIntent);
                widget.onNavigateTab(2); // Go to Clips tab with active intent filter
              },
              behavior: HitTestBehavior.opaque,
              child: Row(
                children: [
                  Text(
                    'See all (${filteredClips.length})',
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

        // Live Intent Filter Toolbar
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: intentTabs.map((tab) {
              final id = tab['id']!;
              final label = tab['label']!;
              final count = getIntentCount(id);
              final isSelected = _selectedIntent == id;
              final style = ClipIntentHelper.getStyle(id);

              return _buildIntentFilterPill(
                label: label,
                id: id,
                count: count,
                isSelected: isSelected,
                style: style,
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 12),

        // Live Filtered Clips List or Empty State
        if (displayClips.isEmpty) ...[
          _buildEmptyRecentClipsState(context, _selectedIntent),
        ] else ...[
          ...displayClips.map((clip) => _buildRecentClipCard(context, clip, clips)),
        ],
      ],
    );
  }

  Widget _buildIntentFilterPill({
    required String label,
    required String id,
    required int count,
    required bool isSelected,
    required IntentStyle style,
  }) {
    return GestureDetector(
      onTap: () => setState(() => _selectedIntent = id),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2D6A4F) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF2D6A4F) : AppTheme.borderSubtle,
            width: 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF2D6A4F).withValues(alpha: 0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (id != 'all') ...[
              Icon(
                style.icon,
                size: 12,
                color: isSelected ? Colors.white : style.textColor,
              ),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? Colors.white : AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 6),
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

  Widget _buildEmptyRecentClipsState(BuildContext context, String currentIntent) {
    final style = ClipIntentHelper.getStyle(currentIntent);
    final intentName = currentIntent == 'all' ? 'clips' : '${currentIntent.toUpperCase()} clips';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: style.bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(style.icon, size: 22, color: style.textColor),
          ),
          const SizedBox(height: 10),
          Text(
            'No $intentName yet',
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            currentIntent == 'all'
                ? 'Your saved links, snippets, and highlights will appear here.'
                : 'Clips automatically categorized as $currentIntent will appear in this tab.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (currentIntent != 'all') ...[
                OutlinedButton(
                  onPressed: () => setState(() => _selectedIntent = 'all'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    side: const BorderSide(color: AppTheme.borderSubtle),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    'Reset to All',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              ElevatedButton.icon(
                onPressed: () => SaveClipBottomSheet.show(context),
                icon: const Icon(LucideIcons.plus, size: 14, color: Colors.white),
                label: Text(
                  'Save Clip',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D6A4F),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentClipCard(BuildContext context, ClipModel clip, ClipsProvider clips) {
    final detectedIntent = ClipIntentHelper.detectIntent(clip);
    final style = ClipIntentHelper.getStyle(detectedIntent);
    final platformIcon = _getPlatformIcon(clip.sourcePlatform, clip.domain);
    final relativeTime = _formatRelativeTime(clip.createdAt);
    final author = clip.sourceAuthor.isNotEmpty
        ? clip.sourceAuthor
        : (clip.domain.isNotEmpty ? clip.domain : 'web');

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
            // Header Row: Intent Badge, Source, Relative Time, Favorite Star
            Row(
              children: [
                // Intent Badge (clickable to filter by this intent)
                GestureDetector(
                  onTap: () => setState(() => _selectedIntent = detectedIntent),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                    decoration: BoxDecoration(
                      color: style.bgColor,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: style.borderColor, width: 0.8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(style.icon, size: 10, color: style.textColor),
                        const SizedBox(width: 4),
                        Text(
                          style.label,
                          style: GoogleFonts.inter(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: style.textColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Platform Icon & Author / Domain
                Icon(platformIcon, size: 12, color: AppTheme.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    author,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

                // Relative Time
                Text(
                  relativeTime,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(width: 6),

                // Favorite Star Button
                GestureDetector(
                  onTap: () {
                    clips.toggleFavorite(clip.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          clip.isFavorite ? 'Removed from favorites' : 'Added to favorites ⭐',
                          style: GoogleFonts.inter(fontSize: 12),
                        ),
                        duration: const Duration(seconds: 1),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.all(2.0),
                    child: Icon(
                      clip.isFavorite ? Icons.star_rounded : Icons.star_border_rounded,
                      size: 18,
                      color: clip.isFavorite ? const Color(0xFFF59E0B) : AppTheme.inactiveGrey,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              clip.title.isNotEmpty ? clip.title : clip.url,
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
                height: 1.25,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            // Summary
            if (clip.summary.isNotEmpty) ...[
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

            // Tags row (if any)
            if (clip.tags.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: clip.tags.take(3).map((tag) {
                  return GestureDetector(
                    onTap: () {
                      clips.setSearchQuery('#$tag');
                      widget.onNavigateTab(2); // Go to Clips with tag filter
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderSubtle, width: 0.8),
                      ),
                      child: Text(
                        '#$tag',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF2D6A4F),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  IconData _getPlatformIcon(String platform, String domain) {
    final p = platform.toLowerCase();
    final d = domain.toLowerCase();
    if (p.contains('twitter') || p.contains('x') || d.contains('x.com') || d.contains('twitter.com')) {
      return LucideIcons.twitter;
    }
    if (p.contains('youtube') || d.contains('youtube.com') || d.contains('youtu.be')) {
      return LucideIcons.play;
    }
    if (p.contains('github') || d.contains('github.com')) {
      return LucideIcons.code;
    }
    if (p.contains('linkedin') || d.contains('linkedin.com')) {
      return LucideIcons.briefcase;
    }
    if (p.contains('reddit') || d.contains('reddit.com')) {
      return LucideIcons.messageSquare;
    }
    if (p.contains('arxiv') || d.contains('arxiv.org')) {
      return LucideIcons.fileText;
    }
    return LucideIcons.globe;
  }

  String _formatRelativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}';
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

  // ---------------------------------------------------------------------------
  // Collections Section (Part 8 - Dynamic & Clickable)
  // ---------------------------------------------------------------------------
  Widget _buildCollectionsSection(BuildContext context, ClipsProvider clips) {
    // 1. Dynamically compute collections from user's actual tags and categories
    final tagCounts = <String, int>{};
    final tagRecentCounts = <String, int>{};
    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7));

    for (final c in clips.allClips) {
      final isNew = c.createdAt.isAfter(sevenDaysAgo);
      for (final t in c.tags) {
        final clean = t.trim();
        if (clean.isEmpty) continue;
        tagCounts[clean] = (tagCounts[clean] ?? 0) + 1;
        if (isNew) {
          tagRecentCounts[clean] = (tagRecentCounts[clean] ?? 0) + 1;
        }
      }
    }

    final sortedTags = tagCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final List<Map<String, dynamic>> collections = [];

    if (sortedTags.isNotEmpty) {
      for (final entry in sortedTags.take(2)) {
        final tagName = entry.key;
        final count = entry.value;
        final recentCount = tagRecentCounts[tagName] ?? 0;
        final lower = tagName.toLowerCase();

        IconData icon = LucideIcons.folderArchive;
        Color accent = const Color(0xFF2D6A4F);

        if (lower.contains('ai') || lower.contains('gpt') || lower.contains('llm') || lower.contains('ml')) {
          icon = LucideIcons.bot;
          accent = const Color(0xFF10B981);
        } else if (lower.contains('dev') || lower.contains('code') || lower.contains('react') || lower.contains('rust') || lower.contains('python')) {
          icon = LucideIcons.code;
          accent = const Color(0xFF2D6A4F);
        } else if (lower.contains('job') || lower.contains('career') || lower.contains('remote') || lower.contains('hire')) {
          icon = LucideIcons.briefcase;
          accent = const Color(0xFFF59E0B);
        } else if (lower.contains('design') || lower.contains('ui') || lower.contains('ux')) {
          icon = LucideIcons.palette;
          accent = const Color(0xFF8B5CF6);
        } else if (lower.contains('research') || lower.contains('paper') || lower.contains('study')) {
          icon = LucideIcons.bookOpen;
          accent = const Color(0xFF0284C7);
        }

        collections.add({
          'title': tagName,
          'count': count,
          'recent': recentCount > 0 ? '+$recentCount new' : 'All synced',
          'icon': icon,
          'accent': accent,
          'type': 'tag',
          'filterValue': '#$tagName',
        });
      }
    }

    // Fallbacks if fewer than 2 tags exist
    if (collections.length < 2) {
      final articleCount = clips.allClips.where((c) =>
        c.contentType.toLowerCase().contains('article') || c.sourcePlatform == 'web'
      ).length;
      final recentArticles = clips.allClips.where((c) =>
        (c.contentType.toLowerCase().contains('article') || c.sourcePlatform == 'web') &&
        c.createdAt.isAfter(sevenDaysAgo)
      ).length;

      if (!collections.any((c) => c['title'] == 'Articles & Notes')) {
        collections.add({
          'title': 'Articles & Notes',
          'count': articleCount > 0 ? articleCount : clips.allClips.length,
          'recent': recentArticles > 0 ? '+$recentArticles new' : 'All synced',
          'icon': LucideIcons.bookOpen,
          'accent': const Color(0xFF0284C7),
          'type': 'category',
          'filterValue': 'Articles',
        });
      }
    }

    if (collections.length < 2) {
      final devCount = clips.allClips.where((c) =>
        c.domain.contains('github') || c.tags.any((t) => t.toLowerCase().contains('code') || t.toLowerCase().contains('dev'))
      ).length;
      final recentDev = clips.allClips.where((c) =>
        (c.domain.contains('github') || c.tags.any((t) => t.toLowerCase().contains('code') || t.toLowerCase().contains('dev'))) &&
        c.createdAt.isAfter(sevenDaysAgo)
      ).length;

      collections.add({
        'title': 'Engineering & Systems',
        'count': devCount > 0 ? devCount : (clips.allClips.length > 1 ? (clips.allClips.length ~/ 2) : 0),
        'recent': recentDev > 0 ? '+$recentDev new' : 'Active sync',
        'icon': LucideIcons.code,
        'accent': const Color(0xFF2D6A4F),
        'type': 'tag',
        'filterValue': '#dev',
      });
    }

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
              onTap: () {
                clips.resetFilters();
                widget.onNavigateTab(2); // Go to Clips tab
              },
              behavior: HitTestBehavior.opaque,
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
            Expanded(child: _buildCollectionCard(collections[0], clips)),
            const SizedBox(width: 12),
            Expanded(child: _buildCollectionCard(collections[1], clips)),
          ],
        ),
      ],
    );
  }

  Widget _buildCollectionCard(Map<String, dynamic> col, ClipsProvider clips) {
    return GestureDetector(
      onTap: () {
        final filterValue = col['filterValue'] as String;
        if (col['type'] == 'tag') {
          clips.setSearchQuery(filterValue);
        } else if (col['type'] == 'category') {
          clips.setCategory(filterValue);
        } else {
          clips.setSearchQuery(col['title'] as String);
        }
        widget.onNavigateTab(2); // Go to Clips tab with filter applied
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
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
      ),
    );
  }

  void _showNotificationsSheet(BuildContext context, List<ClipModel> urgentClips) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.7,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(LucideIcons.bell, size: 18, color: Color(0xFFD97706)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Urgent Notifications',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: urgentClips.isNotEmpty ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      urgentClips.isNotEmpty ? '${urgentClips.length} Urgent' : 'All Clear',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: urgentClips.isNotEmpty ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (urgentClips.isEmpty) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 28),
                  child: Center(
                    child: Column(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: Color(0xFFDCFCE7),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(LucideIcons.circleCheck, color: Color(0xFF16A34A), size: 24),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'All caught up!',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'No deadlines due in the next 7 days.',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ] else ...[
                Expanded(
                  child: ListView.separated(
                    itemCount: urgentClips.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final clip = urgentClips[index];
                      final daysLeft = clip.deadline!.difference(DateTime.now()).inDays;
                      final isOverdue = clip.deadline!.isBefore(DateTime.now());
                      final dueLabel = isOverdue
                          ? 'Overdue'
                          : daysLeft == 0
                              ? 'Due Today'
                              : daysLeft == 1
                                  ? 'Due Tomorrow'
                                  : 'Due in $daysLeft days';

                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isOverdue ? const Color(0xFFFCA5A5) : AppTheme.borderSubtle,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFFF59E0B),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    clip.title.isNotEmpty ? clip.title : clip.url,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    dueLabel,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: isOverdue ? const Color(0xFFDC2626) : const Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(LucideIcons.chevronRight, size: 16, color: AppTheme.inactiveGrey),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    widget.onNavigateTab(2); // Go to Clips tab
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: const BorderSide(color: Color(0xFF2D6A4F)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(
                    'View All in Clips',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2D6A4F),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
