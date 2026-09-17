import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PlaylistSummary } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface PlaylistStoriesRowProps {
  playlists: PlaylistSummary[];
  loading?: boolean;
  onSelectPlaylist: (playlist: PlaylistSummary) => void;
  activePlaylistId?: string | null;
  isDark?: boolean;
}

export const PlaylistStoriesRow: React.FC<PlaylistStoriesRowProps> = ({
  playlists,
  loading = false,
  onSelectPlaylist,
  activePlaylistId,
  isDark = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (loading && playlists.length === 0) {
    return (
      <div
        className={`mb-6 rounded-2xl p-4 border backdrop-blur-xl ${
          isDark
            ? 'bg-[#0A0A0A] border-[#262626]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
              <div
                className={`w-16 h-16 rounded-full border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              />
              <div
                className={`w-14 h-2.5 rounded ${
                  isDark ? 'bg-white/5' : 'bg-slate-200'
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative mb-6 rounded-2xl p-4 sm:p-5 border backdrop-blur-xl transition-all shadow-sm group/row ${
        isDark
          ? 'bg-[#0A0A0A] border-[#262626]'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-lg border ${
              isDark
                ? 'bg-[#3FE769]/10 text-[#3FE769] border-[#3FE769]/30'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-xs font-bold tracking-wider uppercase font-['Outfit',sans-serif] ${
              isDark ? 'text-white/90' : 'text-slate-900'
            }`}
          >
            Knowledge Stacks
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
              isDark
                ? 'bg-white/5 text-white/50 border-white/5'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            Swipe to Review
          </span>
        </div>

        {/* Scroll Controls */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className={`p-1.5 rounded-lg transition-colors border ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`p-1.5 rounded-lg transition-colors border ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Story Circles Row */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-1 pt-0.5 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {playlists.map((pl) => {
          const isSelected = activePlaylistId === pl.id;
          const radius = 30;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pl.progress_pct / 100) * circumference;

          return (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none transition-transform active:scale-95"
            >
              {/* Outer Ring Circle */}
              <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  {/* Background Track */}
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    fill="none"
                    stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                    strokeWidth="2.5"
                  />
                  {/* Animated Progress Gradient / Color Stroke */}
                  <circle
                    cx="36"
                    cy="36"
                    r={radius}
                    fill="none"
                    stroke={pl.color || '#3FE769'}
                    strokeWidth="2.8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Inner Content Thumbnail */}
                <div
                  className={`absolute inset-[5px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 border shadow-inner ${
                    isSelected
                      ? isDark
                        ? 'bg-white/20 ring-2 ring-[#3FE769] scale-105 border-white/20'
                        : 'bg-emerald-50 ring-2 ring-[#3FE769] scale-105 border-emerald-200'
                      : isDark
                      ? 'bg-[#151515] group-hover:bg-[#1C1C1C] group-hover:scale-105 border-white/10'
                      : 'bg-slate-50 group-hover:bg-slate-100 group-hover:scale-105 border-slate-200'
                  }`}
                  style={{
                    boxShadow: pl.progress_pct > 0 ? `0 0 16px ${pl.color}25` : undefined,
                  }}
                >
                  {pl.type === 'daily_5' ? (
                    <span className="text-lg select-none">⚡</span>
                  ) : (
                    <WebsiteIcon
                      domain={pl.cover_domain}
                      name={pl.tag_name || pl.cover_domain}
                      className="w-7 h-7 object-contain"
                    />
                  )}
                </div>

                {/* Completion Check Badge */}
                {pl.is_completed && (
                  <div
                    className={`absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#3FE769] text-black font-bold text-[9px] rounded-full flex items-center justify-center shadow-lg shadow-[#3FE769]/50 ring-2 ${
                      isDark ? 'ring-[#0A0A0A]' : 'ring-white'
                    }`}
                  >
                    ✓
                  </div>
                )}

                {/* Clip count badge */}
                <div
                  className={`absolute -bottom-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono tracking-tight border shadow-md ${
                    isDark
                      ? 'bg-[#1A1A1A] text-white border-white/10'
                      : 'bg-slate-900 text-white border-slate-700'
                  }`}
                >
                  {pl.clip_count}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="flex flex-col items-center max-w-[80px] text-center">
                <span
                  className={`text-[11px] font-semibold truncate w-full transition-colors ${
                    isDark
                      ? 'text-white/90 group-hover:text-white'
                      : 'text-slate-800 group-hover:text-slate-950'
                  }`}
                >
                  {pl.title}
                </span>
                <span
                  className={`text-[9px] font-mono ${
                    isDark
                      ? 'text-white/40 group-hover:text-white/60'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {pl.progress_pct > 0 ? `${pl.progress_pct}% done` : `${pl.clip_count} clips`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
