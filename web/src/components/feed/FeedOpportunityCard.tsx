import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Share2,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { FeedStreamItem } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface FeedOpportunityCardProps {
  item: FeedStreamItem;
  onAction: (clipId: string, action: 'review' | 'master' | 'snooze' | 'watchlist' | 'archive') => void;
  isDark?: boolean;
}

export const FeedOpportunityCard: React.FC<FeedOpportunityCardProps> = ({
  item,
  onAction,
  isDark = true,
}) => {
  const isUrgent = item.days_left !== null && item.days_left !== undefined && item.days_left <= 3 && item.days_left >= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden group ${
        isUrgent
          ? isDark
            ? 'bg-[#140D0D] border-rose-900/60 hover:border-rose-700/80 shadow-[0_0_20px_rgba(239,68,68,0.06)]'
            : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
          : isDark
          ? 'bg-[#0A0A0A] border-[#262626] hover:border-[#3A3A3A]'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Top Meta Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isUrgent
                ? 'bg-rose-950/60 border-rose-800/60'
                : isDark
                ? 'bg-[#141414] border-[#262626]'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <WebsiteIcon
              domain={item.domain}
              url={item.url}
              name={item.title}
              className="w-5 h-5"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isUrgent
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                    : isDark
                    ? 'bg-[#181818] text-[#3FE769] border-[#2A2A2A]'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                Opportunity • {item.content_type.toUpperCase()}
              </span>

              {item.days_left !== null && item.days_left !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    item.is_expired
                      ? 'bg-red-950/70 text-red-400 border-red-800/60'
                      : isUrgent
                      ? 'bg-rose-950/70 text-rose-300 border-rose-700 animate-pulse'
                      : isDark
                      ? 'bg-[#181818] text-[#888888] border-[#2A2A2A]'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {item.is_expired
                    ? 'Expired'
                    : item.days_left === 0
                    ? 'Due Today!'
                    : `Due in ${item.days_left}d`}
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                <WebsiteIcon domain={item.domain} url={item.url} name={item.title} className="w-3.5 h-3.5" />
                {item.domain}
              </span>
            </div>

            <h4
              className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight transition-colors ${
                isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-900 group-hover:text-[#2D6A4F]'
              }`}
            >
              {item.title}
            </h4>
          </div>
        </div>

        <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
          {item.time_ago}
        </span>
      </div>

      {/* Description / Summary */}
      <p className={`text-sm leading-relaxed mb-3.5 ${isDark ? 'text-[#B4B4B4]' : 'text-slate-600'}`}>
        {item.summary}
      </p>

      {/* Key Takeaway / Value Proposition Box */}
      <div
        className={`p-3 rounded-xl border mb-4 flex items-start gap-2.5 ${
          isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
        <div className="min-w-0">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-0.5 ${isDark ? 'text-[#A1A1A1]' : 'text-slate-600'}`}>
            Opportunity Signal
          </span>
          <p className={`text-xs leading-snug ${isDark ? 'text-[#E5E5E5]' : 'text-slate-800'}`}>
            {item.key_takeaway}
          </p>
        </div>
      </div>

      {/* Footer Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#1E1E1E]">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#EDEDED] hover:bg-white text-black'
                : 'bg-[#2D6A4F] hover:bg-[#23533e] text-white'
            }`}
          >
            <span>Review &amp; Apply</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => onAction(item.id, 'review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              item.is_reviewed
                ? isDark
                  ? 'bg-[#16291C] text-[#3FE769] border-[#3FE769]/40'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isDark
                ? 'bg-[#141414] border-[#2A2A2A] text-[#888888] hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{item.is_reviewed ? 'Applied / Reviewed' : 'Mark Applied'}</span>
          </button>

          <button
            onClick={() => onAction(item.id, 'watchlist')}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              item.is_watchlisted
                ? isDark
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
                : isDark
                ? 'bg-[#141414] border-[#2A2A2A] text-[#888888] hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Add to Career Watchlist"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#777777]">
          <span>Synced: {item.destination_name}</span>
        </div>
      </div>
    </motion.div>
  );
};
