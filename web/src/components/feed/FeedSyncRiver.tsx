import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ExternalLink, CheckCircle2, Cloud, ArrowRight } from 'lucide-react';
import { FeedSyncItem } from '../../lib/feedApi';
import { BrandIcon } from '../BrandIcons';

interface FeedSyncRiverProps {
  items: FeedSyncItem[];
  isDark?: boolean;
}

export const FeedSyncRiver: React.FC<FeedSyncRiverProps> = ({
  items,
  isDark = true,
}) => {
  if (!items || items.length === 0) {
    return (
      <div
        className={`p-6 rounded-2xl border text-center ${
          isDark ? 'bg-[#0A0A0A] border-[#262626] text-[#888888]' : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-mono">No destination sync events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((sync) => (
        <motion.div
          key={sync.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
            isDark ? 'bg-[#0A0A0A] border-[#262626] hover:border-[#333333]' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-[#141414] border-[#262626]'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <BrandIcon name={sync.destination_provider || sync.destination_name} className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h5
                className={`text-xs sm:text-sm font-bold font-['Outfit',sans-serif] tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {sync.title}
              </h5>
              <p className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                Synchronized to <span className={isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}>{sync.destination_name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                isDark
                  ? 'bg-[#111111] text-[#3FE769] border-[#262626]'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              ✓ Active
            </span>

            {sync.export_url && (
              <a
                href={sync.export_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark ? 'border-[#262626] text-[#888888] hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Open in destination"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
