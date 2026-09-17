import React from 'react';
import { motion } from 'framer-motion';

interface MascotBannerProps {
  totalInPeriod?: number;
  periodLabel?: string;
  velocityLabel?: string;
  isDark?: boolean;
}

export const MascotBanner: React.FC<MascotBannerProps> = ({
  totalInPeriod = 52,
  periodLabel = 'this week',
  velocityLabel = '+18.4% velocity',
  isDark = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full rounded-2xl border p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-4 transition-all ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED]'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Speech Bubble Container */}
      <div
        className={`flex-1 border rounded-xl px-4 py-2.5 flex items-center ${
          isDark
            ? 'bg-[#181818] border-[#262626]'
            : 'bg-slate-50/90 border-slate-200/70'
        }`}
      >
        <p
          className={`text-xs sm:text-[13px] font-semibold tracking-tight font-['Outfit',sans-serif] ${
            isDark ? 'text-[#EDEDED]' : 'text-slate-800'
          }`}
        >
          {totalInPeriod} clips saved {periodLabel.toLowerCase()} across connected vaults.{' '}
          <span
            className={`font-bold ${
              isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
            }`}
          >
            Elite Researcher ({velocityLabel}).
          </span>
        </p>
      </div>

      {/* Cute Smiling Mascot Avatar */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative transition-all ${
          isDark
            ? 'bg-[#16291C] border border-[#234E2E] text-[#3FE769] shadow-[0_0_15px_rgba(63,231,105,0.15)]'
            : 'bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20'
        }`}
      >
        {/* Animated Antenna / Ears */}
        <div
          className={`absolute -top-1 left-2.5 w-1.5 h-2 rounded-full rotate-[-20deg] ${
            isDark ? 'bg-[#3FE769]' : 'bg-[#40916C]'
          }`}
        />
        <div
          className={`absolute -top-1 right-2.5 w-1.5 h-2 rounded-full rotate-[20deg] ${
            isDark ? 'bg-[#3FE769]' : 'bg-[#40916C]'
          }`}
        />

        {/* Cute Face (Two eyes + Smiling curve) */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-[#3FE769]' : 'bg-white'
              }`}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-[#3FE769]' : 'bg-white'
              }`}
            />
          </div>
          <div
            className={`w-3.5 h-1.5 border-b-2 rounded-b-full mt-0.5 ${
              isDark ? 'border-[#3FE769]' : 'border-white'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};
