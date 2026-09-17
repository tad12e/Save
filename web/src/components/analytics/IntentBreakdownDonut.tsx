import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';

export interface IntentBreakdownItem {
  name: string;
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface IntentBreakdownDonutProps {
  contentBreakdown?: IntentBreakdownItem[];
  clips?: any[];
  totalCount?: number;
  isDark?: boolean;
}

export const IntentBreakdownDonut: React.FC<IntentBreakdownDonutProps> = ({
  contentBreakdown,
  clips,
  totalCount,
  isDark = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items: IntentBreakdownItem[] = React.useMemo(() => {
    if (clips && clips.length > 0) {
      const counts: Record<string, number> = { Learn: 0, Apply: 0, Track: 0 };
      clips.forEach((c: any) => {
        const intent = (c.intent || '').toLowerCase();
        if (intent.includes('apply') || intent.includes('job') || intent.includes('action')) {
          counts.Apply++;
        } else if (intent.includes('track') || intent.includes('monitor') || intent.includes('read_later')) {
          counts.Track++;
        } else {
          counts.Learn++;
        }
      });
      const totalClips = clips.length || 1;
      const list: IntentBreakdownItem[] = [
        {
          name: 'Learn & Research',
          type: 'learn',
          count: counts.Learn,
          percentage: Math.round((counts.Learn / totalClips) * 100),
          color: isDark ? '#3FE769' : '#2D6A4F',
        },
        {
          name: 'Apply & Career',
          type: 'apply',
          count: counts.Apply,
          percentage: Math.round((counts.Apply / totalClips) * 100),
          color: '#F59E0B',
        },
        {
          name: 'Track & Monitor',
          type: 'track',
          count: counts.Track,
          percentage: Math.round((counts.Track / totalClips) * 100),
          color: isDark ? '#38BDF8' : '#0284C7',
        },
      ];
      return list.filter((i) => i.count > 0 || totalClips === 0);
    }

    if (contentBreakdown && contentBreakdown.length > 0 && contentBreakdown.some((c) => c.count > 0)) {
      return contentBreakdown.map((item) => ({
        ...item,
        color:
          item.color ||
          (item.type === 'knowledge' || item.name.toLowerCase().includes('learn')
            ? isDark
              ? '#3FE769'
              : '#2D6A4F'
            : item.type === 'action' || item.name.toLowerCase().includes('track')
            ? isDark
              ? '#707973'
              : '#454747'
            : item.type === 'apply' || item.name.toLowerCase().includes('apply')
            ? '#F59E0B'
            : '#8B5CF6'),
      }));
    }

    return [
      { name: 'All Saves', type: 'general', count: 0, percentage: 100, color: isDark ? '#262626' : '#E2E8F0' },
    ];
  }, [clips, contentBreakdown, isDark]);

  const total = totalCount ?? (clips ? clips.length : items.reduce((acc, curr) => acc + curr.count, 0));

  // SVG Geometry calculation
  const R = 40;
  const C = 2 * Math.PI * R; // ~251.327
  let cumulativeOffset = 0;

  const segments = items.map((item) => {
    const strokeLength = (item.percentage / 100) * C;
    const gap = 2.5; // Gap between segments
    const dashArray = `${Math.max(0, strokeLength - gap)} ${C - Math.max(0, strokeLength - gap)}`;
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += strokeLength;
    return {
      ...item,
      dashArray,
      dashOffset,
    };
  });

  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full transition-all border ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED] hover:border-[#3FE769]/30 hover:shadow-[0_0_24px_rgba(63,231,105,0.06)]'
          : 'bg-white border-slate-200 text-slate-900 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Intent Breakdown
          </h2>
          <p className={`text-xs font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            Knowledge vault distribution across intents
          </p>
        </div>

        <button
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-[#878787] hover:text-white hover:bg-[#181818]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Intent breakdown options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Donut Vector Area */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <div className="relative w-36 h-36 sm:w-40 sm:h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
            {/* Background base track */}
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="transparent"
              stroke={isDark ? '#1C1B1B' : '#F1F5F9'}
              strokeWidth="11"
            />

            {/* Segments with Focus Dimming & Bloom Glow on Hover */}
            {segments.map((seg, idx) => {
              const isHovered = hoveredIndex === idx;
              const isDimmed = hoveredIndex !== null && !isHovered;

              return (
                <circle
                  key={seg.name}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? 14 : 11}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: isDimmed ? 0.35 : 1,
                    filter: isHovered ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
                    transition: 'stroke-width 0.2s, opacity 0.2s, filter 0.2s',
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Central Morphing Metric Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <AnimatePresence mode="wait">
              {activeItem ? (
                <motion.div
                  key={`item-${activeItem.name}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="text-2xl sm:text-[28px] font-bold tracking-tight font-['Outfit',sans-serif] leading-tight"
                    style={{ color: activeItem.color }}
                  >
                    {activeItem.count.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-semibold tracking-wide uppercase font-mono mt-0.5 ${
                      isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
                    }`}
                  >
                    {activeItem.name} ({activeItem.percentage}%)
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="total-clips"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className={`text-2xl sm:text-[28px] font-bold tracking-tight font-['Outfit',sans-serif] leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {total.toLocaleString()}
                  </span>
                  <span
                    className={`text-[10px] font-semibold tracking-wide uppercase font-['Inter',sans-serif] mt-0.5 ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    Total Clips
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Legend Stack with Hover Slide & Highlighting */}
      <div className="w-full mt-3 space-y-1 pt-2.5 border-t border-slate-100 dark:border-[#1F1F1F]">
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <motion.div
              key={item.name}
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between py-1 px-2 rounded-lg text-xs transition-all cursor-pointer ${
                isHovered
                  ? isDark
                    ? 'bg-[#181818] shadow-xs'
                    : 'bg-slate-50 shadow-xs'
                  : 'hover:bg-transparent'
              }`}
            >
              {/* Left label with color dot */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: item.color,
                    transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                    boxShadow: isHovered ? `0 0 6px ${item.color}` : 'none',
                  }}
                />
                <span
                  className={`font-medium text-xs truncate transition-colors ${
                    isHovered
                      ? isDark
                        ? 'text-white font-semibold'
                        : 'text-slate-900 font-semibold'
                      : isDark
                      ? 'text-[#EDEDED]'
                      : 'text-slate-700'
                  }`}
                >
                  {item.name}
                </span>
                <span className={`text-[10px] hidden sm:inline ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                  ({item.count} clips)
                </span>
              </div>

              {/* Right percentage */}
              <span
                className={`font-mono font-semibold text-xs shrink-0 transition-colors ${
                  isHovered
                    ? isDark
                      ? 'text-[#3FE769]'
                      : 'text-[#2D6A4F]'
                    : isDark
                    ? 'text-[#A1A1A1]'
                    : 'text-slate-600'
                }`}
              >
                {item.percentage}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
