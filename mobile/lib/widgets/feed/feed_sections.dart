import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/feed_models.dart';

const _cardBg = Color(0xFF11131E);
const _cardBorder = Color(0xFF272A3A);
const _muted = Color(0xFF94A3B8);
const _faint = Color(0xFF64748B);

Color _hexColor(String hex, [Color fallback = const Color(0xFF7C3AED)]) {
  try {
    var clean = hex.replaceAll('#', '').trim();
    if (clean.length == 6) clean = 'FF$clean';
    if (clean.length == 8) return Color(int.parse(clean, radix: 16));
  } catch (_) {}
  return fallback;
}

Future<void> _openExternal(BuildContext context, String url) async {
  final uri = Uri.tryParse(url.trim());
  if (uri == null || !uri.hasScheme) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? trailing;

  const _SectionTitle({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
          if (trailing != null)
            Text(trailing!, style: GoogleFonts.inter(fontSize: 11, color: _faint)),
        ],
      ),
    );
  }
}

// ─── Daily 5 review carousel (DailyReviewCarousel parity) ───

class DailyReviewCarousel extends StatefulWidget {
  final List<FeedReviewItem> items;
  final Future<void> Function(String id, String action) onAction;
  final void Function(String url)? onOpenInReader;

  const DailyReviewCarousel({
    super.key,
    required this.items,
    required this.onAction,
    this.onOpenInReader,
  });

  @override
  State<DailyReviewCarousel> createState() => _DailyReviewCarouselState();
}

class _DailyReviewCarouselState extends State<DailyReviewCarousel> {
  final PageController _controller = PageController(viewportFraction: 0.92);
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();
    final allReviewed = widget.items.every((e) => e.isReviewed);
    if (allReviewed) {
      return Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF065F46).withValues(alpha: 0.25),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
        ),
        child: Column(
          children: [
            const Icon(LucideIcons.partyPopper, size: 30, color: Color(0xFF6EE7B7)),
            const SizedBox(height: 8),
            Text(
              'Daily Review Complete 🎉',
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              'All ${widget.items.length} items reviewed. Streak kept alive.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFA7F3D0)),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(title: 'Daily 5 Review', trailing: '${_index + 1}/${widget.items.length}'),
        SizedBox(
          height: 228,
          child: PageView.builder(
            controller: _controller,
            itemCount: widget.items.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) => _ReviewCard(
              item: widget.items[i],
              onAction: widget.onAction,
              onOpenInReader: widget.onOpenInReader,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.items.length, (i) {
            final active = i == _index;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: active ? 20 : 7,
              height: 7,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: active ? const Color(0xFF7C3AED) : const Color(0xFF2A2E44),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
      ],
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final FeedReviewItem item;
  final Future<void> Function(String id, String action) onAction;
  final void Function(String url)? onOpenInReader;

  const _ReviewCard({required this.item, required this.onAction, this.onOpenInReader});

  @override
  Widget build(BuildContext context) {
    final badgeColor = _hexColor(item.badgeColor);
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (item.badge.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    item.badge,
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor),
                  ),
                ),
              const Spacer(),
              GestureDetector(
                onTap: () => onAction(item.id, 'watchlist'),
                child: Icon(
                  item.isWatchlisted ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                  size: 18,
                  color: item.isWatchlisted ? const Color(0xFFFBBF24) : _muted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.title.isEmpty ? 'Untitled' : item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          if (item.keyTakeaway.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              item.keyTakeaway,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1)),
            ),
          ],
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: item.isReviewed ? const Color(0xFF065F46) : const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => onAction(item.id, 'master'),
                    child: Text(
                      item.isReviewed ? 'Reviewed ✓' : 'Mark Reviewed',
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                height: 38,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF2E334D)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => onAction(item.id, 'snooze'),
                  child: Text('Snooze 3d', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 4),
              if (item.url.isNotEmpty)
                IconButton(
                  onPressed: () {
                    if (onOpenInReader != null) {
                      onOpenInReader!(item.url);
                    } else {
                      _openExternal(context, item.url);
                    }
                  },
                  icon: const Icon(LucideIcons.externalLink, size: 16, color: _muted),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── AI synthesis banner (FeedSynthesisBanner parity, real data) ───

class FeedSynthesisBanner extends StatelessWidget {
  final FeedSynthesis synthesis;

  const FeedSynthesisBanner({super.key, required this.synthesis});

  @override
  Widget build(BuildContext context) {
    if (synthesis.title.isEmpty && synthesis.abstract.isEmpty) {
      return const SizedBox.shrink();
    }
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E1B4B), Color(0xFF11131E)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.sparkles, size: 15, color: Color(0xFFA78BFA)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  synthesis.title.isEmpty ? 'AI Digest' : synthesis.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
              if (synthesis.itemCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED).withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${synthesis.itemCount} items',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFC4B5FD)),
                  ),
                ),
            ],
          ),
          if (synthesis.abstract.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              synthesis.abstract,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1), height: 1.45),
            ),
          ],
          if (synthesis.takeaways.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...synthesis.takeaways.take(3).toList().asMap().entries.map((e) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 5),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${e.key + 1}',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        e.value,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFE2E8F0)),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
          if (synthesis.modelName.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                'Generated by ${synthesis.modelName}',
                style: GoogleFonts.inter(fontSize: 10, color: _faint),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Watchlist widget (FeedWatchlistWidget parity) ───

class FeedWatchlistWidget extends StatelessWidget {
  final List<FeedWatchlistItem> items;

  const FeedWatchlistWidget({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle(title: 'Career Watchlist', trailing: '${items.length} tracked'),
        ...items.map((w) {
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _cardBorder),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    w.company.isEmpty ? '•' : w.company.substring(0, 1).toUpperCase(),
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFFF59E0B)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        w.title.isEmpty ? 'Opportunity' : w.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        [
                          if (w.company.isNotEmpty) w.company,
                          if (w.deadlineDate != null && w.deadlineDate!.length >= 10)
                            'Due ${w.deadlineDate!.substring(0, 10)}',
                        ].join('  •  '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 11, color: _muted),
                      ),
                    ],
                  ),
                ),
                if (w.url.isNotEmpty)
                  IconButton(
                    onPressed: () => _openExternal(context, w.url),
                    icon: const Icon(LucideIcons.externalLink, size: 15, color: _muted),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

// ─── Sync river (FeedSyncRiver parity) ───

class FeedSyncRiverList extends StatelessWidget {
  final List<FeedSyncItem> items;

  const FeedSyncRiverList({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text('No sync activity yet', style: GoogleFonts.inter(fontSize: 13, color: _faint)),
        ),
      );
    }
    return Column(
      children: items.map((s) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _cardBorder),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.circleCheck, size: 18, color: Color(0xFF10B981)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.title.isEmpty ? 'Synced clip' : s.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Synchronized to ${s.destinationName.isEmpty ? s.destinationProvider : s.destinationName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 11, color: _muted),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '✓ Active',
                  style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF6EE7B7)),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
