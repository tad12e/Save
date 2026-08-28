import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../widgets/custom_bottom_nav_bar.dart';
import '../widgets/save_clip_bottom_sheet.dart';
import 'home/home_dashboard_screen.dart';
import 'clips/clips_screen.dart';
import 'jobs/jobs_screen.dart';
import 'profile/profile_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedIndex = 0;

  void _onTabSelected(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _openSaveBottomSheet() {
    SaveClipBottomSheet.show(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          HomeDashboardScreen(
            onNavigateTab: _onTabSelected,
          ),
          const ClipsScreen(),
          const JobsScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: CustomBottomNavBar(
        selectedIndex: _selectedIndex,
        onTabSelected: _onTabSelected,
        onSavePressed: _openSaveBottomSheet,
      ),
    );
  }
}
