import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/clips_provider.dart';
import 'screens/auth/onboarding_screen.dart';
import 'screens/main_navigation_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => ClipsProvider()..loadClips()),
      ],
      child: const SaveMobileApp(),
    ),
  );
}

class SaveMobileApp extends StatelessWidget {
  const SaveMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Save Clipper',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.status == AuthStatus.initial && auth.isLoading) {
            return const Scaffold(
              backgroundColor: AppTheme.background,
              body: Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF2D6A4F),
                  strokeWidth: 2.5,
                ),
              ),
            );
          }

          if (auth.isAuthenticated) {
            return const MainNavigationShell();
          }

          return const OnboardingScreen();
        },
      ),
    );
  }
}
