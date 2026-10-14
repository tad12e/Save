import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/clip_model.dart';

enum ClipIntentType {
  all,
  watch,
  learn,
  apply,
  track,
  hire,
  attend,
  buy,
}

class IntentStyle {
  final String key;
  final String label;
  final String displayName;
  final IconData icon;
  final Color bgColor;
  final Color textColor;
  final Color borderColor;

  const IntentStyle({
    required this.key,
    required this.label,
    required this.displayName,
    required this.icon,
    required this.bgColor,
    required this.textColor,
    required this.borderColor,
  });
}

class ClipIntentHelper {
  static const Map<String, IntentStyle> styles = {
    'all': IntentStyle(
      key: 'all',
      label: 'ALL',
      displayName: 'All Clips',
      icon: LucideIcons.layers,
      bgColor: Color(0xFFF1F5F9),
      textColor: Color(0xFF334155),
      borderColor: Color(0xFFE2E8F0),
    ),
    'watch': IntentStyle(
      key: 'watch',
      label: 'WATCH',
      displayName: 'Watch',
      icon: LucideIcons.play,
      bgColor: Color(0xFFFEE2E2),
      textColor: Color(0xFFDC2626),
      borderColor: Color(0xFFFECACA),
    ),
    'view': IntentStyle(
      key: 'view',
      label: 'VIEW',
      displayName: 'View',
      icon: LucideIcons.eye,
      bgColor: Color(0xFFFEE2E2),
      textColor: Color(0xFFDC2626),
      borderColor: Color(0xFFFECACA),
    ),
    'learn': IntentStyle(
      key: 'learn',
      label: 'LEARN',
      displayName: 'Learn',
      icon: LucideIcons.bookOpen,
      bgColor: Color(0xFFDCFCE7),
      textColor: Color(0xFF15803D),
      borderColor: Color(0xFFBBF7D0),
    ),
    'apply': IntentStyle(
      key: 'apply',
      label: 'APPLY',
      displayName: 'Apply',
      icon: LucideIcons.briefcase,
      bgColor: Color(0xFFFEF3C7),
      textColor: Color(0xFFB45309),
      borderColor: Color(0xFFFDE68A),
    ),
    'track': IntentStyle(
      key: 'track',
      label: 'TRACK',
      displayName: 'Track',
      icon: LucideIcons.target,
      bgColor: Color(0xFFF1F5F9),
      textColor: Color(0xFF475569),
      borderColor: Color(0xFFE2E8F0),
    ),
    'hire': IntentStyle(
      key: 'hire',
      label: 'HIRE',
      displayName: 'Hire',
      icon: LucideIcons.users,
      bgColor: Color(0xFFEEF2FF),
      textColor: Color(0xFF4338CA),
      borderColor: Color(0xFFC7D2FE),
    ),
    'attend': IntentStyle(
      key: 'attend',
      label: 'ATTEND',
      displayName: 'Attend',
      icon: LucideIcons.calendar,
      bgColor: Color(0xFFFCE7F3),
      textColor: Color(0xFFBE185D),
      borderColor: Color(0xFFFBCFE8),
    ),
    'buy': IntentStyle(
      key: 'buy',
      label: 'BUY',
      displayName: 'Buy',
      icon: LucideIcons.shoppingBag,
      bgColor: Color(0xFFEDE9FE),
      textColor: Color(0xFF6D28D9),
      borderColor: Color(0xFFDDD6FE),
    ),
  };

  static IntentStyle getStyle(String intent) {
    final clean = intent.toLowerCase().trim();
    return styles[clean] ?? styles['learn']!;
  }

  /// Exact parity heuristic with Web getClipIntent()
  static String detectIntent(ClipModel clip) {
    final url = clip.url.toLowerCase();
    final contentType = clip.contentType.toLowerCase();

    // 0. Deterministic Video / Reel override
    final isVideo = contentType == 'video' ||
        contentType == 'reel' ||
        url.contains('instagram.com/reel') ||
        url.contains('instagram.com/reels') ||
        url.contains('instagram.com/tv') ||
        url.contains('youtube.com/watch') ||
        url.contains('youtube.com/shorts') ||
        url.contains('youtu.be/') ||
        url.contains('tiktok.com') ||
        url.contains('vimeo.com') ||
        url.contains('twitch.tv');
    if (isVideo) {
      return 'watch';
    }

    // 1. Direct explicit intent from backend
    final rawIntent = (clip.extraMetadata['intent'] ?? clip.intent).toString().toLowerCase().trim();
    if (rawIntent.isNotEmpty && rawIntent != 'other' && rawIntent != 'all') {
      if (['watch', 'stream', 'play'].contains(rawIntent)) return 'watch';
      if (['view'].contains(rawIntent)) return 'watch';
      if (['apply', 'submit', 'pitch'].contains(rawIntent)) return 'apply';
      if (['hire', 'recruit', 'contact'].contains(rawIntent)) return 'hire';
      if (['track', 'build', 'code', 'deploy', 'monitor', 'compare', 'benchmark'].contains(rawIntent)) return 'track';
      if (['attend', 'meet', 'rsvp', 'join'].contains(rawIntent)) return 'attend';
      if (['buy', 'shop', 'order', 'subscribe'].contains(rawIntent)) return 'buy';
      if (['learn', 'read', 'study', 'install', 'debug'].contains(rawIntent)) return 'learn';
      return rawIntent;
    }

    final title = clip.title.toLowerCase();
    final summary = clip.summary.toLowerCase();
    final tags = clip.tags.map((t) => t.toLowerCase()).toList();
    final text = '$title $summary $url ${tags.join(" ")}';

    // 2. Hire
    if (url.contains('linkedin.com/in/') ||
        url.contains('read.cv') ||
        url.contains('layers.to') ||
        url.contains('peerlist.io') ||
        url.contains('contra.com') ||
        url.contains('dribbble.com') ||
        url.contains('behance.net') ||
        tags.any((t) => ['hire', 'hiring', 'recruiting', 'candidate', 'talent', 'portfolio', 'resume', 'cv'].contains(t)) ||
        title.contains('candidate') ||
        title.contains('hire me') ||
        title.contains('resume') ||
        title.contains('portfolio') ||
        summary.contains('candidate profile') ||
        summary.contains('freelance availability') ||
        summary.contains('open for work')) {
      return 'hire';
    }

    // 3. Apply
    if (contentType == 'job' ||
        contentType == 'scholarship' ||
        url.contains('greenhouse.io') ||
        url.contains('lever.co') ||
        url.contains('workday.com') ||
        url.contains('ashbyhq.com') ||
        url.contains('wellfound.com') ||
        url.contains('smartrecruiters.com') ||
        url.contains('grants.gov') ||
        url.contains('/careers') ||
        url.contains('/jobs') ||
        url.contains('/internships') ||
        url.contains('/scholarships') ||
        url.contains('/grants') ||
        url.contains('/fellowships') ||
        url.contains('/apply') ||
        url.contains('/open-positions') ||
        tags.any((t) => ['job', 'jobs', 'career', 'careers', 'apply', 'scholarship', 'grant', 'fellowship', 'internship', 'funding', 'yc'].contains(t)) ||
        title.contains('grant') ||
        title.contains('scholarship') ||
        title.contains('fellowship') ||
        title.contains('internship') ||
        title.contains('engineer') ||
        title.contains('developer') ||
        title.contains('designer') ||
        title.contains('hiring') ||
        title.contains('open roles') ||
        title.contains('apply') ||
        title.contains('y combinator') ||
        summary.contains('apply now') ||
        summary.contains('submit application') ||
        summary.contains('application deadline') ||
        clip.deadlineDate != null) {
      return 'apply';
    }

    // 4. Attend
    if (url.contains('lu.ma') ||
        url.contains('eventbrite.com') ||
        url.contains('meetup.com') ||
        url.contains('partiful.com') ||
        url.contains('splashthat.com') ||
        url.contains('/events') ||
        url.contains('/hackathon') ||
        url.contains('/webinar') ||
        tags.any((t) => ['event', 'events', 'hackathon', 'webinar', 'conference', 'summit', 'meetup'].contains(t)) ||
        title.contains('hackathon') ||
        title.contains('webinar') ||
        title.contains('meetup') ||
        title.contains('conference') ||
        summary.contains('rsvp') ||
        summary.contains('register now')) {
      return 'attend';
    }

    // 5. Track
    if (url.contains('github.com') ||
        url.contains('gitlab.com') ||
        url.contains('huggingface.co') ||
        url.contains('producthunt.com') ||
        url.contains('npmjs.com') ||
        url.contains('pypi.org') ||
        url.contains('crates.io') ||
        url.contains('/releases') ||
        url.contains('/changelog') ||
        tags.any((t) => ['github', 'repo', 'library', 'tool', 'package', 'benchmark', 'tracker', 'roadmap'].contains(t)) ||
        title.contains('github') ||
        title.contains('roadmap') ||
        title.contains('v1.') ||
        title.contains('v2.')) {
      return 'track';
    }

    // 6. Buy
    if (url.contains('amazon.com') ||
        url.contains('gumroad.com') ||
        url.contains('lemon-squeezy.com') ||
        url.contains('etsy.com') ||
        url.contains('/pricing') ||
        url.contains('/product') ||
        tags.any((t) => ['buy', 'shopping', 'pricing', 'gadget', 'deal', 'discount'].contains(t)) ||
        text.contains('\$') ||
        text.contains('€') ||
        text.contains('£')) {
      return 'buy';
    }

    // Default
    return 'learn';
  }
}
