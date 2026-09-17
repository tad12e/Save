import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Check } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface DailyFocusCardProps {
  dailyFocus?: AnalyticsPayload['daily_focus'];
  isDark?: boolean;
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({
  dailyFocus,
  isDark = true,
}) => {
  const [isRingHovered, setIsRingHovered] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const currentClips = dailyFocus?.daily_goal_current ?? 7;
  const targetClips = dailyFocus?.daily_goal_target ?? 10;
  const completionPct = dailyFocus?.goal_completion_pct ?? 70;
  const isCompleted = completionPct >= 100 || currentClips >= targetClips;

  // Circular progress dimensions
  const size = 112;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (circumference * Math.min(completionPct, 100)) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2 }}
      onClick={() => setBurstCount((c) => c + 1)}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none group ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/50 hover:shadow-[0_0_24px_rgba(63,231,105,0.08)]'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] group-hover:border-[#3FE769]/60 group-hover:shadow-[0_0_12px_rgba(63,231,105,0.2)]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:border-emerald-300'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Daily Saving Goal
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Target: {targetClips} curated clips per day
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all ${
            isDark
              ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] group-hover:border-[#3FE769]/40'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <Check className="w-3 h-3 stroke-[3]" />
          {completionPct}%
        </span>
      </div>

      {/* Main Content: Ring on Left + Details on Right */}
      <div className="flex items-center gap-5 sm:gap-6 my-2">
        {/* Left Circular Ring with Hover Glow and Spring Bounce on Click */}
        <motion.div
          key={burstCount}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="relative shrink-0 flex items-center justify-center cursor-pointer select-none"
          style={{ width: size, height: size }}
          onMouseEnter={() => setIsRingHovered(true)}
          onMouseLeave={() => setIsRingHovered(false)}
        >
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDark ? '#262626' : '#E2E8F0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated Green Circle with Bloom Glow on Ring Hover */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDark ? '#3FE769' : '#2D6A4F'}
              strokeWidth={isRingHovered ? strokeWidth + 2 : strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progressOffset }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: isRingHovered
                  ? isDark
                    ? 'drop-shadow(0 0 10px #3FE769)'
                    : 'drop-shadow(0 0 8px rgba(45,106,79,0.5))'
                  : 'none',
                transition: 'stroke-width 0.2s, filter 0.2s',
              }}
            />
          </svg>

          {/* Center text with spring scale on hover */}
          <motion.div
            animate={{ scale: isRingHovered ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
          >
            <span
              className={`text-2xl font-bold font-['Outfit',sans-serif] leading-none ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {currentClips}
            </span>
            <span
              className={`text-[9px] font-mono font-semibold uppercase tracking-wider mt-1 ${
                isDark ? 'text-[#878787]' : 'text-slate-400'
              }`}
            >
              / {targetClips} CLIPS
            </span>
          </motion.div>
        </motion.div>

        {/* Right Details with Live Pulse Beacon */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FE769]"></span>
            </span>
            <span
              className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-400'
              }`}
            >
              TODAY'S INTEL FOCUS
            </span>
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] mt-0.5 tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {Math.round(currentClips * 31.2)} min focused
          </div>
          <p
            className={`text-xs font-['Inter',sans-serif] mt-1 ${
              isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
            }`}
          >
            {isCompleted
              ? '🎉 Daily goal achieved! Top performance.'
              : `${targetClips - currentClips} more clips to achieve today's quota.`}
          </p>

          {/* Action Pills with tactile feedback */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] hover:border-[#3FE769]/50'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <Check
                className={`w-3 h-3 stroke-[3] ${
                  isDark ? 'text-[#3FE769]' : 'text-emerald-700'
                }`}
              />
              {isCompleted ? 'QUOTA SECURED' : 'IN PROGRESS'}
            </motion.span>
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium border transition-all ${
                isDark
                  ? 'bg-[#181818] text-[#A1A1A1] border-[#262626] hover:text-white hover:border-[#333333]'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              GOAL: {targetClips * 24} MIN ACTIVE
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
