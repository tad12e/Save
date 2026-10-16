import React, { useState } from 'react';
import { 
  Play, 
  ExternalLink, 
  RotateCw, 
  Eye, 
  BookOpen, 
  Globe, 
  Smartphone, 
  Film, 
  Music, 
  ShieldCheck, 
  AlertCircle,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { ClipItem } from '../../types';

interface ClipMediaPreviewProps {
  clip: ClipItem;
  isDark: boolean;
}

// ─── Extractors ───

function getYouTubeId(url?: string): { id?: string; isShort: boolean } {
  if (!url) return { isShort: false };
  const shortMatch = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return { id: shortMatch[1], isShort: true };

  const match = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return { id: match ? match[1] : undefined, isShort: false };
}

function getInstagramInfo(url?: string): { shortcode?: string; isReel: boolean } {
  if (!url) return { isReel: false };
  const reelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  if (reelMatch) return { shortcode: reelMatch[1], isReel: true };

  const postMatch = url.match(/instagram\.com\/(?:p|tv)\/([a-zA-Z0-9_-]+)/);
  return { shortcode: postMatch ? postMatch[1] : undefined, isReel: false };
}

function getTikTokId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/tiktok\.com\/(?:@[^/]+\/video\/|v\/)(\d+)/);
  return match ? match[1] : undefined;
}

function getSpotifyInfo(url?: string): { type?: string; id?: string } {
  if (!url) return {};
  const match = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  return {};
}

function getTwitterTweetId(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
  return match ? match[1] : undefined;
}

function getRedditEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (!url.includes('reddit.com') && !url.includes('redd.it')) return undefined;
  
  // Clean query params
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  return `${cleanUrl}/?embed=true&ref_source=embed&ref=share`;
}

// ─── Component ───

export const ClipMediaPreview: React.FC<ClipMediaPreviewProps> = ({ clip, isDark }) => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'embed' | 'reader'>('embed');
  const [iframeError, setIframeError] = useState<boolean>(false);

  const url = clip.url || '';
  const yt = getYouTubeId(url);
  const insta = getInstagramInfo(url);
  const tikTokId = getTikTokId(url);
  const spotify = getSpotifyInfo(url);
  const tweetId = getTwitterTweetId(url);
  const redditUrl = getRedditEmbedUrl(url);

  const isYouTube = Boolean(yt.id);
  const isInstagram = Boolean(insta.shortcode) || url.includes('instagram.com');
  const isTikTok = Boolean(tikTokId);
  const isSpotify = Boolean(spotify.id);
  const isTwitter = Boolean(tweetId);
  const isReddit = Boolean(redditUrl);

  const handleRefresh = () => {
    setReloadKey(prev => prev + 1);
    setIframeError(false);
  };

  // 1. YouTube Player
  if (isYouTube && yt.id) {
    const isShort = yt.isShort || (clip.platformMeta?.skin === 'youtube' && clip.platformMeta.is_short);
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold text-red-500">YouTube {isShort ? 'Shorts' : 'Video'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              In-App Player
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRefresh}
              className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
              title="Reload Video"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px]"
              title="Watch in YouTube App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className={`p-3 sm:p-4 flex justify-center ${isDark ? 'bg-black/40' : 'bg-slate-900/5'}`}>
          {isShort ? (
            /* Vertical Phone Frame for YouTube Shorts */
            <div className="relative w-full max-w-[290px] aspect-[9/16] max-h-[460px] rounded-2xl overflow-hidden border border-[#333333] shadow-2xl bg-black">
              <iframe
                key={reloadKey}
                src={`https://www.youtube-nocookie.com/embed/${yt.id}?autoplay=0&rel=0`}
                title={clip.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Standard 16:9 Landscape Player */
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2B2B2B] shadow-lg bg-black">
              <iframe
                key={reloadKey}
                src={`https://www.youtube-nocookie.com/embed/${yt.id}?autoplay=0&rel=0`}
                title={clip.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Instagram Embed (Reels & Posts in Vertical Frame)
  if (isInstagram && insta.shortcode) {
    const embedUrl = `https://www.instagram.com/reel/${insta.shortcode}/embed/`;
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="font-semibold text-pink-500">Instagram {insta.isReel ? 'Reel' : 'Post'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
              Vertical View
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Reload Reel"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Open in Instagram App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className={`p-3 sm:p-4 flex flex-col items-center justify-center ${isDark ? 'bg-black/50' : 'bg-slate-900/5'}`}>
          {/* Vertical Mobile Phone Shell */}
          <div className="relative w-full max-w-[340px] aspect-[9/16] max-h-[480px] rounded-2xl overflow-hidden border border-[#333333] shadow-2xl bg-black">
            <iframe
              key={reloadKey}
              src={embedUrl}
              title={clip.title}
              allowTransparency={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="w-full h-full border-0"
              scrolling="no"
              onError={() => setIframeError(true)}
            />
          </div>

          <div className="mt-2 flex items-center justify-between w-full max-w-[340px] px-2 text-[11px] text-[#777777]">
            <span>Playing inside Save App</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-pink-400 hover:underline flex items-center gap-1"
            >
              View on Instagram <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. TikTok Vertical Embed
  if (isTikTok && tikTokId) {
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-cyan-400">TikTok Video</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
              Vertical View
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Open in TikTok App"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className={`p-4 flex justify-center ${isDark ? 'bg-black/50' : 'bg-slate-900/5'}`}>
          <div className="relative w-full max-w-[320px] aspect-[9/16] max-h-[480px] rounded-2xl overflow-hidden border border-[#333333] shadow-2xl bg-black">
            <iframe
              key={reloadKey}
              src={`https://www.tiktok.com/player/v1/${tikTokId}?autoplay=0`}
              title={clip.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. Reddit Embed
  if (isReddit && redditUrl) {
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-semibold text-orange-500">Reddit Discussion</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              In-App Embed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Reload Reddit Card"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Open on Reddit"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className={`p-3 sm:p-4 ${isDark ? 'bg-[#0E0E0E]' : 'bg-white'}`}>
          <div className="w-full min-h-[320px] max-h-[500px] overflow-y-auto rounded-xl border border-[#2A2A2A] bg-black/30">
            <iframe
              key={reloadKey}
              src={redditUrl}
              title={clip.title}
              sandbox="allow-scripts allow-same-origin allow-popups"
              className="w-full h-[480px] border-0"
              scrolling="yes"
            />
          </div>
        </div>
      </div>
    );
  }

  // 5. Spotify In-App Player
  if (isSpotify && spotify.id) {
    const isCompact = spotify.type === 'track' || spotify.type === 'episode';
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-500">Spotify Audio</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Interactive Player
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Open in Spotify App"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-3">
          <iframe
            key={reloadKey}
            src={`https://open.spotify.com/embed/${spotify.type}/${spotify.id}?utm_source=generator&theme=0`}
            width="100%"
            height={isCompact ? '152' : '352'}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl shadow-lg border-0"
          />
        </div>
      </div>
    );
  }

  // 6. Twitter / X Post Embed
  if (isTwitter && tweetId) {
    return (
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
      }`}>
        <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
          isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold text-sky-400">X / Twitter</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-300 border border-sky-400/20">
              In-App Embed
            </span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Open on X"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className={`p-4 flex justify-center ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
          <iframe
            key={reloadKey}
            src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=${isDark ? 'dark' : 'light'}`}
            title={clip.title}
            className="w-full max-w-[500px] min-h-[300px] border-0 rounded-xl"
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  // 7. Standard Website / Article / Documentation (Interactive Dual-Mode: Live Sandbox or Clean Reader)
  const hasReaderText = Boolean(clip.selectedText || clip.summary);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isDark ? 'bg-[#141414] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200 shadow-sm'
    }`}>
      {/* Header with Switcher */}
      <div className={`px-3.5 py-2 border-b flex items-center justify-between text-xs font-mono ${
        isDark ? 'bg-[#181818] border-[#242424] text-[#A0A0A0]' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-blue-400">Website View</span>
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-black/20 dark:bg-white/5 rounded-lg p-0.5 border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode('embed')}
              className={`px-2 py-0.5 rounded text-[10px] font-sans flex items-center gap-1 transition-all ${
                viewMode === 'embed'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" /> Live
            </button>
            {hasReaderText && (
              <button
                type="button"
                onClick={() => setViewMode('reader')}
                className={`px-2 py-0.5 rounded text-[10px] font-sans flex items-center gap-1 transition-all ${
                  viewMode === 'reader'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" /> Reader
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Reload Page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'embed' ? (
        <div className="relative">
          {/* Iframe for Live Website */}
          <div className="w-full h-[380px] bg-white rounded-b-xl overflow-hidden relative">
            <iframe
              key={reloadKey}
              src={url}
              title={clip.title}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="w-full h-full border-0"
              onError={() => setIframeError(true)}
            />
          </div>

          {/* Fallback Notice for Frame-Blocked Sites */}
          <div className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
            isDark ? 'bg-[#181818] border-[#222222] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live sandbox enabled</span>
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
            >
              Open external <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        /* Distraction-Free Reader View */
        <div className={`p-4 sm:p-5 max-h-[380px] overflow-y-auto space-y-3 font-serif leading-relaxed text-sm ${
          isDark ? 'bg-[#111111] text-[#E0E0E0]' : 'bg-white text-slate-800'
        }`}>
          <div className="font-sans text-xs text-[#888888] font-mono border-b pb-2 flex items-center justify-between">
            <span>Clean Reader Mode</span>
            <span>{clip.selectedText ? 'Captured Article Snippet' : 'Summary'}</span>
          </div>
          <div className="whitespace-pre-wrap">
            {clip.selectedText || clip.summary}
          </div>
        </div>
      )}
    </div>
  );
};
