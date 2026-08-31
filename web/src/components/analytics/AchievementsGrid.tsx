import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface AchievementsGridProps {
  badges: AnalyticsPayload['gamification']['badges'];
}

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({ badges }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.5 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              ACHIEVEMENT BADGES & MILESTONES
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Knowledge collection badges & productivity feats
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
        </span>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * index }}
            className={`p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
              badge.unlocked
                ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs'
                : 'bg-slate-50/80 border-slate-200/60 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-sans">{badge.title}</h4>
                    <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">
                      {badge.category}
                    </span>
                  </div>
                </div>

                {badge.unlocked ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 font-sans mt-1 leading-snug">
                {badge.description}
              </p>
            </div>

            {/* Progress bar or Unlocked tag */}
            <div className="mt-3 pt-2 border-t border-slate-200/60">
              {badge.unlocked ? (
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-800">
                  <span className="font-semibold">✓ Completed</span>
                  <span className="text-slate-500">{badge.unlocked_at || 'Achieved'}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                    <span>Progress</span>
                    <span>
                      {badge.progress}/{badge.max_progress}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${(badge.progress / badge.max_progress) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
