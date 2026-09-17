import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

interface FeedZeroCelebrationProps {
  streak: number;
  totalReviewed: number;
  onExploreMore: () => void;
  isDark?: boolean;
}

export const FeedZeroCelebration: React.FC<FeedZeroCelebrationProps> = ({
  streak,
  totalReviewed,
  onExploreMore,
  isDark = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden text-center transition-all ${
        isDark
          ? 'bg-[#0E1711] border-[#1E3A24] text-white shadow-[0_0_30px_rgba(63,231,105,0.08)]'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-sm'
      }`}
    >
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#3FE769]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 border shadow-inner ${
            isDark
              ? 'bg-[#142B1A] border-[#2B5E38] text-[#3FE769]'
              : 'bg-emerald-100 border-emerald-300 text-emerald-700'
          }`}
        >
          <Trophy className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold mb-2 border bg-black/20 dark:bg-[#142B1A] text-[#3FE769] border-[#3FE769]/40">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>{streak}-Day Knowledge Streak Maintained!</span>
        </div>

        <h3
          className="text-lg sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight mb-2"
        >
          Feed Zero Achieved! 🎉
        </h3>

        <p
          className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-5 ${
            isDark ? 'text-[#B8E2C4]' : 'text-emerald-800'
          }`}
        >
          You have reviewed all {totalReviewed} daily knowledge gems. Spaced repetition memory recall is active, and your retention momentum is preserved.
        </p>

        <button
          onClick={onExploreMore}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
            isDark
              ? 'bg-[#3FE769] text-black hover:bg-[#34c759]'
              : 'bg-[#2D6A4F] text-white hover:bg-[#23533e]'
          }`}
        >
          Explore Deep Archive Stream
        </button>
      </div>
    </motion.div>
  );
};
