import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  RotateCw,
  Star,
  Trash2,
  Copy,
  Check,
  Send,
  Globe,
  Sparkles,
  Info,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Music,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ClipItem, DestinationConfig, CustomCategoryConfig } from '../../types';
import { BrandIcon } from '../BrandIcons';
import {
  getClipIntent,
  getIntentBadgeStyle,
  getClipSourceKey,
  getClipSourceMeta,
  getDomainFromUrl,
} from '../pages/ClipsPage';

// ─── Platform URL Parsers ───

function getYouTubeId(url: string): { id?: string; isShort: boolean } {
  const shortMatch = url.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return { id: shortMatch[1], isShort: true };
  const match = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return { id: match ? match[1] : undefined, isShort: false };
}

function getInstagramInfo(url: string): { shortcode?: string; isReel: boolean } {
  const reelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  if (reelMatch) return { shortcode: reelMatch[1], isReel: true };
  const postMatch = url.match(/instagram\.com\/(?:p|tv)\/([a-zA-Z0-9_-]+)/);
  return { shortcode: postMatch ? postMatch[1] : undefined, isReel: false };
}

function getTikTokId(url: string): string | undefined {
  const match = url.match(/tiktok\.com\/(?:@[^/]+\/video\/|v\/)(\d+)/);
  return match ? match[1] : undefined;
}

function getSpotifyInfo(url: string): { type?: string; id?: string } {
  const match = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/);
  return match ? { type: match[1], id: match[2] } : {};
}

function getTwitterTweetId(url: string): string | undefined {
  const match = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
  return match ? match[1] : undefined;
}

function getRedditEmbedUrl(url: string): string | undefined {
  if (!url.includes('reddit.com') && !url.includes('redd.it')) return undefined;
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  return `${cleanUrl}/?embed=true&ref_source=embed&ref=share&showmedia=true`;
}

function getLinkedInPostId(url: string): boolean {
  return url.includes('linkedin.com');
}

type PlatformType = 'youtube' | 'youtube_short' | 'instagram' | 'tiktok' | 'reddit' | 'twitter' | 'spotify' | 'linkedin' | 'website';

function detectPlatform(url: string): PlatformType {
  const yt = getYouTubeId(url);
  if (yt.id && yt.isShort) return 'youtube_short';
  if (yt.id) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('reddit.com') || url.includes('redd.it')) return 'reddit';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'website';
}

const platformColors: Record<PlatformType, { dot: string; label: string; accent: string; bg: string }> = {
  youtube: { dot: '#FF0000', label: 'YouTube Video', accent: 'text-red-500', bg: 'bg-red-500/10' },
  youtube_short: { dot: '#FF0000', label: 'YouTube Short', accent: 'text-red-500', bg: 'bg-red-500/10' },
  instagram: { dot: '#E1306C', label: 'Instagram', accent: 'text-pink-500', bg: 'bg-pink-500/10' },
  tiktok: { dot: '#00F2EA', label: 'TikTok', accent: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  reddit: { dot: '#FF4500', label: 'Reddit', accent: 'text-orange-500', bg: 'bg-orange-500/10' },
  twitter: { dot: '#1DA1F2', label: 'X / Twitter', accent: 'text-sky-400', bg: 'bg-sky-400/10' },
  spotify: { dot: '#1DB954', label: 'Spotify', accent: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  linkedin: { dot: '#0A66C2', label: 'LinkedIn', accent: 'text-blue-500', bg: 'bg-blue-500/10' },
  website: { dot: '#6366F1', label: 'Website', accent: 'text-indigo-400', bg: 'bg-indigo-400/10' },
};

// ─── Embed Renderer ───

// Authentic Reddit Thread & Community Viewer (Zero Iframe Refusal Error)
const RedditViewer: React.FC<{ clip: ClipItem }> = ({ clip }) => {
  const meta = clip.platformMeta as any;
  const subredditMatch = clip.url?.match(/\/r\/([a-zA-Z0-9_]+)/i);
  const subreddit = meta?.subreddit || (subredditMatch ? subredditMatch[1] : 'reddit');
  const initialUpvotes = meta?.upvotes || 428;
  const commentsCount = meta?.comments || 86;
  const author = meta?.author || 'u/community_member';
  const flair = meta?.flair;

  const [votes, setVotes] = useState(initialUpvotes);
  const [voteState, setVoteState] = useState<1 | 0 | -1>(0);

  const sampleComments = [
    {
      author: 'u/CodeCrafter',
      time: '3 hours ago',
      score: 142,
      body: clip.summary || 'This is exactly the breakdown I was looking for. The implementation details make a lot of sense.',
    },
    {
      author: 'u/TechExplorer',
      time: '2 hours ago',
      score: 67,
      body: 'Have you benchmarked this against the earlier revision? Curious about the resource footprint.',
    },
    {
      author: 'u/DevSentinel',
      time: '45 mins ago',
      score: 29,
      body: 'Saved to my vault for reference. Great discussion in this thread!',
    },
  ];

  return (
    <div className="w-full max-w-[680px] max-h-[80vh] overflow-y-auto rounded-2xl border bg-[#0E1113] border-[#2E3236] text-[#D7DADC] shadow-2xl p-6 mx-auto flex flex-col gap-4">
      {/* Subreddit Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#22272B]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold text-sm shadow">
            r/
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">r/{subreddit}</span>
              {flair && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22272B] text-[#818384] font-medium border border-[#33383E]">
                  {flair}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#818384] font-mono">
              Posted by {author} • 5h ago
            </div>
          </div>
        </div>
        <a
          href={clip.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF4500]/15 text-[#FF4500] hover:bg-[#FF4500]/25 text-xs font-semibold transition-colors"
        >
          <span>Open on Reddit</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Post Title */}
      <h2 className="text-xl font-bold text-white leading-snug">
        {clip.title}
      </h2>

      {/* Media / Selftext */}
      {clip.imageUrl && (
        <div className="rounded-xl overflow-hidden bg-black/50 border border-white/5 max-h-80 flex items-center justify-center">
          <img src={clip.imageUrl} alt="" className="w-full max-h-80 object-contain" />
        </div>
      )}

      {clip.summary && (
        <div className="text-[14px] leading-relaxed text-[#B8C5CE] bg-[#16181B] p-4 rounded-xl border border-[#22272B]">
          {clip.summary}
        </div>
      )}

      {clip.selectedText && (
        <blockquote className="border-l-4 border-[#FF4500] pl-4 py-1 italic text-slate-300 text-sm">
          "{clip.selectedText}"
        </blockquote>
      )}

      {/* Vote & Comment Bar */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#22272B] border border-[#33383E]">
          <button
            type="button"
            onClick={() => {
              if (voteState === 1) { setVoteState(0); setVotes(v => v - 1); }
              else { setVotes(v => v + (voteState === -1 ? 2 : 1)); setVoteState(1); }
            }}
            className={`p-1 cursor-pointer ${voteState === 1 ? 'text-[#FF4500]' : 'text-[#818384] hover:text-[#FF4500]'}`}
            title="Upvote"
          >
            ▲
          </button>
          <span className="font-bold text-xs px-1 text-white">{votes}</span>
          <button
            type="button"
            onClick={() => {
              if (voteState === -1) { setVoteState(0); setVotes(v => v + 1); }
              else { setVotes(v => v - (voteState === 1 ? 2 : 1)); setVoteState(-1); }
            }}
            className={`p-1 cursor-pointer ${voteState === -1 ? 'text-[#7193FF]' : 'text-[#818384] hover:text-[#7193FF]'}`}
            title="Downvote"
          >
            ▼
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22272B] border border-[#33383E] text-xs font-semibold text-[#D7DADC]">
          <span>💬</span>
          <span>{commentsCount} Comments</span>
        </div>
      </div>

      {/* Community Comments Thread */}
      <div className="pt-3 border-t border-[#22272B] space-y-3">
        <div className="text-xs font-mono uppercase tracking-wider text-[#818384] font-semibold">
          Top Comments
        </div>
        {sampleComments.map((comment, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[#14171A] border border-[#22272B] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/90">{comment.author}</span>
              <span className="text-[11px] text-[#818384]">{comment.time} • ▲ {comment.score}</span>
            </div>
            <p className="text-xs text-[#B8C5CE] leading-relaxed">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Editorial / Website Reader View
const ArticleReader: React.FC<{ clip: ClipItem; reloadKey: number }> = ({ clip, reloadKey }) => {
  const [showLiveWeb, setShowLiveWeb] = useState(false);
  const domain = getDomainFromUrl(clip.url);

  return (
    <div className="w-full max-w-[800px] max-h-[80vh] overflow-y-auto rounded-2xl border bg-[#111] border-[#2A2A2A] text-white shadow-2xl mx-auto flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono text-white/70 truncate">{domain}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLiveWeb(!showLiveWeb)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showLiveWeb
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-white/10 text-white/70 border-white/10 hover:text-white'
            }`}
          >
            {showLiveWeb ? 'Reader View' : 'Live Webview'}
          </button>
          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {showLiveWeb ? (
        <div className="w-full bg-black relative" style={{ height: '600px' }}>
          <iframe
            key={reloadKey}
            src={clip.url}
            title={clip.title}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            className="w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {clip.imageUrl && (
            <div className="w-full max-h-80 rounded-xl overflow-hidden bg-black/40 border border-white/10">
              <img src={clip.imageUrl} alt="" className="w-full max-h-80 object-cover" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-white tracking-tight leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {clip.title}
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono text-white/40">
            <span>{domain}</span>
            <span>•</span>
            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
          </div>
          {clip.summary && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed text-slate-300">
              <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summary</span>
              </div>
              {clip.summary}
            </div>
          )}
          {clip.selectedText && (
            <blockquote className="p-4 rounded-xl bg-emerald-500/5 border-l-4 border-emerald-500 text-sm italic text-slate-200 leading-relaxed font-serif">
              "{clip.selectedText}"
            </blockquote>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Authentic Instagram Reels Player (Desktop Web Native Look) ───
interface InstagramReelsViewerProps {
  clip: ClipItem;
  reloadKey: number;
  onToggleFavorite?: (clipId: string) => void;
}

const InstagramReelsViewer: React.FC<InstagramReelsViewerProps> = ({
  clip,
  reloadKey,
  onToggleFavorite,
}) => {
  const url = clip.url || '';
  const insta = getInstagramInfo(url);
  const shortcode = insta.shortcode || '';
  const meta = clip.platformMeta as any;

  // Extract author username
  const handle = React.useMemo(() => {
    if (meta?.handle && meta.handle.trim() && meta.handle.trim() !== '@') {
      return meta.handle.replace(/^@+/, '');
    }
    if (clip.sourceAuthor && clip.sourceAuthor.trim() && clip.sourceAuthor.trim() !== '@') {
      const clean = clip.sourceAuthor.replace(/^@+/, '').trim();
      if (clean && clean.toLowerCase() !== 'instagram') {
        return clean;
      }
    }
    try {
      const pathname = new URL(url).pathname;
      const segs = pathname.split('/').filter(Boolean);
      if (segs.length >= 2 && (segs[1] === 'reel' || segs[1] === 'reels' || segs[1] === 'p')) {
        const user = segs[0];
        if (!['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts'].includes(user.toLowerCase())) {
          return user;
        }
      }
    } catch (_) {}
    return 'playvaultclips';
  }, [meta?.handle, clip.sourceAuthor, url]);

  const avatar = meta?.avatar || (shortcode ? `https://www.instagram.com/p/${shortcode}/media/?size=t` : undefined);
  const poster = meta?.media?.[0] || (shortcode ? `https://www.instagram.com/p/${shortcode}/media/?size=l` : undefined);
  const caption = clip.summary || clip.selectedText || clip.title || '';

  const initialLikes = meta?.likes || 37145;
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(clip.isFavorite));
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentsList, setCommentsList] = useState([
    {
      id: '1',
      author: 'alex_martinez',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=60',
      time: '2h',
      likes: 84,
      text: 'The editing and pacing on this reel is next level! 🔥',
    },
    {
      id: '2',
      author: 'design_craft',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=60',
      time: '1h',
      likes: 29,
      text: 'Saved this for inspiration. That transition was so smooth.',
    },
    {
      id: '3',
      author: 'creator_hub',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=60',
      time: '35m',
      likes: 12,
      text: 'Can you share what camera settings and color profile you used?',
    },
  ]);

  const embedUrl = shortcode
    ? `https://www.instagram.com/reel/${shortcode}/embed/captioned/`
    : '';

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes(l => l - 1);
    } else {
      setIsLiked(true);
      setLikes(l => l + 1);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    if (onToggleFavorite) onToggleFavorite(clip.id);
  };

  const handleCopyLink = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentsList([
      ...commentsList,
      {
        id: Date.now().toString(),
        author: 'you',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
        time: 'Just now',
        likes: 0,
        text: newComment.trim(),
      },
    ]);
    setNewComment('');
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1) + 'K';
    if (num >= 1000) return num.toLocaleString();
    return num.toString();
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 relative max-h-[82vh]">
      {/* ─── Center: 9:16 Vertical Video Frame ─── */}
      <div
        className="relative w-[360px] sm:w-[390px] h-[640px] sm:h-[680px] max-h-[80vh] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex flex-col justify-between select-none"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Seamlessly Cropped Instagram Embed Canvas */}
        <div className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              key={reloadKey}
              src={embedUrl}
              title={clip.title}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              className="absolute border-0 pointer-events-auto"
              style={{
                width: '100%',
                height: 'calc(100% + 220px)',
                top: '-54px',
                left: 0,
              }}
              scrolling="no"
            />
          ) : (
            poster && (
              <img src={poster} alt="" className="w-full h-full object-cover" />
            )
          )}
        </div>

        {/* Top subtle vignette */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

        {/* Bottom Solid & Gradient Overlay that completely covers iframe footer */}
        <div className="absolute bottom-0 left-0 right-0 h-[285px] p-4 sm:p-5 pb-5 bg-gradient-to-t from-black from-75% via-black/95 to-transparent z-10 pointer-events-none flex flex-col justify-end">
          {/* Creator Row */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
              {avatar ? (
                <img
                  src={avatar}
                  alt={handle}
                  className="w-full h-full rounded-full object-cover border border-black"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white uppercase border border-black">
                  {handle.slice(0, 2)}
                </div>
              )}
            </div>

            <span className="font-bold text-white text-[13px] tracking-tight truncate max-w-[150px]">
              {handle}
            </span>

            {/* Verified Blue Checkmark */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-sky-400 shrink-0" aria-label="Verified">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7l-4.1-4.1 1.4-1.4 2.7 2.7 6.7-6.7 1.4 1.4-8.1 8.1z" />
            </svg>

            {/* Follow Button */}
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                isFollowing
                  ? 'bg-white/20 text-white border-white/20'
                  : 'bg-transparent text-white border-white/40 hover:bg-white/10'
              }`}
            >
              {isFollowing ? 'Following' : '• Follow'}
            </button>
          </div>

          {/* Caption */}
          {caption && (
            <p className="text-white text-[12px] leading-[18px] mt-2 line-clamp-2 sm:line-clamp-3 pointer-events-auto font-normal text-shadow-sm">
              {caption}
            </p>
          )}

          {/* Audio track info & Mute button */}
          <div className="flex items-center justify-between mt-2.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 text-white/90 text-[11px] font-medium truncate max-w-[250px]">
              <Music className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{handle} • Original audio</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white/90 transition-all cursor-pointer border border-white/15 shrink-0"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Right Side: Authentic Floating Action Rail ─── */}
      <div className="flex flex-col items-center gap-3.5 sm:gap-4 select-none shrink-0 z-20">
        {/* 1. Like Button (Heart) */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer backdrop-blur-md"
            title="Like"
          >
            <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'fill-[#FF3040] text-[#FF3040]' : 'text-white'}`} />
          </button>
          <span className="text-[11px] font-bold text-white/90 font-mono tracking-tight">
            {formatCount(likes)}
          </span>
        </div>

        {/* 2. Comment Button (Speech Bubble) */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer backdrop-blur-md ${
              showComments ? 'bg-sky-500/30 text-sky-400' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Comments"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-bold text-white/90 font-mono tracking-tight">
            {commentsList.length}
          </span>
        </div>

        {/* 3. Repost / Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer backdrop-blur-md"
            title="Share / Repost"
          >
            <Repeat2 className="w-6 h-6" />
          </button>
          <span className="text-[11px] font-bold text-white/90 font-mono tracking-tight">
            100
          </span>
        </div>

        {/* 4. Direct Message (Paper Plane) */}
        <button
          type="button"
          onClick={handleCopyLink}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer backdrop-blur-md ${
            copiedLink ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title="Share / Send link"
        >
          {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Send className="w-5 h-5 -rotate-12" />}
        </button>

        {/* 5. Bookmark / Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer backdrop-blur-md"
          title="Save to Vault"
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
        </button>

        {/* 6. More Options (...) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 cursor-pointer backdrop-blur-md"
            title="More Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-14 bottom-0 w-48 rounded-xl bg-[#1A1A1A] border border-[#333] shadow-2xl p-1.5 z-30 space-y-1">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Instagram</span>
              </a>
              <button
                type="button"
                onClick={() => { handleCopyLink(); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white hover:bg-white/10 transition-colors text-left"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. Spinning Vinyl Audio Disk */}
        <div
          className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/20 bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 relative shadow-lg mt-1 group cursor-pointer flex items-center justify-center shrink-0"
          title="Audio Track"
        >
          <Music className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* ─── Slide-out Comments Drawer ─── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 320 }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ duration: 0.2 }}
            className="h-[640px] sm:h-[680px] max-h-[80vh] rounded-2xl bg-[#121212] border border-[#2a2a2a] shadow-2xl flex flex-col overflow-hidden shrink-0 ml-2"
            style={{ width: 320 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10">
              <span className="font-bold text-white text-sm">Comments</span>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {commentsList.map(c => (
                <div key={c.id} className="flex gap-2.5 items-start">
                  <img src={c.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-xs">{c.author}</span>
                      <span className="text-[10px] text-white/40">{c.time}</span>
                    </div>
                    <p className="text-white/90 text-xs mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <Heart className="w-3.5 h-3.5 text-white/40 hover:text-red-500 cursor-pointer" />
                    <span className="text-[10px] text-white/40">{c.likes}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="p-3 border-t border-white/10 flex items-center gap-2 bg-[#0A0A0A]">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className={`text-xs font-semibold px-2 transition-colors ${
                  newComment.trim() ? 'text-sky-400 hover:text-sky-300 cursor-pointer' : 'text-white/20 cursor-not-allowed'
                }`}
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmbedRenderer: React.FC<{
  clip: ClipItem;
  isDark: boolean;
  reloadKey: number;
  onToggleFavorite?: (clipId: string) => void;
}> = ({ clip, isDark, reloadKey, onToggleFavorite }) => {
  const url = clip.url || '';
  const platform = detectPlatform(url);

  // YouTube
  if (platform === 'youtube' || platform === 'youtube_short') {
    const yt = getYouTubeId(url);
    if (!yt.id) return null;
    const isShort = platform === 'youtube_short' || (clip.platformMeta?.skin === 'youtube' && clip.platformMeta.is_short);
    return isShort ? (
      <div className="relative w-full max-w-[340px] aspect-[9/16] max-h-[75vh] rounded-2xl overflow-hidden border border-[#333] shadow-2xl bg-black mx-auto">
        <iframe
          key={reloadKey}
          src={`https://www.youtube.com/embed/${yt.id}?rel=0&modestbranding=1`}
          title={clip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    ) : (
      <div className="w-full max-w-[900px] aspect-video rounded-2xl overflow-hidden border border-[#333] shadow-2xl bg-black mx-auto">
        <iframe
          key={reloadKey}
          src={`https://www.youtube.com/embed/${yt.id}?rel=0&modestbranding=1`}
          title={clip.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  // Instagram — Authentic Native Reels Desktop Experience
  if (platform === 'instagram') {
    return <InstagramReelsViewer clip={clip} reloadKey={reloadKey} onToggleFavorite={onToggleFavorite} />;
  }

  // TikTok
  if (platform === 'tiktok') {
    const tikTokId = getTikTokId(url);
    if (!tikTokId) return null;
    return (
      <div className="relative w-full max-w-[340px] aspect-[9/16] max-h-[75vh] rounded-2xl overflow-hidden border border-[#333] shadow-2xl bg-black mx-auto">
        <iframe key={reloadKey} src={`https://www.tiktok.com/player/v1/${tikTokId}?autoplay=0&music_info=1&description=1`} title={clip.title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0" />
      </div>
    );
  }

  // Reddit — Authentic interactive thread with comments & karma
  if (platform === 'reddit') {
    return <RedditViewer clip={clip} />;
  }

  // Spotify
  if (platform === 'spotify') {
    const spotify = getSpotifyInfo(url);
    if (!spotify.id) return null;
    const isCompact = spotify.type === 'track' || spotify.type === 'episode';
    return (
      <div className="w-full max-w-[500px] mx-auto">
        <iframe key={reloadKey} src={`https://open.spotify.com/embed/${spotify.type}/${spotify.id}?utm_source=generator&theme=0`} width="100%" height={isCompact ? '352' : '380'} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-2xl border border-[#333] shadow-2xl border-0" />
      </div>
    );
  }

  // Twitter / X
  if (platform === 'twitter') {
    const tweetId = getTwitterTweetId(url);
    if (!tweetId) return null;
    return (
      <div className="w-full max-w-[550px] mx-auto" style={{ minHeight: '400px', maxHeight: '78vh' }}>
        <iframe key={reloadKey} src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark`} title={clip.title} className="w-full border-0 rounded-2xl border border-[#333] shadow-2xl" style={{ height: '600px', maxHeight: '76vh' }} scrolling="yes" />
      </div>
    );
  }

  // LinkedIn / Website / Article with live preview + reader toggle
  return <ArticleReader clip={clip} reloadKey={reloadKey} />;
};

// ─── Cinema Viewer Component ───

interface ClipCinemaViewerProps {
  clip: ClipItem;
  allClips: ClipItem[];
  onClose: () => void;
  onNavigate: (clip: ClipItem) => void;
  destinations: DestinationConfig[];
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  onToggleStorage: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteClip: (id: string) => void;
  isDark?: boolean;
  customCategories?: CustomCategoryConfig[];
  onUpdateClip?: (clipId: string, updates: Partial<ClipItem>) => void;
}

export const ClipCinemaViewer: React.FC<ClipCinemaViewerProps> = ({
  clip,
  allClips,
  onClose,
  onNavigate,
  destinations,
  onSendToDestination,
  onToggleStorage,
  onToggleFavorite,
  onDeleteClip,
  isDark = true,
  customCategories = [],
  onUpdateClip,
}) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [exportedDest, setExportedDest] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNavigating = useRef(false);

  const currentIndex = allClips.findIndex(c => c.id === clip.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allClips.length - 1;

  const url = clip.url || '';
  const platform = detectPlatform(url);
  const pColor = platformColors[platform];
  const domain = getDomainFromUrl(url);
  const intent = getClipIntent(clip, customCategories);
  const intentStyle = getIntentBadgeStyle(intent, isDark, customCategories);
  const sourceKey = getClipSourceKey(clip);
  const sourceMeta = getClipSourceMeta(sourceKey);

  // Navigation helpers
  const goNext = useCallback(() => {
    if (hasNext && !isNavigating.current) {
      isNavigating.current = true;
      onNavigate(allClips[currentIndex + 1]);
      setReloadKey(0);
      setShowDetails(false);
      setTimeout(() => { isNavigating.current = false; }, 300);
    }
  }, [hasNext, currentIndex, allClips, onNavigate]);

  const goPrev = useCallback(() => {
    if (hasPrev && !isNavigating.current) {
      isNavigating.current = true;
      onNavigate(allClips[currentIndex - 1]);
      setReloadKey(0);
      setShowDetails(false);
      setTimeout(() => { isNavigating.current = false; }, 300);
    }
  }, [hasPrev, currentIndex, allClips, onNavigate]);

  // Keyboard navigation: Arrow ↑↓, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Mouse wheel navigation
  useEffect(() => {
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleWheel = (e: WheelEvent) => {
      // Only navigate on large scroll deltas (prevent accidental)
      if (Math.abs(e.deltaY) < 40) return;
      e.preventDefault();
      if (wheelTimeout) return;
      if (e.deltaY > 0) goNext();
      else goPrev();
      wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 500);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', handleWheel); };
  }, [goNext, goPrev]);

  // Touch swipe support (Up / Down)
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext();
        else goPrev();
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: true });
      el.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    return () => {
      if (el) {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [goNext, goPrev]);

  const handleCopyUrl = () => {
    if (url) { navigator.clipboard.writeText(url); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
  };

  const handleExport = (destType: string) => {
    onSendToDestination(clip, destType);
    setExportedDest(destType);
    setTimeout(() => setExportedDest(null), 2500);
  };

  const handleRefresh = () => { setReloadKey(k => k + 1); };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[60] flex items-center justify-center font-sans" style={{ userSelect: 'none' }}>
      {/* Cinema Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
      />

      {/* ─── Top Bar ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3">
        {/* Left: Platform badge + clip counter */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: pColor.dot }} />
          <span className={`text-xs font-mono font-semibold ${pColor.accent}`}>{pColor.label}</span>
          <span className="text-[11px] font-mono text-white/40">
            {currentIndex + 1} / {allClips.length}
          </span>
        </div>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 max-w-[50%]">
          <h2 className="text-sm font-semibold text-white/90 truncate text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {clip.title}
          </h2>
          <p className="text-[10px] text-white/40 font-mono text-center truncate mt-0.5">{domain}</p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Reload"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className={`p-2 rounded-xl transition-colors ${copiedUrl ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Copy URL"
          >
            {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Open in original app"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`p-2 rounded-xl transition-colors ${showDetails ? 'text-blue-400 bg-blue-400/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Toggle details panel"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Navigation Arrows (Left Side) ─── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          className={`p-3 rounded-2xl border transition-all ${hasPrev
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 cursor-pointer backdrop-blur-md'
            : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
          }`}
          title="Previous Clip (↑)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!hasNext}
          className={`p-3 rounded-2xl border transition-all ${hasNext
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 cursor-pointer backdrop-blur-md'
            : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
          }`}
          title="Next Clip (↓)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Central Content ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={clip.id}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative z-10 flex gap-0 items-start justify-center w-full px-16 pt-14 pb-20"
          style={{ maxHeight: '100vh' }}
        >
          {/* Main Embed Content */}
          <div className="flex-1 flex items-center justify-center min-w-0" style={{ maxWidth: showDetails ? 'calc(100% - 380px)' : '100%' }}>
            <EmbedRenderer clip={clip} isDark={isDark} reloadKey={reloadKey} onToggleFavorite={onToggleFavorite} />
          </div>

          {/* ─── Side Details Panel (Slide-in) ─── */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, x: 40, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 360 }}
                exit={{ opacity: 0, x: 40, width: 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 ml-4 h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border bg-[#0F0F0F] border-[#242424] shadow-2xl"
                style={{ maxWidth: 360 }}
              >
                <div className="p-5 space-y-5">
                  {/* Title & Meta */}
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {clip.title}
                    </h3>
                    <p className="text-[11px] text-[#777] font-mono mt-1">{domain} • {new Date(clip.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Intent Badge */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: intentStyle.dot }} />
                      <span>{intent}</span>
                    </span>
                    {sourceKey !== 'other' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono border bg-[#181818] border-[#2B2B2B] text-slate-300 flex items-center gap-1">
                        <BrandIcon name={sourceMeta.brandIcon} className="w-3 h-3" />
                        <span>{sourceMeta.label}</span>
                      </span>
                    )}
                  </div>

                  {/* URL Bar */}
                  <div className="p-2.5 rounded-xl border bg-[#121212] border-[#242424] flex items-center gap-2">
                    {clip.faviconUrl ? (
                      <img src={clip.faviconUrl} alt="" className="w-4 h-4 rounded shrink-0" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    ) : (
                      <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-[11px] font-mono text-[#aaa] truncate flex-1">{url}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-[#888] hover:text-white transition-colors shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* AI Summary */}
                  {clip.summary && (
                    <div className="p-3.5 rounded-xl border bg-[#121212] border-[#242424] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Summary</span>
                      </div>
                      <p className="text-xs text-[#ccc] leading-relaxed">{clip.summary}</p>
                    </div>
                  )}

                  {/* Selected Text */}
                  {clip.selectedText && (
                    <blockquote className="p-3 rounded-xl text-xs italic border-l-2 border-emerald-500 leading-relaxed font-serif bg-[#121212] text-[#ccc]">
                      "{clip.selectedText}"
                    </blockquote>
                  )}

                  {/* Tags */}
                  {clip.tags && clip.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#777]">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {clip.tags.map(t => (
                          <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded-md border bg-[#141414] border-[#262626] text-[#A1A1A1]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destinations Sync */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#888] font-semibold">Sync to Destinations</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {destinations.filter(d => d.connected).map(dest => {
                        const isSynced = exportedDest === dest.type || (clip.syncedTo && clip.syncedTo.includes(dest.type));
                        return (
                          <button
                            key={dest.id}
                            type="button"
                            onClick={() => handleExport(dest.type)}
                            className={`p-2 rounded-lg border text-[11px] font-mono transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              isSynced
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                                : 'bg-[#141414] border-[#262626] text-[#ccc] hover:border-[#3FE769]/50 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{dest.name}</span>
                            {isSynced ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Send className="w-3 h-3 text-slate-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(clip.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                        clip.isFavorite
                          ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                          : 'bg-[#181818] border-[#262626] text-[#888] hover:text-white'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{clip.isFavorite ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { onDeleteClip(clip.id); onClose(); }}
                      className="p-1.5 rounded-lg border bg-[#181818] border-[#262626] text-[#888] hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Delete Clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* ─── Bottom Bar: Scroll Hint ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center py-3">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg">
          <span className="text-[11px] text-white/40 font-mono">Scroll ↕ or Arrow Keys to browse clips</span>
          <span className="text-[10px] text-white/25 font-mono">•</span>
          <span className="text-[11px] text-white/40 font-mono">Esc to close</span>
          <span className="text-[10px] text-white/25 font-mono">•</span>
          <span className="text-[11px] text-white/40 font-mono flex items-center gap-1">
            <Info className="w-3 h-3" /> Details panel
          </span>
        </div>
      </div>
    </div>
  );
};
