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

  // Parallel Multi-Dimensional Filters
  String _selectedContentType = 'all';
  String _selectedSource = 'all';
  String _selectedDeadlineFilter = 'all'; // 'all' | 'has_deadline' | 'this_week' | 'overdue' | 'upcoming'
  String _selectedCustomTag = 'all';

  // User Custom Taxonomies (persisted in SharedPreferences)
  List<String> _customIntents = [];
  List<String> _customContentTypes = [];
  List<String> _customTags = [];
  List<String> _customSources = [];

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
      _customIntents = prefs.getStringList('clips_custom_intents') ?? [];
      _customContentTypes = prefs.getStringList('clips_custom_content_types') ?? [];
      _customTags = prefs.getStringList('clips_custom_tags') ?? [];
      _customSources = prefs.getStringList('clips_custom_sources') ?? [];
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
  String get selectedContentType => _selectedContentType;
  String get selectedSource => _selectedSource;
  String get selectedDeadlineFilter => _selectedDeadlineFilter;
  String get selectedCustomTag => _selectedCustomTag;
  List<String> get customIntents => _customIntents;
  List<String> get customContentTypes => _customContentTypes;
  List<String> get customTags => _customTags;
  List<String> get customSources => _customSources;

  List<String> get allUniqueTags {
    final set = <String>{..._customTags};
    for (final c in _clips) {
      for (final t in c.tags) {
        final clean = t.trim().toLowerCase().replaceAll('#', '');
        if (clean.isNotEmpty) set.add(clean);
      }
    }
    final list = set.toList();
    list.sort();
    return list;
  }

  int countForTag(String tag) {
    if (tag == 'all') return _clips.length;
    final t = tag.toLowerCase().replaceAll('#', '');
    return _clips.where((c) => c.tags.any((item) => item.toLowerCase().replaceAll('#', '') == t)).length;
  }
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
      _selectedContentType != 'all' ||
      _selectedSource != 'all' ||
      _selectedDeadlineFilter != 'all' ||
      _selectedCustomTag != 'all' ||
      _selectedCategory != 'All' ||
      _favoritesOnly ||
      _selectedStatus != 'all' ||
      _selectedDestination != 'all' ||
      _searchQuery.isNotEmpty;

  int get activeFiltersCount {
    int count = 0;
    if (_selectedIntent != 'all') count++;
    if (_selectedContentType != 'all') count++;
    if (_selectedSource != 'all') count++;
    if (_selectedDeadlineFilter != 'all') count++;
    if (_selectedCustomTag != 'all') count++;
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

  /// Parallel Filtered, searched, and sorted clips
  List<ClipModel> get clips {
    var result = _clips.where((clip) {
      // 1. Favorites check
      final isFav = _favoriteIds.contains(clip.id) || clip.isFavorite;
      if (_favoritesOnly && !isFav) return false;

      // 2. Parallel Intent filter (built-in or custom)
      if (_selectedIntent != 'all') {
        final detected = ClipIntentHelper.detectIntent(clip).toLowerCase();
        final rawIntent = clip.intent.toLowerCase();
        final target = _selectedIntent.toLowerCase();
        final matches = detected == target ||
            rawIntent == target ||
            clip.tags.any((t) => t.toLowerCase() == target) ||
            clip.title.toLowerCase().contains(target) ||
            clip.summary.toLowerCase().contains(target);
        if (!matches) return false;
      }

      // 3. Parallel Content Type filter (built-in or custom)
      if (_selectedContentType != 'all') {
        final targetType = _selectedContentType.toLowerCase();
        final cType = clip.contentType.toLowerCase();
        final extType = (clip.extraMetadata['content_type'] ?? '').toString().toLowerCase();
        final matches = cType == targetType ||
            cType.contains(targetType) ||
            extType == targetType ||
            clip.tags.any((t) => t.toLowerCase() == targetType) ||
            (targetType == 'video' && (clip.url.contains('youtube.com') || clip.url.contains('youtu.be') || clip.url.contains('tiktok.com') || clip.url.contains('vimeo.com'))) ||
            (targetType == 'audio' && (clip.url.contains('spotify.com') || clip.url.contains('soundcloud.com'))) ||
            (targetType == 'code' && (clip.url.contains('github.com') || clip.url.contains('gitlab.com'))) ||
            (targetType == 'job' && (clip.url.contains('greenhouse.io') || clip.url.contains('lever.co') || clip.url.contains('/jobs') || clip.url.contains('/careers') || clip.tags.contains('job')));
        if (!matches) return false;
      }

      // 4. Parallel Source / Platform filter
      if (_selectedSource != 'all') {
        final targetSrc = _selectedSource.toLowerCase();
        final platform = clip.sourcePlatform.toLowerCase();
        final domain = clip.domain.toLowerCase();
        final url = clip.url.toLowerCase();
        final matches = platform == targetSrc ||
            platform.contains(targetSrc) ||
            domain.contains(targetSrc) ||
            url.contains(targetSrc);
        if (!matches) return false;
      }

      // 5. Parallel Deadline filter
      if (_selectedDeadlineFilter != 'all') {
        final d = clip.deadlineDate;
        if (d == null) return false;
        final now = DateTime.now();
        if (_selectedDeadlineFilter == 'has_deadline') {
          // any deadline present
        } else if (_selectedDeadlineFilter == 'this_week') {
          final nextWeek = now.add(const Duration(days: 7));
          if (d.isBefore(now) || d.isAfter(nextWeek)) return false;
        } else if (_selectedDeadlineFilter == 'overdue') {
          if (!d.isBefore(now)) return false;
        } else if (_selectedDeadlineFilter == 'upcoming') {
          if (!d.isAfter(now)) return false;
        }
      }

      // 6. Parallel Custom Tag filter
      if (_selectedCustomTag != 'all') {
        final targetTag = _selectedCustomTag.toLowerCase();
        final matches = clip.tags.any((t) => t.toLowerCase() == targetTag || t.toLowerCase().contains(targetTag));
        if (!matches) return false;
      }

      // 7. Category filter (backwards compatibility)
      if (_selectedCategory != 'All') {
        final cType = clip.contentType.toLowerCase().replaceAll(RegExp(r's$'), '');
        final selCat = _selectedCategory.toLowerCase().replaceAll(RegExp(r's$'), '');
        final matchesCategory = cType == selCat ||
            clip.contentType.toLowerCase() == _selectedCategory.toLowerCase() ||
            (clip.extraMetadata['category_name']?.toString().toLowerCase().replaceAll(RegExp(r's$'), '') == selCat);
        if (!matchesCategory) return false;
      }

      // 8. Status filter
      if (_selectedStatus != 'all') {
        final isSynced = clip.exportStatus == 'done' || clip.status == 'synced';
        if (_selectedStatus == 'synced' && !isSynced) return false;
        if (_selectedStatus == 'pending' && isSynced) return false;
      }

      // 9. Destination filter
      if (_selectedDestination != 'all') {
        final dests = clip.destinations.map((d) => d.toLowerCase()).toList();
        if (!dests.any((d) => d.contains(_selectedDestination.toLowerCase()))) {
          return false;
        }
      }

      // 10. Search query
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

  /// Count for each intent pill in the toolbar (supports custom intents)
  int countForIntent(String intent) {
    if (intent == 'all') return _clips.length;
    final t = intent.toLowerCase();
    return _clips.where((c) {
      return ClipIntentHelper.detectIntent(c).toLowerCase() == t ||
          c.intent.toLowerCase() == t ||
          c.tags.any((tag) => tag.toLowerCase() == t) ||
          c.title.toLowerCase().contains(t);
    }).length;
  }

  int countForContentType(String type) {
    if (type == 'all') return _clips.length;
    final t = type.toLowerCase();
    return _clips.where((clip) {
      final cType = clip.contentType.toLowerCase();
      final extType = (clip.extraMetadata['content_type'] ?? '').toString().toLowerCase();
      return cType == t ||
          cType.contains(t) ||
          extType == t ||
          clip.tags.any((tag) => tag.toLowerCase() == t) ||
          (t == 'video' && (clip.url.contains('youtube.com') || clip.url.contains('youtu.be') || clip.url.contains('tiktok.com'))) ||
          (t == 'audio' && (clip.url.contains('spotify.com') || clip.url.contains('soundcloud.com'))) ||
          (t == 'code' && clip.url.contains('github.com')) ||
          (t == 'job' && (clip.url.contains('greenhouse.io') || clip.url.contains('lever.co') || clip.url.contains('/jobs')));
    }).length;
  }

  int countForSource(String source) {
    if (source == 'all') return _clips.length;
    final s = source.toLowerCase();
    return _clips.where((clip) {
      return clip.sourcePlatform.toLowerCase().contains(s) ||
          clip.domain.toLowerCase().contains(s) ||
          clip.url.toLowerCase().contains(s);
    }).length;
  }

  int countForDeadline(String filter) {
    if (filter == 'all') return _clips.length;
    final now = DateTime.now();
    return _clips.where((clip) {
      final d = clip.deadlineDate;
      if (d == null) return false;
      if (filter == 'has_deadline') return true;
      if (filter == 'this_week') {
        final nextWeek = now.add(const Duration(days: 7));
        return !d.isBefore(now) && !d.isAfter(nextWeek);
      }
      if (filter == 'overdue') return d.isBefore(now);
      if (filter == 'upcoming') return d.isAfter(now);
      return false;
    }).length;
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
      _clips = fetched;
      for (final clip in _clips) {
        if (clip.isFavorite) {
          _favoriteIds.add(clip.id);
        } else if (_favoriteIds.contains(clip.id)) {
          clip.isFavorite = true;
        }
      }
      _saveLocalFavorites();
    } catch (e) {
      _error = e.toString();
      _clips = [];
      if (kDebugMode) print('Error loading clips: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
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

  void setContentType(String type) {
    _selectedContentType = type;
    notifyListeners();
  }

  void setSource(String source) {
    _selectedSource = source;
    notifyListeners();
  }

  void setDeadlineFilter(String filter) {
    _selectedDeadlineFilter = filter;
    notifyListeners();
  }

  void setCustomTag(String tag) {
    _selectedCustomTag = tag;
    notifyListeners();
  }

  Future<void> addCustomIntent(String intent) async {
    final clean = intent.trim().toLowerCase();
    if (clean.isEmpty) return;
    if (!_customIntents.contains(clean)) {
      _customIntents.add(clean);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('clips_custom_intents', _customIntents);
    }
    _selectedIntent = clean;
    notifyListeners();
  }

  Future<void> removeCustomIntent(String intent) async {
    _customIntents.remove(intent.trim().toLowerCase());
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('clips_custom_intents', _customIntents);
    if (_selectedIntent == intent.toLowerCase()) {
      _selectedIntent = 'all';
    }
    notifyListeners();
  }

  Future<void> addCustomContentType(String type) async {
    final clean = type.trim().toLowerCase();
    if (clean.isEmpty) return;
    if (!_customContentTypes.contains(clean)) {
      _customContentTypes.add(clean);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('clips_custom_content_types', _customContentTypes);
    }
    _selectedContentType = clean;
    notifyListeners();
  }

  Future<void> removeCustomContentType(String type) async {
    _customContentTypes.remove(type.trim().toLowerCase());
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('clips_custom_content_types', _customContentTypes);
    if (_selectedContentType == type.toLowerCase()) {
      _selectedContentType = 'all';
    }
    notifyListeners();
  }

  Future<void> addCustomTag(String tag) async {
    final clean = tag.trim().toLowerCase().replaceAll('#', '');
    if (clean.isEmpty) return;
    if (!_customTags.contains(clean)) {
      _customTags.add(clean);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('clips_custom_tags', _customTags);
    }
    _selectedCustomTag = clean;
    notifyListeners();
  }

  Future<void> removeCustomTag(String tag) async {
    final clean = tag.trim().toLowerCase().replaceAll('#', '');
    _customTags.remove(clean);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('clips_custom_tags', _customTags);
    if (_selectedCustomTag == clean) {
      _selectedCustomTag = 'all';
    }
    notifyListeners();
  }

  Future<void> addCustomSource(String source) async {
    final clean = source.trim().toLowerCase();
    if (clean.isEmpty) return;
    if (!_customSources.contains(clean)) {
      _customSources.add(clean);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('clips_custom_sources', _customSources);
    }
    _selectedSource = clean;
    notifyListeners();
  }

  Future<void> removeCustomSource(String source) async {
    final clean = source.trim().toLowerCase();
    _customSources.remove(clean);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('clips_custom_sources', _customSources);
    if (_selectedSource == clean) {
      _selectedSource = 'all';
    }
    notifyListeners();
  }

  void resetFilters() {
    _selectedIntent = 'all';
    _selectedContentType = 'all';
    _selectedSource = 'all';
    _selectedDeadlineFilter = 'all';
    _selectedCustomTag = 'all';
    _selectedCategory = 'All';
    _favoritesOnly = false;
    _selectedStatus = 'all';
    _selectedDestination = 'all';
    _searchQuery = '';
    notifyListeners();
  }

  Future<bool> toggleFavorite(String clipId) async {
    final willBeFav = !_favoriteIds.contains(clipId);
    if (willBeFav) {
      _favoriteIds.add(clipId);
    } else {
      _favoriteIds.remove(clipId);
    }
    for (final c in _clips) {
      if (c.id == clipId) {
        c.isFavorite = willBeFav;
      }
    }
    _saveLocalFavorites();
    notifyListeners();

    final ok = await ApiService.setClipFavorite(clipId, willBeFav);
    if (!ok) {
      // Revert if API call failed
      if (willBeFav) {
        _favoriteIds.remove(clipId);
      } else {
        _favoriteIds.add(clipId);
      }
      for (final c in _clips) {
        if (c.id == clipId) {
          c.isFavorite = !willBeFav;
        }
      }
      _saveLocalFavorites();
      notifyListeners();
      return false;
    }
    return true;
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

  Future<bool> toggleStarSelectedClips() async {
    if (_selectedIds.isEmpty) return false;
    final allStarred = areAllSelectedStarred;
    final targetFavState = !allStarred;
    final targetIds = List<String>.from(_selectedIds);

    for (final id in targetIds) {
      if (targetFavState) {
        _favoriteIds.add(id);
      } else {
        _favoriteIds.remove(id);
      }
      for (final c in _clips) {
        if (c.id == id) c.isFavorite = targetFavState;
      }
    }
    _saveLocalFavorites();
    notifyListeners();

    try {
      final results = await Future.wait(
        targetIds.map((id) => ApiService.setClipFavorite(id, targetFavState)),
      );
      return !results.contains(false);
    } catch (_) {
      return false;
    }
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

  Future<bool> deleteClip(String clipId) async {
    final index = _clips.indexWhere((c) => c.id == clipId);
    if (index == -1) return false;

    final removedClip = _clips[index];
    final wasFavorite = _favoriteIds.contains(clipId);
    final wasSelected = _selectedIds.contains(clipId);

    // Optimistic removal
    _clips.removeAt(index);
    _favoriteIds.remove(clipId);
    _selectedIds.remove(clipId);
    _saveLocalFavorites();
    notifyListeners();

    final ok = await ApiService.deleteClip(clipId);
    if (!ok) {
      // Revert if API failed
      if (index <= _clips.length) {
        _clips.insert(index, removedClip);
      } else {
        _clips.add(removedClip);
      }
      if (wasFavorite) _favoriteIds.add(clipId);
      if (wasSelected) _selectedIds.add(clipId);
      _saveLocalFavorites();
      notifyListeners();
      return false;
    }
    return true;
  }

  Future<bool> deleteSelectedClips() async {
    if (_selectedIds.isEmpty) return false;
    final toDelete = List<String>.from(_selectedIds);
    final removedClipsWithIndex = <MapEntry<int, ClipModel>>[];
    for (int i = 0; i < _clips.length; i++) {
      if (toDelete.contains(_clips[i].id)) {
        removedClipsWithIndex.add(MapEntry(i, _clips[i]));
      }
    }

    // Optimistic removal
    _clips.removeWhere((c) => toDelete.contains(c.id));
    for (final id in toDelete) {
      _favoriteIds.remove(id);
    }
    _saveLocalFavorites();
    exitBatchMode();

    final ok = await ApiService.deleteClips(toDelete);
    if (!ok) {
      // Rollback
      for (final entry in removedClipsWithIndex) {
        if (entry.key <= _clips.length) {
          _clips.insert(entry.key, entry.value);
        } else {
          _clips.add(entry.value);
        }
        if (entry.value.isFavorite) {
          _favoriteIds.add(entry.value.id);
        }
      }
      _saveLocalFavorites();
      notifyListeners();
      return false;
    }
    return true;
  }

  Future<bool> updateClip(
    String clipId, {
    String? title,
    String? status,
    String? deadline,
    String? intent,
    List<String>? tags,
    bool? isFavorite,
  }) async {
    // Optimistic local update
    final index = _clips.indexWhere((c) => c.id == clipId);
    if (index != -1) {
      final old = _clips[index];
      final updatedMeta = Map<String, dynamic>.from(old.extraMetadata);
      if (deadline != null) {
        updatedMeta['deadline'] = deadline;
        updatedMeta['deadline_date'] = deadline;
      }
      if (intent != null) {
        updatedMeta['intent'] = intent;
      }
      if (isFavorite != null) {
        if (isFavorite) {
          _favoriteIds.add(clipId);
        } else {
          _favoriteIds.remove(clipId);
        }
        _saveLocalFavorites();
      }
      _clips[index] = old.copyWith(
        title: title ?? old.title,
        status: status ?? old.status,
        tags: tags ?? old.tags,
        isFavorite: isFavorite ?? old.isFavorite,
        extraMetadata: updatedMeta,
      );
      notifyListeners();
    }

    final ok = await ApiService.updateClip(
      clipId,
      title: title,
      status: status,
      deadline: deadline,
      intent: intent,
      tags: tags,
      isFavorite: isFavorite,
    );
    if (!ok) {
      // Revert from backend if API call fails
      await loadClips();
    }
    return ok;
  }

  Future<bool> createClip(String url, {String? selectedText, String? destinationId}) async {
    final res = await createClipDetailed(url, selectedText: selectedText, destinationId: destinationId);
    return res.ok;
  }

  // --- Extension-parity state: destinations + detailed save ---

  // Pre-seeded with instant offline defaults so share overlay renders on frame 1 without awaiting network
  List<SaveDestination> _destinations = const [
    SaveDestination(
      id: 'google_sheets',
      name: 'Google Sheets',
      provider: 'google_sheets',
      isDefault: true,
      isActive: true,
    ),
    SaveDestination(
      id: 'notion',
      name: 'Notion',
      provider: 'notion',
      isDefault: false,
      isActive: true,
    ),
    SaveDestination(
      id: 'spotify',
      name: 'Spotify',
      provider: 'spotify',
      isDefault: false,
      isActive: true,
    ),
    SaveDestination(
      id: 'vault',
      name: 'Vault',
      provider: 'vault',
      isDefault: false,
      isActive: true,
    ),
  ];
  String _selectedDestinationId = 'google_sheets';
  bool _destinationsLoading = false;

  List<SaveDestination> get destinations => _destinations;
  String get selectedDestinationId => _selectedDestinationId;
  bool get destinationsLoading => _destinationsLoading;

  Future<void> loadDestinations() async {
    _destinationsLoading = true;
    notifyListeners();
    try {
      final fetched = await ApiService.getDestinations();
      if (fetched.isNotEmpty) {
        _destinations = fetched;
      }
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
          def?.id ?? lastMatch?.id ?? (_destinations.isNotEmpty ? _destinations.first.id : 'google_sheets');
    } catch (_) {
      // Keep existing destinations on network failure
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
      // Refresh clips list in background without stalling the return
      loadClips().catchError((_) {});
    }
    return res;
  }
}
