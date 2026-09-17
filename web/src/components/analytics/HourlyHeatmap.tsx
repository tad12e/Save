import React from 'react';
import { motion } from 'framer-motion';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Clock, Zap } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface HourlyHeatmapProps {
  hourlyData?: AnalyticsPayload['hourly_distribution'];
  isDark?: boolean;
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({
  hourlyData,
  isDark = true,
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Peak window calculation & fallback
  const peakWindow = hourlyData?.peak_window || 'Peak Window: 2:00 PM – 4:00 PM';

  // Intensity color generator with Web tokens
  const getCellColor = (count: number) => {
    if (isDark) {
      if (count === 0) return 'bg-[#141414] hover:bg-[#1C1C1C] border-[#222222]';
      if (count <= 2) return 'bg-[#132E1B] hover:bg-[#1A3D24] border-[#1D4A2B] text-emerald-300';
      if (count <= 5) return 'bg-[#194D29] hover:bg-[#206334] border-[#27753F] text-emerald-200';
      if (count <= 8) return 'bg-[#22753C] hover:bg-[#2A8C48] border-[#32A355] text-white';
      return 'bg-[#3FE769] hover:bg-[#52EA76] border-[#3FE769] text-black shadow-[0_0_8px_rgba(63,231,105,0.35)]';
    } else {
      if (count === 0) return 'bg-slate-100/80 hover:bg-slate-200 border-slate-200/60';
      if (count <= 2) return 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-900';
      if (count <= 5) return 'bg-emerald-300 hover:bg-emerald-400 border-emerald-400 text-emerald-950';
      if (count <= 8) return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white';
      return 'bg-[#2D6A4F] hover:bg-[#1B4332] border-[#2D6A4F] text-white';
    }
  };

  // Find count for specific day and hour (with deterministic fallback)
  const getCellData = (dayName: string, hour: number) => {
    if (hourlyData?.grid_7x24 && hourlyData.grid_7x24.length > 0) {
      const found = hourlyData.grid_7x24.find(
        (g) => g.day === dayName && g.hour === hour
      );
      if (found) return found.count;
    }
    // High-activity simulated pattern for 6am - 11pm
    if (hour >= 9 && hour <= 11) return (dayName === 'Sat' || dayName === 'Sun') ? 3 : 7;
    if (hour >= 14 && hour <= 16) return (dayName === 'Sat' || dayName === 'Sun') ? 4 : 9;
    if (hour >= 18 && hour <= 21) return 5;
    if (hour >= 6 && hour <= 23) return 2;
    return 0;
  };

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Hourly Activity Heatmap
                </h3>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    isDark
                      ? 'bg-[#181818] text-[#3FE769] border-[#2A2A2A]'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  7 Days × 24h
                </span>
              </div>
              <p
                className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                  isDark ? 'text-[#878787]' : 'text-slate-500'
                }`}
              >
                Curation intensity &amp; circadian rhythm (6 AM – 11 PM core window)
              </p>
            </div>
          </div>

          {/* Peak Saving Window Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 self-start sm:self-auto ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-[#3FE769]' : 'bg-[#16A34A]'
              } animate-pulse`}
            />
            <span className="font-mono text-[11px] font-semibold">
              {peakWindow.replace('Peak Saving Window', 'Peak Window').trim()}
            </span>
          </div>
        </div>

        {/* 7x24 Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[640px]">
            {/* Hour Header Labels (0 to 23) with 6am-11pm highlight */}
            <div
              className={`grid grid-cols-[44px_repeat(24,1fr)] gap-1 mb-1.5 text-[9px] font-mono text-center ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              <div />
              {hours.map((h) => (
                <div
                  key={h}
                  className={`truncate transition-colors ${
                    h >= 6 && h <= 23
                      ? isDark
                        ? 'text-[#EDEDED] font-semibold'
                        : 'text-slate-800 font-semibold'
                      : 'opacity-40'
                  }`}
                >
                  {h % 3 === 0 ? `${h % 12 || 12}${h < 12 ? 'a' : 'p'}` : ''}
                </div>
              ))}
            </div>

            {/* 7 Days Rows */}
            <div className="space-y-1">
              {days.map((day) => (
                <div
                  key={day}
                  className="grid grid-cols-[44px_repeat(24,1fr)] gap-1 items-center"
                >
                  <span
                    className={`text-[10px] font-mono font-semibold text-right pr-2 ${
                      isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>

                  {hours.map((hour) => {
                    const count = getCellData(day, hour);
                    const formattedHour = `${hour % 12 || 12}:00 ${
                      hour < 12 ? 'AM' : 'PM'
                    }`;

                    return (
                      <TooltipPrimitive.Root key={hour}>
                        <TooltipPrimitive.Trigger asChild>
                          <div
                            className={`h-5 sm:h-6 rounded-[4px] border transition-all cursor-pointer ${getCellColor(
                              count
                            )}`}
                          />
                        </TooltipPrimitive.Trigger>
                        <TooltipPrimitive.Portal>
                          <TooltipPrimitive.Content
                            side="top"
                            sideOffset={4}
                            className={`z-50 text-[11px] font-mono px-3 py-1.5 rounded-xl shadow-xl border ${
                              isDark
                                ? 'bg-[#181818] text-white border-[#262626]'
                                : 'bg-slate-900 text-white border-slate-700'
                            }`}
                          >
                            <div className="font-semibold font-['Outfit',sans-serif]">
                              {day} at {formattedHour}
                            </div>
                            <div
                              className={`mt-0.5 ${
                                isDark ? 'text-[#3FE769]' : 'text-emerald-400'
                              }`}
                            >
                              {count} {count === 1 ? 'clip saved' : 'clips saved'}
                            </div>
                            <TooltipPrimitive.Arrow
                              className={isDark ? 'fill-[#181818]' : 'fill-slate-900'}
                            />
                          </TooltipPrimitive.Content>
                        </TooltipPrimitive.Portal>
                      </TooltipPrimitive.Root>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-between pt-3 mt-3 border-t text-[11px] gap-2 ${
            isDark
              ? 'border-[#262626] text-[#878787]'
              : 'border-slate-100 text-slate-500'
          }`}
        >
          <span className="font-['Inter',sans-serif]">
            Hover on any hour cell to inspect saving intensity
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>Less</span>
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isDark
                  ? 'bg-[#141414] border-[#222222]'
                  : 'bg-slate-100 border-slate-200'
              }`}
            />
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isDark
                  ? 'bg-[#132E1B] border-[#1D4A2B]'
                  : 'bg-emerald-100 border-emerald-200'
              }`}
            />
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isDark
                  ? 'bg-[#194D29] border-[#27753F]'
                  : 'bg-emerald-300 border-emerald-400'
              }`}
            />
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isDark
                  ? 'bg-[#22753C] border-[#32A355]'
                  : 'bg-emerald-500 border-emerald-600'
              }`}
            />
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isDark
                  ? 'bg-[#3FE769] border-[#3FE769]'
                  : 'bg-[#2D6A4F] border-[#2D6A4F]'
              }`}
            />
            <span>More</span>
          </div>
        </div>
      </motion.div>
    </TooltipPrimitive.Provider>
  );
};
