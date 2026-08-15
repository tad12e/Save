import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/clip_model.dart';

class ApiService {
  // Default backend URL for Android Emulator (10.0.2.2) or iOS Simulator / local (127.0.0.1)
  static const String defaultBaseUrl = 'http://10.0.2.2:8000';
  
  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('api_base_url') ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
  }

  static Future<List<ClipModel>> fetchClips() async {
    final baseUrl = await getBaseUrl();
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/clips/'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(utf8.decode(response.bodyBytes));
        return data.map((json) => ClipModel.fromJson(json)).toList();
      } else {
        throw Exception('Server returned status: ${response.statusCode}');
      }
    } catch (e) {
      // Return empty list on network failure or offline mode
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
      final response = await http.post(
        Uri.parse('$baseUrl/api/clips/'),
        headers: {
          'Content-Type': 'application/json',
          'X-Privacy-Mode': isPrivacyMode ? 'true' : 'false',
        },
        body: json.encode({
          'url': url,
          'selected_text': selectedText ?? '',
          'destination_id': destinationId,
          'privacy_mode': isPrivacyMode,
        }),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
}
