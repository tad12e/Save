import React, { useState } from 'react';
import { Play, Check, Flame } from 'lucide-react';
import { ClipItem } from '../../../types';
import { YouTubeMeta, formatCompactCount, formatDuration, youtubeThumbnail } from '../../../types/clipPlatform';

interface YouTubeCardSkinProps {
  clip: ClipItem;
  meta?: YouTubeMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Client-side video_id fallback parser from URL
function extractVideoId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:watch\?v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : undefined;
}

function formatPublishDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return '';
  }
}

// Authentic YouTube Logo SVG
const YouTubeLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-3.5' }) => (
  <svg viewBox="0 0 28 20" aria-hidden="true" className={className} fill="none">
    <path
      d="M27.42 3.09a3.5 3.5 0 0 0-2.46-2.48C22.78.07 14 .07 14 .07s-8.78 0-10.96.54A3.5 3.5 0 0 0 .58 3.09 36.7 36.7 0 0 0 0 9.87a36.7 36.7 0 0 0 .58 6.78 3.5 3.5 0 0 0 2.46 2.48C5.22 19.67 14 19.67 14 19.67s8.78 0 10.96-.54a3.5 3.5 0 0 0 2.46-2.48 36.7 36.7 0 0 0 .58-6.78 36.7 36.7 0 0 0-.58-6.78Z"
      fill="#FF0000"
    />
    <path d="M11.2 14.13 18.47 9.9 11.2 5.66v8.47Z" fill="#FFFFFF" />
  </svg>
);

// Shorts S-Icon SVG
const ShortsIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.77 10.32l-1.2-.5a3.86 3.86 0 0 0-.58-.2 3.32 3.32 0 0 0-.82-.1 3.5 3.5 0 0 0-2.42.97l-3.3 3.3a1.5 1.5 0 0 1-2.12-2.12l3.3-3.3a3.5 3.5 0 0 0-4.95-4.95l-3.3 3.3A3.5 3.5 0 0 0 7.32 11.7l1.2.5c.19.08.38.15.58.2a3.32 3.32 0 0 0 .82.1 3.5 3.5 0 0 0 2.42-.97l3.3-3.3a1.5 1.5 0 0 1 2.12 2.12l-3.3 3.3a3.5 3.5 0 0 0 4.95 4.95l3.3-3.3a3.5 3.5 0 0 0-4.94-4.98z" />
  </svg>
);

/**
 * Native YouTube Video Bookmark Card Skin (Part 6).
 * Features:
 * - 16:9 thumbnail with zero <iframe> dependencies.
 * - Duration badge and Shorts badge overlay.
 * - Channel avatar with hover glow.
 * - Bold 2-line title clamp.
 * - View counts and relative published timestamp.
 */
export const YouTubeCardSkin: React.FC<YouTubeCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const videoId = meta?.video_id || extractVideoId(clip.url);
  const isShort = meta?.is_short || clip.url.includes('/shorts/');
  const channelName = meta?.channel || clip.sourceAuthor?.replace(/^@/, '') || 'YouTube Creator';
  const channelAvatar = meta?.channel_avatar;
  const durationSec = meta?.duration;
  const views = meta?.views;
  const publishedDate = formatPublishDate(meta?.published_at || clip.createdAt);

  const [thumbError, setThumbError] = useState(false);
  const primaryThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;
  const fallbackThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined;

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* ─── Subagent A: 16:9 Video Thumbnail with Overlays (Zero Iframes) ─── */}
      <div
        onClick={() => onOpenDetail(clip)}
        className="w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden relative bg-black/40 group-hover:shadow-lg transition-all cursor-pointer border border-black/10 dark:border-white/10"
      >
        {primaryThumb && (
          <img
            src={thumbError ? fallbackThumb : primaryThumb}
            alt={clip.title}
            loading="lazy"
            onError={() => setThumbError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}

        {/* Hover Center Play Pill */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
          <div className="w-12 h-12 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Top-Right YouTube Logo */}
        <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm p-1 rounded-md">
          <YouTubeLogo className="w-5 h-3.5" />
        </div>

        {/* Top-Left Shorts Pill */}
        {isShort && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#FF0000] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <ShortsIcon className="w-3 h-3 fill-white" />
            <span>Shorts</span>
          </div>
        )}

        {/* Bottom-Right Duration Badge */}
        {durationSec && !isShort && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-black/85 backdrop-blur-xs text-white shadow-sm border border-white/10">
            {formatDuration(durationSec)}
          </div>
        )}
      </div>

      {/* ─── Subagent B: Channel & Title Info ─── */}
      <div className="flex items-start gap-3 pt-0.5">
        {/* Channel Avatar (36x36 circular) */}
        <div className="relative w-9 h-9 rounded-full shrink-0 overflow-hidden bg-red-600/20 text-red-500 flex items-center justify-center text-xs font-bold border border-black/10 dark:border-white/10">
          {channelAvatar ? (
            <img
              src={channelAvatar}
              alt={channelName}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span>{channelName[0]?.toUpperCase() || 'Y'}</span>
          )}
        </div>

        {/* Video Title, Channel, & Stats Column */}
        <div className="flex flex-col min-w-0 flex-1 leading-tight gap-1">
          {/* Bold 2-line Video Title */}
          <h3
            onClick={() => onOpenDetail(clip)}
            className={`font-semibold text-[14px] sm:text-[15px] leading-[20px] line-clamp-2 transition-colors cursor-pointer ${
              isDark ? 'text-white group-hover:text-red-400' : 'text-slate-900 group-hover:text-red-600'
            }`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
            title={clip.title}
          >
            {clip.title}
          </h3>

          {/* Channel Name */}
          <div className="flex items-center gap-1 text-[12px] text-[#AAAAAA] dark:text-[#AAAAAA] font-normal truncate">
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(clip.url, '_blank', 'noopener,noreferrer');
              }}
              className="truncate hover:text-white transition-colors cursor-pointer"
              title={channelName}
            >
              {channelName}
            </span>
            <span className="w-3 h-3 rounded-full bg-slate-700/60 text-slate-300 flex items-center justify-center text-[8px] shrink-0" title="Verified Creator">
              ✓
            </span>
          </div>

          {/* Views & Time Ago */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-[#888888] dark:text-[#888888]">
            {views !== undefined && (
              <>
                <span>{formatCompactCount(views)} views</span>
                <span className="opacity-50">•</span>
              </>
            )}
            <span>{publishedDate || 'Recently'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
