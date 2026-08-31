import React from 'react';
import { motion } from 'framer-motion';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface QuickStatsBarProps {
  kpis: AnalyticsPayload['kpis'];
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ kpis }) => {
  const totalClips = kpis?.total_clips?.value ?? 1369;
  const thisWeek = kpis?.weekly_velocity?.value ?? 52;
  const streakDays = kpis?.active_streak?.value ?? 187;
  const bestStreak = kpis?.active_streak?.best_streak ?? 263;
  const completion = kpis?.destinations_active?.health_pct ?? 98;
  const vaultsCount = kpis?.destinations_active?.value ?? 4;

  const stats = [
    {
      id: 'total_focus',
      label: 'TOTAL CLIPS',
      value: totalClips.toLocaleString(),
      subtext: `${totalClips.toLocaleString()} all-time`,
      isHighlighted: false,
    },
    {
      id: 'this_week',
      label: 'THIS WEEK',
      value: `${thisWeek}`,
      subtext: '34 sessions',
      isHighlighted: false,
    },
    {
      id: 'streak',
      label: 'STREAK',
      value: `${streakDays}d`,
      subtext: `Best ${bestStreak}d`,
      isHighlighted: true,
      highlightColor: 'text-emerald-700 font-bold',
    },
    {
      id: 'completion',
      label: 'COMPLETION',
      value: `${completion}%`,
      subtext: '1,842 processed',
      isHighlighted: false,
    },
    {
      id: 'vaults',
      label: 'SYNC VAULTS',
      value: `${vaultsCount * 85}`,
      subtext: `${vaultsCount} active destinations`,
      isHighlighted: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
        {stats.map((stat, idx) => (
          <div
            key={stat.id}
            className={`flex flex-col justify-center ${
              idx > 0 ? 'lg:pl-6 pt-3 sm:pt-0' : ''
            }`}
          >
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              {stat.label}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold font-sans tracking-tight mt-1 ${
                stat.isHighlighted ? stat.highlightColor : 'text-slate-900'
              }`}
            >
              {stat.value}
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5">
              {stat.subtext}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
