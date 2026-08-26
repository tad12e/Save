import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme.dart';
import '../../services/api_service.dart';

class ServerSettingsModal extends StatefulWidget {
  const ServerSettingsModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => const ServerSettingsModal(),
    );
  }

  @override
  State<ServerSettingsModal> createState() => _ServerSettingsModalState();
}

class _ServerSettingsModalState extends State<ServerSettingsModal> {
  final TextEditingController _urlController = TextEditingController();
  bool _isLoading = true;
  String _currentUrl = '';

  @override
  void initState() {
    super.initState();
    _loadUrl();
  }

  Future<void> _loadUrl() async {
    final url = await ApiService.getBaseUrl();
    if (mounted) {
      setState(() {
        _currentUrl = url;
        _urlController.text = url;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _saveUrl(String url) async {
    await ApiService.setBaseUrl(url);
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Backend URL set to: $url'),
          backgroundColor: AppTheme.surfaceCard,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
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
              Row(
                children: [
                  const Icon(LucideIcons.server, size: 18, color: AppTheme.primaryAmber),
                  const SizedBox(width: 8),
                  Text(
                    'Backend Server Settings',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textWhite,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 18, color: AppTheme.textMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Configure the endpoint for authentication and clipping sync:',
            style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: AppTheme.primaryAmber))
          else ...[
            TextField(
              controller: _urlController,
              style: GoogleFonts.jetBrainsMono(fontSize: 13, color: AppTheme.textWhite),
              decoration: InputDecoration(
                hintText: 'http://localhost:8000',
                hintStyle: GoogleFonts.jetBrainsMono(color: AppTheme.textMuted),
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
            Text(
              'Quick Presets:',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPresetChip('10.0.2.2:8000 (Android)', 'http://10.0.2.2:8000'),
                _buildPresetChip('localhost:8000', 'http://localhost:8000'),
                _buildPresetChip('127.0.0.1:8000', 'http://127.0.0.1:8000'),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryAmber,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () {
                  final text = _urlController.text.trim();
                  if (text.isNotEmpty) {
                    _saveUrl(text);
                  }
                },
                child: Text(
                  'Save Server URL',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPresetChip(String label, String url) {
    final isSelected = _urlController.text.trim() == url;
    return GestureDetector(
      onTap: () {
        setState(() {
          _urlController.text = url;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryAmber.withValues(alpha: 0.15) : AppTheme.background,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? AppTheme.primaryAmber : AppTheme.borderSubtle,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.jetBrainsMono(
            fontSize: 10,
            color: isSelected ? AppTheme.primaryAmber : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }
}
