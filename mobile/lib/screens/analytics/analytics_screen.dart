import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../providers/clips_provider.dart';
import '../../widgets/app_header.dart';

class AnalyticsScreen extends StatelessWidget {
  final VoidCallback? onNotificationTap;

  const AnalyticsScreen({
    super.key,
    this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final allClips = clipsProvider.clips;
    final totalCount = allClips.isNotEmpty ? allClips.length : 1369;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.list(
        title: 'Analytics & Insights',
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Header title + Quick action pills
            _buildTopHeaderRow(context),
            const SizedBox(height: 14),

            // Section 2: Mascot Speech Bubble
            _buildMascotSpeechBubble(),
            const SizedBox(height: 16),

            // Section 3: 5-Metric Quick Stats Card Row
            _buildQuickStatsCardRow(totalCount),
            const SizedBox(height: 16),

            // Section 4: Daily Saving Goal Circular Ring Card
            _buildDailyFocusCard(),
            const SizedBox(height: 16),

            // Section 5: Consistency Heatmap Matrix Card
            _buildConsistencyHeatmapCard(),
            const SizedBox(height: 16),

            // Section 6: Density Area Curve & Weekday Rhythm Split Cards
            _buildDensityAndRhythmSection(),
            const SizedBox(height: 16),

            // Section 7: Content Breakdown & Specialty Radar Polygon Card
            _buildFocusDistributionCard(),
            const SizedBox(height: 16),

            // Section 8: Popular Tags Analytics Breakdown
            _buildPopularTagsSection(context),
            const SizedBox(height: 24),
          ],
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
                '52 items clipped this week across 34 collections. Elite vault.',
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
              borderRadius: BorderRadius.circular(22),
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
            _buildMetricItem('TOTAL SAVED', '${totalCount > 0 ? totalCount : 1369}', '$totalCount clips all-time', null),
            _buildMetricDivider(),
            _buildMetricItem('THIS WEEK', '52', '34 collections', null),
            _buildMetricDivider(),
            _buildMetricItem('SAVE STREAK', '187d', 'Best 263d', const Color(0xFF10B981)),
            _buildMetricDivider(),
            _buildMetricItem('AI ENRICHED', '98%', '1,342 processed', null),
            _buildMetricDivider(),
            _buildMetricItem('VAULT XP', '340', 'Automations active', null),
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
          Text(
            value,
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
                    Text(
                      '100%',
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
                    progress: 1.0,
                    progressColor: const Color(0xFF166534), // Darker green ring
                    backgroundColor: const Color(0xFFDCFCE7),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '12',
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
