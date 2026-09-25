import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/intent_helper.dart';
import '../../../core/theme.dart';
import '../../../models/clip_model.dart';

class MetadataChipItem {
  final String label;
  final IconData icon;
  final Color textColor;
  final Color bgColor;
  final Color borderColor;

  const MetadataChipItem({
    required this.label,
    required this.icon,
    required this.textColor,
    required this.bgColor,
    required this.borderColor,
  });
}

class ExtractedMetadataHelper {
  static List<MetadataChipItem> extractChips(ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final meta = clip.extraMetadata;
    final chips = <MetadataChipItem>[];

    final summary = clip.summary;
    final title = clip.title;
    final text = '$title $summary';

    // ─────────────────────────────────────────────────────────────
    // 1. APPLY (Jobs, Grants, Scholarships)
    // ─────────────────────────────────────────────────────────────
    if (intent == 'apply' || clip.contentType == 'job' || clip.contentType == 'scholarship') {
      // Salary / Compensation
      String? salary = clip.salary ?? meta['salary']?.toString() ?? meta['compensation']?.toString();
      if (salary == null || salary.isEmpty) {
        final match = RegExp(r'\$[0-9]{2,3}(?:,[0-9]{3})*(?:k|K)?(?:\s*-\s*\$?[0-9]{2,3}(?:,[0-9]{3})*(?:k|K)?)?').firstMatch(text);
        if (match != null) salary = match.group(0);
      }
      if (salary != null && salary.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: salary,
          icon: LucideIcons.dollarSign,
          textColor: const Color(0xFFB45309),
          bgColor: const Color(0xFFFEF3C7),
          borderColor: const Color(0xFFFDE68A),
        ));
      }

      // Company
      final company = clip.company ?? meta['company']?.toString() ?? meta['organization']?.toString();
      if (company != null && company.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: company,
          icon: LucideIcons.building2,
          textColor: const Color(0xFF334155),
          bgColor: const Color(0xFFF1F5F9),
          borderColor: const Color(0xFFCBD5E1),
        ));
      }

      // Deadline with Urgency
      if (clip.deadlineDate != null) {
        final d = clip.deadlineDate!;
        final now = DateTime.now();
        final diffDays = d.difference(now).inDays;
        String deadlineText;
        Color textCol;
        Color bgCol;
        Color borderCol;

        if (diffDays < 0) {
          deadlineText = 'Expired';
          textCol = AppTheme.urgencyRed;
          bgCol = AppTheme.urgencyRedBg;
          borderCol = const Color(0xFFFECACA);
        } else if (diffDays <= 3) {
          deadlineText = 'Due in ${diffDays == 0 ? "today" : "$diffDays d"}';
          textCol = AppTheme.urgencyRed;
          bgCol = AppTheme.urgencyRedBg;
          borderCol = const Color(0xFFFECACA);
        } else if (diffDays <= 7) {
          deadlineText = 'Due in $diffDays d';
          textCol = const Color(0xFFB45309);
          bgCol = const Color(0xFFFEF3C7);
          borderCol = const Color(0xFFFDE68A);
        } else {
          deadlineText = 'Due ${DateFormat("MMM d").format(d)}';
          textCol = const Color(0xFF475569);
          bgCol = const Color(0xFFF1F5F9);
          borderCol = const Color(0xFFE2E8F0);
        }

        chips.add(MetadataChipItem(
          label: deadlineText,
          icon: LucideIcons.clock,
          textColor: textCol,
          bgColor: bgCol,
          borderColor: borderCol,
        ));
      }

      // Location / Remote
      final location = meta['location']?.toString();
      if (location != null && location.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: location,
          icon: LucideIcons.mapPin,
          textColor: const Color(0xFF475569),
          bgColor: const Color(0xFFF8FAFC),
          borderColor: const Color(0xFFE2E8F0),
        ));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. TRACK (Repositories, Dev Tools, Releases)
    // ─────────────────────────────────────────────────────────────
    else if (intent == 'track' || clip.contentType == 'project' || clip.contentType == 'programming') {
      // GitHub Stars
      final stars = meta['stars']?.toString() ?? meta['github_stars']?.toString();
      if (stars != null && stars.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: '★ $stars',
          icon: LucideIcons.star,
          textColor: const Color(0xFFD97706),
          bgColor: const Color(0xFFFFFBEB),
          borderColor: const Color(0xFFFDE68A),
        ));
      }

      // Release / Version
      String? version = meta['version']?.toString() ?? meta['release']?.toString();
      if (version == null || version.isEmpty) {
        final match = RegExp(r'\bv\d+\.\d+(?:\.\d+)?\b', caseSensitive: false).firstMatch(text);
        if (match != null) version = match.group(0);
      }
      if (version != null && version.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: version,
          icon: LucideIcons.tag,
          textColor: const Color(0xFF6D28D9),
          bgColor: const Color(0xFFF5F3FF),
          borderColor: const Color(0xFFDDD6FE),
        ));
      }

      // Tech / Language
      final language = meta['language']?.toString();
      if (language != null && language.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: language,
          icon: LucideIcons.code,
          textColor: const Color(0xFF0F766E),
          bgColor: const Color(0xFFF0FDFA),
          borderColor: const Color(0xFF99F6E4),
        ));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. BUY (Products, Deals, Discounts)
    // ─────────────────────────────────────────────────────────────
    else if (intent == 'buy' || clip.contentType == 'deal') {
      // Price
      String? price = meta['price']?.toString() ?? meta['amount']?.toString();
      if (price == null || price.isEmpty) {
        final match = RegExp(r'(\$\d+(?:\.\d{2})?|\€\d+(?:\.\d{2})?|\£\d+(?:\.\d{2})?)').firstMatch(text);
        if (match != null) price = match.group(0);
      }
      if (price != null && price.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: price,
          icon: LucideIcons.tag,
          textColor: const Color(0xFF1D4ED8),
          bgColor: const Color(0xFFEFF6FF),
          borderColor: const Color(0xFFBFDBFE),
        ));
      }

      // Discount / Promo
      final discount = meta['discount']?.toString() ?? meta['sale']?.toString();
      if (discount != null && discount.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: discount,
          icon: LucideIcons.percent,
          textColor: const Color(0xFF15803D),
          bgColor: const Color(0xFFDCFCE7),
          borderColor: const Color(0xFFBBF7D0),
        ));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. ATTEND (Events, Hackathons, Meetups, Summits)
    // ─────────────────────────────────────────────────────────────
    else if (intent == 'attend' || clip.contentType == 'event') {
      // Event Date
      final eventDate = meta['event_date']?.toString() ?? meta['date']?.toString();
      if (eventDate != null && eventDate.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: eventDate,
          icon: LucideIcons.calendar,
          textColor: const Color(0xFFBE185D),
          bgColor: const Color(0xFFFDF2F8),
          borderColor: const Color(0xFFFBCFE8),
        ));
      }

      // Venue / Location
      final venue = meta['venue']?.toString() ?? meta['location']?.toString();
      if (venue != null && venue.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: venue,
          icon: LucideIcons.mapPin,
          textColor: const Color(0xFF475569),
          bgColor: const Color(0xFFF8FAFC),
          borderColor: const Color(0xFFE2E8F0),
        ));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. LEARN (Articles, Papers, Tutorials)
    // ─────────────────────────────────────────────────────────────
    else if (intent == 'learn') {
      // Reading Time / Duration
      String? duration = meta['reading_time']?.toString() ?? meta['duration']?.toString();
      if (duration == null || duration.isEmpty) {
        if (summary.isNotEmpty) {
          final wordCount = summary.split(RegExp(r'\s+')).length;
          if (wordCount > 30) {
            final estMinutes = (wordCount / 60).ceil();
            duration = '$estMinutes min read';
          }
        }
      }
      if (duration != null && duration.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: duration,
          icon: LucideIcons.clock,
          textColor: const Color(0xFF047857),
          bgColor: const Color(0xFFECFDF5),
          borderColor: const Color(0xFFA7F3D0),
        ));
      }

      // Author
      if (clip.sourceAuthor.isNotEmpty && clip.sourceAuthor != 'Unknown') {
        chips.add(MetadataChipItem(
          label: clip.sourceAuthor,
          icon: LucideIcons.user,
          textColor: const Color(0xFF334155),
          bgColor: const Color(0xFFF1F5F9),
          borderColor: const Color(0xFFCBD5E1),
        ));
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. HIRE (Recruiting, Talent, Portfolios)
    // ─────────────────────────────────────────────────────────────
    else if (intent == 'hire') {
      final role = meta['role']?.toString();
      if (role != null && role.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: role,
          icon: LucideIcons.userCheck,
          textColor: const Color(0xFF4338CA),
          bgColor: const Color(0xFFEEF2FF),
          borderColor: const Color(0xFFC7D2FE),
        ));
      }
      if (clip.sourceAuthor.isNotEmpty) {
        chips.add(MetadataChipItem(
          label: clip.sourceAuthor,
          icon: LucideIcons.user,
          textColor: const Color(0xFF334155),
          bgColor: const Color(0xFFF1F5F9),
          borderColor: const Color(0xFFCBD5E1),
        ));
      }
    }

    return chips;
  }
}

class ExtractedMetadataChips extends StatelessWidget {
  final ClipModel clip;
  final int maxChips;

  const ExtractedMetadataChips({
    super.key,
    required this.clip,
    this.maxChips = 3,
  });

  @override
  Widget build(BuildContext context) {
    final chips = ExtractedMetadataHelper.extractChips(clip);
    if (chips.isEmpty) return const SizedBox.shrink();

    final displayed = chips.take(maxChips).toList();

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        children: displayed.map((chip) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
            decoration: BoxDecoration(
              color: chip.bgColor,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: chip.borderColor, width: 0.8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(chip.icon, size: 10, color: chip.textColor),
                const SizedBox(width: 3.5),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 160),
                  child: Text(
                    chip.label,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: chip.textColor,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
