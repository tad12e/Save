import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarRange, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface WeekdayBarChartProps {
  weekdayRhythm?: AnalyticsPayload['weekday_rhythm'];
  isDark?: boolean;
}

export const WeekdayBarChart: React.FC<WeekdayBarChartProps> = ({
  weekdayRhythm,
  isDark = true,
}) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const days = (weekdayRhythm?.days && weekdayRhythm.days.length > 0)
    ? weekdayRhythm.days.map((d: any) => {
        const c = d.count ?? d.total ?? (typeof d.avg_clips === 'number' ? d.avg_clips : 0);
        return {
          day: (d.day || '').slice(0, 3),
          avg_clips: c,
          total: c,
        };
      })
    : [
        { day: 'Mon', avg_clips: 0, total: 0 },
        { day: 'Tue', avg_clips: 0, total: 0 },
        { day: 'Wed', avg_clips: 0, total: 0 },
        { day: 'Thu', avg_clips: 0, total: 0 },
        { day: 'Fri', avg_clips: 0, total: 0 },
        { day: 'Sat', avg_clips: 0, total: 0 },
        { day: 'Sun', avg_clips: 0, total: 0 },
      ];

  const maxVal = Math.max(...days.map((d) => d.avg_clips), 1);
  const peakDay = days.find((d) => d.avg_clips === maxVal && d.avg_clips > 0) || days[0];
  const weekdayPct = weekdayRhythm?.weekday_vs_weekend_pct?.weekday ?? (weekdayRhythm as any)?.weekday_pct ?? 85;
  const weekendPct = weekdayRhythm?.weekday_vs_weekend_pct?.weekend ?? (weekdayRhythm as any)?.weekend_pct ?? 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all h-full ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/30 hover:shadow-[0_0_24px_rgba(63,231,105,0.06)]'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Average Clips by Weekday
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Weekday vs. weekend research frequency
            </p>
          </div>
        </div>

        <motion.span
          whileHover={{ scale: 1.05 }}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border self-start sm:self-auto cursor-pointer transition-all ${
            isDark
              ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] hover:border-[#3FE769]/40'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#3FE769]" />
          Peak: {peakDay.day} ({peakDay.avg_clips} avg)
        </motion.span>
      </div>

      {/* Bar Chart with Hover Glow & Focus Dimming */}
      <div className="w-full h-52 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={days}
            layout="horizontal"
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onMouseLeave={() => setHoveredDay(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? '#262626' : '#F1F5F9'}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: isDark ? '#262626' : '#E2E8F0' }}
              tick={{
                fill: isDark ? '#878787' : '#64748B',
                fontSize: 11,
                fontFamily: 'monospace',
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: isDark ? '#878787' : '#64748B',
                fontSize: 11,
                fontFamily: 'monospace',
              }}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              contentStyle={{
                backgroundColor: isDark ? '#181818' : '#0F172A',
                borderColor: isDark ? '#262626' : '#334155',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              }}
              formatter={(val: any) => [`${val} avg clips`, 'Daily Volume']}
            />
            <Bar
              dataKey="avg_clips"
              radius={[6, 6, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {days.map((entry, index) => {
                const isHovered = hoveredDay === entry.day;
                const isDimmed = hoveredDay !== null && !isHovered;
                const isPeak = entry.avg_clips === maxVal;
                const baseColor = isPeak ? (isDark ? '#3FE769' : '#2D6A4F') : (isDark ? '#1E5832' : '#40916C');

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isHovered ? '#3FE769' : baseColor}
                    fillOpacity={isDimmed ? 0.35 : 1}
                    className="transition-all cursor-pointer outline-none"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 0 10px #3FE769)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredDay(entry.day)}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekday vs Weekend Split Pills with tactile feedback */}
      <div
        className={`mt-3 pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-[#262626]' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-['Inter',sans-serif] ${
              isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
            }`}
          >
            Distribution:
          </span>
          <div className="flex items-center gap-1.5">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] hover:border-[#3FE769]/50'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300'
              }`}
            >
              {weekdayPct}% Weekdays
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-medium border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#181818] text-[#A1A1A1] border-[#262626] hover:text-white hover:border-[#333333]'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {weekendPct}% Weekends
            </motion.span>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 text-[11px] font-mono ${
            isDark ? 'text-[#3FE769]' : 'text-emerald-700'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>High Mid-week Focus</span>
        </div>
      </div>
    </motion.div>
  );
};
