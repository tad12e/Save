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

  void resetFilters() {
    _selectedIntent = 'all';
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
