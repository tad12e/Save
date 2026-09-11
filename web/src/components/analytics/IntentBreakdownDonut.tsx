import React, { useState } from 'react';
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
  totalCount?: number;
  isDark?: boolean;
}

export const IntentBreakdownDonut: React.FC<IntentBreakdownDonutProps> = ({
  contentBreakdown,
  totalCount,
  isDark = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Default fallback matching Stitch Screen 7cff5690f6924342a24b6abc44366f33 benchmark
  const defaultItems: IntentBreakdownItem[] = [
    { name: 'Knowledge', type: 'knowledge', count: 856, percentage: 60, color: isDark ? '#3FE769' : '#2D6A4F' },
    { name: 'Action', type: 'action', count: 400, percentage: 28, color: isDark ? '#707973' : '#454747' },
    { name: 'Reference', type: 'reference', count: 172, percentage: 12, color: isDark ? '#F59E0B' : '#D97706' },
  ];

  const items: IntentBreakdownItem[] =
    contentBreakdown && contentBreakdown.length > 0
      ? contentBreakdown.map((item) => ({
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
        }))
      : defaultItems;

  const total = totalCount ?? items.reduce((acc, curr) => acc + curr.count, 0);

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
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full transition-all border ${
        isDark ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
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
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background base track */}
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="transparent"
              stroke={isDark ? '#1C1B1B' : '#F1F5F9'}
              strokeWidth="11"
            />

            {/* Segments */}
            {segments.map((seg, idx) => (
              <circle
                key={seg.name}
                cx="50"
                cy="50"
                r={R}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={hoveredIndex === idx ? 13 : 11}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span
              className={`text-2xl sm:text-[28px] font-bold tracking-tight font-['Outfit',sans-serif] transition-colors leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {activeItem ? activeItem.count.toLocaleString() : total.toLocaleString()}
            </span>
            <span
              className={`text-[10px] font-semibold tracking-wide uppercase font-['Inter',sans-serif] mt-0.5 ${
                activeItem
                  ? isDark
                    ? 'text-[#3FE769]'
                    : 'text-[#2D6A4F]'
                  : isDark
                  ? 'text-[#878787]'
                  : 'text-slate-500'
              }`}
            >
              {activeItem ? `${activeItem.name} (${activeItem.percentage}%)` : 'Total Clips'}
            </span>
          </div>
        </div>
      </div>

      {/* Legend Stack */}
      <div className="w-full mt-3 space-y-1 pt-2.5 border-t border-slate-100 dark:border-[#1F1F1F]">
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={item.name}
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
                  className="w-2 h-2 rounded-full shrink-0 transition-transform"
                  style={{
                    backgroundColor: item.color,
                    transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
                <span
                  className={`font-medium text-xs truncate ${
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
                className={`font-mono font-semibold text-xs shrink-0 ${
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
