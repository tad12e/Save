import 'dart:async';
import 'package:flutter/services.dart';

class SharedPayload {
  final String rawText;
  final String url;
  final String note;
  final String platform;

  const SharedPayload({
    required this.rawText,
    required this.url,
    required this.note,
    required this.platform,
  });
}

class SharingService {
  static const MethodChannel _channel = MethodChannel('com.save.app/sharing');
  
  static final StreamController<SharedPayload> _shareStreamController =
      StreamController<SharedPayload>.broadcast();

  static final StreamController<void> _audioRecognitionController =
      StreamController<void>.broadcast();

  static Stream<SharedPayload> get onSharedContent => _shareStreamController.stream;
  static Stream<void> get onAudioRecognitionTrigger => _audioRecognitionController.stream;

  static SharedPayload? initialPayload;
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    // Handle callbacks from Android onNewIntent
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onSharedData') {
        final String? rawData = call.arguments as String?;
        if (rawData != null && rawData.isNotEmpty) {
          final parsed = parseSharedText(rawData);
          if (parsed != null) {
            _shareStreamController.add(parsed);
          }
        }
      } else if (call.method == 'onTriggerAudioRecognition') {
        _audioRecognitionController.add(null);
      }
    });

    // Check if app was launched via Share Sheet or Quick Settings
    initialPayload = await checkInitialShare();
    checkPendingAudioRecognition();
  }

  static Future<SharedPayload?> checkInitialShare() async {
    try {
      final String? rawData = await _channel.invokeMethod<String>('getSharedData');
      if (rawData != null && rawData.isNotEmpty) {
        await _channel.invokeMethod('clearSharedData');
        final parsed = parseSharedText(rawData);
        if (parsed != null) {
          _shareStreamController.add(parsed);
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }

  static Future<void> checkPendingAudioRecognition() async {
    try {
      final bool? isPending = await _channel.invokeMethod<bool>('checkPendingAudioRecognition');
      if (isPending == true) {
        _audioRecognitionController.add(null);
      }
    } catch (_) {}
  }

  /// Finishes the native share-overlay activity so the user drops straight
  /// back into Instagram / TikTok / YouTube — no app-switch to Clipper.
  /// Safe to call when opened in-app (native side no-ops / backgrounds).
  static Future<void> closeShareOverlay() async {
    try {
      await _channel.invokeMethod('closeShareOverlay');
    } catch (_) {}
  }

  /// Music Radar: 5s mic capture via platform MediaRecorder (no plugin).
  /// Returns base64 data URL, or null when mic unavailable/denied —
  /// callers fall back to 'SIMULATED_AUDIO_SNIPPET' + link hint.
  static Future<bool> startMusicCapture() async {
    try {
      final ok = await _channel.invokeMethod<bool>('startMusicCapture');
      return ok == true;
    } catch (_) {
      return false;
    }
  }

  static Future<String?> stopMusicCapture() async {
    try {
      return await _channel.invokeMethod<String>('stopMusicCapture');
    } catch (_) {
      return null;
    }
  }

  /// Parses shared text from Spotify, TikTok, LinkedIn, YouTube, Twitter, etc.
  static SharedPayload? parseSharedText(String text) {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return null;

    // Extract URL with Regex
    final urlRegex = RegExp(r'(https?:\/\/[^\s]+)', caseSensitive: false);
    final match = urlRegex.firstMatch(cleanText);

    String url = cleanText;
    String note = '';

    if (match != null) {
      url = match.group(0) ?? cleanText;
      // Clean up punctuation attached to URL
      if (url.endsWith(')') || url.endsWith('.') || url.endsWith(',')) {
        url = url.substring(0, url.length - 1);
      }
      note = cleanText.replaceAll(url, '').trim();
    }

    // Identify platform
    String platform = 'web';
    final lowerUrl = url.toLowerCase();
    if (lowerUrl.contains('spotify.com')) {
      platform = 'spotify';
    } else if (lowerUrl.contains('tiktok.com')) {
      platform = 'tiktok';
    } else if (lowerUrl.contains('linkedin.com')) {
      platform = 'linkedin';
    } else if (lowerUrl.contains('youtube.com') || lowerUrl.contains('youtu.be')) {
      platform = 'youtube';
    } else if (lowerUrl.contains('instagram.com')) {
      platform = 'instagram';
    } else if (lowerUrl.contains('twitter.com') || lowerUrl.contains('x.com')) {
      platform = 'twitter';
    } else if (lowerUrl.contains('github.com')) {
      platform = 'github';
    } else if (lowerUrl.contains('reddit.com')) {
      platform = 'reddit';
    }

    return SharedPayload(
      rawText: cleanText,
      url: url,
      note: note,
      platform: platform,
    );
  }
}
