import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Zap,
  ArrowRight,
  Share2,
  Calendar,
} from 'lucide-react';
import { FeedReviewItem } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface DailyReviewCarouselProps {
  items: FeedReviewItem[];
  streak: number;
  onReviewAction: (clipId: string, action: 'review' | 'master' | 'snooze' | 'watchlist') => void;
  isDark?: boolean;
}

export const DailyReviewCarousel: React.FC<DailyReviewCarouselProps> = ({
  items,
  streak,
  onReviewAction,
  isDark = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedSet, setReviewedSet] = useState<Set<string>>(new Set());

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex] || items[0];
  const isCurrentReviewed = reviewedSet.has(currentItem.id) || currentItem.is_reviewed;
  const completedCount = items.filter((it) => reviewedSet.has(it.id) || it.is_reviewed).length;
  const allCompleted = completedCount >= items.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleMaster = (clipId: string) => {
    setReviewedSet((prev) => new Set(prev).add(clipId));
    onReviewAction(clipId, 'master');
    // Auto-advance after 300ms
    if (currentIndex < items.length - 1) {
      setTimeout(() => setCurrentIndex((c) => c + 1), 320);
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 border relative overflow-hidden transition-all shadow-sm ${
        isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Top Background Gradient Glow */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-[#3FE769]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Streak & Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-[#181818] border-[#2A2A2A] text-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            <Flame className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3
                className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                The Daily 5 Spaced Review
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                  isDark
                    ? 'bg-[#1C1810] text-amber-400 border-amber-500/30'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <Flame className="w-3 h-3" />
                {streak}d Streak
              </span>
            </div>
            <p className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
              5 curated gems to review today • Retain knowledge, maintain your habit
            </p>
          </div>
        </div>

        {/* Carousel Progress Stepper & Dots */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 mr-2">
            {items.map((it, idx) => {
              const isDone = reviewedSet.has(it.id) || it.is_reviewed;
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={it.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'w-6 bg-[#3FE769]'
                        : 'w-6 bg-[#2D6A4F]'
                      : isDone
                      ? 'w-2 bg-emerald-500/60'
                      : isDark
                      ? 'w-2 bg-[#262626] hover:bg-[#333333]'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={`Item ${idx + 1}: ${it.title}`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#141414] border-[#262626] text-[#888888] hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Previous Gem"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[11px] font-mono px-1 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
              {currentIndex + 1} / {items.length}
            </span>
            <button
              onClick={handleNext}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#141414] border-[#262626] text-[#888888] hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Next Gem"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Card Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className={`p-4 sm:p-5 rounded-xl border relative z-10 transition-colors ${
            isDark ? 'bg-[#111111] border-[#262626]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {/* Category Badge */}
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: isDark ? `${currentItem.badge_color}18` : `${currentItem.badge_color}15`,
                    borderColor: `${currentItem.badge_color}40`,
                    color: currentItem.badge_color,
                  }}
                >
                  {currentItem.badge}
                </span>

                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                  isDark ? 'bg-[#181818] border-[#2A2A2A]' : 'bg-slate-100 border-slate-200'
                }`}>
                  <WebsiteIcon
                    domain={currentItem.domain}
                    url={currentItem.url}
                    name={currentItem.title}
                    className="w-3.5 h-3.5"
                  />
                  <span className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-600'}`}>
                    {currentItem.domain}
                  </span>
                </div>

                {currentItem.deadline_date && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400">
                    <Calendar className="w-3 h-3" />
                    Due {new Date(currentItem.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              <h4
                className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight leading-snug ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {currentItem.title}
              </h4>
            </div>

            <a
              href={currentItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-xs font-mono font-semibold transition-colors shrink-0 ${
                isDark ? 'text-[#3FE769] hover:text-[#52f87a]' : 'text-[#2D6A4F] hover:text-[#1e4835]'
              }`}
            >
              <span>Read Original</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Golden Nugget / Takeaway Box */}
          <div
            className={`p-3.5 rounded-xl border mb-3.5 ${
              isDark ? 'bg-[#161616] border-[#2A2A2A]' : 'bg-emerald-50/60 border-emerald-200/80'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
              <span className={isDark ? 'text-white' : 'text-slate-900'}>Core Takeaway</span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#EDEDED]' : 'text-slate-800'}`}>
              {currentItem.key_takeaway}
            </p>
          </div>

          {/* Actions Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#222222]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMaster(currentItem.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  isCurrentReviewed
                    ? isDark
                      ? 'bg-[#1F2E23] text-[#3FE769] border border-[#3FE769]/50'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isDark
                    ? 'bg-[#3FE769] text-black hover:bg-[#34c759]'
                    : 'bg-[#2D6A4F] text-white hover:bg-[#23533e]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCurrentReviewed ? 'Reviewed ✓' : 'Mark Reviewed'}</span>
              </button>

              <button
                onClick={() => onReviewAction(currentItem.id, 'snooze')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#181818] border-[#2A2A2A] text-[#888888] hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Remind me in 3 days"
              >
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                <span>Snooze 3d</span>
              </button>

              <button
                onClick={() => onReviewAction(currentItem.id, 'watchlist')}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  currentItem.is_watchlisted
                    ? isDark
                      ? 'bg-[#2A2210] border-amber-500/50 text-amber-400'
                      : 'bg-amber-100 border-amber-300 text-amber-800'
                    : isDark
                    ? 'bg-[#181818] border-[#2A2A2A] text-[#888888] hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Add to Opportunity Watchlist"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
              <span>{completedCount} of {items.length} daily gems reviewed</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
