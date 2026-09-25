import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/theme.dart';
import '../../../models/clip_model.dart';

class SourceBrandMeta {
  final String key;
  final String label;
  final Color brandColor;
  final Color bgColor;
  final Color borderColor;
  final IconData icon;
  final String formatLabel;

  const SourceBrandMeta({
    required this.key,
    required this.label,
    required this.brandColor,
    required this.bgColor,
    required this.borderColor,
    required this.icon,
    required this.formatLabel,
  });
}

class SourceBrandHelper {
  static SourceBrandMeta getSourceMeta(ClipModel clip) {
    final url = clip.url.toLowerCase();
    final platform = clip.sourcePlatform.toLowerCase();
    final domain = clip.domain.toLowerCase();
    final type = clip.contentType.toLowerCase();

    // 1. YouTube
    if (url.contains('youtube.com') ||
        url.contains('youtu.be') ||
        platform == 'youtube' ||
        domain.contains('youtube')) {
      return const SourceBrandMeta(
        key: 'youtube',
        label: 'YouTube',
        brandColor: Color(0xFFEF4444),
        bgColor: Color(0x18EF4444),
        borderColor: Color(0x40EF4444),
        icon: LucideIcons.youtube,
        formatLabel: 'VIDEO',
      );
    }

    // 2. GitHub
    if (url.contains('github.com') ||
        url.contains('gist.github.com') ||
        platform == 'github' ||
        domain.contains('github')) {
      return const SourceBrandMeta(
        key: 'github',
        label: 'GitHub',
        brandColor: Color(0xFF334155),
        bgColor: Color(0x18334155),
        borderColor: Color(0x40334155),
        icon: LucideIcons.github,
        formatLabel: 'REPO',
      );
    }

    // 3. X / Twitter
    if (url.contains('twitter.com') ||
        url.contains('x.com') ||
        platform == 'x_twitter' ||
        platform == 'twitter' ||
        domain == 'x.com' ||
        domain == 'twitter.com') {
      return const SourceBrandMeta(
        key: 'x_twitter',
        label: 'X / Twitter',
        brandColor: Color(0xFF0284C7),
        bgColor: Color(0x180284C7),
        borderColor: Color(0x400284C7),
        icon: LucideIcons.twitter,
        formatLabel: 'TWEET',
      );
    }

    // 4. LinkedIn
    if (url.contains('linkedin.com') ||
        platform == 'linkedin' ||
        domain.contains('linkedin')) {
      return const SourceBrandMeta(
        key: 'linkedin',
        label: 'LinkedIn',
        brandColor: Color(0xFF0A66C2),
        bgColor: Color(0x180A66C2),
        borderColor: Color(0x400A66C2),
        icon: LucideIcons.linkedin,
        formatLabel: 'POST',
      );
    }

    // 5. Reddit
    if (url.contains('reddit.com') ||
        platform == 'reddit' ||
        domain.contains('reddit')) {
      return const SourceBrandMeta(
        key: 'reddit',
        label: 'Reddit',
        brandColor: Color(0xFFFF4500),
        bgColor: Color(0x18FF4500),
        borderColor: Color(0x40FF4500),
        icon: LucideIcons.messageSquare,
        formatLabel: 'POST',
      );
    }

    // 6. ArXiv & Research Papers
    if (url.contains('arxiv.org') ||
        url.contains('biorxiv.org') ||
        domain.contains('arxiv.org')) {
      return const SourceBrandMeta(
        key: 'arxiv',
        label: 'ArXiv',
        brandColor: Color(0xFFB91C1C),
        bgColor: Color(0x18B91C1C),
        borderColor: Color(0x40B91C1C),
        icon: LucideIcons.fileText,
        formatLabel: 'PAPER',
      );
    }

    // 7. Substack
    if (url.contains('substack.com') || domain.contains('substack')) {
      return const SourceBrandMeta(
        key: 'substack',
        label: 'Substack',
        brandColor: Color(0xFFFF6719),
        bgColor: Color(0x18FF6719),
        borderColor: Color(0x40FF6719),
        icon: LucideIcons.bookmark,
        formatLabel: 'NEWSLETTER',
      );
    }

    // 8. Medium
    if (url.contains('medium.com') || domain.contains('medium')) {
      return const SourceBrandMeta(
        key: 'medium',
        label: 'Medium',
        brandColor: Color(0xFF10B981),
        bgColor: Color(0x1810B981),
        borderColor: Color(0x4010B981),
        icon: LucideIcons.bookOpen,
        formatLabel: 'ARTICLE',
      );
    }

    // 9. Spotify
    if (url.contains('spotify.com') || domain.contains('spotify')) {
      return const SourceBrandMeta(
        key: 'spotify',
        label: 'Spotify',
        brandColor: Color(0xFF1DB954),
        bgColor: Color(0x181DB954),
        borderColor: Color(0x401DB954),
        icon: LucideIcons.headphones,
        formatLabel: 'PODCAST',
      );
    }

    // Default web source with format matching web app
    String defaultFormat = 'CLIP';
    IconData defaultIcon = LucideIcons.globe;
    if (type == 'job' || type == 'scholarship') {
      defaultFormat = 'OPPORTUNITY';
      defaultIcon = LucideIcons.briefcase;
    } else if (type == 'event') {
      defaultFormat = 'EVENT';
      defaultIcon = LucideIcons.calendar;
    } else if (type == 'deal') {
      defaultFormat = 'DEAL';
      defaultIcon = LucideIcons.shoppingBag;
    } else if (type == 'article' || type == 'education') {
      defaultFormat = 'ARTICLE';
      defaultIcon = LucideIcons.fileText;
    } else if (type == 'project' || type == 'programming') {
      defaultFormat = 'CODE';
      defaultIcon = LucideIcons.code;
    }

    return SourceBrandMeta(
      key: 'web',
      label: 'Web',
      brandColor: AppTheme.textMuted,
      bgColor: AppTheme.surfaceMuted,
      borderColor: AppTheme.borderSubtle,
      icon: defaultIcon,
      formatLabel: defaultFormat,
    );
  }
}

class SourceBrandBadge extends StatelessWidget {
  final ClipModel clip;
  final bool showFormat;
  final double iconSize;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const SourceBrandBadge({
    super.key,
    required this.clip,
    this.showFormat = true,
    this.iconSize = 11,
    this.fontSize = 10,
    this.padding = const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
  });

  @override
  Widget build(BuildContext context) {
    final meta = SourceBrandHelper.getSourceMeta(clip);
    final domain = clip.domain;

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: meta.bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: meta.borderColor, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            meta.icon,
            size: iconSize,
            color: meta.brandColor,
          ),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 130),
            child: Text(
              domain,
              style: GoogleFonts.inter(
                fontSize: fontSize,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (showFormat) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                '•',
                style: GoogleFonts.inter(
                  fontSize: fontSize - 1,
                  color: AppTheme.textMuted.withValues(alpha: 0.6),
                ),
              ),
            ),
            Text(
              meta.formatLabel,
              style: GoogleFonts.inter(
                fontSize: fontSize - 1.5,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.4,
                color: meta.brandColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
