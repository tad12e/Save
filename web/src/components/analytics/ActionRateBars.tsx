import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Tag, ArrowUpRight } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface ActionRateBarsProps {
  popularTags: AnalyticsPayload['popular_tags'];
  destinationsHealth: AnalyticsPayload['destinations_health'];
}

export const ActionRateBars: React.FC<ActionRateBarsProps> = ({
  popularTags,
  destinationsHealth,
}) => {
  // Action rates by category
  const actionCategories = [
    { label: 'Articles Exported to Notion', pct: 88, color: '#3B82F6', total: '34/38' },
    { label: 'Job Applications Synced to Sheets', pct: 75, color: '#10B981', total: '24/32' },
    { label: 'AI Tools Routed to Obsidian', pct: 92, color: '#F97316', total: '22/24' },
    { label: 'Music Identified & Added to Spotify', pct: 84, color: '#EC4899', total: '16/19' },
    { label: 'Events Added to Google Calendar', pct: 65, color: '#8B5CF6', total: '11/17' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Action & Export Rate Progress Bars */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.42 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                ACTION & EXPORT RATE BY TYPE
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Clips routed to connected storage destinations
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            82% Avg Rate
          </span>
        </div>

        {/* Animated Horizontal Bars */}
        <div className="space-y-3 my-2">
          {actionCategories.map((cat, i) => (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-slate-700 font-medium text-[11px] truncate">{cat.label}</span>
                <span className="font-mono text-[11px] font-semibold text-slate-900 ml-2">
                  {cat.pct}% <span className="text-[10px] text-slate-400 font-normal">({cat.total})</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
          <span>Auto-sync webhook trigger active</span>
          <span className="font-mono text-emerald-700 font-medium">Zero pending failures</span>
        </div>
      </motion.div>

      {/* 2. Popular Tags & Destination Vaults Status */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.44 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Tag className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                TOP KNOWLEDGE TAGS & DESTINATIONS
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Most frequent keywords and sync endpoints
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {destinationsHealth.active_count} Channels Online
          </span>
        </div>

        {/* Tags Pills Cloud */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {popularTags.map((tag) => (
            <div
              key={tag.tag}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer"
            >
              <span className="text-[11px] font-mono text-slate-700">#{tag.tag}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                {tag.count}
              </span>
            </div>
          ))}
        </div>

        {/* Destination Health Mini List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {destinationsHealth.destinations.slice(0, 3).map((dest) => (
            <div
              key={dest.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-sans font-medium text-slate-800 text-[11px] truncate">{dest.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                <span className="text-slate-500">{dest.latency_ms}ms</span>
                <span className="text-emerald-700 font-bold">{dest.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
