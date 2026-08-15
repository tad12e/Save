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
      final matchesCategory = _selectedCategory == 'All' ||
          clip.contentType.toLowerCase() == _selectedCategory.toLowerCase() ||
          (clip.extraMetadata['category_name']?.toString().toLowerCase() == _selectedCategory.toLowerCase());

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

  Future<bool> createClip(String url, {String? selectedText}) async {
    final success = await ApiService.saveClip(
      url: url,
      selectedText: selectedText,
    );
    if (success) {
      await loadClips();
    }
    return success;
  }
}
