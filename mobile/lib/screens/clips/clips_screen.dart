import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/intent_helper.dart';
import '../../core/theme.dart';
import '../../models/clip_model.dart';
import '../../providers/clips_provider.dart';
import 'widgets/batch_actions_bar.dart';
import 'widgets/clip_detail_bottom_sheet.dart';
import 'widgets/clips_filter_bottom_sheet.dart';
import 'widgets/extracted_metadata_chips.dart';
import 'widgets/polymorphic_clip_card.dart';
import 'widgets/source_brand_badge.dart';

class ClipsScreen extends StatefulWidget {
  const ClipsScreen({super.key});

  @override
  State<ClipsScreen> createState() => _ClipsScreenState();
}

class _ClipsScreenState extends State<ClipsScreen> {
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();

  String _activeFilterDimension = 'intent'; // 'intent' | 'type' | 'source' | 'deadline'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final provider = Provider.of<ClipsProvider>(context, listen: false);
        if (provider.allClips.isEmpty && !provider.isLoading) {
          provider.loadClips();
        }
      }
    });
  }

  static const List<String> _intents = [
    'all',
    'watch',
    'learn',
    'apply',
    'track',
    'hire',
    'attend',
    'buy',
  ];

  static const List<Map<String, dynamic>> _contentTypes = [
    {'id': 'all', 'label': 'All Types', 'icon': LucideIcons.layers},
    {'id': 'video', 'label': 'Videos', 'icon': LucideIcons.video},
    {'id': 'article', 'label': 'Articles', 'icon': LucideIcons.fileText},
    {'id': 'audio', 'label': 'Audio', 'icon': LucideIcons.headphones},
    {'id': 'code', 'label': 'Code', 'icon': LucideIcons.code},
    {'id': 'job', 'label': 'Jobs', 'icon': LucideIcons.briefcase},
    {'id': 'book', 'label': 'Books', 'icon': LucideIcons.bookOpen},
    {'id': 'deal', 'label': 'Deals', 'icon': LucideIcons.shoppingBag},
    {'id': 'event', 'label': 'Events', 'icon': LucideIcons.calendar},
  ];

  static const List<Map<String, dynamic>> _sources = [
    {'id': 'all', 'label': 'All Sources', 'icon': LucideIcons.globe},
    {'id': 'x', 'label': 'Twitter / X', 'icon': LucideIcons.twitter},
    {'id': 'youtube', 'label': 'YouTube', 'icon': LucideIcons.youtube},
    {'id': 'instagram', 'label': 'Instagram', 'icon': LucideIcons.camera},
    {'id': 'spotify', 'label': 'Spotify', 'icon': LucideIcons.music},
    {'id': 'github', 'label': 'GitHub', 'icon': LucideIcons.github},
    {'id': 'linkedin', 'label': 'LinkedIn', 'icon': LucideIcons.linkedin},
    {'id': 'reddit', 'label': 'Reddit', 'icon': LucideIcons.messageCircle},
  ];

  static const List<Map<String, dynamic>> _deadlines = [
    {'id': 'all', 'label': 'All Dates', 'icon': LucideIcons.clock},
    {'id': 'has_deadline', 'label': 'Has Deadline', 'icon': LucideIcons.calendarCheck},
    {'id': 'this_week', 'label': 'Due This Week', 'icon': LucideIcons.calendarDays},
    {'id': 'overdue', 'label': 'Overdue', 'icon': LucideIcons.circleAlert},
    {'id': 'upcoming', 'label': 'Upcoming', 'icon': LucideIcons.arrowUpRight},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAddCustomDialog(BuildContext context, ClipsProvider provider, bool isIntent) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Icon(isIntent ? LucideIcons.sparkles : LucideIcons.layers, size: 20, color: AppTheme.primaryViolet),
            const SizedBox(width: 8),
            Text(
              isIntent ? 'Add Custom Intent' : 'Add Content Type',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isIntent
                  ? 'Enter an intent label (e.g. "Jobs", "Invest", "Recipes"). Clips matching this intent or tagged with it will be filtered.'
                  : 'Enter a custom content type (e.g. "Job Posting", "Recipe", "Prompt"):',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: isIntent ? 'e.g. Jobs' : 'e.g. Recipe',
                hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                filled: true,
                fillColor: AppTheme.surfaceMuted,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryViolet,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                if (isIntent) {
                  provider.addCustomIntent(text);
                } else {
                  provider.addCustomContentType(text);
                }
                Navigator.pop(ctx);
              }
            },
            child: Text('Add & Filter', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _cycleViewMode(ClipsProvider provider) {
    if (provider.viewMode == 'cards') {
      provider.setViewMode('list');
    } else if (provider.viewMode == 'list') {
      provider.setViewMode('grid');
    } else {
      provider.setViewMode('cards');
    }
  }

  IconData _getViewModeIcon(String mode) {
    switch (mode) {
      case 'list':
        return LucideIcons.list;
      case 'grid':
        return LucideIcons.layoutGrid;
      case 'cards':
      default:
        return LucideIcons.layers;
    }
  }

  void _showDeleteCustomDialog(BuildContext context, ClipsProvider provider, String item, bool isIntent) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(LucideIcons.trash2, size: 20, color: AppTheme.urgencyRed),
            const SizedBox(width: 8),
            Text(
              'Remove Custom ${isIntent ? "Intent" : "Type"}',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        content: Text(
          'Are you sure you want to remove "$item"?',
          style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.urgencyRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () {
              if (isIntent) {
                provider.removeCustomIntent(item);
              } else {
                provider.removeCustomContentType(item);
              }
              Navigator.pop(ctx);
            },
            child: Text('Delete', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAddTagDialog(BuildContext context, ClipsProvider provider) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(LucideIcons.tag, size: 20, color: AppTheme.primaryViolet),
            const SizedBox(width: 8),
            Text(
              'Add Custom Tag',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter a tag to filter clips (e.g. "ai", "jobs", "read-later"):',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
              decoration: InputDecoration(
                prefixText: '# ',
                prefixStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryViolet),
                hintText: 'e.g. ai',
                hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                filled: true,
                fillColor: AppTheme.surfaceMuted,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryViolet,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                provider.addCustomTag(text);
                setState(() {
                  _activeFilterDimension = 'tag';
                });
                Navigator.pop(ctx);
              }
            },
            child: Text('Add & Filter', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAddCustomSourceDialog(BuildContext context, ClipsProvider provider) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(LucideIcons.globe, size: 20, color: AppTheme.primaryViolet),
            const SizedBox(width: 8),
            Text(
              'Add Custom Source',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter a domain or website name (e.g. "medium.com", "news.ycombinator.com", "substack"):',
              style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'e.g. medium.com',
                hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                filled: true,
                fillColor: AppTheme.surfaceMuted,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryViolet,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                provider.addCustomSource(text);
                setState(() {
                  _activeFilterDimension = 'source';
                });
                Navigator.pop(ctx);
              }
            },
            child: Text('Add & Filter', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showAddFilterBottomSheet(BuildContext context, ClipsProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddFilterModal(
        provider: provider,
        initialTab: _activeFilterDimension,
        onFilterApplied: (String dimension) {
          setState(() {
            _activeFilterDimension = dimension;
          });
        },
      ),
    );
  }

  void _showDeleteCustomTagDialog(BuildContext context, ClipsProvider provider, String tag) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(LucideIcons.trash2, size: 20, color: AppTheme.urgencyRed),
            const SizedBox(width: 8),
            Text(
              'Remove Filter Tab',
              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
        content: Text(
          'Remove "#$tag" from your filter tabs?',
          style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.urgencyRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () {
              provider.removeCustomTag(tag);
              Navigator.pop(ctx);
            },
            child: Text('Remove', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildDimensionTabs(ClipsProvider provider) {
    final dimensions = <Map<String, dynamic>>[
      {
        'id': 'intent',
        'label': 'Intent',
        'icon': LucideIcons.target,
        'hasFilter': provider.selectedIntent != 'all',
      },
      {
        'id': 'type',
        'label': 'Content',
        'icon': LucideIcons.layers,
        'hasFilter': provider.selectedContentType != 'all',
      },
      {
        'id': 'source',
        'label': 'Source',
        'icon': LucideIcons.globe,
        'hasFilter': provider.selectedSource != 'all',
      },
      {
        'id': 'deadline',
        'label': 'Deadline',
        'icon': LucideIcons.clock,
        'hasFilter': provider.selectedDeadlineFilter != 'all',
      },
      {
        'id': 'tag',
        'label': 'Tags',
        'icon': LucideIcons.tag,
        'hasFilter': provider.selectedCustomTag != 'all',
      },
    ];

    // Add dedicated tabs for each user custom tag with its ACTUAL NAME (e.g. #ai engineering)
    for (final tag in provider.customTags) {
      dimensions.add({
        'id': 'tag_$tag',
        'tagValue': tag,
        'label': '#$tag',
        'icon': LucideIcons.tag,
        'isCustom': true,
        'hasFilter': provider.selectedCustomTag.toLowerCase() == tag.toLowerCase(),
      });
    }

    // If an active custom tag is selected but not in customTags yet
    if (provider.selectedCustomTag != 'all' &&
        !provider.customTags.any((t) => t.toLowerCase() == provider.selectedCustomTag.toLowerCase())) {
      dimensions.add({
        'id': 'tag_${provider.selectedCustomTag}',
        'tagValue': provider.selectedCustomTag,
        'label': '#${provider.selectedCustomTag}',
        'icon': LucideIcons.tag,
        'isCustom': true,
        'hasFilter': true,
      });
    }

    // Add dedicated tabs for custom content types with their ACTUAL NAME
    for (final cType in provider.customContentTypes) {
      dimensions.add({
        'id': 'type_$cType',
        'typeValue': cType,
        'label': cType[0].toUpperCase() + cType.substring(1),
        'icon': LucideIcons.layers,
        'isCustom': true,
        'hasFilter': provider.selectedContentType.toLowerCase() == cType.toLowerCase(),
      });
    }

    // Add dedicated tabs for custom intents with their ACTUAL NAME
    for (final intent in provider.customIntents) {
      dimensions.add({
        'id': 'intent_$intent',
        'intentValue': intent,
        'label': intent[0].toUpperCase() + intent.substring(1),
        'icon': LucideIcons.target,
        'isCustom': true,
        'hasFilter': provider.selectedIntent.toLowerCase() == intent.toLowerCase(),
      });
    }

    // Add dedicated tabs for custom sources with their ACTUAL NAME
    for (final src in provider.customSources) {
      dimensions.add({
        'id': 'source_$src',
        'sourceValue': src,
        'label': src[0].toUpperCase() + src.substring(1),
        'icon': LucideIcons.globe,
        'isCustom': true,
        'hasFilter': provider.selectedSource.toLowerCase() == src.toLowerCase(),
      });
    }

    final hasCustomFilter = provider.selectedCustomTag != 'all' ||
        provider.customIntents.contains(provider.selectedIntent) ||
        provider.customContentTypes.contains(provider.selectedContentType) ||
        provider.customSources.contains(provider.selectedSource);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 3),
              decoration: BoxDecoration(
                color: AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderSubtle, width: 0.8),
              ),
              child: ScrollConfiguration(
                behavior: ScrollConfiguration.of(context).copyWith(
                  dragDevices: {
                    PointerDeviceKind.touch,
                    PointerDeviceKind.mouse,
                    PointerDeviceKind.trackpad,
                  },
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: dimensions.map((dim) {
                      final bool isSelected;
                      if (dim['tagValue'] != null) {
                        isSelected = _activeFilterDimension == 'tag' &&
                            provider.selectedCustomTag.toLowerCase() == (dim['tagValue'] as String).toLowerCase();
                      } else if (dim['typeValue'] != null) {
                        isSelected = _activeFilterDimension == 'type' &&
                            provider.selectedContentType.toLowerCase() == (dim['typeValue'] as String).toLowerCase();
                      } else if (dim['intentValue'] != null) {
                        isSelected = _activeFilterDimension == 'intent' &&
                            provider.selectedIntent.toLowerCase() == (dim['intentValue'] as String).toLowerCase();
                      } else if (dim['sourceValue'] != null) {
                        isSelected = _activeFilterDimension == 'source' &&
                            provider.selectedSource.toLowerCase() == (dim['sourceValue'] as String).toLowerCase();
                      } else {
                        isSelected = _activeFilterDimension == dim['id'];
                      }

                      final hasFilter = dim['hasFilter'] as bool;
                      final isCustom = dim['isCustom'] == true;

                      return GestureDetector(
                        onTap: () {
                          if (dim['tagValue'] != null) {
                            setState(() {
                              _activeFilterDimension = 'tag';
                            });
                            final t = dim['tagValue'] as String;
                            provider.setCustomTag(provider.selectedCustomTag.toLowerCase() == t.toLowerCase() ? 'all' : t);
                          } else if (dim['typeValue'] != null) {
                            setState(() {
                              _activeFilterDimension = 'type';
                            });
                            final t = dim['typeValue'] as String;
                            provider.setContentType(provider.selectedContentType.toLowerCase() == t.toLowerCase() ? 'all' : t);
                          } else if (dim['intentValue'] != null) {
                            setState(() {
                              _activeFilterDimension = 'intent';
                            });
                            final i = dim['intentValue'] as String;
                            provider.setIntent(provider.selectedIntent.toLowerCase() == i.toLowerCase() ? 'all' : i);
                          } else if (dim['sourceValue'] != null) {
                            setState(() {
                              _activeFilterDimension = 'source';
                            });
                            final s = dim['sourceValue'] as String;
                            provider.setSource(provider.selectedSource.toLowerCase() == s.toLowerCase() ? 'all' : s);
                          } else {
                            setState(() {
                              _activeFilterDimension = dim['id'] as String;
                            });
                          }
                        },
                        onLongPress: isCustom
                            ? () {
                                if (dim['tagValue'] != null) {
                                  _showDeleteCustomTagDialog(context, provider, dim['tagValue'] as String);
                                } else if (dim['typeValue'] != null) {
                                  _showDeleteCustomDialog(context, provider, dim['typeValue'] as String, false);
                                } else if (dim['intentValue'] != null) {
                                  _showDeleteCustomDialog(context, provider, dim['intentValue'] as String, true);
                                }
                              }
                            : null,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          margin: const EdgeInsets.symmetric(horizontal: 2),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (isCustom ? AppTheme.primaryGreenBg : AppTheme.surface)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                            border: isSelected && isCustom
                                ? Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.5), width: 1.0)
                                : null,
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                dim['icon'] as IconData,
                                size: 13,
                                color: isSelected
                                    ? AppTheme.primaryViolet
                                    : (hasFilter ? AppTheme.primaryVioletLight : AppTheme.textMuted),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                dim['label'] as String,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: isSelected
                                      ? (isCustom ? AppTheme.primaryViolet : AppTheme.textPrimary)
                                      : (hasFilter ? AppTheme.primaryViolet : AppTheme.textMuted),
                                ),
                              ),
                              if (isCustom) ...[
                                const SizedBox(width: 5),
                                GestureDetector(
                                  onTap: () {
                                    if (dim['tagValue'] != null) {
                                      provider.removeCustomTag(dim['tagValue'] as String);
                                    } else if (dim['typeValue'] != null) {
                                      provider.removeCustomContentType(dim['typeValue'] as String);
                                    } else if (dim['intentValue'] != null) {
                                      provider.removeCustomIntent(dim['intentValue'] as String);
                                    } else if (dim['sourceValue'] != null) {
                                      provider.removeCustomSource(dim['sourceValue'] as String);
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.surfaceMuted,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      LucideIcons.x,
                                      size: 10,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ),
                              ] else if (hasFilter) ...[
                                const SizedBox(width: 5),
                                Container(
                                  width: 5,
                                  height: 5,
                                  decoration: const BoxDecoration(
                                    color: AppTheme.urgencyRed,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Action button to add custom filters
          GestureDetector(
            onTap: () => _showAddFilterBottomSheet(context, provider),
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 11),
              decoration: BoxDecoration(
                color: hasCustomFilter
                    ? AppTheme.primaryGreenBg.withValues(alpha: 0.6)
                    : AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: hasCustomFilter
                      ? AppTheme.primaryViolet
                      : AppTheme.borderSubtle,
                  width: 0.8,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.plus, size: 14, color: AppTheme.primaryViolet),
                  const SizedBox(width: 4),
                  Text(
                    'Add Filter',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primaryViolet,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDimensionPills(ClipsProvider provider) {
    if (_activeFilterDimension == 'intent') {
      final allIntents = [..._intents, ...provider.customIntents];
      return Container(
        height: 48,
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: allIntents.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (ctx, idx) {
            if (idx == allIntents.length) {
              return GestureDetector(
                onTap: () => _showAddCustomDialog(context, provider, true),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.4), width: 1.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.plus, size: 13, color: AppTheme.primaryViolet),
                      const SizedBox(width: 4),
                      Text(
                        'Add Intent',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryViolet,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            final intentKey = allIntents[idx];
            final isCustom = provider.customIntents.contains(intentKey);
            final style = ClipIntentHelper.getStyle(intentKey);
            final isSelected = provider.selectedIntent == intentKey;
            final count = provider.countForIntent(intentKey);
            final displayName = isCustom ? intentKey[0].toUpperCase() + intentKey.substring(1) : style.displayName;

            return GestureDetector(
              onTap: () => provider.setIntent(intentKey),
              onLongPress: isCustom ? () => _showDeleteCustomDialog(context, provider, intentKey, true) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected ? style.bgColor : AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? style.borderColor : AppTheme.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isCustom ? LucideIcons.sparkles : style.icon,
                      size: 13,
                      color: isSelected ? style.textColor : AppTheme.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      displayName,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? style.textColor : AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? style.textColor.withValues(alpha: 0.15)
                            : AppTheme.borderSubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$count',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? style.textColor : AppTheme.textMuted,
                        ),
                      ),
                    ),
                    if (isCustom) ...[
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => _showDeleteCustomDialog(context, provider, intentKey, true),
                        child: const Icon(LucideIcons.x, size: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    if (_activeFilterDimension == 'type') {
      final customTypes = provider.customContentTypes;
      final allTypes = [
        ..._contentTypes,
        ...customTypes.map((t) => {'id': t, 'label': t[0].toUpperCase() + t.substring(1), 'icon': LucideIcons.layers, 'isCustom': true}),
      ];
      return Container(
        height: 48,
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: allTypes.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (ctx, idx) {
            if (idx == allTypes.length) {
              return GestureDetector(
                onTap: () => _showAddCustomDialog(context, provider, false),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.4), width: 1.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.plus, size: 13, color: AppTheme.primaryViolet),
                      const SizedBox(width: 4),
                      Text(
                        'Add Type',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryViolet,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            final item = allTypes[idx];
            final typeId = item['id'] as String;
            final label = item['label'] as String;
            final icon = item['icon'] as IconData;
            final isCustom = item['isCustom'] == true;
            final isSelected = provider.selectedContentType == typeId;
            final count = provider.countForContentType(typeId);

            return GestureDetector(
              onTap: () => provider.setContentType(typeId),
              onLongPress: isCustom ? () => _showDeleteCustomDialog(context, provider, typeId, false) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 13,
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryViolet.withValues(alpha: 0.15)
                            : AppTheme.borderSubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$count',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                        ),
                      ),
                    ),
                    if (isCustom) ...[
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => _showDeleteCustomDialog(context, provider, typeId, false),
                        child: const Icon(LucideIcons.x, size: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    if (_activeFilterDimension == 'tag') {
      final allTags = provider.allUniqueTags;
      return Container(
        height: 48,
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: allTags.length + 2,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (ctx, idx) {
            if (idx == 0) {
              final isSelected = provider.selectedCustomTag == 'all';
              return GestureDetector(
                onTap: () => provider.setCustomTag('all'),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'All Tags',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
                      ),
                    ),
                  ),
                ),
              );
            }

            if (idx == allTags.length + 1) {
              return GestureDetector(
                onTap: () => _showAddTagDialog(context, provider),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.4), width: 1.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.plus, size: 13, color: AppTheme.primaryViolet),
                      const SizedBox(width: 4),
                      Text(
                        'Add Tag',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryViolet,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            final tag = allTags[idx - 1];
            final isSelected = provider.selectedCustomTag.toLowerCase() == tag.toLowerCase();
            final count = provider.countForTag(tag);
            final isCustom = provider.customTags.contains(tag);

            return GestureDetector(
              onTap: () => provider.setCustomTag(isSelected ? 'all' : tag),
              onLongPress: isCustom ? () => provider.removeCustomTag(tag) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      LucideIcons.tag,
                      size: 13,
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '#$tag',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryViolet.withValues(alpha: 0.15)
                            : AppTheme.borderSubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$count',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                        ),
                      ),
                    ),
                    if (isCustom) ...[
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => provider.removeCustomTag(tag),
                        child: const Icon(LucideIcons.x, size: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    if (_activeFilterDimension == 'source') {
      final customSources = provider.customSources;
      final allSources = [
        ..._sources,
        ...customSources.map((s) => {
              'id': s,
              'label': s[0].toUpperCase() + s.substring(1),
              'icon': LucideIcons.globe,
              'isCustom': true,
            }),
      ];
      return Container(
        height: 48,
        padding: const EdgeInsets.symmetric(vertical: 6),
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
        ),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: allSources.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (ctx, idx) {
            if (idx == allSources.length) {
              return GestureDetector(
                onTap: () => _showAddCustomSourceDialog(context, provider),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.4), width: 1.0),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.plus, size: 13, color: AppTheme.primaryViolet),
                      const SizedBox(width: 4),
                      Text(
                        'Add Source',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryViolet,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }

            final item = allSources[idx];
            final sourceId = item['id'] as String;
            final label = item['label'] as String;
            final icon = item['icon'] as IconData;
            final isCustom = item['isCustom'] == true;
            final isSelected = provider.selectedSource == sourceId;
            final count = provider.countForSource(sourceId);

            return GestureDetector(
              onTap: () => provider.setSource(sourceId),
              onLongPress: isCustom ? () => provider.removeCustomSource(sourceId) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                    width: isSelected ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 13,
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primaryViolet.withValues(alpha: 0.15)
                            : AppTheme.borderSubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$count',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                        ),
                      ),
                    ),
                    if (isCustom) ...[
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () => provider.removeCustomSource(sourceId),
                        child: const Icon(LucideIcons.x, size: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    // Default: deadline
    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.8)),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _deadlines.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (ctx, idx) {
          if (idx == _deadlines.length) {
            return GestureDetector(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2035),
                );
                if (picked != null) {
                  final dateStr = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                  provider.setDeadlineFilter(dateStr);
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primaryGreenBg.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.4), width: 1.0),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.calendarPlus, size: 13, color: AppTheme.primaryViolet),
                    const SizedBox(width: 4),
                    Text(
                      'Pick Date',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryViolet,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          final item = _deadlines[idx];
          final deadId = item['id'] as String;
          final label = item['label'] as String;
          final icon = item['icon'] as IconData;
          final isSelected = provider.selectedDeadlineFilter == deadId;
          final count = provider.countForDeadline(deadId);

          return GestureDetector(
            onTap: () => provider.setDeadlineFilter(deadId),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                  width: isSelected ? 1.5 : 1.0,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: 13,
                    color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryViolet.withValues(alpha: 0.15)
                          : AppTheme.borderSubtle,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$count',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActiveFiltersSummary(ClipsProvider provider) {
    final activeChips = <Widget>[];

    if (provider.selectedIntent != 'all') {
      activeChips.add(_buildActiveFilterChip(
        'Intent: ${provider.selectedIntent[0].toUpperCase() + provider.selectedIntent.substring(1)}',
        () => provider.setIntent('all'),
      ));
    }
    if (provider.selectedContentType != 'all') {
      activeChips.add(_buildActiveFilterChip(
        'Type: ${provider.selectedContentType[0].toUpperCase() + provider.selectedContentType.substring(1)}',
        () => provider.setContentType('all'),
      ));
    }
    if (provider.selectedSource != 'all') {
      activeChips.add(_buildActiveFilterChip(
        'Source: ${provider.selectedSource[0].toUpperCase() + provider.selectedSource.substring(1)}',
        () => provider.setSource('all'),
      ));
    }
    if (provider.selectedDeadlineFilter != 'all') {
      final match = _deadlines.firstWhere((d) => d['id'] == provider.selectedDeadlineFilter, orElse: () => {'label': provider.selectedDeadlineFilter});
      activeChips.add(_buildActiveFilterChip(
        'Date: ${match['label']}',
        () => provider.setDeadlineFilter('all'),
      ));
    }
    if (provider.selectedCustomTag != 'all') {
      activeChips.add(_buildActiveFilterChip(
        '#${provider.selectedCustomTag}',
        () => provider.setCustomTag('all'),
      ));
    }

    if (activeChips.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      color: AppTheme.surfaceMuted.withValues(alpha: 0.6),
      child: Row(
        children: [
          const Icon(LucideIcons.filter, size: 12, color: AppTheme.primaryViolet),
          const SizedBox(width: 6),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ...activeChips,
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => provider.resetFilters(),
                    child: Text(
                      'Clear all',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.urgencyRed,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveFilterChip(String label, VoidCallback onRemove) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.fromLTRB(8, 2, 4, 2),
      decoration: BoxDecoration(
        color: AppTheme.primaryGreenBg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.primaryVioletLight.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppTheme.primaryViolet,
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(LucideIcons.x, size: 12, color: AppTheme.primaryViolet),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final displayedClips = clipsProvider.clips;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56),
        child: SafeArea(
          top: true,
          bottom: false,
          child: Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: const BoxDecoration(
              color: AppTheme.surface,
              border: Border(
                bottom: BorderSide(color: AppTheme.borderSubtle, width: 1.0),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Title or Batch Mode Count
                Row(
                  children: [
                    if (clipsProvider.isBatchMode)
                      IconButton(
                        icon: const Icon(LucideIcons.x, size: 20, color: AppTheme.textPrimary),
                        onPressed: () => clipsProvider.exitBatchMode(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    if (clipsProvider.isBatchMode) const SizedBox(width: 8),
                    Text(
                      clipsProvider.isBatchMode
                          ? '${clipsProvider.selectedIds.length} Selected'
                          : 'All Clips',
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),

                // Action Icons (Search, View Mode, Filter)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!clipsProvider.isBatchMode) ...[
                      // Search Toggle
                      IconButton(
                        icon: Icon(
                          _isSearching ? LucideIcons.x : LucideIcons.search,
                          size: 20,
                          color: _isSearching ? AppTheme.primaryViolet : AppTheme.textPrimary,
                        ),
                        splashRadius: 20,
                        onPressed: () {
                          setState(() {
                            _isSearching = !_isSearching;
                            if (!_isSearching) {
                              _searchController.clear();
                              clipsProvider.setSearchQuery('');
                            }
                          });
                        },
                      ),
                      // View Mode Switcher
                      IconButton(
                        icon: Icon(
                          _getViewModeIcon(clipsProvider.viewMode),
                          size: 19,
                          color: AppTheme.textPrimary,
                        ),
                        splashRadius: 20,
                        tooltip: 'Switch view layout',
                        onPressed: () => _cycleViewMode(clipsProvider),
                      ),
                      // Filter & Sort Bottom Sheet Trigger
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            icon: const Icon(
                              LucideIcons.slidersHorizontal,
                              size: 20,
                              color: AppTheme.textPrimary,
                            ),
                            splashRadius: 20,
                            onPressed: () => ClipsFilterBottomSheet.show(context),
                          ),
                          if (clipsProvider.hasActiveFilters)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppTheme.urgencyRed,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ] else ...[
                      // Batch Mode: Select All Button
                      TextButton(
                        onPressed: () => clipsProvider.selectAll(),
                        child: Text(
                          'Select All',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryViolet,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Expandable Search Input Bar
          if (_isSearching)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
              color: AppTheme.surface,
              child: TextField(
                controller: _searchController,
                autofocus: true,
                onChanged: (val) => clipsProvider.setSearchQuery(val),
                style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Search title, summary, domain, tags...',
                  hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey, fontSize: 12),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  prefixIcon: const Icon(LucideIcons.search, size: 16, color: AppTheme.textMuted),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 14),
                          onPressed: () {
                            _searchController.clear();
                            clipsProvider.setSearchQuery('');
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AppTheme.primaryViolet),
                  ),
                ),
              ),
            ),

          // Parallel Filter System: Dimension Tabs + Carousel + Active Multi-Filters Bar
          _buildDimensionTabs(clipsProvider),
          _buildDimensionPills(clipsProvider),
          _buildActiveFiltersSummary(clipsProvider),

          // Main Clips List / Grid / Empty State
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => clipsProvider.loadClips(),
              color: AppTheme.primaryViolet,
              child: clipsProvider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryViolet))
                  : displayedClips.isEmpty
                      ? _buildEmptyState(context, clipsProvider)
                      : _buildClipsContent(context, clipsProvider, displayedClips),
            ),
          ),

          // Batch Mode Bottom Floating Action Bar
          if (clipsProvider.isBatchMode) const BatchActionsBar(),
        ],
      ),
    );
  }

  // --- Layout Switcher ---

  Widget _buildClipsContent(
    BuildContext context,
    ClipsProvider provider,
    List<ClipModel> clips,
  ) {
    switch (provider.viewMode) {
      case 'list':
        return ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: clips.length,
          separatorBuilder: (_, index) => const SizedBox(height: 8),
          itemBuilder: (ctx, idx) => _buildCompactListItem(context, provider, clips[idx]),
        );
      case 'grid':
        return GridView.builder(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.78,
          ),
          itemCount: clips.length,
          itemBuilder: (ctx, idx) => _buildGridCardItem(context, provider, clips[idx]),
        );
      case 'cards':
      default:
        return ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: clips.length,
          itemBuilder: (ctx, idx) => _buildRichCardItem(context, provider, clips[idx]),
        );
    }
  }

  // --- View Mode 1: Polymorphic Native Bookmark Card (Default) ---

  Widget _buildRichCardItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    return PolymorphicClipCard(
      clip: clip,
      isSelected: provider.selectedIds.contains(clip.id),
      isBatchMode: provider.isBatchMode,
      onTap: () {
        if (provider.isBatchMode) {
          provider.toggleSelection(clip.id);
        } else {
          ClipDetailBottomSheet.show(context, clip);
        }
      },
      onLongPress: () => provider.enterBatchMode(clip.id),
      onToggleFavorite: () => provider.toggleFavorite(clip.id),
      onToggleSelect: () => provider.toggleSelection(clip.id),
      onDelete: () {
        provider.deleteClip(clip.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Clip removed from vault')),
        );
      },
    );
  }

  // --- View Mode 2: Compact List Item ---

  Widget _buildCompactListItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);
    final isFav = provider.isFavorite(clip.id);

    return GestureDetector(
      onTap: () => ClipDetailBottomSheet.show(context, clip),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: intentStyle.bgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(intentStyle.icon, size: 14, color: intentStyle.textColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clip.title,
                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      SourceBrandBadge(
                        clip: clip,
                        fontSize: 9,
                        iconSize: 10,
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isFav)
              const Padding(
                padding: EdgeInsets.only(left: 6),
                child: Icon(LucideIcons.star, size: 14, color: Color(0xFFF59E0B)),
              ),
          ],
        ),
      ),
    );
  }

  // --- View Mode 3: Grid Card Item ---

  Widget _buildGridCardItem(BuildContext context, ClipsProvider provider, ClipModel clip) {
    final intent = ClipIntentHelper.detectIntent(clip);
    final intentStyle = ClipIntentHelper.getStyle(intent);

    return GestureDetector(
      onTap: () => ClipDetailBottomSheet.show(context, clip),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderSubtle),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: intentStyle.bgColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    intentStyle.label,
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: intentStyle.textColor,
                    ),
                  ),
                ),
                SourceBrandBadge(
                  clip: clip,
                  showFormat: false,
                  fontSize: 8,
                  iconSize: 9,
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              clip.title,
              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            ExtractedMetadataChips(clip: clip, maxChips: 1),
            const Spacer(),
            Text(
              clip.summary,
              style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // --- Empty State ---

  Widget _buildEmptyState(BuildContext context, ClipsProvider provider) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
        Center(
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(LucideIcons.inbox, size: 32, color: AppTheme.inactiveGrey),
              ),
              const SizedBox(height: 16),
              Text(
                provider.allClips.isEmpty
                    ? 'No clips in your vault yet'
                    : 'No clips match your filters',
                style: GoogleFonts.outfit(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                provider.allClips.isEmpty
                    ? 'Save articles, links, or notes to build your vault.'
                    : (provider.hasActiveFilters
                        ? 'Try resetting your intent, status, or search filters.'
                        : 'Save articles, links, or notes to build your vault.'),
                style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                textAlign: TextAlign.center,
              ),
              if (provider.hasActiveFilters) ...[
                const SizedBox(height: 16),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryViolet,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () => provider.resetFilters(),
                  child: const Text('Reset All Filters'),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _AddFilterModal extends StatefulWidget {
  final ClipsProvider provider;
  final String initialTab;
  final Function(String dimension) onFilterApplied;

  const _AddFilterModal({
    required this.provider,
    this.initialTab = 'type',
    required this.onFilterApplied,
  });

  @override
  State<_AddFilterModal> createState() => _AddFilterModalState();
}

class _AddFilterModalState extends State<_AddFilterModal> {
  late String _selectedTab;
  final TextEditingController _inputController = TextEditingController();

  static const List<Map<String, dynamic>> _tabs = [
    {'id': 'type', 'label': 'Content', 'icon': LucideIcons.layers},
    {'id': 'intent', 'label': 'Intent', 'icon': LucideIcons.target},
    {'id': 'tag', 'label': 'Tag', 'icon': LucideIcons.tag},
    {'id': 'source', 'label': 'Source', 'icon': LucideIcons.globe},
    {'id': 'date', 'label': 'Deadline', 'icon': LucideIcons.clock},
  ];

  @override
  void initState() {
    super.initState();
    final tab = widget.initialTab.toLowerCase();
    if (tab == 'intent' || tab == 'type' || tab == 'source' || tab == 'tag') {
      _selectedTab = tab;
    } else if (tab == 'deadline') {
      _selectedTab = 'date';
    } else {
      _selectedTab = 'type';
    }
  }

  static const List<String> _intentSuggestions = [
    'Jobs',
    'Invest',
    'Recipes',
    'Workout',
    'Research',
    'Design',
    'Finance',
    'Travel',
  ];

  static const List<String> _typeSuggestions = [
    'Podcast',
    'Newsletter',
    'Book',
    'Paper',
    'Code',
    'Deal',
    'Course',
    'Guide',
  ];

  static const List<Map<String, String>> _sourceSuggestions = [
    {'id': 'youtube', 'label': 'YouTube'},
    {'id': 'x', 'label': 'Twitter / X'},
    {'id': 'github', 'label': 'GitHub'},
    {'id': 'reddit', 'label': 'Reddit'},
    {'id': 'linkedin', 'label': 'LinkedIn'},
    {'id': 'spotify', 'label': 'Spotify'},
    {'id': 'medium', 'label': 'Medium'},
    {'id': 'substack', 'label': 'Substack'},
    {'id': 'arxiv', 'label': 'ArXiv'},
  ];

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  void _applyFilter({String? directValue}) {
    final text = directValue ?? _inputController.text.trim();
    if (text.isEmpty && _selectedTab != 'date') return;

    if (_selectedTab == 'tag') {
      widget.provider.addCustomTag(text);
      widget.onFilterApplied('tag');
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Filtered by tag: #$text'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    } else if (_selectedTab == 'intent') {
      widget.provider.addCustomIntent(text);
      widget.onFilterApplied('intent');
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Created & applied intent: $text'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    } else if (_selectedTab == 'type') {
      widget.provider.addCustomContentType(text);
      widget.onFilterApplied('type');
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Created & applied content type: $text'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    } else if (_selectedTab == 'source') {
      widget.provider.addCustomSource(text);
      widget.onFilterApplied('source');
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Filtered by source: $text'),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.borderSubtle,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreenBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(LucideIcons.filter, size: 18, color: AppTheme.primaryViolet),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Add Filter',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          Text(
                            'Filter by custom tags, categories, or dates',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, size: 20, color: AppTheme.textMuted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Category Selector Pills
              Container(
                height: 38,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceMuted,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderSubtle, width: 0.8),
                ),
                child: Row(
                  children: _tabs.map((tab) {
                    final isSelected = _selectedTab == tab['id'];
                    return Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedTab = tab['id'] as String;
                            _inputController.clear();
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.surface : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                tab['icon'] as IconData,
                                size: 12,
                                color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted,
                              ),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  tab['label'] as String,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? AppTheme.textPrimary : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 18),

              // Dynamic Body based on selected category
              if (_selectedTab == 'tag') ...[
                _buildTagSection(),
              ] else if (_selectedTab == 'intent') ...[
                _buildIntentSection(),
              ] else if (_selectedTab == 'type') ...[
                _buildTypeSection(),
              ] else if (_selectedTab == 'source') ...[
                _buildSourceSection(),
              ] else if (_selectedTab == 'date') ...[
                _buildDateSection(),
              ],

              const SizedBox(height: 20),
              const Divider(color: AppTheme.borderSubtle, height: 1),
              const SizedBox(height: 12),

              // Shortcut to full filter & sort bottom sheet
              InkWell(
                onTap: () {
                  Navigator.pop(context);
                  ClipsFilterBottomSheet.show(context);
                },
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.slidersHorizontal, size: 15, color: AppTheme.textMuted),
                          const SizedBox(width: 8),
                          Text(
                            'Open Advanced Filters & Sorting',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const Icon(LucideIcons.chevronRight, size: 15, color: AppTheme.textMuted),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTagSection() {
    final allTags = widget.provider.allUniqueTags;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Filter by Tag',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          'Type any custom tag or select one from your saved clips:',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  prefixText: '# ',
                  prefixStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryViolet),
                  hintText: 'e.g. ai, jobs, dev, ideas',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                onSubmitted: (val) => _applyFilter(),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryViolet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                elevation: 0,
              ),
              onPressed: () => _applyFilter(),
              child: Text(
                'Apply',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ],
        ),
        if (allTags.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'Tags in your vault:',
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: allTags.map((tag) {
              final count = widget.provider.countForTag(tag);
              final isCurrent = widget.provider.selectedCustomTag.toLowerCase() == tag.toLowerCase();
              return GestureDetector(
                onTap: () => _applyFilter(directValue: tag),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isCurrent ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isCurrent ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                      width: 1.0,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '#$tag',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                          color: isCurrent ? AppTheme.primaryViolet : AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '($count)',
                        style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildIntentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Add Custom Intent Filter',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          'Create a new intent category. Clips matching this intent or tagged with it will be filtered:',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'e.g. Fitness, Invest, Recipes',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                onSubmitted: (val) => _applyFilter(),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryViolet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                elevation: 0,
              ),
              onPressed: () => _applyFilter(),
              child: Text(
                'Add',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          'Quick suggestions:',
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _intentSuggestions.map((item) {
            return ActionChip(
              label: Text(item, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary)),
              backgroundColor: AppTheme.surfaceMuted,
              side: const BorderSide(color: AppTheme.borderSubtle),
              onPressed: () => _applyFilter(directValue: item),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTypeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Add Custom Content Type Filter',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          'Filter by a custom content type (e.g. podcast, newsletter, course):',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'e.g. Podcast, Book, Newsletter',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                onSubmitted: (val) => _applyFilter(),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryViolet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                elevation: 0,
              ),
              onPressed: () => _applyFilter(),
              child: Text(
                'Add',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          'Quick suggestions:',
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _typeSuggestions.map((item) {
            return ActionChip(
              label: Text(item, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary)),
              backgroundColor: AppTheme.surfaceMuted,
              side: const BorderSide(color: AppTheme.borderSubtle),
              onPressed: () => _applyFilter(directValue: item),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSourceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Filter by Website or Source Domain',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          'Enter any domain (e.g. "news.ycombinator.com", "nytimes.com", "substack"):',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                style: GoogleFonts.inter(fontSize: 14, color: AppTheme.textPrimary),
                decoration: InputDecoration(
                  hintText: 'e.g. medium.com',
                  hintStyle: GoogleFonts.inter(fontSize: 13, color: AppTheme.inactiveGrey),
                  filled: true,
                  fillColor: AppTheme.surfaceMuted,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                onSubmitted: (val) => _applyFilter(),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryViolet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                elevation: 0,
              ),
              onPressed: () => _applyFilter(),
              child: Text(
                'Add',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          'Popular platforms:',
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _sourceSuggestions.map((item) {
            return ActionChip(
              label: Text(item['label']!, style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textPrimary)),
              backgroundColor: AppTheme.surfaceMuted,
              side: const BorderSide(color: AppTheme.borderSubtle),
              onPressed: () => _applyFilter(directValue: item['id']),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDateSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Filter by Deadline & Dates',
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
        const SizedBox(height: 6),
        Text(
          'Filter clips with upcoming deadlines or pick a specific date:',
          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildDateOption('has_deadline', 'Has Deadline', LucideIcons.calendarCheck),
            _buildDateOption('this_week', 'Due This Week', LucideIcons.calendarDays),
            _buildDateOption('overdue', 'Overdue', LucideIcons.circleAlert),
            _buildDateOption('upcoming', 'Upcoming', LucideIcons.arrowUpRight),
          ],
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppTheme.primaryViolet),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          icon: const Icon(LucideIcons.calendarPlus, size: 16, color: AppTheme.primaryViolet),
          label: Text(
            'Pick Specific Calendar Date...',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primaryViolet),
          ),
          onPressed: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(2020),
              lastDate: DateTime(2035),
            );
            if (picked != null) {
              final dateStr = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
              widget.provider.setDeadlineFilter(dateStr);
              widget.onFilterApplied('deadline');
              if (mounted) Navigator.pop(context);
            }
          },
        ),
      ],
    );
  }

  Widget _buildDateOption(String filterId, String label, IconData icon) {
    final isSelected = widget.provider.selectedDeadlineFilter == filterId;
    return GestureDetector(
      onTap: () {
        widget.provider.setDeadlineFilter(filterId);
        widget.onFilterApplied('deadline');
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryGreenBg : AppTheme.surfaceMuted,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: isSelected ? AppTheme.primaryViolet : AppTheme.textMuted),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? AppTheme.primaryViolet : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
