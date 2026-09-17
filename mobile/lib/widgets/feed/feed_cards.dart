import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/feed_models.dart';

// ─── Shared bits ───

const _cardBg = Color(0xFF11131E);
const _cardBorder = Color(0xFF272A3A);
const _muted = Color(0xFF94A3B8);
const _faint = Color(0xFF64748B);

Future<void> _openExternal(BuildContext context, String url) async {
  final uri = Uri.tryParse(url.trim());
  if (uri == null || (!uri.hasScheme)) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Invalid link')),
    );
    return;
  }
  final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!ok && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open link')),
    );
  }
}

class _CardShell extends StatelessWidget {
  final List<Widget> children;
  final Color? accentBorder;

  const _CardShell({required this.children, this.accentBorder});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accentBorder ?? _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}

class _CardFooter extends StatelessWidget {
  final String destinationName;
  final String timeAgo;

  const _CardFooter({required this.destinationName, required this.timeAgo});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(LucideIcons.refreshCw, size: 11, color: _faint),
        const SizedBox(width: 5),
        Expanded(
          child: Text(
            'Synced: $destinationName',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 11, color: _faint),
          ),
        ),
        if (timeAgo.isNotEmpty)
          Text(
            timeAgo,
            style: GoogleFonts.inter(fontSize: 11, color: _faint),
          ),
      ],
    );
  }
}

// ─── Web parity dispatch: job/event/scholarship/apply → opportunity,
// has_audio/audio → audio player, else article ───

bool feedItemIsOpportunity(FeedStreamItem item) => item.isOpportunity;

bool feedItemIsAudio(FeedStreamItem item) {
  final ct = item.contentType.toLowerCase();
  return item.hasAudio || ct == 'audio' || ct == 'podcast' || ct == 'music' || ct == 'track';
}

// ─── Opportunity card (FeedOpportunityCard parity) ───

class FeedOpportunityCard extends StatelessWidget {
  final FeedStreamItem item;
  final Future<void> Function(String id, String action) onAction;
  final void Function(String url)? onOpenInReader;

  const FeedOpportunityCard({
    super.key,
    required this.item,
    required this.onAction,
    this.onOpenInReader,
  });

  @override
  Widget build(BuildContext context) {
    final urgent = (item.daysLeft ?? 99) >= 0 && (item.daysLeft ?? 99) <= 3;
    final accent = item.isExpired
        ? const Color(0xFFDC2626)
        : urgent
            ? const Color(0xFFF43F5E)
            : _cardBorder;

    String deadlineLabel() {
      if (item.deadlineDate == null || item.deadlineDate!.isEmpty) return '';
      if (item.isExpired) return 'Expired';
      final d = item.daysLeft;
      if (d == null) return item.deadlineDate!.substring(0, 10);
      if (d == 0) return 'Due Today!';
      if (d == 1) return 'Due Tomorrow';
      return 'Due in ${d}d';
    }

    final deadline = deadlineLabel();

    return _CardShell(
      accentBorder: accent,
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.briefcase, size: 18, color: Color(0xFFF59E0B)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title.isEmpty ? 'Untitled Opportunity' : item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.domain.isEmpty ? item.sourcePlatform : item.domain,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11, color: _muted),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => onAction(item.id, 'watchlist'),
              child: Icon(
                item.isWatchlisted ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                size: 20,
                color: item.isWatchlisted ? const Color(0xFFFBBF24) : _muted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            _Badge(label: 'Opportunity • ${item.contentType}', color: const Color(0xFFF59E0B)),
            if (deadline.isNotEmpty)
              _Badge(
                label: deadline,
                color: item.isExpired || urgent ? const Color(0xFFF43F5E) : const Color(0xFF38BDF8),
              ),
          ],
        ),
        if (item.summary.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            item.summary,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFCBD5E1), height: 1.45),
          ),
        ],
        if (item.keyTakeaway.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: const Border(left: BorderSide(color: Color(0xFFF59E0B), width: 2.5)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(LucideIcons.zap, size: 14, color: Color(0xFFF59E0B)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.keyTakeaway,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFE2E8F0)),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 42,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    if (onOpenInReader != null && item.url.isNotEmpty) {
                      onOpenInReader!(item.url);
                    } else {
                      _openExternal(context, item.url);
                    }
                  },
                  child: Text(
                    'Review & Apply',
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 42,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: item.isReviewed ? const Color(0xFF6EE7B7) : Colors.white,
                  side: BorderSide(
                    color: item.isReviewed ? const Color(0xFF10B981) : const Color(0xFF2E334D),
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => onAction(item.id, 'review'),
                child: Text(
                  item.isReviewed ? 'Applied ✓' : 'Mark Applied',
                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _CardFooter(destinationName: item.destinationName, timeAgo: item.timeAgo),
      ],
    );
  }
}

// ─── Article card (FeedArticleCard parity) ───

class FeedArticleCard extends StatefulWidget {
  final FeedStreamItem item;
  final Future<void> Function(String id, String action) onAction;
  final void Function(String url)? onOpenInReader;

  const FeedArticleCard({
    super.key,
    required this.item,
    required this.onAction,
    this.onOpenInReader,
  });

  @override
  State<FeedArticleCard> createState() => _FeedArticleCardState();
}

class _FeedArticleCardState extends State<FeedArticleCard> {
  bool _copied = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final takeaway = item.keyTakeaway.isNotEmpty ? item.keyTakeaway : item.summary;

    return _CardShell(
      children: [
        Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.fileText, size: 18, color: Color(0xFF38BDF8)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title.isEmpty ? 'Untitled' : item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (item.domain.isNotEmpty) item.domain,
                      if (item.author.isNotEmpty) 'by ${item.author}',
                    ].join('  •  '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11, color: _muted),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            _Badge(label: item.contentType.toUpperCase(), color: const Color(0xFF38BDF8)),
            if (item.timeAgo.isNotEmpty) _Badge(label: item.timeAgo, color: _muted),
          ],
        ),
        if (item.summary.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            item.summary,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFFCBD5E1), height: 1.45),
          ),
        ],
        if (takeaway.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF38BDF8).withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(12),
              border: const Border(left: BorderSide(color: Color(0xFF38BDF8), width: 2.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'EXECUTIVE TAKEAWAY',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: _muted),
                      ),
                    ),
                    GestureDetector(
                      onTap: () async {
                        await Clipboard.setData(ClipboardData(text: takeaway));
                        if (!mounted) return;
                        setState(() => _copied = true);
                        Future.delayed(const Duration(seconds: 2), () {
                          if (mounted) setState(() => _copied = false);
                        });
                      },
                      child: Row(
                        children: [
                          Icon(_copied ? LucideIcons.check : LucideIcons.copy, size: 13, color: _copied ? const Color(0xFF6EE7B7) : _muted),
                          const SizedBox(width: 4),
                          Text(
                            _copied ? 'Copied' : 'Copy',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _copied ? const Color(0xFF6EE7B7) : _muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  takeaway,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFE2E8F0), height: 1.45),
                ),
              ],
            ),
          ),
        ],
        if (item.tags.isNotEmpty) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: item.tags.take(6).map((t) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C1F2E),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF2A2E44)),
                ),
                child: Text('#$t', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFA78BFA))),
              );
            }).toList(),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 42,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF2E334D)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    if (widget.onOpenInReader != null && item.url.isNotEmpty) {
                      widget.onOpenInReader!(item.url);
                    } else {
                      _openExternal(context, item.url);
                    }
                  },
                  child: Text(
                    'Read Article',
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            SizedBox(
              height: 42,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: item.isReviewed ? const Color(0xFF065F46) : const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => widget.onAction(item.id, 'review'),
                child: Text(
                  item.isReviewed ? 'Reviewed ✓' : 'Mark Reviewed',
                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _CardFooter(destinationName: item.destinationName, timeAgo: item.timeAgo),
      ],
    );
  }
}

// ─── Audio card (FeedAudioPlayer parity, real playback) ───

class FeedAudioCard extends StatefulWidget {
  final FeedStreamItem item;
  final void Function(String url)? onOpenInReader;

  const FeedAudioCard({super.key, required this.item, this.onOpenInReader});

  @override
  State<FeedAudioCard> createState() => _FeedAudioCardState();
}

class _FeedAudioCardState extends State<FeedAudioCard> {
  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _player.onPlayerComplete.listen((_) {
      if (mounted) setState(() => _isPlaying = false);
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePreview() async {
    final url = widget.item.musicEmbedUrl;
    if (url.isEmpty) {
      if (widget.onOpenInReader != null && widget.item.url.isNotEmpty) {
        widget.onOpenInReader!(widget.item.url);
      } else if (mounted) {
        _openExternal(context, widget.item.url);
      }
      return;
    }
    try {
      if (_isPlaying) {
        await _player.stop();
        if (mounted) setState(() => _isPlaying = false);
      } else {
        await _player.play(UrlSource(url));
        if (mounted) setState(() => _isPlaying = true);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return _CardShell(
      children: [
        Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFA855F7).withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(LucideIcons.headphones, size: 20, color: Color(0xFFA855F7)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title.isEmpty ? 'Audio Clip' : item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.domain.isEmpty ? item.sourcePlatform : item.domain,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 11, color: _muted),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: _togglePreview,
              child: Container(
                width: 42,
                height: 42,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFFA855F7)]),
                  shape: BoxShape.circle,
                ),
                child: Icon(_isPlaying ? LucideIcons.pause : LucideIcons.play, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
        if (item.summary.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            item.summary,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFCBD5E1)),
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 42,
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFF2E334D)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () {
              if (widget.onOpenInReader != null && item.url.isNotEmpty) {
                widget.onOpenInReader!(item.url);
              } else {
                _openExternal(context, item.url);
              }
            },
            child: Text(
              'Open Audio Source',
              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 10),
        _CardFooter(destinationName: item.destinationName, timeAgo: item.timeAgo),
      ],
    );
  }
}
