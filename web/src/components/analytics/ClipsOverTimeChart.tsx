import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Layers } from 'lucide-react';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { TYPE_COLORS } from '../../lib/chartColors';

interface ClipsOverTimeChartProps {
  historicalData: Array<{ date: string; actual: number; predicted?: number }>;
}

export const ClipsOverTimeChart: React.FC<ClipsOverTimeChartProps> = ({ historicalData }) => {
  const { clipsOverTimeMode, setClipsOverTimeMode } = useAnalyticsStore();

  // Multi-type mock synthesis for "By Type" mode
  const multiTypeData = historicalData.map((d) => {
    const total = d.actual;
    const article = Math.round(total * 0.38);
    const job = Math.round(total * 0.28);
    const tool = Math.round(total * 0.18);
    const music = Math.max(0, total - (article + job + tool));
    return {
      date: d.date,
      Total: total,
      Articles: article,
      'Job Ops': job,
      'Dev Tools': tool,
      Music: music,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              CLIPS SAVED OVER TIME
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Volume trajectory and multi-category clipping velocity
            </p>
          </div>
        </div>

        {/* Total vs By Type Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setClipsOverTimeMode('total')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
              clipsOverTimeMode === 'total'
                ? 'bg-white text-emerald-800 font-bold shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Total Volume
          </button>
          <button
            onClick={() => setClipsOverTimeMode('by_type')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
              clipsOverTimeMode === 'by_type'
                ? 'bg-white text-emerald-800 font-bold shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-600" />
            By Category
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {clipsOverTimeMode === 'total' ? (
            <AreaChart data={multiTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} />
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
              />
              <Area type="monotone" dataKey="Total" stroke="#2D6A4F" strokeWidth={2.5} fillOpacity={1} fill="url(#totalGreenGrad)" />
            </AreaChart>
          ) : (
            <AreaChart data={multiTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} />
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
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Articles" stackId="1" stroke={TYPE_COLORS.article} fill={TYPE_COLORS.article} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Job Ops" stackId="1" stroke={TYPE_COLORS.job} fill={TYPE_COLORS.job} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Dev Tools" stackId="1" stroke={TYPE_COLORS.tool} fill={TYPE_COLORS.tool} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Music" stackId="1" stroke={TYPE_COLORS.music} fill={TYPE_COLORS.music} fillOpacity={0.7} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
        <span>Timeline resolution: Daily aggregation</span>
        <span className="font-mono text-emerald-800 font-semibold">+18.4% growth rate this month</span>
      </div>
    </motion.div>
  );
};
