import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import 'core/theme.dart';
import 'models/clip_model.dart';
import 'providers/clips_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ClipsProvider()..loadClips()),
      ],
      child: const SaveMobileApp(),
    ),
  );
}

class SaveMobileApp extends StatelessWidget {
  const SaveMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Save Clipper',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final List<String> _categories = [
    'All',
    'Jobs',
    'Articles',
    'Scholarships',
    'Events',
    'Tools',
    'Recipes',
  ];

  void _showAddClipModal(BuildContext context) {
    final urlController = TextEditingController();
    final noteController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            left: 20,
            right: 20,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Save New Clip',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textWhite,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.textMuted),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlController,
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textWhite),
                decoration: InputDecoration(
                  hintText: 'https://...',
                  hintStyle: GoogleFonts.inter(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.background,
                  prefixIcon: const Icon(LucideIcons.link, size: 16, color: AppTheme.primaryAmber),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.primaryAmber),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteController,
                maxLines: 2,
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textWhite),
                decoration: InputDecoration(
                  hintText: 'Optional highlighted notes or text excerpt...',
                  hintStyle: GoogleFonts.inter(color: AppTheme.textMuted),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.primaryAmber),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () async {
                    final url = urlController.text.trim();
                    if (url.isNotEmpty) {
                      Navigator.pop(ctx);
                      final provider = Provider.of<ClipsProvider>(context, listen: false);
                      await provider.createClip(url, selectedText: noteController.text.trim());
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Clip queued for AI processing & Google Sheets export!'),
                            backgroundColor: AppTheme.surfaceCard,
                          ),
                        );
                      }
                    }
                  },
                  child: Text(
                    'Save to Vault & Sheets',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryAmber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppTheme.borderAmber),
              ),
              child: const Icon(LucideIcons.bookmark, size: 16, color: AppTheme.primaryAmber),
            ),
            const SizedBox(width: 10),
            Text(
              'SAVE',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: AppTheme.textWhite,
              ),
            ),
            Text(
              ' .PRO',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryAmber,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18, color: AppTheme.primaryAmber),
            onPressed: () => clipsProvider.loadClips(),
            tooltip: 'Sync Clips',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              onChanged: (val) => clipsProvider.setSearchQuery(val),
              style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textWhite),
              decoration: InputDecoration(
                hintText: 'Search jobs, articles, recipes, tags...',
                hintStyle: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 12),
                filled: true,
                fillColor: AppTheme.surfaceCard,
                prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppTheme.textMuted),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.primaryAmber),
                ),
              ),
            ),
          ),

          // Horizontal Category Tabs
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final cat = _categories[idx];
                final isSelected = clipsProvider.selectedCategory == cat;
                return GestureDetector(
                  onTap: () => clipsProvider.setCategory(cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primaryAmber.withOpacity(0.15) : AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isSelected ? AppTheme.primaryAmber : AppTheme.borderSubtle,
                        width: 1,
                      ),
                    ),
                    child: Text(
                      cat,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppTheme.primaryAmber : AppTheme.textMuted,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),

          // Clips List View
          Expanded(
            child: clipsProvider.isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primaryAmber),
                  )
                : clipsProvider.clips.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.inbox, size: 40, color: AppTheme.textMuted),
                            const SizedBox(height: 12),
                            Text(
                              'No clips found',
                              style: GoogleFonts.outfit(color: AppTheme.textMuted, fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: clipsProvider.clips.length,
                        itemBuilder: (ctx, idx) {
                          final clip = clipsProvider.clips[idx];
                          return ClipCard(clip: clip);
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryAmber,
        onPressed: () => _showAddClipModal(context),
        child: const Icon(LucideIcons.plus, color: Colors.black),
      ),
    );
  }
}

class ClipCard extends StatelessWidget {
  final ClipModel clip;

  const ClipCard({super.key, required this.clip});

  Widget _buildPlatformBadge(String platform, String author) {
    String label = platform;
    Color color = AppTheme.textMuted;
    if (platform == 'x_twitter') {
      label = '𝕏 X';
      color = AppTheme.textWhite;
    } else if (platform == 'linkedin') {
      label = 'in LinkedIn';
      color = Colors.blueAccent;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        author.isNotEmpty ? '$label $author' : label,
        style: GoogleFonts.jetBrainsMono(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Badges Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryAmber.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderAmber),
                      ),
                      child: Text(
                        clip.contentType.toUpperCase(),
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryAmber,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    if (clip.sourcePlatform != 'web')
                      _buildPlatformBadge(clip.sourcePlatform, clip.sourceAuthor),
                  ],
                ),
                Text(
                  clip.exportStatus == 'done' ? '☁ SYNCED' : '⏳ PENDING',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: clip.exportStatus == 'done' ? AppTheme.accentEmerald : AppTheme.primaryAmber,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Title
            Text(
              clip.title,
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.textWhite,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),

            // Summary
            Text(
              clip.summary,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppTheme.textMuted,
                height: 1.4,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),

            // Tags & Link
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: clip.tags.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(3),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: Text(
                          '#$tag',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 9,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.externalLink, size: 14, color: AppTheme.primaryAmber),
                  onPressed: () async {
                    final uri = Uri.parse(clip.url);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
