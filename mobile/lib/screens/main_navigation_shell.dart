import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme.dart';
import '../widgets/custom_bottom_nav_bar.dart';
import '../widgets/floating_audio_bubble.dart';
import '../widgets/save_clip_bottom_sheet.dart';
import 'home/home_dashboard_screen.dart';
import 'feed/feed_screen.dart';
import 'jobs/jobs_screen.dart';
import 'analytics/analytics_screen.dart';
import 'profile/profile_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedIndex = 0;
  bool _showFloatingBubble = false;

  @override
  void initState() {
    super.initState();
    _loadBubblePreference();
  }

  Future<void> _loadBubblePreference() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _showFloatingBubble = prefs.getBool('clipper_enable_bubble') ?? false;
      });
    }
  }

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
      body: Stack(
        children: [
          IndexedStack(
            index: _selectedIndex,
            children: [
              HomeDashboardScreen(
                onNavigateTab: _onTabSelected,
              ),
              const FeedScreen(), // Tab 1: Feed
              const JobsScreen(), // Tab 2: Tasks
              const AnalyticsScreen(), // Tab 3: Analytics
              const ProfileScreen(), // Tab 4: Profile
            ],
          ),
          if (_showFloatingBubble) const FloatingAudioBubble(),
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
