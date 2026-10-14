import React, { useState } from 'react';
import { 
  ThumbsUp, 
  MessageSquare, 
  Repeat2, 
  Send, 
  Globe, 
  Star, 
  Check, 
  MoreHorizontal, 
  Heart,
  Sparkles
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { LinkedInMeta, formatCompactCount } from '../../../types/clipPlatform';

export interface LinkedInCardSkinProps {
  clip: ClipItem;
  meta?: LinkedInMeta;
  isDark: boolean;
  isSelected?: boolean;
  onToggleSelect?: (clipId: string) => void;
  onToggleFavorite?: (clipId: string) => void;
  showCheckbox?: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Authentic LinkedIn Vector Logo
export const LinkedInLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46V10.9M7.86 6.81a1.63 1.63 0 0 0-1.63 1.63 1.63 1.63 0 0 0 1.63 1.63 1.63 1.63 0 0 0 1.63-1.63c0-.9-.73-1.63-1.63-1.63Z" />
  </svg>
);

// Relative LinkedIn Timestamp (e.g. 2d, 1w, 3mo)
function formatLinkedInTime(dateStr?: string): string {
  if (!dateStr) return '2d';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2d';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffHours < 24) return `${Math.max(1, diffHours)}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 5) return `${diffWeeks}w`;
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${Math.floor(diffDays / 365)}y`;
  } catch {
    return '2d';
  }
}

// Formats professional post text, highlighting hashtags, mentions, and links
function renderLinkedInText(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\s+|#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.linkedin.com/feed/hashtag/${part.slice(1)}/`, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#0A66C2] dark:text-[#70B5F9] font-medium hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(part.slice(1))}`, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#0A66C2] dark:text-[#70B5F9] font-medium hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      const displayUrl = part.replace(/^https?:\/\/(?:www\.)?/, '');
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(part, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#0A66C2] dark:text-[#70B5F9] hover:underline cursor-pointer"
        >
          {displayUrl.length > 30 ? `${displayUrl.slice(0, 27)}...` : displayUrl}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Authentic Native LinkedIn Post Skin.
 * Replicates the real LinkedIn web & mobile feed experience:
 * - 3-line author header (Name + Connection · Headline · Timestamp + Globe 🌐)
 * - Authentic post typography with rich #hashtags, @mentions, and "...see more" toggle
 * - Embedded article banner with uppercase DOMAIN.COM pill and headline
 * - Signature overlapping reaction bubbles (👍 Celebrate 👏 Love ❤️) + count + comments
 * - Iconic 4-Action Bar with labeled buttons (Like, Comment, Repost, Send)
 * - Integrated Save vault controls (Star favorite ⭐ & Selection checkbox)
 */
export const LinkedInCardSkin: React.FC<LinkedInCardSkinProps> = ({
  clip,
  meta,
  isDark,
  isSelected = false,
  onToggleSelect,
  onToggleFavorite,
  showCheckbox = true,
  onOpenDetail,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const name = meta?.name || clip.sourceAuthor || 'LinkedIn Member';
  const headline = meta?.headline || (clip.extractedData?.company ? `${clip.extractedData.company}` : 'Professional on LinkedIn');
  const avatar = meta?.avatar;
  const postedTime = formatLinkedInTime(meta?.posted_at || clip.createdAt);
  const mediaList = meta?.media || [];
  const rawText = clip.summary || clip.title || '';

  // Extract external domain for article preview
  let externalDomain = '';
  try {
    const parsed = new URL(clip.url);
    if (!parsed.hostname.includes('linkedin.com')) {
      externalDomain = parsed.hostname.replace(/^www\./, '').toUpperCase();
    }
  } catch {
    // ignore
  }

  // Short vs Long post
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  const isLongPost = rawText.length > 220 || lines.length > 3;

  const getTruncatedText = (): string => {
    if (!isLongPost) return rawText;
    if (lines.length > 3) {
      return lines.slice(0, 3).join('\n');
    }
    const slice = rawText.slice(0, 200);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 140 ? slice.slice(0, lastSpace) : slice);
  };

  const displayText = isLongPost && !isExpanded ? getTruncatedText() : rawText;

  // Reaction counters
  const reactionCount = meta?.reactions ?? 284;
  const commentCount = meta?.comments ?? 38;
  const repostCount = meta?.reposts ?? 12;

  return (
    <div className="flex flex-col gap-2 font-sans select-text w-full">
      {/* ─── 1. Authentic LinkedIn 3-Line Author Header ─── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Round Profile Avatar (48px) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 cursor-pointer bg-slate-200 dark:bg-[#282E33] border border-black/10 dark:border-white/10"
          >
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-base bg-[#0A66C2] text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* 3-Line Author Details: Name -> Headline -> Time + Globe */}
          <div className="flex flex-col min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5 truncate">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(clip.url, '_blank', 'noopener,noreferrer');
                }}
                className={`font-semibold text-[14px] truncate cursor-pointer hover:underline ${
                  isDark ? 'text-[#E7E9EA]' : 'text-slate-900'
                }`}
                title={name}
              >
                {name}
              </span>
              <span className="text-[#71767B] text-[12px] shrink-0 font-normal">• 1st</span>
            </div>

            {/* Professional Headline */}
            <p className={`text-[12px] truncate mt-0.5 leading-tight ${isDark ? 'text-[#71767B]' : 'text-slate-500'}`} title={headline}>
              {headline}
            </p>

            {/* Time + Globe 🌐 */}
            <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${isDark ? 'text-[#71767B]' : 'text-slate-500'}`}>
              <span>{postedTime}</span>
              <span>•</span>
              <Globe className="w-3 h-3 stroke-[2] opacity-80" />
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Checkbox, Star Favorite, Options, Logo */}
        <div className="flex items-center gap-1 shrink-0 select-none pt-0.5">
          {/* Checkbox */}
          {showCheckbox && onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(clip.id);
              }}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : isDark
                    ? 'border-[#383E45] hover:border-[#71767B] bg-[#23292E] text-transparent opacity-0 group-hover:opacity-100'
                    : 'border-slate-300 hover:border-slate-400 bg-white text-transparent opacity-0 group-hover:opacity-100'
              }`}
              title={isSelected ? 'Deselect clip' : 'Select clip'}
              aria-label={isSelected ? 'Deselect clip' : 'Select clip'}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </button>
          )}

          {/* Star Favorite */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(clip.id);
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                clip.isFavorite
                  ? 'text-amber-400 bg-amber-400/10'
                  : isDark
                    ? 'text-[#71767B] hover:text-amber-400 hover:bg-[#23292E]'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }`}
              title={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              aria-label={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          {/* More options button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(clip);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#71767B] hover:text-white hover:bg-white/10 transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* LinkedIn Logo */}
          <div className="text-[#0A66C2] pl-0.5">
            <LinkedInLogo className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ─── 2. Post Title (if distinct) & Body Typography ─── */}
      {clip.title && clip.title !== rawText && (
        <h3
          onClick={() => onOpenDetail(clip)}
          className={`font-semibold text-[14px] leading-[20px] line-clamp-2 pt-1 transition-colors cursor-pointer ${
            isDark ? 'text-white hover:text-[#70B5F9]' : 'text-slate-900 hover:text-[#0A66C2]'
          }`}
        >
          {clip.title}
        </h3>
      )}

      <div
        onClick={() => onOpenDetail(clip)}
        className={`text-[14px] leading-[20px] font-normal tracking-normal break-words whitespace-pre-wrap cursor-pointer ${
          isDark ? 'text-[#E7E9EA]' : 'text-slate-800'
        }`}
      >
        {renderLinkedInText(displayText)}

        {/* Inline ...see more toggle */}
        {isLongPost && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[#0A66C2] dark:text-[#70B5F9] font-medium hover:underline cursor-pointer select-none ml-1 inline"
          >
            {isExpanded ? 'see less' : '...see more'}
          </button>
        )}
      </div>

      {/* ─── 3. Attached Media or Authentic LinkedIn Article Preview Card ─── */}
      {mediaList.length > 0 ? (
        <div className="w-full mt-1.5 rounded-xl overflow-hidden border border-[#383E45] bg-black">
          <img
            src={mediaList[0]}
            alt=""
            loading="lazy"
            className="w-full max-h-72 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).parentElement!.style.display = 'none';
            }}
          />
        </div>
      ) : externalDomain ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className={`w-full mt-2 rounded-xl border transition-colors overflow-hidden cursor-pointer group/link ${
            isDark ? 'bg-[#1D2226] border-[#383E45] hover:bg-[#23292E]' : 'bg-[#F4F2EE] border-slate-200 hover:bg-[#EBE8E3]'
          }`}
        >
          {/* Article Info Bar */}
          <div className="p-3 flex flex-col justify-center min-w-0">
            <span className="text-[11px] font-semibold text-[#71767B] tracking-wider uppercase truncate">
              {externalDomain}
            </span>
            <span className={`text-[13px] font-semibold truncate leading-snug group-hover/link:underline mt-0.5 ${
              isDark ? 'text-[#E7E9EA]' : 'text-slate-900'
            }`}>
              {clip.title || 'View Article on LinkedIn'}
            </span>
          </div>
        </div>
      ) : null}

      {/* ─── 4. Signature LinkedIn Overlapping Reaction Stack ─── */}
      <div className="flex items-center justify-between text-[12px] text-[#71767B] pt-2 select-none">
        {/* Overlapping Reaction Bubbles: 👍 Like, 👏 Celebrate, ❤️ Love */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1 items-center">
            {/* Blue Thumbs Up */}
            <div className="w-4 h-4 rounded-full bg-[#0A66C2] flex items-center justify-center text-white ring-1 ring-black/40">
              <ThumbsUp className="w-2.5 h-2.5 fill-white" />
            </div>
            {/* Green Celebrate */}
            <div className="w-4 h-4 rounded-full bg-[#378FE9] flex items-center justify-center text-white ring-1 ring-black/40">
              <Sparkles className="w-2.5 h-2.5 fill-white" />
            </div>
            {/* Red Heart */}
            <div className="w-4 h-4 rounded-full bg-[#DF704D] flex items-center justify-center text-white ring-1 ring-black/40">
              <Heart className="w-2.5 h-2.5 fill-white" />
            </div>
          </div>
          <span className="font-normal text-[12px] ml-0.5">
            {formatCompactCount(reactionCount)}
          </span>
        </div>

        {/* Right side: Comments & Reposts count */}
        <div className="flex items-center gap-2 text-[12px]">
          <span>{formatCompactCount(commentCount)} comments</span>
          <span>•</span>
          <span>{formatCompactCount(repostCount)} reposts</span>
        </div>
      </div>

      {/* ─── 5. The Iconic LinkedIn 4-Action Bar (Like, Comment, Repost, Send) ─── */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-black/5 dark:border-white/10 select-none text-[#71767B] mt-0.5">
        {/* 1. Like */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/btn"
          title="Like"
        >
          <ThumbsUp className="w-4 h-4 group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors" />
          <span className="text-[12px] font-semibold group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors">
            Like
          </span>
        </button>

        {/* 2. Comment */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/btn"
          title="Comment"
        >
          <MessageSquare className="w-4 h-4 group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors" />
          <span className="text-[12px] font-semibold group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors">
            Comment
          </span>
        </button>

        {/* 3. Repost */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/btn"
          title="Repost"
        >
          <Repeat2 className="w-4 h-4 group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors" />
          <span className="text-[12px] font-semibold group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors">
            Repost
          </span>
        </button>

        {/* 4. Send */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/btn"
          title="Send"
        >
          <Send className="w-4 h-4 group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors" />
          <span className="text-[12px] font-semibold group-hover/btn:text-[#0A66C2] dark:group-hover/btn:text-[#70B5F9] transition-colors">
            Send
          </span>
        </button>
      </div>
    </div>
  );
};
