import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/clips_provider.dart';
import 'providers/feed_provider.dart';
import 'screens/auth/onboarding_screen.dart';
import 'screens/main_navigation_shell.dart';
import 'services/api_service.dart';
import 'services/sharing_service.dart';
import 'widgets/audio_recognition_dialog.dart';
import 'widgets/auto_save_overlay.dart';
import 'widgets/floating_music_bubble.dart';
import 'widgets/save_clip_bottom_sheet.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SharingService.initialize();

  final isShareLaunch = SharingService.initialPayload != null;
  final isAudioLaunch = SharingService.initialAudioTrigger;
  final isFastOverlay = isShareLaunch || isAudioLaunch;

  SharedPreferences? prefs;
  try {
    prefs = await SharedPreferences.getInstance();
    if (!prefs.containsKey('api_base_url')) {
      await prefs.setString('api_base_url', ApiService.defaultBaseUrl);
    }
  } catch (_) {}

  final confirmationMode = prefs?.getString('clipper_confirmation_mode') ?? 'confirm';
  final defaultDestId = prefs?.getString('clipper_default_dest_id');

  if (!isFastOverlay && prefs != null) {
    final bubbleEnabled = prefs.getBool('clipper_enable_bubble') ?? false;
    FloatingBubbleManager.isVisible.value = bubbleEnabled;
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider()..initialize(skipNetwork: isFastOverlay),
        ),
        // Critical Latency Fix: Do NOT fetch clips list over network during fast share or audio overlay!
        ChangeNotifierProvider(create: (_) => isFastOverlay ? ClipsProvider() : (ClipsProvider()..loadClips())),
        ChangeNotifierProvider(create: (_) => FeedProvider()),
      ],
      child: SaveMobileApp(
        initialSharePayload: SharingService.initialPayload,
        initialAudioTrigger: SharingService.initialAudioTrigger,
        confirmationMode: confirmationMode,
        defaultDestId: defaultDestId,
      ),
    ),
  );
}

class SaveMobileApp extends StatefulWidget {
  final SharedPayload? initialSharePayload;
  final bool initialAudioTrigger;
  final String? confirmationMode;
  final String? defaultDestId;

  const SaveMobileApp({
    super.key,
    this.initialSharePayload,
    this.initialAudioTrigger = false,
    this.confirmationMode,
    this.defaultDestId,
  });

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
    _shareSubscription = SharingService.onSharedContent.listen((payload) async {
      final prefs = await SharedPreferences.getInstance();
      final mode = prefs.getString('clipper_confirmation_mode') ?? 'confirm';
      final defaultDest = prefs.getString('clipper_default_dest_id');

      // Auto Mode: Zero modal popup! Save directly in background and show toast
      if (mode == 'auto') {
        try {
          final res = await ApiService.saveClipDetailed(
            url: payload.url,
            selectedText: payload.note,
            destinationId: defaultDest ?? 'google_sheets',
            note: payload.note,
          );
          final destLabel = res.destinationName ?? (defaultDest == 'notion' ? 'Notion' : 'Google Sheets');
          final toastMsg = res.duplicate
              ? '⚡ Clipper: Already in $destLabel'
              : '⚡ Clipper: Saved to $destLabel!';
          SharingService.showToast(toastMsg);
        } catch (_) {}
        return;
      }

      WidgetsBinding.instance.addPostFrameCallback((_) {
        navigatorKey.currentState?.push(
          PageRouteBuilder(
            opaque: false,
            barrierColor: Colors.black.withValues(alpha: 0.60),
            pageBuilder: (context, animation, secondaryAnimation) => Scaffold(
              backgroundColor: Colors.transparent,
              body: SaveClipBottomSheet(
                initialUrl: payload.url,
                initialNote: payload.note,
                platform: payload.platform,
                isExternalShare: true,
                confirmationMode: mode,
                defaultDestinationId: defaultDest,
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
          AudioRecognitionDialog.show(
            context,
            isDirectOverlay: widget.initialSharePayload != null || widget.initialAudioTrigger,
          );
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
    // If launched directly via Android Share Sheet (ACTION_SEND) or Quick Settings Music Tile
    final isDirectShare = widget.initialSharePayload != null;
    final isDirectAudio = widget.initialAudioTrigger;
    final isOverlayMode = isDirectShare || isDirectAudio;

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Clipper',
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        Widget content = child ?? const SizedBox.shrink();
        if (isOverlayMode) {
          return content;
        }
        if (kIsWeb) {
          final mediaQuery = MediaQuery.of(context);
          if (mediaQuery.size.width > 500) {
            content = Scaffold(
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
                  child: content,
                ),
              ),
            );
          }
        }
        return FloatingMusicBubbleOverlay(child: content);
      },
      theme: isOverlayMode
          // Transparent canvas so Twitter / YouTube / Instagram stay visible behind the overlay
          ? AppTheme.lightTheme.copyWith(
              scaffoldBackgroundColor: Colors.transparent,
              canvasColor: Colors.transparent,
            )
          : AppTheme.lightTheme,
      darkTheme: isOverlayMode
          ? AppTheme.darkTheme.copyWith(
              scaffoldBackgroundColor: Colors.transparent,
              canvasColor: Colors.transparent,
            )
          : AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: isDirectAudio
          // Quick Settings Tile / Listen to Music overlay: translucent full-screen directly over the source app
          ? PopScope(
              canPop: false,
              onPopInvokedWithResult: (didPop, _) {
                if (didPop) return;
                SharingService.closeShareOverlay();
              },
              child: const AudioRecognitionDialog(isDirectOverlay: true),
            )
          : isDirectShare
              // Share overlay mode: translucent sheet floating OVER Instagram /
              // TikTok / YouTube. Back button or tap-outside finishes the native
              // ShareHandlerActivity and reveals the source app underneath.
              ? PopScope(
                  canPop: false,
                  onPopInvokedWithResult: (didPop, _) {
                    if (didPop) return;
                    SharingService.closeShareOverlay();
                  },
                  child: widget.confirmationMode == 'auto'
                      ? AutoSaveOverlay(
                          url: widget.initialSharePayload!.url,
                          note: widget.initialSharePayload!.note,
                          platform: widget.initialSharePayload!.platform,
                          defaultDestinationId: widget.defaultDestId,
                          isExternalShare: true,
                        )
                      : Container(
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
                              confirmationMode: widget.confirmationMode,
                              defaultDestinationId: widget.defaultDestId,
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
