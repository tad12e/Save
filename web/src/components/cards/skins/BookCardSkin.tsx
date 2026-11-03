import React from 'react';
import { BookOpen, Star, User, ExternalLink, Bookmark } from 'lucide-react';
import { ClipItem } from '../../../types';
import { BookMeta } from '../../../types/clipPlatform';

interface BookCardSkinProps {
  clip: ClipItem;
  meta?: BookMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

export const BookCardSkin: React.FC<BookCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const author = meta?.author || clip.sourceAuthor;
  const rating = meta?.rating;
  const cover = meta?.cover || clip.thumbnailUrl;
  const pages = meta?.pages;
  const isbn = meta?.isbn;
  const title = meta?.title || clip.title || 'Book';
  const price = meta?.price;
  const curr = meta?.curr || 'USD';

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* Book Badge & Meta Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors cursor-pointer truncate"
          >
            <BookOpen className="w-3 h-3 shrink-0" />
            <span>Book</span>
          </div>

          {pages && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {pages} pages
            </span>
          )}
        </div>

        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
            <Star className="w-3 h-3 fill-current" />
            <span>{rating.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Book Layout: Cover on Left + Title/Author/ISBN on Right */}
      <div className="flex gap-3 items-start">
        {cover && (
          <div
            onClick={() => onOpenDetail(clip)}
            className="w-20 h-28 shrink-0 rounded-lg overflow-hidden relative shadow-md bg-slate-900/10 border border-black/10 dark:border-white/10 group/cover cursor-pointer"
          >
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
              }}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h3
            onClick={() => onOpenDetail(clip)}
            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors line-clamp-2 leading-snug cursor-pointer"
          >
            {title}
          </h3>

          {author && (
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 truncate">
              <User className="w-3 h-3 shrink-0 opacity-70" />
              <span className="truncate">{author}</span>
            </div>
          )}

          {isbn && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <Bookmark className="w-2.5 h-2.5" />
              <span>ISBN: {isbn}</span>
            </div>
          )}

          {price && (
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ${price.toFixed(2)} {curr}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {clip.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {clip.summary}
        </p>
      )}

      {/* Read Book CTA */}
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs"
        >
          <span>View Book Details</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </button>
      </div>
    </div>
  );
};

