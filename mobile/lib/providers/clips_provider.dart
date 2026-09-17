import 'package:flutter/foundation.dart';
import '../models/clip_model.dart';
import '../services/api_service.dart';

class ClipsProvider extends ChangeNotifier {
  List<ClipModel> _clips = [];
  bool _isLoading = false;
  String _selectedCategory = 'All';
  String _searchQuery = '';

  List<ClipModel> get clips {
    return _clips.where((clip) {
      final cType = clip.contentType.toLowerCase().replaceAll(RegExp(r's$'), '');
      final selCat = _selectedCategory.toLowerCase().replaceAll(RegExp(r's$'), '');
      final matchesCategory = _selectedCategory == 'All' ||
          cType == selCat ||
          clip.contentType.toLowerCase() == _selectedCategory.toLowerCase() ||
          (clip.extraMetadata['category_name']?.toString().toLowerCase().replaceAll(RegExp(r's$'), '') == selCat);

      final matchesSearch = _searchQuery.isEmpty ||
          clip.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          clip.summary.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          clip.sourceAuthor.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          clip.tags.any((t) => t.toLowerCase().contains(_searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    }).toList();
  }

  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;

  Future<void> loadClips() async {
    _isLoading = true;
    notifyListeners();

    try {
      _clips = await ApiService.fetchClips();
    } catch (e) {
      if (kDebugMode) print('Error loading clips: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
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
