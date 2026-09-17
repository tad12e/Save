/// Typed models for the real backend feed:
/// GET /api/clips/feed/ -> {metrics, daily_review, ai_synthesis,
/// stream_items, sync_river, watchlist, generated_at}
/// Field-for-field parity with web's FeedPayload (feedApi.ts).

String _str(dynamic v, [String fallback = '']) {
  if (v == null) return fallback;
  return v.toString();
}

int _int(dynamic v, [int fallback = 0]) {
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse(v?.toString() ?? '') ?? fallback;
}

bool _bool(dynamic v, [bool fallback = false]) {
  if (v is bool) return v;
  if (v is num) return v != 0;
  final s = v?.toString().toLowerCase();
  if (s == 'true' || s == '1') return true;
  if (s == 'false' || s == '0') return false;
  return fallback;
}

List<String> _strList(dynamic v) {
  if (v is List) {
    return v.map((e) => e.toString()).where((e) => e.isNotEmpty).toList();
  }
  return const [];
}

class FeedCategory {
  final String id;
  final String label;
  final int count;
  final String badgeColor;

  const FeedCategory({
    required this.id,
    required this.label,
    required this.count,
    this.badgeColor = '#7C3AED',
  });

  factory FeedCategory.fromJson(Map<String, dynamic> json) => FeedCategory(
        id: _str(json['id'], 'all'),
        label: _str(json['label'], 'All'),
        count: _int(json['count']),
        badgeColor: _str(json['badge_color'], '#7C3AED'),
      );
}

class FeedMetrics {
  final int todayNewCount;
  final int weekNewCount;
  final int totalClips;
  final String pipelineStatus;
  final int reviewStreak;
  final List<FeedCategory> categories;

  const FeedMetrics({
    this.todayNewCount = 0,
    this.weekNewCount = 0,
    this.totalClips = 0,
    this.pipelineStatus = 'ACTIVE',
    this.reviewStreak = 0,
    this.categories = const [],
  });

  factory FeedMetrics.fromJson(Map<String, dynamic> json) {
    final cats = json['categories'];
    return FeedMetrics(
      todayNewCount: _int(json['today_new_count']),
      weekNewCount: _int(json['week_new_count']),
      totalClips: _int(json['total_clips']),
      pipelineStatus: _str(json['pipeline_status'], 'ACTIVE'),
      reviewStreak: _int(json['review_streak']),
      categories: cats is List
          ? cats
              .whereType<Map<String, dynamic>>()
              .map(FeedCategory.fromJson)
              .toList()
          : const [],
    );
  }

  factory FeedMetrics.empty() => const FeedMetrics();
}

class FeedReviewItem {
  final String id;
  final String title;
  final String url;
  final String domain;
  final String contentType;
  final String intent;
  final String summary;
  final String keyTakeaway;
  final String badge;
  final String badgeColor;
  final String categoryTag;
  final String createdAt;
  final String? deadlineDate;
  bool isReviewed;
  bool isWatchlisted;

  FeedReviewItem({
    required this.id,
    required this.title,
    required this.url,
    this.domain = '',
    this.contentType = 'article',
    this.intent = 'other',
    this.summary = '',
    this.keyTakeaway = '',
    this.badge = '',
    this.badgeColor = '#7C3AED',
    this.categoryTag = '',
    this.createdAt = '',
    this.deadlineDate,
    this.isReviewed = false,
    this.isWatchlisted = false,
  });

  factory FeedReviewItem.fromJson(Map<String, dynamic> json) => FeedReviewItem(
        id: _str(json['id']),
        title: _str(json['title'], 'Untitled'),
        url: _str(json['url']),
        domain: _str(json['domain']),
        contentType: _str(json['content_type'], 'article'),
        intent: _str(json['intent'], 'other'),
        summary: _str(json['summary']),
        keyTakeaway: _str(json['key_takeaway']),
        badge: _str(json['badge']),
        badgeColor: _str(json['badge_color'], '#7C3AED'),
        categoryTag: _str(json['category_tag']),
        createdAt: _str(json['created_at']),
        deadlineDate: json['deadline_date']?.toString(),
        isReviewed: _bool(json['is_reviewed']),
        isWatchlisted: _bool(json['is_watchlisted']),
      );
}

class FeedSynthesis {
  final String title;
  final String abstract;
  final List<String> takeaways;
  final int itemCount;
  final String modelName;
  final String updatedAt;

  const FeedSynthesis({
    this.title = '',
    this.abstract = '',
    this.takeaways = const [],
    this.itemCount = 0,
    this.modelName = '',
    this.updatedAt = '',
  });

  factory FeedSynthesis.fromJson(Map<String, dynamic> json) => FeedSynthesis(
        title: _str(json['title']),
        abstract: _str(json['abstract']),
        takeaways: _strList(json['takeaways']),
        itemCount: _int(json['item_count']),
        modelName: _str(json['model_name']),
        updatedAt: _str(json['updated_at']),
      );
}

class FeedStreamItem {
  final String id;
  final String title;
  final String url;
  final String domain;
  final String author;
  final String sourcePlatform;
  final String contentType;
  final String intent;
  final List<String> tags;
  final String summary;
  final String keyTakeaway;
  final String createdAt;
  final String timeAgo;
  final String? deadlineDate;
  final int? daysLeft;
  final bool isExpired;
  final String musicEmbedUrl;
  final bool hasAudio;
  final String destinationName;
  final String destinationProvider;
  final String exportStatus;
  bool isReviewed;
  bool isWatchlisted;
  bool isSnoozed;

  FeedStreamItem({
    required this.id,
    required this.title,
    required this.url,
    this.domain = '',
    this.author = '',
    this.sourcePlatform = 'web',
    this.contentType = 'article',
    this.intent = 'other',
    this.tags = const [],
    this.summary = '',
    this.keyTakeaway = '',
    this.createdAt = '',
    this.timeAgo = '',
    this.deadlineDate,
    this.daysLeft,
    this.isExpired = false,
    this.musicEmbedUrl = '',
    this.hasAudio = false,
    this.destinationName = 'Save Vault',
    this.destinationProvider = 'vault',
    this.exportStatus = 'pending',
    this.isReviewed = false,
    this.isWatchlisted = false,
    this.isSnoozed = false,
  });

  factory FeedStreamItem.fromJson(Map<String, dynamic> json) {
    int? days;
    final rawDays = json['days_left'];
    if (rawDays is int) {
      days = rawDays;
    } else if (rawDays is num) {
      days = rawDays.toInt();
    }
    return FeedStreamItem(
      id: _str(json['id']),
      title: _str(json['title'], 'Untitled'),
      url: _str(json['url']),
      domain: _str(json['domain']),
      author: _str(json['author']),
      sourcePlatform: _str(json['source_platform'], 'web'),
      contentType: _str(json['content_type'], 'article'),
      intent: _str(json['intent'], 'other'),
      tags: _strList(json['tags']),
      summary: _str(json['summary']),
      keyTakeaway: _str(json['key_takeaway']),
      createdAt: _str(json['created_at']),
      timeAgo: _str(json['time_ago']),
      deadlineDate: json['deadline_date']?.toString(),
      daysLeft: days,
      isExpired: _bool(json['is_expired']),
      musicEmbedUrl: _str(json['music_embed_url']),
      hasAudio: _bool(json['has_audio']),
      destinationName: _str(json['destination_name'], 'Save Vault'),
      destinationProvider: _str(json['destination_provider'], 'vault'),
      exportStatus: _str(json['export_status'], 'pending'),
      isReviewed: _bool(json['is_reviewed']),
      isWatchlisted: _bool(json['is_watchlisted']),
      isSnoozed: _bool(json['is_snoozed']),
    );
  }

  bool get isOpportunity {
    final ct = contentType.toLowerCase();
    final it = intent.toLowerCase();
    return ct == 'job' ||
        ct == 'event' ||
        ct == 'scholarship' ||
        ct == 'grant' ||
        ct == 'contest' ||
        it == 'apply' ||
        it == 'attend' ||
        it == 'interview';
  }
}

class FeedSyncItem {
  final String id;
  final String clipId;
  final String title;
  final String destinationName;
  final String destinationProvider;
  final String status;
  final String timestamp;
  final String exportUrl;

  const FeedSyncItem({
    required this.id,
    required this.clipId,
    required this.title,
    this.destinationName = '',
    this.destinationProvider = '',
    this.status = 'done',
    this.timestamp = '',
    this.exportUrl = '',
  });

  factory FeedSyncItem.fromJson(Map<String, dynamic> json) => FeedSyncItem(
        id: _str(json['id']),
        clipId: _str(json['clip_id']),
        title: _str(json['title'], 'Untitled'),
        destinationName: _str(json['destination_name']),
        destinationProvider: _str(json['destination_provider']),
        status: _str(json['status'], 'done'),
        timestamp: _str(json['timestamp']),
        exportUrl: _str(json['export_url']),
      );
}

class FeedWatchlistItem {
  final String id;
  final String title;
  final String company;
  final String role;
  final String url;
  final String? deadlineDate;
  final String intent;
  final String status;

  const FeedWatchlistItem({
    required this.id,
    required this.title,
    this.company = '',
    this.role = '',
    this.url = '',
    this.deadlineDate,
    this.intent = '',
    this.status = 'pending',
  });

  factory FeedWatchlistItem.fromJson(Map<String, dynamic> json) =>
      FeedWatchlistItem(
        id: _str(json['id']),
        title: _str(json['title'], 'Untitled'),
        company: _str(json['company']),
        role: _str(json['role']),
        url: _str(json['url']),
        deadlineDate: json['deadline_date']?.toString(),
        intent: _str(json['intent']),
        status: _str(json['status'], 'pending'),
      );
}

class FeedPayload {
  final FeedMetrics metrics;
  final List<FeedReviewItem> dailyReview;
  final FeedSynthesis synthesis;
  final List<FeedStreamItem> streamItems;
  final List<FeedSyncItem> syncRiver;
  final List<FeedWatchlistItem> watchlist;
  final String generatedAt;
  final bool isFallback;

  const FeedPayload({
    required this.metrics,
    required this.dailyReview,
    required this.synthesis,
    required this.streamItems,
    required this.syncRiver,
    required this.watchlist,
    this.generatedAt = '',
    this.isFallback = false,
  });

  factory FeedPayload.fromJson(Map<String, dynamic> json, {bool isFallback = false}) {
    List<T> listOf<T>(
      dynamic v,
      T Function(Map<String, dynamic>) parse,
    ) {
      if (v is! List) return [];
      return v.whereType<Map<String, dynamic>>().map(parse).toList();
    }

    final metricsJson = json['metrics'];
    final synthesisJson = json['ai_synthesis'];
    return FeedPayload(
      metrics: metricsJson is Map<String, dynamic>
          ? FeedMetrics.fromJson(metricsJson)
          : FeedMetrics.empty(),
      dailyReview: listOf(json['daily_review'], FeedReviewItem.fromJson),
      synthesis: synthesisJson is Map<String, dynamic>
          ? FeedSynthesis.fromJson(synthesisJson)
          : const FeedSynthesis(),
      streamItems: listOf(json['stream_items'], FeedStreamItem.fromJson),
      syncRiver: listOf(json['sync_river'], FeedSyncItem.fromJson),
      watchlist: listOf(json['watchlist'], FeedWatchlistItem.fromJson),
      generatedAt: _str(json['generated_at']),
      isFallback: isFallback,
    );
  }

  factory FeedPayload.empty() => FeedPayload(
        metrics: FeedMetrics.empty(),
        dailyReview: const [],
        synthesis: const FeedSynthesis(),
        streamItems: const [],
        syncRiver: const [],
        watchlist: const [],
      );
}
