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
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:8000';
    } catch (_) {}
    return 'http://127.0.0.1:8000';
  }

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyBaseUrl) ?? defaultBaseUrl;
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

      // 1. Try /api/clips/dashboard/ first (standard backend feed with stats & recent_clips)
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

      // 2. Fallback to /api/clips/ in case direct listing is enabled
      final response = await http.get(
        Uri.parse('$baseUrl/api/clips/'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final dynamic data = jsonDecode(utf8.decode(response.bodyBytes));
        if (data is List) {
          return data.map((json) => ClipModel.fromJson(json as Map<String, dynamic>)).toList();
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
    final baseUrl = await getBaseUrl();
    try {
      final headers = await _getHeaders(
        extraHeaders: {
          'X-Privacy-Mode': isPrivacyMode ? 'true' : 'false',
        },
      );

      final response = await http.post(
        Uri.parse('$baseUrl/api/clips/'),
        headers: headers,
        body: jsonEncode({
          'url': url,
          'selected_text': selectedText ?? '',
          'destination_id': destinationId,
          'privacy_mode': isPrivacyMode,
        }),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      if (kDebugMode) print('ApiService.saveClip error: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> fetchDashboardStats() async {
    final baseUrl = await getBaseUrl();
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

