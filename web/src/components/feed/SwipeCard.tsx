import React, { useState } from 'react';
import { ExternalLink, Calendar, Clock, Check, Sparkles } from 'lucide-react';
import { SwipeCardItem, SwipeActionType } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';
import {
  HeartActionIcon,
  CheckActionIcon,
  WatchlistActionIcon,
  SnoozeActionIcon,
  ArchiveActionIcon,
  NoteActionIcon,
  ShareActionIcon,
  ExportActionIcon,
} from '../ActionIcons';

interface SwipeCardProps {
  card: SwipeCardItem;
  onAction: (cardId: string, action: SwipeActionType, note?: string) => void;
  isActive: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ card, onAction, isActive }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);
  const [checkBounce, setCheckBounce] = useState(false);

  const handleLike = () => {
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 400);
    onAction(card.id, 'like');
  };

  const handleReview = () => {
    setCheckBounce(true);
    setTimeout(() => setCheckBounce(false), 500);
    onAction(card.id, 'reviewed');
  };

  const handleShare = () => {
    if (navigator?.clipboard && card.url) {
      navigator.clipboard.writeText(card.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    onAction(card.id, 'share');
  };

  const submitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteText.trim()) {
      onAction(card.id, 'note', noteText.trim());
      setNoteText('');
      setShowNoteInput(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto h-[560px] sm:h-[600px] flex flex-col justify-between bg-[#111111]/95 border border-white/[0.12] rounded-3xl p-6 sm:p-7 backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300">
      {/* Background ambient neon glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#3FE769]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
              <WebsiteIcon domain={card.domain} url={card.url} className="w-5 h-5 object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white/90 truncate block">
                {card.domain}
              </span>
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {card.time_ago}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 border border-white/10 font-mono">
              {card.content_type}
            </span>
            <a
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10"
              title="Open original link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Clip Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-3 mb-3 hover:text-[#3FE769] transition-colors">
          <a href={card.url} target="_blank" rel="noopener noreferrer">
            {card.title}
          </a>
        </h2>

        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {card.tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] text-white/60 border border-white/[0.06] font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 2-Line Summary */}
        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 mb-5 font-normal">
          {card.summary}
        </p>

        {/* Key Takeaway Callout Box */}
        <div className="relative p-4 rounded-2xl bg-[#161616]/90 border border-[#3FE769]/20 shadow-lg shadow-[#3FE769]/5">
          <div className="flex items-center gap-1.5 mb-1.5 text-[#3FE769]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Key Takeaway
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
            "{card.key_takeaway}"
          </p>
        </div>

        {/* Deadline Indicator if available */}
        {card.deadline_date && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span className="font-semibold">Deadline:</span>
            <span>{card.deadline_date}</span>
            {card.days_until_deadline !== null && card.days_until_deadline !== undefined && (
              <span className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20">
                {card.days_until_deadline > 0 ? `${card.days_until_deadline}d left` : 'Due today'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Note Inline Form */}
      {showNoteInput && (
        <form onSubmit={submitNote} className="mb-3 animate-fadeIn">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#1A1A1A] border border-white/15">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add reflection or action note..."
              autoFocus
              className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none px-2"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-[#3FE769] text-black text-xs font-bold hover:bg-[#3FE769]/90 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowNoteInput(false)}
              className="p-1 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        </form>
      )}

      {/* Bottom Floating Action Toolbar (All 8 Actions with Real SVGs) */}
      <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-1 sm:gap-2">
        {/* ❤️ Like */}
        <button
          onClick={handleLike}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            card.is_liked
              ? 'bg-red-500/15 text-red-500 border-red-500/30'
              : 'bg-white/5 text-white/60 hover:text-red-400 hover:bg-white/10 border-white/5'
          } ${heartBounce ? 'scale-125' : ''}`}
          title="Like"
        >
          <HeartActionIcon className="w-4 h-4 sm:w-5 sm:h-5" filled={card.is_liked} />
        </button>

        {/* ✅ Mark Reviewed */}
        <button
          onClick={handleReview}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 border font-medium text-xs ${
            card.is_reviewed
              ? 'bg-[#3FE769]/20 text-[#3FE769] border-[#3FE769]/40 font-bold'
              : 'bg-[#3FE769]/10 text-[#3FE769] hover:bg-[#3FE769]/20 border-[#3FE769]/20'
          } ${checkBounce ? 'scale-110' : ''}`}
          title="Mark Reviewed / Mastered"
        >
          <CheckActionIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" filled={card.is_reviewed} />
          <span className="hidden sm:inline">
            {card.is_reviewed ? 'Reviewed' : 'Review'}
          </span>
        </button>

        {/* 🔖 Watchlist */}
        <button
          onClick={() => onAction(card.id, 'watchlist')}
          className={`p-2.5 rounded-xl transition-all duration-200 border ${
            card.is_watchlisted
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-white/5 text-white/60 hover:text-amber-300 hover:bg-white/10 border-white/5'
          }`}
          title="Watchlist"
        >
          <WatchlistActionIcon className="w-4 h-4 sm:w-5 sm:h-5" filled={card.is_watchlisted} />
        </button>

        {/* 💤 Snooze 24h */}
        <button
          onClick={() => onAction(card.id, 'snooze')}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-purple-300 transition-colors border border-white/5"
          title="Snooze 24h"
        >
          <SnoozeActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 📝 Quick Note */}
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className={`p-2.5 rounded-xl transition-colors border ${
            showNoteInput
              ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/30'
              : 'bg-white/5 text-white/60 hover:text-sky-300 hover:bg-white/10 border-white/5'
          }`}
          title="Add Quick Note"
        >
          <NoteActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 🔗 Share */}
        <button
          onClick={handleShare}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5 relative"
          title="Copy Link"
        >
          {copied ? (
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#3FE769]" />
          ) : (
            <ShareActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* 🗑️ Archive */}
        <button
          onClick={() => onAction(card.id, 'archive')}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors border border-white/5"
          title="Archive"
        >
          <ArchiveActionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
