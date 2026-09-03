import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/clips_provider.dart';
import 'screens/auth/onboarding_screen.dart';
import 'screens/main_navigation_shell.dart';
import 'services/sharing_service.dart';
import 'widgets/audio_recognition_dialog.dart';
import 'widgets/save_clip_bottom_sheet.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SharingService.initialize();

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

class SaveMobileApp extends StatefulWidget {
  const SaveMobileApp({super.key});

  @override
  State<SaveMobileApp> createState() => _SaveMobileAppState();
}

class _SaveMobileAppState extends State<SaveMobileApp> {
  StreamSubscription<SharedPayload>? _shareSubscription;
  StreamSubscription<void>? _audioTriggerSubscription;

  @override
  void initState() {
    super.initState();
    // 1. Listen for incoming Share Sheet events (Spotify, TikTok, etc.)
    _shareSubscription = SharingService.onSharedContent.listen((payload) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final context = navigatorKey.currentContext;
        if (context != null) {
          SaveClipBottomSheet.show(
            context,
            initialUrl: payload.url,
            initialNote: payload.note,
            platform: payload.platform,
          );
        }
      });
    });

    // 2. Listen for Quick Settings Tile Audio Recognition triggers
    _audioTriggerSubscription = SharingService.onAudioRecognitionTrigger.listen((_) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final context = navigatorKey.currentContext;
        if (context != null) {
          AudioRecognitionDialog.show(context);
        }
      });
    });
  }

  @override
  void dispose() {
    _shareSubscription?.cancel();
    _audioTriggerSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Clipper',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.status == AuthStatus.initial && auth.isLoading) {
            return const Scaffold(
              backgroundColor: AppTheme.background,
              body: Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF7C3AED),
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
