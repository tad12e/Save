import React from 'react';
import { motion } from 'framer-motion';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Clock, Zap } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface HourlyHeatmapProps {
  hourlyData: AnalyticsPayload['hourly_distribution'];
}

export const HourlyHeatmap: React.FC<HourlyHeatmapProps> = ({ hourlyData }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Intensity color generator
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-slate-100/80 hover:bg-slate-200 border-slate-200/60';
    if (count <= 2) return 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200 text-emerald-900';
    if (count <= 5) return 'bg-emerald-300 hover:bg-emerald-400 border-emerald-400 text-emerald-950';
    if (count <= 8) return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white';
    return 'bg-emerald-700 hover:bg-emerald-800 border-emerald-800 text-white';
  };

  // Find count for specific day and hour
  const getCellData = (dayName: string, hour: number) => {
    const found = hourlyData.grid_7x24.find((g) => g.day === dayName && g.hour === hour);
    return found ? found.count : 0;
  };

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                  HOURLY PRODUCTIVITY HEATMAP
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-700" />
                  7 Days × 24 Hours
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Activity distribution across days and time of day
              </p>
            </div>
          </div>

          {/* Peak Window Badge */}
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-emerald-900 font-semibold">
              {hourlyData.peak_window}
            </span>
          </div>
        </div>

        {/* 7x24 CSS Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="min-w-[620px]">
            {/* Hour Header Labels (0, 3, 6, 9, 12, 15, 18, 21) */}
            <div className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 mb-1.5 text-[9px] font-mono text-slate-500 text-center">
              <div />
              {hours.map((h) => (
                <div key={h} className="truncate">
                  {h % 3 === 0 ? `${h % 12 || 12}${h < 12 ? 'a' : 'p'}` : ''}
                </div>
              ))}
            </div>

            {/* 7 Days Rows */}
            <div className="space-y-1.5">
              {days.map((day) => (
                <div key={day} className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 items-center">
                  <span className="text-[10px] font-mono font-semibold text-slate-600 text-right pr-2">
                    {day}
                  </span>

                  {hours.map((hour) => {
                    const count = getCellData(day, hour);
                    const formattedHour = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;

                    return (
                      <TooltipPrimitive.Root key={hour}>
                        <TooltipPrimitive.Trigger asChild>
                          <div
                            className={`h-6 rounded-[3px] border transition-all cursor-pointer ${getCellColor(
                              count
                            )}`}
                          />
                        </TooltipPrimitive.Trigger>
                        <TooltipPrimitive.Portal>
                          <TooltipPrimitive.Content
                            side="top"
                            sideOffset={4}
                            className="z-50 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700"
                          >
                            <div>
                              <strong>{day} at {formattedHour}</strong>
                            </div>
                            <div className="text-emerald-400 mt-0.5">
                              {count} {count === 1 ? 'clip saved' : 'clips saved'}
                            </div>
                            <TooltipPrimitive.Arrow className="fill-slate-900" />
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
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
          <span>Hover on any grid cell to view exact hourly clipping volume</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>0</span>
            <span className="w-3 h-3 rounded-[2px] bg-slate-100 border border-slate-200" />
            <span className="w-3 h-3 rounded-[2px] bg-emerald-100 border border-emerald-200" />
            <span className="w-3 h-3 rounded-[2px] bg-emerald-300 border border-emerald-400" />
            <span className="w-3 h-3 rounded-[2px] bg-emerald-500 border border-emerald-600" />
            <span className="w-3 h-3 rounded-[2px] bg-emerald-700 border border-emerald-800" />
            <span>8+</span>
          </div>
        </div>
      </motion.div>
    </TooltipPrimitive.Provider>
  );
};
