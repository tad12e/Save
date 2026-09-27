import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../providers/clips_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_header.dart';

class AnalyticsScreen extends StatefulWidget {
  final VoidCallback? onNotificationTap;

  const AnalyticsScreen({
    super.key,
    this.onNotificationTap,
  });

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _selectedPeriod = 'This Week';
  String _clipsOverTimeMode = 'Total'; // 'Total' or 'By Type'
  int _selectedDonutIndex = -1;
  bool _isLoading = false;
  Map<String, dynamic>? _backendData;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics({bool refresh = false}) async {
    if (!mounted) return;
    if (_backendData == null) {
      setState(() => _isLoading = true);
    }
    try {
      final data = await ApiService.fetchFullAnalytics(
        period: _selectedPeriod,
        refresh: refresh,
      );
      if (mounted && data != null) {
        setState(() {
          _backendData = data;
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _openPeriodSelectorBottomSheet(BuildContext context) {
    final periods = ['This Week', 'This Month', 'Last 30 Days', 'All Time'];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Select Analytics Timeframe',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.inactiveGrey),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...periods.map((p) {
                  final isSelected = _selectedPeriod == p;
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _selectedPeriod = p;
                      });
                      Navigator.pop(ctx);
                      _loadAnalytics();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      margin: const EdgeInsets.only(bottom: 6),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            p,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? const Color(0xFF166534) : AppTheme.textPrimary,
                            ),
                          ),
                          if (isSelected)
                            const Icon(LucideIcons.circleCheck, size: 18, color: Color(0xFF16A34A)),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  static String _monthAbbr(int month) {
    const m = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (month >= 1 && month <= 12) ? m[month] : '';
  }

  Map<String, dynamic> _computeLocalMetrics(ClipsProvider clips) {
    final allClips = clips.allClips;
    final now = DateTime.now();
    final startOfToday = DateTime(now.year, now.month, now.day);
    final sevenDaysAgo = now.subtract(const Duration(days: 7));
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));

    final totalClips = allClips.length;

    final inPeriodClips = switch (_selectedPeriod) {
      'This Month' || 'Last 30 Days' => allClips.where((c) => c.createdAt.isAfter(thirtyDaysAgo)).length,
      'All Time' => totalClips,
      _ => allClips.where((c) => c.createdAt.isAfter(sevenDaysAgo)).length,
    };

    final todayCompleted = allClips.where((c) => c.createdAt.isAfter(startOfToday)).length;

    // Consecutive streak calculation
    final uniqueDays = <DateTime>{};
    for (final c in allClips) {
      uniqueDays.add(DateTime(c.createdAt.year, c.createdAt.month, c.createdAt.day));
    }
    int streakDays = 0;
    var checkDate = startOfToday;
    if (!uniqueDays.contains(checkDate)) {
      final yesterday = startOfToday.subtract(const Duration(days: 1));
      if (uniqueDays.contains(yesterday)) {
        checkDate = yesterday;
      }
    }
    while (uniqueDays.contains(checkDate)) {
      streakDays++;
      checkDate = checkDate.subtract(const Duration(days: 1));
    }

    // Action rate
    final actionable = allClips.where((c) {
      final intent = c.intent.toLowerCase();
      final ct = c.contentType.toLowerCase();
      return intent == 'apply' || intent == 'learn' || intent == 'hire' || intent == 'attend' || ct == 'job' || ct == 'event' || c.deadlineDate != null;
    }).toList();
    final actioned = actionable.where((c) => c.status == 'done' || c.status == 'archived').toList();
    final actionRate = actionable.isNotEmpty
        ? ((actioned.length / actionable.length) * 100).round()
        : (allClips.isNotEmpty ? 40 : 0);

    final hoursSaved = (allClips.length * 8 / 60.0);
    final dollarValue = (hoursSaved * 25).round();

    final thisWeekCount = allClips.where((c) => c.createdAt.isAfter(sevenDaysAgo)).length;
    final fourteenDaysAgo = now.subtract(const Duration(days: 14));
    final lastWeekCount = allClips.where((c) => c.createdAt.isAfter(fourteenDaysAgo) && c.createdAt.isBefore(sevenDaysAgo)).length;
    final diff = thisWeekCount - lastWeekCount;
    final velocityLabel = diff >= 0 ? '+$diff vs last week' : '$diff vs last week';

    // 1. Hourly distribution (6am - 11pm = 18 hours)
    final hourlyCounts = <int, int>{};
    for (final c in allClips) {
      hourlyCounts[c.createdAt.hour] = (hourlyCounts[c.createdAt.hour] ?? 0) + 1;
    }
    int peakHour = 10;
    int maxHourCount = 0;
    for (int h = 6; h <= 23; h++) {
      final count = hourlyCounts[h] ?? 0;
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = h;
      }
    }
    final List<double> hourlyActivity = [];
    for (int h = 6; h <= 23; h++) {
      final count = hourlyCounts[h] ?? 0;
      if (maxHourCount > 0) {
        hourlyActivity.add((count / maxHourCount).clamp(0.15, 1.0));
      } else {
        final v = (h >= 9 && h <= 11) ? 0.95 : ((h >= 14 && h <= 16) ? 0.70 : 0.20);
        hourlyActivity.add(v);
      }
    }
    final peakStart = (peakHour - 1) % 24;
    final peakEnd = (peakHour + 1) % 24;
    final peakStartStr = '${peakStart % 12 == 0 ? 12 : peakStart % 12} ${peakStart < 12 ? 'AM' : 'PM'}';
    final peakEndStr = '${peakEnd % 12 == 0 ? 12 : peakEnd % 12} ${peakEnd < 12 ? 'AM' : 'PM'}';
    final peakWindowStr = '$peakStartStr – $peakEndStr';

    // 2. 80-Day Consistency Heatmap Grid (4 rows x 20 cols)
    final List<List<int>> matrixData = List.generate(4, (_) => List.filled(20, 0));
    final dayCountMap = <DateTime, int>{};
    for (final c in allClips) {
      final d = DateTime(c.createdAt.year, c.createdAt.month, c.createdAt.day);
      dayCountMap[d] = (dayCountMap[d] ?? 0) + 1;
    }
    for (int col = 19; col >= 0; col--) {
      for (int row = 3; row >= 0; row--) {
        final daysAgo = ((19 - col) * 4) + (3 - row);
        final targetDate = startOfToday.subtract(Duration(days: daysAgo));
        final count = dayCountMap[targetDate] ?? 0;
        int intensity = 0;
        if (count >= 6) {
          intensity = 4;
        } else if (count >= 4) {
          intensity = 3;
        } else if (count >= 2) {
          intensity = 2;
        } else if (count >= 1) {
          intensity = 1;
        }
        matrixData[row][col] = intensity;
      }
    }

    // 3. Weekday Rhythm (Mon=1 .. Sun=7)
    final weekdayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    final weekdayCounts = List.filled(7, 0);
    for (final c in allClips) {
      final wd = c.createdAt.weekday;
      weekdayCounts[wd - 1]++;
    }
    int maxWeekdayCount = 0;
    int topWeekdayIdx = 3;
    for (int i = 0; i < 7; i++) {
      if (weekdayCounts[i] > maxWeekdayCount) {
        maxWeekdayCount = weekdayCounts[i];
        topWeekdayIdx = i;
      }
    }
    final List<Map<String, dynamic>> weekdayList = [];
    for (int i = 0; i < 7; i++) {
      final c = weekdayCounts[i];
      final pct = maxWeekdayCount > 0 ? (c / maxWeekdayCount).clamp(0.15, 1.0) : 0.40;
      weekdayList.add({
        'day': weekdayNames[i],
        'count': '$c',
        'percent': pct,
        'isHighlighted': i == topWeekdayIdx && maxWeekdayCount > 0,
      });
    }
    final topWeekdayStr = '${weekdayNames[topWeekdayIdx]} ${maxWeekdayCount > 0 ? maxWeekdayCount : 0} clips';

    // Density curve recent 7 days
    final List<double> densityPoints = [];
    for (int i = 6; i >= 0; i--) {
      final d = startOfToday.subtract(Duration(days: i));
      final nextD = d.add(const Duration(days: 1));
      final cnt = allClips.where((c) => c.createdAt.isAfter(d) && c.createdAt.isBefore(nextD)).length.toDouble();
      densityPoints.add(cnt);
    }
    final densityMean = thisWeekCount / 7.0;

    // 4. Opportunity Funnel
    final reviewedClips = allClips.where((c) => c.status != 'pending').length;
    final opportunityClips = allClips.where((c) =>
      c.contentType.toLowerCase() == 'job' ||
      c.contentType.toLowerCase() == 'event' ||
      c.intent == 'apply' ||
      c.deadlineDate != null
    ).length;
    final realizedClips = allClips.where((c) => c.status == 'done').length;

    final missedDeadlinesCount = allClips.where((c) =>
      c.deadlineDate != null &&
      c.deadlineDate!.isBefore(now) &&
      c.status != 'done'
    ).length;

    final stages = [
      {
        'name': '1. Saved',
        'count': '$totalClips items',
        'rate': '100%',
        'pct': 1.0,
        'color': const Color(0xFF3B82F6),
      },
      {
        'name': '2. Reviewed',
        'count': '$reviewedClips items',
        'rate': '${totalClips > 0 ? ((reviewedClips / totalClips) * 100).round() : 0}%',
        'pct': totalClips > 0 ? (reviewedClips / totalClips).clamp(0.15, 1.0) : 0.70,
        'color': const Color(0xFF6366F1),
      },
      {
        'name': '3. Applied / Actioned',
        'count': '$opportunityClips items',
        'rate': '${totalClips > 0 ? ((opportunityClips / totalClips) * 100).round() : 0}%',
        'pct': totalClips > 0 ? (opportunityClips / totalClips).clamp(0.12, 1.0) : 0.45,
        'color': const Color(0xFF8B5CF6),
      },
      {
        'name': '4. Realized / Done',
        'count': '$realizedClips items',
        'rate': '${totalClips > 0 ? ((realizedClips / totalClips) * 100).round() : 0}%',
        'pct': totalClips > 0 ? (realizedClips / totalClips).clamp(0.10, 1.0) : 0.20,
        'color': const Color(0xFF10B981),
      },
    ];

    int getCategoryActionRate(String cat) {
      final items = allClips.where((c) => c.contentType.toLowerCase().contains(cat) || c.intent.contains(cat)).toList();
      if (items.isEmpty) return 0;
      final done = items.where((c) => c.status == 'done' || c.status == 'archived').length;
      return ((done / items.length) * 100).round();
    }
    final jobsActionRate = getCategoryActionRate('job');
    final eventsActionRate = getCategoryActionRate('event');
    final articlesActionRate = getCategoryActionRate('article');
    final toolsActionRate = getCategoryActionRate('tool');

    // 5. Content Types Breakdown Donut
    final typeCounts = <String, int>{};
    for (final c in allClips) {
      final ct = c.contentType.toLowerCase();
      typeCounts[ct] = (typeCounts[ct] ?? 0) + 1;
    }
    final colorPalette = {
      'job': const Color(0xFF22C55E),
      'article': const Color(0xFF3B82F6),
      'webpage': const Color(0xFF0284C7),
      'tool': const Color(0xFFF97316),
      'event': const Color(0xFFA78BFA),
      'music': const Color(0xFFEC4899),
      'video': const Color(0xFFEF4444),
      'image': const Color(0xFF06B6D4),
      'other': const Color(0xFF94A3B8),
    };
    final List<Map<String, dynamic>> contentBreakdown = [];
    if (typeCounts.isNotEmpty) {
      final sortedEntries = typeCounts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
      for (final e in sortedEntries) {
        final pct = totalClips > 0 ? ((e.value / totalClips) * 100).round() : 0;
        final name = e.key.isNotEmpty ? (e.key[0].toUpperCase() + e.key.substring(1)) : 'General';
        contentBreakdown.add({
          'name': name,
          'count': e.value,
          'pct': pct,
          'color': colorPalette[e.key] ?? const Color(0xFF10B981),
        });
      }
    } else {
      contentBreakdown.addAll([
        {'name': 'Articles', 'count': 0, 'pct': 0, 'color': const Color(0xFF3B82F6)},
        {'name': 'Jobs', 'count': 0, 'pct': 0, 'color': const Color(0xFF22C55E)},
        {'name': 'Tools', 'count': 0, 'pct': 0, 'color': const Color(0xFFF97316)},
      ]);
    }

    // 6. Popular Tags Aggregation
    final tagCounts = <String, int>{};
    for (final c in allClips) {
      for (final t in c.tags) {
        final clean = t.trim().replaceAll('#', '').toLowerCase();
        if (clean.isNotEmpty) {
          tagCounts[clean] = (tagCounts[clean] ?? 0) + 1;
        }
      }
    }
    final sortedTags = tagCounts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final List<Map<String, dynamic>> popularTags = sortedTags.take(8).map((e) => {
      'name': e.key,
      'count': e.value,
    }).toList();

    // 7. Clips Over Time (Last 7 Days)
    final List<double> last7DaysTotal = [];
    final List<String> last7DaysLabels = [];
    for (int i = 6; i >= 0; i--) {
      final d = startOfToday.subtract(Duration(days: i));
      final nextD = d.add(const Duration(days: 1));
      final cCount = allClips.where((c) => c.createdAt.isAfter(d) && c.createdAt.isBefore(nextD)).length.toDouble();
      last7DaysTotal.add(cCount);
      last7DaysLabels.add('${_monthAbbr(d.month)} ${d.day}');
    }

    // 8. Personal Bests & Achievements
    int maxInOneDay = 0;
    DateTime? maxDayDate;
    for (final entry in dayCountMap.entries) {
      if (entry.value > maxInOneDay) {
        maxInOneDay = entry.value;
        maxDayDate = entry.key;
      }
    }
    final topTagStr = sortedTags.isNotEmpty ? '#${sortedTags.first.key} (${sortedTags.first.value} clips)' : 'None yet';

    final domainCounts = <String, int>{};
    for (final c in allClips) {
      domainCounts[c.domain] = (domainCounts[c.domain] ?? 0) + 1;
    }
    final sortedDomains = domainCounts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final topDomainStr = sortedDomains.isNotEmpty ? '${sortedDomains.first.key} (${totalClips > 0 ? ((sortedDomains.first.value / totalClips) * 100).round() : 0}%)' : 'Web';
    final distinctDomainsCount = domainCounts.length;

    // Badges calculation
    final earnedBadges = [
      {'emoji': '🔥', 'title': 'On Fire', 'desc': '7-Day save streak', 'unlocked': streakDays >= 7},
      {'emoji': '📚', 'title': 'Deep Reader', 'desc': '10 research papers saved', 'unlocked': (typeCounts['article'] ?? 0) >= 10},
      {'emoji': '💼', 'title': 'Job Hunter', 'desc': '5 jobs saved', 'unlocked': (typeCounts['job'] ?? 0) >= 5},
      {'emoji': '⚡', 'title': 'Quick Actioner', 'desc': 'Active pipeline progress', 'unlocked': actionRate >= 30},
      {'emoji': '🌍', 'title': 'Globe Trotter', 'desc': '5+ distinct domains', 'unlocked': distinctDomainsCount >= 5},
      {'emoji': '🎯', 'title': 'Sharp Eye', 'desc': '10+ total items clipped', 'unlocked': totalClips >= 10},
    ];

    // Synced count
    final syncedCount = allClips.where((c) => c.exportStatus == 'synced').length;

    // Percentile rank
    final percentile = totalClips >= 100 ? 94 : (totalClips >= 50 ? 84 : (totalClips >= 20 ? 76 : (totalClips >= 5 ? 55 : 30)));

    return {
      'total_clips': totalClips,
      'in_period_clips': inPeriodClips,
      'today_completed': todayCompleted,
      'active_streak_days': streakDays,
      'action_rate_percent': actionRate,
      'time_saved_hours': hoursSaved.toStringAsFixed(1),
      'saved_dollar_value': dollarValue,
      'velocity_label': velocityLabel,
      'momentum_pct': diff > 0 ? (diff * 10).clamp(5, 100) : 10,
      'hourly_activity': hourlyActivity,
      'peak_window_str': peakWindowStr,
      'peak_hour_count': maxHourCount,
      'matrix_data': matrixData,
      'weekday_list': weekdayList,
      'top_weekday_str': topWeekdayStr,
      'density_points': densityPoints,
      'density_mean_str': 'Mean ${densityMean.toStringAsFixed(1)} clips',
      'density_badge_str': '$thisWeekCount clips',
      'opportunity_stages': stages,
      'missed_deadlines_count': missedDeadlinesCount,
      'realized_value_str': '\$${(realizedClips * 150) + (totalClips * 10)} realized',
      'action_rates': {
        'Jobs': '$jobsActionRate%',
        'Events': '$eventsActionRate%',
        'Articles': '$articlesActionRate%',
        'Tools': '$toolsActionRate%',
      },
      'content_breakdown': contentBreakdown,
      'popular_tags': popularTags,
      'clips_over_time_total': last7DaysTotal,
      'clips_over_time_labels': last7DaysLabels,
      'personal_records': {
        'max_day': maxInOneDay > 0 ? '$maxInOneDay clips (${_monthAbbr(maxDayDate!.month)} ${maxDayDate.day})' : '0 clips',
        'max_week': '$thisWeekCount clips this week',
        'top_tag': topTagStr,
        'top_source': topDomainStr,
      },
      'badges': earnedBadges,
      'distinct_domains_count': distinctDomainsCount,
      'synced_count': syncedCount,
      'percentile': percentile,
    };
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final local = _computeLocalMetrics(clipsProvider);

    final kpis = _backendData?['kpis'];
    final totalCount = (kpis?['total_clips'] as num?)?.toInt() ?? (local['total_clips'] as int);
    final inPeriodCount = (kpis?['in_period_clips'] as num?)?.toInt() ?? (local['in_period_clips'] as int);
    final streakDays = (kpis?['active_streak_days'] as num?)?.toInt() ?? (local['active_streak_days'] as int);
    final todayCompleted = (_backendData?['daily_focus']?['today_completed'] as num?)?.toInt() ?? (local['today_completed'] as int);
    final actionRate = (kpis?['action_rate_percent'] as num?)?.toInt() ?? (local['action_rate_percent'] as int);
    final savedValue = (kpis?['saved_dollar_value'] != null ? '\$${kpis!['saved_dollar_value']}' : '\$${local['saved_dollar_value']}');
    final hoursSaved = (kpis?['time_saved_hours']?.toString() ?? local['time_saved_hours'].toString());
    final velocityText = (kpis?['velocity_trend']?['label']?.toString() ?? local['velocity_label'].toString());
    final momentumPct = (local['momentum_pct'] as int);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 1.0)),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          alignment: Alignment.center,
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Analytics & Insights',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                // Section 1: Period selector dropdown pill
                InkWell(
                  onTap: () => _openPeriodSelectorBottomSheet(context),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _selectedPeriod,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(LucideIcons.chevronDown, size: 14, color: AppTheme.textMuted),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? _buildShimmerSkeletonLoading()
          : RefreshIndicator(
              onRefresh: () => _loadAnalytics(refresh: true),
              color: const Color(0xFF16A34A),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section 1: Top stats header row
                    _buildTopHeaderRow(context),
                    const SizedBox(height: 14),

                    // Section 2: Mascot Speech Bubble
                    AnalyticsInteractiveCard(
                      child: _buildMascotSpeechBubble(
                        totalCount: totalCount,
                        inPeriodCount: inPeriodCount,
                        streakDays: streakDays,
                        velocityText: velocityText,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 3: 5-Metric Quick Stats Card Row
                    AnalyticsInteractiveCard(
                      child: _buildQuickStatsCardRow(
                        totalCount: totalCount,
                        inPeriodCount: inPeriodCount,
                        streakDays: streakDays,
                        savedValue: savedValue,
                        hoursSaved: hoursSaved,
                        actionRate: actionRate,
                        velocityText: velocityText,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 3.5: Streak & Momentum Analytics (Fitness Rings)
                    AnalyticsInteractiveCard(
                      child: _buildStreakAndMomentumCard(
                        streakDays: streakDays,
                        todayCompleted: todayCompleted,
                        actionRate: actionRate,
                        momentumPct: momentumPct,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 4: Daily Saving Goal Circular Ring Card
                    AnalyticsInteractiveCard(
                      child: _buildDailyFocusCard(todayCompleted: todayCompleted),
                    ),
                    const SizedBox(height: 16),

                    // Section 4.5: Hourly Activity Heatmap (6am - 11pm) & Peak Window
                    AnalyticsInteractiveCard(
                      child: _buildHourlyActivityHeatmapCard(
                        hourlyActivity: (local['hourly_activity'] as List<double>),
                        peakWindow: (local['peak_window_str'] as String),
                        maxHourCount: (local['peak_hour_count'] as int),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 5: Consistency Heatmap Matrix Card
                    AnalyticsInteractiveCard(
                      child: _buildConsistencyHeatmapCard(
                        matrixData: (local['matrix_data'] as List<List<int>>),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 6: Density Area Curve & Weekday Rhythm Split Cards
                    AnalyticsInteractiveCard(
                      child: _buildDensityAndRhythmSection(
                        densityPoints: (local['density_points'] as List<double>),
                        densityMeanStr: (local['density_mean_str'] as String),
                        densityBadgeStr: (local['density_badge_str'] as String),
                        weekdayList: (local['weekday_list'] as List<Map<String, dynamic>>),
                        topWeekdayStr: (local['top_weekday_str'] as String),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 6.5: Opportunity Outcome Analytics (Funnel, Action Rates, Missed Opportunities, Value Score)
                    AnalyticsInteractiveCard(
                      child: _buildOpportunityOutcomeSection(
                        stages: (local['opportunity_stages'] as List<Map<String, dynamic>>),
                        missedCount: (local['missed_deadlines_count'] as int),
                        realizedValue: (local['realized_value_str'] as String),
                        actionRates: (local['action_rates'] as Map<String, String>),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 8 [NEW]: Clips Over Time Interactive Line Chart (Total | By Type)
                    AnalyticsInteractiveCard(
                      child: _buildClipsOverTimeCard(
                        last7DaysTotal: (local['clips_over_time_total'] as List<double>),
                        labels: (local['clips_over_time_labels'] as List<String>),
                        breakdown: (local['content_breakdown'] as List<Map<String, dynamic>>),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 9 [NEW]: Content Type Donut Chart with interactive legend
                    AnalyticsInteractiveCard(
                      child: _buildContentTypeDonutCard(
                        breakdown: (local['content_breakdown'] as List<Map<String, dynamic>>),
                        totalCount: totalCount,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 7: Content Breakdown & Specialty Radar Polygon Card
                    AnalyticsInteractiveCard(
                      child: _buildFocusDistributionCard(
                        breakdown: (local['content_breakdown'] as List<Map<String, dynamic>>),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 8: Popular Tags Analytics Breakdown
                    AnalyticsInteractiveCard(
                      child: _buildPopularTagsSection(
                        context,
                        tags: (local['popular_tags'] as List<Map<String, dynamic>>),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 9: Destination & Sync Health Analytics
                    AnalyticsInteractiveCard(
                      child: _buildDestinationAndSyncSection(
                        syncedCount: (local['synced_count'] as int),
                        totalCount: totalCount,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 10: Personal Records & Achievement Badges (Gamification)
                    AnalyticsInteractiveCard(
                      child: _buildPersonalRecordsAndBadgesSection(
                        records: (local['personal_records'] as Map<String, dynamic>),
                        badges: (local['badges'] as List<Map<String, dynamic>>),
                        percentile: (local['percentile'] as int),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 11: Predictive Analytics & Forecast (Next Week Saves, Deadlines, Optimal Saving)
                    AnalyticsInteractiveCard(
                      child: _buildPredictiveAnalyticsSection(
                        missedCount: (local['missed_deadlines_count'] as int),
                        inPeriodCount: inPeriodCount,
                        peakWindow: (local['peak_window_str'] as String),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 1: Top Header Row with Action Pills
  // ---------------------------------------------------------------------------
  Widget _buildTopHeaderRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Stats Overview',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        Row(
          children: [
            // Share Today button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.sparkles, size: 14, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 6),
                  Text(
                    'SHARE STATS',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Section 2: Mascot Speech Bubble (Live Dynamic)
  // ---------------------------------------------------------------------------
  Widget _buildMascotSpeechBubble({
    required int totalCount,
    required int inPeriodCount,
    required int streakDays,
    required String velocityText,
  }) {
    final String bubbleText;
    if (totalCount == 0) {
      bubbleText = 'Welcome to your knowledge vault! Save your first clip to start your intelligence streak.';
    } else {
      bubbleText = '$inPeriodCount items clipped in $_selectedPeriod. $velocityText. ${streakDays > 0 ? "$streakDays day streak active! 🔥" : "Keep building your library!"}';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          // Speech Bubble
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB), width: 1.0),
              ),
              child: Text(
                bubbleText,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Cute Green Mascot Avatar
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF40916C), // Friendly green
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Smiling Face
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(width: 4, height: 4, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                          const SizedBox(width: 10),
                          Container(width: 4, height: 4, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Container(
                        width: 12,
                        height: 6,
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(color: Colors.white, width: 2),
                          ),
                          borderRadius: BorderRadius.vertical(bottom: Radius.circular(6)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 3: 5 Metric Cards Horizontal Grid (Live Dynamic)
  // ---------------------------------------------------------------------------
  Widget _buildQuickStatsCardRow({
    required int totalCount,
    required int inPeriodCount,
    required int streakDays,
    required String savedValue,
    required String hoursSaved,
    required int actionRate,
    required String velocityText,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Row(
          children: [
            _buildMetricItem('TOTAL SAVED', '$totalCount', '$totalCount clips all-time', null),
            _buildMetricDivider(),
            _buildMetricItem(_selectedPeriod.toUpperCase(), '$inPeriodCount', velocityText, null),
            _buildMetricDivider(),
            _buildMetricItem('SAVE STREAK', '${streakDays}d', streakDays > 0 ? 'Active consistency' : 'Start streak', const Color(0xFF10B981)),
            _buildMetricDivider(),
            _buildMetricItem('SAVED VALUE', savedValue, '$hoursSaved h saved', const Color(0xFF3B82F6)),
            _buildMetricDivider(),
            _buildMetricItem('ACTION RATE', '$actionRate%', 'Opportunities', const Color(0xFF8B5CF6)),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricItem(String title, String value, String subtitle, Color? valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.6,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 4),
          AnimatedCountText(
            rawText: value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: valueColor ?? AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricDivider() {
    return Container(
      width: 1,
      height: 38,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: const Color(0xFFF1F5F9),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 4: Daily Saving Goal Circular Ring Card (Live Dynamic)
  // ---------------------------------------------------------------------------
  Widget _buildDailyFocusCard({required int todayCompleted}) {
    final dailyFocus = _backendData?['daily_focus'];
    final target = (dailyFocus?['target_clips_per_day'] as num?)?.toInt() ?? 10;
    final completed = (dailyFocus?['today_completed'] as num?)?.toInt() ?? todayCompleted;
    final rate = ((completed / target) * 100).round();
    final progress = (completed / target).clamp(0.0, 1.0);
    final isMet = completed >= target;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.target, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  Text(
                    'DAILY SAVING GOAL',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isMet ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      isMet ? LucideIcons.circleCheck : LucideIcons.clock,
                      size: 12,
                      color: isMet ? const Color(0xFF16A34A) : const Color(0xFFB45309),
                    ),
                    const SizedBox(width: 4),
                    AnimatedCountText(
                      value: rate,
                      suffix: '%',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isMet ? const Color(0xFF16A34A) : const Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Gauge + Today's stats
          Row(
            children: [
              // Circular Gauge
              SizedBox(
                width: 90,
                height: 90,
                child: CustomPaint(
                  painter: _GoalRingPainter(
                    progress: progress,
                    progressColor: isMet ? const Color(0xFF16A34A) : const Color(0xFF2D6A4F),
                    backgroundColor: const Color(0xFFDCFCE7),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedCountText(
                          value: completed,
                          style: GoogleFonts.outfit(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                            height: 1.0,
                          ),
                        ),
                        Text(
                          'SAVED',
                          style: GoogleFonts.inter(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              // Description & Goals
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'TODAY',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$completed items clipped & synced',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isMet
                          ? 'Daily reading & bookmark goal achieved! 🎉'
                          : '${(target - completed).clamp(0, target)} more items to hit today\'s target.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Goal Pills
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isMet ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isMet ? LucideIcons.circleCheck : LucideIcons.clock,
                                size: 12,
                                color: isMet ? const Color(0xFF16A34A) : const Color(0xFFB45309),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isMet ? 'GOAL SECURED' : 'IN PROGRESS',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.4,
                                  color: isMet ? const Color(0xFF16A34A) : const Color(0xFFB45309),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'TARGET $target ITEMS',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.4,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 5: Consistency Heatmap Matrix Card
  // ---------------------------------------------------------------------------
  Widget _buildConsistencyHeatmapCard({required List<List<int>> matrixData}) {
    final backendMatrix = _backendData?['contribution_matrix']?['weeks'] as List?;
    List<List<int>> activeMatrix = matrixData;
    if (backendMatrix != null && backendMatrix.isNotEmpty) {
      // Backend returns 52 weeks, take last 20 weeks for mobile display
      final weeksToUse = backendMatrix.reversed.take(20).toList().reversed.toList();
      final List<List<int>> converted = List.generate(4, (_) => List.filled(20, 0));
      for (int c = 0; c < weeksToUse.length && c < 20; c++) {
        final days = weeksToUse[c];
        if (days is List) {
          for (int r = 0; r < days.length && r < 4; r++) {
            final d = days[r];
            if (d is Map) {
              converted[r][c] = (d['intensity'] as num?)?.toInt() ?? ((d['count'] as num?)?.toInt() ?? 0).clamp(0, 4);
            }
          }
        }
      }
      activeMatrix = converted;
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'SAVING ACTIVITY HEATMAP',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppTheme.textMuted,
                ),
              ),
              Row(
                children: [
                  Text(
                    'LESS',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.inactiveGrey,
                    ),
                  ),
                  const SizedBox(width: 4),
                  _buildHeatmapDot(const Color(0xFFF1F5F9)),
                  _buildHeatmapDot(const Color(0xFFBBF7D0)),
                  _buildHeatmapDot(const Color(0xFF4ADE80)),
                  _buildHeatmapDot(const Color(0xFF16A34A)),
                  _buildHeatmapDot(const Color(0xFF166534)),
                  const SizedBox(width: 4),
                  Text(
                    'MORE',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.inactiveGrey,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Heatmap Matrix Grid (4 rows x 20 cols)
          CustomPaint(
            size: const Size(double.infinity, 80),
            painter: _HeatmapMatrixPainter(pattern: activeMatrix),
          ),
        ],
      ),
    );
  }

  Widget _buildHeatmapDot(Color color) {
    return Container(
      width: 8,
      height: 8,
      margin: const EdgeInsets.symmetric(horizontal: 1.5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 6: Density Area Curve & Weekday Rhythm Split Cards (Live Dynamic)
  // ---------------------------------------------------------------------------
  Widget _buildDensityAndRhythmSection({
    required List<double> densityPoints,
    required String densityMeanStr,
    required String densityBadgeStr,
    required List<Map<String, dynamic>> weekdayList,
    required String topWeekdayStr,
  }) {
    final recentMax = densityPoints.isNotEmpty ? densityPoints.reduce(math.max).toInt() : 10;
    return Column(
      children: [
        // Card A: Density Curve
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SAVING DENSITY',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Daily clips & bookmarks',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      densityBadgeStr,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Area density curve
              SizedBox(
                height: 70,
                width: double.infinity,
                child: CustomPaint(
                  painter: _DensityCurvePainter(values: densityPoints),
                ),
              ),
              const SizedBox(height: 6),
              // Bottom Axis labels
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('0 CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text('${math.max(1, (recentMax / 2).round())} CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text('${math.max(2, recentMax)} CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text(densityMeanStr, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Card B: Rhythm (Avg by Weekday)
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SAVING RHYTHM',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Avg clips by weekday',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      topWeekdayStr,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Dynamic Day bars
              ...weekdayList.map((item) => _buildWeekdayBar(
                item['day'] as String,
                (item['percent'] as num).toDouble(),
                item['count'] as String,
                item['isHighlighted'] as bool,
              )),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWeekdayBar(String day, double percent, String countStr, bool isHighlighted) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.5),
      child: Row(
        children: [
          SizedBox(
            width: 34,
            child: Text(
              day,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Stack(
                children: [
                  Container(
                    height: 8,
                    color: const Color(0xFFF1F5F9),
                  ),
                  FractionallySizedBox(
                    widthFactor: percent,
                    child: Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: isHighlighted ? const Color(0xFF2D6A4F) : const Color(0xFF86EFAC),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 36,
            child: Text(
              countStr,
              textAlign: TextAlign.right,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: isHighlighted ? const Color(0xFF2D6A4F) : AppTheme.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 7: Content Breakdown & Specialty Radar Polygon Card
  // ---------------------------------------------------------------------------
  Widget _buildFocusDistributionCard({required List<Map<String, dynamic>> breakdown}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          Text(
            'Saved Content Breakdown',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'A breakdown of your saved knowledge specialty',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 16),

          // Radar / Polygon Diagram (220px height)
          SizedBox(
            height: 220,
            width: double.infinity,
            child: CustomPaint(
              painter: _RadarPolygonPainter(),
            ),
          ),
          const SizedBox(height: 16),

          // Content Types Title + Legend Pills
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Content Types',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                '${breakdown.length} categories',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: breakdown.map((b) => _buildSubjectPill(
                '${b['name']} (${b['count']})',
                (b['color'] as Color?) ?? const Color(0xFF10B981),
              )).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectPill(String title, Color dotColor) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 8: Popular Tags Analytics Breakdown (Live Dynamic)
  // ---------------------------------------------------------------------------
  Widget _buildPopularTagsSection(BuildContext context, {required List<Map<String, dynamic>> tags}) {
    final activeTags = tags.isNotEmpty
        ? tags
        : [
            {'name': 'general', 'count': 0},
          ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
              Text(
                'Top Tag Distribution',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                '${activeTags.length} active tags',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (tags.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Text(
                'No tags found yet. Add tags when clipping to see distribution.',
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
              ),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: activeTags.map((t) {
                return InkWell(
                  onTap: () {
                    final clipsProvider = Provider.of<ClipsProvider>(context, listen: false);
                    clipsProvider.setSearchQuery('#${t['name']}');
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Filtered by #${t['name']}'),
                        duration: const Duration(seconds: 1),
                        backgroundColor: const Color(0xFF16A34A),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '#${t['name']}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${t['count']}',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF16A34A),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 3.5 [NEW]: Streak & Momentum Analytics (Apple Fitness Rings & Momentum)
  // ---------------------------------------------------------------------------
  Widget _buildStreakAndMomentumCard({
    required int streakDays,
    required int todayCompleted,
    required int actionRate,
    required int momentumPct,
  }) {
    final outerProgress = (streakDays / 30.0).clamp(0.0, 1.0);
    final middleProgress = (todayCompleted / 10.0).clamp(0.0, 1.0);
    final innerProgress = (actionRate / 100.0).clamp(0.0, 1.0);
    final goalPct = (middleProgress * 100).round();
    final bestStreak = math.max(streakDays, 7);
    final daysToBeat = math.max(1, (bestStreak + 5) - streakDays);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
                  const SizedBox(width: 8),
                  Text(
                    'STREAK & MOMENTUM',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.trendingUp, size: 13, color: Color(0xFF16A34A)),
                    const SizedBox(width: 4),
                    Text(
                      '+$momentumPct% MOMENTUM',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Tri-Ring + Stats
          Row(
            children: [
              // Concentric Triple Ring (Apple Fitness Style)
              SizedBox(
                width: 96,
                height: 96,
                child: CustomPaint(
                  painter: _AppleFitnessRingsPainter(
                    outerProgress: outerProgress,
                    middleProgress: middleProgress,
                    innerProgress: innerProgress,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '$streakDays',
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                            height: 1.0,
                          ),
                        ),
                        Text(
                          'DAYS',
                          style: GoogleFonts.inter(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: const Color(0xFFEA580C),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              // Metrics Breakdown
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      streakDays > 0 ? '$streakDays day streak active' : 'Start your streak today',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      streakDays >= 7
                          ? 'Consistent saver — Top consistency rating'
                          : (streakDays > 0 ? 'Daily momentum building — save daily to level up' : 'Save 1 clip today to ignite your streak'),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Ring Legends
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: [
                        _buildRingLegendDot(const Color(0xFFEA580C), '${streakDays}d Streak'),
                        _buildRingLegendDot(const Color(0xFF10B981), '$goalPct% Goal'),
                        _buildRingLegendDot(const Color(0xFF06B6D4), '$actionRate% Actioned'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Streak Info Pill Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFFEDD5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.award, size: 14, color: Color(0xFFC2410C)),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          'All-Time Record: $bestStreak Days Streak',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF9A3412),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '$daysToBeat days to beat',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFC2410C),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRingLegendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Section 4.5 [NEW]: Hourly Activity Heatmap (6 AM - 11 PM) & Peak Hours
  // ---------------------------------------------------------------------------
  Widget _buildHourlyActivityHeatmapCard({
    required List<double> hourlyActivity,
    required String peakWindow,
    required int maxHourCount,
  }) {
    final hourlyDist = _backendData?['hourly_distribution'];
    final activePeak = hourlyDist?['peak_window']?.toString() ?? peakWindow;
    final buckets = hourlyDist?['hourly_buckets'] as List?;
    List<double> finalActivity = hourlyActivity;
    if (buckets != null && buckets.isNotEmpty) {
      final bucketMap = <int, int>{};
      for (var b in buckets) {
        if (b is Map && b['hour'] != null) {
          bucketMap[(b['hour'] as num).toInt()] = (b['count'] as num?)?.toInt() ?? 0;
        }
      }
      final maxH = bucketMap.values.isNotEmpty ? bucketMap.values.reduce(math.max) : 1;
      finalActivity = [];
      for (int h = 6; h <= 23; h++) {
        final c = bucketMap[h] ?? 0;
        finalActivity.add(maxH > 0 ? (c / maxH).clamp(0.15, 1.0) : 0.20);
      }
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
                  const Icon(LucideIcons.clock, size: 16, color: Color(0xFF2D6A4F)),
                  const SizedBox(width: 8),
                  Text(
                    'HOURLY SAVING RHYTHM',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  activePeak.replaceAll(' Peak Saving Window', '').replaceAll(' Peak Window', ''),
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF2563EB),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'When do you save most during the day? (6 AM – 11 PM)',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),

          // Hourly Heatmap Bar CustomPaint
          SizedBox(
            height: 52,
            width: double.infinity,
            child: CustomPaint(
              painter: _HourlyHeatmapPainter(activityList: finalActivity),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('6 AM', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
              Text('10 AM (Peak)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF166534))),
              Text('2 PM', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
              Text('6 PM', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
              Text('11 PM', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const Icon(LucideIcons.sparkles, size: 14, color: Color(0xFF10B981)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'You are most active around $activePeak (peak $maxHourCount clips).',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textPrimary,
                    ),
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
  // Section 6.5 [NEW]: Opportunity Outcome Analytics (Funnel, Rates, Missed, Value)
  // ---------------------------------------------------------------------------
  Widget _buildOpportunityOutcomeSection({
    required List<Map<String, dynamic>> stages,
    required int missedCount,
    required String realizedValue,
    required Map<String, String> actionRates,
  }) {
    final oppFunnel = _backendData?['opportunity_funnel'];
    final rawStages = oppFunnel?['stages'] as List?;
    final activeMissed = (oppFunnel?['missed_deadlines_count'] as num?)?.toInt() ?? missedCount;
    final activeRealized = oppFunnel?['realized_value_index']?.toString() ?? realizedValue;

    List<Map<String, dynamic>> finalStages = stages;
    if (rawStages != null && rawStages.length >= 4) {
      final totalDiscovered = (rawStages[0]['count'] as num?)?.toDouble() ?? 1.0;
      final colors = [const Color(0xFF3B82F6), const Color(0xFF6366F1), const Color(0xFF8B5CF6), const Color(0xFF10B981)];
      finalStages = [];
      for (int i = 0; i < 4; i++) {
        final st = rawStages[i];
        final countVal = st['count'] ?? 0;
        final pctVal = (countVal / math.max(1.0, totalDiscovered));
        final ratePct = (st['percentage'] as num?)?.toInt() ?? (pctVal * 100).toInt();
        finalStages.add({
          'name': '${i + 1}. ${st['stage']}',
          'count': '$countVal items',
          'rate': '$ratePct%',
          'pct': pctVal.clamp(0.1, 1.0),
          'color': colors[i % colors.length],
        });
      }
    }

    final actionRatePct = finalStages.length > 2 ? finalStages[2]['rate'] : '34%';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(LucideIcons.briefcase, size: 16, color: Color(0xFF2563EB)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'OPPORTUNITY OUTCOMES',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  actionRatePct.contains('Action Rate') ? actionRatePct : '$actionRatePct Action Rate',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1D4ED8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Jobs & Application Conversion Funnel',
            style: GoogleFonts.outfit(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 14),

          // Funnel Chart
          SizedBox(
            height: 130,
            width: double.infinity,
            child: CustomPaint(
              painter: _OpportunityFunnelPainter(stagesList: finalStages),
            ),
          ),
          const SizedBox(height: 14),

          // Action Rate Breakdown Chips
          Row(
            children: [
              Expanded(child: _buildActionRateBox('Jobs', actionRates['Jobs'] ?? '0%', const Color(0xFF2563EB))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Events', actionRates['Events'] ?? '0%', const Color(0xFF10B981))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Articles', actionRates['Articles'] ?? '0%', const Color(0xFFF59E0B))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Tools', actionRates['Tools'] ?? '0%', const Color(0xFF8B5CF6))),
            ],
          ),
          const SizedBox(height: 14),

          // Missed Opportunities Alert Banner
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: activeMissed > 0 ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: activeMissed > 0 ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  activeMissed > 0 ? LucideIcons.circleAlert : LucideIcons.circleCheck,
                  size: 18,
                  color: activeMissed > 0 ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activeMissed > 0
                            ? '$activeMissed Opportunities Expired Unactioned'
                            : 'All Saved Opportunities Current & Active',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: activeMissed > 0 ? const Color(0xFF991B1B) : const Color(0xFF166534),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        activeMissed > 0
                            ? 'Jobs, events, and scholarships passed deadlines recently. Act earlier to secure slots!'
                            : 'Zero overdue deadlines detected across your research and job pipelines.',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: activeMissed > 0 ? const Color(0xFFB91C1C) : const Color(0xFF15803D),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Opportunity Value Score Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDCFCE7)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(LucideIcons.badgeDollarSign, size: 18, color: Color(0xFF16A34A)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Opportunity Value Captured',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF166534),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              activeRealized,
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF14532D),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '+18% VS LAST MONTH',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF16A34A),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionRateBox(String title, String rate, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 2),
          Text(
            rate,
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }



  // ---------------------------------------------------------------------------
  // Section 9 [NEW]: Destination & Sync Health Analytics
  // ---------------------------------------------------------------------------
  Widget _buildDestinationAndSyncSection({
    required int syncedCount,
    required int totalCount,
  }) {
    final syncPct = totalCount > 0 ? ((syncedCount / totalCount) * 100).round() : 100;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
              Expanded(
                child: Row(
                  children: [
                    const Icon(LucideIcons.refreshCw, size: 16, color: Color(0xFF10B981)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'DESTINATION & SYNC HEALTH',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '$syncedCount Records Synced',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Destination Sync Status Cards
          _buildSyncStatusRow('Local Vault Cache', '100%', '$totalCount records stored locally', 'Always available offline', true),
          const SizedBox(height: 8),
          _buildSyncStatusRow('Backend Cloud Sync', '$syncPct%', '$syncedCount of $totalCount synced to server', syncedCount == totalCount ? 'All caught up' : '${totalCount - syncedCount} pending sync', syncedCount >= (totalCount * 0.8).floor()),
          const SizedBox(height: 8),
          _buildSyncStatusRow('Export Integrations', 'Active', 'Notion / Sheets export ready', 'Sync engine connected', true),
        ],
      ),
    );
  }

  Widget _buildSyncStatusRow(String name, String percentage, String count, String status, bool isHealthy) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                isHealthy ? LucideIcons.circleCheck : LucideIcons.circleAlert,
                size: 16,
                color: isHealthy ? const Color(0xFF16A34A) : const Color(0xFFF59E0B),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  Text(
                    count,
                    style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                percentage,
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              Text(
                status,
                style: GoogleFonts.inter(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: isHealthy ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 10 [NEW]: Personal Records & Achievement Badges (Gamification)
  // ---------------------------------------------------------------------------
  Widget _buildPersonalRecordsAndBadgesSection({
    required Map<String, dynamic> records,
    required List<Map<String, dynamic>> badges,
    required int percentile,
  }) {
    final topPct = math.max(1, 100 - percentile);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          // Header + Leaderboard Rank
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.trophy, size: 16, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 8),
                  Text(
                    'ACHIEVEMENTS & RECORDS',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Top $topPct% Global',
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

          // Personal Bests Grid
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                _buildRecordRow('Most clips in one day', records['max_day']?.toString() ?? '0 clips'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Most clips in one week', records['max_week']?.toString() ?? '0 clips'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Most used tag', records['top_tag']?.toString() ?? 'None'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Favorite source', records['top_source']?.toString() ?? 'Direct clip'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Duolingo-style Badges Grid
          Text(
            'Earned Badges',
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: badges.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 0.88,
            ),
            itemBuilder: (context, idx) {
              final b = badges[idx];
              final unlocked = b['unlocked'] as bool;
              return Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: unlocked ? const Color(0xFFF0FDF4) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: unlocked ? const Color(0xFFBBF7D0) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      b['emoji'] as String,
                      style: TextStyle(
                        fontSize: 24,
                        color: unlocked ? Colors.black : Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      b['title'] as String,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: unlocked ? AppTheme.textPrimary : AppTheme.inactiveGrey,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      unlocked ? 'Unlocked' : 'In Progress',
                      style: GoogleFonts.inter(
                        fontSize: 8,
                        fontWeight: FontWeight.w600,
                        color: unlocked ? const Color(0xFF16A34A) : AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecordRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted)),
        Text(value, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Section 11 [NEW]: Predictive Analytics & Forecast (Save Projections, Deadlines)
  // ---------------------------------------------------------------------------
  Widget _buildPredictiveAnalyticsSection({
    required int missedCount,
    required int inPeriodCount,
    required String peakWindow,
  }) {
    final projectedCount = math.max(3, (inPeriodCount * 1.3).round());

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
                  const Icon(LucideIcons.sparkles, size: 16, color: Color(0xFF9333EA)),
                  const SizedBox(width: 8),
                  Text(
                    'PREDICTIVE INTELLIGENCE',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3E8FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'AI FORECAST',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF9333EA),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Prediction 1: Save Forecast
          _buildPredictiveCard(
            icon: LucideIcons.trendingUp,
            iconColor: const Color(0xFF10B981),
            title: 'Next Period Save Forecast',
            highlight: '~$projectedCount clips projected',
            body: 'Based on your recent rolling clipping pattern and save velocity.',
          ),
          const SizedBox(height: 10),

          // Prediction 2: Deadline Risk Warning
          _buildPredictiveCard(
            icon: LucideIcons.hourglass,
            iconColor: missedCount > 0 ? const Color(0xFFEA580C) : const Color(0xFF10B981),
            title: 'Deadline Risk & Actioning',
            highlight: missedCount > 0 ? '$missedCount items near/past deadline' : 'All deadlines healthy',
            body: missedCount > 0
                ? 'Review your flagged jobs and events before expiration dates pass.'
                : 'Great job staying proactive with your saved opportunities!',
          ),
          const SizedBox(height: 10),

          // Prediction 3: Optimal Save Habit Advice
          _buildPredictiveCard(
            icon: LucideIcons.lightbulb,
            iconColor: const Color(0xFFF59E0B),
            title: 'Peak Productivity Window',
            highlight: peakWindow.isNotEmpty ? peakWindow : 'Morning (9 AM - 11 AM)',
            body: 'You are most active and likely to action clips during your peak focus window.',
          ),
        ],
      ),
    );
  }

  Widget _buildPredictiveCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String highlight,
    required String body,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    Text(
                      highlight,
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: iconColor),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  body,
                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Section 8 [NEW]: Clips Over Time Interactive Line Chart (Total | By Type)
  // ---------------------------------------------------------------------------
  Widget _buildClipsOverTimeCard({
    required List<double> last7DaysTotal,
    required List<String> labels,
    required List<Map<String, dynamic>> breakdown,
  }) {
    final backendTimeline = _backendData?['timeline']?['counts'] as List?;
    List<double> finalTotal = last7DaysTotal;
    if (backendTimeline != null && backendTimeline.isNotEmpty) {
      finalTotal = backendTimeline.map((e) => (e as num).toDouble()).toList();
    }

    final double maxVal = finalTotal.isNotEmpty ? finalTotal.reduce(math.max) : 0;
    final int peakIdx = finalTotal.isNotEmpty ? finalTotal.indexOf(maxVal) : -1;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CLIPS OVER TIME',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Saving velocity & history',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              // Segmented Toggle Pill: Total | By Type
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    _buildTimeTogglePill('Total', _clipsOverTimeMode == 'Total'),
                    _buildTimeTogglePill('By Type', _clipsOverTimeMode == 'By Type'),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Interactive Line Chart CustomPaint
          SizedBox(
            height: 160,
            width: double.infinity,
            child: CustomPaint(
              painter: _ClipsOverTimeLinePainter(
                mode: _clipsOverTimeMode,
                totalData: finalTotal,
                breakdown: breakdown,
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Legend Row
          if (_clipsOverTimeMode == 'By Type')
            Wrap(
              spacing: 12,
              runSpacing: 6,
              children: breakdown.isNotEmpty
                  ? breakdown.take(5).map((b) => _buildTypeLegendDot(
                        (b['color'] as Color?) ?? const Color(0xFF22C55E),
                        b['name'] as String,
                      )).toList()
                  : [
                      _buildTypeLegendDot(const Color(0xFF22C55E), 'Jobs'),
                      _buildTypeLegendDot(const Color(0xFF3B82F6), 'Articles'),
                      _buildTypeLegendDot(const Color(0xFFA78BFA), 'Events'),
                      _buildTypeLegendDot(const Color(0xFFF97316), 'Tools'),
                      _buildTypeLegendDot(const Color(0xFFEC4899), 'Music'),
                    ],
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(labels.length, (idx) {
                final isPeak = idx == peakIdx && maxVal > 0;
                final text = labels[idx] + (isPeak ? ' (Peak)' : '');
                return Text(
                  text,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: isPeak ? FontWeight.bold : FontWeight.normal,
                    color: isPeak ? const Color(0xFF166534) : AppTheme.inactiveGrey,
                  ),
                );
              }),
            ),
        ],
      ),
    );
  }

  Widget _buildTimeTogglePill(String title, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _clipsOverTimeMode = title;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? AppTheme.textPrimary : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildTypeLegendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Section 9 [NEW]: Saved Content Breakdown Donut Chart
  // ---------------------------------------------------------------------------
  Widget _buildContentTypeDonutCard({
    required List<Map<String, dynamic>> breakdown,
    required int totalCount,
  }) {
    final activeBreakdown = breakdown.isNotEmpty
        ? breakdown
        : [
            {'name': 'No Clips', 'count': 0, 'pct': 100, 'color': const Color(0xFF94A3B8)},
          ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
          Text(
            'SAVED CONTENT BREAKDOWN',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'A breakdown of your saved knowledge specialty',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 16),

          Row(
            children: [
              // Left: Donut Chart with 60% center hole
              SizedBox(
                width: 130,
                height: 130,
                child: CustomPaint(
                  painter: _ContentTypeDonutPainter(
                    breakdown: activeBreakdown,
                    selectedIndex: _selectedDonutIndex,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedCountText(
                          value: totalCount,
                          style: GoogleFonts.outfit(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                            height: 1.0,
                          ),
                        ),
                        Text(
                          'TOTAL',
                          style: GoogleFonts.inter(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 18),
              // Right: Legend list
              Expanded(
                child: Column(
                  children: activeBreakdown.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    final isSelected = _selectedDonutIndex == idx;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _selectedDonutIndex = (_selectedDonutIndex == idx) ? -1 : idx;
                        });
                      },
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 4),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFF1F5F9) : Colors.transparent,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: item['color'] as Color,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  item['name'] as String,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Text(
                                  '${item['count']}',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                SizedBox(
                                  width: 32,
                                  child: Text(
                                    '${item['pct']}%',
                                    textAlign: TextAlign.right,
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }



  // ---------------------------------------------------------------------------
  // Loading Shimmer Skeleton Placeholders
  // ---------------------------------------------------------------------------
  Widget _buildShimmerSkeletonLoading() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildShimmerBox(height: 60, width: double.infinity, radius: 18),
          const SizedBox(height: 16),
          _buildShimmerBox(height: 90, width: double.infinity, radius: 18),
          const SizedBox(height: 16),
          _buildShimmerBox(height: 180, width: double.infinity, radius: 18),
          const SizedBox(height: 16),
          _buildShimmerBox(height: 220, width: double.infinity, radius: 18),
          const SizedBox(height: 16),
          _buildShimmerBox(height: 160, width: double.infinity, radius: 18),
        ],
      ),
    );
  }

  Widget _buildShimmerBox({required double height, required double width, required double radius}) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

// =============================================================================
// CUSTOM PAINTERS (Green + White Theme)
// =============================================================================

/// Goal Ring Circular Gauge Painter
class _GoalRingPainter extends CustomPainter {
  final double progress;
  final Color progressColor;
  final Color backgroundColor;

  _GoalRingPainter({
    required this.progress,
    required this.progressColor,
    required this.backgroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 10) / 2;

    // Background track
    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    final progressPaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * math.pi * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweepAngle,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _GoalRingPainter oldDelegate) => true;
}

/// Consistency Heatmap Grid Painter
class _HeatmapMatrixPainter extends CustomPainter {
  final List<List<int>>? pattern;

  _HeatmapMatrixPainter({this.pattern});

  @override
  void paint(Canvas canvas, Size size) {
    const rows = 4;
    const cols = 20;
    final itemSize = (size.width - (cols - 1) * 4) / cols;

    // Pattern of greens
    final greenShades = [
      const Color(0xFFF1F5F9), // 0: empty
      const Color(0xFFBBF7D0), // 1: light
      const Color(0xFF4ADE80), // 2: medium
      const Color(0xFF16A34A), // 3: vibrant
      const Color(0xFF166534), // 4: dark
    ];

    // Dynamic or Seeded pattern representing active saving days
    final activePattern = (pattern != null && pattern!.length >= 4)
        ? pattern!
        : [
            [3, 4, 3, 2, 4, 3, 4, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 0, 3, 4],
            [4, 3, 4, 4, 3, 4, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 2, 4],
            [3, 4, 3, 4, 3, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3],
            [2, 3, 4, 0, 0, 3, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          ];

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final shadeIdx = activePattern[r][c].clamp(0, 4);
        if (shadeIdx == 0 && r == 3 && c > 8 && pattern == null) continue;

        final paint = Paint()
          ..color = greenShades[shadeIdx]
          ..style = PaintingStyle.fill;

        final rect = RRect.fromRectAndRadius(
          Rect.fromLTWH(
            c * (itemSize + 4),
            r * (itemSize + 4),
            itemSize,
            itemSize,
          ),
          const Radius.circular(2.5),
        );
        canvas.drawRRect(rect, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _HeatmapMatrixPainter oldDelegate) => true;
}

/// Density Curve Shaded Area Painter
class _DensityCurvePainter extends CustomPainter {
  final List<double>? values;

  _DensityCurvePainter({this.values});

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path();
    final fillPath = Path();

    final raw = (values != null && values!.length >= 4)
        ? values!
        : [0.10, 0.85, 0.40, 0.25, 0.20, 0.10];

    final maxV = raw.reduce(math.max);
    final count = raw.length;
    final stepX = size.width / math.max(1, count - 1);

    final List<Offset> points = [];
    for (int i = 0; i < count; i++) {
      final x = i * stepX;
      final norm = maxV > 0 ? (raw[i] / maxV) : 0.2;
      final y = size.height - (norm * (size.height * 0.82)) - 6;
      points.add(Offset(x, y));
    }

    path.moveTo(points[0].dx, points[0].dy);
    fillPath.moveTo(0, size.height);
    fillPath.lineTo(points[0].dx, points[0].dy);

    for (int i = 0; i < points.length - 1; i++) {
      final p0 = points[i];
      final p1 = points[i + 1];
      final cx = (p0.dx + p1.dx) / 2;
      path.cubicTo(cx, p0.dy, cx, p1.dy, p1.dx, p1.dy);
      fillPath.cubicTo(cx, p0.dy, cx, p1.dy, p1.dx, p1.dy);
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    // Fill Gradient
    final fillPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF86EFAC), Color(0x0086EFAC)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    // Stroke
    final strokePaint = Paint()
      ..color = const Color(0xFF2D6A4F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _DensityCurvePainter oldDelegate) => true;
}

/// Radar / Category Polygon Distribution Painter
class _RadarPolygonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 32;

    final categories = [
      'Articles',
      'Engineering',
      'Research Papers',
      'Design & UI',
      'Tools & Libs',
      'Podcasts & Audio',
      'Job Postings',
      'Strategy & Docs',
    ];

    final values = [0.45, 0.88, 0.90, 0.72, 0.55, 0.65, 0.40, 0.35];
    final angleStep = (2 * math.pi) / categories.length;

    // Draw Category Labels around circle
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i < categories.length; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final labelRadius = radius + 22;
      final lx = center.dx + labelRadius * math.cos(angle);
      final ly = center.dy + labelRadius * math.sin(angle);

      textPainter.text = TextSpan(
        text: categories[i],
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w500,
          color: const Color(0xFF64748B),
        ),
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(lx - textPainter.width / 2, ly - textPainter.height / 2),
      );
    }

    // Draw Filled Green Shape Polygon
    final polyPath = Path();
    for (int i = 0; i < categories.length; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final r = radius * values[i];
      final px = center.dx + r * math.cos(angle);
      final py = center.dy + r * math.sin(angle);

      if (i == 0) {
        polyPath.moveTo(px, py);
      } else {
        polyPath.lineTo(px, py);
      }
    }
    polyPath.close();

    // Fill
    final fillPaint = Paint()
      ..color = const Color(0xFF86EFAC).withValues(alpha: 0.65)
      ..style = PaintingStyle.fill;
    canvas.drawPath(polyPath, fillPaint);

    // Outline
    final outlinePaint = Paint()
      ..color = const Color(0xFF2D6A4F)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(polyPath, outlinePaint);
  }

  @override
  bool shouldRepaint(covariant _RadarPolygonPainter oldDelegate) => false;
}

/// Triple Concentric Ring Painter (Apple Fitness Style)
class _AppleFitnessRingsPainter extends CustomPainter {
  final double outerProgress;  // Streak (27/30)
  final double middleProgress; // Goal (100%)
  final double innerProgress;  // Action (34%)

  _AppleFitnessRingsPainter({
    required this.outerProgress,
    required this.middleProgress,
    required this.innerProgress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    const strokeW = 6.5;
    const gap = 3.0;

    final outerRadius = (size.width - strokeW) / 2;
    final middleRadius = outerRadius - strokeW - gap;
    final innerRadius = middleRadius - strokeW - gap;

    _drawRing(canvas, center, outerRadius, outerProgress, const Color(0xFFEA580C), const Color(0xFFFFEDD5), strokeW);
    _drawRing(canvas, center, middleRadius, middleProgress, const Color(0xFF10B981), const Color(0xFFDCFCE7), strokeW);
    _drawRing(canvas, center, innerRadius, innerProgress, const Color(0xFF06B6D4), const Color(0xFFCFFAFE), strokeW);
  }

  void _drawRing(Canvas canvas, Offset center, double radius, double progress, Color fg, Color bg, double strokeW) {
    final bgPaint = Paint()
      ..color = bg
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW;
    canvas.drawCircle(center, radius, bgPaint);

    final fgPaint = Paint()
      ..color = fg
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeW
      ..strokeCap = StrokeCap.round;

    final sweep = 2 * math.pi * progress.clamp(0.0, 1.0);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      sweep,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _AppleFitnessRingsPainter oldDelegate) => true;
}

/// Hourly Heatmap (6 AM – 11 PM) Bar Painter
class _HourlyHeatmapPainter extends CustomPainter {
  final List<double>? activityList;

  _HourlyHeatmapPainter({this.activityList});

  @override
  void paint(Canvas canvas, Size size) {
    const hours = 18; // 6am to 11pm
    final barW = (size.width - (hours - 1) * 3) / hours;

    // Intensity values (0.0 to 1.0) simulating hourly distribution
    final hourlyActivity = (activityList != null && activityList!.length == hours)
        ? activityList!
        : [
            0.15, // 6 AM
            0.25, // 7 AM
            0.50, // 8 AM
            0.95, // 9 AM (Peak)
            1.00, // 10 AM (Peak)
            0.85, // 11 AM
            0.40, // 12 PM
            0.45, // 1 PM
            0.70, // 2 PM
            0.75, // 3 PM
            0.60, // 4 PM
            0.50, // 5 PM
            0.35, // 6 PM
            0.40, // 7 PM
            0.65, // 8 PM
            0.70, // 9 PM
            0.30, // 10 PM
            0.20, // 11 PM
          ];

    for (int i = 0; i < hours; i++) {
      final val = hourlyActivity[i];
      final h = size.height * (0.25 + val * 0.75);
      final x = i * (barW + 3);
      final y = size.height - h;

      Color color;
      if (val >= 0.85) {
        color = const Color(0xFF166534); // Deep Dark Green (Peak)
      } else if (val >= 0.60) {
        color = const Color(0xFF16A34A); // Vibrant Green
      } else if (val >= 0.35) {
        color = const Color(0xFF4ADE80); // Light Green
      } else {
        color = const Color(0xFFBBF7D0); // Pale Green
      }

      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

      final rrect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y, barW, h),
        const Radius.circular(3),
      );
      canvas.drawRRect(rrect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _HourlyHeatmapPainter oldDelegate) => false;
}

/// Opportunity Conversion Funnel Chart Painter
class _OpportunityFunnelPainter extends CustomPainter {
  final List<Map<String, dynamic>>? stagesList;

  _OpportunityFunnelPainter({this.stagesList});

  @override
  void paint(Canvas canvas, Size size) {
    final stages = (stagesList != null && stagesList!.length >= 4)
        ? stagesList!
        : [
            {'name': '1. Saved', 'count': '47 clips', 'rate': '100%', 'pct': 1.0, 'color': const Color(0xFF3B82F6)},
            {'name': '2. Applied', 'count': '18 jobs', 'rate': '38%', 'pct': 0.70, 'color': const Color(0xFF6366F1)},
            {'name': '3. Interview', 'count': '8 rounds', 'rate': '17%', 'pct': 0.44, 'color': const Color(0xFF8B5CF6)},
            {'name': '4. Offer', 'count': '2 offers', 'rate': '4%', 'pct': 0.22, 'color': const Color(0xFF10B981)},
          ];

    final rowHeight = (size.height - 18) / 4;
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (int i = 0; i < stages.length; i++) {
      final s = stages[i];
      final y = i * (rowHeight + 6);
      final pct = s['pct'] as double;
      final color = s['color'] as Color;
      final fullWidth = size.width - 90; // leave space for right tags

      // Background Bar
      final bgPaint = Paint()
        ..color = const Color(0xFFF1F5F9)
        ..style = PaintingStyle.fill;
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(0, y, fullWidth, rowHeight), const Radius.circular(6)),
        bgPaint,
      );

      // Active Gradient Fill
      final fillPaint = Paint()
        ..shader = LinearGradient(
          colors: [color.withValues(alpha: 0.95), color.withValues(alpha: 0.75)],
        ).createShader(Rect.fromLTWH(0, y, fullWidth * pct, rowHeight))
        ..style = PaintingStyle.fill;

      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(0, y, fullWidth * pct, rowHeight), const Radius.circular(6)),
        fillPaint,
      );

      // Left Stage Text inside bar
      textPainter.text = TextSpan(
        text: '${s['name']} — ${s['count']}',
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(8, y + (rowHeight - textPainter.height) / 2));

      // Right Rate Pill
      textPainter.text = TextSpan(
        text: s['rate'] as String,
        style: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(size.width - 45, y + (rowHeight - textPainter.height) / 2));
    }
  }

  @override
  bool shouldRepaint(covariant _OpportunityFunnelPainter oldDelegate) => false;
}



/// Interactive Clips Over Time Line Painter (Total Curve or 5-Type Multi-Line)
class _ClipsOverTimeLinePainter extends CustomPainter {
  final String mode; // 'Total' or 'By Type'
  final List<double>? totalData;
  final List<Map<String, dynamic>>? breakdown;

  _ClipsOverTimeLinePainter({
    required this.mode,
    this.totalData,
    this.breakdown,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Draw subtle horizontal background grid lines
    final gridPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (int i = 0; i <= 3; i++) {
      final y = size.height * (i / 3);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    if (mode == 'Total') {
      // Total clips single curve (Emerald green with shaded area)
      final rawData = (totalData != null && totalData!.length >= 4)
          ? totalData!
          : [12.0, 24.0, 18.0, 32.0, 48.0, 42.0, 52.0];
      final maxFound = rawData.isNotEmpty ? rawData.reduce(math.max) : 10.0;
      final maxVal = math.max(maxFound, 5.0);
      final stepX = size.width / math.max(1, rawData.length - 1);

      final path = Path();
      final fillPath = Path();

      for (int i = 0; i < rawData.length; i++) {
        final x = i * stepX;
        final y = size.height - (rawData[i] / maxVal) * (size.height - 14) - 7;

        if (i == 0) {
          path.moveTo(x, y);
          fillPath.moveTo(x, size.height);
          fillPath.lineTo(x, y);
        } else {
          final prevX = (i - 1) * stepX;
          final prevY = size.height - (rawData[i - 1] / maxVal) * (size.height - 14) - 7;
          final cx = (prevX + x) / 2;
          path.cubicTo(cx, prevY, cx, y, x, y);
          fillPath.cubicTo(cx, prevY, cx, y, x, y);
        }
      }

      fillPath.lineTo(size.width, size.height);
      fillPath.close();

      // Shaded Gradient Fill below curve
      final fillPaint = Paint()
        ..shader = const LinearGradient(
          colors: [Color(0x3310B981), Color(0x0010B981)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
        ..style = PaintingStyle.fill;
      canvas.drawPath(fillPath, fillPaint);

      // Stroke Curve
      final strokePaint = Paint()
        ..color = const Color(0xFF10B981)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(path, strokePaint);

      // Draw active dots on points
      final dotBgPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      final dotPaint = Paint()
        ..color = const Color(0xFF047857)
        ..style = PaintingStyle.fill;

      for (int i = 0; i < rawData.length; i++) {
        final x = i * stepX;
        final y = size.height - (rawData[i] / maxVal) * (size.height - 14) - 7;
        canvas.drawCircle(Offset(x, y), 4, dotBgPaint);
        canvas.drawCircle(Offset(x, y), 2.5, dotPaint);
      }
    } else {
      // By Type: dynamically compute lines proportional to content breakdown if available
      final rawData = (totalData != null && totalData!.length >= 4)
          ? totalData!
          : [12.0, 24.0, 18.0, 32.0, 48.0, 42.0, 52.0];
      final maxVal = math.max(rawData.reduce(math.max), 10.0);

      if (breakdown != null && breakdown!.isNotEmpty) {
        for (final item in breakdown!.take(5)) {
          final pct = ((item['pct'] as num?)?.toDouble() ?? 20.0) / 100.0;
          final color = (item['color'] as Color?) ?? const Color(0xFF22C55E);
          final series = rawData.map((d) => d * pct).toList();
          _drawLineSeries(canvas, size, series, maxVal, color);
        }
      } else {
        final jobsData = [4.0, 8.0, 6.0, 12.0, 15.0, 14.0, 18.0];
        final articlesData = [3.0, 7.0, 5.0, 8.0, 10.0, 9.0, 11.0];
        final toolsData = [2.0, 4.0, 3.0, 6.0, 7.0, 6.0, 8.0];
        final eventsData = [1.0, 3.0, 2.0, 4.0, 4.0, 5.0, 5.0];
        final musicData = [1.0, 2.0, 1.0, 2.0, 3.0, 2.0, 3.0];

        _drawLineSeries(canvas, size, jobsData, 20.0, const Color(0xFF22C55E));
        _drawLineSeries(canvas, size, articlesData, 20.0, const Color(0xFF3B82F6));
        _drawLineSeries(canvas, size, toolsData, 20.0, const Color(0xFFF97316));
        _drawLineSeries(canvas, size, eventsData, 20.0, const Color(0xFFA78BFA));
        _drawLineSeries(canvas, size, musicData, 20.0, const Color(0xFFEC4899));
      }
    }
  }

  void _drawLineSeries(Canvas canvas, Size size, List<double> data, double maxVal, Color color) {
    final path = Path();
    final stepX = size.width / (data.length - 1);

    for (int i = 0; i < data.length; i++) {
      final x = i * stepX;
      final y = size.height - (data[i] / maxVal) * (size.height - 12) - 6;

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        final prevX = (i - 1) * stepX;
        final prevY = size.height - (data[i - 1] / maxVal) * (size.height - 12) - 6;
        final cx = (prevX + x) / 2;
        path.cubicTo(cx, prevY, cx, y, x, y);
      }
    }

    final strokePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(covariant _ClipsOverTimeLinePainter oldDelegate) => true;
}

/// Content Type Donut Chart Painter (with 60% center hole & segment highlight)
class _ContentTypeDonutPainter extends CustomPainter {
  final List<Map<String, dynamic>> breakdown;
  final int selectedIndex;

  _ContentTypeDonutPainter({
    required this.breakdown,
    required this.selectedIndex,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final outerRadius = size.width / 2;
    final strokeWidth = outerRadius * 0.40; // 60% center hole
    final drawRadius = outerRadius - strokeWidth / 2;

    double startAngle = -math.pi / 2;

    for (int i = 0; i < breakdown.length; i++) {
      final item = breakdown[i];
      final pct = (item['pct'] as num).toDouble();
      final sweepAngle = (pct / 100) * 2 * math.pi;
      final isSelected = selectedIndex == i;

      final paint = Paint()
        ..color = item['color'] as Color
        ..style = PaintingStyle.stroke
        ..strokeWidth = isSelected ? strokeWidth + 4 : strokeWidth;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: isSelected ? drawRadius + 2 : drawRadius),
        startAngle,
        sweepAngle - 0.04, // slight 0.04 rad gap between segments
        false,
        paint,
      );

      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(covariant _ContentTypeDonutPainter oldDelegate) =>
      oldDelegate.selectedIndex != selectedIndex;
}

// -----------------------------------------------------------------------------
// Interactive Tactile Card Component (Framer-Motion style spring physics)
// -----------------------------------------------------------------------------
class AnalyticsInteractiveCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleDownFactor;

  const AnalyticsInteractiveCard({
    super.key,
    required this.child,
    this.onTap,
    this.scaleDownFactor = 0.985,
  });

  @override
  State<AnalyticsInteractiveCard> createState() => _AnalyticsInteractiveCardState();
}

class _AnalyticsInteractiveCardState extends State<AnalyticsInteractiveCard> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 200),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleDownFactor,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
      reverseCurve: Curves.easeOutBack,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    _controller.forward();
    try {
      HapticFeedback.selectionClick();
    } catch (_) {}
  }

  void _handleTapUp(TapUpDetails _) {
    _controller.reverse();
    widget.onTap?.call();
  }

  void _handleTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        behavior: HitTestBehavior.translucent,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) {
            double scale = _scaleAnimation.value;
            if (_isHovered && !_controller.isAnimating && _controller.value == 0.0) {
              scale = 1.006;
            }
            return Transform.scale(
              scale: scale,
              child: child,
            );
          },
          child: widget.child,
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// Animated Rolling Number Counter (matches Web's Framer useSpring counter)
// -----------------------------------------------------------------------------
class AnimatedCountText extends StatefulWidget {
  final num? value;
  final String? rawText;
  final String prefix;
  final String suffix;
  final int fractionDigits;
  final TextStyle? style;
  final Duration duration;

  const AnimatedCountText({
    super.key,
    this.value,
    this.rawText,
    this.prefix = '',
    this.suffix = '',
    this.fractionDigits = 0,
    this.style,
    this.duration = const Duration(milliseconds: 1100),
  });

  @override
  State<AnimatedCountText> createState() => _AnimatedCountTextState();
}

class _AnimatedCountTextState extends State<AnimatedCountText> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  double _fromValue = 0.0;
  double _toValue = 0.0;
  String _parsedPrefix = '';
  String _parsedSuffix = '';
  bool _isFloat = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _extractValues();
    _animation = Tween<double>(begin: _fromValue, end: _toValue).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  void _extractValues() {
    if (widget.value != null) {
      _toValue = widget.value!.toDouble();
      _parsedPrefix = widget.prefix;
      _parsedSuffix = widget.suffix;
      _isFloat = widget.fractionDigits > 0 || (widget.value is double && widget.value! % 1 != 0);
      return;
    }

    final raw = widget.rawText?.trim() ?? '';
    final match = RegExp(r'^([^0-9.-]*)([-+]?[0-9]*\.?[0-9]+)(.*)$').firstMatch(raw);
    if (match != null) {
      _parsedPrefix = widget.prefix.isNotEmpty ? widget.prefix : (match.group(1) ?? '');
      final numStr = match.group(2) ?? '0';
      _toValue = double.tryParse(numStr) ?? 0.0;
      _parsedSuffix = widget.suffix.isNotEmpty ? widget.suffix : (match.group(3) ?? '');
      _isFloat = numStr.contains('.') || widget.fractionDigits > 0;
    } else {
      _parsedPrefix = raw;
      _toValue = 0.0;
      _parsedSuffix = '';
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedCountText oldWidget) {
    super.didUpdateWidget(oldWidget);
    final oldTo = _toValue;
    _extractValues();
    if (oldTo != _toValue) {
      _fromValue = oldTo;
      _animation = Tween<double>(begin: _fromValue, end: _toValue).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
      );
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _formatNumber(double val) {
    if (_isFloat) {
      final digits = widget.fractionDigits > 0 ? widget.fractionDigits : 1;
      return val.toStringAsFixed(digits);
    } else {
      final intVal = val.round();
      final str = intVal.toString();
      final reg = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
      return str.replaceAllMapped(reg, (Match m) => '${m[1]},');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.rawText != null && !RegExp(r'\d').hasMatch(widget.rawText!)) {
      return Text(widget.rawText!, style: widget.style);
    }

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, _) {
        final formatted = _formatNumber(_animation.value);
        return Text(
          '$_parsedPrefix$formatted$_parsedSuffix',
          style: widget.style,
        );
      },
    );
  }
}



