import React, { useState } from 'react';

interface SavesPerWeekAreaChartProps {
  historicalData?: Array<{ date: string; actual: number; predicted?: number }>;
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

export const SavesPerWeekAreaChart: React.FC<SavesPerWeekAreaChartProps> = ({ isDark = false }) => {
  const [activeLegend, setActiveLegend] = useState<'total' | 'learn' | 'track'>('total');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const weekPoints: WeekDataPoint[] = [
    { label: 'Week 38', total: 65, learn: 32, apply: 14, track: 19, x: 50, y: 165, dateRange: 'Sep 18 - 24' },
    { label: 'Week 39', total: 95, learn: 48, apply: 20, track: 27, x: 170, y: 140, dateRange: 'Sep 25 - Oct 01' },
    { label: 'Week 40', total: 80, learn: 40, apply: 18, track: 22, x: 290, y: 155, dateRange: 'Oct 02 - 08' },
    { label: 'Week 41', total: 145, learn: 72, apply: 30, track: 43, x: 410, y: 95, dateRange: 'Oct 09 - 15' },
    { label: 'Week 42', total: 184, learn: 92, apply: 38, track: 54, x: 530, y: 45, isCurrent: true, dateRange: 'Oct 16 - 22' },
    { label: 'Week 43', total: 160, learn: 80, apply: 34, track: 46, x: 650, y: 70, dateRange: 'Oct 23 - 29' },
  ];

  const activePoint = hoveredIdx !== null ? weekPoints[hoveredIdx] : null;

  // SVG Coordinates
  const areaPoints = '50,190 50,165 170,140 290,155 410,95 530,45 650,70 650,190';
  const primaryLine = '50,165 170,140 290,155 410,95 530,45 650,70';
  const secondaryLine = '50,180 170,172 290,168 410,140 530,120 650,132';

  const primaryStroke = isDark ? '#3FE769' : '#2D6A4F';
  const secondaryStroke = isDark ? '#869583' : '#707973';
  const gridStroke = isDark ? '#262626' : '#F1F5F9';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full relative overflow-hidden border transition-all ${
        isDark ? 'bg-[#0E0E0E] border-[#262626]' : 'bg-white border-slate-200'
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

        {/* Legend Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
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
          </button>

          <button
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
          </button>

          <button
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
          </button>
        </div>
      </div>

      {/* SVG Chart Area */}
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

        {/* The SVG Chart Vector */}
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
            />
          )}

          {/* Vertical Crosshair on Hovered Point - only when hovered */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1="20"
              x2={activePoint.x}
              y2="190"
              stroke={primaryStroke}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.6"
            />
          )}

          {/* Data Nodes with generous hover targets */}
          {weekPoints.map((pt, idx) => (
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
              {/* Outer circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? '6' : '4'}
                fill={hoveredIdx === idx ? primaryStroke : isDark ? '#1C1B1B' : '#FFFFFF'}
                stroke={primaryStroke}
                strokeWidth="2.5"
                className="transition-all duration-200"
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip Overlay (Anchored to hovered point, only shown when hovered) */}
        {activePoint && (
          <div
            className={`absolute -translate-x-1/2 rounded-xl p-3 shadow-xl pointer-events-none min-w-[210px] z-10 border transition-all duration-150 ${
              isDark
                ? 'bg-[#181818] border-[#333333] text-white shadow-black/80'
                : 'bg-slate-900 border-slate-800 text-white shadow-slate-900/20'
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
                  {activePoint.learn} ({Math.round((activePoint.learn / activePoint.total) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Apply
                </span>
                <span className="font-semibold text-white">
                  {activePoint.apply} ({Math.round((activePoint.apply / activePoint.total) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Track &amp; Others
                </span>
                <span className="font-semibold text-white">
                  {activePoint.track} ({Math.round((activePoint.track / activePoint.total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Y-Axis Ticks */}
        <div
          className={`absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-mono pointer-events-none ${
            isDark ? 'text-[#666666]' : 'text-slate-400'
          }`}
        >
          <span>200</span>
          <span>150</span>
          <span>100</span>
          <span>50</span>
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
    </div>
  );
};
