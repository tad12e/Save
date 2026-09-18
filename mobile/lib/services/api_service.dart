import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/clip_model.dart';
import '../models/user_model.dart';

class ApiService {
  static const String _keyBaseUrl = 'api_base_url';
  static const String _keyAccessToken = 'auth_access_token';
  static const String _keyRefreshToken = 'auth_refresh_token';
  static const String _keyUserJson = 'auth_user_data';

  static String get defaultBaseUrl {
    if (kIsWeb) return 'http://localhost:8000';
    // Android emulator has its own loopback: 127.0.0.1 = the emulator itself.
    // 10.0.2.2 is the special alias for the host PC's 127.0.0.1.
    // (Only use 127.0.0.1 on Android if you ran `adb reverse tcp:8000 tcp:8000`.)
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:8000';
    } catch (_) {}
    return 'http://127.0.0.1:8000';
  }

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyBaseUrl);
    if (saved != null && saved.isNotEmpty) {
      return saved;
    }
    return defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    var cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    await prefs.setString(_keyBaseUrl, cleanUrl);
  }

  // --- Token and Session Management ---

  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyAccessToken);
  }

  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyRefreshToken);
  }

  static Future<void> saveAuthSession({
    required String accessToken,
    String? refreshToken,
    UserModel? user,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyAccessToken, accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString(_keyRefreshToken, refreshToken);
    }
    if (user != null) {
      await prefs.setString(_keyUserJson, jsonEncode(user.toJson()));
    }
  }

  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_keyUserJson);
    if (raw == null || raw.isEmpty) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearAuthSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyAccessToken);
    await prefs.remove(_keyRefreshToken);
    await prefs.remove(_keyUserJson);
  }

  static Future<Map<String, String>> _getHeaders({
    Map<String, String>? extraHeaders,
    bool requireAuth = true,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requireAuth) {
      final token = await getAccessToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  static String _extractErrorMessage(dynamic body, int statusCode) {
    if (body is Map) {
      if (body.containsKey('error') && body['error'] != null) {
        return body['error'].toString();
      }
      if (body.containsKey('message') && body['message'] != null) {
        return body['message'].toString();
      }
      if (body.containsKey('detail') && body['detail'] != null) {
        return body['detail'].toString();
      }
      if (body.containsKey('non_field_errors')) {
        final errors = body['non_field_errors'];
        if (errors is List && errors.isNotEmpty) return errors.first.toString();
        return errors.toString();
      }
      for (final key in body.keys) {
        final val = body[key];
        if (val is List && val.isNotEmpty) {
          return '$key: ${val.first}';
        } else if (val is String) {
          return '$key: $val';
        }
      }
    }
    return 'Server request failed ($statusCode)';
  }

  // --- Auth API Endpoints ---

  static Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/signin/'),
        headers: await _getHeaders(requireAuth: false),
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'password': password,
        }),
      );

      final Map<String, dynamic> body = response.body.isNotEmpty
          ? jsonDecode(utf8.decode(response.bodyBytes))
          : {};

      if (response.statusCode == 200) {
        final accessToken = body['access']?.toString() ?? '';
        final refreshToken = body['refresh']?.toString() ?? '';
        final userData = body['user'] is Map<String, dynamic>
            ? UserModel.fromJson(body['user'])
            : null;

        if (accessToken.isNotEmpty) {
          await saveAuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userData,
          );
        }

        return {
          'success': true,
          'user': userData,
          'access': accessToken,
          'refresh': refreshToken,
        };
      } else {
        final errorMsg = _extractErrorMessage(body, response.statusCode);
        final isUnverified = errorMsg.toLowerCase().contains('verify your email') ||
            response.statusCode == 403;

        return {
          'success': false,
          'message': errorMsg,
          'isUnverified': isUnverified,
        };
      }
    } catch (e) {
      debugPrint('[ApiService.signIn] Error: $e');
      return {
        'success': false,
        'message': 'Cannot reach backend at $baseUrl ($e)',
      };
    }
  }

  static Future<Map<String, dynamic>> signUp({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/signup/'),
        headers: await _getHeaders(requireAuth: false),
        body: jsonEncode({
          'name': name.trim(),
          'email': email.trim().toLowerCase(),
          'password': password,
          'confirm_password': confirmPassword,
        }),
      ).timeout(const Duration(seconds: 8));

      final Map<String, dynamic> body = response.body.isNotEmpty
          ? jsonDecode(utf8.decode(response.bodyBytes))
          : {};

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': body['message'] ?? 'Verification code sent to your email.',
          'email': email.trim().toLowerCase(),
          'pending_verification': body['pending_verification'] ?? true,
        };
      } else {
        return {
          'success': false,
          'message': _extractErrorMessage(body, response.statusCode),
        };
      }
    } catch (e) {
      debugPrint('[ApiService.signUp] Error: $e');
      return {
        'success': false,
        'message': 'Cannot reach backend at $baseUrl ($e)',
      };
    }
  }

  static Future<Map<String, dynamic>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/verify-otp/'),
        headers: await _getHeaders(requireAuth: false),
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
        }),
      );

      final Map<String, dynamic> body = response.body.isNotEmpty
          ? jsonDecode(utf8.decode(response.bodyBytes))
          : {};

      if (response.statusCode == 200) {
        final accessToken = body['access']?.toString() ?? '';
        final refreshToken = body['refresh']?.toString() ?? '';
        final userData = body['user'] is Map<String, dynamic>
            ? UserModel.fromJson(body['user'])
            : null;

        if (accessToken.isNotEmpty) {
          await saveAuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userData,
          );
        }

        return {
          'success': true,
          'user': userData,
          'access': accessToken,
          'refresh': refreshToken,
        };
      } else {
        return {
          'success': false,
          'message': _extractErrorMessage(body, response.statusCode),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Cannot reach server at $baseUrl.',
      };
    }
  }

  static Future<Map<String, dynamic>> resendOtp({
    required String email,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/resend-otp/'),
        headers: await _getHeaders(requireAuth: false),
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
        }),
      );

      final Map<String, dynamic> body = response.body.isNotEmpty
          ? jsonDecode(utf8.decode(response.bodyBytes))
          : {};

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': body['message'] ?? 'A new code has been sent to your email.',
        };
      } else {
        return {
          'success': false,
          'message': _extractErrorMessage(body, response.statusCode),
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error. Please try again.',
      };
    }
  }

  static Future<UserModel?> fetchCurrentUser() async {
    final baseUrl = await getBaseUrl();
    final token = await getAccessToken();
    if (token == null) return null;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/auth/me/'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        final user = UserModel.fromJson(data);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_keyUserJson, jsonEncode(user.toJson()));
        return user;
      }
    } catch (_) {}
    return null;
  }

  // --- Clips API Endpoints ---

  static Future<List<ClipModel>> fetchClips() async {
    final baseUrl = await getBaseUrl();
    try {
      final headers = await _getHeaders();

      // 1. Fetch from /api/clips/ (complete feed ordered by newest first)
      final response = await http.get(
        Uri.parse('$baseUrl/api/clips/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(utf8.decode(response.bodyBytes));
        if (data is List && data.isNotEmpty) {
          return data.map((json) => ClipModel.fromJson(json as Map<String, dynamic>)).toList();
        }
      }

      // 2. Fallback to /api/clips/dashboard/ (recent_clips list)
      final dashboardResponse = await http.get(
        Uri.parse('$baseUrl/api/clips/dashboard/'),
        headers: headers,
      );

      if (dashboardResponse.statusCode == 200) {
        final dynamic data = jsonDecode(utf8.decode(dashboardResponse.bodyBytes));
        if (data is Map && data.containsKey('recent_clips')) {
          final List<dynamic> list = data['recent_clips'] ?? [];
          return list.map((json) => ClipModel.fromJson(json as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } catch (e) {
      if (kDebugMode) print('ApiService.fetchClips error: $e');
      return [];
    }
  }

  static Future<bool> saveClip({
    required String url,
    String? selectedText,
    String? destinationId,
    bool isPrivacyMode = false,
  }) async {
    final res = await saveClipDetailed(
      url: url,
      selectedText: selectedText,
      destinationId: destinationId,
      isPrivacyMode: isPrivacyMode,
    );
    return res.ok;
  }

  // --- Extension-parity detailed save (duplicate flag + note/tags/deadline) ---

  static Future<SaveResult> saveClipDetailed({
    required String url,
    String? selectedText,
    String? destinationId,
    String? note,
    List<String>? tags,
    String? deadline,
    String? tableId,
    String? tableName,
    bool isPrivacyMode = false,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final headers = await _getHeaders(
        extraHeaders: {
          'X-Privacy-Mode': isPrivacyMode ? 'true' : 'false',
        },
      );

      final payload = <String, dynamic>{
        'url': url,
        'selected_text': selectedText ?? '',
        'destination_id': destinationId,
        'privacy_mode': isPrivacyMode,
      };
      if (note != null && note.trim().isNotEmpty) payload['note'] = note.trim();
      if (tags != null && tags.isNotEmpty) payload['tags'] = tags;
      if (deadline != null && deadline.trim().isNotEmpty) {
        payload['deadline'] = deadline.trim().substring(0, 10);
      }
      if (tableId != null && tableId.isNotEmpty) payload['table_id'] = tableId;
      if (tableName != null && tableName.isNotEmpty) payload['table_name'] = tableName;

      final response = await http
          .post(
            Uri.parse('$baseUrl/api/clips/'),
            headers: headers,
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 12));

      if (response.statusCode == 200 || response.statusCode == 201) {
        Map<String, dynamic> body = {};
        try {
          body = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        } catch (_) {}
        final duplicate = body['duplicate'] == true;
        await _rememberDestination(destinationId);
        return SaveResult(
          ok: true,
          duplicate: duplicate,
          destinationName: body['destination_name']?.toString(),
          clipId: body['id']?.toString(),
        );
      }
      return SaveResult(ok: false, error: 'Server ${response.statusCode}');
    } catch (e) {
      if (kDebugMode) print('ApiService.saveClipDetailed error: $e');
      return SaveResult(ok: false, error: e.toString());
    }
  }

  static const String _keyLastDestinationId = 'clipper_last_destination_id';

  static Future<void> _rememberDestination(String? destinationId) async {
    if (destinationId == null || destinationId.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyLastDestinationId, destinationId);
    } catch (_) {}
  }

  static Future<String?> getLastDestinationId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_keyLastDestinationId);
    } catch (_) {
      return null;
    }
  }

  static Future<List<SaveDestination>> getDestinations() async {
    const fallback = [
      SaveDestination(id: 'vault', name: 'Save Vault', provider: 'vault', isDefault: false),
      SaveDestination(id: 'google_sheets', name: 'Google Sheets', provider: 'google_sheets', isDefault: true),
      SaveDestination(id: 'notion', name: 'Notion Workspace', provider: 'notion', isDefault: false),
    ];
    final baseUrl = await getBaseUrl();
    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/destinations/'), headers: await _getHeaders())
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return fallback;
      final dynamic data = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> list = data is List ? data : (data is Map ? (data['results'] as List? ?? []) : []);
      if (list.isEmpty) return fallback;
      return list.map((d) {
        final m = d as Map<String, dynamic>;
        return SaveDestination(
          id: m['id']?.toString() ?? '',
          name: (m['name'] ?? m['provider'] ?? 'Destination').toString(),
          provider: (m['provider'] ?? m['type'] ?? '').toString(),
          isDefault: m['is_default'] == true,
          isActive: m['is_active'] != false,
        );
      }).where((d) => d.id.isNotEmpty).toList();
    } catch (_) {
      return fallback;
    }
  }

  static Future<bool> setDefaultDestination(String id) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http
          .post(Uri.parse('$baseUrl/api/destinations/$id/set_default/'), headers: await _getHeaders())
          .timeout(const Duration(seconds: 8));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  // --- Music Radar (extension parity) ---

  static Future<MusicRecognitionResult> recognizeAudio({
    required String audioBase64,
    String format = 'm4a',
    String titleHint = '',
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/clips/recognize-audio/'),
            headers: await _getHeaders(requireAuth: false),
            body: jsonEncode({
              'audio': audioBase64,
              'format': format,
              'title_hint': titleHint,
            }),
          )
          .timeout(const Duration(seconds: 20));
      Map<String, dynamic> body = {};
      try {
        body = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      } catch (_) {}
      if (response.statusCode == 200 && (body['success'] == true || body['title'] != null)) {
        return MusicRecognitionResult(
          success: true,
          title: (body['title'] ?? 'Unknown Track').toString(),
          artist: (body['artist'] ?? 'Unknown Artist').toString(),
          artworkUrl: body['artwork_url']?.toString() ?? '',
          previewUrl: body['preview_url']?.toString() ?? '',
          spotifyId: body['spotify_id']?.toString() ?? '',
          spotifyUri: body['spotify_uri']?.toString() ?? '',
          spotifyUrl: body['spotify_url']?.toString() ?? '',
          youtubeMusicUrl: body['youtube_music_url']?.toString() ?? '',
          isSimulated: body['is_simulated'] == true,
        );
      }
      return MusicRecognitionResult(
        success: false,
        error: (body['error'] ?? 'Song could not be identified').toString(),
      );
    } catch (e) {
      return MusicRecognitionResult(success: false, error: e.toString());
    }
  }

  static Future<List<SpotifyPlaylistRef>> fetchSpotifyPlaylists() async {
    const fallback = [SpotifyPlaylistRef(id: 'default', name: 'Clipper Tracks (Default)')];
    final baseUrl = await getBaseUrl();
    try {
      final token = await getAccessToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
      final response = await http
          .get(Uri.parse('$baseUrl/api/destinations/spotify/playlists/'), headers: headers)
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return fallback;
      final data = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      final List<dynamic> list = data['playlists'] ?? [];
      if (list.isEmpty) return fallback;
      return list.map((p) {
        final m = p as Map<String, dynamic>;
        return SpotifyPlaylistRef(
          id: (m['id'] ?? '').toString(),
          name: (m['name'] ?? 'Playlist').toString(),
        );
      }).where((p) => p.id.isNotEmpty).toList();
    } catch (_) {
      return fallback;
    }
  }

  static Future<bool> addTrackToSpotify({
    required String playlistId,
    required String trackId,
    required String trackUri,
    String query = '',
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final token = await getAccessToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/destinations/spotify/add-track/'),
            headers: headers,
            body: jsonEncode({
              'playlist_id': playlistId,
              'track_id': trackId,
              'track_uri': trackUri,
              if (query.isNotEmpty) 'query': query,
            }),
          )
          .timeout(const Duration(seconds: 10));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  // --- Real backend feed (FeedEngine, no backend changes) ---

  /// GET /api/clips/feed/?timeframe=today|week|all&category=...&limit=50
  /// Returns the raw feed map, or null when unreachable (caller falls back
  /// to client-side synthesis from cached clips).
  static Future<Map<String, dynamic>?> fetchFeed({
    String timeframe = 'today',
    String category = 'all',
    int limit = 50,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final uri = Uri.parse('$baseUrl/api/clips/feed/').replace(
        queryParameters: {
          'timeframe': timeframe,
          'category': category,
          'limit': '$limit',
        },
      );
      final response = await http
          .get(uri, headers: await _getHeaders())
          .timeout(const Duration(seconds: 12));
      if (response.statusCode != 200) return null;
      final dynamic data = jsonDecode(utf8.decode(response.bodyBytes));
      if (data is Map<String, dynamic> &&
          data['metrics'] is Map &&
          data['stream_items'] is List) {
        return data;
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('ApiService.fetchFeed error: $e');
      return null;
    }
  }

  /// POST /api/clips/feed/<clipId>/action/ {action, note}
  /// action: review|master|snooze|watchlist|archive
  static Future<FeedActionResult> performFeedAction(
    String clipId,
    String action, {
    String note = '',
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/api/clips/feed/$clipId/action/'),
            headers: await _getHeaders(),
            body: jsonEncode({'action': action, 'note': note}),
          )
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        Map<String, dynamic> body = {};
        try {
          body = jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
        } catch (_) {}
        return FeedActionResult(
          success: body['success'] != false,
          isReviewed: body['is_reviewed'] == true,
          isWatchlisted: body['is_watchlisted'] == true,
        );
      }
      // Optimistic fallback (web parity): treat as success locally.
      return FeedActionResult(
        success: true,
        isReviewed: action == 'review' || action == 'master',
        isWatchlisted: action == 'watchlist',
        optimistic: true,
      );
    } catch (_) {
      return FeedActionResult(
        success: true,
        isReviewed: action == 'review' || action == 'master',
        isWatchlisted: action == 'watchlist',
        optimistic: true,
      );
    }
  }

  static Future<Map<String, dynamic>?> fetchDashboardStats() async {    final baseUrl = await getBaseUrl();
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/api/clips/dashboard/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Fetches complete multi-dimensional Columnar OLAP Analytics from backend.
  static Future<Map<String, dynamic>?> fetchFullAnalytics({
    String period = 'this_week',
    bool refresh = false,
  }) async {
    final baseUrl = await getBaseUrl();
    try {
      final headers = await _getHeaders(requireAuth: false);
      final queryParamPeriod = switch (period) {
        'This Month' => 'this_month',
        'Last 30 Days' => 'last_30_days',
        'All Time' => 'all_time',
        _ => 'this_week',
      };

      final uri = Uri.parse('$baseUrl/api/analytics/full/').replace(
        queryParameters: {
          'period': queryParamPeriod,
          if (refresh) 'refresh': 'true',
        },
      );

      final response = await http.get(uri, headers: headers).timeout(
        const Duration(seconds: 8),
      );

      if (response.statusCode == 200) {
        return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
      }
    } catch (e) {
      if (kDebugMode) print('ApiService.fetchFullAnalytics error: $e');
    }
    return null;
  }
}

class SaveResult {
  final bool ok;
  final bool duplicate;
  final String? destinationName;
  final String? clipId;
  final String? error;

  const SaveResult({
    required this.ok,
    this.duplicate = false,
    this.destinationName,
    this.clipId,
    this.error,
  });
}

class SaveDestination {
  final String id;
  final String name;
  final String provider;
  final bool isDefault;
  final bool isActive;

  const SaveDestination({
    required this.id,
    required this.name,
    required this.provider,
    this.isDefault = false,
    this.isActive = true,
  });
}

class MusicRecognitionResult {
  final bool success;
  final String title;
  final String artist;
  final String artworkUrl;
  final String previewUrl;
  final String spotifyId;
  final String spotifyUri;
  final String spotifyUrl;
  final String youtubeMusicUrl;
  final bool isSimulated;
  final String error;

  const MusicRecognitionResult({
    required this.success,
    this.title = '',
    this.artist = '',
    this.artworkUrl = '',
    this.previewUrl = '',
    this.spotifyId = '',
    this.spotifyUri = '',
    this.spotifyUrl = '',
    this.youtubeMusicUrl = '',
    this.isSimulated = false,
    this.error = '',
  });
}

class SpotifyPlaylistRef {
  final String id;
  final String name;

  const SpotifyPlaylistRef({required this.id, required this.name});
}

class FeedActionResult {
  final bool success;
  final bool isReviewed;
  final bool isWatchlisted;
  final bool optimistic;

  const FeedActionResult({
    required this.success,
    this.isReviewed = false,
    this.isWatchlisted = false,
    this.optimistic = false,
  });
}

