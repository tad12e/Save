import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Music, 
  Disc, 
  Radio, 
  ExternalLink, 
  Volume2 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { SpotifyMeta, formatDuration } from '../../../types/clipPlatform';

interface SpotifyCardSkinProps {
  clip: ClipItem;
  meta?: SpotifyMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// Authentic Spotify Vector Logo
const SpotifyLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424a.625.625 0 0 1-.86.208c-2.355-1.439-5.32-1.764-8.813-.967a.625.625 0 1 1-.278-1.22c3.824-.873 7.106-.503 9.743 1.118a.625.625 0 0 1 .208.861zm1.224-2.724a.782.782 0 0 1-1.076.257c-2.696-1.657-6.806-2.136-9.995-1.168a.782.782 0 1 1-.453-1.498c3.64-1.105 8.188-.574 11.267 1.333a.783.783 0 0 1 .257 1.076zm.105-2.835C14.686 8.94 9.362 8.765 6.275 9.702a.938.938 0 0 1-.55-1.794c3.553-1.08 9.444-.87 13.178 1.348a.938.938 0 0 1-1.008 1.621z" />
  </svg>
);

/**
 * Native Spotify Audio Bookmark Card Skin (Part 9).
 * Replicates the authentic Spotify audio player feel:
 * - Square album art / cover with play button overlay.
 * - Kind pill (Track, Album, Playlist, Episode) in vibrant #1DB954.
 * - Track title, artist byline, album name, and duration pill.
 * - Dynamic animated equalizer waveform bars.
 * - Zero iframes, zero external webviews, sub-millisecond render.
 */
export const SpotifyCardSkin: React.FC<SpotifyCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const kind = (meta?.kind || 'track').toUpperCase();
  const artist = meta?.artist || clip.sourceAuthor || 'Spotify Artist';
  const album = meta?.album;
  const cover = meta?.cover;
  const duration = meta?.duration ? formatDuration(meta.duration) : undefined;
  const title = clip.title || 'Untitled Audio';

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* ─── Subagent A: Audio Header & Kind Badge ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Kind Pill */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 shrink-0">
            {kind}
          </span>

          {album && (
            <span className="text-[#888888] text-xs font-mono truncate hidden sm:inline">
              • {album}
            </span>
          )}
        </div>

        {/* Spotify Logo Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="text-[#1DB954] hover:scale-108 transition-transform p-1 shrink-0"
          title="Open in Spotify"
        >
          <SpotifyLogo className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Subagent A: Cover Art, Title & Waveform Bar ─── */}
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#1DB954]/10 via-[#1DB954]/5 to-transparent border border-[#1DB954]/20">
        {/* Cover Art with Play Button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 shadow-md bg-black/40 group/cover cursor-pointer"
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#1DB954] bg-[#1DB954]/10">
              <Disc className="w-8 h-8 animate-spin-slow" />
            </div>
          )}

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 fill-black translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* Track / Audio Details */}
        <div className="min-w-0 flex-1">
          <h3
            onClick={() => onOpenDetail(clip)}
            className={`font-semibold text-[15px] leading-[20px] truncate transition-colors cursor-pointer ${
              isDark ? 'text-white hover:text-[#1DB954]' : 'text-slate-900 hover:text-[#1DB954]'
            }`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
            title={title}
          >
            {title}
          </h3>

          <p
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="text-xs text-[#888888] hover:text-[#1DB954] transition-colors truncate mt-0.5 cursor-pointer"
            title={artist}
          >
            {artist}
          </p>

          {/* Animated Equalizer Waveform Bars */}
          <div className="flex items-end gap-1 h-3 mt-2">
            <span className="w-0.5 bg-[#1DB954] rounded-full animate-pulse h-2" />
            <span className="w-0.5 bg-[#1DB954] rounded-full animate-pulse h-3.5 delay-75" />
            <span className="w-0.5 bg-[#1DB954] rounded-full animate-pulse h-1.5 delay-150" />
            <span className="w-0.5 bg-[#1DB954] rounded-full animate-pulse h-3 delay-100" />
            <span className="w-0.5 bg-[#1DB954] rounded-full animate-pulse h-2.5 delay-200" />
            {duration && (
              <span className="text-[10px] font-mono text-[#888888] ml-2 leading-none">
                {duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Subagent A: Action Bar / Play on Spotify ─── */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5 select-none font-mono">
        <div className="flex items-center gap-1.5 text-[11px] text-[#888888]">
          <Volume2 className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>High Quality Audio</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#1DB954] text-black hover:bg-[#1ed760] transition-colors shadow-sm"
          title="Play on Spotify"
        >
          <Play className="w-3 h-3 fill-black" />
          <span>Play on Spotify</span>
        </button>
      </div>
    </div>
  );
};
