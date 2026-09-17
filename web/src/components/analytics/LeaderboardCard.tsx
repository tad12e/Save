import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Sparkles, TrendingUp, TrendingDown, Minus, Tag, ShieldCheck } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface LeaderboardCardProps {
  leaderboard?: AnalyticsPayload['predictive_forecast']['leaderboard'];
  popularTags?: AnalyticsPayload['popular_tags'];
  isDark?: boolean;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  leaderboard: propLeaderboard,
  popularTags: propTags,
  isDark = true,
}) => {
  const leaderboard = propLeaderboard ?? {
    user_percentile: 78,
    rank_title: 'Diamond Researcher',
    points: 3420,
    next_tier_points: 5000,
  };

  const defaultTopUsers = [
    { rank: 1, name: 'Alex Rivera', points: 4120, badge: '🏆 Grandmaster', isUser: false },
    { rank: 2, name: 'Elena Rostova', points: 3890, badge: '💎 Diamond', isUser: false },
    { rank: 3, name: 'You (Curator)', points: leaderboard.points, badge: '💎 Diamond', isUser: true },
    { rank: 4, name: 'Marcus Chen', points: 2310, badge: '🥇 Gold Pro', isUser: false },
    { rank: 5, name: 'Sarah Jenkins', points: 1980, badge: '🥇 Gold Pro', isUser: false },
  ];

  const defaultTags = [
    { tag: 'artificial-intelligence', count: 48, trend: 'up' as const },
    { tag: 'system-design', count: 36, trend: 'up' as const },
    { tag: 'react-patterns', count: 29, trend: 'stable' as const },
    { tag: 'career-growth', count: 22, trend: 'up' as const },
    { tag: 'fintech-markets', count: 18, trend: 'stable' as const },
    { tag: 'developer-tools', count: 15, trend: 'down' as const },
  ];

  const popularTags = propTags && propTags.length > 0 ? propTags : defaultTags;

  const progressPct = Math.min(
    100,
    Math.round((leaderboard.points / Math.max(1, leaderboard.next_tier_points)) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 h-full ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626]'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}
            >
              <Crown className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3
                className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Community Leaderboard &amp; Percentile
              </h3>
              <p
                className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                  isDark ? 'text-[#878787]' : 'text-slate-500'
                }`}
              >
                Global peer benchmark &amp; curated tags
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Top {100 - (leaderboard.user_percentile ?? 78)}% Global
          </span>
        </div>

        {/* Tier Progress Bar Card */}
        <div
          className={`rounded-xl p-3 sm:p-3.5 mb-3 border ${
            isDark
              ? 'bg-[#141414] border-[#222222]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-emerald-700'}`} />
              <span
                className={`font-bold font-['Outfit',sans-serif] ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {leaderboard.rank_title}
              </span>
            </div>
            <span
              className={`font-mono font-bold text-xs ${
                isDark ? 'text-[#3FE769]' : 'text-emerald-700'
              }`}
            >
              {leaderboard.points.toLocaleString()} / {leaderboard.next_tier_points.toLocaleString()} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-[#242424]' : 'bg-slate-200'
            }`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${
                isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
              }`}
            />
          </div>

          <div
            className={`flex items-center justify-between text-[10px] font-mono mt-1.5 ${
              isDark ? 'text-[#878787]' : 'text-slate-500'
            }`}
          >
            <span>{progressPct}% to Obsidian Master</span>
            <span>{(leaderboard.next_tier_points - leaderboard.points).toLocaleString()} XP needed</span>
          </div>
        </div>

        {/* Top 5 Ranked Users Table */}
        <div className="space-y-1.5 mb-3.5">
          {defaultTopUsers.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl text-xs transition-all border ${
                user.isUser
                  ? isDark
                    ? 'bg-[#1C281F] border-[#3FE769]/50 shadow-xs'
                    : 'bg-emerald-50 border-emerald-300 shadow-xs'
                  : isDark
                  ? 'bg-[#141414] border-[#222222] hover:border-[#2C2C2C]'
                  : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border ${
                    user.rank === 1
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : user.rank === 2
                      ? 'bg-slate-300/20 text-slate-300 border-slate-300/30'
                      : user.rank === 3
                      ? isDark
                        ? 'bg-[#3FE769]/20 text-[#3FE769] border-[#3FE769]/30'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : isDark
                      ? 'bg-[#202020] text-[#878787] border-[#2A2A2A]'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  #{user.rank}
                </span>
                <span
                  className={`font-['Inter',sans-serif] text-xs font-medium truncate ${
                    user.isUser
                      ? isDark
                        ? 'text-white font-semibold'
                        : 'text-emerald-950 font-semibold'
                      : isDark
                      ? 'text-[#EDEDED]'
                      : 'text-slate-800'
                  }`}
                >
                  {user.name}
                </span>
              </div>

              <div className="flex items-center gap-2.5 font-mono text-[11px] shrink-0">
                <span
                  className={`text-[10px] hidden sm:inline ${
                    isDark ? 'text-[#878787]' : 'text-slate-500'
                  }`}
                >
                  {user.badge}
                </span>
                <span
                  className={`font-bold ${
                    user.isUser
                      ? isDark
                        ? 'text-[#3FE769]'
                        : 'text-emerald-800'
                      : isDark
                      ? 'text-white'
                      : 'text-slate-900'
                  }`}
                >
                  {user.points.toLocaleString()} XP
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Tags Section */}
        <div
          className={`pt-3 border-t ${
            isDark ? 'border-[#222222]' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              <Tag className="w-3 h-3" />
              Popular Vault Tags
            </span>
            <span
              className={`text-[10px] font-mono ${
                isDark ? 'text-[#3FE769]' : 'text-emerald-700'
              }`}
            >
              Real-Time Clustering
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {popularTags.map((tg) => (
              <span
                key={tg.tag}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono border transition-all ${
                  isDark
                    ? 'bg-[#141414] border-[#222222] text-[#EDEDED] hover:border-[#3FE769]/50'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>#{tg.tag}</span>
                <span
                  className={`text-[10px] font-bold ${
                    isDark ? 'text-[#878787]' : 'text-slate-400'
                  }`}
                >
                  {tg.count}
                </span>
                {tg.trend === 'up' && (
                  <TrendingUp className="w-2.5 h-2.5 text-[#3FE769]" />
                )}
                {tg.trend === 'down' && (
                  <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
                )}
                {tg.trend === 'stable' && (
                  <Minus className="w-2.5 h-2.5 text-slate-400" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`pt-3 mt-3 border-t flex items-center justify-between text-[11px] font-['Inter',sans-serif] ${
          isDark ? 'border-[#222222] text-[#878787]' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span>Real-time benchmark index</span>
        <span
          className={`font-mono font-medium ${
            isDark ? 'text-[#3FE769]' : 'text-emerald-700'
          }`}
        >
          Rank #{3} of 1,420 Active Users
        </span>
      </div>
    </motion.div>
  );
};
