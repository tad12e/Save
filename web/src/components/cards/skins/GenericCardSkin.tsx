import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Globe, 
  ExternalLink, 
  Share2, 
  User 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { GenericMeta } from '../../../types/clipPlatform';

interface GenericCardSkinProps {
  clip: ClipItem;
  meta?: GenericMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return '';
  }
}

/**
 * Native Editorial / Article Bookmark Card Skin (Part 9 - Subagent B).
 * Tailored for longform journalism, Substack newsletters, Medium blogs, and documentation:
 * - Publication host badge + estimated reading time pill.
 * - Hero preview image banner with graceful error handling.
 * - Author byline & publication date.
 * - High-clarity editorial headline + 3-line executive excerpt.
 * - Zero iframes, fast responsive layout.
 */
export const GenericCardSkin: React.FC<GenericCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const domain = meta?.site || extractDomain(clip.url) || 'Article';
  const author = meta?.author || clip.sourceAuthor;
  const readMin = meta?.read_min;
  const heroImage = meta?.image || clip.thumbnailUrl;
  const publishedAt = meta?.published_at;
  const summary = clip.summary || 'Click to view full saved article.';

  return (
    <div className="flex flex-col gap-2.5 font-sans select-text">
      {/* ─── Subagent B: Publication Source & Reading Time ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Domain / Publication Badge */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer truncate max-w-[180px]"
            title={`Source: ${domain}`}
          >
            <Globe className="w-3 h-3 shrink-0 text-emerald-500" />
            <span className="truncate">{domain}</span>
          </div>

          {/* Author Byline */}
          {author && (
            <span className="text-xs text-[#888888] truncate hidden sm:inline">
              by <span className="text-slate-300 dark:text-slate-300">{author}</span>
            </span>
          )}
        </div>

        {/* Reading Time Pill */}
        {readMin ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            <span>{readMin} min</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-[#888888] bg-black/5 dark:bg-white/5 shrink-0">
            <BookOpen className="w-2.5 h-2.5" />
            <span>Read</span>
          </span>
        )}
      </div>

      {/* ─── Subagent B: Hero Image Banner ─── */}
      {heroImage && (
        <div
          onClick={() => onOpenDetail(clip)}
          className="w-full h-36 rounded-xl overflow-hidden relative bg-slate-900/10 border border-black/5 dark:border-white/5 group/hero cursor-pointer"
        >
          <img
            src={heroImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover/hero:scale-102"
            onError={(e) => {
              (e.target as HTMLElement).parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/hero:opacity-100 transition-opacity" />
        </div>
      )}

      {/* ─── Subagent B: Editorial Headline ─── */}
      <h3
        onClick={() => onOpenDetail(clip)}
        className={`font-semibold text-[15px] leading-[22px] line-clamp-2 transition-colors cursor-pointer ${
          isDark ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'
        }`}
        style={{ fontFamily: 'Outfit, sans-serif' }}
        title={clip.title}
      >
        {clip.title}
      </h3>

      {/* ─── Subagent B: Article Excerpt ─── */}
      <p
        onClick={() => onOpenDetail(clip)}
        className={`text-xs leading-[19px] line-clamp-3 cursor-pointer ${
          isDark ? 'text-[#888888]' : 'text-slate-600'
        }`}
      >
        {summary}
      </p>

      {/* ─── Subagent B: Action Bar ─── */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5 select-none font-mono">
        <span className="text-[11px] text-[#888888]">
          {publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Saved article'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(clip.url);
            }}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-[#888888] hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Copy Article Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              isDark
                ? 'bg-white/5 text-emerald-400 hover:bg-white/10 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
            }`}
            title="Open Original Article"
          >
            <span>Read full</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
