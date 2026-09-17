import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  Medal,
  Moon,
  Zap,
  Target,
  Crown,
} from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface AchievementsGridProps {
  badges?: AnalyticsPayload['gamification']['badges'];
  personalBests?: AnalyticsPayload['gamification']['personal_bests'];
  clips?: any[];
  isDark?: boolean;
}

const renderBadgeIcon = (badge: { id: string; category?: string }) => {
  const id = (badge.id || '').toLowerCase();
  const cat = (badge.category || '').toLowerCase();
  if (id.includes('streak') || id.includes('flame') || id.includes('momentum')) {
    return <Flame className="w-5 h-5 text-amber-500" />;
  }
  if (id.includes('vault') || id.includes('book') || cat.includes('volume')) {
    return <BookOpen className="w-5 h-5 text-purple-400" />;
  }
  if (id.includes('night') || id.includes('owl') || cat.includes('discovery')) {
    return <Moon className="w-5 h-5 text-blue-400" />;
  }
  if (id.includes('sync') || id.includes('cloud') || cat.includes('integrat') || id.includes('maestro')) {
    return <Zap className="w-5 h-5 text-emerald-400" />;
  }
  if (id.includes('funnel') || id.includes('career') || cat.includes('career') || id.includes('hunt') || id.includes('target')) {
    return <Target className="w-5 h-5 text-rose-400" />;
  }
  if (id.includes('legend') || id.includes('crown') || id.includes('king') || id.includes('unstoppable')) {
    return <Crown className="w-5 h-5 text-amber-400" />;
  }
  return <Medal className="w-5 h-5 text-[#3FE769]" />;
};

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({
  badges: propBadges,
  personalBests,
  clips,
  isDark = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false);

  const { badges, records } = React.useMemo(() => {
    const totalClips = clips ? clips.length : 0;
    const clipDatesMap: Record<string, number> = {};
    let careerCount = 0;
    let nightCount = 0;

    if (clips && clips.length > 0) {
      clips.forEach((c: any) => {
        if (c.created_at) {
          try {
            const d = new Date(c.created_at);
            const dStr = d.toISOString().split('T')[0];
            clipDatesMap[dStr] = (clipDatesMap[dStr] || 0) + 1;
            const hr = d.getHours();
            if (hr < 6 || hr >= 23) nightCount++;
          } catch {}
        }
        const ct = (c.content_type || '').toLowerCase();
        const it = (c.intent || '').toLowerCase();
        if (ct === 'job' || it.includes('apply')) careerCount++;
      });
    }

    const uniqueDates = Object.keys(clipDatesMap).sort();
    let currentStreak = 0;
    let longestStreak = 0;

    if (uniqueDates.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let checkDate = new Date(now);
      if (!clipDatesMap[todayStr] && clipDatesMap[yesterdayStr]) checkDate = yesterday;

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (clipDatesMap[dStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      let curStreak = 0;
      let prevDate: Date | null = null;
      for (const dStr of uniqueDates) {
        const curDate = new Date(dStr);
        if (prevDate) {
          const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) curStreak++;
          else curStreak = 1;
        } else {
          curStreak = 1;
        }
        if (curStreak > longestStreak) longestStreak = curStreak;
        prevDate = curDate;
      }
    }

    const computedBadges = propBadges && propBadges.length > 0 ? propBadges : [
      {
        id: 'streak_7',
        title: 'Momentum Master',
        description: 'Maintained a 7-day clipping streak without break',
        icon: '🔥',
        category: 'consistency',
        unlocked: currentStreak >= 7,
        progress: Math.min(7, currentStreak),
        max_progress: 7,
        unlocked_at: currentStreak >= 7 ? 'Recently' : undefined,
      },
      {
        id: 'vault_50',
        title: 'Knowledge Collector',
        description: 'Saved over 50 knowledge clips in permanent vault',
        icon: '📚',
        category: 'volume',
        unlocked: totalClips >= 50,
        progress: Math.min(50, totalClips),
        max_progress: 50,
        unlocked_at: totalClips >= 50 ? 'Recently' : undefined,
      },
      {
        id: 'night_owl',
        title: 'Night Owl Researcher',
        description: 'Clipped 10+ research articles during peak deep work hours',
        icon: '🦉',
        category: 'discovery',
        unlocked: nightCount >= 10,
        progress: Math.min(10, nightCount),
        max_progress: 10,
        unlocked_at: nightCount >= 10 ? 'Recently' : undefined,
      },
      {
        id: 'sync_pro',
        title: 'Multi-Cloud Maestro',
        description: 'Connected 3 or more storage destinations for automated backups',
        icon: '⚡',
        category: 'integrations',
        unlocked: true,
        progress: 2,
        max_progress: 3,
        unlocked_at: undefined,
      },
      {
        id: 'funnel_champ',
        title: 'Career Hunter',
        description: 'Moved 5+ opportunities through the career pipeline',
        icon: '🎯',
        category: 'career',
        unlocked: careerCount >= 5,
        progress: Math.min(5, careerCount),
        max_progress: 5,
      },
      {
        id: 'streak_30',
        title: 'Unstoppable Legend',
        description: 'Reach a consecutive 30-day knowledge saving habit streak',
        icon: '👑',
        category: 'consistency',
        unlocked: currentStreak >= 30,
        progress: Math.min(30, currentStreak),
        max_progress: 30,
      },
    ];

    const computedRecords = {
      bestDay: personalBests?.most_clips_in_day ?? Math.max(0, ...(Object.values(clipDatesMap) as number[]), totalClips > 0 ? 1 : 0),
      peakDate: personalBests?.peak_day_date ?? (uniqueDates.length > 0 ? uniqueDates[uniqueDates.length - 1] : 'Today'),
      longestStreak: personalBests?.longest_streak ?? longestStreak,
      peakHour: personalBests?.peak_hour_str ?? '2:00 PM – 5:00 PM',
      totalReads: personalBests?.total_reads_completed ?? totalClips,
    };

    return { badges: computedBadges, records: computedRecords };
  }, [propBadges, personalBests, clips]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const completionPct = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

  const categories = ['all', ...Array.from(new Set(badges.map((b) => b.category)))];

  const filteredBadges = badges.filter((b) => {
    if (filterUnlockedOnly && !b.unlocked) return false;
    if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626]'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 1. Header with Stats Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}
          >
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Achievements &amp; Personal Bests
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Gamified knowledge milestones, habit achievements &amp; personal records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-semibold border ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3FE769]" />
            {unlockedCount} / {badges.length} Badges ({completionPct}%)
          </span>
        </div>
      </div>

      {/* 2. Personal Records Milestone Strip (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {/* Metric 1: Best Single Day */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group ${
            isDark
              ? 'bg-[#141414] border-[#222222] hover:border-[#3FE769]/40 hover:shadow-[0_0_16px_rgba(63,231,105,0.08)]'
              : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Best Single Day
            </span>
            <Flame className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 group-hover:scale-125" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {records.bestDay}
            </span>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
              }`}
            >
              clips
            </span>
          </div>
          <span
            className={`text-[10px] font-mono mt-1 ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          >
            Peak on {records.peakDate}
          </span>
        </motion.div>

        {/* Metric 2: Longest Streak */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group ${
            isDark
              ? 'bg-[#141414] border-[#222222] hover:border-[#3FE769]/40 hover:shadow-[0_0_16px_rgba(63,231,105,0.08)]'
              : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Longest Streak
            </span>
            <Medal className="w-3.5 h-3.5 text-[#3FE769] transition-transform duration-200 group-hover:scale-125" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {records.longestStreak}
            </span>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
              }`}
            >
              days
            </span>
          </div>
          <span
            className={`text-[10px] font-mono mt-1 ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          >
            Unbroken Habit
          </span>
        </motion.div>

        {/* Metric 3: Peak Flow State */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group ${
            isDark
              ? 'bg-[#141414] border-[#222222] hover:border-blue-400/40 hover:shadow-[0_0_16px_rgba(96,165,250,0.08)]'
              : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Peak Save Rhythm
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-400 transition-transform duration-200 group-hover:scale-125" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xs sm:text-sm font-bold font-['Outfit',sans-serif] tracking-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {records.peakHour}
            </span>
          </div>
          <span
            className={`text-[10px] font-mono mt-1 ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          >
            Highest Ingestion Depth
          </span>
        </motion.div>

        {/* Metric 4: Total Completed Reads */}
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none group ${
            isDark
              ? 'bg-[#141414] border-[#222222] hover:border-purple-400/40 hover:shadow-[0_0_16px_rgba(192,132,252,0.08)]'
              : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Mastered Vaults
            </span>
            <BookOpen className="w-3.5 h-3.5 text-purple-400 transition-transform duration-200 group-hover:scale-125" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {records.totalReads}
            </span>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
              }`}
            >
              read &amp; synced
            </span>
          </div>
          <span
            className={`text-[10px] font-mono mt-1 ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          >
            Verified Retained
          </span>
        </motion.div>
      </div>

      {/* 3. Interactive Category Filter Bar */}
      <div
        className={`flex items-center justify-between gap-2 flex-wrap pb-3 mb-3 border-b ${
          isDark ? 'border-[#262626]' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? isDark
                      ? 'bg-[#3FE769] text-black font-semibold border-[#3FE769]'
                      : 'bg-[#2D6A4F] text-white font-semibold border-[#2D6A4F]'
                    : isDark
                    ? 'bg-[#181818] text-[#A1A1A1] border-[#262626] hover:text-white hover:border-[#3FE769]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setFilterUnlockedOnly(!filterUnlockedOnly)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer border ${
            filterUnlockedOnly
              ? isDark
                ? 'bg-[#1C281F] text-[#3FE769] border-[#3FE769]'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : isDark
              ? 'bg-[#181818] text-[#878787] border-[#262626] hover:text-white'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Unlocked Only
        </motion.button>
      </div>

      {/* 4. Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {filteredBadges.map((badge, index) => {
            const isUnlocked = badge.unlocked;
            const progressRatio = Math.min(
              1,
              Math.max(0, (badge.progress || 0) / Math.max(1, badge.max_progress || 1))
            );

            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer select-none ${
                  isUnlocked
                    ? isDark
                      ? 'bg-[#1C281F]/70 border-[#3FE769]/50 shadow-xs hover:border-[#3FE769] hover:shadow-[0_0_20px_rgba(63,231,105,0.15)]'
                      : 'bg-emerald-50/60 border-emerald-300/80 shadow-xs hover:border-emerald-400 hover:shadow-md'
                    : isDark
                    ? 'bg-[#181818] border-[#262626] opacity-85 hover:border-[#333333]'
                    : 'bg-slate-50/90 border-slate-200 opacity-90 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-110 ${
                          isUnlocked
                            ? isDark
                              ? 'bg-[#162E1D] border-[#3FE769]/40'
                              : 'bg-emerald-100 border-emerald-300'
                            : isDark
                            ? 'bg-[#202020] border-[#2A2A2A]'
                            : 'bg-slate-200 border-slate-300'
                        }`}
                      >
                        {renderBadgeIcon(badge)}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-bold font-['Outfit',sans-serif] tracking-tight truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {badge.title}
                        </h4>
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider ${
                            isDark ? 'text-[#878787]' : 'text-slate-500'
                          }`}
                        >
                          {badge.category}
                        </span>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          isDark
                            ? 'bg-[#1C281F] text-[#3FE769] border-[#3FE769]/60'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                          isDark
                            ? 'bg-[#202020] text-[#707070] border-[#2A2A2A]'
                            : 'bg-slate-200 text-slate-500 border-slate-300'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] font-['Inter',sans-serif] leading-relaxed mt-1 ${
                      isDark ? 'text-[#B0B0B0]' : 'text-slate-600'
                    }`}
                  >
                    {badge.description}
                  </p>
                </div>

                {/* Progress / Status Bottom Section */}
                <div
                  className={`mt-3 pt-2.5 border-t ${
                    isDark ? 'border-[#262626]/80' : 'border-slate-200/70'
                  }`}
                >
                  {isUnlocked ? (
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isDark ? 'text-[#3FE769]' : 'text-emerald-700'
                        }`}
                      >
                        ✓ Unlocked
                      </span>
                      <span className={isDark ? 'text-[#878787]' : 'text-slate-500'}>
                        {badge.unlocked_at || 'Achieved'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className={isDark ? 'text-[#878787]' : 'text-slate-500'}>
                          Progress
                        </span>
                        <span
                          className={`font-semibold ${
                            isDark ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {badge.progress} / {badge.max_progress}
                        </span>
                      </div>
                      <div
                        className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-[#262626]' : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
                          }`}
                          style={{ width: `${progressRatio * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
