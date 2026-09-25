import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/clip_model.dart';

/// Metadata for a content source platform (YouTube, GitHub, X, etc.)
class SourcePlatformMeta {
  final String key;
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const SourcePlatformMeta({
    required this.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });
}

/// Metadata for content type classification (Video, Article, Code, Job, etc.)
class ContentTypeMeta {
  final String key;
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const ContentTypeMeta({
    required this.key,
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });
}

class SourceHelper {
  static String getDomainFromUrl(String url) {
    try {
      final uri = Uri.parse(url);
      final host = uri.host.toLowerCase();
      if (host.startsWith('www.')) {
        return host.substring(4);
      }
      return host.isNotEmpty ? host : 'web';
    } catch (_) {
      return 'web';
    }
  }

  /// Classify source platform matching Web getClipSourceKey()
  static String getClipSourceKey(ClipModel clip) {
    final url = clip.url.toLowerCase();
    final platform = clip.sourcePlatform.toLowerCase();

    if (url.contains('youtube.com') || url.contains('youtu.be') || platform == 'youtube') {
      return 'youtube';
    }
    if (url.contains('github.com') || url.contains('gist.github.com') || platform == 'github') {
      return 'github';
    }
    if (url.contains('twitter.com') || url.contains('x.com') || platform == 'x_twitter' || platform == 'twitter') {
      return 'x_twitter';
    }
    if (url.contains('linkedin.com') || platform == 'linkedin') {
      return 'linkedin';
    }
    if (url.contains('reddit.com') || platform == 'reddit') {
      return 'reddit';
    }
    if (url.contains('arxiv.org') || url.contains('biorxiv.org')) {
      return 'arxiv';
    }
    if (url.contains('substack.com')) {
      return 'substack';
    }
    if (url.contains('medium.com')) {
      return 'medium';
    }
    return 'other';
  }

  /// Metadata matching Web getClipSourceMeta()
  static SourcePlatformMeta getSourceMeta(String sourceKey) {
    switch (sourceKey) {
      case 'youtube':
        return const SourcePlatformMeta(
          key: 'youtube',
          label: 'YouTube',
          icon: LucideIcons.youtube,
          color: Color(0xFFEF4444),
          bgColor: Color(0x1FEF4444),
        );
      case 'github':
        return const SourcePlatformMeta(
          key: 'github',
          label: 'GitHub',
          icon: LucideIcons.github,
          color: Color(0xFF24292F),
          bgColor: Color(0x1F24292F),
        );
      case 'x_twitter':
        return const SourcePlatformMeta(
          key: 'x_twitter',
          label: 'X / Twitter',
          icon: LucideIcons.twitter,
          color: Color(0xFF1DA1F2),
          bgColor: Color(0x1F1DA1F2),
        );
      case 'linkedin':
        return const SourcePlatformMeta(
          key: 'linkedin',
          label: 'LinkedIn',
          icon: LucideIcons.linkedin,
          color: Color(0xFF0A66C2),
          bgColor: Color(0x1F0A66C2),
        );
      case 'reddit':
        return const SourcePlatformMeta(
          key: 'reddit',
          label: 'Reddit',
          icon: LucideIcons.messageCircle,
          color: Color(0xFFFF4500),
          bgColor: Color(0x1FFF4500),
        );
      case 'arxiv':
        return const SourcePlatformMeta(
          key: 'arxiv',
          label: 'ArXiv',
          icon: LucideIcons.fileText,
          color: Color(0xFFB91C1C),
          bgColor: Color(0x1FB91C1C),
        );
      case 'substack':
        return const SourcePlatformMeta(
          key: 'substack',
          label: 'Substack',
          icon: LucideIcons.bookmark,
          color: Color(0xFFFF6719),
          bgColor: Color(0x1FFF6719),
        );
      case 'medium':
        return const SourcePlatformMeta(
          key: 'medium',
          label: 'Medium',
          icon: LucideIcons.penTool,
          color: Color(0xFF10B981),
          bgColor: Color(0x1F10B981),
        );
      default:
        return const SourcePlatformMeta(
          key: 'other',
          label: 'Web',
          icon: LucideIcons.globe,
          color: Color(0xFF64748B),
          bgColor: Color(0x1F64748B),
        );
    }
  }

  /// Classify content type matching Web getClipContentTypeKey()
  static String getClipContentTypeKey(ClipModel clip) {
    final url = clip.url.toLowerCase();
    final type = clip.contentType.toLowerCase();
    final tags = clip.tags.map((t) => t.toLowerCase()).toList();

    if (url.contains('youtube.com') || url.contains('youtu.be') || url.contains('vimeo.com') || tags.contains('video') || type == 'video') {
      return 'video';
    }
    if (type == 'job' || type == 'scholarship' || tags.contains('job') || tags.contains('career')) {
      return 'job';
    }
    if (type == 'programming' || type == 'project' || url.contains('github.com') || tags.contains('code') || tags.contains('repo')) {
      return 'code';
    }
    if (type == 'music' || url.contains('spotify.com') || tags.contains('audio') || tags.contains('podcast')) {
      return 'audio';
    }
    if (type == 'book' || tags.contains('book') || tags.contains('reading')) {
      return 'book';
    }
    if (type == 'deal' || url.contains('amazon.') || tags.contains('deal') || tags.contains('shop')) {
      return 'deal';
    }
    if (type == 'event' || url.contains('eventbrite') || url.contains('lu.ma') || tags.contains('event')) {
      return 'event';
    }
    if (type == 'article' || type == 'research' || type == 'course' || tags.contains('article') || tags.contains('paper')) {
      return 'article';
    }
    return 'general';
  }

  /// Metadata matching Web getClipContentTypeMeta()
  static ContentTypeMeta getContentTypeMeta(String typeKey) {
    switch (typeKey) {
      case 'video':
        return const ContentTypeMeta(
          key: 'video',
          label: 'Video',
          icon: LucideIcons.video,
          color: Color(0xFFEF4444),
          bgColor: Color(0x1FEF4444),
        );
      case 'article':
        return const ContentTypeMeta(
          key: 'article',
          label: 'Article',
          icon: LucideIcons.fileText,
          color: Color(0xFF10B981),
          bgColor: Color(0x1F10B981),
        );
      case 'code':
        return const ContentTypeMeta(
          key: 'code',
          label: 'Code / Repo',
          icon: LucideIcons.code,
          color: Color(0xFF8B5CF6),
          bgColor: Color(0x1F8B5CF6),
        );
      case 'job':
        return const ContentTypeMeta(
          key: 'job',
          label: 'Opportunity',
          icon: LucideIcons.briefcase,
          color: Color(0xFFF59E0B),
          bgColor: Color(0x1FF59E0B),
        );
      case 'audio':
        return const ContentTypeMeta(
          key: 'audio',
          label: 'Audio / Podcast',
          icon: LucideIcons.headphones,
          color: Color(0xFFEC4899),
          bgColor: Color(0x1FEC4899),
        );
      case 'book':
        return const ContentTypeMeta(
          key: 'book',
          label: 'Book',
          icon: LucideIcons.bookOpen,
          color: Color(0xFF06B6D4),
          bgColor: Color(0x1F06B6D4),
        );
      case 'deal':
        return const ContentTypeMeta(
          key: 'deal',
          label: 'Product / Deal',
          icon: LucideIcons.shoppingBag,
          color: Color(0xFF3B82F6),
          bgColor: Color(0x1F3B82F6),
        );
      case 'event':
        return const ContentTypeMeta(
          key: 'event',
          label: 'Event / Summit',
          icon: LucideIcons.calendar,
          color: Color(0xFFD946EF),
          bgColor: Color(0x1FD946EF),
        );
      default:
        return const ContentTypeMeta(
          key: 'general',
          label: 'Note / General',
          icon: LucideIcons.bookmark,
          color: Color(0xFF64748B),
          bgColor: Color(0x1F64748B),
        );
    }
  }
}
