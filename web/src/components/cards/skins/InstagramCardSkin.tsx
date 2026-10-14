import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Film, 
  Layers, 
  Play, 
  ExternalLink 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { InstagramMeta, formatCompactCount } from '../../../types/clipPlatform';

interface InstagramCardSkinProps {
  clip: ClipItem;
  meta?: InstagramMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Authentic Instagram Gradient Logo SVG
const InstagramLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig-grad)" />
  </svg>
);

// Highlights mentions (@) and hashtags (#)
function renderInstagramCaption(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\s+|#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span key={index} className="text-sky-400 font-medium hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Native Instagram Bookmark Card Skin (Part 9).
 * Replicates the visual aesthetic of Instagram posts & reels:
 * - Author row with story-ring avatar and handle.
 * - Single / multi-image media grid or Reel play overlay.
 * - Bold handle prefix caption with hashtag highlighting.
 * - Engagement bar (heart likes, comments, share).
 * - Zero iframes, zero third-party webviews.
 */
export const InstagramCardSkin: React.FC<InstagramCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const [liked, setLiked] = useState(false);

  // Clean, non-empty handle resolution
  const handle = React.useMemo(() => {
    if (meta?.handle && meta.handle.trim() && meta.handle.trim() !== '@') {
      return meta.handle.startsWith('@') ? meta.handle : `@${meta.handle}`;
    }
    if (clip.sourceAuthor && clip.sourceAuthor.trim() && clip.sourceAuthor.trim() !== '@') {
      const clean = clip.sourceAuthor.replace(/^@+/, '').trim();
      if (clean && clean.toLowerCase() !== 'instagram') {
        return `@${clean}`;
      }
    }
    try {
      const pathname = new URL(clip.url).pathname;
      const segs = pathname.split('/').filter(Boolean);
      if (segs.length >= 2 && (segs[1] === 'reel' || segs[1] === 'reels' || segs[1] === 'p')) {
        const user = segs[0];
        if (!['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'].includes(user.toLowerCase())) {
          return `@${user}`;
        }
      }
    } catch (_) {}
    return '@instagram_creator';
  }, [meta?.handle, clip.sourceAuthor, clip.url]);

  const cleanHandle = handle.replace('@', '');
  const avatar = meta?.avatar;
  const isReel = Boolean(meta?.is_reel || clip.url?.includes('/reel/') || clip.url?.includes('/reels/'));

  // Shortcode extraction & thumbnail fallback
  const shortcode = React.useMemo(() => {
    const match = clip.url?.match(/instagram\.com\/(?:[^/]+\/)?(?:reel|reels|p)\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  }, [clip.url]);

  const media = React.useMemo(() => {
    if (meta?.media && meta.media.length > 0 && meta.media[0]) {
      return meta.media;
    }
    const extraThumb = (clip.extra_metadata as any)?.thumbnail || (clip.extra_metadata as any)?.og_image;
    if (extraThumb) {
      return [extraThumb];
    }
    if (shortcode) {
      return [`https://www.instagram.com/p/${shortcode}/media/?size=l`];
    }
    return [];
  }, [meta?.media, clip.extra_metadata, shortcode]);

  const likes = meta?.likes ?? 384;

  // Sanitize caption boilerplate
  const caption = React.useMemo(() => {
    const raw = clip.summary || clip.title || '';
    let cleaned = raw
      .replace(/(?i)\b(?:instagram\s+)?meta\s+about\s+blog\s+jobs\s+help\s+api\s+privacy\s+terms\b.*/gi, '')
      .replace(/(?i)\bpopular\s+instagram\s+lite\s+threads\b.*/gi, '')
      .replace(/(?i)\blog\s*in\s+to\s+see\s+(?:photos|videos|posts)\b.*/gi, '')
      .replace(/(?i)\binstagram\s+instagram\s+meta\b.*/gi, '')
      .trim();

    if (!cleaned || cleaned.toLowerCase() === 'instagram' || cleaned.toLowerCase() === 'reel') {
      return isReel ? `Watch this Reel by @${cleanHandle} on Instagram` : `View post by @${cleanHandle} on Instagram`;
    }
    return cleaned;
  }, [clip.summary, clip.title, isReel, cleanHandle]);

  return (
    <div className="flex flex-col gap-2.5 font-sans select-text">
      {/* ─── Header: Author Header & Story Ring ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Avatar with Gradient Story Ring */}
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                loading="lazy"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-black/40"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white ring-2 ring-black/40">
                {cleanHandle.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Handle */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className={`font-semibold text-xs truncate hover:underline cursor-pointer ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {handle}
          </span>

          {/* Reel Badge */}
          {isReel && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 shrink-0">
              <Film className="w-2.5 h-2.5" />
              <span>REEL</span>
            </span>
          )}
        </div>

        {/* Instagram Logo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="hover:scale-110 transition-transform p-1 shrink-0"
          title="Open on Instagram"
        >
          <InstagramLogo className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Media Showcase: Reel (4:5 vertical) vs Post (1:1 square) ─── */}
      <div
        onClick={() => onOpenDetail(clip)}
        className={`relative rounded-2xl overflow-hidden bg-black/20 border border-white/10 group/media cursor-pointer ${
          isReel ? 'aspect-[4/5] bg-gradient-to-br from-[#260838] via-[#0F0B18] to-[#330C28]' : 'aspect-square bg-black/30'
        }`}
      >
        {media.length > 0 ? (
          media.length === 1 ? (
            <img
              src={media[0]}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/media:scale-102"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full p-1 bg-black/40">
              {media.slice(0, 4).map((imgUrl, i) => (
                <div key={i} className="relative w-full h-full rounded-lg overflow-hidden bg-black/30">
                  <img
                    src={imgUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 text-white">
              {isReel ? <Film className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </div>
            <span className="text-xs font-semibold text-white/90">
              {isReel ? 'Instagram Reel' : 'Instagram Post'}
            </span>
            <span className="text-[10px] text-white/60 mt-0.5">@{cleanHandle}</span>
          </div>
        )}

        {/* Carousel multi-photo icon badge */}
        {media.length > 1 && (
          <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/60 backdrop-blur-sm text-white border border-white/10">
            <Layers className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Reel Play Overlay */}
        {isReel && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-lg shadow-fuchsia-500/20 group-hover/media:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Reel Audio Tag Chip at bottom */}
        {isReel && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 text-[10px] border border-white/10 pointer-events-none">
            <Film className="w-3 h-3 text-fuchsia-400 shrink-0" />
            <span className="truncate">Original audio • @{cleanHandle}</span>
          </div>
        )}
      </div>

      {/* ─── Caption Snippet ─── */}
      <p
        onClick={() => onOpenDetail(clip)}
        className={`text-xs leading-[18px] line-clamp-2 cursor-pointer ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        <span className={`font-semibold mr-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{cleanHandle}</span>
        {renderInstagramCaption(caption)}
      </p>

      {/* ─── Engagement Bar ─── */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5 select-none font-mono">
        {/* Like / Comment / Send */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            className={`flex items-center gap-1 transition-colors ${
              liked ? 'text-rose-500' : isDark ? 'text-[#888888] hover:text-rose-500' : 'text-slate-500 hover:text-rose-500'
            }`}
            title="Like"
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
            <span className="text-[11px] font-semibold">
              {formatCompactCount(liked ? likes + 1 : likes)}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className={`flex items-center gap-1 transition-colors ${
              isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Comment on Instagram"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(clip.url);
            }}
            className={`flex items-center gap-1 transition-colors ${
              isDark ? 'text-[#888888] hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Share"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View on IG */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
            isDark ? 'text-[#888888] hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Open in Instagram"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
