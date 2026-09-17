import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { FeedWatchlistItem } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface FeedWatchlistWidgetProps {
  watchlist: FeedWatchlistItem[];
  isDark?: boolean;
}

export const FeedWatchlistWidget: React.FC<FeedWatchlistWidgetProps> = ({
  watchlist,
  isDark = true,
}) => {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Bookmark className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <h4
            className={`text-sm font-bold font-['Outfit',sans-serif] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Career &amp; Opportunity Radar
          </h4>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isDark ? 'bg-[#181818] border-[#2A2A2A] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          {watchlist.length} Tracked
        </span>
      </div>

      {watchlist.length === 0 ? (
        <div className="py-4 text-center">
          <p className={`text-xs font-mono ${isDark ? 'text-[#777777]' : 'text-slate-400'}`}>
            Tap bookmark icon on any opportunity card to pin it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                      isDark
                        ? 'bg-[#1A1812] text-amber-400 border-amber-500/30'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <WebsiteIcon domain={item.company || item.url} name={item.company} className="w-3 h-3" />
                    {item.company}
                  </span>
                  {item.deadline_date && (
                    <span className="text-[10px] font-mono text-rose-400">
                      Due {new Date(item.deadline_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <h5
                  className={`text-xs font-bold font-['Outfit',sans-serif] tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {item.title}
                </h5>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                  isDark ? 'border-[#262626] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
