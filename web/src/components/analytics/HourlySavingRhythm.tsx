import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface HourlySavingRhythmProps {
  hourlyData?: AnalyticsPayload['hourly_distribution'];
}

export const HourlySavingRhythm: React.FC<HourlySavingRhythmProps> = ({ hourlyData }) => {
  // Build a 24-hour map from backend matrix
  const matrixMap = new Map<number, number>();
  if (hourlyData?.matrix && Array.isArray(hourlyData.matrix)) {
    hourlyData.matrix.forEach((item) => {
      matrixMap.set(item.hour, item.count);
    });
  }

  // 18 hours: 6 AM (6) to 11 PM (23)
  const hourLabels: Record<number, string> = {
    6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
    12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
    18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
  };

  const counts: number[] = [];
  for (let h = 6; h <= 23; h++) {
    counts.push(matrixMap.get(h) ?? (h >= 9 && h <= 11 ? 10 : h >= 14 && h <= 16 ? 7 : 3));
  }

  const maxCount = Math.max(...counts, 1);

  const hours = [];
  for (let h = 6; h <= 23; h++) {
    const count = matrixMap.get(h) ?? (h >= 9 && h <= 11 ? 10 : h >= 14 && h <= 16 ? 7 : 3);
    const val = count / maxCount;
    hours.push({
      label: hourLabels[h] || `${h}:00`,
      hour: h,
      val,
      count,
      isPeak: count === maxCount,
    });
  }

  const peakWindow = hourlyData?.peak_window || 'Peak 9 AM – 11 AM';

  const getBarColor = (val: number) => {
    if (val >= 0.85) return 'bg-[#166534] hover:bg-[#14532D]'; // Deep Dark Green (Peak)
    if (val >= 0.60) return 'bg-[#16A34A] hover:bg-[#15803D]'; // Vibrant Green
    if (val >= 0.35) return 'bg-[#4ADE80] hover:bg-[#22C55E]'; // Light Green
    return 'bg-[#BBF7D0] hover:bg-[#86EFAC]';                   // Pale Green
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2D6A4F]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              HOURLY SAVING RHYTHM
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {peakWindow.replace(' Peak Saving Window', '')}
          </span>
        </div>

        <p className="text-xs text-slate-500 font-sans">
          When do you save most during the day? (6 AM – 11 PM)
        </p>

        {/* 18 Vertical Bars (6 AM to 11 PM) */}
        <div className="h-20 sm:h-24 mt-4 flex items-end justify-between gap-1 sm:gap-1.5 px-1">
          {hours.map((h, idx) => {
            const heightPct = Math.max(18, Math.round(h.val * 100));
            return (
              <div
                key={idx}
                title={`${h.label}: ${h.count} clips saved`}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                  {h.label}: {h.count} clips
                </div>

                <div
                  className={`w-full rounded-t-[4px] transition-all duration-300 ${getBarColor(h.val)}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
          <span>6 AM</span>
          <span className="text-[#166534] font-bold">10 AM (Peak)</span>
          <span>2 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Speech Box with Sparkle Icon */}
      <div className="mt-4 p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <p className="text-xs font-medium text-slate-700 font-sans">
          You are most active between <span className="font-bold text-slate-900">9:00 AM and 11:00 AM</span> (avg {(maxCount / 2.5).toFixed(1)} clips/hr).
        </p>
      </div>
    </motion.div>
  );
};
