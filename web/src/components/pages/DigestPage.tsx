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
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn font-sans text-stone-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-[#080808] to-[#050505] rounded-sm p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-amber-500/30">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Intelligence Report
          </div>
          <h1 className="text-2xl md:text-4xl font-serif font-extrabold tracking-tight">
            Your Weekly Opportunity Digest & Analytics
          </h1>
          <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-sans">
            Clipper analyzed all your captured web clips across Twitter/X, LinkedIn, and websites to surface high-priority job matches, grants, and upcoming deadlines.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* AI Insight Highlight Card */}
      <div className="p-5 rounded-sm bg-[#080808] border border-amber-500/30 flex items-start gap-3 text-stone-200 text-xs md:text-sm shadow-md">
        <Target className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-amber-400 text-base">AI Executive Summary</h4>
          <p className="leading-relaxed text-stone-300 font-sans">
            {digest.aiInsightText}
          </p>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#080808] border border-white/10 rounded-sm p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase">
            <span>Total Clips This Week</span>
            <Bookmark className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-serif font-extrabold text-white">{digest.totalClips}</p>
          <p className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +32% higher capture rate than last week
          </p>
        </div>

        <div className="bg-[#080808] border border-white/10 rounded-sm p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase">
            <span>High-Fit Jobs Identified</span>
            <Briefcase className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-serif font-extrabold text-white">{digest.opportunitiesSaved}</p>
          <p className="text-xs text-stone-400 font-mono">Average Match Score: 92%</p>
        </div>

        <div className="bg-[#080808] border border-white/10 rounded-sm p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase">
            <span>Top Category</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-serif font-extrabold text-white uppercase">{digest.topCategory}</p>
          <p className="text-xs text-stone-400 font-mono">50% of total clipped volume</p>
        </div>
      </div>

      {/* Breakdown Visual Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown bars */}
        <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-white text-base">Category Distribution</h3>
          <div className="space-y-3">
            {digest.categoryBreakdown.map(cat => (
              <div key={cat.type} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="capitalize text-stone-200">{cat.type}</span>
                  <span className="text-amber-500 font-bold">{cat.count} items ({cat.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-[#050505] rounded-sm border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-sm transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Matches Ranking List */}
        <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-white text-base">Top High-Match Opportunities</h3>
          <div className="space-y-3">
            {digest.topMatches.map((item, idx) => (
              <div key={idx} className="p-3 rounded-sm bg-[#050505] border border-white/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-xs text-white truncate">{item.title}</h4>
                  <p className="text-[11px] text-stone-400 truncate">{item.company}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded-sm text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.score}% Match
                  </span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 text-stone-400 hover:text-amber-400">
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
