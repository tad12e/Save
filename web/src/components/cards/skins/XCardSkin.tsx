import React, { useState } from 'react';
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  BarChart2, 
  Share, 
  Bookmark, 
  Check, 
  Star, 
  MoreHorizontal, 
  ExternalLink, 
  Globe, 
  VolumeX 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { XMeta, formatCompactCount } from '../../../types/clipPlatform';

export interface XCardSkinProps {
  clip: ClipItem;
  meta?: XMeta;
  isDark: boolean;
  isSelected?: boolean;
  onToggleSelect?: (clipId: string) => void;
  onToggleFavorite?: (clipId: string) => void;
  showCheckbox?: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Authentic X Verified Checkmark Icon (Hexagonal scalloped badge)
export const XVerifiedBadge: React.FC<{ isGold?: boolean; className?: string }> = ({ 
  isGold = false, 
  className = 'w-[18px] h-[18px]' 
}) => (
  <svg viewBox="0 0 22 22" aria-label={isGold ? "Verified Organization" : "Verified Account"} className={`${className} shrink-0`} fill="currentColor">
    <g>
      <path
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.68.132-.636.075-1.298-.164-1.902.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.136 5.412-5.412 1.293 1.302-6.705 6.704z"
        className={isGold ? 'text-[#E2B719]' : 'text-[#1D9BF0]'}
      />
    </g>
  </svg>
);

// Authentic X Monochrome Logo
export const XLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Known enterprise & verified organization accounts for Gold badge detection
const KNOWN_ORGS = new Set([
  'googlegemma', 'google', 'googledeepmind', 'vast_ai', 'vastai', 'cnn',
  'openai', 'apple', 'microsoft', 'github', 'meta', 'nvidia', 'anthropicai',
  'reuters', 'bbc', 'wsj', 'nytimes', 'bloomberg', 'tesla', 'spacex',
  'x', 'awscloud', 'vercel', 'stripe', 'linear', 'figma', 'notionhq',
]);

function isVerifiedOrg(meta?: XMeta, handle: string = '', name: string = ''): boolean {
  if (meta?.verified_type === 'gold' || meta?.verified_type === 'business') return true;
  if (meta?.verified_type === 'blue') return false;
  const cleanHandle = handle.toLowerCase().replace(/^@/, '');
  const cleanName = name.toLowerCase();
  if (KNOWN_ORGS.has(cleanHandle) || KNOWN_ORGS.has(cleanName)) return true;
  if (/(?:official|news|hq|labs|company|corp|inc|media)$/i.test(cleanHandle)) return true;
  if (/\b(?:inc|llc|corp|official|company|news)\b/i.test(cleanName)) return true;
  return false;
}

// Authentic X Relative Timestamp (1h, 8h, 10h, Sep 30)
function formatXTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'just now';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    const isSameYear = d.getFullYear() === now.getFullYear();
    if (isSameYear) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

// Robust text cleaner to remove scraper garbage, metric dumps, and auth-wall boilerplate
function sanitizeTweetText(
  rawText: string,
  title: string = '',
  authorName: string = '',
  handle: string = ''
): { text: string; isAuthFallback: boolean; externalUrl?: string; detectedAuthorName?: string } {
  const cleanH = handle ? handle.replace(/^@/, '') : 'user';
  let text = (rawText || title || '').trim();
  let detectedAuthorName: string | undefined = undefined;

  // 1. Detect auth-wall / login prompts
  const authWallPatterns = [
    /\b(?:for\s+x\s+)?continue\s+with\s+(?:phone|apple|google)\b/i,
    /\bby\s+signing\s+up,?\s+you\s+agree\s+to\s+the\s+terms\b/i,
    /\bsign\s+in\s+to\s+(?:x|twitter)\b/i,
    /\bnew\s+to\s+(?:x|twitter)\?\s*sign\s+up\b/i,
    /\bdon'?t\s+miss\s+what'?s\s+happening\b/i,
    /\bpeople\s+on\s+x\s+are\s+the\s+first\s+to\s+know\b/i,
    /\balready\s+have\s+an\s+account\?\s*log\s*in\b/i,
  ];

  const isAuth = authWallPatterns.some((pat) => pat.test(text));
  if (isAuth) {
    const titleIsGeneric = !title || /^(?:log\s*in|sign\s*up|x\.com|twitter|post|tweet)/i.test(title);
    if (!titleIsGeneric && !authWallPatterns.some((p) => p.test(title))) {
      text = title;
    } else {
      return { text: `Post by @${cleanH} on X`, isAuthFallback: true };
    }
  }

  // 2. Detect & strip leading author/handle pattern: e.g. "Michele Catasta @pirroh " or "@pirroh " or "pirroh: "
  const leadAuthorMatch = text.match(/^([A-Z\u00C0-\u024F][a-zA-Z0-9_.\s]{1,40}?\s*)?@[a-zA-Z0-9_]+\s*[:\-–—·]?\s*/i);
  if (leadAuthorMatch) {
    if (leadAuthorMatch[1] && leadAuthorMatch[1].trim()) {
      detectedAuthorName = leadAuthorMatch[1].trim();
    }
    text = text.slice(leadAuthorMatch[0].length).trim();
  } else if (authorName) {
    const escapedName = authorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    text = text.replace(new RegExp(`^${escapedName}\\s*(?:@[a-zA-Z0-9_]+)?\\s*[:\\-–—·]?\\s*`, 'i'), '');
  }
  if (handle) {
    const escapedH = cleanH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    text = text.replace(new RegExp(`^@?${escapedH}\\s*[:\\-–—·]?\\s*`, 'i'), '');
  }

  // 3. Strip scraper metric counter sequence without eating innocent words (e.g. "at the frontier")
  const candidateAuthor = detectedAuthorName || authorName;
  if (candidateAuthor && candidateAuthor.length > 2) {
    const escAuth = candidateAuthor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
    text = text.replace(new RegExp(`\\b${escAuth}\\s+\\d{1,6}(?:\\s+\\d{1,6}){2,5}\\b`, 'gi'), '. ');
  }
  // Also catch any author name repeating right before 3-5 metric numbers:
  text = text.replace(/(?:[A-Z][a-zA-Z0-9_.\s]{1,25}\s+)?\b\d{1,6}(?:\s+\d{1,6}){2,5}\b/g, '. ');

  // 4. Strip site suffixes
  text = text.replace(/\s*[-–—|]\s*(?:X|Twitter)$/i, '');

  // 5. Detect first external link URL if present for link card preview
  const urlMatch = text.match(/https?:\/\/[^\s]+/i) || text.match(/\b(?:lnkd\.in|cnn\.it|github\.com|t\.co)\/[^\s]+/i);
  const externalUrl = urlMatch ? (urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`) : undefined;

  // 6. Normalize paragraph breaks, punctuation, and multiple spaces
  text = text.replace(/\s*([.:])\s*([.:])/g, '$1 ').replace(/\s*\.\s*/g, '. ');
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Strip leading punctuation artifacts
  text = text.replace(/^[:\-–—·.]\s*/, '').trim();

  if (!text) {
    return { text: `Post by @${cleanH} on X`, isAuthFallback: true, detectedAuthorName };
  }

  return { text, isAuthFallback: false, externalUrl, detectedAuthorName };
}

// Tweet body rich typography parser (highlights @handles, #hashtags, and links)
function renderTweetText(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\s+|@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+|https?:\/\/[^\s]+|\b(?:lnkd\.in|cnn\.it|t\.co)\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://x.com/${part.slice(1)}`, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#1D9BF0] hover:underline cursor-pointer font-normal"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://x.com/hashtag/${part.slice(1)}`, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#1D9BF0] hover:underline cursor-pointer font-normal"
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('http://') || part.startsWith('https://') || /^(?:lnkd\.in|cnn\.it|t\.co)\//.test(part)) {
      const fullUrl = part.startsWith('http') ? part : `https://${part}`;
      let displayUrl = part.replace(/^https?:\/\//, '');
      if (displayUrl.length > 28) displayUrl = `${displayUrl.slice(0, 25)}...`;
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            window.open(fullUrl, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#1D9BF0] hover:underline cursor-pointer"
        >
          {displayUrl}
        </span>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

/**
 * Authentic Native X (Twitter) Bookmark Card Skin.
 * Replicates real X posts matching user reference screenshots:
 * - 2-column layout (Avatar on left, fluid content on right)
 * - Gold badge for verified companies/orgs, Blue badge for creators
 * - Exact @handle · 1h/8h relative timestamp header
 * - Short tweets displayed in full; Long tweets clamped with "#1D9BF0" Show more / Show less toggle
 * - Embedded video player badge (3:05 + mute) or multi-image grid
 * - Embedded link preview card for external articles (e.g. lnkd.in, cnn.it)
 * - Authentic 6-icon engagement metrics bar (Reply, Repost, Like, Views, Bookmark, Share)
 * - Integrated Save vault controls (Star favorite ⭐ & Selection checkbox)
 */
export const XCardSkin: React.FC<XCardSkinProps> = ({
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

  const rawAuthorName = meta?.name || clip.sourceAuthor?.replace(/^@/, '') || 'X User';
  const handle = meta?.handle || (clip.sourceAuthor?.startsWith('@') ? clip.sourceAuthor : `@${clip.sourceAuthor || 'user'}`);
  const avatarUrl = meta?.avatar;
  const postedDate = formatXTimestamp(meta?.posted_at || clip.createdAt);
  const mediaList = meta?.media || [];
  const rawBody = clip.summary || clip.title || '';

  const { text: cleanText, isAuthFallback, externalUrl, detectedAuthorName } = sanitizeTweetText(
    rawBody,
    clip.title,
    rawAuthorName,
    handle
  );

  const authorName = (rawAuthorName === handle.replace(/^@/, '') || rawAuthorName === 'X User' || rawAuthorName.toLowerCase() === 'user') && detectedAuthorName
    ? detectedAuthorName
    : rawAuthorName;

  const isGoldBadge = isVerifiedOrg(meta, handle, authorName);
  const isOrgAvatar = isGoldBadge;

  // Short vs Long tweet classification
  // Long tweet: > 240 chars or > 3 paragraph lines
  const lines = cleanText.split('\n').filter((l) => l.trim().length > 0);
  const isLongTweet = cleanText.length > 240 || lines.length > 3;

  // Truncated preview text for collapsed state
  const getTruncatedDisplay = (): string => {
    if (!isLongTweet) return cleanText;
    if (lines.length > 3) {
      return lines.slice(0, 3).join('\n');
    }
    const slice = cleanText.slice(0, 220);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 160 ? slice.slice(0, lastSpace) : slice);
  };

  const displayText = isLongTweet && !isExpanded ? getTruncatedDisplay() : cleanText;

  // Determine if video badge is applicable
  const hasVideo = !!meta?.video_duration || (mediaList.length === 1 && /video|thumb/i.test(clip.url || ''));
  const videoDuration = meta?.video_duration || '3:05';

  // Link Preview determination (when tweet has external link and no multi-image gallery)
  const previewData = meta?.link_preview || (externalUrl ? {
    url: externalUrl,
    domain: externalUrl.replace(/^https?:\/\//, '').split('/')[0],
    title: clip.title && !clip.title.toLowerCase().includes('x.com') ? clip.title : externalUrl.replace(/^https?:\/\//, '').split('/')[0],
    description: `This link will take you to a page outside X`,
  } : null);

  return (
    <div className="flex gap-3 font-sans select-text w-full">
      {/* ─── Left Column: Native Avatar ─── */}
      <div className="shrink-0 pt-0.5">
        <div
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://x.com/${handle.replace('@', '')}`, '_blank', 'noopener,noreferrer');
          }}
          className={`relative w-10 h-10 overflow-hidden cursor-pointer transition-transform hover:opacity-90 ${
            isOrgAvatar ? 'rounded-xl' : 'rounded-full'
          } ${isDark ? 'bg-[#16181C] border border-[#2F3336]' : 'bg-slate-200 border border-slate-300'}`}
          title={`@${handle.replace('@', '')}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={authorName}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center font-bold text-sm ${
              isOrgAvatar 
                ? 'bg-[#16181C] text-white border border-[#2F3336]' 
                : 'bg-gradient-to-tr from-[#1D9BF0] to-[#0A66C2] text-white'
            }`}>
              {authorName[0]?.toUpperCase() || 'X'}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Column: Header, Body, Media, Actions ─── */}
      <div className="flex flex-col min-w-0 flex-1 gap-1.5">
        {/* Native Author Header Line */}
        <div className="flex items-center justify-between gap-1 leading-normal">
          <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
            {/* Display Name */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://x.com/${handle.replace('@', '')}`, '_blank', 'noopener,noreferrer');
              }}
              className={`font-bold text-[15px] truncate cursor-pointer hover:underline ${
                isDark ? 'text-[#E7E9EA]' : 'text-[#0F1419]'
              }`}
              title={authorName}
            >
              {authorName}
            </span>

            {/* Authentic Verified Badge (Gold for orgs, Blue for creators) */}
            {meta?.verified !== false && (
              <XVerifiedBadge isGold={isGoldBadge} className="w-[18px] h-[18px] ml-0.5" />
            )}

            {/* @handle */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://x.com/${handle.replace('@', '')}`, '_blank', 'noopener,noreferrer');
              }}
              className="text-[#71767B] text-[15px] font-normal truncate cursor-pointer hover:underline ml-0.5"
            >
              {handle.startsWith('@') ? handle : `@${handle}`}
            </span>

            {/* Middle dot separator */}
            {postedDate && <span className="text-[#71767B] text-[15px] px-0.5">·</span>}

            {/* Relative Timestamp (1h, 8h, Sep 30) */}
            {postedDate && (
              <span className="text-[#71767B] text-[15px] font-normal shrink-0">
                {postedDate}
              </span>
            )}
          </div>

          {/* Right Action Cluster: Checkbox, Star Favorite, Options */}
          <div className="flex items-center gap-1 shrink-0 select-none">
            {/* Selection Checkbox */}
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
                      ? 'border-[#2F3336] hover:border-[#71767B] bg-[#16181C] text-transparent opacity-0 group-hover:opacity-100'
                      : 'border-slate-300 hover:border-slate-400 bg-white text-transparent opacity-0 group-hover:opacity-100'
                }`}
                title={isSelected ? 'Deselect clip' : 'Select clip'}
                aria-label={isSelected ? 'Deselect clip' : 'Select clip'}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
            )}

            {/* Star Favorite Toggle (Save App Integration) */}
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
                      ? 'text-[#71767B] hover:text-amber-400 hover:bg-[#16181C]'
                      : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                }`}
                title={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                aria-label={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              >
                <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            )}

            {/* Native Options ... Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(clip);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#71767B] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─── Tweet Body (Short vs Long with authentic #1D9BF0 Show more) ─── */}
        <div
          onClick={() => onOpenDetail(clip)}
          className={`text-[15px] leading-[20px] font-normal tracking-normal break-words whitespace-pre-wrap cursor-pointer ${
            isDark ? 'text-[#E7E9EA]' : 'text-[#0F1419]'
          }`}
        >
          {renderTweetText(displayText)}

          {/* Inline Show more / Show less toggle */}
          {isLongTweet && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[#1D9BF0] hover:underline font-normal cursor-pointer select-none inline-block ml-1"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* ─── Media Grid / Embedded Video ─── */}
        {mediaList.length > 0 && (
          <div className="w-full mt-1.5 rounded-2xl overflow-hidden border border-[#2F3336] bg-[#000000] relative">
            {/* Single Image / Video */}
            {mediaList.length === 1 && (
              <div className="relative w-full max-h-80 overflow-hidden group/media">
                <img
                  src={mediaList[0]}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover/media:scale-[1.01]"
                  onError={(e) => {
                    (e.target as HTMLElement).parentElement!.style.display = 'none';
                  }}
                />
                {/* Authentic Video duration badge & mute icon matching Google Gemma reference */}
                {hasVideo && (
                  <>
                    <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-sm text-white text-[12px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 select-none">
                      <span>{videoDuration}</span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white p-1.5 rounded-full select-none hover:bg-black/90">
                      <VolumeX className="w-3.5 h-3.5" />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2 Images */}
            {mediaList.length === 2 && (
              <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
                {mediaList.slice(0, 2).map((imgUrl, idx) => (
                  <div key={idx} className="w-full h-full overflow-hidden">
                    <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-[1.01] transition-transform" />
                  </div>
                ))}
              </div>
            )}

            {/* 3 Images */}
            {mediaList.length === 3 && (
              <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
                <div className="w-full h-full overflow-hidden">
                  <img src={mediaList[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-rows-2 gap-0.5 h-full">
                  <div className="w-full h-full overflow-hidden">
                    <img src={mediaList[1]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full h-full overflow-hidden">
                    <img src={mediaList[2]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            )}

            {/* 4 Images */}
            {mediaList.length >= 4 && (
              <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/9]">
                {mediaList.slice(0, 4).map((imgUrl, idx) => (
                  <div key={idx} className="w-full h-full overflow-hidden">
                    <img src={imgUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Embedded Link Preview Card (Authentic Ademola Reference) ─── */}
        {mediaList.length === 0 && previewData && previewData.domain && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(previewData.url || clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="w-full mt-2 rounded-2xl border border-[#2F3336] bg-[#16181C] hover:bg-[#1C1F23] transition-colors overflow-hidden flex items-stretch p-3 gap-3 cursor-pointer group/link"
          >
            {/* Domain Icon Box */}
            <div className="w-12 h-12 rounded-xl bg-[#202327] border border-[#2F3336] flex items-center justify-center shrink-0 text-[#71767B] group-hover/link:text-[#1D9BF0] transition-colors">
              <Globe className="w-5 h-5" />
            </div>

            {/* Metadata Preview */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="text-[12px] text-[#71767B] font-normal truncate">
                {previewData.domain}
              </span>
              <span className={`text-[14px] font-semibold truncate leading-tight group-hover/link:underline ${
                isDark ? 'text-[#E7E9EA]' : 'text-[#0F1419]'
              }`}>
                {previewData.title}
              </span>
              <span className="text-[12px] text-[#71767B] truncate leading-normal mt-0.5">
                {previewData.description || `This link will take you to a page that's not on X`}
              </span>
            </div>
          </div>
        )}

        {/* ─── Authentic Native X Engagement Metrics Row (6 items) ─── */}
        <div className="flex items-center justify-between text-[#71767B] pt-2 max-w-[425px] select-none text-[13px]">
          {/* 1. Reply */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 group/reply hover:text-[#1D9BF0] transition-colors py-1 cursor-pointer"
            title="Reply"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/reply:bg-[#1D9BF0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-normal">{formatCompactCount(meta?.replies || 0)}</span>
          </button>

          {/* 2. Repost */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 group/repost hover:text-[#00BA7C] transition-colors py-1 cursor-pointer"
            title="Repost"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/repost:bg-[#00BA7C]/10 transition-colors">
              <Repeat2 className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-normal">{formatCompactCount(meta?.reposts || 0)}</span>
          </button>

          {/* 3. Like */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 group/like hover:text-[#F91880] transition-colors py-1 cursor-pointer"
            title="Like"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/like:bg-[#F91880]/10 transition-colors">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-normal">{formatCompactCount(meta?.likes || 0)}</span>
          </button>

          {/* 4. Views */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 group/views hover:text-[#1D9BF0] transition-colors py-1 cursor-pointer"
            title="Views"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/views:bg-[#1D9BF0]/10 transition-colors">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-normal">{formatCompactCount(meta?.views || 0)}</span>
          </button>

          {/* 5. Bookmark */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleFavorite) onToggleFavorite(clip.id);
            }}
            className="flex items-center group/bm hover:text-[#1D9BF0] transition-colors py-1 cursor-pointer"
            title="Bookmark"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/bm:bg-[#1D9BF0]/10 transition-colors">
              <Bookmark className={`w-4 h-4 ${clip.isFavorite ? 'fill-[#1D9BF0] text-[#1D9BF0]' : ''}`} />
            </div>
          </button>

          {/* 6. Share */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center group/share hover:text-[#1D9BF0] transition-colors py-1 cursor-pointer"
            title="Share"
          >
            <div className="p-1.5 -m-1.5 rounded-full group-hover/share:bg-[#1D9BF0]/10 transition-colors">
              <Share className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
