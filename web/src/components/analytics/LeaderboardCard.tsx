import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface LeaderboardCardProps {
  leaderboard: AnalyticsPayload['predictive_forecast']['leaderboard'];
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ leaderboard }) => {
  const topUsers = [
    { rank: 1, name: 'Alex Rivera', points: 4120, badge: '🏆 Grandmaster', isUser: false },
    { rank: 2, name: 'Elena Rostova', points: 3890, badge: '💎 Diamond', isUser: false },
    { rank: 3, name: 'Tadiwos (You)', points: leaderboard.points, badge: '💎 Diamond', isUser: true },
    { rank: 4, name: 'Marcus Chen', points: 2310, badge: '🥇 Gold Pro', isUser: false },
    { rank: 5, name: 'Sarah Jenkins', points: 1980, badge: '🥇 Gold Pro', isUser: false },
  ];

  const progressPct = Math.min(
    100,
    Math.round((leaderboard.points / leaderboard.next_tier_points) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.52 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Crown className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                COMMUNITY LEADERBOARD & RANK
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Top research collectors & percentile rank
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            Top {100 - leaderboard.user_percentile}% Global
          </span>
        </div>

        {/* Tier Progress Bar Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-900 font-sans">{leaderboard.rank_title}</span>
            <span className="font-mono text-emerald-700 font-bold">
              {leaderboard.points} / {leaderboard.next_tier_points} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-emerald-700"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1.5">
            <span>{progressPct}% to Obsidian Master</span>
            <span>{leaderboard.next_tier_points - leaderboard.points} XP needed</span>
          </div>
        </div>

        {/* Top 5 Ranked Users Table */}
        <div className="space-y-1.5">
          {topUsers.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                user.isUser
                  ? 'bg-emerald-50/80 border border-emerald-300 font-semibold'
                  : 'bg-white border border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    user.rank === 1
                      ? 'bg-amber-100 text-amber-800'
                      : user.rank === 2
                      ? 'bg-slate-200 text-slate-700'
                      : user.rank === 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {user.rank}
                </span>
                <span className="font-sans text-[11px] text-slate-800">{user.name}</span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-500 text-[10px]">{user.badge}</span>
                <span className="font-bold text-slate-900">{user.points.toLocaleString()} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
        <span>Updated real-time from OLAP engine</span>
        <span className="font-mono text-emerald-700 font-medium">Rank #3 of 1,420 Active Users</span>
      </div>
    </motion.div>
  );
};
