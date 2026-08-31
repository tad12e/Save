import React from 'react';
import { motion } from 'framer-motion';
import { Target, Activity, Flame, Award, Clock, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface FocusRingsProps {
  dailyFocus: AnalyticsPayload['daily_focus'];
  streakMomentum: AnalyticsPayload['streak_momentum'];
  personalBests: AnalyticsPayload['gamification']['personal_bests'];
}

export const FocusRings: React.FC<FocusRingsProps> = ({
  dailyFocus,
  streakMomentum,
  personalBests,
}) => {
  // SVG Ring calculation helper
  const size = 180;
  const center = size / 2;

  // Concentric Rings Radii & Stroke Widths
  const rings = [
    {
      id: 'save_count',
      label: 'Clips Target',
      current: dailyFocus.rings.save_count.current,
      target: dailyFocus.rings.save_count.target,
      pct: dailyFocus.rings.save_count.pct,
      color: '#2D6A4F', // Forest Green
      bgColor: '#DCFCE7', // Mint green
      radius: 68,
      strokeWidth: 10,
    },
    {
      id: 'tagging_health',
      label: 'Tagging Health',
      current: dailyFocus.rings.tagging_health.current,
      target: dailyFocus.rings.tagging_health.target,
      pct: dailyFocus.rings.tagging_health.pct,
      color: '#40916C', // Vibrant Green
      bgColor: '#E2E8F0',
      radius: 52,
      strokeWidth: 10,
    },
    {
      id: 'action_rate',
      label: 'Sync Actions',
      current: dailyFocus.rings.action_rate.current,
      target: dailyFocus.rings.action_rate.target,
      pct: dailyFocus.rings.action_rate.pct,
      color: '#10B981', // Emerald
      bgColor: '#F1F5F9',
      radius: 36,
      strokeWidth: 10,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Concentric Activity Rings (Apple Fitness Style) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
                CONSISTENCY RINGS
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">Multi-dimensional daily rhythm</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {dailyFocus.goal_completion_pct}% Active
          </span>
        </div>

        {/* Concentric SVG Rings */}
        <div className="flex items-center justify-center my-3 relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {rings.map((ring, i) => {
              const circumference = 2 * Math.PI * ring.radius;
              const progressOffset = circumference - (circumference * Math.min(ring.pct, 100)) / 100;

              return (
                <g key={ring.id}>
                  {/* Track Background */}
                  <circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.bgColor}
                    strokeWidth={ring.strokeWidth}
                    fill="transparent"
                  />
                  {/* Animated Progress Arc */}
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progressOffset }}
                    transition={{
                      duration: 1.2,
                      delay: 0.15 + i * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Central Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-serif text-slate-900">
              {dailyFocus.goal_completion_pct}%
            </span>
            <span className="text-[9px] font-mono uppercase text-slate-500 font-medium">GOAL</span>
          </div>
        </div>

        {/* Ring Legends */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          {rings.map((ring) => (
            <div key={ring.id} className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ring.color }} />
                <span className="text-[10px] font-mono text-slate-600 font-medium">{ring.label}</span>
              </div>
              <span className="text-xs font-bold font-mono text-slate-900">
                {ring.current}/{ring.target}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 2. Daily Goal Circular Progress & Momentum */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
                DAILY SAVING GOAL
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">Target: 10 clips per day</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            {streakMomentum.current_streak_days}d Streak
          </span>
        </div>

        {/* Big Progress Display */}
        <div className="my-4 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
              CLIPS TODAY
            </span>
            <div className="text-3xl font-bold font-serif text-slate-900 mt-0.5">
              {dailyFocus.daily_goal_current} <span className="text-base text-slate-400 font-sans font-normal">/ {dailyFocus.daily_goal_target}</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium font-sans mt-1">
              {dailyFocus.daily_goal_target - dailyFocus.daily_goal_current > 0
                ? `${dailyFocus.daily_goal_target - dailyFocus.daily_goal_current} clips needed to hit today's target`
                : '🎉 Daily goal accomplished!'}
            </p>
          </div>

          <div className="w-20 h-20 relative flex items-center justify-center">
            <svg width="74" height="74" className="transform -rotate-90">
              <circle cx="37" cy="37" r="30" stroke="#DCFCE7" strokeWidth="6" fill="transparent" />
              <motion.circle
                cx="37"
                cy="37"
                r="30"
                stroke="#2D6A4F"
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 30 - (2 * Math.PI * 30 * dailyFocus.goal_completion_pct) / 100,
                }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-slate-900">
              {dailyFocus.goal_completion_pct}%
            </div>
          </div>
        </div>

        {/* Milestone Booster */}
        <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/70">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[11px] font-sans font-medium text-slate-800">
              Streak Multiplier: <strong className="text-emerald-800 font-mono">{streakMomentum.streak_multiplier}x XP</strong>
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 font-semibold">
            {streakMomentum.next_milestone_days - streakMomentum.current_streak_days}d to next tier
          </span>
        </div>
      </motion.div>

      {/* 3. Personal Bests Grid */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
              PERSONAL BESTS
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">All-time lifetime records</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 flex-1">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">
              LONGEST STREAK
            </span>
            <div className="text-lg font-bold font-serif text-slate-900 mt-0.5">
              {personalBests.longest_streak} <span className="text-xs font-sans text-slate-500">Days</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-medium">Lifetime Peak</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">
              MAX SAVED (DAY)
            </span>
            <div className="text-lg font-bold font-serif text-slate-900 mt-0.5">
              {personalBests.most_clips_in_day} <span className="text-xs font-sans text-slate-500">Clips</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{personalBests.peak_day_date}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> PEAK HOUR
            </span>
            <div className="text-xs font-bold font-mono text-slate-900 mt-1 truncate">
              {personalBests.peak_hour_str}
            </div>
            <span className="text-[10px] text-slate-500">Highest Focus</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-medium">
              TOP DOMAIN
            </span>
            <div className="text-xs font-bold font-sans text-slate-900 mt-1 truncate">
              {personalBests.top_category}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium font-mono">35% of Vault</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
