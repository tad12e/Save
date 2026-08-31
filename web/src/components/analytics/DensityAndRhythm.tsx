import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface DensityAndRhythmProps {
  historicalData: Array<{ date: string; actual: number }>;
  weekdayRhythm: AnalyticsPayload['weekday_rhythm'];
}

export const DensityAndRhythm: React.FC<DensityAndRhythmProps> = ({
  historicalData,
  weekdayRhythm,
}) => {
  // Smooth wave data for Density
  const densityData = [
    { x: '0M', val: 30 },
    { x: '40M', val: 180 },
    { x: '80M', val: 240 },
    { x: '120M', val: 140 },
    { x: '165M', val: 120 },
    { x: '210M', val: 150 },
    { x: '260M', val: 130 },
    { x: '300M', val: 140 },
    { x: '330M', val: 160 },
  ];

  const daysList = weekdayRhythm?.days || [
    { day: 'MON', avg_clips: 6.4, total: 134 },
    { day: 'TUE', avg_clips: 8.2, total: 141 },
    { day: 'WED', avg_clips: 9.5, total: 133 },
    { day: 'THU', avg_clips: 12.0, total: 190 },
    { day: 'FRI', avg_clips: 6.1, total: 122 },
    { day: 'SAT', avg_clips: 3.2, total: 135 },
    { day: 'SUN', avg_clips: 2.8, total: 121 },
  ];

  const maxVal = Math.max(...daysList.map((d) => d.total || d.avg_clips || 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. DENSITY Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              DENSITY
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              84m
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 font-sans">Daily minutes</h4>

          {/* Smooth Green Area Wave Chart */}
          <div className="w-full h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="densityGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#40916C" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#40916C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="natural"
                  dataKey="val"
                  stroke="#2D6A4F"
                  strokeWidth={2}
                  fill="url(#densityGreenGrad)"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* X-Axis labels & Mean footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>0M</span>
          <span>165M</span>
          <span>330M</span>
          <span className="text-slate-600 font-semibold">Mean 147m</span>
        </div>
      </motion.div>

      {/* 2. RHYTHM Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              RHYTHM
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Thu 190m
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 font-sans mb-2.5">Avg by weekday</h4>

          {/* 7 Horizontal Pill Bars */}
          <div className="space-y-1.5">
            {daysList.map((item) => {
              const dayStr = item.day.slice(0, 3).toUpperCase();
              const val = item.total || Math.round(item.avg_clips * 15) || 120;
              const isPeak = val === maxVal || dayStr === 'THU';

              return (
                <div key={dayStr} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="w-8 text-slate-500 font-semibold">{dayStr}</span>

                  <div className="flex-1 mx-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPeak ? 'bg-emerald-800' : 'bg-emerald-400/80'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((val / maxVal) * 100))}%` }}
                    />
                  </div>

                  <span
                    className={`w-10 text-right ${
                      isPeak ? 'text-slate-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {val}m
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
