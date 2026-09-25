import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../../core/theme.dart';
import '../../../providers/clips_provider.dart';
import '../../../services/api_service.dart';

class BatchDestinationSheet extends StatefulWidget {
  const BatchDestinationSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const BatchDestinationSheet(),
    );
  }

  @override
  State<BatchDestinationSheet> createState() => _BatchDestinationSheetState();
}

class _BatchDestinationSheetState extends State<BatchDestinationSheet> {
  String? _selectedDestinationId;
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ClipsProvider>(context, listen: false);
      if (provider.destinations.isEmpty) {
        provider.loadDestinations();
      }
    });
  }

  IconData _getDestinationIcon(String provider) {
    final p = provider.toLowerCase();
    if (p.contains('notion')) return LucideIcons.fileText;
    if (p.contains('sheet') || p.contains('google')) return LucideIcons.table;
    if (p.contains('airtable')) return LucideIcons.layoutGrid;
    if (p.contains('obsidian')) return LucideIcons.bookOpen;
    if (p.contains('spotify')) return LucideIcons.headphones;
    return LucideIcons.cloud;
  }

  Color _getDestinationColor(String provider) {
    final p = provider.toLowerCase();
    if (p.contains('notion')) return const Color(0xFF000000);
    if (p.contains('sheet') || p.contains('google')) return const Color(0xFF0F9D58);
    if (p.contains('airtable')) return const Color(0xFF26B5F8);
    if (p.contains('obsidian')) return const Color(0xFF7C3AED);
    if (p.contains('spotify')) return const Color(0xFF1DB954);
    return AppTheme.primaryViolet;
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<ClipsProvider>(context);
    final selectedCount = provider.selectedIds.length;
    final destinations = provider.destinations.isNotEmpty
        ? provider.destinations
        : const [
            SaveDestination(id: 'google_sheets', name: 'Google Sheets', provider: 'google_sheets', isDefault: true),
            SaveDestination(id: 'notion', name: 'Notion Workspace', provider: 'notion', isDefault: false),
            SaveDestination(id: 'obsidian', name: 'Obsidian Vault', provider: 'obsidian', isDefault: false),
            SaveDestination(id: 'airtable', name: 'Airtable Base', provider: 'airtable', isDefault: false),
            SaveDestination(id: 'vault', name: 'Save Vault (Cloud)', provider: 'vault', isDefault: false),
          ];

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: const BoxDecoration(
        color: AppTheme.surfaceCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
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
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryVioletBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(LucideIcons.cloudUpload, size: 20, color: AppTheme.primaryViolet),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Push $selectedCount Clips',
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'Select a synced destination to export selected clips',
                        style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Destination List
            ConstrainedBox(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.40,
              ),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: destinations.length,
                separatorBuilder: (_, index) => const SizedBox(height: 8),
                itemBuilder: (ctx, idx) {
                  final dest = destinations[idx];
                  final isSelected = _selectedDestinationId == dest.id ||
                      (_selectedDestinationId == null && dest.isDefault);
                  final color = _getDestinationColor(dest.provider);
                  final icon = _getDestinationIcon(dest.provider);

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedDestinationId = dest.id;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? color.withValues(alpha: 0.08) : AppTheme.surfaceMuted,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? color : AppTheme.borderSubtle,
                          width: isSelected ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(icon, size: 16, color: color),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  dest.name,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                Text(
                                  dest.provider.toUpperCase(),
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: color,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            isSelected ? LucideIcons.circleCheck : LucideIcons.circle,
                            size: 20,
                            color: isSelected ? color : AppTheme.inactiveGrey,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryViolet,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: _isSyncing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(LucideIcons.send, size: 16),
                label: Text(
                  _isSyncing ? 'Syncing...' : 'Sync $selectedCount Clips Now',
                  style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                onPressed: _isSyncing
                    ? null
                    : () async {
                        final nav = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        setState(() => _isSyncing = true);
                        final targetDestId = _selectedDestinationId ??
                            (destinations.isNotEmpty ? destinations.first.id : 'vault');
                        final destObj = destinations.firstWhere(
                          (d) => d.id == targetDestId,
                          orElse: () => destinations.first,
                        );

                        final syncedCount = await provider.pushSelectedClipsToDestination(targetDestId);
                        if (!mounted) return;
                        setState(() => _isSyncing = false);
                        nav.pop();

                        messenger.showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(LucideIcons.circleCheck, color: Colors.white, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Successfully pushed $syncedCount clip(s) to ${destObj.name}!',
                                    style: GoogleFonts.inter(fontSize: 13),
                                  ),
                                ),
                              ],
                            ),
                            backgroundColor: AppTheme.primaryGreen,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
