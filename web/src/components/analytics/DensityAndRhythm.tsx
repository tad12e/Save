import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Activity, Waves } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';
import { ClipItem } from '../../types';

interface DensityAndRhythmProps {
  historicalData?: Array<{ date: string; actual: number }>;
  weekdayRhythm?: AnalyticsPayload['weekday_rhythm'];
  clips?: ClipItem[];
  isDark?: boolean;
}

export const DensityAndRhythm: React.FC<DensityAndRhythmProps> = ({
  historicalData,
  weekdayRhythm,
  clips = [],
  isDark = true,
}) => {
  // 1. Calculate live Curation Density (minutes = 15m benchmark per clip)
  const densityData = React.useMemo(() => {
    if (historicalData && historicalData.length > 0) {
      return historicalData.map((d) => ({
        x: d.date,
        val: Math.round((d.actual || 0) * 15),
      }));
    }
    const now = new Date();
    const dateMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      dateMap[key] = 0;
    }
    clips.forEach((c) => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (dateMap[key] !== undefined) {
        dateMap[key] += 15;
      }
    });
    return Object.entries(dateMap).map(([x, val]) => ({ x, val }));
  }, [historicalData, clips]);

  const totalActiveMinutes = densityData.reduce((acc, d) => acc + d.val, 0);
  const meanMinutes = densityData.length > 0 ? Math.round(totalActiveMinutes / densityData.length) : 0;
  const maxDensity = Math.max(...densityData.map((d) => d.val), 30);

  // 2. Calculate live Weekday Rhythm from backend / user clips
  const daysList = React.useMemo(() => {
    if (weekdayRhythm?.days && weekdayRhythm.days.length > 0) {
      return weekdayRhythm.days.map((item: any) => {
        const count = item.count ?? item.total ?? (typeof item.avg_clips === 'number' ? Math.round(item.avg_clips) : 0);
        return {
          day: item.day || 'Day',
          count,
          total: count,
          minutes: count * 15,
        };
      });
    }
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const map: Record<string, number> = {};
    daysOrder.forEach((d) => (map[d] = 0));
    clips.forEach((c) => {
      if (!c.created_at) return;
      const dayName = new Date(c.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      if (map[dayName] !== undefined) {
        map[dayName] += 1;
      }
    });
    return daysOrder.map((d) => ({
      day: d,
      count: map[d],
      total: map[d],
      minutes: map[d] * 15,
    }));
  }, [weekdayRhythm, clips]);

  const maxCount = Math.max(...daysList.map((d) => d.count), 1);
  const peakDay = daysList.find((d) => d.count === maxCount && d.count > 0) || daysList[0];
  const peakMinutes = peakDay.count * 15;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 h-full">
      {/* 1. DENSITY Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#878787]' : 'text-slate-400'
              }`}
            >
              DENSITY
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {totalActiveMinutes}m active
            </span>
          </div>

          <h4
            className={`text-sm font-bold font-['Outfit',sans-serif] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Daily Curation Minutes
          </h4>

          {/* Smooth Green Area Wave Chart */}
          <div className="w-full h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="densityGreenGradWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isDark ? '#3FE769' : '#2D6A4F'}
                      stopOpacity={isDark ? 0.35 : 0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isDark ? '#3FE769' : '#2D6A4F'}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="natural"
                  dataKey="val"
                  stroke={isDark ? '#3FE769' : '#2D6A4F'}
                  strokeWidth={2}
                  fill="url(#densityGreenGradWeb)"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* X-Axis labels & Mean footer */}
        <div
          className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono ${
            isDark ? 'border-[#262626] text-[#878787]' : 'border-slate-100 text-slate-400'
          }`}
        >
          <span>0M</span>
          <span>{Math.round(maxDensity * 0.5)}M</span>
          <span>{maxDensity}M</span>
          <span className={`font-semibold ${isDark ? 'text-[#EDEDED]' : 'text-slate-700'}`}>
            Mean {meanMinutes}m
          </span>
        </div>
      </motion.div>

      {/* 2. RHYTHM Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#878787]' : 'text-slate-400'
              }`}
            >
              RHYTHM
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {peakDay.day.slice(0, 3)} Peak {peakMinutes > 0 ? `${peakMinutes}m` : `${peakDay.count} clips`}
            </span>
          </div>

          <h4
            className={`text-sm font-bold font-['Outfit',sans-serif] mb-2.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Avg by Weekday
          </h4>

          {/* 7 Horizontal Pill Bars */}
          <div className="space-y-1.5">
            {daysList.map((item) => {
              const dayStr = item.day.slice(0, 3).toUpperCase();
              const isPeak = item.count === maxCount && item.count > 0;

              return (
                <div key={dayStr} className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={`w-8 font-semibold ${
                      isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
                    }`}
                  >
                    {dayStr}
                  </span>

                  <div
                    className={`flex-1 mx-2 h-2 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#1C1C1C]' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPeak
                          ? isDark
                            ? 'bg-[#3FE769]'
                            : 'bg-[#2D6A4F]'
                          : isDark
                          ? 'bg-[#1E5832]'
                          : 'bg-[#40916C]'
                      }`}
                      style={{
                        width: `${item.count > 0 ? Math.max(8, Math.min(100, Math.round((item.count / maxCount) * 100))) : 4}%`,
                      }}
                    />
                  </div>

                  <span
                    className={`w-14 text-right ${
                      isPeak
                        ? isDark
                          ? 'text-[#3FE769] font-bold'
                          : 'text-slate-900 font-bold'
                        : isDark
                        ? 'text-[#878787]'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.count > 0 ? `${item.count} clips` : '0 clips'}
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

