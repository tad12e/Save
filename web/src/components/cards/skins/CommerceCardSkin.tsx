import React from 'react';
import { ShoppingBag, Star, ExternalLink, CheckCircle, Tag } from 'lucide-react';
import { ClipItem } from '../../../types';
import { CommerceMeta, formatCompactCount } from '../../../types/clipPlatform';

interface CommerceCardSkinProps {
  clip: ClipItem;
  meta?: CommerceMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

function formatCurrency(price?: number, curr?: string): string {
  if (price === undefined || price === null) return '';
  const currency = (curr || 'USD').toUpperCase();
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
  return `${symbol}${price.toFixed(2)}`;
}

export const CommerceCardSkin: React.FC<CommerceCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const brand = meta?.brand || 'Store';
  const price = meta?.price;
  const currency = meta?.curr || 'USD';
  const rating = meta?.rating;
  const reviews = meta?.reviews;
  const image = meta?.thumb || clip.thumbnailUrl;
  const title = meta?.title || clip.title || 'Product';
  const availability = meta?.availability;
  const formattedPrice = formatCurrency(price, currency);

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* Brand & Price Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer truncate max-w-[160px]"
            title={`Store: ${brand}`}
          >
            <ShoppingBag className="w-3 h-3 shrink-0" />
            <span className="truncate">{brand}</span>
          </div>

          {availability && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>{availability}</span>
            </span>
          )}
        </div>

        {formattedPrice && (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0 shadow-xs">
            <Tag className="w-3 h-3" />
            <span>{formattedPrice}</span>
          </div>
        )}
      </div>

      {/* Product Image (if available) */}
      {image && (
        <div
          onClick={() => onOpenDetail(clip)}
          className="w-full h-44 rounded-xl overflow-hidden relative bg-white/5 dark:bg-black/20 border border-black/5 dark:border-white/5 group/hero cursor-pointer flex items-center justify-center p-2"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain transition-transform duration-300 group-hover/hero:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
            }}
          />
        </div>
      )}

      {/* Title & Rating */}
      <div className="flex flex-col gap-1.5">
        <h3
          onClick={() => onOpenDetail(clip)}
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors line-clamp-2 leading-snug cursor-pointer"
        >
          {title}
        </h3>

        {/* Rating and Reviews Counter */}
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center text-amber-500 dark:text-amber-400 font-semibold gap-0.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
            {reviews !== undefined && reviews > 0 && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ({formatCompactCount(reviews)} reviews)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary / Excerpt */}
      {clip.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {clip.summary}
        </p>
      )}

      {/* CTA Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 border border-transparent dark:border-white/10 transition-all cursor-pointer shadow-xs"
        >
          <span>View on {brand}</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </div>
  );
};

