import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/theme.dart';

class CustomBottomNavBar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final VoidCallback onSavePressed;

  const CustomBottomNavBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
    required this.onSavePressed,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        border: Border(
          top: BorderSide(
            color: AppTheme.borderSubtle,
            width: 0.5,
          ),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: SizedBox(
          height: 72,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // Tab 1: Home (Index 0)
              _buildTabItem(
                index: 0,
                label: 'Home',
                icon: LucideIcons.house,
                isSelected: selectedIndex == 0,
              ),

              // Tab 2: Clips (Index 1)
              _buildTabItem(
                index: 1,
                label: 'Clips',
                icon: LucideIcons.bookmark,
                isSelected: selectedIndex == 1,
              ),

              // Center: Save FAB (Elevated Violet Circle +, NOT a tab)
              _buildCenterSaveButton(),

              // Tab 4: Jobs (Index 2)
              _buildTabItem(
                index: 2,
                label: 'Jobs',
                icon: LucideIcons.briefcase,
                isSelected: selectedIndex == 2,
              ),

              // Tab 5: Profile (Index 3)
              _buildTabItem(
                index: 3,
                label: 'Profile',
                icon: LucideIcons.user,
                isSelected: selectedIndex == 3,
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
    final activeColor = AppTheme.primaryViolet;
    const inactiveColor = AppTheme.inactiveGrey;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTabSelected(index),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon container with active state
            SizedBox(
              height: 26,
              child: Center(
                child: Icon(
                  icon,
                  size: 22,
                  color: isSelected ? activeColor : inactiveColor,
                ),
              ),
            ),
            const SizedBox(height: 2),
            // Label
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? activeColor : inactiveColor,
              ),
            ),
            const SizedBox(height: 3),
            // Dot / pill indicator below icon (matching image 1)
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              width: isSelected ? 12 : 0,
              height: 3,
              decoration: BoxDecoration(
                color: isSelected ? activeColor : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterSaveButton() {
    return Expanded(
      child: Center(
        child: Transform.translate(
          offset: const Offset(0, -8), // Elevated slightly above bar
          child: GestureDetector(
            onTap: onSavePressed,
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppTheme.primaryViolet,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryViolet.withValues(alpha: 0.35),
                    blurRadius: 12,
                    spreadRadius: 2,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Icon(
                  LucideIcons.plus,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
