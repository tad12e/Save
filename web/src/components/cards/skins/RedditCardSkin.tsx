import React, { useState } from 'react';
import { 
  ArrowBigUp, 
  ArrowBigDown, 
  MessageSquare, 
  Share2, 
  Repeat, 
  MoreVertical, 
  AlertTriangle 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { RedditMeta, formatCompactCount } from '../../../types/clipPlatform';

interface RedditCardSkinProps {
  clip: ClipItem;
  meta?: RedditMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Client-side fallback extraction for subreddit from URL
function extractSubreddit(url?: string): string {
  if (!url) return 'reddit';
  const match = url.match(/\/r\/([a-zA-Z0-9_]+)/i);
  return match ? match[1] : 'reddit';
}

function resolveRedditTitle(rawTitle: string, url: string, rawSummary: string): string {
  let title = (rawTitle || '').replace(/\s*[:\-–—|]\s*(r\/[a-zA-Z0-9_]+|reddit\.com|Reddit)$/i, '').trim();

  const isGeneric = !title ||
    title === 'Untitled Clip' ||
    title.toLowerCase() === 'reddit.com' ||
    title.toLowerCase() === 'reddit' ||
    title.toLowerCase() === 'saved clip' ||
    title.startsWith('http');

  if (isGeneric) {
    const slugMatch = url.match(/\/comments\/[a-zA-Z0-9]+(?:\/([a-zA-Z0-9_\-]+))?/i);
    if (slugMatch && slugMatch[1]) {
      const slug = slugMatch[1].replace(/[-_]/g, ' ').trim();
      if (slug) {
        return slug.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
      }
    }
    if (rawSummary && rawSummary !== 'Saved webpage clip.') {
      return rawSummary.length > 70 ? rawSummary.slice(0, 70).trim() + '...' : rawSummary;
    }
    return 'Reddit Discussion';
  }
  return title;
}

function resolveRedditSnippet(summary?: string, title?: string): string {
  let text = (summary || '').trim();
  if (!text || text === 'Saved webpage clip.') return '';
  if (title && text.toLowerCase().startsWith(title.toLowerCase())) {
    text = text.slice(title.length).replace(/^[\s\-_:/|'"]+/, '').trim();
  }
  return text;
}

function formatRedditTime(dateStr?: string): string {
  if (!dateStr) return 'now';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return 'now';
  const diffSec = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (diffSec < 60) return 'now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Authentic Reddit Post Card Skin.
 * Matches authentic mobile and web Reddit discussion feed layout:
 * - Subreddit header with custom/orange avatar, r/community, and relative timestamp.
 * - Bold post title with URL slug fallback to prevent "Untitled Clip".
 * - Multi-line formatted discussion body snippet.
 * - Authentic action bar with stadium vote pill (⇧ count ⇩), comment pill, repost, and share.
 */
export const RedditCardSkin: React.FC<RedditCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const [voteDelta, setVoteDelta] = useState<number>(0); // -1, 0, +1

  const rawSub = meta?.subreddit ? meta.subreddit.replace(/^r\//i, '') : extractSubreddit(clip.url);
  const cleanSub = rawSub || 'reddit';
  const flair = meta?.flair;
  const nsfw = meta?.nsfw;
  const thumb = meta?.thumb && meta.thumb.startsWith('http') && !meta.thumb.includes('default') ? meta.thumb : null;
  const avatarUrl = thumb || (cleanSub !== 'reddit' ? `https://unavatar.io/reddit/${cleanSub}` : null);

  const resolvedTitle = resolveRedditTitle(clip.title, clip.url, clip.summary);
  const discussionSnippet = resolveRedditSnippet(clip.summary, resolvedTitle);

  const baseScore = meta?.upvotes ?? 1;
  const displayScore = Math.max(0, baseScore + voteDelta);
  const commentsCount = meta?.comments ?? 0;

  const timeAgo = formatRedditTime(meta?.posted_at || clip.createdAt);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVoteDelta(prev => (prev === 1 ? 0 : 1));
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVoteDelta(prev => (prev === -1 ? 0 : -1));
  };

  return (
    <div className="flex flex-col gap-2.5 font-sans select-text">
      {/* ─── 1. Header: Subreddit Avatar + r/community + Timestamp + Actions ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Subreddit Avatar (28x28 circle) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://reddit.com/r/${cleanSub}`, '_blank', 'noopener,noreferrer');
            }}
            className="w-7 h-7 rounded-full bg-[#FF4500] flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
            title={`r/${cleanSub}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-white text-[12px] font-black tracking-tight select-none">r/</span>
            )}
          </div>

          {/* Subreddit Name & Time */}
          <div className="flex items-center gap-1.5 min-w-0 truncate text-xs">
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://reddit.com/r/${cleanSub}`, '_blank', 'noopener,noreferrer');
              }}
              className={`font-bold hover:underline cursor-pointer truncate ${
                isDark ? 'text-[#D7DADC]' : 'text-slate-900'
              }`}
            >
              r/{cleanSub}
            </span>
            <span className="text-[#818384] text-[11px] shrink-0 font-medium">{timeAgo}</span>
          </div>

          {/* Post Flair Badge */}
          {flair && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {flair}
            </span>
          )}

          {/* NSFW Pill */}
          {nsfw && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>NSFW</span>
            </span>
          )}
        </div>

        {/* Top-Right 3-dots */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#818384] hover:text-[#D7DADC] p-1 rounded-full transition-colors"
          title="Open in Reddit"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* ─── 2. Post Title (Authentic Bold Headline) ─── */}
      <h3
        onClick={() => onOpenDetail(clip)}
        className={`font-bold text-[15px] leading-snug line-clamp-3 transition-colors cursor-pointer ${
          isDark ? 'text-[#D7DADC] hover:text-[#FF4500]' : 'text-slate-900 hover:text-[#FF4500]'
        }`}
        title={resolvedTitle}
      >
        {resolvedTitle}
      </h3>

      {/* ─── 3. Discussion Excerpt & Thumbnail ─── */}
      <div className="flex items-start gap-3">
        {discussionSnippet && (
          <p
            onClick={() => onOpenDetail(clip)}
            className={`text-[13px] leading-[19px] line-clamp-4 flex-1 cursor-pointer ${
              isDark ? 'text-[#A4A7A8]' : 'text-slate-600'
            }`}
          >
            {discussionSnippet}
          </p>
        )}

        {/* Thumbnail if present */}
        {thumb && (
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-black/20 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* ─── 4. Authentic Reddit Action Bar ─── */}
      {/* [ ⇧ score ⇩ ]  [ 💬 count ]  [ 🔁 ]  [ ⤴ ] */}
      <div className="flex items-center gap-2 pt-1 select-none">
        {/* Karma / Vote Stadium Pill */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
          isDark 
            ? 'bg-[#272729] border-[#343536] text-[#D7DADC]' 
            : 'bg-[#F2F4F5] border-[#E5E7EB] text-slate-800'
        }`}>
          <button
            type="button"
            onClick={handleUpvote}
            className={`p-0.5 transition-colors ${
              voteDelta === 1 ? 'text-[#FF4500]' : 'text-[#818384] hover:text-[#FF4500]'
            }`}
            title="Upvote"
          >
            <ArrowBigUp className="w-4 h-4" />
          </button>
          <span className={`text-[12px] px-0.5 ${
            voteDelta === 1 ? 'text-[#FF4500]' : voteDelta === -1 ? 'text-[#7193FF]' : ''
          }`}>
            {formatCompactCount(displayScore)}
          </span>
          <button
            type="button"
            onClick={handleDownvote}
            className={`p-0.5 transition-colors ${
              voteDelta === -1 ? 'text-[#7193FF]' : 'text-[#818384] hover:text-[#7193FF]'
            }`}
            title="Downvote"
          >
            <ArrowBigDown className="w-4 h-4" />
          </button>
        </div>

        {/* Comments Stadium Pill */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            isDark 
              ? 'bg-[#272729] border-[#343536] text-[#D7DADC] hover:bg-[#343536]' 
              : 'bg-[#F2F4F5] border-[#E5E7EB] text-slate-800 hover:bg-slate-200'
          }`}
          title="Comments"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#818384]" />
          <span className="text-[12px]">{formatCompactCount(commentsCount)}</span>
        </button>

        {/* Repost Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className={`p-1.5 rounded-full border transition-colors ${
            isDark 
              ? 'bg-[#272729] border-[#343536] text-[#818384] hover:text-[#D7DADC] hover:bg-[#343536]' 
              : 'bg-[#F2F4F5] border-[#E5E7EB] text-[#818384] hover:text-slate-800 hover:bg-slate-200'
          }`}
          title="Repost"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(clip.url);
          }}
          className={`p-1.5 rounded-full border transition-colors ${
            isDark 
              ? 'bg-[#272729] border-[#343536] text-[#818384] hover:text-[#D7DADC] hover:bg-[#343536]' 
              : 'bg-[#F2F4F5] border-[#E5E7EB] text-[#818384] hover:text-slate-800 hover:bg-slate-200'
          }`}
          title="Share Link"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
