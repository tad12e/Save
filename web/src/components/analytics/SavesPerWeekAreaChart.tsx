import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ClipItem } from '../../types';

interface SavesPerWeekAreaChartProps {
  historicalData?: Array<{ date: string; actual: number; predicted?: number }>;
  clips?: ClipItem[];
  isDark?: boolean;
}

interface WeekDataPoint {
  label: string;
  total: number;
  learn: number;
  apply: number;
  track: number;
  x: number;
  y: number;
  isCurrent?: boolean;
  dateRange?: string;
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export const SavesPerWeekAreaChart: React.FC<SavesPerWeekAreaChartProps> = ({
  historicalData,
  clips = [],
  isDark = false,
}) => {
  const [activeLegend, setActiveLegend] = useState<'total' | 'learn' | 'track'>('total');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Dynamically calculate 6 rolling calendar weeks from live user clips
  const weekPoints: WeekDataPoint[] = React.useMemo(() => {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const points: WeekDataPoint[] = [];

    for (let w = 5; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - currentDay - w * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekNum = getWeekNumber(weekStart);
      const isCurrent = w === 0;

      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const dateRange =
        startMonth === endMonth
          ? `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}`
          : `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;

      let total = 0;
      let learn = 0;
      let apply = 0;
      let track = 0;

      if (clips && clips.length > 0) {
        clips.forEach((c) => {
          if (!c.created_at) return;
          const cDate = new Date(c.created_at);
          if (cDate >= weekStart && cDate <= weekEnd) {
            total++;
            const intent = (c.intent || '').toLowerCase();
            const cType = (c.content_type || '').toLowerCase();
            if (intent === 'apply' || ['job', 'scholarship', 'event'].includes(cType) || c.deadline_date) {
              apply++;
            } else if (intent === 'track' || ['tool', 'product', 'code'].includes(cType)) {
              track++;
            } else {
              learn++;
            }
          }
        });
      } else if (historicalData && historicalData.length > 0) {
        const startIdx = Math.max(0, (5 - w) * 2);
        const chunk = historicalData.slice(startIdx, startIdx + 2);
        total = chunk.reduce((sum, item) => sum + (item.actual || 0), 0);
        learn = Math.round(total * 0.6);
        apply = Math.round(total * 0.25);
        track = Math.max(0, total - learn - apply);
      }

      const idx = 5 - w; // 0 to 5
      const x = 50 + idx * 120; // 50, 170, 290, 410, 530, 650

      points.push({
        label: `Week ${weekNum}`,
        total,
        learn,
        apply,
        track,
        x,
        y: 190,
        isCurrent,
        dateRange,
      });
    }

    const maxTotal = Math.max(...points.map((p) => p.total), 4);
    return points.map((p) => ({
      ...p,
      y: 190 - (p.total / maxTotal) * 145,
    }));
  }, [clips, historicalData]);

  const maxVal = Math.max(...weekPoints.map((p) => p.total), 4);
  const activePoint = hoveredIdx !== null ? weekPoints[hoveredIdx] : null;

  // SVG Coordinates
  const primaryLine = weekPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `50,190 ${primaryLine} 650,190`;
  const secondaryLine = weekPoints
    .map((p) => {
      const secVal = p.apply + p.track;
      const ySec = 190 - (secVal / maxVal) * 145;
      return `${p.x},${ySec}`;
    })
    .join(' ');

  const primaryStroke = isDark ? '#3FE769' : '#2D6A4F';
  const secondaryStroke = isDark ? '#869583' : '#707973';
  const gridStroke = isDark ? '#262626' : '#F1F5F9';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden border transition-all ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/30 hover:shadow-[0_0_24px_rgba(63,231,105,0.06)]'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Chart Header & Interactive Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2
            className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Saves per Week by Intent
          </h2>
          <p className={`text-xs font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            Ingestion velocity plotted over rolling calendar cycles
          </p>
        </div>

        {/* Legend Filters with tactile spring animations */}
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLegend('total')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeLegend === 'total'
                ? isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                : isDark
                  ? 'bg-[#181818] text-[#878787] hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'}`} />
            <span>Total Volume</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLegend('learn')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeLegend === 'learn'
                ? isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                : isDark
                  ? 'bg-[#181818] text-[#878787] hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3AE365]' : 'bg-[#40916C]'}`} />
            <span>Learn</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveLegend('track')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeLegend === 'track'
                ? isDark
                  ? 'bg-[#1C1B1B] text-amber-400 border border-[#2A2A2A]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                : isDark
                  ? 'bg-[#181818] text-[#878787] hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Track &amp; Apply</span>
          </motion.button>
        </div>
      </div>

      {/* SVG Chart Area with Hover Crosshair & Scrubbing */}
      <div
        className="relative w-full flex-1 min-h-[250px] flex flex-col justify-between"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-60">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-px" style={{ backgroundColor: gridStroke }} />
          ))}
        </div>

        {/* The SVG Chart Vector with Left-to-Right Draw Entrance */}
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 700 240"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="savesAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={primaryStroke} stopOpacity={isDark ? 0.35 : 0.22} />
              <stop offset="100%" stopColor={primaryStroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Animated Path Group */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Area Fill */}
            {(activeLegend === 'total' || activeLegend === 'learn') && (
              <polygon points={areaPoints} fill="url(#savesAreaGradient)" />
            )}

            {/* Secondary Intent Line (Track / Apply) */}
            {(activeLegend === 'total' || activeLegend === 'track') && (
              <polyline
                points={secondaryLine}
                fill="none"
                stroke={secondaryStroke}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Main Primary Line (Total Saves) */}
            {(activeLegend === 'total' || activeLegend === 'learn') && (
              <polyline
                points={primaryLine}
                fill="none"
                stroke={primaryStroke}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: isDark ? `drop-shadow(0 0 6px rgba(63,231,105,0.35))` : 'none' }}
              />
            )}
          </motion.g>

          {/* Vertical Crosshair Line on Hovered Point */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1="20"
              x2={activePoint.x}
              y2="190"
              stroke={primaryStroke}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.8"
              style={{ filter: `drop-shadow(0 0 4px ${primaryStroke})` }}
            />
          )}

          {/* Data Nodes with Generous Hit Targets and Radiant Halos */}
          {weekPoints.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={pt.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
              >
                {/* Full height vertical hover target strip */}
                <rect
                  x={pt.x - 45}
                  y="10"
                  width="90"
                  height="200"
                  fill="transparent"
                />

                {/* Target hit area */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="22"
                  fill="transparent"
                />

                {/* Pulsing Beacon Halo when Hovered */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="12"
                    fill={primaryStroke}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Core Data Node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6.5' : '4.5'}
                  fill={isHovered ? primaryStroke : isDark ? '#1C1B1B' : '#FFFFFF'}
                  stroke={primaryStroke}
                  strokeWidth={isHovered ? '3' : '2.5'}
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${primaryStroke})` : 'none',
                    transition: 'r 0.2s, stroke-width 0.2s, filter 0.2s',
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Overlay (Anchored to hovered point with Glassmorphism) */}
        <AnimatePresence>
          {activePoint && (
            <motion.div
              key={activePoint.label}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute -translate-x-1/2 rounded-xl p-3 shadow-2xl pointer-events-none min-w-[220px] z-20 border backdrop-blur-md transition-all ${
                isDark
                  ? 'bg-[#141414]/95 border-[#2A2A2A] text-white shadow-black/80'
                  : 'bg-slate-900/95 border-slate-800 text-white shadow-slate-900/25'
              }`}
              style={{
                left: `${(activePoint.x / 700) * 100}%`,
                top: '6%',
              }}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {activePoint.label} ({activePoint.dateRange})
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-[#3FE769]' : 'text-[#86EFAC]'}`}>
                  {activePoint.total} Clips
                </span>
              </div>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#86EFAC]'}`} />
                    Learn
                  </span>
                  <span className="font-semibold text-white">
                    {activePoint.learn} ({activePoint.total > 0 ? Math.round((activePoint.learn / activePoint.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Apply
                  </span>
                  <span className="font-semibold text-white">
                    {activePoint.apply} ({activePoint.total > 0 ? Math.round((activePoint.apply / activePoint.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Track &amp; Others
                  </span>
                  <span className="font-semibold text-white">
                    {activePoint.track} ({activePoint.total > 0 ? Math.round((activePoint.track / activePoint.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Y-Axis Ticks */}
        <div
          className={`absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-mono pointer-events-none ${
            isDark ? 'text-[#666666]' : 'text-slate-400'
          }`}
        >
          <span>{Math.round(maxVal)}</span>
          <span>{Math.round(maxVal * 0.75)}</span>
          <span>{Math.round(maxVal * 0.5)}</span>
          <span>{Math.round(maxVal * 0.25)}</span>
          <span>0</span>
        </div>

        {/* X-Axis Labels */}
        <div
          className={`absolute left-10 right-4 bottom-0 flex justify-between text-[11px] font-mono pointer-events-none ${
            isDark ? 'text-[#878787]' : 'text-slate-500'
          }`}
        >
          {weekPoints.map((pt) => (
            <span
              key={pt.label}
              className={pt.isCurrent ? (isDark ? 'text-[#3FE769] font-bold' : 'text-[#2D6A4F] font-bold') : ''}
            >
              {pt.label} {pt.isCurrent ? '(Current)' : ''}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
