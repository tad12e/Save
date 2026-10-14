import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/sharing_service.dart';

/// Ultra-fast zero-UI invisible overlay for Auto Mode.
///
/// Keeps Instagram/TikTok/YouTube 100% uninterrupted:
/// - ZERO visual overlays, zero modals, zero pills, zero dark scrim.
/// - Closes immediately so the user stays in the source app without freezing.
/// - Saves directly in the background and displays a native system Toast.
class AutoSaveOverlay extends StatefulWidget {
  final String url;
  final String? note;
  final String? platform;
  final String? defaultDestinationId;
  final bool isExternalShare;

  const AutoSaveOverlay({
    super.key,
    required this.url,
    this.note,
    this.platform,
    this.defaultDestinationId,
    this.isExternalShare = true,
  });

  @override
  State<AutoSaveOverlay> createState() => _AutoSaveOverlayState();
}

class _AutoSaveOverlayState extends State<AutoSaveOverlay> {
  @override
  void initState() {
    super.initState();
    // Dismiss instantly in 0ms so Instagram never loses focus or renders any window
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.isExternalShare) {
        SharingService.closeShareOverlay();
        SystemNavigator.pop();
      } else {
        if (mounted && Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        }
      }
    });
    _performAutoSaveInBackground();
  }

  String _formatDestination(String? id) {
    if (id == null || id.isEmpty || id == 'google_sheets') return 'Google Sheets';
    if (id == 'notion') return 'Notion';
    if (id == 'spotify') return 'Spotify';
    if (id == 'vault') return 'Vault';
    return id.replaceAll('_', ' ');
  }

  Future<void> _performAutoSaveInBackground() async {
    final cleanUrl = widget.url.trim();
    if (cleanUrl.isEmpty) return;

    try {
      final res = await ApiService.saveClipDetailed(
        url: cleanUrl,
        selectedText: widget.note,
        destinationId: widget.defaultDestinationId ?? 'google_sheets',
        note: widget.note,
      );

      final label = res.destinationName ?? _formatDestination(widget.defaultDestinationId);
      final toastMsg = res.duplicate
          ? '⚡ Clipper: Already in $label'
          : '⚡ Clipper: Saved to $label!';

      SharingService.showToast(toastMsg);
    } catch (_) {
      SharingService.showToast('⚡ Clipper: Connection error');
    }
  }

  @override
  Widget build(BuildContext context) {
    // 100% invisible: zero scrim, zero pill, zero modal covering the screen!
    return const SizedBox.shrink();
  }
}
