import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertCircle, DollarSign } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface JobsFunnelChartProps {
  funnelData?: AnalyticsPayload['opportunity_funnel'];
  money?: AnalyticsPayload['money'];
  isDark?: boolean;
}

export const JobsFunnelChart: React.FC<JobsFunnelChartProps> = ({ funnelData, money, isDark }) => {
  const missedCount = money?.missed_deadlines_count ?? 12;
  const realizedValue = money?.realized_value_index ?? '$2,850 in scholarships & tickets';
  const shell = isDark
    ? 'bg-[#0A0A0A] border-[#262626]'
    : 'bg-white border-slate-200/80';
  const heading = isDark ? 'text-[#EDEDED]' : 'text-slate-900';
  const meta = isDark ? 'text-[#A1A1A1]' : 'text-slate-500';
  // Use real stages from backend if available, or fall back to standard pipeline
  const stages = (funnelData && funnelData.length >= 4)
    ? [
        {
          id: 'saved',
          name: funnelData[0].stage || '1. Saved',
          count: `${funnelData[0].count} clips`,
          rate: `${Math.round(funnelData[0].conversion_pct)}%`,
          widthPct: 100,
          gradient: 'from-blue-500 to-blue-600',
          textColor: 'text-blue-600',
        },
        {
          id: 'applied',
          name: funnelData[1].stage || '2. Applied',
          count: `${funnelData[1].count} jobs`,
          rate: `${Math.round(funnelData[1].conversion_pct)}%`,
          widthPct: Math.max(15, Math.min(100, Math.round(funnelData[1].conversion_pct))),
          gradient: 'from-indigo-500 to-indigo-600',
          textColor: 'text-indigo-600',
        },
        {
          id: 'interview',
          name: funnelData[2].stage || '3. Interview',
          count: `${funnelData[2].count} rounds`,
          rate: `${Math.round(funnelData[2].conversion_pct)}%`,
          widthPct: Math.max(12, Math.min(100, Math.round(funnelData[2].conversion_pct))),
          gradient: 'from-purple-500 to-purple-600',
          textColor: 'text-purple-600',
        },
        {
          id: 'offer',
          name: funnelData[3].stage || '4. Offer',
          count: `${funnelData[3].count} offers`,
          rate: `${Math.round(funnelData[3].conversion_pct)}%`,
          widthPct: Math.max(10, Math.min(100, Math.round(funnelData[3].conversion_pct))),
          gradient: 'from-emerald-500 to-emerald-600',
          textColor: 'text-emerald-600',
        },
      ]
    : [
        {
          id: 'saved',
          name: '1. Saved',
          count: '47 clips',
          rate: '100%',
          widthPct: 100,
          gradient: 'from-blue-500 to-blue-600',
          textColor: 'text-blue-600',
        },
        {
          id: 'applied',
          name: '2. Applied',
          count: '18 jobs',
          rate: '38%',
          widthPct: 68,
          gradient: 'from-indigo-500 to-indigo-600',
          textColor: 'text-indigo-600',
        },
        {
          id: 'interview',
          name: '3. Interview',
          count: '8 rounds',
          rate: '17%',
          widthPct: 44,
          gradient: 'from-purple-500 to-purple-600',
          textColor: 'text-purple-600',
        },
        {
          id: 'offer',
          name: '4. Offer',
          count: '2 offers',
          rate: '4%',
          widthPct: 22,
          gradient: 'from-emerald-500 to-emerald-600',
          textColor: 'text-emerald-600',
        },
      ];

  const overallActionRate = stages[1]?.rate || '34%';

  const categoryRates = [
    { label: 'Jobs', rate: '38%', color: 'text-blue-600' },
    { label: 'Events', rate: '61%', color: 'text-emerald-600' },
    { label: 'Courses', rate: '22%', color: 'text-amber-500' },
    { label: 'Products', rate: '15%', color: 'text-purple-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`rounded-2xl border p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 ${shell}`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${meta}`}>
              OPPORTUNITY OUTCOMES
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {overallActionRate} Action Rate
          </span>
        </div>

        <h3 className={`text-base font-bold font-sans tracking-tight ${heading}`}>
          Jobs & Application Conversion Funnel
        </h3>
      </div>

      {/* 4 Horizontal Progress Bars */}
      <div className="space-y-2.5 pt-1">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3">
            {/* Background Track with Filled Gradient Pill */}
            <div className="flex-1 h-9 bg-slate-100/90 rounded-xl overflow-hidden p-0.5 flex items-center">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stage.widthPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-[10px] bg-gradient-to-r ${stage.gradient} flex items-center px-3 shadow-xs`}
              >
                <span className="text-xs font-bold text-white font-sans whitespace-nowrap">
                  {stage.name} — <span className="font-normal opacity-90">{stage.count}</span>
                </span>
              </motion.div>
            </div>

            {/* Right Percentage Text */}
            <span className={`w-12 text-right text-xs font-mono font-bold ${stage.textColor}`}>
              {stage.rate}
            </span>
          </div>
        ))}
      </div>

      {/* 4 Category Action Rate Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        {categoryRates.map((cat) => (
          <div
            key={cat.label}
            className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 text-center"
          >
            <span className="text-[11px] font-sans font-medium text-slate-500">{cat.label}</span>
            <div className={`text-base font-bold font-sans mt-0.5 ${cat.color}`}>{cat.rate}</div>
          </div>
        ))}
      </div>

      {/* Missed Opportunities Alert Banner */}
      <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/70 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-rose-900 font-sans">
            {missedCount} Opportunities Expired Unactioned
          </h5>
          <p className="text-[11px] text-rose-700 font-sans mt-0.5 leading-relaxed">
            3 jobs, 4 events, and 5 scholarships passed deadlines last month. Act earlier to secure slots!
          </p>
        </div>
      </div>

      {/* Opportunity Value Captured Card */}
      <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-800" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase text-emerald-800 tracking-wider">
              Opportunity Value Captured
            </span>
            <div className="text-sm font-bold text-emerald-950 font-sans">
              {realizedValue}
            </div>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          +18% VS LAST MONTH
        </span>
      </div>
    </motion.div>
  );
};
