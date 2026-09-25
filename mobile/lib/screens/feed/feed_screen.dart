import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../models/feed_models.dart';
import '../../providers/clips_provider.dart';
import '../../providers/feed_provider.dart';
import '../../widgets/app_header.dart';
import '../../widgets/feed/feed_cards.dart';
import '../../widgets/feed/feed_sections.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final Set<String> _favoritedClipIds = {};
  bool _showSearch = false;
  bool _feedInit = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _initFeed());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _initFeed() async {
    if (_feedInit) return;
    _feedInit = true;
    final clips = Provider.of<ClipsProvider>(context, listen: false);
    final feed = Provider.of<FeedProvider>(context, listen: false);
    if (clips.clips.isEmpty) {
      await clips.loadClips();
    }
    await feed.loadFeed();
    if (!mounted) return;
    if (feed.payload.streamItems.isEmpty) {
      feed.synthesizeFromClips(clips.clips);
    }
  }

  Future<void> _refreshFeed() async {
    final clips = Provider.of<ClipsProvider>(context, listen: false);
    final feed = Provider.of<FeedProvider>(context, listen: false);
    await clips.loadClips();
    await feed.loadFeed();
    if (!mounted) return;
    if (feed.payload.streamItems.isEmpty) {
      feed.synthesizeFromClips(clips.clips);
    }
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final pos = _scrollController.position;
    if (pos.pixels >= pos.maxScrollExtent - 400) {
      Provider.of<FeedProvider>(context, listen: false).loadMore();
    }
  }

  void _openXStyleInAppBrowser(BuildContext context, dynamic item) {
    final ClipModel clip;
    if (item is ClipModel) {
      clip = item;
    } else if (item is FeedStreamItem) {
      clip = ClipModel(
        id: item.id,
        url: item.url,
        title: item.title,
        summary: item.summary.isNotEmpty ? item.summary : item.keyTakeaway,
        contentType: item.contentType,
        tags: item.tags,
        sourcePlatform: item.sourcePlatform,
        sourceAuthor: item.author,
        status: 'done',
        exportStatus: item.exportStatus,
        createdAt: DateTime.tryParse(item.createdAt) ?? DateTime.now(),
      );
    } else {
      return;
    }
    final isFavorited = _favoritedClipIds.contains(clip.id);
    XStyleInAppBrowserModal.show(
      context,
      clip,
      isFavorited: isFavorited,
      onToggleFavorite: () {
        setState(() {
          if (_favoritedClipIds.contains(clip.id)) {
            _favoritedClipIds.remove(clip.id);
          } else {
            _favoritedClipIds.add(clip.id);
          }
        });
      },
    );
  }

  Future<void> _handleFeedAction(String id, String action, {String note = ''}) async {
    await Provider.of<FeedProvider>(context, listen: false).doAction(id, action, note: note);
    if (!mounted) return;
    if (action == 'snooze') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Snoozed for 3 days'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppHeader.list(
        title: 'Knowledge Feed',
        onSearchTap: () => setState(() => _showSearch = !_showSearch),
        onFilterTap: () => _showCategorySheet(context),
      ),
      body: RefreshIndicator(
        onRefresh: _refreshFeed,
        color: const Color(0xFF2D6A4F),
        child: Consumer<FeedProvider>(
          builder: (context, feed, _) {
            final isEmpty = feed.payload.streamItems.isEmpty &&
                feed.payload.dailyReview.isEmpty;

            if (feed.isLoading && isEmpty) {
              return const Center(
                child: CircularProgressIndicator(color: Color(0xFF2D6A4F)),
              );
            }

            if (feed.error != null && isEmpty) {
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: [
                  const SizedBox(height: 120),
                  const Icon(LucideIcons.cloudOff, size: 44, color: AppTheme.inactiveGrey),
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      'Could not reach your vault',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      'Check your connection and backend URL',
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2D6A4F),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        _feedInit = false;
                        _initFeed();
                      },
                      child: Text(
                        'Retry',
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            }

            final query = _searchController.text.trim().toLowerCase();
            final allItems = feed.streamItems;
            final items = query.isEmpty
                ? allItems
                : allItems.where((i) {
                    return i.title.toLowerCase().contains(query) ||
                        i.summary.toLowerCase().contains(query) ||
                        i.domain.toLowerCase().contains(query) ||
                        i.tags.any((t) => t.toLowerCase().contains(query));
                  }).toList();
            final showRiver = feed.category == 'sync_logs';

            return SingleChildScrollView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_showSearch) ...[
                    _buildSearchField(),
                    const SizedBox(height: 12),
                  ],

                  // Metrics strip (real backend data)
                  _buildMetricsStrip(feed),
                  const SizedBox(height: 12),

                  // Timeframe segmented control
                  _buildTimeframeSegment(feed),
                  const SizedBox(height: 10),

                  // Server-driven category pills
                  _buildFeedCategoryPills(feed),
                  const SizedBox(height: 14),

                  if (!showRiver) ...[
                    DailyReviewCarousel(
                      items: feed.payload.dailyReview,
                      onAction: (id, action) => _handleFeedAction(id, action),
                      onOpenInReader: (url) {
                        final match = allItems.where((e) => e.url == url);
                        if (match.isNotEmpty) {
                          _openXStyleInAppBrowser(context, match.first);
                        }
                      },
                    ),
                    FeedSynthesisBanner(synthesis: feed.payload.synthesis),
                  ],

                  // Stream header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        showRiver
                            ? 'Sync River (${feed.payload.syncRiver.length})'
                            : 'Stream (${items.length})',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        feed.payload.isFallback
                            ? 'Cached • offline'
                            : feed.isLoading
                                ? 'Syncing…'
                                : 'Live from vault',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: feed.payload.isFallback
                              ? const Color(0xFFD97706)
                              : const Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (showRiver)
                    FeedSyncRiverList(items: feed.payload.syncRiver)
                  else if (items.isEmpty)
                    _buildEmptyStream()
                  else
                    ...items.map((item) {
                      if (feedItemIsOpportunity(item)) {
                        return FeedOpportunityCard(
                          item: item,
                          onAction: (id, action) => _handleFeedAction(id, action),
                          onOpenInReader: (_) => _openXStyleInAppBrowser(context, item),
                        );
                      }
                      if (feedItemIsAudio(item)) {
                        return FeedAudioCard(
                          item: item,
                          onOpenInReader: (_) => _openXStyleInAppBrowser(context, item),
                        );
                      }
                      return FeedArticleCard(
                        item: item,
                        onAction: (id, action) => _handleFeedAction(id, action),
                        onOpenInReader: (_) => _openXStyleInAppBrowser(context, item),
                      );
                    }),

                  if (!showRiver && feed.isLoadingMore)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(
                        child: CircularProgressIndicator(color: Color(0xFF2D6A4F)),
                      ),
                    ),

                  if (!showRiver && !feed.payload.isFallback && items.length >= feed.limit)
                    Center(
                      child: TextButton(
                        onPressed: () => feed.loadMore(),
                        child: Text(
                          'Load more',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF2D6A4F),
                          ),
                        ),
                      ),
                    ),

                  if (!showRiver) ...[
                    const SizedBox(height: 8),
                    FeedWatchlistWidget(items: feed.payload.watchlist),
                  ],
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // ─── Real feed sections (backend-driven) ───

  Widget _buildSearchField() {
    return TextField(
      controller: _searchController,
      autofocus: true,
      onChanged: (_) => setState(() {}),
      style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: 'Search titles, summaries, tags…',
        hintStyle: GoogleFonts.inter(fontSize: 12, color: AppTheme.inactiveGrey),
        prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppTheme.inactiveGrey),
        suffixIcon: _searchController.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(LucideIcons.x, size: 16, color: AppTheme.inactiveGrey),
                onPressed: () => setState(_searchController.clear),
              ),
        filled: true,
        fillColor: AppTheme.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2D6A4F)),
        ),
      ),
    );
  }

  Widget _buildMetricsStrip(FeedProvider feed) {
    final m = feed.payload.metrics;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _metricCell('${m.todayNewCount}', 'Today'),
          _metricCell('${m.weekNewCount}', 'This week'),
          _metricCell('${m.totalClips}', 'Total'),
          _metricCell('${m.reviewStreak}🔥', 'Streak'),
        ],
      ),
    );
  }

  Widget _metricCell(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
      ],
    );
  }

  Widget _buildTimeframeSegment(FeedProvider feed) {
    const options = ['today', 'week', 'all'];
    const labels = ['Today', 'This Week', 'All Time'];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppTheme.surfaceMuted,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: List.generate(options.length, (i) {
          final selected = feed.timeframe == options[i];
          return Expanded(
            child: GestureDetector(
              onTap: () => feed.setTimeframe(options[i]),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFF2D6A4F) : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Text(
                  labels[i],
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                    color: selected ? Colors.white : AppTheme.textMuted,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildFeedCategoryPills(FeedProvider feed) {
    final cats = feed.payload.metrics.categories;
    final items = cats.isNotEmpty
        ? cats
        : const [
            FeedCategory(id: 'all', label: 'All Activity', count: 0),
            FeedCategory(id: 'action_required', label: 'Action Required', count: 0),
            FeedCategory(id: 'articles', label: 'Articles & Papers', count: 0),
            FeedCategory(id: 'opportunities', label: 'Opportunities', count: 0),
            FeedCategory(id: 'audio', label: 'Audio', count: 0),
            FeedCategory(id: 'sync_logs', label: 'Sync River', count: 0),
          ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: items.map((c) {
          final selected = feed.category == c.id;
          return GestureDetector(
            onTap: () => feed.setCategory(c.id),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFF2D6A4F) : AppTheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected ? const Color(0xFF2D6A4F) : AppTheme.borderSubtle,
                ),
              ),
              child: Row(
                children: [
                  Text(
                    c.label,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: selected ? FontWeight.bold : FontWeight.w500,
                      color: selected ? Colors.white : AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: selected ? Colors.white.withValues(alpha: 0.25) : AppTheme.surfaceMuted,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${c.count}',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: selected ? Colors.white : AppTheme.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyStream() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          children: [
            const Icon(LucideIcons.inbox, size: 40, color: AppTheme.inactiveGrey),
            const SizedBox(height: 10),
            Text(
              'Nothing in this stream yet',
              style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              'Share links from any app to fill your feed',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  void _showCategorySheet(BuildContext context) {
    final feed = Provider.of<FeedProvider>(context, listen: false);
    final cats = feed.payload.metrics.categories;
    if (cats.isEmpty) return;
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Filter by category',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 12),
              ...cats.map((c) {
                final selected = feed.category == c.id;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    '${c.label} (${c.count})',
                    style: GoogleFonts.inter(
                      fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                      color: selected ? const Color(0xFF2D6A4F) : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: selected
                      ? const Icon(LucideIcons.check, size: 18, color: Color(0xFF2D6A4F))
                      : null,
                  onTap: () {
                    Navigator.pop(ctx);
                    feed.setCategory(c.id);
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  // Mock sections removed — feed is backend-driven (real cards in widgets/feed/).
}

// =============================================================================
// IN-APP BROWSER WITH REAL ARTICLE READER & DOCKED FEED CLIP CARD
// =============================================================================

class XStyleInAppBrowserModal extends StatefulWidget {
  final ClipModel clip;
  final bool isFavorited;
  final VoidCallback? onToggleFavorite;

  const XStyleInAppBrowserModal({
    super.key,
    required this.clip,
    this.isFavorited = false,
    this.onToggleFavorite,
  });

  static void show(
    BuildContext context,
    ClipModel clip, {
    bool isFavorited = false,
    VoidCallback? onToggleFavorite,
  }) {
    if (kIsWeb) {
      final uri = Uri.tryParse(clip.url);
      if (uri != null && uri.hasScheme) {
        launchUrl(uri, mode: LaunchMode.platformDefault);
        return;
      }
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      enableDrag: false,
      builder: (ctx) => XStyleInAppBrowserModal(
        clip: clip,
        isFavorited: isFavorited,
        onToggleFavorite: onToggleFavorite,
      ),
    );
  }

  @override
  State<XStyleInAppBrowserModal> createState() => _XStyleInAppBrowserModalState();
}

class _XStyleInAppBrowserModalState extends State<XStyleInAppBrowserModal> {
  WebViewController? _webViewController;
  bool _isLoading = true;
  double _progress = 0.0;
  bool _isDockedExpanded = true;
  bool _isRefreshing = false;
  late bool _isFavorited;

  @override
  void initState() {
    super.initState();
    _isFavorited = widget.isFavorited;
    if (!kIsWeb) {
      _webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(Colors.white)
        ..setNavigationDelegate(
          NavigationDelegate(
            onProgress: (int progress) {
              if (mounted) {
                setState(() {
                  _progress = progress / 100.0;
                });
              }
            },
            onPageStarted: (String url) {
              if (mounted) {
                setState(() {
                  _isLoading = true;
                });
              }
            },
            onPageFinished: (String url) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
          ),
        );

      final uri = Uri.tryParse(widget.clip.url);
      if (uri != null) {
        _webViewController!.loadRequest(uri);
      }
    } else {
      _isLoading = false;
    }
  }

  String get _domain {
    final uri = Uri.tryParse(widget.clip.url);
    if (uri != null && uri.host.isNotEmpty) {
      return uri.host;
    }
    return 'habeshahistory.com';
  }

  void _handleRefresh() async {
    if (_webViewController == null) return;
    setState(() => _isRefreshing = true);
    _webViewController!.reload();
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() => _isRefreshing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Reloaded $_domain'),
          duration: const Duration(seconds: 1),
          backgroundColor: const Color(0xFF1E293B),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(LucideIcons.copy, color: Color(0xFF0F172A), size: 20),
                title: Text('Copy article link', style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 14)),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: widget.clip.url));
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Article link copied to clipboard ✓'),
                      backgroundColor: Color(0xFF16A34A),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.externalLink, color: Color(0xFF0F172A), size: 20),
                title: Text('Open live website in external browser', style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 14)),
                onTap: () async {
                  Navigator.pop(ctx);
                  final uri = Uri.tryParse(widget.clip.url);
                  if (uri != null && await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.share2, color: Color(0xFF0F172A), size: 20),
                title: Text('Share clip to vault members...', style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 14)),
                onTap: () => Navigator.pop(ctx),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final sheetHeight = mediaQuery.size.height * 0.94;

    return Container(
      height: sheetHeight,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        children: [
          // Drag handle pill at top (swipe down to dismiss)
          GestureDetector(
            onVerticalDragEnd: (details) {
              if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
                Navigator.pop(context);
              }
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.only(top: 8, bottom: 4),
              width: double.infinity,
              alignment: Alignment.center,
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),

          // 1. Top In-App Browser Header (Domain + Breadcrumb + Controls)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
            ),
            child: Row(
              children: [
                // Favicon / Globe icon
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      widget.clip.sourcePlatform.contains('github')
                          ? LucideIcons.code
                          : LucideIcons.globe,
                      size: 18,
                      color: const Color(0xFF2D6A4F),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Title and Breadcrumb
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _domain,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Home / ${widget.clip.contentType.toLowerCase()}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                // 3-dots more menu
                IconButton(
                  icon: const Icon(LucideIcons.ellipsis, size: 20, color: Color(0xFF0F172A)),
                  onPressed: () => _showMoreMenu(context),
                  visualDensity: VisualDensity.compact,
                ),
                // X (Close) button
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20, color: Color(0xFF0F172A)),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),

          // 2. Real Web Page Main Content Area (Live WebView Widget)
          Expanded(
            child: Stack(
              children: [
                if (!kIsWeb && _webViewController != null)
                  // Live WebView Engine rendering the real website with full scroll support
                  WebViewWidget(
                    controller: _webViewController!,
                    gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                      Factory<OneSequenceGestureRecognizer>(
                        () => EagerGestureRecognizer(),
                      ),
                    },
                  )
                else
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xFFDCFCE7),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.globe, size: 36, color: Color(0xFF16A34A)),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            widget.clip.title,
                            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.clip.summary,
                            style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted),
                            textAlign: TextAlign.center,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () {
                              final uri = Uri.tryParse(widget.clip.url);
                              if (uri != null) launchUrl(uri, mode: LaunchMode.platformDefault);
                            },
                            icon: const Icon(LucideIcons.externalLink, size: 16),
                            label: const Text('Open External Link'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF16A34A),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Top Loading progress bar
                if (_isLoading && _progress < 1.0)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: LinearProgressIndicator(
                      value: _progress > 0 ? _progress : null,
                      backgroundColor: Colors.transparent,
                      color: const Color(0xFF16A34A),
                      minHeight: 2.5,
                    ),
                  ),

                // 3. Floating Bottom Controls: In-App Browser Pill + Docked Real Feed Box Card
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // In-App Browser Navigation Pill Bar (← | domain.com ⋮ | ↻)
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Back Arrow (Go back in web history if possible, or close)
                            IconButton(
                              icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF0F172A), size: 20),
                              onPressed: () async {
                                if (_webViewController != null && await _webViewController!.canGoBack()) {
                                  await _webViewController!.goBack();
                                } else {
                                  if (context.mounted) Navigator.pop(context);
                                }
                              },
                              visualDensity: VisualDensity.compact,
                            ),

                            // Center URL Pill with 3 vertical dots (e.g. habeshahistory.com ⋮)
                            InkWell(
                              onTap: () => _showMoreMenu(context),
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      _domain,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(LucideIcons.ellipsisVertical, size: 14, color: Color(0xFF64748B)),
                                  ],
                                ),
                              ),
                            ),

                            // Refresh button ↻
                            IconButton(
                              icon: _isRefreshing
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF2D6A4F)),
                                    )
                                  : const Icon(LucideIcons.rotateCw, color: Color(0xFF0F172A), size: 19),
                              onPressed: _handleRefresh,
                              visualDensity: VisualDensity.compact,
                            ),
                          ],
                        ),
                      ),

                      // Docked Real Feed Box Card (from our app's Knowledge Feed)
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _isDockedExpanded = !_isDockedExpanded;
                          });
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            border: Border(
                              top: BorderSide(color: Color(0xFFE2E8F0), width: 1.0),
                            ),
                          ),
                          child: SafeArea(
                            top: false,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Drag indicator line
                                Center(
                                  child: Container(
                                    width: 32,
                                    height: 3,
                                    margin: const EdgeInsets.only(bottom: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE2E8F0),
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                ),

                                // Feed Box Header: Source Platform + Source Name + Category Pill + Saved to Vault
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFDCFCE7),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Center(
                                            child: Icon(
                                              widget.clip.sourcePlatform.contains('github')
                                                  ? LucideIcons.code
                                                  : LucideIcons.globe,
                                              size: 13,
                                              color: const Color(0xFF2D6A4F),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          widget.clip.sourceAuthor.isNotEmpty
                                              ? widget.clip.sourceAuthor
                                              : _domain,
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFDCFCE7),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            widget.clip.contentType.toUpperCase(),
                                            style: GoogleFonts.inter(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF166534),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: const Color(0xFF16A34A), width: 0.8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(LucideIcons.check, size: 11, color: Color(0xFF166534)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Saved in Vault',
                                            style: GoogleFonts.inter(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF166534),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Clip Title
                                Text(
                                  widget.clip.title,
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF0F172A),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),

                                // Summary snippet
                                Text(
                                  widget.clip.summary,
                                  style: GoogleFonts.inter(
                                    fontSize: 11.5,
                                    color: const Color(0xFF475569),
                                    height: 1.35,
                                  ),
                                  maxLines: _isDockedExpanded ? 2 : 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),

                                // Tags
                                if (_isDockedExpanded)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Wrap(
                                      spacing: 6,
                                      runSpacing: 4,
                                      children: widget.clip.tags.map((t) {
                                        return Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                          ),
                                          child: Text(
                                            '#$t',
                                            style: GoogleFonts.inter(
                                              fontSize: 9.5,
                                              color: const Color(0xFF2D6A4F),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),

                                // Action Buttons Row: Ask AI | Add Note | Favorite Toggle | Share
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Ask AI
                                    InkWell(
                                      onTap: () {
                                        Navigator.pop(context);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: const Text(
                                              'AI takeaways live on the feed cards — open the clip from Stream to read them.',
                                            ),
                                            behavior: SnackBarBehavior.floating,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                          ),
                                        );
                                      },
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.sparkles, size: 13, color: Color(0xFF16A34A)),
                                            const SizedBox(width: 5),
                                            Text(
                                              'Ask AI',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: const Color(0xFF16A34A),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Add Note
                                    InkWell(
                                      onTap: () {
                                        Navigator.pop(context);
                                      },
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: const Color(0xFFE2E8F0)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(LucideIcons.pencil, size: 12, color: Color(0xFF64748B)),
                                            const SizedBox(width: 5),
                                            Text(
                                              'Add Note',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: const Color(0xFF475569),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Bookmark / Vault Favorite
                                    IconButton(
                                      icon: Icon(
                                        _isFavorited ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
                                        size: 18,
                                        color: _isFavorited ? const Color(0xFF10B981) : const Color(0xFF71717A),
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _isFavorited = !_isFavorited;
                                        });
                                        widget.onToggleFavorite?.call();
                                      },
                                      visualDensity: VisualDensity.compact,
                                    ),

                                    // Share
                                    IconButton(
                                      icon: const Icon(LucideIcons.share2, size: 16, color: Color(0xFF71717A)),
                                      onPressed: () => _showMoreMenu(context),
                                      visualDensity: VisualDensity.compact,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


