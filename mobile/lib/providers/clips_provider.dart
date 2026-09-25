import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/intent_helper.dart';
import '../models/clip_model.dart';
import '../services/api_service.dart';

class ClipsProvider extends ChangeNotifier {
  List<ClipModel> _clips = [];
  bool _isLoading = false;
  String _selectedCategory = 'All';
  String _searchQuery = '';

  // Web Parity States
  String _selectedIntent = 'all';
  String _viewMode = 'cards'; // 'cards' | 'list' | 'grid'
  String _sortBy = 'newest'; // 'newest' | 'oldest' | 'title' | 'deadline'
  String _groupBy = 'none'; // 'none' | 'intent' | 'domain' | 'date'
  bool _favoritesOnly = false;
  String _selectedStatus = 'all'; // 'all' | 'synced' | 'pending'
  String _selectedDestination = 'all';
  final Set<String> _favoriteIds = {};

  // Batch Selection Mode
  bool _isBatchMode = false;
  final Set<String> _selectedIds = {};

  ClipsProvider() {
    _loadLocalPreferences();
  }

  Future<void> _loadLocalPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _viewMode = prefs.getString('clips_view_mode') ?? 'cards';
      _sortBy = prefs.getString('clips_sort_by') ?? 'newest';
      final favList = prefs.getStringList('clips_favorites') ?? [];
      _favoriteIds.addAll(favList);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _saveLocalFavorites() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('clips_favorites', _favoriteIds.toList());
    } catch (_) {}
  }

  // --- Getters ---

  List<ClipModel> get allClips => _clips;
  int get totalClipsCount => _clips.length;
  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  String get selectedIntent => _selectedIntent;
  String get viewMode => _viewMode;
  String get sortBy => _sortBy;
  String get groupBy => _groupBy;
  bool get favoritesOnly => _favoritesOnly;
  String get selectedStatus => _selectedStatus;
  String get selectedDestination => _selectedDestination;
  bool get isBatchMode => _isBatchMode;
  Set<String> get selectedIds => _selectedIds;

  bool get hasActiveFilters =>
      _selectedIntent != 'all' ||
      _selectedCategory != 'All' ||
      _favoritesOnly ||
      _selectedStatus != 'all' ||
      _selectedDestination != 'all' ||
      _searchQuery.isNotEmpty;

  int get activeFiltersCount {
    int count = 0;
    if (_selectedIntent != 'all') count++;
    if (_selectedCategory != 'All') count++;
    if (_favoritesOnly) count++;
    if (_selectedStatus != 'all') count++;
    if (_selectedDestination != 'all') count++;
    if (_searchQuery.isNotEmpty) count++;
    return count;
  }

  int get savedThisWeekCount {
    final now = DateTime.now();
    final sevenDaysAgo = now.subtract(const Duration(days: 7));
    return _clips.where((c) => c.createdAt.isAfter(sevenDaysAgo)).length;
  }

  /// Filtered, searched, and sorted clips matching Web ClipsPage logic
  List<ClipModel> get clips {
    var result = _clips.where((clip) {
      // 1. Favorites check
      final isFav = _favoriteIds.contains(clip.id) || clip.isFavorite;
      if (_favoritesOnly && !isFav) return false;

      // 2. Intent filter
      if (_selectedIntent != 'all') {
        final detected = ClipIntentHelper.detectIntent(clip);
        if (detected != _selectedIntent) return false;
      }

      // 3. Category filter (backwards compatibility)
      if (_selectedCategory != 'All') {
        final cType = clip.contentType.toLowerCase().replaceAll(RegExp(r's$'), '');
        final selCat = _selectedCategory.toLowerCase().replaceAll(RegExp(r's$'), '');
        final matchesCategory = cType == selCat ||
            clip.contentType.toLowerCase() == _selectedCategory.toLowerCase() ||
            (clip.extraMetadata['category_name']?.toString().toLowerCase().replaceAll(RegExp(r's$'), '') == selCat);
        if (!matchesCategory) return false;
      }

      // 4. Status filter
      if (_selectedStatus != 'all') {
        final isSynced = clip.exportStatus == 'done' || clip.status == 'synced';
        if (_selectedStatus == 'synced' && !isSynced) return false;
        if (_selectedStatus == 'pending' && isSynced) return false;
      }

      // 5. Destination filter
      if (_selectedDestination != 'all') {
        final dests = clip.destinations.map((d) => d.toLowerCase()).toList();
        if (!dests.any((d) => d.contains(_selectedDestination.toLowerCase()))) {
          return false;
        }
      }

      // 6. Search query
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matches = clip.title.toLowerCase().contains(q) ||
            clip.summary.toLowerCase().contains(q) ||
            clip.domain.toLowerCase().contains(q) ||
            clip.sourceAuthor.toLowerCase().contains(q) ||
            clip.tags.any((t) => t.toLowerCase().contains(q));
        if (!matches) return false;
      }

      return true;
    }).toList();

    // Sorting
    result.sort((a, b) {
      if (_sortBy == 'newest') {
        return b.createdAt.compareTo(a.createdAt);
      } else if (_sortBy == 'oldest') {
        return a.createdAt.compareTo(b.createdAt);
      } else if (_sortBy == 'title') {
        return a.title.toLowerCase().compareTo(b.title.toLowerCase());
      } else if (_sortBy == 'deadline') {
        final aDate = a.deadlineDate ?? DateTime(2099);
        final bDate = b.deadlineDate ?? DateTime(2099);
        return aDate.compareTo(bDate);
      }
      return b.createdAt.compareTo(a.createdAt);
    });

    return result;
  }

  /// Count for each intent pill in the toolbar
  int countForIntent(String intent) {
    if (intent == 'all') return _clips.length;
    return _clips.where((c) => ClipIntentHelper.detectIntent(c) == intent).length;
  }

  bool isFavorite(String clipId) {
    return _favoriteIds.contains(clipId);
  }

  String? _error;
  String? get error => _error;

  // --- Actions ---

  Future<void> loadClips() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final fetched = await ApiService.fetchClips();
      if (fetched.isNotEmpty) {
        _clips = fetched;
      } else if (_clips.isEmpty) {
        _clips = _getDefaultSampleClips();
      }
      for (final clip in _clips) {
        if (_favoriteIds.contains(clip.id)) {
          clip.isFavorite = true;
        }
      }
    } catch (e) {
      _error = e.toString();
      if (_clips.isEmpty) {
        _clips = _getDefaultSampleClips();
      }
      if (kDebugMode) print('Error loading clips: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<ClipModel> _getDefaultSampleClips() {
    final now = DateTime.now();
    return [
      ClipModel(
        id: 'clip_1',
        title: 'Senior Frontend Engineer (React & TypeScript) - Remote',
        url: 'https://x.com/tech_careers/status/18219482104921',
        summary: 'High-paying remote Senior Frontend Engineer opportunity focused on modern React 19, TypeScript, and performance.',
        contentType: 'job',
        tags: ['Remote', 'React', 'Frontend', 'TypeScript'],
        sourcePlatform: 'x_twitter',
        sourceAuthor: 'Vercel Ecosystem Labs',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(hours: 2)),
        extraMetadata: {
          'intent': 'apply',
          'company': 'Vercel Ecosystem Labs',
          'salary': '\$140,000 - \$175,000',
          'location': 'Remote (Worldwide)',
          'deadline': '2026-10-15',
          'synced_to': ['google_sheets', 'notion'],
        },
        isFavorite: true,
      ),
      ClipModel(
        id: 'clip_2',
        title: 'Global AI Founders Hackathon 2026 (\$50,000 Cash Prizes)',
        url: 'https://linkedin.com/posts/ai-founders-hub-2026',
        summary: 'Virtual hackathon with \$50,000 cash prizes and investor fast-track opportunities for Gemini and Claude builders.',
        contentType: 'event',
        tags: ['Hackathon', 'AI', 'Prizes', 'YC', 'Virtual'],
        sourcePlatform: 'linkedin',
        sourceAuthor: 'AI Founders Hub',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(hours: 5)),
        extraMetadata: {
          'intent': 'attend',
          'price': 'Free Entry (\$50k Prizes)',
          'event_date': 'Oct 24, 2026',
          'location': 'San Francisco / Online',
          'deadline': '2026-10-20',
          'synced_to': ['google_sheets'],
        },
        isFavorite: true,
      ),
      ClipModel(
        id: 'clip_3',
        title: 'OpenAI Developer Fellowship 2026 - Fully Funded Grant',
        url: 'https://openai.com/careers/fellowship-2026',
        summary: '6-month research fellowship with \$10,000/month stipend and compute allocation from OpenAI research engineers.',
        contentType: 'scholarship',
        tags: ['Fellowship', 'Stipend', 'Research'],
        sourcePlatform: 'web',
        sourceAuthor: 'OpenAI',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(hours: 9)),
        extraMetadata: {
          'intent': 'apply',
          'company': 'OpenAI',
          'salary': '\$10,000 / mo stipend',
          'location': 'San Francisco / Remote',
          'deadline': '2026-10-05',
          'synced_to': ['notion'],
        },
      ),
      ClipModel(
        id: 'clip_4',
        title: 'Attention Is All You Need 2.0: Scaling Transformer Contexts to 10M Tokens',
        url: 'https://arxiv.org/abs/2608.01928',
        summary: 'Sub-quadratic attention architecture supporting 10,000,000 token context windows without accuracy degradation.',
        contentType: 'research',
        tags: ['AI Research', 'Transformers', 'LLM', 'ArXiv'],
        sourcePlatform: 'arxiv',
        sourceAuthor: 'Vaswani et al.',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(hours: 14)),
        extraMetadata: {
          'intent': 'learn',
          'reading_time': '8 min read',
          'rating': '9.8 Impact Score',
          'synced_to': ['notion'],
        },
        isFavorite: true,
      ),
      ClipModel(
        id: 'clip_5',
        title: 'Fast-Inference Local Agent Server in Rust & WebGPU',
        url: 'https://github.com/rust-ai/agent-server',
        summary: 'Ultra-fast local AI agent runner written in Rust with WebGPU acceleration. Sub-10ms token generation for edge devices.',
        contentType: 'project',
        tags: ['Rust', 'WebGPU', 'OpenSource', 'GitHub'],
        sourcePlatform: 'github',
        sourceAuthor: 'rust-ai-org',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(days: 1)),
        extraMetadata: {
          'intent': 'track',
          'stars': '14.2k',
          'version': 'v2.4.0',
          'language': 'Rust',
          'synced_to': ['google_sheets'],
        },
      ),
      ClipModel(
        id: 'clip_6',
        title: 'Building Production Multi-Agent Workflows from Scratch',
        url: 'https://youtube.com/watch?v=agent-arch-2026',
        summary: 'Deep architectural walkthrough explaining planner-executor loops, error recovery strategies, and tool invocation patterns.',
        contentType: 'video',
        tags: ['Agents', 'Architecture', 'AI', 'YouTube'],
        sourcePlatform: 'youtube',
        sourceAuthor: 'Andrej Karpathy',
        status: 'done',
        exportStatus: 'pending',
        createdAt: now.subtract(const Duration(days: 1, hours: 4)),
        extraMetadata: {
          'intent': 'learn',
          'duration': '18 min video',
          'reading_time': '18 min',
        },
      ),
      ClipModel(
        id: 'clip_7',
        title: 'Notion AI + Database Lifetime Pro Workspace Bundle',
        url: 'https://notion.so/pricing/pro-bundle-2026',
        summary: 'Special developer discount providing lifetime database synchronization and automated prompt synthesis.',
        contentType: 'deal',
        tags: ['Productivity', 'Notion', 'Software', 'Discount'],
        sourcePlatform: 'web',
        sourceAuthor: 'Notion',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(days: 2)),
        extraMetadata: {
          'intent': 'buy',
          'price': '\$49.00',
          'discount': '30% OFF',
        },
      ),
      ClipModel(
        id: 'clip_8',
        title: 'Staff ML Infrastructure Engineer — Candidate Recommendations',
        url: 'https://linkedin.com/in/marcus-chen-ml-infra',
        summary: 'Ex-Stripe Staff Platform Lead. Specialized in large-scale model inference, Kubernetes GPU scheduling, and high-throughput vector store architectures.',
        contentType: 'job',
        tags: ['Hire', 'Candidate', 'ML Infra', 'Staff Engineer'],
        sourcePlatform: 'linkedin',
        sourceAuthor: 'Marcus Chen',
        status: 'done',
        exportStatus: 'done',
        createdAt: now.subtract(const Duration(days: 2, hours: 6)),
        extraMetadata: {
          'intent': 'hire',
          'role': 'Staff Infrastructure',
          'company': 'Ex-Stripe',
          'location': 'San Francisco, CA',
        },
      ),
    ];
  }

  void setIntent(String intent) {
    _selectedIntent = intent;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setViewMode(String mode) {
    _viewMode = mode;
    notifyListeners();
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('clips_view_mode', mode);
    });
  }

  void setSortBy(String sort) {
    _sortBy = sort;
    notifyListeners();
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('clips_sort_by', sort);
    });
  }

  void setGroupBy(String group) {
    _groupBy = group;
    notifyListeners();
  }

  void setFavoritesOnly(bool fav) {
    _favoritesOnly = fav;
    notifyListeners();
  }

  void setFilterStatus(String status) {
    _selectedStatus = status;
    notifyListeners();
  }

  void setFilterDestination(String destination) {
    _selectedDestination = destination;
    notifyListeners();
  }

  void resetFilters() {
    _selectedIntent = 'all';
    _selectedCategory = 'All';
    _favoritesOnly = false;
    _selectedStatus = 'all';
    _selectedDestination = 'all';
    _searchQuery = '';
    notifyListeners();
  }

  void toggleFavorite(String clipId) {
    if (_favoriteIds.contains(clipId)) {
      _favoriteIds.remove(clipId);
    } else {
      _favoriteIds.add(clipId);
    }
    for (final c in _clips) {
      if (c.id == clipId) {
        c.isFavorite = _favoriteIds.contains(clipId);
      }
    }
    _saveLocalFavorites();
    notifyListeners();
  }

  // --- Batch Operations ---

  void enterBatchMode(String? initialId) {
    _isBatchMode = true;
    _selectedIds.clear();
    if (initialId != null) {
      _selectedIds.add(initialId);
    }
    notifyListeners();
  }

  void exitBatchMode() {
    _isBatchMode = false;
    _selectedIds.clear();
    notifyListeners();
  }

  void toggleSelection(String id) {
    if (_selectedIds.contains(id)) {
      _selectedIds.remove(id);
      if (_selectedIds.isEmpty) {
        _isBatchMode = false;
      }
    } else {
      _selectedIds.add(id);
    }
    notifyListeners();
  }

  void selectAll() {
    _selectedIds.clear();
    _selectedIds.addAll(clips.map((c) => c.id));
    notifyListeners();
  }

  bool get areAllSelectedStarred {
    if (_selectedIds.isEmpty) return false;
    return _selectedIds.every((id) => _favoriteIds.contains(id));
  }

  void toggleStarSelectedClips() {
    if (_selectedIds.isEmpty) return;
    final allStarred = areAllSelectedStarred;
    if (allStarred) {
      for (final id in _selectedIds) {
        _favoriteIds.remove(id);
        for (final c in _clips) {
          if (c.id == id) c.isFavorite = false;
        }
      }
    } else {
      for (final id in _selectedIds) {
        _favoriteIds.add(id);
        for (final c in _clips) {
          if (c.id == id) c.isFavorite = true;
        }
      }
    }
    _saveLocalFavorites();
    notifyListeners();
  }

  void deselectAll() {
    _selectedIds.clear();
    notifyListeners();
  }

  Future<int> pushSelectedClipsToDestination(String destinationId) async {
    int syncedCount = 0;
    for (final id in _selectedIds) {
      final index = _clips.indexWhere((c) => c.id == id);
      if (index != -1) {
        final clip = _clips[index];
        final currentDests = List<String>.from(clip.destinations);
        if (!currentDests.contains(destinationId)) {
          currentDests.add(destinationId);
        }
        final updatedMeta = Map<String, dynamic>.from(clip.extraMetadata);
        updatedMeta['synced_to'] = currentDests;
        _clips[index] = clip.copyWith(
          exportStatus: 'done',
          status: 'synced',
          extraMetadata: updatedMeta,
        );
        syncedCount++;
      }
    }
    notifyListeners();
    return syncedCount;
  }

  String exportSelectedClipsMarkdown() {
    final selectedClips = _clips.where((c) => _selectedIds.contains(c.id)).toList();
    final buffer = StringBuffer();
    buffer.writeln('# Exported Clips (${selectedClips.length})');
    buffer.writeln();
    for (final clip in selectedClips) {
      buffer.writeln('### [${clip.title}](${clip.url})');
      if (clip.summary.isNotEmpty) {
        buffer.writeln('> ${clip.summary}');
      }
      buffer.writeln('- **Domain:** ${clip.domain}');
      buffer.writeln('- **Date:** ${clip.createdAt.toIso8601String().substring(0, 10)}');
      if (clip.tags.isNotEmpty) {
        buffer.writeln('- **Tags:** ${clip.tags.map((t) => '#$t').join(' ')}');
      }
      buffer.writeln();
    }
    return buffer.toString();
  }

  String exportSelectedClipsJson() {
    final selectedClips = _clips.where((c) => _selectedIds.contains(c.id)).toList();
    final jsonList = selectedClips.map((c) => c.toJson()).toList();
    return jsonEncode(jsonList);
  }

  void deleteClip(String clipId) {
    _clips.removeWhere((c) => c.id == clipId);
    _favoriteIds.remove(clipId);
    _selectedIds.remove(clipId);
    notifyListeners();
  }

  void deleteSelectedClips() {
    _clips.removeWhere((c) => _selectedIds.contains(c.id));
    for (final id in _selectedIds) {
      _favoriteIds.remove(id);
    }
    exitBatchMode();
  }

  Future<bool> createClip(String url, {String? selectedText, String? destinationId}) async {
    final res = await createClipDetailed(url, selectedText: selectedText, destinationId: destinationId);
    return res.ok;
  }

  // --- Extension-parity state: destinations + detailed save ---

  List<SaveDestination> _destinations = [];
  String _selectedDestinationId = '';
  bool _destinationsLoading = false;

  List<SaveDestination> get destinations => _destinations;
  String get selectedDestinationId => _selectedDestinationId;
  bool get destinationsLoading => _destinationsLoading;

  Future<void> loadDestinations() async {
    _destinationsLoading = true;
    notifyListeners();
    try {
      _destinations = await ApiService.getDestinations();
      SaveDestination? def;
      for (final d in _destinations) {
        if (d.isDefault) {
          def = d;
          break;
        }
      }
      final lastId = await ApiService.getLastDestinationId();
      SaveDestination? lastMatch;
      for (final d in _destinations) {
        if (d.id == lastId) {
          lastMatch = d;
          break;
        }
      }
      _selectedDestinationId =
          def?.id ?? lastMatch?.id ?? (_destinations.isNotEmpty ? _destinations.first.id : '');
    } catch (_) {
      _destinations = [];
    } finally {
      _destinationsLoading = false;
      notifyListeners();
    }
  }

  void setDestination(String id) {
    _selectedDestinationId = id;
    notifyListeners();
  }

  Future<SaveResult> createClipDetailed(
    String url, {
    String? selectedText,
    String? destinationId,
    String? note,
    List<String>? tags,
    String? deadline,
    String? tableId,
    String? tableName,
  }) async {
    final res = await ApiService.saveClipDetailed(
      url: url,
      selectedText: selectedText,
      destinationId: destinationId ?? (_selectedDestinationId.isEmpty ? null : _selectedDestinationId),
      note: note,
      tags: tags,
      deadline: deadline,
      tableId: tableId,
      tableName: tableName,
    );
    if (res.ok) {
      await loadClips();
    }
    return res;
  }
}
