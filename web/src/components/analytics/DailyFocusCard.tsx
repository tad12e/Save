import React from 'react';
import { motion } from 'framer-motion';
import { Target, Check } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface DailyFocusCardProps {
  dailyFocus: AnalyticsPayload['daily_focus'];
}

export const DailyFocusCard: React.FC<DailyFocusCardProps> = ({ dailyFocus }) => {
  const currentClips = dailyFocus?.daily_goal_current ?? 7;
  const targetClips = dailyFocus?.daily_goal_target ?? 10;
  const completionPct = dailyFocus?.goal_completion_pct ?? 100;
  const isCompleted = completionPct >= 100 || currentClips >= targetClips;

  // Circular progress dimensions
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (circumference * Math.min(completionPct, 100)) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-emerald-700 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 uppercase">
            DAILY FOCUS
          </span>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 stroke-[3]" />
          {completionPct}%
        </span>
      </div>

      {/* Main Content: Ring on Left + Details on Right */}
      <div className="flex items-center gap-6 my-1">
        {/* Left Circular Ring */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated Green Circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2D6A4F"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: progressOffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-bold font-sans text-slate-900 leading-none">
              {currentClips}
            </span>
            <span className="text-[9px] font-mono font-semibold uppercase text-slate-400 tracking-wider mt-1">
              CLIPS
            </span>
          </div>
        </div>

        {/* Right Details */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            TODAY
          </span>
          <div className="text-2xl font-bold font-sans text-slate-900 mt-0.5 tracking-tight">
            312 min focused
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {isCompleted ? 'Daily goal completed.' : `${targetClips - currentClips} clips remaining.`}
          </p>

          {/* Action Pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
              GOAL SECURED
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-slate-500 bg-slate-50 border border-slate-200">
              TARGET {targetClips * 24} MIN
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
