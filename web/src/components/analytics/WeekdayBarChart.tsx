import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarRange, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface WeekdayBarChartProps {
  weekdayRhythm: AnalyticsPayload['weekday_rhythm'];
}

export const WeekdayBarChart: React.FC<WeekdayBarChartProps> = ({ weekdayRhythm }) => {
  const maxVal = Math.max(...weekdayRhythm.days.map((d) => d.avg_clips));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.32 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CalendarRange className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              AVERAGE CLIPS BY WEEKDAY
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Weekday vs weekend research rhythm
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Peak: Wednesday ({weekdayRhythm.days[2]?.avg_clips || 9.5} avg)
        </span>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekdayRhythm.days} layout="horizontal" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: any) => [`${val} avg clips/day`, 'Average Volume']}
            />
            <Bar dataKey="avg_clips" radius={[4, 4, 0, 0]}>
              {weekdayRhythm.days.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.avg_clips === maxVal ? '#2D6A4F' : '#40916C'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekday vs Weekend Split Pills */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-slate-600">Distribution:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
              {weekdayRhythm.weekday_vs_weekend_pct.weekday}% Weekdays
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-medium border border-slate-200">
              {weekdayRhythm.weekday_vs_weekend_pct.weekend}% Weekends
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono">
          <Sparkles className="w-3 h-3" />
          <span>High Mid-week Focus</span>
        </div>
      </div>
    </motion.div>
  );
};
