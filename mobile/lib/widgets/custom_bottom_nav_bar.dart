import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/theme.dart';

class CustomBottomNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback? onSavePressed;

  const CustomBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
    this.onSavePressed,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          top: BorderSide(
            color: Color(0xFFE5E7EB),
            width: 1.0,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.only(
          bottom: bottomPadding > 0 ? bottomPadding : 6,
          top: 8,
        ),
        child: SizedBox(
          height: 56,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Tab 0: Home
              _buildTabItem(
                index: 0,
                label: 'Home',
                icon: LucideIcons.house,
                isSelected: selectedIndex == 0,
              ),

              // Tab 1: Feed
              _buildTabItem(
                index: 1,
                label: 'Feed',
                icon: LucideIcons.newspaper,
                isSelected: selectedIndex == 1,
              ),

              // Tab 2: Tasks
              _buildTabItem(
                index: 2,
                label: 'Tasks',
                icon: LucideIcons.circleCheck,
                isSelected: selectedIndex == 2,
              ),

              // Tab 3: Analytics
              _buildTabItem(
                index: 3,
                label: 'Analytics',
                icon: LucideIcons.chartColumn,
                isSelected: selectedIndex == 3,
              ),

              // Tab 4: Profile
              _buildTabItem(
                index: 4,
                label: 'Profile',
                icon: LucideIcons.user,
                isSelected: selectedIndex == 4,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabItem({
    required int index,
    required String label,
    required IconData icon,
    required bool isSelected,
  }) {
    // Active forest green color matching the green & white theme
    const activeColor = Color(0xFF2D6A4F);
    // Inactive muted grey
    const inactiveColor = Color(0xFF9CA3AF);

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTabSelected(index),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon
            Icon(
              icon,
              size: 22,
              color: isSelected ? activeColor : inactiveColor,
            ),
            const SizedBox(height: 4),
            // Label
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? activeColor : inactiveColor,
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

