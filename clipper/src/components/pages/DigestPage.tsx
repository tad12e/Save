import React from 'react';
import { WeeklyDigestStats, ClipItem } from '../../types';
import { 
  Sparkles, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  ArrowUpRight, 
  Clock, 
  Briefcase, 
  Bookmark,
  Zap,
  Target
} from 'lucide-react';

interface DigestPageProps {
  digest: WeeklyDigestStats;
  clips: ClipItem[];
}

export const DigestPage: React.FC<DigestPageProps> = ({ digest, clips }) => {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-violet-800/40">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Intelligence Report
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Your Weekly Opportunity Digest & Analytics
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Clipper analyzed all your captured web clips across Twitter/X, LinkedIn, and websites to surface high-priority job matches, grants, and upcoming deadlines.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AI Insight Highlight Card */}
      <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 flex items-start gap-3 text-slate-800 dark:text-slate-200 text-xs md:text-sm">
        <Target className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-violet-900 dark:text-violet-200">AI Executive Summary</h4>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">
            {digest.aiInsightText}
          </p>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Clips This Week</span>
            <Bookmark className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{digest.totalClips}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +32% higher capture rate than last week
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>High-Fit Jobs Identified</span>
            <Briefcase className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{digest.opportunitiesSaved}</p>
          <p className="text-xs text-slate-500 font-medium">Average Match Score: 92%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Top Category</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase">{digest.topCategory}</p>
          <p className="text-xs text-slate-500 font-medium">50% of total clipped volume</p>
        </div>
      </div>

      {/* Breakdown Visual Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Category Distribution</h3>
          <div className="space-y-3">
            {digest.categoryBreakdown.map(cat => (
              <div key={cat.type} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize text-slate-800 dark:text-slate-200">{cat.type}</span>
                  <span className="text-slate-500">{cat.count} items ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Matches Ranking List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Top High-Match Opportunities</h3>
          <div className="space-y-3">
            {digest.topMatches.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{item.company}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    {item.score}% Match
                  </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-violet-600">
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
