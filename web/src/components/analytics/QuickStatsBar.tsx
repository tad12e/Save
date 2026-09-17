import React from 'react';
import { motion } from 'framer-motion';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface QuickStatsBarProps {
  kpis: AnalyticsPayload['kpis'];
  isDark?: boolean;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ kpis, isDark = true }) => {
  const totalClips = kpis?.total_clips?.value ?? 0;
  const thisWeek = kpis?.weekly_velocity?.value ?? 0;
  const streakDays = kpis?.active_streak?.value ?? 0;
  const bestStreak = kpis?.active_streak?.best_streak ?? Math.max(streakDays, 1);
  const completion = kpis?.destinations_active?.health_pct ?? 100;
  const vaultsCount = kpis?.destinations_active?.value ?? 0;

  const stats = [
    {
      id: 'total_focus',
      label: 'TOTAL CLIPS',
      value: totalClips.toLocaleString(),
      subtext: `${totalClips.toLocaleString()} in permanent vault`,
      isHighlighted: false,
    },
    {
      id: 'this_week',
      label: 'THIS WEEK',
      value: `${thisWeek}`,
      subtext: `${(thisWeek / 7).toFixed(1)} saves / day avg`,
      isHighlighted: false,
    },
    {
      id: 'streak',
      label: 'STREAK',
      value: `${streakDays}d`,
      subtext: `Best ${bestStreak}d`,
      isHighlighted: true,
      highlightColor: isDark ? 'text-[#3FE769] font-bold' : 'text-[#2D6A4F] font-bold',
    },
    {
      id: 'completion',
      label: 'COMPLETION',
      value: `${completion}%`,
      subtext: `${completion}% pipeline integrity`,
      isHighlighted: false,
    },
    {
      id: 'vaults',
      label: 'SYNC VAULTS',
      value: `${vaultsCount} Active`,
      subtext: `${vaultsCount} connected destinations`,
      isHighlighted: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className={`w-full rounded-2xl border p-4 sm:p-5 shadow-sm transition-all ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626]'
          : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x ${
          isDark ? 'divide-[#262626]' : 'divide-slate-100'
        }`}
      >
        {stats.map((stat, idx) => (
          <div
            key={stat.id}
            className={`flex flex-col justify-center ${
              idx > 0 ? 'lg:pl-6 pt-3 sm:pt-0' : ''
            }`}
          >
            <span
              className={`text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider uppercase ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              {stat.label}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight mt-1 ${
                stat.isHighlighted
                  ? stat.highlightColor
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              {stat.value}
            </div>
            <span
              className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-400'
              }`}
            >
              {stat.subtext}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
