import React from 'react';
import { motion } from 'framer-motion';
import { ClipItem, CustomCategoryConfig, CustomPageConfig } from '../../types';
import { 
  PlatformSkin, 
  XMeta, 
  YouTubeMeta, 
  RedditMeta, 
  GitHubMeta, 
  LinkedInMeta, 
  InstagramMeta, 
  SpotifyMeta, 
  GenericMeta, 
  resolveSkin 
} from '../../types/clipPlatform';
import { CardFooterChrome, CardHeaderChrome, CardIntentBadges } from './BaseCardChrome';
import { XCardSkin } from './skins/XCardSkin';
import { YouTubeCardSkin } from './skins/YouTubeCardSkin';
import { RedditCardSkin } from './skins/RedditCardSkin';
import { GitHubCardSkin } from './skins/GitHubCardSkin';
import { LinkedInCardSkin } from './skins/LinkedInCardSkin';
import { InstagramCardSkin } from './skins/InstagramCardSkin';
import { SpotifyCardSkin } from './skins/SpotifyCardSkin';
import { GenericCardSkin } from './skins/GenericCardSkin';

export interface PolymorphicClipCardProps {
  clip: ClipItem;
  isDark: boolean;
  isSelected?: boolean;
  onToggleSelect?: (clipId: string) => void;
  onToggleFavorite: (clipId: string) => void;
  onOpenDetail: (clip: ClipItem) => void;
  onDelete: (clipId: string) => void;
  onSync?: (clip: ClipItem, destType: string) => void;
  isSynced?: boolean;
  customCategories?: CustomCategoryConfig[];
  customPages?: CustomPageConfig[];
  showCheckbox?: boolean;
  layoutMode?: 'grid' | 'list';
}

/**
 * Polymorphic Clip Card Shell (Parts 4-9).
 * Routes clips dynamically to platform-native bookmark skins:
 * - X / Twitter (`XCardSkin`)
 * - YouTube (`YouTubeCardSkin`)
 * - Reddit (`RedditCardSkin`)
 * - GitHub (`GitHubCardSkin`)
 * - LinkedIn (`LinkedInCardSkin`)
 * - Instagram (`InstagramCardSkin`)
 * - Spotify (`SpotifyCardSkin`)
 * - Editorial & Longform Articles (`GenericCardSkin`)
 *
 * Performance Contract:
 * - ZERO iframes & ZERO external widget scripts.
 * - Sub-millisecond render & 60 FPS scrolling performance.
 */
export const PolymorphicClipCard: React.FC<PolymorphicClipCardProps> = (props) => {
  const { clip, isDark, isSelected, onOpenDetail } = props;
  const skin: PlatformSkin = clip.platformMeta?.skin || resolveSkin(clip.sourcePlatform, clip.url);

  const isXSkin = skin === 'x';
  const isLinkedInSkin = skin === 'linkedin';
  const isRedditSkin = skin === 'reddit';
  const isNativePostSkin = isXSkin || isLinkedInSkin || isRedditSkin;

  // Common card container styling (with authentic native dark mode styling)
  const cardBorderClass = isSelected
    ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
    : isXSkin
      ? isDark
        ? 'border-[#2F3336] hover:border-[#43494E]'
        : 'border-[#EFF3F4] hover:border-[#CFD9DE]'
      : isLinkedInSkin
        ? isDark
          ? 'border-[#383E45] hover:border-[#525B65]'
          : 'border-slate-200 hover:border-slate-300'
        : isRedditSkin
          ? isDark
            ? 'border-[#2E3236] hover:border-[#454B52]'
            : 'border-slate-200 hover:border-slate-300'
          : isDark
            ? 'border-[#222222] hover:border-[#383838]'
            : 'border-slate-200 hover:border-slate-300';

  const cardBgClass = isSelected
    ? isDark ? 'bg-[#141815]' : 'bg-emerald-50/40'
    : isXSkin
      ? isDark
        ? 'bg-[#000000] hover:bg-[#030303]'
        : 'bg-white hover:shadow-md'
      : isLinkedInSkin
        ? isDark
          ? 'bg-[#1B1F23] hover:bg-[#1E2328]'
          : 'bg-white hover:shadow-md'
        : isRedditSkin
          ? isDark
            ? 'bg-[#0E1113] hover:bg-[#121518]'
            : 'bg-white hover:shadow-md'
          : isDark
            ? 'bg-[#0D0D0D] hover:bg-[#121212]'
            : 'bg-white hover:shadow-md';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpenDetail(clip)}
      className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-start h-fit w-full break-inside-avoid ${
        isNativePostSkin ? 'p-3.5 sm:p-4 gap-2.5' : 'p-4 sm:p-5 gap-3'
      } relative shadow-sm cursor-pointer ${cardBorderClass} ${cardBgClass}`}
    >
      {/* Shared Header Chrome (suppressed for X and LinkedIn so the native post header is top-level) */}
      {!isNativePostSkin && (
        <CardHeaderChrome
          clip={clip}
          isDark={isDark}
          isSelected={isSelected}
          onToggleSelect={props.onToggleSelect}
          onToggleFavorite={props.onToggleFavorite}
          showCheckbox={props.showCheckbox}
        />
      )}

      {/* Platform-Specific Body Content */}
      <PlatformCardBody skin={skin} {...props} />

      {/* Shared Intent & Metadata Badges */}
      <CardIntentBadges
        clip={clip}
        isDark={isDark}
        customCategories={props.customCategories}
        customPages={props.customPages}
      />

      {/* Shared Footer Chrome */}
      <CardFooterChrome
        clip={clip}
        isDark={isDark}
        onOpenDetail={onOpenDetail}
        onDelete={props.onDelete}
        onSync={props.onSync}
        isSynced={props.isSynced}
      />
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Platform-Specific Card Body Dispatcher
// ---------------------------------------------------------------------------
interface PlatformCardBodyProps extends PolymorphicClipCardProps {
  skin: PlatformSkin;
}

const PlatformCardBody: React.FC<PlatformCardBodyProps> = ({ skin, clip, isDark, onOpenDetail, ...rest }) => {
  const meta = clip.platformMeta;

  switch (skin) {
    case 'x':
      return (
        <XCardSkin
          clip={clip}
          meta={meta as XMeta | undefined}
          isDark={isDark}
          isSelected={rest.isSelected}
          onToggleSelect={rest.onToggleSelect}
          onToggleFavorite={rest.onToggleFavorite}
          showCheckbox={rest.showCheckbox}
          onOpenDetail={onOpenDetail}
        />
      );
    case 'linkedin':
      return (
        <LinkedInCardSkin
          clip={clip}
          meta={meta as LinkedInMeta | undefined}
          isDark={isDark}
          isSelected={rest.isSelected}
          onToggleSelect={rest.onToggleSelect}
          onToggleFavorite={rest.onToggleFavorite}
          showCheckbox={rest.showCheckbox}
          onOpenDetail={onOpenDetail}
        />
      );
    case 'youtube':
      return <YouTubeCardSkin clip={clip} meta={meta as YouTubeMeta | undefined} isDark={isDark} onOpenDetail={onOpenDetail} />;
    case 'reddit':
      return (
        <RedditCardSkin
          clip={clip}
          meta={meta as RedditMeta | undefined}
          isDark={isDark}
          isSelected={rest.isSelected}
          onToggleSelect={rest.onToggleSelect}
          onToggleFavorite={rest.onToggleFavorite}
          showCheckbox={rest.showCheckbox}
          onOpenDetail={onOpenDetail}
        />
      );
    case 'github':
      return <GitHubCardSkin clip={clip} meta={meta as GitHubMeta | undefined} isDark={isDark} onOpenDetail={onOpenDetail} />;
    case 'instagram':
      return <InstagramCardSkin clip={clip} meta={meta as InstagramMeta | undefined} isDark={isDark} onOpenDetail={onOpenDetail} />;
    case 'spotify':
      return <SpotifyCardSkin clip={clip} meta={meta as SpotifyMeta | undefined} isDark={isDark} onOpenDetail={onOpenDetail} />;
    case 'generic':
    default:
      return <GenericCardSkin clip={clip} meta={meta as GenericMeta | undefined} isDark={isDark} onOpenDetail={onOpenDetail} />;
  }
};
