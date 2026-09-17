import 'package:flutter/foundation.dart';
import '../models/clip_model.dart';
import '../models/feed_models.dart';
import '../services/api_service.dart';

/// Feed state backed by the REAL backend (FeedEngine).
/// Web parity: full refetch on filter change, optimistic actions,
/// client-side synthesis from cached clips when offline.
class FeedProvider extends ChangeNotifier {
  FeedPayload _payload = FeedPayload.empty();
  String _timeframe = 'today'; // today | week | all
  String _category = 'all'; // all | action_required | articles | opportunities | audio | sync_logs
  int _limit = 50;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  bool _reviewCompleted = false;

  FeedPayload get payload => _payload;
  String get timeframe => _timeframe;
  String get category => _category;
  int get limit => _limit;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get reviewCompleted => _reviewCompleted;

  List<FeedStreamItem> get streamItems => _payload.streamItems;

  Future<void> loadFeed() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final raw = await ApiService.fetchFeed(
        timeframe: _timeframe,
        category: _category,
        limit: _limit,
      );
      if (raw != null) {
        _payload = FeedPayload.fromJson(raw);
        _reviewCompleted = _payload.dailyReview.isNotEmpty &&
            _payload.dailyReview.every((r) => r.isReviewed);
      } else {
        _error = 'Backend unreachable — showing cached clips';
      }
    } catch (e) {
      _error = 'Backend unreachable — showing cached clips';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Offline fallback: synthesize a feed from cached clips (web parity).
  void synthesizeFromClips(List<ClipModel> clips) {
    if (_payload.streamItems.isNotEmpty) return;
    _payload = _buildFallbackFeed(clips);
    notifyListeners();
  }

  Future<void> setTimeframe(String value) async {
    if (_timeframe == value) return;
    _timeframe = value;
    _limit = 50;
    await loadFeed();
  }

  Future<void> setCategory(String value) async {
    if (_category == value) return;
    _category = value;
    _limit = 50;
    await loadFeed();
  }

  /// Backend has no cursor pagination — grow the limit (honest load-more).
  Future<void> loadMore() async {
    if (_isLoading || _isLoadingMore) return;
    _isLoadingMore = true;
    notifyListeners();
    _limit += 50;
    try {
      final raw = await ApiService.fetchFeed(
        timeframe: _timeframe,
        category: _category,
        limit: _limit,
      );
      if (raw != null) {
        _payload = FeedPayload.fromJson(raw);
      }
    } catch (_) {}
    _isLoadingMore = false;
    notifyListeners();
  }

  /// Optimistic action (web parity): patch local state, confirm via API.
  Future<void> doAction(String clipId, String action, {String note = ''}) async {
    _applyLocalAction(clipId, action);
    notifyListeners();

    final res = await ApiService.performFeedAction(clipId, action, note: note);
    if (!res.optimistic) {
      for (final item in _payload.streamItems) {
        if (item.id == clipId) {
          if (action == 'review' || action == 'master') {
            item.isReviewed = res.isReviewed;
          }
          if (action == 'watchlist') {
            item.isWatchlisted = res.isWatchlisted;
          }
          if (action == 'snooze') item.isSnoozed = true;
        }
      }
      for (final item in _payload.dailyReview) {
        if (item.id == clipId) {
          if (action == 'review' || action == 'master') {
            item.isReviewed = res.isReviewed;
          }
          if (action == 'watchlist') {
            item.isWatchlisted = res.isWatchlisted;
          }
        }
      }
    }
    _reviewCompleted = _payload.dailyReview.isNotEmpty &&
        _payload.dailyReview.every((r) => r.isReviewed);
    notifyListeners();
  }

  void _applyLocalAction(String clipId, String action) {
    for (final item in _payload.streamItems) {
      if (item.id == clipId) {
        if (action == 'review' || action == 'master') item.isReviewed = true;
        if (action == 'watchlist') item.isWatchlisted = !item.isWatchlisted;
        if (action == 'snooze') item.isSnoozed = true;
      }
    }
    for (final item in _payload.dailyReview) {
      if (item.id == clipId) {
        if (action == 'review' || action == 'master') item.isReviewed = true;
        if (action == 'watchlist') item.isWatchlisted = !item.isWatchlisted;
      }
    }
  }

  // ─── Client fallback synthesis (mirrors web generateClientSynthesizedFeed) ───

  FeedPayload _buildFallbackFeed(List<ClipModel> clips) {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final weekAgo = now.subtract(const Duration(days: 7));

    final todayClips = clips.where((c) => c.createdAt.isAfter(todayStart)).length;
    final weekClips = clips.where((c) => c.createdAt.isAfter(weekAgo)).length;

    bool isAction(ClipModel c) {
      final ct = c.contentType.toLowerCase();
      return ct == 'job' || ct == 'event' || ct == 'scholarship' || ct == 'grant';
    }

    bool isArticle(ClipModel c) {
      final ct = c.contentType.toLowerCase();
      return ct == 'article' || ct == 'research' || ct == 'paper' || ct == 'essay' || ct == 'newsletter';
    }

    bool isAudio(ClipModel c) {
      final ct = c.contentType.toLowerCase();
      final url = c.url.toLowerCase();
      return ct == 'audio' ||
          ct == 'podcast' ||
          ct == 'music' ||
          url.contains('spotify.com') ||
          url.contains('music.youtube.com') ||
          url.contains('soundcloud.com');
    }

    final sorted = [...clips]..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    List<FeedStreamItem> filtered = sorted.map(_clipToStreamItem).toList();
    if (_timeframe == 'today') {
      filtered = sorted
          .where((c) => c.createdAt.isAfter(todayStart))
          .map(_clipToStreamItem)
          .toList();
    } else if (_timeframe == 'week') {
      filtered = sorted
          .where((c) => c.createdAt.isAfter(weekAgo))
          .map(_clipToStreamItem)
          .toList();
    }
    if (_category == 'action_required') {
      filtered = filtered.where((i) => _fallbackIsAction(i)).toList();
    } else if (_category == 'articles') {
      filtered = filtered.where((i) => _fallbackIsArticle(i)).toList();
    } else if (_category == 'opportunities') {
      filtered = filtered.where((i) => i.isOpportunity).toList();
    } else if (_category == 'audio') {
      filtered = filtered.where((i) => i.hasAudio).toList();
    }
    if (filtered.length > _limit) filtered = filtered.sublist(0, _limit);

    final reviewPool = [...sorted];
    final daily = <FeedReviewItem>[];
    final seen = <String>{};
    void pick(ClipModel? c, String badge, String color, String tag) {
      if (c == null || daily.length >= 5 || seen.contains(c.id)) return;
      seen.add(c.id);
      daily.add(FeedReviewItem(
        id: c.id,
        title: c.title,
        url: c.url,
        domain: _domainOf(c.url),
        contentType: c.contentType,
        summary: c.summary,
        keyTakeaway: c.summary,
        badge: badge,
        badgeColor: color,
        categoryTag: tag,
        createdAt: c.createdAt.toIso8601String(),
      ));
    }

    if (reviewPool.isNotEmpty) {
      pick(reviewPool.first, 'Recent', '#3FE769', 'recent');
      if (reviewPool.length > 1) {
        pick(reviewPool.last, 'Blast from Past', '#A855F7', 'spaced_repetition');
      }
      for (final c in reviewPool) {
        if (daily.length >= 5) break;
        final ct = c.contentType.toLowerCase();
        if (ct == 'article' || ct == 'research' || ct == 'paper') {
          pick(c, 'Deep Dive', '#38BDF8', 'deep_dive');
          break;
        }
      }
      for (final c in reviewPool) {
        if (daily.length >= 5) break;
        if (isAction(c)) {
          pick(c, 'Action Gem', '#F59E0B', 'action_gem');
          break;
        }
      }
      for (final c in reviewPool) {
        if (daily.length >= 5) break;
        pick(c, 'Vault Pick', '#64748B', 'vault_pick');
      }
    }

    return FeedPayload(
      metrics: FeedMetrics(
        todayNewCount: todayClips,
        weekNewCount: weekClips,
        totalClips: clips.length,
        categories: [
          FeedCategory(id: 'all', label: 'All Activity', count: clips.length, badgeColor: '#7C3AED'),
          FeedCategory(
              id: 'action_required',
              label: 'Action Required',
              count: clips.where(isAction).length,
              badgeColor: '#EF4444'),
          FeedCategory(
              id: 'articles',
              label: 'Articles & Papers',
              count: clips.where(isArticle).length,
              badgeColor: '#38BDF8'),
          FeedCategory(
              id: 'opportunities',
              label: 'Opportunities',
              count: clips.where(isAction).length,
              badgeColor: '#F59E0B'),
          FeedCategory(
              id: 'audio', label: 'Audio', count: clips.where(isAudio).length, badgeColor: '#A855F7'),
          const FeedCategory(id: 'sync_logs', label: 'Sync River', count: 0, badgeColor: '#10B981'),
        ],
      ),
      dailyReview: daily,
      synthesis: FeedSynthesis(
        title: clips.isEmpty ? 'Vault Ready' : 'Cached Digest',
        abstract: clips.isEmpty
            ? 'Save clips to build your feed.'
            : 'Offline digest from ${clips.length} cached clips.',
        takeaways: sorted.take(3).map((c) => c.title).toList(),
        itemCount: clips.length,
        modelName: 'On-device fallback',
        updatedAt: now.toIso8601String(),
      ),
      streamItems: filtered,
      syncRiver: const [],
      watchlist: sorted.where(isAction).take(6).map((c) => FeedWatchlistItem(
            id: c.id,
            title: c.title,
            company: _domainOf(c.url),
            role: c.title,
            url: c.url,
            intent: 'apply',
            status: c.status,
          )).toList(),
      generatedAt: now.toIso8601String(),
      isFallback: true,
    );
  }

  FeedStreamItem _clipToStreamItem(ClipModel c) {
    final url = c.url.toLowerCase();
    final audio = c.contentType.toLowerCase() == 'audio' ||
        url.contains('spotify.com') ||
        url.contains('music.youtube.com') ||
        url.contains('soundcloud.com');
    return FeedStreamItem(
      id: c.id,
      title: c.title,
      url: c.url,
      domain: _domainOf(c.url),
      author: c.sourceAuthor,
      sourcePlatform: c.sourcePlatform,
      contentType: c.contentType,
      tags: c.tags,
      summary: c.summary,
      keyTakeaway: c.summary,
      createdAt: c.createdAt.toIso8601String(),
      timeAgo: _formatTimeAgo(c.createdAt),
      hasAudio: audio,
      exportStatus: c.exportStatus,
    );
  }

  bool _fallbackIsAction(FeedStreamItem i) {
    final ct = i.contentType.toLowerCase();
    return ct == 'job' || ct == 'event' || ct == 'scholarship' || ct == 'grant' || i.isOpportunity;
  }

  bool _fallbackIsArticle(FeedStreamItem i) {
    final ct = i.contentType.toLowerCase();
    return ct == 'article' || ct == 'research' || ct == 'paper' || ct == 'essay' || ct == 'newsletter';
  }

  String _domainOf(String raw) {
    try {
      final uri = Uri.parse(raw.trim());
      return uri.host.replaceFirst('www.', '');
    } catch (_) {
      return '';
    }
  }

  String _formatTimeAgo(DateTime created) {
    final diff = DateTime.now().difference(created);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${created.month}/${created.day}';
  }
}
