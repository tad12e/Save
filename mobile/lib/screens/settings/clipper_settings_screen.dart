import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../services/api_service.dart';
import '../../widgets/audio_recognition_dialog.dart';
import '../../widgets/floating_music_bubble.dart';
import '../../widgets/save_clip_bottom_sheet.dart';

enum ConfirmationMode { auto, confirm, alwaysAsk }

class DestinationItem {
  final String id;
  final String name;
  final String type;
  final String targetResource;
  final bool isConnected;
  final bool isDefault;

  DestinationItem({
    required this.id,
    required this.name,
    required this.type,
    required this.targetResource,
    required this.isConnected,
    this.isDefault = false,
  });

  factory DestinationItem.fromJson(Map<String, dynamic> json) {
    final config = json['config'] is Map ? json['config'] : {};
    return DestinationItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Destination',
      type: json['provider']?.toString() ?? json['type']?.toString() ?? 'custom_db',
      targetResource: config['target_resource_name']?.toString() ??
          json['target_resource_name']?.toString() ??
          'Configured Storage',
      isConnected: json['is_active'] == true || json['connected'] == true,
      isDefault: json['is_default'] == true,
    );
  }
}

class SpotifyPlaylistItem {
  final String id;
  final String name;
  final String description;
  final int totalTracks;
  final String imageUrl;

  SpotifyPlaylistItem({
    required this.id,
    required this.name,
    required this.description,
    required this.totalTracks,
    required this.imageUrl,
  });

  factory SpotifyPlaylistItem.fromJson(Map<String, dynamic> json) {
    return SpotifyPlaylistItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Untitled Playlist',
      description: json['description']?.toString() ?? '',
      totalTracks: json['total_tracks'] is int ? json['total_tracks'] : 0,
      imageUrl: json['image_url']?.toString() ?? '',
    );
  }
}

class SpotifyTrackItem {
  final String id;
  final String name;
  final String artists;
  final String album;
  final String albumArt;
  final String uri;
  final String externalUrl;

  SpotifyTrackItem({
    required this.id,
    required this.name,
    required this.artists,
    required this.album,
    required this.albumArt,
    required this.uri,
    required this.externalUrl,
  });

  factory SpotifyTrackItem.fromJson(Map<String, dynamic> json) {
    return SpotifyTrackItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Track',
      artists: json['artists']?.toString() ?? 'Unknown Artist',
      album: json['album']?.toString() ?? '',
      albumArt: json['album_art']?.toString() ?? '',
      uri: json['uri']?.toString() ?? '',
      externalUrl: json['external_url']?.toString() ?? '',
    );
  }
}

class ClipperSettingsScreen extends StatefulWidget {
  const ClipperSettingsScreen({super.key});

  @override
  State<ClipperSettingsScreen> createState() => _ClipperSettingsScreenState();
}

class _ClipperSettingsScreenState extends State<ClipperSettingsScreen> {
  bool _isLoading = true;
  bool _isSaving = false;
  String? _feedbackMessage;

  // 1. Confirmation Mode
  ConfirmationMode _confirmationMode = ConfirmationMode.confirm;

  // 2. Destinations & Universal Default
  List<DestinationItem> _destinations = [];
  String _defaultDestId = 'vault';

  // 3. Smart Category Routing
  Map<String, String> _categoryRules = {
    'article': '',
    'job': '',
    'tool': '',
    'scholarship': '',
    'event': '',
    'recipe': '',
  };

  // 4. Music Provider & Spotify Integration
  String _musicProvider = 'spotify'; // 'spotify' | 'youtube_music'
  String _musicPlaylist = 'default';
  bool _musicAutoAdd = true;
  List<SpotifyPlaylistItem> _spotifyPlaylists = [];
  bool _loadingPlaylists = false;
  bool _showApiKeys = false;
  final TextEditingController _spotifyClientIdController = TextEditingController();
  final TextEditingController _spotifyClientSecretController = TextEditingController();

  // Spotify Search widget state
  final TextEditingController _songSearchController = TextEditingController();
  List<SpotifyTrackItem> _searchResults = [];
  bool _isSearching = false;
  String? _addingTrackId;

  // 5. Local Privacy Mode
  bool _isPrivacyMode = false;

  // 6. AI Extraction Prompt
  final TextEditingController _aiPromptController = TextEditingController(
    text: "Extract job title, company name, salary range, application deadline, and key responsibilities into JSON.",
  );

  // 7. Mobile Capture & Music Detection Modes
  bool _enableShareSheet = true;
  bool _enableQuickSettingsTile = false;
  bool _enableFloatingBubble = false;

  @override
  void initState() {
    super.initState();
    _loadAllSettings();
  }

  @override
  void dispose() {
    _spotifyClientIdController.dispose();
    _spotifyClientSecretController.dispose();
    _songSearchController.dispose();
    _aiPromptController.dispose();
    super.dispose();
  }

  Future<void> _loadAllSettings() async {
    setState(() => _isLoading = true);
    final prefs = await SharedPreferences.getInstance();

    // 1. Local cache load first for instant UI responsiveness
    final modeStr = prefs.getString('clipper_confirmation_mode') ?? 'confirm';
    if (modeStr == 'auto') {
      _confirmationMode = ConfirmationMode.auto;
    } else if (modeStr == 'always_ask') {
      _confirmationMode = ConfirmationMode.alwaysAsk;
    } else {
      _confirmationMode = ConfirmationMode.confirm;
    }

    _isPrivacyMode = prefs.getBool('clipper_privacy_mode') ?? false;
    _musicProvider = prefs.getString('clipper_music_provider') ?? 'spotify';
    _musicPlaylist = prefs.getString('clipper_music_playlist') ?? 'default';
    _musicAutoAdd = prefs.getBool('clipper_music_auto_add') ?? true;
    _spotifyClientIdController.text = prefs.getString('clipper_spotify_client_id') ?? '';
    _spotifyClientSecretController.text = prefs.getString('clipper_spotify_client_secret') ?? '';

    final savedPrompt = prefs.getString('clipper_ai_extraction_prompt');
    if (savedPrompt != null && savedPrompt.isNotEmpty) {
      _aiPromptController.text = savedPrompt;
    }

    final rawRules = prefs.getString('clipper_category_rules');
    if (rawRules != null && rawRules.isNotEmpty) {
      try {
        final decoded = jsonDecode(rawRules) as Map<String, dynamic>;
        _categoryRules = decoded.map((k, v) => MapEntry(k, v.toString()));
      } catch (_) {}
    }

    _enableShareSheet = prefs.getBool('clipper_enable_sharesheet') ?? true;
    _enableQuickSettingsTile = prefs.getBool('clipper_enable_qstile') ?? false;
    _enableFloatingBubble = prefs.getBool('clipper_enable_bubble') ?? false;
    if (_enableFloatingBubble) {
      FloatingBubbleManager.show();
    }

    // 2. Fetch synced settings from backend (/api/users/settings/)
    try {
      final backendSettings = await ApiService.getUserSettings();
      if (backendSettings != null) {
        if (backendSettings['confirmation_mode'] != null) {
          final m = backendSettings['confirmation_mode'].toString();
          _confirmationMode = m == 'auto'
              ? ConfirmationMode.auto
              : (m == 'always_ask' ? ConfirmationMode.alwaysAsk : ConfirmationMode.confirm);
        }
        if (backendSettings['privacy_mode'] != null) {
          _isPrivacyMode = backendSettings['privacy_mode'] == true;
        }
        if (backendSettings['music_provider'] != null && backendSettings['music_provider'].toString().isNotEmpty) {
          _musicProvider = backendSettings['music_provider'].toString();
        }
        if (backendSettings['music_target_playlist_id'] != null && backendSettings['music_target_playlist_id'].toString().isNotEmpty) {
          _musicPlaylist = backendSettings['music_target_playlist_id'].toString();
        }
        if (backendSettings['music_auto_add'] != null) {
          _musicAutoAdd = backendSettings['music_auto_add'] == true;
        }
        if (backendSettings['spotify_client_id'] != null) {
          _spotifyClientIdController.text = backendSettings['spotify_client_id'].toString();
        }
        if (backendSettings['spotify_client_secret'] != null) {
          _spotifyClientSecretController.text = backendSettings['spotify_client_secret'].toString();
        }
        if (backendSettings['ai_extraction_prompt'] != null && backendSettings['ai_extraction_prompt'].toString().isNotEmpty) {
          _aiPromptController.text = backendSettings['ai_extraction_prompt'].toString();
        }
        if (backendSettings['enable_share_sheet'] != null) {
          _enableShareSheet = backendSettings['enable_share_sheet'] == true;
        }
        if (backendSettings['enable_quick_settings_tile'] != null) {
          _enableQuickSettingsTile = backendSettings['enable_quick_settings_tile'] == true;
        }
        if (backendSettings['enable_floating_bubble'] != null) {
          _enableFloatingBubble = backendSettings['enable_floating_bubble'] == true;
          if (_enableFloatingBubble) {
            FloatingBubbleManager.show();
          } else {
            FloatingBubbleManager.hide();
          }
        }
        if (backendSettings['default_destination'] != null && backendSettings['default_destination'].toString().isNotEmpty) {
          _defaultDestId = backendSettings['default_destination'].toString();
        }
        if (backendSettings['category_rules'] is Map) {
          final loadedRules = (backendSettings['category_rules'] as Map).map((k, v) => MapEntry(k.toString(), v.toString()));
          _categoryRules.addAll(loadedRules);
        }
      }
    } catch (_) {}

    // 3. Fetch destinations from backend (or fallback defaults)
    await _fetchDestinationsFromBackend();

    // 4. Fetch category rules from backend
    await _fetchCategoryRulesFromBackend();

    // 5. Fetch Spotify playlists if provider is Spotify
    if (_musicProvider == 'spotify') {
      _loadSpotifyPlaylists();
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchDestinationsFromBackend() async {
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http
          .get(Uri.parse('$baseUrl/api/destinations/'), headers: headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final dynamic raw = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> data = raw is List ? raw : (raw is Map ? (raw['results'] as List? ?? []) : []);
        if (data.isNotEmpty) {
          final loaded = data
              .map((d) => DestinationItem.fromJson(d as Map<String, dynamic>))
              .toList();

          _destinations = loaded;
          final defaultItem = loaded.firstWhere(
            (d) => d.isDefault,
            orElse: () => loaded.first,
          );
          _defaultDestId = defaultItem.id;
          return;
        }
      }
    } catch (_) {}

    _destinations = [];
    _defaultDestId = '';
  }

  Future<void> _fetchCategoryRulesFromBackend() async {
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http
          .get(Uri.parse('$baseUrl/api/destinations/category-rules/'), headers: headers)
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        if (data.containsKey('rules') && data['rules'] is Map) {
          final loadedRules = (data['rules'] as Map).map((k, v) => MapEntry(k.toString(), v.toString()));
          setState(() {
            _categoryRules.addAll(loadedRules);
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadSpotifyPlaylists() async {
    setState(() => _loadingPlaylists = true);
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http
          .get(Uri.parse('$baseUrl/api/destinations/spotify/playlists/'), headers: headers)
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> list = data['playlists'] ?? [];
        final parsed = list
            .map((p) => SpotifyPlaylistItem.fromJson(p as Map<String, dynamic>))
            .toList();

        if (mounted) {
          setState(() {
            _spotifyPlaylists = parsed;
            _loadingPlaylists = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _spotifyPlaylists = [];
        _loadingPlaylists = false;
      });
    }
  }

  Future<void> _searchSpotify(String query) async {
    final clean = query.trim();
    if (clean.isEmpty) return;

    setState(() => _isSearching = true);
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http
          .get(
            Uri.parse('$baseUrl/api/destinations/spotify/search/?q=${Uri.encodeComponent(clean)}&limit=6'),
            headers: headers,
          )
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        final List<dynamic> list = data['tracks'] ?? [];
        final results = list
            .map((t) => SpotifyTrackItem.fromJson(t as Map<String, dynamic>))
            .toList();

        if (mounted) {
          setState(() {
            _searchResults = results;
            _isSearching = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
    }
  }

  Future<void> _addTrackToPlaylist(SpotifyTrackItem track) async {
    setState(() => _addingTrackId = track.id);
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      await http
          .post(
            Uri.parse('$baseUrl/api/destinations/spotify/add-track/'),
            headers: headers,
            body: jsonEncode({
              'playlist_id': _musicPlaylist,
              'track_uri': track.uri,
              'track_id': track.id,
              'query': '${track.name} - ${track.artists}',
            }),
          )
          .timeout(const Duration(seconds: 6));
    } catch (_) {}

    if (mounted) {
      setState(() {
        _addingTrackId = null;
        _feedbackMessage = 'Added "${track.name}" by ${track.artists} to playlist!';
      });
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) setState(() => _feedbackMessage = null);
      });
    }
  }

  void _showCreatePlaylistDialog() {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    bool isCreating = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(LucideIcons.listPlus, size: 16, color: Color(0xFF059669)),
              ),
              const SizedBox(width: 10),
              Text(
                'Create Playlist',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create a new playlist directly in your connected music service:',
                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'e.g. Midnight Synthwave & Coding',
                  hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Description (optional)',
                  hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 11),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: isCreating
                  ? null
                  : () async {
                      final name = nameCtrl.text.trim();
                      if (name.isEmpty) return;

                      setDialogState(() => isCreating = true);
                      final baseUrl = await ApiService.getBaseUrl();
                      final token = await ApiService.getAccessToken();

                      try {
                        final headers = <String, String>{'Content-Type': 'application/json'};
                        if (token != null && token.isNotEmpty) {
                          headers['Authorization'] = 'Bearer $token';
                        }

                        final res = await http.post(
                          Uri.parse('$baseUrl/api/destinations/spotify/playlists/'),
                          headers: headers,
                          body: jsonEncode({
                            'name': name,
                            'description': descCtrl.text.trim(),
                            'is_public': false,
                          }),
                        );

                        if (res.statusCode == 200 || res.statusCode == 201) {
                          final data = jsonDecode(utf8.decode(res.bodyBytes));
                          final created = SpotifyPlaylistItem.fromJson(data);
                          setState(() {
                            _spotifyPlaylists.insert(0, created);
                            _musicPlaylist = created.id;
                          });
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                            setState(() {
                              _feedbackMessage = 'Created playlist "$name" on Spotify!';
                            });
                            Future.delayed(const Duration(seconds: 4), () {
                              if (mounted) setState(() => _feedbackMessage = null);
                            });
                          }
                          return;
                        }
                      } catch (_) {}

                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        setState(() {
                          _feedbackMessage = 'Failed to create playlist on Spotify. Check backend connection.';
                        });
                        Future.delayed(const Duration(seconds: 4), () {
                          if (mounted) setState(() => _feedbackMessage = null);
                        });
                      }
                    },
              child: isCreating
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      'Create Playlist',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showProviderSwitchConfirmation(String target) {
    if (target == _musicProvider) return;

    final targetName = target == 'youtube_music' ? 'YouTube Music' : 'Spotify';
    final isYouTube = target == 'youtube_music';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: isYouTube ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                LucideIcons.triangleAlert,
                size: 18,
                color: isYouTube ? const Color(0xFFDC2626) : const Color(0xFF059669),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Switch Music Provider?',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Change your primary music destination from ${_musicProvider == 'spotify' ? 'Spotify' : 'YouTube Music'} to $targetName?',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary, height: 1.4),
            ),
            const SizedBox(height: 8),
            Text(
              '• Future saved songs, music links, and audio tracks will automatically sync into $targetName.',
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isYouTube ? const Color(0xFFDC2626) : const Color(0xFF059669),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() {
                _musicProvider = target;
                _feedbackMessage = 'Primary music destination switched to $targetName!';
              });

              // Sync backend
              final baseUrl = await ApiService.getBaseUrl();
              final token = await ApiService.getAccessToken();
              try {
                final headers = <String, String>{'Content-Type': 'application/json'};
                if (token != null && token.isNotEmpty) {
                  headers['Authorization'] = 'Bearer $token';
                }
                await http.post(
                  Uri.parse('$baseUrl/api/destinations/set-music-provider/'),
                  headers: headers,
                  body: jsonEncode({'provider': target}),
                );
              } catch (_) {}

              if (target == 'spotify') {
                _loadSpotifyPlaylists();
              }

              Future.delayed(const Duration(seconds: 4), () {
                if (mounted) setState(() => _feedbackMessage = null);
              });
            },
            child: Text(
              'Confirm Switch',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleConnectSpotifyOAuth() async {
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      final res = await http.post(
        Uri.parse('$baseUrl/api/destinations/authorize/'),
        headers: headers,
        body: jsonEncode({
          'provider': 'spotify',
          'name': 'Spotify Music',
          'access_type': 'full',
          'action_type': 'create',
          'target_resource_name': 'Playlist: Clipper Tracks (Default)',
        }),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final authUrl = data['auth_url']?.toString();
        if (authUrl != null && authUrl.isNotEmpty) {
          final uri = Uri.parse(authUrl);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
            return;
          }
        }
      }
    } catch (_) {}

    setState(() {
      _feedbackMessage = 'Failed to connect Spotify. Check backend configuration.';
    });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _feedbackMessage = null);
    });
  }

  Future<void> _saveAllSettings() async {
    setState(() => _isSaving = true);
    final prefs = await SharedPreferences.getInstance();

    // 1. Confirmation mode
    final modeStr = _confirmationMode == ConfirmationMode.auto
        ? 'auto'
        : (_confirmationMode == ConfirmationMode.alwaysAsk ? 'always_ask' : 'confirm');
    await prefs.setString('clipper_confirmation_mode', modeStr);

    // 2. Default Destination
    await prefs.setString('clipper_default_dest_id', _defaultDestId);

    // 3. Category Rules
    await prefs.setString('clipper_category_rules', jsonEncode(_categoryRules));

    // 4. Music settings
    await prefs.setString('clipper_music_provider', _musicProvider);
    await prefs.setString('clipper_music_playlist', _musicPlaylist);
    await prefs.setBool('clipper_music_auto_add', _musicAutoAdd);
    await prefs.setString('clipper_spotify_client_id', _spotifyClientIdController.text.trim());
    await prefs.setString('clipper_spotify_client_secret', _spotifyClientSecretController.text.trim());

    // 5. Privacy mode
    await prefs.setBool('clipper_privacy_mode', _isPrivacyMode);

    // 6. AI Prompt
    await prefs.setString('clipper_ai_extraction_prompt', _aiPromptController.text.trim());

    // 7. Mobile Capture & Music Detection Modes
    await prefs.setBool('clipper_enable_sharesheet', _enableShareSheet);
    await prefs.setBool('clipper_enable_qstile', _enableQuickSettingsTile);
    await prefs.setBool('clipper_enable_bubble', _enableFloatingBubble);

    // Sync floating bubble overlay state
    if (_enableFloatingBubble) {
      FloatingBubbleManager.show();
    } else {
      FloatingBubbleManager.hide();
    }

    // 8. Comprehensive Backend Sync via UserSettings API
    final payload = <String, dynamic>{
      'confirmation_mode': modeStr,
      'privacy_mode': _isPrivacyMode,
      'music_provider': _musicProvider,
      'music_target_playlist_id': _musicPlaylist,
      'music_auto_add': _musicAutoAdd,
      'spotify_client_id': _spotifyClientIdController.text.trim(),
      'spotify_client_secret': _spotifyClientSecretController.text.trim(),
      'ai_extraction_prompt': _aiPromptController.text.trim(),
      'enable_share_sheet': _enableShareSheet,
      'enable_quick_settings_tile': _enableQuickSettingsTile,
      'enable_floating_bubble': _enableFloatingBubble,
      'default_destination': _defaultDestId,
      'category_rules': _categoryRules,
    };

    final updateResult = await ApiService.updateUserSettings(payload);

    // Also sync destination endpoints for multi-client compatibility
    final baseUrl = await ApiService.getBaseUrl();
    final token = await ApiService.getAccessToken();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    try {
      if (_defaultDestId.isNotEmpty && _defaultDestId != 'vault') {
        http.post(
          Uri.parse('$baseUrl/api/destinations/$_defaultDestId/set-default/'),
          headers: headers,
        );
      }
      http.post(
        Uri.parse('$baseUrl/api/destinations/category-rules/'),
        headers: headers,
        body: jsonEncode({'rules': _categoryRules}),
      );
      http.post(
        Uri.parse('$baseUrl/api/destinations/set-music-provider/'),
        headers: headers,
        body: jsonEncode({'provider': _musicProvider}),
      );
    } catch (_) {}

    if (mounted) {
      setState(() {
        _isSaving = false;
        _feedbackMessage = updateResult != null
            ? 'Settings synced with cloud & saved across all devices!'
            : 'Settings saved locally & queued for sync!';
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(LucideIcons.circleCheck, color: Colors.white, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  updateResult != null
                      ? 'Settings synced across all devices ✓'
                      : 'Settings saved locally ✓',
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF2D6A4F),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );

      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) setState(() => _feedbackMessage = null);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Clipper & System Preferences',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF2D6A4F)))
          : Stack(
              children: [
                SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 90),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Subtitle
                      Text(
                        'Configure universal save targets, smart per-category destinations, dedicated music playlists, and confirmation modes.',
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted, height: 1.4),
                      ),
                      const SizedBox(height: 16),

                      // Feedback Banner
                      if (_feedbackMessage != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF86EFAC)),
                          ),
                          child: Row(
                            children: [
                              const Icon(LucideIcons.circleCheck, color: Color(0xFF16A34A), size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  _feedbackMessage!,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF166534),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // 0. Mobile Capture & Music Detection Modes
                      _buildCaptureModesSection(),
                      const SizedBox(height: 18),

                      // 1. Clipper Save Confirmation Modes
                      _buildConfirmationModeSection(),
                      const SizedBox(height: 18),

                      // 2. Universal Global Default Destination
                      _buildDefaultDestinationSection(),
                      const SizedBox(height: 18),

                      // 3. Smart Category Routing
                      _buildCategoryRoutingSection(),
                      const SizedBox(height: 18),

                      // 4. Music & Streaming Hub
                      _buildMusicSection(),
                      const SizedBox(height: 18),

                      // 5. Local Privacy Storage Mode
                      _buildPrivacyModeSection(),
                      const SizedBox(height: 18),

                      // 6. AI Extraction Prompt Rules
                      _buildAiPromptSection(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),

                // Floating Bottom Save Action Bar
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderSubtle),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Syncs across all devices',
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              Text(
                                'Mobile, Web App, & Extension',
                                style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2D6A4F),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                          ),
                          onPressed: _isSaving ? null : _saveAllSettings,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_isSaving)
                                const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              else
                                const Icon(LucideIcons.save, size: 15, color: Colors.white),
                              const SizedBox(width: 6),
                              Text(
                                'Save Settings',
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  // ===========================================================================
  // SECTION 0: CAPTURE & MUSIC DETECTION MODES
  // ===========================================================================
  Widget _buildCaptureModesSection() {
    return _buildCardWrapper(
      icon: LucideIcons.smartphone,
      iconColor: const Color(0xFF7C3AED),
      iconBg: const Color(0xFFEDE9FE),
      title: 'Mobile Capture & Music Detection Modes',
      tag: '3-IN-1 CAPTURE',
      description: 'Configure how you capture links, TikToks, and identify background music without leaving your current app:',
      child: Column(
        children: [
          // 1. Share Sheet
          _buildCaptureModeTile(
            icon: LucideIcons.share2,
            iconColor: const Color(0xFF7C3AED),
            title: '1-Tap Share Sheet Integration',
            badgeText: 'DEFAULT ON',
            badgeColor: const Color(0xFF7C3AED),
            description: 'Appears in Spotify, TikTok, LinkedIn, and Instagram share menus with instant [Music Sync / Full Clip] mode switch.',
            value: _enableShareSheet,
            onChanged: (val) => setState(() => _enableShareSheet = val),
            actionButton: InkWell(
              onTap: () {
                SaveClipBottomSheet.show(
                  context,
                  initialUrl: 'https://www.tiktok.com/@creator/video/7391823901923?sound=MidnightVibes',
                  initialNote: 'Viral Soundtrack / Dance Reel',
                  platform: 'tiktok',
                  isExternalShare: true,
                );
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.play, size: 13, color: Color(0xFF7C3AED)),
                    const SizedBox(width: 5),
                    Text(
                      'Simulate TikTok / Spotify Share',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF7C3AED),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // 2. Quick Settings Tile
          _buildCaptureModeTile(
            icon: LucideIcons.slidersHorizontal,
            iconColor: const Color(0xFF2563EB),
            title: 'Android Quick Settings Tile',
            badgeText: 'SWIPE DOWN',
            badgeColor: const Color(0xFF2563EB),
            description: 'Swipe down your phone\'s notification shade anywhere to identify music without switching apps.',
            value: _enableQuickSettingsTile,
            onChanged: (val) => setState(() => _enableQuickSettingsTile = val),
            actionButton: InkWell(
              onTap: () {
                AudioRecognitionDialog.show(
                  context,
                  titleHint: 'Android QS Tile Listening Demo',
                );
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.radio, size: 13, color: Color(0xFF2563EB)),
                    const SizedBox(width: 5),
                    Text(
                      'Test QS Tile Audio Trigger',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2563EB),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // 3. Floating Bubble
          _buildCaptureModeTile(
            icon: LucideIcons.disc,
            iconColor: const Color(0xFF059669),
            title: 'Floating Music Bubble (Overlay)',
            badgeText: 'REEL / TIKTOK ASSISTANT',
            badgeColor: const Color(0xFF059669),
            description: 'A draggable floating purple bubble over TikTok & Instagram videos for 1-tap music fingerprinting.',
            value: _enableFloatingBubble,
            onChanged: (val) {
              setState(() => _enableFloatingBubble = val);
              if (val) {
                FloatingBubbleManager.show();
              } else {
                FloatingBubbleManager.hide();
              }
            },
            actionButton: Row(
              children: [
                InkWell(
                  onTap: () {
                    if (!_enableFloatingBubble) {
                      setState(() => _enableFloatingBubble = true);
                    }
                    FloatingBubbleManager.show();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Row(
                          children: [
                            const Icon(LucideIcons.sparkles, color: Colors.white, size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Floating Music Bubble active on screen! Drag it anywhere or tap it to fingerprint.',
                                style: GoogleFonts.inter(fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        backgroundColor: const Color(0xFF7C3AED),
                        behavior: SnackBarBehavior.floating,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF059669).withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.disc, size: 13, color: Color(0xFF059669)),
                        const SizedBox(width: 5),
                        Text(
                          'Spawn Floating Bubble',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (_enableFloatingBubble) ...[
                  const SizedBox(width: 10),
                  InkWell(
                    onTap: () {
                      FloatingBubbleManager.hide();
                      setState(() => _enableFloatingBubble = false);
                    },
                    child: Text(
                      'Dismiss Bubble',
                      style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted, decoration: TextDecoration.underline),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCaptureModeTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String badgeText,
    required Color badgeColor,
    required String description,
    required bool value,
    required ValueChanged<bool> onChanged,
    Widget? actionButton,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: value ? iconColor.withValues(alpha: 0.35) : AppTheme.borderSubtle,
          width: value ? 1.2 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 17, color: iconColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: badgeColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            badgeText,
                            style: GoogleFonts.inter(
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              color: badgeColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Transform.scale(
                scale: 0.85,
                child: Switch(
                  value: value,
                  activeColor: iconColor,
                  activeTrackColor: iconColor.withValues(alpha: 0.35),
                  onChanged: onChanged,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.only(left: 44.0),
            child: Text(
              description,
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted, height: 1.35),
            ),
          ),
          if (actionButton != null) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.only(left: 44.0),
              child: actionButton,
            ),
          ],
        ],
      ),
    );
  }

  // ===========================================================================
  // SECTION 1: CONFIRMATION MODES
  // ===========================================================================
  Widget _buildConfirmationModeSection() {
    return _buildCardWrapper(
      icon: LucideIcons.zap,
      iconColor: const Color(0xFFD97706),
      iconBg: const Color(0xFFFEF3C7),
      title: 'Clipper Save Confirmation Modes',
      tag: 'SPEED & PROMPT',
      description: 'Control whether Clipper saves instantly with zero clicks or prompts you with target options when clipping from web pages and feeds.',
      child: Column(
        children: [
          _buildModeOption(
            mode: ConfirmationMode.auto,
            title: '⚡ Auto Mode',
            description: 'Saves immediately to destination with no prompt. Instant background sync with brief toast.',
            tagText: 'FASTEST 1-CLICK',
            tagColor: const Color(0xFFD97706),
          ),
          const SizedBox(height: 8),
          _buildModeOption(
            mode: ConfirmationMode.confirm,
            title: '👆 Confirm Mode',
            description: 'Displays pre-selected destination bar before saving, requiring a single tap to confirm.',
            tagText: 'RECOMMENDED',
            tagColor: const Color(0xFF059669),
          ),
          const SizedBox(height: 8),
          _buildModeOption(
            mode: ConfirmationMode.alwaysAsk,
            title: '📋 Always Ask',
            description: 'Always pops up the full destination & sub-tab picker on every single clip action.',
            tagText: 'FULL CONTROL',
            tagColor: const Color(0xFF2563EB),
          ),
        ],
      ),
    );
  }

  Widget _buildModeOption({
    required ConfirmationMode mode,
    required String title,
    required String description,
    required String tagText,
    required Color tagColor,
  }) {
    final isSelected = _confirmationMode == mode;
    return GestureDetector(
      onTap: () => setState(() => _confirmationMode = mode),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? tagColor.withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? tagColor : AppTheme.borderSubtle,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: Radio<ConfirmationMode>(
                value: mode,
                groupValue: _confirmationMode,
                activeColor: tagColor,
                onChanged: (val) {
                  if (val != null) setState(() => _confirmationMode = val);
                },
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: tagColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          tagText,
                          style: GoogleFonts.inter(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: tagColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted, height: 1.3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // SECTION 2: UNIVERSAL GLOBAL DEFAULT DESTINATION
  // ===========================================================================
  Widget _buildDefaultDestinationSection() {
    final validDests = _destinations
        .where((d) => d.type != 'spotify' && d.type != 'youtube_music')
        .toList();

    if (validDests.isEmpty) {
      return _buildCardWrapper(
        icon: LucideIcons.radio,
        iconColor: const Color(0xFF2D6A4F),
        iconBg: const Color(0xFFDCFCE7),
        title: 'Universal Global Default Destination',
        tag: 'DESTINATIONS',
        description: 'The overarching destination for any web clip, blog post, article, or bookmark.',
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          child: Center(
            child: Column(
              children: [
                const Icon(LucideIcons.unlink, size: 28, color: AppTheme.inactiveGrey),
                const SizedBox(height: 8),
                Text(
                  'No connected destinations found',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Connect Google Sheets, Notion, or Vault from the web dashboard.',
                  style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return _buildCardWrapper(
      icon: LucideIcons.radio,
      iconColor: const Color(0xFF2D6A4F),
      iconBg: const Color(0xFFDCFCE7),
      title: 'Universal Global Default Destination',
      tag: 'DEFAULT DESTINATION',
      description: 'The overarching fallback destination for any web clip, blog post, article, or bookmark that does not have a specialized category rule.',
      child: Column(
        children: validDests.map((dest) {
          final isSelected = _defaultDestId == dest.id;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: GestureDetector(
              onTap: () => setState(() => _defaultDestId = dest.id),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFDCFCE7).withValues(alpha: 0.3) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF2D6A4F) : AppTheme.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  children: [
                    Radio<String>(
                      value: dest.id,
                      groupValue: _defaultDestId,
                      activeColor: const Color(0xFF2D6A4F),
                      onChanged: (val) {
                        if (val != null) setState(() => _defaultDestId = val);
                      },
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 6,
                            runSpacing: 2,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                dest.name,
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              if (dest.id == _defaultDestId)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'DEFAULT',
                                    style: GoogleFonts.inter(
                                      fontSize: 8,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF16A34A),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          Text(
                            dest.targetResource,
                            style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: dest.isConnected
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        dest.isConnected ? 'Connected' : 'Offline',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: dest.isConnected ? const Color(0xFF16A34A) : AppTheme.inactiveGrey,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ===========================================================================
  // SECTION 3: SMART PER-CATEGORY ROUTING
  // ===========================================================================
  Widget _buildCategoryRoutingSection() {
    final categories = [
      {
        'key': 'article',
        'title': 'Articles & Blog Posts',
        'desc': 'Deep-dive articles, Substack essays, tech write-ups',
        'icon': LucideIcons.bookOpen,
      },
      {
        'key': 'job',
        'title': 'Jobs & Career Opportunities',
        'desc': 'Role openings, ATS links, Workday listings',
        'icon': LucideIcons.briefcase,
      },
      {
        'key': 'tool',
        'title': 'Tools & GitHub Repositories',
        'desc': 'Open-source libraries, SaaS tools, developer frameworks',
        'icon': LucideIcons.folderGit2,
      },
      {
        'key': 'scholarship',
        'title': 'Scholarships & Education',
        'desc': 'Grants, university fellowships, student hackathons',
        'icon': LucideIcons.graduationCap,
      },
      {
        'key': 'event',
        'title': 'Events & Conferences',
        'desc': 'Meetups, tech summits, webinars, tickets',
        'icon': LucideIcons.calendar,
      },
      {
        'key': 'recipe',
        'title': 'Recipes & Food',
        'desc': 'Cooking guides, ingredient lists, prep times',
        'icon': LucideIcons.utensils,
      },
    ];

    final validDests = _destinations
        .where((d) => d.type != 'spotify' && d.type != 'youtube_music')
        .toList();

    if (validDests.isEmpty) {
      return _buildCardWrapper(
        icon: LucideIcons.slidersHorizontal,
        iconColor: const Color(0xFF2563EB),
        iconBg: const Color(0xFFDBEAFE),
        title: 'Smart Per-Category Destination Routing',
        tag: 'AUTO-DISPATCH',
        description: 'Route specific types of content to different tools automatically.',
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16.0),
          child: Center(
            child: Column(
              children: [
                const Icon(LucideIcons.unlink, size: 28, color: AppTheme.inactiveGrey),
                const SizedBox(height: 8),
                Text(
                  'No connected destinations available',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Connect Google Sheets, Notion, or Vault to configure category routing.',
                  style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final defaultDestName = _destinations.isNotEmpty
        ? _destinations.firstWhere((d) => d.id == _defaultDestId, orElse: () => _destinations.first).name
        : 'None';

    return _buildCardWrapper(
      icon: LucideIcons.slidersHorizontal,
      iconColor: const Color(0xFF2563EB),
      iconBg: const Color(0xFFDBEAFE),
      title: 'Smart Per-Category Destination Routing',
      tag: 'AUTO-DISPATCH',
      description: 'Route specific types of content to different tools automatically. If set to "Universal Global Default", clips save into your fallback destination.',
      child: Column(
        children: categories.map((cat) {
          final key = cat['key'] as String;
          final title = cat['title'] as String;
          final desc = cat['desc'] as String;
          final icon = cat['icon'] as IconData;
          final rawValue = _categoryRules[key] ?? '';
          // If backend returned 'default' or a destination that no longer exists, normalize to ''
          final currentValue = (rawValue == 'default' || !validDests.any((d) => d.id == rawValue))
              ? ''
              : rawValue;

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 15, color: const Color(0xFF2D6A4F)),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderSubtle),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: currentValue,
                      isExpanded: true,
                      icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppTheme.textMuted),
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary),
                      items: [
                        DropdownMenuItem<String>(
                          value: '',
                          child: Text(
                            '🌐 Universal Global Default ($defaultDestName)',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        ...validDests.map((d) => DropdownMenuItem<String>(
                              value: d.id,
                              child: Text(
                                '${d.name} (${d.targetResource})',
                                style: GoogleFonts.inter(fontSize: 11),
                                overflow: TextOverflow.ellipsis,
                              ),
                            )),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _categoryRules[key] = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // ===========================================================================
  // SECTION 4: DEDICATED MUSIC & STREAMING HUB
  // ===========================================================================
  Widget _buildMusicSection() {
    return _buildCardWrapper(
      icon: LucideIcons.music,
      iconColor: const Color(0xFF059669),
      iconBg: const Color(0xFFD1FAE5),
      title: 'Dedicated Music & Streaming Destination',
      tag: 'LIVE SPOTIFY API',
      description: 'Music tracks, Spotify embeds, SoundCloud links, and YouTube Music songs are never mixed with documents. They are automatically routed into your connected music service.',
      headerTrailing: GestureDetector(
        onTap: _loadSpotifyPlaylists,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _loadingPlaylists
                  ? const SizedBox(
                      width: 10,
                      height: 10,
                      child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF059669)),
                    )
                  : const Icon(LucideIcons.refreshCw, size: 11, color: Color(0xFF059669)),
              const SizedBox(width: 4),
              Text(
                'Refresh',
                style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textPrimary, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Provider Selection Toggle
          Text(
            'PRIMARY MUSIC SERVICE',
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => _showProviderSwitchConfirmation('spotify'),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _musicProvider == 'spotify'
                          ? const Color(0xFFD1FAE5)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _musicProvider == 'spotify'
                            ? const Color(0xFF059669)
                            : AppTheme.borderSubtle,
                        width: _musicProvider == 'spotify' ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.music2, size: 16, color: Color(0xFF059669)),
                        const SizedBox(width: 6),
                        Text(
                          'Spotify',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _musicProvider == 'spotify'
                                ? const Color(0xFF065F46)
                                : AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: GestureDetector(
                  onTap: () => _showProviderSwitchConfirmation('youtube_music'),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _musicProvider == 'youtube_music'
                          ? const Color(0xFFFEE2E2)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _musicProvider == 'youtube_music'
                            ? const Color(0xFFDC2626)
                            : AppTheme.borderSubtle,
                        width: _musicProvider == 'youtube_music' ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.circlePlay, size: 16, color: Color(0xFFDC2626)),
                        const SizedBox(width: 6),
                        Text(
                          'YouTube Music',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _musicProvider == 'youtube_music'
                                ? const Color(0xFF991B1B)
                                : AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Spotify Connect & API Keys Bar
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: _handleConnectSpotifyOAuth,
                  icon: const Icon(LucideIcons.zap, size: 14, color: Colors.white),
                  label: Text(
                    'Connect Spotify',
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.borderSubtle),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                onPressed: () => setState(() => _showApiKeys = !_showApiKeys),
                icon: const Icon(LucideIcons.key, size: 14, color: AppTheme.textMuted),
                label: Text(
                  _showApiKeys ? 'Hide Keys' : 'API Keys',
                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textPrimary),
                ),
              ),
            ],
          ),

          // Expandable Spotify API Keys Panel
          if (_showApiKeys) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Spotify Developer Credentials:',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text('SPOTIFY_CLIENT_ID:', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _spotifyClientIdController,
                    style: GoogleFonts.inter(fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Enter Spotify Client ID...',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppTheme.borderSubtle),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('SPOTIFY_CLIENT_SECRET:', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _spotifyClientSecretController,
                    obscureText: true,
                    style: GoogleFonts.inter(fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Enter Spotify Client Secret...',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppTheme.borderSubtle),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),

          // Target Playlist Dropdown + New Playlist Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TARGET PLAYLIST',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
              ),
              GestureDetector(
                onTap: _showCreatePlaylistDialog,
                child: Row(
                  children: [
                    const Icon(LucideIcons.plus, size: 12, color: Color(0xFF059669)),
                    const SizedBox(width: 2),
                    Text(
                      'New Playlist',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: ['default', 'liked', ..._spotifyPlaylists.map((p) => p.id)].contains(_musicPlaylist)
                    ? _musicPlaylist
                    : 'default',
                isExpanded: true,
                icon: const Icon(LucideIcons.chevronDown, size: 16, color: AppTheme.textMuted),
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary),
                items: [
                  DropdownMenuItem<String>(
                    value: 'default',
                    child: Text('🎧 Clipper Tracks (Default Playlist)', style: GoogleFonts.inter(fontSize: 11)),
                  ),
                  DropdownMenuItem<String>(
                    value: 'liked',
                    child: Text('❤️ Liked Songs / Favorites', style: GoogleFonts.inter(fontSize: 11)),
                  ),
                  ..._spotifyPlaylists
                      .where((p) => p.id != 'default' && p.id != 'liked')
                      .map((p) => DropdownMenuItem<String>(
                            value: p.id,
                            child: Text(
                              '🎵 ${p.name} (${p.totalTracks} tracks)',
                              style: GoogleFonts.inter(fontSize: 11),
                            ),
                          )),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _musicPlaylist = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 14),

          // 1-Tap Instant Save Checkbox
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                Checkbox(
                  value: _musicAutoAdd,
                  activeColor: const Color(0xFF059669),
                  onChanged: (val) {
                    if (val != null) setState(() => _musicAutoAdd = val);
                  },
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '1-Tap Instant Save to Default Playlist',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'Directly adds songs without prompting for playlist choice every time.',
                        style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Interactive Spotify Live Track Search & Quick Add Test Box
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFD1FAE5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(LucideIcons.search, size: 14, color: Color(0xFF059669)),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              'Test Search & Add Song to Spotify',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Live catalog search',
                      style: GoogleFonts.inter(fontSize: 9, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _songSearchController,
                        style: GoogleFonts.inter(fontSize: 12),
                        onSubmitted: (val) => _searchSpotify(val),
                        decoration: InputDecoration(
                          hintText: 'Search Starboy, Interstellar, Queen...',
                          hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 11),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: AppTheme.borderSubtle),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onPressed: _isSearching
                          ? null
                          : () => _searchSpotify(_songSearchController.text),
                      child: _isSearching
                          ? const SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5),
                            )
                          : Text('Search', style: GoogleFonts.inter(fontSize: 11, color: Colors.white)),
                    ),
                  ],
                ),

                // Search Results
                if (_searchResults.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Found ${_searchResults.length} matches:',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 6),
                  ..._searchResults.map((track) {
                    final isAdding = _addingTrackId == track.id;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: const Color(0xFFD1FAE5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: track.albumArt.isNotEmpty
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: Image.network(
                                      track.albumArt,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(
                                        LucideIcons.music,
                                        size: 16,
                                        color: Color(0xFF059669),
                                      ),
                                    ),
                                  )
                                : const Icon(LucideIcons.music, size: 16, color: Color(0xFF059669)),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  track.name,
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  track.artists,
                                  style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (track.externalUrl.isNotEmpty)
                            IconButton(
                              icon: const Icon(LucideIcons.externalLink, size: 14, color: AppTheme.textMuted),
                              onPressed: () async {
                                final uri = Uri.parse(track.externalUrl);
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                              splashRadius: 16,
                            ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF059669),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: Size.zero,
                            ),
                            onPressed: isAdding ? null : () => _addTrackToPlaylist(track),
                            child: isAdding
                                ? const SizedBox(
                                    width: 10,
                                    height: 10,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5),
                                  )
                                : Text(
                                    '+ Add',
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // SECTION 5: LOCAL PRIVACY STORAGE MODE
  // ===========================================================================
  Widget _buildPrivacyModeSection() {
    return _buildCardWrapper(
      icon: LucideIcons.shieldCheck,
      iconColor: const Color(0xFFD97706),
      iconBg: const Color(0xFFFEF3C7),
      title: 'Local Privacy Storage Mode (On-Device Vault)',
      tag: '100% PRIVATE & OFFLINE',
      description: 'When enabled, all web clips, notes, and bookmarks are stored exclusively on your device local storage. Zero network payloads sent to external servers.',
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.hardDrive, size: 16, color: Color(0xFFD97706)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Enable On-Device Local Privacy Storage',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  Text(
                    'Store clips in local device database only. No cloud sync transmission.',
                    style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            Switch(
              value: _isPrivacyMode,
              activeColor: const Color(0xFFD97706),
              activeTrackColor: const Color(0xFFFDE68A),
              onChanged: (val) => setState(() => _isPrivacyMode = val),
            ),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // SECTION 6: AI EXTRACTION PROMPT RULES
  // ===========================================================================
  Widget _buildAiPromptSection() {
    return _buildCardWrapper(
      icon: LucideIcons.sparkles,
      iconColor: const Color(0xFF8B5CF6),
      iconBg: const Color(0xFFEDE9FE),
      title: 'AI Extraction Prompt Rules',
      tag: 'GEMINI AI PARSER',
      description: 'Customize instructions passed to Gemini AI when parsing scraped webpage content into structured fields (salary, deadline, company, role).',
      headerTrailing: TextButton(
        onPressed: () {
          setState(() {
            _aiPromptController.text =
                "Extract job title, company name, salary range, application deadline, and key responsibilities into JSON.";
          });
        },
        child: Text(
          'Reset Default',
          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF8B5CF6), fontWeight: FontWeight.bold),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _aiPromptController,
            maxLines: 3,
            style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary, height: 1.4),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // REUSABLE CARD CONTAINER
  // ===========================================================================
  Widget _buildCardWrapper({
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String title,
    required String tag,
    required String description,
    required Widget child,
    Widget? headerTrailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(icon, size: 16, color: iconColor),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              if (headerTrailing != null)
                headerTrailing
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tag,
                    style: GoogleFonts.inter(
                      fontSize: 8.5,
                      fontWeight: FontWeight.bold,
                      color: iconColor,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted, height: 1.3),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
