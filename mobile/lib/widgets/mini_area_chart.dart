import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme.dart';

class MiniAreaChart extends StatefulWidget {
  const MiniAreaChart({super.key});

  @override
  State<MiniAreaChart> createState() => _MiniAreaChartState();
}

class _MiniAreaChartState extends State<MiniAreaChart> {
  String _selectedPeriod = '7d';

  // Sample data points for 7d and 30d
  final List<double> _data7d = [4.0, 7.0, 5.0, 12.0, 9.0, 16.0, 14.0];
  final List<double> _data30d = [
    5.0, 8.0, 6.0, 11.0, 14.0, 12.0, 18.0, 15.0, 22.0, 19.0,
    25.0, 21.0, 28.0, 24.0, 31.0, 27.0, 35.0, 30.0, 38.0, 42.0
  ];

  @override
  Widget build(BuildContext context) {
    final activeData = _selectedPeriod == '7d' ? _data7d : _data30d;

    return Container(
      height: 140,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Chart Header & Period Selector
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'CLIPS SAVED OVER TIME',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                  color: AppTheme.textMuted,
                ),
              ),
              // 7d / 30d Toggle
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    _buildPeriodBtn('7d'),
                    _buildPeriodBtn('30d'),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Custom Area Chart
          Expanded(
            child: CustomPaint(
              size: Size.infinite,
              painter: _AreaChartPainter(
                data: activeData,
                lineColor: AppTheme.primaryVioletLight,
                fillGradientColors: [
                  AppTheme.primaryViolet.withValues(alpha: 0.35),
                  AppTheme.primaryViolet.withValues(alpha: 0.0),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodBtn(String period) {
    final isSelected = _selectedPeriod == period;
    return GestureDetector(
      onTap: () => setState(() => _selectedPeriod = period),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryViolet : Colors.transparent,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          period,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppTheme.inactiveGrey,
          ),
        ),
      ),
    );
  }
}

class _AreaChartPainter extends CustomPainter {
  final List<double> data;
  final Color lineColor;
  final List<Color> fillGradientColors;

  _AreaChartPainter({
    required this.data,
    required this.lineColor,
    required this.fillGradientColors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;

    final maxVal = data.reduce((a, b) => a > b ? a : b);
    final minVal = data.reduce((a, b) => a < b ? a : b);
    final range = (maxVal - minVal) == 0 ? 1.0 : (maxVal - minVal);

    final path = Path();
    final fillPath = Path();

    final dx = size.width / (data.length - 1);
    final points = <Offset>[];

    for (int i = 0; i < data.length; i++) {
      final x = i * dx;
      // Invert y: larger value = smaller y
      final normalized = (data[i] - minVal) / range;
      final y = size.height - (normalized * (size.height - 12)) - 6;
      points.add(Offset(x, y));
    }

    // Draw smooth bezier curve
    path.moveTo(points[0].dx, points[0].dy);
    fillPath.moveTo(points[0].dx, size.height);
    fillPath.lineTo(points[0].dx, points[0].dy);

    for (int i = 0; i < points.length - 1; i++) {
      final p0 = points[i];
      final p1 = points[i + 1];
      final controlPoint1 = Offset(p0.dx + (p1.dx - p0.dx) / 2, p0.dy);
      final controlPoint2 = Offset(p0.dx + (p1.dx - p0.dx) / 2, p1.dy);

      path.cubicTo(
        controlPoint1.dx, controlPoint1.dy,
        controlPoint2.dx, controlPoint2.dy,
        p1.dx, p1.dy,
      );

      fillPath.cubicTo(
        controlPoint1.dx, controlPoint1.dy,
        controlPoint2.dx, controlPoint2.dy,
        p1.dx, p1.dy,
      );
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    // Paint Area Fill Gradient
    final fillPaint = Paint()
      ..shader = LinearGradient(
        colors: fillGradientColors,
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    // Paint Stroke Line
    final linePaint = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, linePaint);

    // Draw dot on the last point
    final lastPoint = points.last;
    canvas.drawCircle(
      lastPoint,
      4.0,
      Paint()..color = Colors.white,
    );
    canvas.drawCircle(
      lastPoint,
      2.0,
      Paint()..color = lineColor,
    );
  }

  @override
  bool shouldRepaint(covariant _AreaChartPainter oldDelegate) => true;
}
