/// Platform Metadata Contract (v1) — Dart mirror.
///
/// Source of truth: backend/apps/clips/platform_meta.py
/// TS mirror:       web/src/types/clipPlatform.ts
///
/// Stored at clip.extra_metadata['platform_meta'] (served later as `platform_meta`).
/// Body text (tweet / post / caption) is NOT here — read ClipModel.summary.
/// Every field is nullable; unknown skins fall back to [PlatformSkin.generic].
library;

enum PlatformSkin { x, youtube, reddit, github, linkedin, instagram, spotify, generic }

extension PlatformSkinX on PlatformSkin {
  String get wire => name; // enum names match wire values exactly

  static PlatformSkin? fromWire(Object? value) {
    if (value is! String) return null;
    for (final s in PlatformSkin.values) {
      if (s.name == value) return s;
    }
    return null;
  }
}

const int kPlatformMetaVersion = 1;

const Map<String, PlatformSkin> _sourcePlatformToSkin = {
  'x_twitter': PlatformSkin.x,
  'youtube': PlatformSkin.youtube,
  'reddit': PlatformSkin.reddit,
  'github': PlatformSkin.github,
  'linkedin': PlatformSkin.linkedin,
  'instagram': PlatformSkin.instagram,
  'spotify': PlatformSkin.spotify,
};

const List<(String, PlatformSkin)> _hostToSkin = [
  ('x.com', PlatformSkin.x),
  ('twitter.com', PlatformSkin.x),
  ('youtube.com', PlatformSkin.youtube),
  ('youtu.be', PlatformSkin.youtube),
  ('reddit.com', PlatformSkin.reddit),
  ('redd.it', PlatformSkin.reddit),
  ('github.com', PlatformSkin.github),
  ('linkedin.com', PlatformSkin.linkedin),
  ('instagram.com', PlatformSkin.instagram),
  ('spotify.com', PlatformSkin.spotify),
];

/// Must stay identical to resolve_skin() (Python) and resolveSkin() (TS).
PlatformSkin resolveSkin(String? sourcePlatform, String? url) {
  final direct = _sourcePlatformToSkin[(sourcePlatform ?? '').toLowerCase()];
  if (direct != null) return direct;
  var host = '';
  try {
    host = Uri.parse(url ?? '').host.toLowerCase();
  } catch (_) {}
  if (host.startsWith('www.')) host = host.substring(4);
  if (host.isNotEmpty) {
    for (final (suffix, skin) in _hostToSkin) {
      if (host == suffix || host.endsWith('.$suffix')) return skin;
    }
  }
  return PlatformSkin.generic;
}

// ---------------------------------------------------------------------------
// Tolerant JSON readers (never throw on bad payloads)
// ---------------------------------------------------------------------------
String? _str(Map<String, dynamic> j, String k) {
  final v = j[k];
  if (v == null) return null;
  final s = v.toString().trim();
  return s.isEmpty ? null : s;
}

int? _int(Map<String, dynamic> j, String k) {
  final v = j[k];
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v);
  return null;
}

bool _bool(Map<String, dynamic> j, String k) => j[k] == true;

List<String> _list(Map<String, dynamic> j, String k) {
  final v = j[k];
  if (v is List) return v.whereType<String>().where((e) => e.isNotEmpty).toList(growable: false);
  return const [];
}

DateTime? _ts(Map<String, dynamic> j, String k) {
  final s = _str(j, k);
  return s == null ? null : DateTime.tryParse(s);
}

/// Sealed base: `switch (meta) { case XMeta m: ... }` is exhaustive.
sealed class PlatformMeta {
  const PlatformMeta();

  PlatformSkin get skin;

  /// Parse an untrusted payload. Falls back to an empty meta for the resolved skin.
  factory PlatformMeta.parse(Object? raw, {String? sourcePlatform, String? url}) {
    final json = raw is Map ? Map<String, dynamic>.from(raw) : const <String, dynamic>{};
    final skin = PlatformSkinX.fromWire(json['skin']) ?? resolveSkin(sourcePlatform, url);
    switch (skin) {
      case PlatformSkin.x:
        return XMeta.fromJson(json);
      case PlatformSkin.youtube:
        return YouTubeMeta.fromJson(json, fallbackUrl: url);
      case PlatformSkin.reddit:
        return RedditMeta.fromJson(json, fallbackUrl: url);
      case PlatformSkin.github:
        return GitHubMeta.fromJson(json);
      case PlatformSkin.linkedin:
        return LinkedInMeta.fromJson(json);
      case PlatformSkin.instagram:
        return InstagramMeta.fromJson(json, fallbackUrl: url);
      case PlatformSkin.spotify:
        return SpotifyMeta.fromJson(json);
      case PlatformSkin.generic:
        return GenericMeta.fromJson(json);
    }
  }
}

class XMeta extends PlatformMeta {
  final String? handle, name, avatar;
  final bool verified;
  final List<String> media;
  final DateTime? postedAt;
  final int? likes, reposts, replies, views;

  const XMeta({
    this.handle, this.name, this.avatar, this.verified = false, this.media = const [],
    this.postedAt, this.likes, this.reposts, this.replies, this.views,
  });

  factory XMeta.fromJson(Map<String, dynamic> j) => XMeta(
        handle: _str(j, 'handle'), name: _str(j, 'name'), avatar: _str(j, 'avatar'),
        verified: _bool(j, 'verified'), media: _list(j, 'media'), postedAt: _ts(j, 'posted_at'),
        likes: _int(j, 'likes'), reposts: _int(j, 'reposts'),
        replies: _int(j, 'replies'), views: _int(j, 'views'),
      );

  @override
  PlatformSkin get skin => PlatformSkin.x;
}

String? extractYouTubeVideoId(String? url) {
  if (url == null || url.isEmpty) return null;
  final regExp = RegExp(
    r'(?:v=|\/shorts\/|\/embed\/|\/v\/|\/live\/|youtu\.be\/|\/watch\?.*v=)([a-zA-Z0-9_-]{11})',
    caseSensitive: false,
  );
  final match = regExp.firstMatch(url);
  if (match != null && match.groupCount >= 1) {
    return match.group(1);
  }
  return null;
}

class YouTubeMeta extends PlatformMeta {
  final String? videoId, channel, channelAvatar;
  final int? duration, views; // duration in seconds
  final bool isShort;
  final DateTime? publishedAt;

  const YouTubeMeta({
    this.videoId, this.channel, this.channelAvatar, this.duration, this.views,
    this.isShort = false, this.publishedAt,
  });

  factory YouTubeMeta.fromJson(Map<String, dynamic> j, {String? fallbackUrl}) {
    var vid = _str(j, 'video_id');
    if (vid == null && fallbackUrl != null && fallbackUrl.isNotEmpty) {
      vid = extractYouTubeVideoId(fallbackUrl);
    }
    return YouTubeMeta(
      videoId: vid,
      channel: _str(j, 'channel'),
      channelAvatar: _str(j, 'channel_avatar'),
      duration: _int(j, 'duration'),
      views: _int(j, 'views'),
      isShort: _bool(j, 'is_short'),
      publishedAt: _ts(j, 'published_at'),
    );
  }

  /// Thumbnails are derived, never stored.
  String? thumbnail({String quality = 'hq'}) =>
      videoId == null ? null : 'https://i.ytimg.com/vi/$videoId/${quality}default.jpg';

  @override
  PlatformSkin get skin => PlatformSkin.youtube;
}

class RedditMeta extends PlatformMeta {
  final String? subreddit, author, flair, thumb;
  final int? upvotes, comments;
  final bool nsfw;
  final DateTime? postedAt;

  const RedditMeta({
    this.subreddit,
    this.author,
    this.flair,
    this.thumb,
    this.upvotes,
    this.comments,
    this.nsfw = false,
    this.postedAt,
  });

  factory RedditMeta.fromJson(Map<String, dynamic> j, {String? fallbackUrl}) {
    var sub = _str(j, 'subreddit');
    var author = _str(j, 'author');
    if ((sub == null || sub.isEmpty || sub.toLowerCase() == 'r/reddit') && fallbackUrl != null) {
      final match = RegExp(r'/r/([a-zA-Z0-9_]+)', caseSensitive: false).firstMatch(fallbackUrl);
      if (match != null && match.group(1) != null) {
        sub = 'r/${match.group(1)}';
      }
    }
    if ((author == null || author.isEmpty) && fallbackUrl != null) {
      final match = RegExp(r'/u(?:ser)?/([a-zA-Z0-9_]+)', caseSensitive: false).firstMatch(fallbackUrl);
      if (match != null && match.group(1) != null) {
        author = 'u/${match.group(1)}';
      }
    }
    return RedditMeta(
      subreddit: sub,
      author: author,
      flair: _str(j, 'flair'),
      thumb: _str(j, 'thumb'),
      upvotes: _int(j, 'upvotes'),
      comments: _int(j, 'comments'),
      nsfw: _bool(j, 'nsfw'),
      postedAt: _ts(j, 'posted_at'),
    );
  }

  @override
  PlatformSkin get skin => PlatformSkin.reddit;
}

class GitHubMeta extends PlatformMeta {
  final String? owner, repo, language, license;
  final int? stars, forks;
  final List<String> topics;

  const GitHubMeta({
    this.owner, this.repo, this.language, this.license, this.stars, this.forks, this.topics = const [],
  });

  factory GitHubMeta.fromJson(Map<String, dynamic> j) => GitHubMeta(
        owner: _str(j, 'owner'), repo: _str(j, 'repo'), language: _str(j, 'language'),
        license: _str(j, 'license'), stars: _int(j, 'stars'), forks: _int(j, 'forks'),
        topics: _list(j, 'topics'),
      );

  @override
  PlatformSkin get skin => PlatformSkin.github;
}

class LinkedInMeta extends PlatformMeta {
  final String? name, headline, avatar;
  final int? reactions, comments;

  const LinkedInMeta({this.name, this.headline, this.avatar, this.reactions, this.comments});

  factory LinkedInMeta.fromJson(Map<String, dynamic> j) => LinkedInMeta(
        name: _str(j, 'name'), headline: _str(j, 'headline'), avatar: _str(j, 'avatar'),
        reactions: _int(j, 'reactions'), comments: _int(j, 'comments'),
      );

  @override
  PlatformSkin get skin => PlatformSkin.linkedin;
}

class InstagramMeta extends PlatformMeta {
  final String? handle, name, avatar;
  final bool isReel;
  final List<String> media;
  final int? likes;
  final String? shortcode;

  const InstagramMeta({
    this.handle,
    this.name,
    this.avatar,
    this.isReel = false,
    this.media = const [],
    this.likes,
    this.shortcode,
  });

  factory InstagramMeta.fromJson(Map<String, dynamic> j, {String? fallbackUrl}) {
    var reel = _bool(j, 'is_reel');
    var rawMedia = _list(j, 'media');
    var rawHandle = _str(j, 'handle');
    String? sc;

    if (fallbackUrl != null && fallbackUrl.isNotEmpty) {
      if (!reel && (fallbackUrl.contains('/reel/') || fallbackUrl.contains('/reels/'))) {
        reel = true;
      }
      final match = RegExp(
        r'instagram\.com/(?:[^/]+/)?(?:reel|reels|p)/([a-zA-Z0-9_-]+)',
        caseSensitive: false,
      ).firstMatch(fallbackUrl);
      if (match != null) {
        sc = match.group(1);
        if (rawMedia.isEmpty && sc != null && sc.isNotEmpty) {
          rawMedia = ['https://www.instagram.com/p/$sc/media/?size=l'];
        }
      }
      if (rawHandle == null || rawHandle.isEmpty || rawHandle == '@') {
        final uri = Uri.tryParse(fallbackUrl);
        if (uri != null) {
          final segs = uri.pathSegments.where((s) => s.isNotEmpty).toList();
          if (segs.length >= 2 && (segs[1] == 'reel' || segs[1] == 'reels' || segs[1] == 'p')) {
            final possibleUser = segs[0];
            if (!const {'p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'}
                .contains(possibleUser.toLowerCase())) {
              rawHandle = '@$possibleUser';
            }
          }
        }
      }
    }

    return InstagramMeta(
      handle: rawHandle,
      name: _str(j, 'name'),
      avatar: _str(j, 'avatar'),
      isReel: reel,
      media: rawMedia,
      likes: _int(j, 'likes'),
      shortcode: sc,
    );
  }

  @override
  PlatformSkin get skin => PlatformSkin.instagram;
}

class SpotifyMeta extends PlatformMeta {
  /// track | album | playlist | episode | show | artist
  final String? kind, artist, album, cover;
  final int? duration; // seconds

  const SpotifyMeta({this.kind, this.artist, this.album, this.cover, this.duration});

  factory SpotifyMeta.fromJson(Map<String, dynamic> j) => SpotifyMeta(
        kind: _str(j, 'kind'), artist: _str(j, 'artist'), album: _str(j, 'album'),
        cover: _str(j, 'cover'), duration: _int(j, 'duration'),
      );

  @override
  PlatformSkin get skin => PlatformSkin.spotify;
}

class GenericMeta extends PlatformMeta {
  final String? site, image, author;
  final int? readMin;
  final DateTime? publishedAt;

  const GenericMeta({this.site, this.image, this.author, this.readMin, this.publishedAt});

  factory GenericMeta.fromJson(Map<String, dynamic> j) => GenericMeta(
        site: _str(j, 'site'), image: _str(j, 'image'), author: _str(j, 'author'),
        readMin: _int(j, 'read_min'), publishedAt: _ts(j, 'published_at'),
      );

  @override
  PlatformSkin get skin => PlatformSkin.generic;
}

// ---------------------------------------------------------------------------
// Shared formatters (identical output to the TS helpers)
// ---------------------------------------------------------------------------

/// 1234 -> "1.2K", 1250000 -> "1.3M".
String formatCompactCount(int? n) {
  if (n == null) return '';
  if (n < 1000) return '$n';
  const units = [(1e9, 'B'), (1e6, 'M'), (1e3, 'K')];
  for (final (size, suffix) in units) {
    if (n >= size) {
      final v = n / size;
      final text = v >= 100 ? v.round().toString() : v.toStringAsFixed(1).replaceAll(RegExp(r'\.0$'), '');
      return '$text$suffix';
    }
  }
  return '$n';
}

/// 754 -> "12:34", 3723 -> "1:02:03".
String formatDuration(int? seconds) {
  if (seconds == null || seconds <= 0) return '';
  final h = seconds ~/ 3600;
  final m = (seconds % 3600) ~/ 60;
  final s = seconds % 60;
  final mm = h > 0 ? m.toString().padLeft(2, '0') : '$m';
  return '${h > 0 ? '$h:' : ''}$mm:${s.toString().padLeft(2, '0')}';
}
