class ClipModel {
  final String id;
  final String url;
  final String title;
  final String summary;
  final String contentType;
  final List<String> tags;
  final String sourcePlatform;
  final String sourceAuthor;
  final String? parentClipId;
  final int childClipsCount;
  final String status;
  final String exportStatus;
  final DateTime createdAt;
  final Map<String, dynamic> extraMetadata;

  bool isFavorite;

  ClipModel({
    required this.id,
    required this.url,
    required this.title,
    required this.summary,
    required this.contentType,
    required this.tags,
    required this.sourcePlatform,
    required this.sourceAuthor,
    this.parentClipId,
    this.childClipsCount = 0,
    required this.status,
    required this.exportStatus,
    required this.createdAt,
    this.extraMetadata = const {},
    this.isFavorite = false,
  });

  factory ClipModel.fromJson(Map<String, dynamic> json) {
    return ClipModel(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      title: _cleanTitle(json['title'], json['summary'], json['url']),
      summary: json['summary'] ?? '',
      contentType: json['content_type'] ?? 'webpage',
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      sourcePlatform: json['source_platform'] ?? 'web',
      sourceAuthor: json['source_author'] ?? '',
      parentClipId: json['parent_clip_id'],
      childClipsCount: json['child_clips_count'] ?? 0,
      status: json['status'] ?? 'pending',
      exportStatus: json['export_status'] ?? 'pending',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      extraMetadata: json['extra_metadata'] is Map ? Map<String, dynamic>.from(json['extra_metadata']) : {},
      isFavorite: json['is_favorite'] == true || json['is_starred'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      'title': title,
      'summary': summary,
      'content_type': contentType,
      'tags': tags,
      'source_platform': sourcePlatform,
      'source_author': sourceAuthor,
      'parent_clip_id': parentClipId,
      'child_clips_count': childClipsCount,
      'status': status,
      'export_status': exportStatus,
      'created_at': createdAt.toIso8601String(),
      'extra_metadata': extraMetadata,
      'is_favorite': isFavorite,
    };
  }

  ClipModel copyWith({
    String? id,
    String? url,
    String? title,
    String? summary,
    String? contentType,
    List<String>? tags,
    String? sourcePlatform,
    String? sourceAuthor,
    String? parentClipId,
    int? childClipsCount,
    String? status,
    String? exportStatus,
    DateTime? createdAt,
    Map<String, dynamic>? extraMetadata,
    bool? isFavorite,
  }) {
    return ClipModel(
      id: id ?? this.id,
      url: url ?? this.url,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      contentType: contentType ?? this.contentType,
      tags: tags ?? this.tags,
      sourcePlatform: sourcePlatform ?? this.sourcePlatform,
      sourceAuthor: sourceAuthor ?? this.sourceAuthor,
      parentClipId: parentClipId ?? this.parentClipId,
      childClipsCount: childClipsCount ?? this.childClipsCount,
      status: status ?? this.status,
      exportStatus: exportStatus ?? this.exportStatus,
      createdAt: createdAt ?? this.createdAt,
      extraMetadata: extraMetadata ?? this.extraMetadata,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  DateTime? get deadlineDate {
    final raw = extraMetadata['deadline'] ?? extraMetadata['deadline_date'];
    if (raw != null && raw.toString().isNotEmpty) {
      return DateTime.tryParse(raw.toString());
    }
    return null;
  }

  DateTime? get deadline => deadlineDate;

  String get intent {
    final raw = extraMetadata['intent'];
    if (raw != null && raw.toString().isNotEmpty) {
      return raw.toString().toLowerCase();
    }
    return 'learn';
  }

  String get domain {
    try {
      if (url.isNotEmpty) {
        final uri = Uri.parse(url);
        final host = uri.host.toLowerCase();
        return host.startsWith('www.') ? host.substring(4) : host;
      }
    } catch (_) {}
    return 'web';
  }

  String? get company {
    return extraMetadata['company'] ?? extraMetadata['organization'];
  }

  String? get salary {
    return extraMetadata['salary'] ?? extraMetadata['compensation'];
  }

  List<String> get destinations {
    final raw = extraMetadata['synced_to'] ?? extraMetadata['destinations'];
    if (raw is List) {
      return raw.map((e) => e.toString()).toList();
    }
    return [];
  }

  static String _cleanTitle(dynamic rawTitle, dynamic rawSummary, dynamic rawUrl) {
    final titleStr = (rawTitle?.toString() ?? '').trim();
    final summaryStr = (rawSummary?.toString() ?? '').trim();
    final urlStr = (rawUrl?.toString() ?? '').toLowerCase();

    final isDomainTitle = titleStr.isEmpty ||
        titleStr == 'x.com' ||
        titleStr == 'twitter.com' ||
        titleStr == 'Untitled Clip' ||
        titleStr.startsWith('http');

    if (isDomainTitle && summaryStr.isNotEmpty && summaryStr != 'Saved webpage clip.') {
      return summaryStr.length > 65 ? '${summaryStr.substring(0, 65).trim()}...' : summaryStr;
    }

    if (titleStr.isNotEmpty) return titleStr;
    if (urlStr.contains('x.com') || urlStr.contains('twitter.com')) return 'X Post';
    return 'Untitled Clip';
  }
}
