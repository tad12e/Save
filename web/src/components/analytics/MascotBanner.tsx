import React from 'react';
import { motion } from 'framer-motion';

interface MascotBannerProps {
  totalInPeriod?: number;
  periodLabel?: string;
  velocityLabel?: string;
}

export const MascotBanner: React.FC<MascotBannerProps> = ({
  totalInPeriod = 52,
  periodLabel = 'this week',
  velocityLabel = '+18.4% velocity',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4"
    >
      {/* Speech Bubble Container */}
      <div className="flex-1 bg-slate-50/90 border border-slate-200/70 rounded-xl px-4 py-2.5 flex items-center">
        <p className="text-xs sm:text-[13px] font-semibold text-slate-800 font-sans tracking-tight">
          {totalInPeriod} clips saved {periodLabel.toLowerCase()} across 34 collections. <span className="text-emerald-700 font-bold">Elite Researcher.</span>
        </p>
      </div>

      {/* Cute Smiling Green Mascot Avatar */}
      <div className="w-11 h-11 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-700/20 relative">
        {/* Animated Antenna / Ears */}
        <div className="absolute -top-1 left-2.5 w-1.5 h-2 bg-emerald-600 rounded-full rotate-[-20deg]" />
        <div className="absolute -top-1 right-2.5 w-1.5 h-2 bg-emerald-600 rounded-full rotate-[20deg]" />

        {/* Cute Face (Two eyes + Smiling curve) */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <div className="w-3.5 h-1.5 border-b-2 border-white rounded-b-full mt-0.5" />
        </div>
      </div>
    </motion.div>
  );
};
