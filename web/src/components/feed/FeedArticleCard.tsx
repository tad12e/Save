import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { FeedStreamItem } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface FeedArticleCardProps {
  item: FeedStreamItem;
  onAction: (clipId: string, action: 'review' | 'master' | 'snooze' | 'watchlist' | 'archive') => void;
  isDark?: boolean;
}

export const FeedArticleCard: React.FC<FeedArticleCardProps> = ({
  item,
  onAction,
  isDark = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTakeaway = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.key_takeaway || item.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden group ${
        isDark
          ? 'bg-[#0A0A0A] border-[#262626] hover:border-[#3A3A3A]'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-[#141414] border-[#262626]'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <WebsiteIcon
              domain={item.domain}
              url={item.url}
              name={item.source_platform || item.title}
              className="w-5 h-5"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-[#121820] text-sky-400 border-sky-800/40'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
              >
                {item.content_type.toUpperCase()}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                <WebsiteIcon domain={item.domain} url={item.url} name={item.title} className="w-3.5 h-3.5" />
                {item.domain}
              </span>

              {item.author && (
                <span className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                  by {item.author}
                </span>
              )}
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

      {/* Excerpt / Summary */}
      <p className={`text-sm leading-relaxed mb-3.5 ${isDark ? 'text-[#B4B4B4]' : 'text-slate-600'}`}>
        {item.summary}
      </p>

      {/* AI Key Takeaway Box with One-Click Copy */}
      <div
        className={`p-3.5 rounded-xl border mb-4 relative ${
          isDark ? 'bg-[#121212] border-[#222222]' : 'bg-emerald-50/40 border-emerald-100'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Zap className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
            <span className={isDark ? 'text-white' : 'text-slate-900'}>Executive Takeaway</span>
          </div>

          <button
            onClick={handleCopyTakeaway}
            className={`text-[11px] font-mono flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/50'
                : isDark
                ? 'bg-[#181818] border-[#262626] text-[#888888] hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Copy takeaway to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#3FE769]" />
                <span className="text-[#3FE769]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#E5E5E5]' : 'text-slate-800'}`}>
          {item.key_takeaway}
        </p>
      </div>

      {/* Tags Row */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isDark
                  ? 'bg-[#141414] border-[#222222] text-[#888888]'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#1E1E1E]">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDark
                ? 'bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border border-[#2A2A2A]'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            }`}
          >
            <span>Read Article</span>
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
            <span>{item.is_reviewed ? 'Reviewed ✓' : 'Mark Reviewed'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#777777]">
          <span>Synced to {item.destination_name}</span>
        </div>
      </div>
    </motion.div>
  );
};
