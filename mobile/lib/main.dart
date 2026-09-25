import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/clips_provider.dart';
import 'providers/feed_provider.dart';
import 'screens/auth/onboarding_screen.dart';
import 'screens/main_navigation_shell.dart';
import 'services/sharing_service.dart';
import 'widgets/audio_recognition_dialog.dart';
import 'widgets/save_clip_bottom_sheet.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharingService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => ClipsProvider()..loadClips()),
        ChangeNotifierProvider(create: (_) => FeedProvider()),
      ],
      child: SaveMobileApp(initialSharePayload: SharingService.initialPayload),
    ),
  );
}

class SaveMobileApp extends StatefulWidget {
  final SharedPayload? initialSharePayload;

  const SaveMobileApp({super.key, this.initialSharePayload});

  @override
  State<SaveMobileApp> createState() => _SaveMobileAppState();
}

class _SaveMobileAppState extends State<SaveMobileApp> {
  StreamSubscription<SharedPayload>? _shareSubscription;
  StreamSubscription<void>? _audioTriggerSubscription;

  @override
  void initState() {
    super.initState();
    // 1. Listen for incoming Share Sheet events while app is already open
    _shareSubscription = SharingService.onSharedContent.listen((payload) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        navigatorKey.currentState?.push(
          PageRouteBuilder(
            opaque: false,
            barrierColor: Colors.black.withValues(alpha: 0.60),
            pageBuilder: (context, _, __) => Scaffold(
              backgroundColor: Colors.transparent,
              body: SaveClipBottomSheet(
                initialUrl: payload.url,
                initialNote: payload.note,
                platform: payload.platform,
                isExternalShare: true,
              ),
            ),
          ),
        );
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
    // If launched directly via Android Share Sheet (ACTION_SEND), show ONLY the transparent overlay
    final isDirectShare = widget.initialSharePayload != null;

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Clipper',
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        if (kIsWeb) {
          final mediaQuery = MediaQuery.of(context);
          if (mediaQuery.size.width > 500) {
            return Scaffold(
              backgroundColor: const Color(0xFF0B0F19),
              body: Center(
                child: Container(
                  width: 412,
                  height: mediaQuery.size.height > 880 ? 840 : mediaQuery.size.height * 0.94,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.15),
                      width: 3,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.55),
                        blurRadius: 32,
                        spreadRadius: 4,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: child ?? const SizedBox.shrink(),
                ),
              ),
            );
          }
        }
        return child ?? const SizedBox.shrink();
      },
      theme: isDirectShare
          // Transparent canvas so Instagram stays visible behind the sheet.
          ? AppTheme.lightTheme.copyWith(
              scaffoldBackgroundColor: Colors.transparent,
              canvasColor: Colors.transparent,
            )
          : AppTheme.lightTheme,
      home: isDirectShare
          // Share overlay mode: translucent sheet floating OVER Instagram /
          // TikTok / YouTube. Back button or tap-outside finishes the native
          // ShareHandlerActivity and reveals the source app underneath.
          ? PopScope(
              canPop: false,
              onPopInvokedWithResult: (didPop, _) {
                if (didPop) return;
                SharingService.closeShareOverlay();
              },
              child: Container(
                color: Colors.transparent,
                child: Scaffold(
                  backgroundColor: Colors.transparent,
                  extendBodyBehindAppBar: true,
                  extendBody: true,
                  body: SaveClipBottomSheet(
                    initialUrl: widget.initialSharePayload!.url,
                    initialNote: widget.initialSharePayload!.note,
                    platform: widget.initialSharePayload!.platform,
                    isExternalShare: true,
                  ),
                ),
              ),
            )
          : Consumer<AuthProvider>(
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
