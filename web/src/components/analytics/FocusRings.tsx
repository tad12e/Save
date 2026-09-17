import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Flame, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface FocusRingsProps {
  dailyFocus?: AnalyticsPayload['daily_focus'];
  streakMomentum?: AnalyticsPayload['streak_momentum'];
  isDark?: boolean;
}

export const FocusRings: React.FC<FocusRingsProps> = ({
  dailyFocus,
  streakMomentum,
  isDark = true,
}) => {
  const [hoveredRingId, setHoveredRingId] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState<number>(0);

  const saveCount = dailyFocus?.rings?.save_count ?? { current: 7, target: 10, pct: 70 };
  const taggingHealth = dailyFocus?.rings?.tagging_health ?? { current: 9, target: 10, pct: 90 };
  const actionRate = dailyFocus?.rings?.action_rate ?? { current: 8, target: 10, pct: 80 };
  const goalPct = dailyFocus?.goal_completion_pct ?? 82;

  const currentStreak = streakMomentum?.current_streak_days ?? 14;
  const bestStreak = streakMomentum?.best_streak_days ?? 38;
  const multiplier = streakMomentum?.streak_multiplier ?? 1.4;
  const nextMilestone = streakMomentum?.next_milestone_days ?? 20;

  // SVG Ring calculation helper
  const size = 180;
  const center = size / 2;

  const rings = [
    {
      id: 'save_count',
      label: 'Clips Target',
      current: saveCount.current,
      target: saveCount.target,
      pct: saveCount.pct,
      color: isDark ? '#3FE769' : '#2D6A4F',
      bgColor: isDark ? '#1C271E' : '#DCFCE7',
      radius: 68,
      strokeWidth: 9,
    },
    {
      id: 'tagging_health',
      label: 'Momentum',
      current: taggingHealth.current,
      target: taggingHealth.target,
      pct: taggingHealth.pct,
      color: '#F59E0B',
      bgColor: isDark ? '#2C2213' : '#FEF3C7',
      radius: 53,
      strokeWidth: 9,
    },
    {
      id: 'action_rate',
      label: 'Vault Actions',
      current: actionRate.current,
      target: actionRate.target,
      pct: actionRate.pct,
      color: isDark ? '#40916C' : '#10B981',
      bgColor: isDark ? '#18271E' : '#E2E8F0',
      radius: 38,
      strokeWidth: 9,
    },
  ];

  const activeRing = hoveredRingId ? rings.find((r) => r.id === hoveredRingId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all group ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/50 hover:shadow-[0_0_24px_rgba(63,231,105,0.08)]'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] group-hover:border-[#3FE769]/50'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:border-emerald-300'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Streak &amp; Momentum Rings
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Apple Fitness-style daily velocity
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono transition-all ${
            isDark
              ? 'bg-[#1C1B1B] text-[#F59E0B] border border-[#2A2A2A] group-hover:border-[#F59E0B]/50'
              : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}
        >
          <Flame className="w-3 h-3 text-[#F59E0B] animate-pulse" />
          {currentStreak}d Streak
        </span>
      </div>

      {/* Concentric SVG Rings with Interactive Click & Hover Focus */}
      <div
        className="flex items-center justify-center my-2 relative cursor-pointer select-none"
        onClick={() => setClickCount((c) => c + 1)}
        title="Click to trigger elastic ring bounce"
      >
        <motion.div
          animate={{ rotate: clickCount * 360 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative"
        >
          <svg
            width={size}
            height={size}
            className="transform -rotate-90 filter drop-shadow-sm transition-all"
          >
            {rings.map((ring, i) => {
              const circumference = 2 * Math.PI * ring.radius;
              const progressOffset =
                circumference - (circumference * Math.min(ring.pct, 100)) / 100;
              const isHovered = hoveredRingId === ring.id;
              const isDimmed = hoveredRingId !== null && !isHovered;

              return (
                <g
                  key={ring.id}
                  className="transition-all duration-300"
                  style={{
                    opacity: isDimmed ? 0.35 : 1,
                    filter: isHovered ? `drop-shadow(0 0 8px ${ring.color})` : 'none',
                  }}
                  onMouseEnter={() => setHoveredRingId(ring.id)}
                  onMouseLeave={() => setHoveredRingId(null)}
                >
                  {/* Track Background */}
                  <circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.bgColor}
                    strokeWidth={isHovered ? ring.strokeWidth + 2 : ring.strokeWidth}
                    fill="transparent"
                    className="transition-all duration-200"
                  />
                  {/* Animated Progress Arc */}
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    stroke={ring.color}
                    strokeWidth={isHovered ? ring.strokeWidth + 2.5 : ring.strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: progressOffset }}
                    transition={{
                      duration: 1.1,
                      delay: 0.1 + i * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="transition-all duration-200"
                  />
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Central Morphing Metric Indicator */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <AnimatePresence mode="wait">
            {activeRing ? (
              <motion.div
                key={`ring-${activeRing.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <span
                  className={`text-xl font-bold font-mono tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ color: activeRing.color }}
                >
                  {activeRing.current}/{activeRing.target}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
                  }`}
                >
                  {activeRing.pct}% {activeRing.label.split(' ')[0]}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="default-goal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <span
                  className={`text-2xl font-bold font-['Outfit',sans-serif] tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {goalPct}%
                </span>
                <span
                  className={`text-[9px] font-mono font-semibold uppercase tracking-wider ${
                    isDark ? 'text-[#878787]' : 'text-slate-400'
                  }`}
                >
                  ACTIVE
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ring Legend with Interactive Hover Focus */}
      <div
        className={`grid grid-cols-3 gap-2 pt-3 border-t text-center ${
          isDark ? 'border-[#262626]' : 'border-slate-100'
        }`}
      >
        {rings.map((ring) => {
          const isHovered = hoveredRingId === ring.id;
          return (
            <motion.div
              key={ring.id}
              whileHover={{ scale: 1.05 }}
              className={`flex flex-col items-center p-1 rounded-xl cursor-pointer transition-all ${
                isHovered
                  ? isDark
                    ? 'bg-[#1C1B1B]'
                    : 'bg-slate-100'
                  : ''
              }`}
              onMouseEnter={() => setHoveredRingId(ring.id)}
              onMouseLeave={() => setHoveredRingId(null)}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: ring.color,
                    transform: isHovered ? 'scale(1.5)' : 'scale(1)',
                    boxShadow: isHovered ? `0 0 6px ${ring.color}` : 'none',
                  }}
                />
                <span
                  className={`text-[11px] font-medium font-['Inter',sans-serif] transition-colors ${
                    isHovered
                      ? isDark
                        ? 'text-white font-semibold'
                        : 'text-slate-900 font-semibold'
                      : isDark
                      ? 'text-[#A1A1A1]'
                      : 'text-slate-600'
                  }`}
                >
                  {ring.label}
                </span>
              </div>
              <span
                className={`text-xs font-bold font-mono transition-colors ${
                  isHovered
                    ? isDark
                      ? 'text-[#3FE769]'
                      : 'text-emerald-700'
                    : isDark
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                {ring.current}/{ring.target}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Milestone Booster with Hover Shimmer */}
      <motion.div
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className={`mt-3 flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
          isDark
            ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:border-[#3FE769]/50'
            : 'bg-emerald-50/70 border-emerald-100 text-slate-800 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles
            className={`w-3.5 h-3.5 ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          />
          <span className="text-[11px] font-['Inter',sans-serif]">
            Multiplier:{' '}
            <strong
              className={`font-mono ${
                isDark ? 'text-[#3FE769]' : 'text-emerald-800'
              }`}
            >
              {multiplier}x XP
            </strong>
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-semibold ${
            isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
          }`}
        >
          {Math.max(0, nextMilestone - currentStreak)}d to next tier (Best: {bestStreak}d)
        </span>
      </motion.div>
    </motion.div>
  );
};
