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

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final allClips = clipsProvider.clips;
    final totalCount = allClips.isNotEmpty ? allClips.length : 1369;

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
                    AnalyticsInteractiveCard(child: _buildMascotSpeechBubble()),
                    const SizedBox(height: 16),

                    // Section 3: 5-Metric Quick Stats Card Row
                    AnalyticsInteractiveCard(child: _buildQuickStatsCardRow(totalCount)),
                    const SizedBox(height: 16),

                    // Section 3.5: Streak & Momentum Analytics (Fitness Rings, +34% Momentum)
                    AnalyticsInteractiveCard(child: _buildStreakAndMomentumCard()),
                    const SizedBox(height: 16),

                    // Section 4: Daily Saving Goal Circular Ring Card
                    AnalyticsInteractiveCard(child: _buildDailyFocusCard()),
                    const SizedBox(height: 16),

                    // Section 4.5: Hourly Activity Heatmap (6am - 11pm) & Peak Window
                    AnalyticsInteractiveCard(child: _buildHourlyActivityHeatmapCard()),
                    const SizedBox(height: 16),

                    // Section 5: Consistency Heatmap Matrix Card
                    AnalyticsInteractiveCard(child: _buildConsistencyHeatmapCard()),
                    const SizedBox(height: 16),

                    // Section 6: Density Area Curve & Weekday Rhythm Split Cards
                    AnalyticsInteractiveCard(child: _buildDensityAndRhythmSection()),
                    const SizedBox(height: 16),

                    // Section 6.5: Opportunity Outcome Analytics (Funnel, Action Rates, Missed Opportunities, Value Score)
                    AnalyticsInteractiveCard(child: _buildOpportunityOutcomeSection()),
                    const SizedBox(height: 16),

                    // Section 6.6: Content Intelligence & 10-Axis Knowledge Graph Radar
                    AnalyticsInteractiveCard(child: _buildContentIntelligenceSection()),
                    const SizedBox(height: 16),

                    // Section 8 [NEW]: Clips Over Time Interactive Line Chart (Total | By Type)
                    AnalyticsInteractiveCard(child: _buildClipsOverTimeCard()),
                    const SizedBox(height: 16),

                    // Section 9 [NEW]: Content Type Donut Chart with interactive legend
                    AnalyticsInteractiveCard(child: _buildContentTypeDonutCard()),
                    const SizedBox(height: 16),

                    // Section 7: Content Breakdown & Specialty Radar Polygon Card
                    AnalyticsInteractiveCard(child: _buildFocusDistributionCard()),
                    const SizedBox(height: 16),

                    // Section 8: Popular Tags Analytics Breakdown
                    AnalyticsInteractiveCard(child: _buildPopularTagsSection(context)),
                    const SizedBox(height: 16),

                    // Section 9: Destination & Sync Health Analytics
                    AnalyticsInteractiveCard(child: _buildDestinationAndSyncSection()),
                    const SizedBox(height: 16),

                    // Section 10: Personal Records & Achievement Badges (Gamification)
                    AnalyticsInteractiveCard(child: _buildPersonalRecordsAndBadgesSection()),
                    const SizedBox(height: 16),

                    // Section 20 [NEW]: Board Leaderboard & Global 78% Percentile
                    AnalyticsInteractiveCard(child: _buildBoardLeaderboardCard()),
                    const SizedBox(height: 16),

                    // Section 11: Predictive Analytics & Forecast (Next Week Saves, Deadlines, Optimal Saving)
                    AnalyticsInteractiveCard(child: _buildPredictiveAnalyticsSection()),
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
  // Section 2: Mascot Speech Bubble
  // ---------------------------------------------------------------------------
  Widget _buildMascotSpeechBubble() {
    final kpis = _backendData?['kpis'];
    final velocityLabel = kpis?['velocity_trend']?['label'];
    final bubbleText = velocityLabel != null
        ? '${kpis?['in_period_clips'] ?? 0} items clipped in $_selectedPeriod. $velocityLabel.'
        : '52 items clipped this week across 34 collections. Elite vault.';

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
  // Section 3: 5 Metric Cards Horizontal Grid
  // ---------------------------------------------------------------------------
  Widget _buildQuickStatsCardRow(int totalCount) {
    final kpis = _backendData?['kpis'];
    final totalSaved = kpis?['total_clips']?.toString() ?? (totalCount > 0 ? '$totalCount' : '1369');
    final weeklySaved = kpis?['in_period_clips']?.toString() ?? '52';
    final streakDays = kpis?['active_streak_days']?.toString() ?? '187';
    final savedValue = '\$${kpis?['saved_dollar_value'] ?? 420}';
    final actionRate = '${kpis?['action_rate_percent'] ?? 74.2}%';

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
            _buildMetricItem('TOTAL SAVED', totalSaved, '$totalSaved clips all-time', null),
            _buildMetricDivider(),
            _buildMetricItem(_selectedPeriod.toUpperCase(), weeklySaved, kpis?['velocity_trend']?['label'] ?? 'Velocity up', null),
            _buildMetricDivider(),
            _buildMetricItem('SAVE STREAK', '${streakDays}d', 'Active consistency', const Color(0xFF10B981)),
            _buildMetricDivider(),
            _buildMetricItem('SAVED VALUE', savedValue, '${kpis?['time_saved_hours'] ?? 18.4}h saved', const Color(0xFF3B82F6)),
            _buildMetricDivider(),
            _buildMetricItem('ACTION RATE', actionRate, 'Opportunities', const Color(0xFF8B5CF6)),
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
  // Section 4: Daily Saving Goal Circular Ring Card
  // ---------------------------------------------------------------------------
  Widget _buildDailyFocusCard() {
    final dailyFocus = _backendData?['daily_focus'];
    final target = (dailyFocus?['target_clips_per_day'] as num?)?.toInt() ?? 10;
    final completed = (dailyFocus?['today_completed'] as num?)?.toInt() ?? 12;
    final rate = (dailyFocus?['completion_rate'] as num?)?.toInt() ?? 100;
    final progress = (rate / 100.0).clamp(0.0, 1.0);

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
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.circleCheck, size: 12, color: Color(0xFF16A34A)),
                    const SizedBox(width: 4),
                    AnimatedCountText(
                      value: rate,
                      suffix: '%',
                      style: GoogleFonts.inter(
                        fontSize: 11,
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
                    progressColor: const Color(0xFF166534), // Darker green ring
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
                      '12 items clipped & synced',
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Daily reading & bookmark goal completed.',
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
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.circleCheck, size: 12, color: Color(0xFF16A34A)),
                              const SizedBox(width: 4),
                              Text(
                                'GOAL SECURED',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.4,
                                  color: const Color(0xFF16A34A),
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
                            'TARGET 10 ITEMS',
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
  Widget _buildConsistencyHeatmapCard() {
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
            painter: _HeatmapMatrixPainter(),
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
  // Section 6: Density Area Curve & Weekday Rhythm Split Cards
  // ---------------------------------------------------------------------------
  Widget _buildDensityAndRhythmSection() {
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
                      '14 clips',
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
                  painter: _DensityCurvePainter(),
                ),
              ),
              const SizedBox(height: 6),
              // Bottom Axis labels
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('0 CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text('8 CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text('16 CLIPS', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                  Text('Mean 12 clips', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
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
                      'Thu 18 clips',
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
              // Day bars
              _buildWeekdayBar('MON', 0.65, '12', false),
              _buildWeekdayBar('TUE', 0.75, '14', false),
              _buildWeekdayBar('WED', 0.70, '13', false),
              _buildWeekdayBar('THU', 0.95, '18', true), // Top day
              _buildWeekdayBar('FRI', 0.60, '11', false),
              _buildWeekdayBar('SAT', 0.70, '13', false),
              _buildWeekdayBar('SUN', 0.55, '10', false),
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
  Widget _buildFocusDistributionCard() {
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
                '8 categories',
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
              children: [
                _buildSubjectPill('Articles', const Color(0xFFEF4444)),
                _buildSubjectPill('Engineering', const Color(0xFF10B981)),
                _buildSubjectPill('AI & ML', const Color(0xFF06B6D4)),
                _buildSubjectPill('Design', const Color(0xFFF59E0B)),
                _buildSubjectPill('Tools', const Color(0xFF8B5CF6)),
              ],
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
  // Section 8: Popular Tags Analytics Breakdown
  // ---------------------------------------------------------------------------
  Widget _buildPopularTagsSection(BuildContext context) {
    final tags = [
      {'name': 'llm', 'count': 128},
      {'name': 'system-design', 'count': 82},
      {'name': 'react', 'count': 64},
      {'name': 'ux', 'count': 57},
      {'name': 'rust', 'count': 45},
      {'name': 'nextjs', 'count': 39},
      {'name': 'hardware', 'count': 31},
      {'name': 'datasets', 'count': 26},
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
                '8 active filters',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tags.map((t) {
              return Container(
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
  Widget _buildStreakAndMomentumCard() {
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
                      '+34% MOMENTUM',
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
                    outerProgress: 27 / 30, // 27 of 30 days
                    middleProgress: 1.0,    // 100% daily goal
                    innerProgress: 0.34,    // 34% action rate
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '187',
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
                      'You are 34% above weekly average',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '27 of last 30 days active — Highly Consistent',
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
                        _buildRingLegendDot(const Color(0xFFEA580C), '27/30d Streak'),
                        _buildRingLegendDot(const Color(0xFF10B981), '100% Goal'),
                        _buildRingLegendDot(const Color(0xFF06B6D4), '34% Actioned'),
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
                          'All-Time Record: 263 Days Streak',
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
                  '76 days to beat',
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
  Widget _buildHourlyActivityHeatmapCard() {
    final hourlyDist = _backendData?['hourly_distribution'];
    final peakWindow = hourlyDist?['peak_window']?.toString() ?? 'Peak 9 AM – 11 AM';
    final buckets = hourlyDist?['hourly_buckets'] as List?;
    final bucketMap = <int, int>{};
    if (buckets != null) {
      for (var b in buckets) {
        if (b is Map && b['hour'] != null) {
          bucketMap[(b['hour'] as num).toInt()] = (b['count'] as num?)?.toInt() ?? 0;
        }
      }
    }
    final maxHCount = bucketMap.values.isNotEmpty ? bucketMap.values.reduce(math.max) : 1;
    final List<double> hourlyActivity = [];
    for (int h = 6; h <= 23; h++) {
      final c = bucketMap[h] ?? (h >= 9 && h <= 11 ? 4 : h >= 14 && h <= 16 ? 3 : 1);
      hourlyActivity.add((c / math.max(1, maxHCount)).clamp(0.15, 1.0));
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
                  peakWindow.replaceAll(' Peak Saving Window', ''),
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
              painter: _HourlyHeatmapPainter(activityList: hourlyActivity),
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
                    'You are most active between 9:00 AM and 11:00 AM (avg ${(maxHCount / 2.0).toStringAsFixed(1)} clips/hr).',
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
  Widget _buildOpportunityOutcomeSection() {
    final oppFunnel = _backendData?['opportunity_funnel'];
    final rawStages = oppFunnel?['stages'] as List?;
    final missedCount = (oppFunnel?['missed_deadlines_count'] as num?)?.toInt() ?? 12;
    final realizedValue = oppFunnel?['realized_value_index']?.toString() ?? '\$2,850 in scholarships & tickets';

    List<Map<String, dynamic>>? customStages;
    if (rawStages != null && rawStages.length >= 4) {
      final totalDiscovered = (rawStages[0]['count'] as num?)?.toDouble() ?? 1.0;
      final colors = [const Color(0xFF3B82F6), const Color(0xFF6366F1), const Color(0xFF8B5CF6), const Color(0xFF10B981)];
      customStages = [];
      for (int i = 0; i < 4; i++) {
        final st = rawStages[i];
        final countVal = st['count'] ?? 0;
        final pctVal = (countVal / math.max(1.0, totalDiscovered));
        final ratePct = (st['percentage'] as num?)?.toInt() ?? (pctVal * 100).toInt();
        customStages.add({
          'name': '${i + 1}. ${st['stage']}',
          'count': '$countVal items',
          'rate': '$ratePct%',
          'pct': pctVal.clamp(0.1, 1.0),
          'color': colors[i % colors.length],
        });
      }
    }

    final actionRatePct = customStages != null && customStages.length > 1
        ? customStages[1]['rate']
        : '34% Action Rate';

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
              painter: _OpportunityFunnelPainter(stagesList: customStages),
            ),
          ),
          const SizedBox(height: 14),

          // Action Rate Breakdown Chips
          Row(
            children: [
              Expanded(child: _buildActionRateBox('Jobs', '38%', const Color(0xFF2563EB))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Events', '61%', const Color(0xFF10B981))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Courses', '22%', const Color(0xFFF59E0B))),
              const SizedBox(width: 8),
              Expanded(child: _buildActionRateBox('Products', '15%', const Color(0xFF8B5CF6))),
            ],
          ),
          const SizedBox(height: 14),

          // Missed Opportunities Alert Banner (Crimson)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFEE2E2)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(LucideIcons.circleAlert, size: 18, color: Color(0xFFDC2626)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$missedCount Opportunities Expired Unactioned',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF991B1B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Jobs, events, and scholarships passed deadlines recently. Act earlier to secure slots!',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFFB91C1C),
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
                              realizedValue,
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
  // Section 6.6 [NEW]: Content Intelligence & 10-Axis Knowledge Graph Radar
  // ---------------------------------------------------------------------------
  Widget _buildContentIntelligenceSection() {
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
                  const Icon(LucideIcons.brainCircuit, size: 16, color: Color(0xFF8B5CF6)),
                  const SizedBox(width: 8),
                  Text(
                    'CONTENT INTELLIGENCE',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  _buildLegendBox(const Color(0xFF2D6A4F), 'This Month'),
                  const SizedBox(width: 6),
                  _buildLegendBox(const Color(0xFF94A3B8), 'Last Month'),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '10-Axis Knowledge Fingerprint',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Engineering, AI/ML, Design, Business, Research, Health, Finance, Culture, Tools, Career',
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 16),

          // 10-Axis Dual Radar CustomPaint
          SizedBox(
            height: 230,
            width: double.infinity,
            child: CustomPaint(
              painter: _DualRadarPainter(),
            ),
          ),
          const SizedBox(height: 16),

          // Topic Trend Multi-line Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Topic Trends Over Time',
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                '+40% AI/ML Surge',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 70,
            width: double.infinity,
            child: CustomPaint(
              painter: _TopicTrendPainter(),
            ),
          ),
          const SizedBox(height: 14),

          // Reading Depth + Source Diversity + Language Row
          Row(
            children: [
              // Reading Depth (60% Deep Reads)
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('READING DEPTH', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                      const SizedBox(height: 3),
                      Text('60% Deep Reads', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF8B5CF6))),
                      Text('15+ min deep research', style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Source Diversity
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('SOURCE DIVERSITY', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                      const SizedBox(height: 3),
                      Text('34 Sources', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0284C7))),
                      Text('GitHub, Substack, ArXiv', style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Languages
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('LANGUAGES', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                      const SizedBox(height: 3),
                      Text('EN / AM / FR', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF059669))),
                      Text('78% English, 12% Amh', style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendBox(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
        ),
        const SizedBox(width: 3),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Section 9 [NEW]: Destination & Sync Health Analytics
  // ---------------------------------------------------------------------------
  Widget _buildDestinationAndSyncSection() {
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
                  '1,948 Records Synced',
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
          _buildSyncStatusRow('Google Sheets', '45%', '1,247 rows written', 'Synced 2m ago', true),
          const SizedBox(height: 8),
          _buildSyncStatusRow('Notion Database', '32%', '412 pages created', '3 retries (Attention)', false),
          const SizedBox(height: 8),
          _buildSyncStatusRow('Airtable Vault', '23%', '289 records synced', 'Synced 15m ago', true),
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
  Widget _buildPersonalRecordsAndBadgesSection() {
    final badges = [
      {'emoji': '🔥', 'title': 'On Fire', 'desc': '7-Day save streak', 'unlocked': true},
      {'emoji': '📚', 'title': 'Deep Reader', 'desc': '10 research papers saved', 'unlocked': true},
      {'emoji': '💼', 'title': 'Job Hunter', 'desc': '20 jobs saved this month', 'unlocked': true},
      {'emoji': '⚡', 'title': 'Quick Actioner', 'desc': 'Applied within 24h of save', 'unlocked': true},
      {'emoji': '🌍', 'title': 'Globe Trotter', 'desc': '10+ international domains', 'unlocked': false},
      {'emoji': '🎯', 'title': 'Sharp Eye', 'desc': '5 trending items clipped', 'unlocked': true},
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
                  'Top 22% Global',
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
                _buildRecordRow('Most clips in one day', '23 clips (Mar 14)'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Most clips in one week', '89 clips (Week 10)'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Most used tag', '#remote (156 clips)'),
                const Divider(height: 12, color: Color(0xFFE2E8F0)),
                _buildRecordRow('Favorite source', 'LinkedIn (34%)'),
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
  Widget _buildPredictiveAnalyticsSection() {
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
            title: 'Next Week Save Forecast',
            highlight: '~45 clips projected',
            body: 'Based on your 4-week rolling pattern, expect heavy clipping on Thursday & Friday.',
          ),
          const SizedBox(height: 10),

          // Prediction 2: Deadline Risk Warning
          _buildPredictiveCard(
            icon: LucideIcons.hourglass,
            iconColor: const Color(0xFFEA580C),
            title: 'Deadline Risk Warning',
            highlight: '4 jobs risk expiration',
            body: 'Jobs typically close in 18 days. Your average wait is 12 days before applying.',
          ),
          const SizedBox(height: 10),

          // Prediction 3: Optimal Save Habit Advice
          _buildPredictiveCard(
            icon: LucideIcons.lightbulb,
            iconColor: const Color(0xFFF59E0B),
            title: 'Best Time to Action',
            highlight: 'Tuesday Mornings',
            body: 'You are 2.4x more likely to act on clips saved before 11 AM vs Friday evenings.',
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
  Widget _buildClipsOverTimeCard() {
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
              painter: _ClipsOverTimeLinePainter(mode: _clipsOverTimeMode),
            ),
          ),
          const SizedBox(height: 10),

          // Legend Row
          if (_clipsOverTimeMode == 'By Type')
            Wrap(
              spacing: 12,
              runSpacing: 6,
              children: [
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
              children: [
                Text('Aug 1', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                Text('Aug 8', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                Text('Aug 15', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                Text('Aug 22', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.inactiveGrey)),
                Text('Aug 29 (Peak)', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF166534))),
              ],
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
  Widget _buildContentTypeDonutCard() {
    final breakdown = [
      {'name': 'Jobs', 'count': 18, 'pct': 38, 'color': const Color(0xFF22C55E)},
      {'name': 'Articles', 'count': 11, 'pct': 23, 'color': const Color(0xFF3B82F6)},
      {'name': 'Tools', 'count': 8, 'pct': 17, 'color': const Color(0xFFF97316)},
      {'name': 'Events', 'count': 5, 'pct': 11, 'color': const Color(0xFFA78BFA)},
      {'name': 'Music', 'count': 3, 'pct': 6, 'color': const Color(0xFFEC4899)},
      {'name': 'Other', 'count': 2, 'pct': 4, 'color': const Color(0xFF94A3B8)},
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
                    breakdown: breakdown,
                    selectedIndex: _selectedDonutIndex,
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '47',
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
                  children: breakdown.asMap().entries.map((entry) {
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
  // Section 20 [NEW]: Board Leaderboard & 78% Global Percentile
  // ---------------------------------------------------------------------------
  Widget _buildBoardLeaderboardCard() {
    final members = [
      {'rank': 1, 'name': 'Alex Rivera', 'initials': 'AR', 'clips': 84, 'trend': '+18%'},
      {'rank': 2, 'name': 'Sophia Chen', 'initials': 'SC', 'clips': 72, 'trend': '+12%'},
      {'rank': 3, 'name': 'Marcus Vance', 'initials': 'MV', 'clips': 65, 'trend': '-4%'},
      {'rank': 4, 'name': 'You', 'initials': 'ME', 'clips': 52, 'trend': '+34%', 'isUser': true},
      {'rank': 5, 'name': 'Elena Rostova', 'initials': 'ER', 'clips': 41, 'trend': '+5%'},
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
              Row(
                children: [
                  const Icon(LucideIcons.award, size: 16, color: Color(0xFF7C3AED)),
                  const SizedBox(width: 8),
                  Text(
                    'BOARD LEADERBOARD',
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
                  color: const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Engineering Vault',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF7C3AED),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Top 5 Members List
          Column(
            children: members.map((m) {
              final isUser = m['isUser'] == true;
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: isUser ? const Color(0xFFF5F3FF) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isUser ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                    width: isUser ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        SizedBox(
                          width: 18,
                          child: Text(
                            '#${m['rank']}',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isUser ? const Color(0xFF7C3AED) : AppTheme.textMuted,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        CircleAvatar(
                          radius: 14,
                          backgroundColor: isUser ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                          child: Text(
                            m['initials'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isUser ? Colors.white : AppTheme.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          m['name'] as String,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: isUser ? FontWeight.bold : FontWeight.w600,
                            color: isUser ? const Color(0xFF7C3AED) : AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          '${m['clips']} clips',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: (m['trend'] as String).startsWith('+')
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            m['trend'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: (m['trend'] as String).startsWith('+')
                                  ? const Color(0xFF16A34A)
                                  : const Color(0xFFDC2626),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Anonymous global percentile bar
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'You save more than 78% of all Clipper users',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      'Top 22%',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Stack(
                    children: [
                      Container(height: 6, color: const Color(0xFFE2E8F0)),
                      FractionallySizedBox(
                        widthFactor: 0.78,
                        child: Container(
                          height: 6,
                          decoration: BoxDecoration(
                            color: const Color(0xFF16A34A),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ],
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
  @override
  void paint(Canvas canvas, Size size) {
    const rows = 4;
    const cols = 20;
    final itemSize = (size.width - (cols - 1) * 4) / cols;

    // Pattern of greens
    final greenShades = [
      const Color(0xFFF1F5F9), // empty
      const Color(0xFFBBF7D0), // light
      const Color(0xFF4ADE80), // medium
      const Color(0xFF16A34A), // vibrant
      const Color(0xFF166534), // dark
    ];

    // Seeded pattern representing active saving days
    final pattern = [
      [3, 4, 3, 2, 4, 3, 4, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 0, 3, 4],
      [4, 3, 4, 4, 3, 4, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 2, 4],
      [3, 4, 3, 4, 3, 0, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3],
      [2, 3, 4, 0, 0, 3, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final shadeIdx = pattern[r][c];
        if (shadeIdx == 0 && r == 3 && c > 8) continue;

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
  bool shouldRepaint(covariant _HeatmapMatrixPainter oldDelegate) => false;
}

/// Density Curve Shaded Area Painter
class _DensityCurvePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path();
    final fillPath = Path();

    final points = [
      Offset(0, size.height * 0.95),
      Offset(size.width * 0.15, size.height * 0.15),
      Offset(size.width * 0.35, size.height * 0.70),
      Offset(size.width * 0.60, size.height * 0.80),
      Offset(size.width * 0.85, size.height * 0.82),
      Offset(size.width, size.height * 0.95),
    ];

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
  bool shouldRepaint(covariant _DensityCurvePainter oldDelegate) => false;
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

/// 10-Axis Dual Knowledge Fingerprint Radar Painter (This Month vs Last Month)
class _DualRadarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 36;

    final axes = [
      'Engineering',
      'AI / ML',
      'Design',
      'Business',
      'Research',
      'Health',
      'Finance',
      'Culture',
      'Tools',
      'Career',
    ];

    // Normalized scores (0.0 to 1.0)
    final thisMonthScores = [0.92, 0.96, 0.74, 0.58, 0.85, 0.42, 0.50, 0.38, 0.88, 0.70];
    final lastMonthScores = [0.82, 0.68, 0.80, 0.65, 0.70, 0.35, 0.40, 0.45, 0.72, 0.85];

    final count = axes.length;
    final angleStep = (2 * math.pi) / count;

    // 1. Draw Concentric Web Rings (4 concentric polygons)
    final webPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (int step = 1; step <= 4; step++) {
      final r = radius * (step / 4);
      final webPath = Path();
      for (int i = 0; i < count; i++) {
        final angle = i * angleStep - (math.pi / 2);
        final x = center.dx + r * math.cos(angle);
        final y = center.dy + r * math.sin(angle);
        if (i == 0) {
          webPath.moveTo(x, y);
        } else {
          webPath.lineTo(x, y);
        }
      }
      webPath.close();
      canvas.drawPath(webPath, webPaint);
    }

    // 2. Draw Radial Axis Spokes
    for (int i = 0; i < count; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final x = center.dx + radius * math.cos(angle);
      final y = center.dy + radius * math.sin(angle);
      canvas.drawLine(center, Offset(x, y), webPaint);
    }

    // 3. Draw Axis Labels
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    for (int i = 0; i < count; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final labelR = radius + 20;
      final lx = center.dx + labelR * math.cos(angle);
      final ly = center.dy + labelR * math.sin(angle);

      textPainter.text = TextSpan(
        text: axes[i],
        style: GoogleFonts.inter(
          fontSize: 8.5,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF64748B),
        ),
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(lx - textPainter.width / 2, ly - textPainter.height / 2),
      );
    }

    // 4. Draw Last Month Polygon (Grey / Slate dashed)
    final lastMonthPath = Path();
    for (int i = 0; i < count; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final r = radius * lastMonthScores[i];
      final px = center.dx + r * math.cos(angle);
      final py = center.dy + r * math.sin(angle);
      if (i == 0) {
        lastMonthPath.moveTo(px, py);
      } else {
        lastMonthPath.lineTo(px, py);
      }
    }
    lastMonthPath.close();

    final lastFillPaint = Paint()
      ..color = const Color(0xFF94A3B8).withValues(alpha: 0.20)
      ..style = PaintingStyle.fill;
    canvas.drawPath(lastMonthPath, lastFillPaint);

    final lastStrokePaint = Paint()
      ..color = const Color(0xFF94A3B8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(lastMonthPath, lastStrokePaint);

    // 5. Draw This Month Polygon (Vibrant Emerald / Forest Green)
    final thisMonthPath = Path();
    for (int i = 0; i < count; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final r = radius * thisMonthScores[i];
      final px = center.dx + r * math.cos(angle);
      final py = center.dy + r * math.sin(angle);
      if (i == 0) {
        thisMonthPath.moveTo(px, py);
      } else {
        thisMonthPath.lineTo(px, py);
      }
    }
    thisMonthPath.close();

    final thisFillPaint = Paint()
      ..color = const Color(0xFF10B981).withValues(alpha: 0.45)
      ..style = PaintingStyle.fill;
    canvas.drawPath(thisMonthPath, thisFillPaint);

    final thisStrokePaint = Paint()
      ..color = const Color(0xFF047857)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawPath(thisMonthPath, thisStrokePaint);

    // Vertex points for This Month
    final dotPaint = Paint()
      ..color = const Color(0xFF047857)
      ..style = PaintingStyle.fill;
    for (int i = 0; i < count; i++) {
      final angle = i * angleStep - (math.pi / 2);
      final r = radius * thisMonthScores[i];
      final px = center.dx + r * math.cos(angle);
      final py = center.dy + r * math.sin(angle);
      canvas.drawCircle(Offset(px, py), 2.5, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _DualRadarPainter oldDelegate) => false;
}

/// Multi-line Topic Trend Smoothed Curves
class _TopicTrendPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // 4 lines: AI/ML (Cyan), Engineering (Green), Design (Amber), Jobs (Blue)
    final lineAI = [0.20, 0.35, 0.45, 0.60, 0.75, 0.95];
    final lineEng = [0.80, 0.75, 0.85, 0.80, 0.90, 0.92];
    final lineJobs = [0.75, 0.70, 0.65, 0.50, 0.45, 0.40];

    _drawSmoothCurve(canvas, size, lineAI, const Color(0xFF06B6D4), 'AI/ML');
    _drawSmoothCurve(canvas, size, lineEng, const Color(0xFF10B981), 'Eng');
    _drawSmoothCurve(canvas, size, lineJobs, const Color(0xFF3B82F6), 'Jobs');
  }

  void _drawSmoothCurve(Canvas canvas, Size size, List<double> values, Color color, String name) {
    final path = Path();
    final stepX = size.width / (values.length - 1);

    for (int i = 0; i < values.length; i++) {
      final x = i * stepX;
      final y = size.height - (values[i] * (size.height - 12)) - 6;

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        final prevX = (i - 1) * stepX;
        final prevY = size.height - (values[i - 1] * (size.height - 12)) - 6;
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
  bool shouldRepaint(covariant _TopicTrendPainter oldDelegate) => false;
}

/// Interactive Clips Over Time Line Painter (Total Curve or 5-Type Multi-Line)
class _ClipsOverTimeLinePainter extends CustomPainter {
  final String mode; // 'Total' or 'By Type'

  _ClipsOverTimeLinePainter({required this.mode});

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
      final totalData = [12.0, 24.0, 18.0, 32.0, 48.0, 42.0, 52.0];
      final maxVal = 60.0;
      final stepX = size.width / (totalData.length - 1);

      final path = Path();
      final fillPath = Path();

      for (int i = 0; i < totalData.length; i++) {
        final x = i * stepX;
        final y = size.height - (totalData[i] / maxVal) * (size.height - 14) - 7;

        if (i == 0) {
          path.moveTo(x, y);
          fillPath.moveTo(x, size.height);
          fillPath.lineTo(x, y);
        } else {
          final prevX = (i - 1) * stepX;
          final prevY = size.height - (totalData[i - 1] / maxVal) * (size.height - 14) - 7;
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

      for (int i = 0; i < totalData.length; i++) {
        final x = i * stepX;
        final y = size.height - (totalData[i] / maxVal) * (size.height - 14) - 7;
        canvas.drawCircle(Offset(x, y), 4, dotBgPaint);
        canvas.drawCircle(Offset(x, y), 2.5, dotPaint);
      }
    } else {
      // By Type: 5 distinct colored lines
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
  bool shouldRepaint(covariant _ClipsOverTimeLinePainter oldDelegate) =>
      oldDelegate.mode != mode;
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



