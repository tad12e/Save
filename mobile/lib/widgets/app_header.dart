import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/theme.dart';

enum HeaderVariation { home, list, inner }

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final HeaderVariation variation;
  
  // Variation 1 (Home)
  final String greeting;
  final String subtitle;
  final String userInitials;
  final int notificationCount;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onAvatarTap;

  // Variation 2 (List)
  final String title;
  final VoidCallback? onSearchTap;
  final VoidCallback? onFilterTap;

  // Variation 3 (Inner)
  final VoidCallback? onBackTap;
  final Widget? actionWidget;

  const AppHeader._({
    super.key,
    required this.variation,
    this.greeting = 'Good morning, Tadiwos 👋',
    this.subtitle = 'You have 3 items expiring soon',
    this.userInitials = 'T',
    this.notificationCount = 2,
    this.onNotificationTap,
    this.onAvatarTap,
    this.title = '',
    this.onSearchTap,
    this.onFilterTap,
    this.onBackTap,
    this.actionWidget,
  });

  // Factory constructor for Variation 1 — Home Screen Header
  factory AppHeader.home({
    Key? key,
    String greeting = 'Good morning, Tadiwos 👋',
    String subtitle = 'You have 3 items expiring soon',
    String userInitials = 'T',
    int notificationCount = 2,
    VoidCallback? onNotificationTap,
    VoidCallback? onAvatarTap,
  }) {
    return AppHeader._(
      key: key,
      variation: HeaderVariation.home,
      greeting: greeting,
      subtitle: subtitle,
      userInitials: userInitials,
      notificationCount: notificationCount,
      onNotificationTap: onNotificationTap,
      onAvatarTap: onAvatarTap,
    );
  }

  // Factory constructor for Variation 2 — List Screen Header (Clips, Jobs)
  factory AppHeader.list({
    Key? key,
    required String title,
    VoidCallback? onSearchTap,
    VoidCallback? onFilterTap,
  }) {
    return AppHeader._(
      key: key,
      variation: HeaderVariation.list,
      title: title,
      onSearchTap: onSearchTap,
      onFilterTap: onFilterTap,
    );
  }

  // Factory constructor for Variation 3 — Inner Screen Header (Settings, Detail)
  factory AppHeader.inner({
    Key? key,
    required String title,
    VoidCallback? onBackTap,
    Widget? actionWidget,
  }) {
    return AppHeader._(
      key: key,
      variation: HeaderVariation.inner,
      title: title,
      onBackTap: onBackTap,
      actionWidget: actionWidget,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: true,
      bottom: false,
      child: Container(
        height: 56,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: const BoxDecoration(
          color: AppTheme.background,
          border: Border(
            bottom: BorderSide(color: AppTheme.borderSubtle, width: 0.5),
          ),
        ),
        child: _buildContent(context),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    switch (variation) {
      case HeaderVariation.home:
        return _buildHomeHeader(context);
      case HeaderVariation.list:
        return _buildListHeader(context);
      case HeaderVariation.inner:
        return _buildInnerHeader(context);
    }
  }

  // Variation 1: Home screen header
  Widget _buildHomeHeader(BuildContext context) {
    return Row(
      children: [
        // Left: App logo mark (small, 24px)
        Container(
          width: 24,
          height: 24,
          margin: const EdgeInsets.only(right: 10),
          decoration: BoxDecoration(
            color: AppTheme.primaryViolet,
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Center(
            child: Icon(
              LucideIcons.bookmark,
              size: 14,
              color: Colors.white,
            ),
          ),
        ),
        // Greeting text + expiring subtext
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                greeting,
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textWhite,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 1),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        // Notification bell with red badge count
        GestureDetector(
          onTap: onNotificationTap,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
                ),
                child: const Center(
                  child: Icon(
                    LucideIcons.bell,
                    size: 18,
                    color: AppTheme.textWhite,
                  ),
                ),
              ),
              if (notificationCount > 0)
                Positioned(
                  top: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: AppTheme.urgencyRed,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      notificationCount > 9 ? '9+' : '$notificationCount',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        // Avatar circle (initials or photo)
        GestureDetector(
          onTap: onAvatarTap,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryViolet, AppTheme.primaryVioletLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white24, width: 1),
            ),
            child: Center(
              child: Text(
                userInitials,
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Variation 2: List screen header (Clips, Jobs)
  Widget _buildListHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Left: Screen title Bold, 22px, weight 500
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w500,
            color: AppTheme.textWhite,
          ),
        ),
        // Right: Search icon + Filter icon
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (onSearchTap != null)
              IconButton(
                icon: const Icon(LucideIcons.search, size: 20, color: AppTheme.textWhite),
                onPressed: onSearchTap,
                splashRadius: 20,
              ),
            if (onFilterTap != null)
              IconButton(
                icon: const Icon(LucideIcons.slidersHorizontal, size: 20, color: AppTheme.textWhite),
                onPressed: onFilterTap,
                splashRadius: 20,
              ),
          ],
        ),
      ],
    );
  }

  // Variation 3: Inner screen header (Settings, Detail)
  Widget _buildInnerHeader(BuildContext context) {
    return Row(
      children: [
        // Left: Back arrow
        IconButton(
          icon: const Icon(LucideIcons.arrowLeft, size: 20, color: AppTheme.textWhite),
          onPressed: onBackTap ?? () => Navigator.of(context).maybePop(),
          splashRadius: 20,
        ),
        // Center: Screen title (centred)
        Expanded(
          child: Center(
            child: Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: AppTheme.textWhite,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        // Right: Action button (edit, share, delete) or spacer to balance
        if (actionWidget != null)
          actionWidget!
        else
          const SizedBox(width: 48), // Balances the back button width
      ],
    );
  }
}
