import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Share2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAnalyticsStore, TimeframePeriod } from '../../store/analyticsStore';
import { fetchFullAnalytics } from '../../lib/analyticsApi';
import { ClipItem, DestinationConfig } from '../../types';

// Image 2 Core Layout Components
import { MascotBanner } from '../analytics/MascotBanner';
import { QuickStatsBar } from '../analytics/QuickStatsBar';
import { DailyFocusCard } from '../analytics/DailyFocusCard';
import { DensityAndRhythm } from '../analytics/DensityAndRhythm';
import { SubjectsBar } from '../analytics/SubjectsBar';
import { ConsistencyHeatmapCard } from '../analytics/ConsistencyHeatmapCard';
import { FocusDistributionCard } from '../analytics/FocusDistributionCard';

// Detailed Analytics Widgets
import { HourlySavingRhythm } from '../analytics/HourlySavingRhythm';
import { ClipsOverTimeChart } from '../analytics/ClipsOverTimeChart';
import { ContentTypeDonut } from '../analytics/ContentTypeDonut';
import { JobsFunnelChart } from '../analytics/JobsFunnelChart';
import { ActionRateBars } from '../analytics/ActionRateBars';
import { PredictiveForecast } from '../analytics/PredictiveForecast';
import { AchievementsGrid } from '../analytics/AchievementsGrid';
import { LeaderboardCard } from '../analytics/LeaderboardCard';

interface AnalyticsPageProps {
  clips: ClipItem[];
  destinations: DestinationConfig[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ clips, destinations }) => {
  const { selectedPeriod, setSelectedPeriod } = useAnalyticsStore();

  // Query hook with 5-minute cache time
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['analytics_full', selectedPeriod, clips.length, destinations.length],
    queryFn: () => fetchFullAnalytics(selectedPeriod, false, clips, destinations),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const periods: Array<{ id: TimeframePeriod; label: string }> = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'all_time', label: 'All Time' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-sans pb-20">
      {/* Top Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4 sm:space-y-5">
        {/* 1. Header Row (Stats title + Action buttons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 tracking-tight">
              Stats
            </h1>
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Period Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TimeframePeriod)}
                className="appearance-none bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 pr-8 text-xs font-mono font-semibold text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-slate-300 focus:outline-none cursor-pointer"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Share Today Button */}
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Stats link copied to clipboard!');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-white border border-slate-200/80 text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>SHARE TODAY</span>
            </button>

            {/* Open Action / Quick Save Button */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-sans font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'SYNCING...' : 'REFRESH'}</span>
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            <p className="text-xs font-mono text-slate-500">
              Loading DuckDB OLAP analytics & generating widgets...
            </p>
          </div>
        ) : (
          <>
            {/* 2. Mascot Speech Bubble Banner */}
            <MascotBanner
              totalInPeriod={data.kpis?.weekly_velocity?.value ?? 52}
              periodLabel={selectedPeriod === 'this_week' ? 'this week' : selectedPeriod === 'this_month' ? 'this month' : 'recently'}
              velocityLabel={`${(data.kpis?.weekly_velocity?.delta_pct ?? 18.4) >= 0 ? '+' : ''}${data.kpis?.weekly_velocity?.delta_pct ?? 18.4}% velocity`}
            />

            {/* 3. 5-Metric Quick Stats Bar */}
            <QuickStatsBar kpis={data.kpis} />

            {/* 4. Main 2-Column Grid (Image 2 Structure) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                {/* Daily Focus Card */}
                <DailyFocusCard dailyFocus={data.daily_focus} />

                {/* Density (Daily minutes area wave) & Rhythm (Weekday bars) */}
                <DensityAndRhythm
                  historicalData={data.predictive_forecast.historical_trend}
                  weekdayRhythm={data.weekday_rhythm}
                />

                {/* Subjects Bar */}
                <SubjectsBar tags={data.popular_tags} />

                {/* Opportunities & Career Funnel */}
                <JobsFunnelChart funnelData={data.opportunity_funnel} />
              </div>

              {/* Right Column (5 cols) */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                {/* Consistency Heatmap */}
                <ConsistencyHeatmapCard days={data.contribution_matrix.days} />

                {/* Focus Distribution Specialty Radar */}
                <FocusDistributionCard knowledgeRadar={data.knowledge_radar} />

                {/* Hourly Saving Rhythm (6 AM - 11 PM) */}
                <HourlySavingRhythm hourlyData={data.hourly_distribution} />
              </div>
            </div>

            {/* 5. Secondary Row: Clips Over Time Trend & Content Type Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 pt-2">
              <ClipsOverTimeChart historicalData={data.predictive_forecast.historical_trend} />
              <ContentTypeDonut contentBreakdown={data.content_breakdown} />
            </div>

            {/* 6. Action Rates & Predictive Insights */}
            <ActionRateBars
              popularTags={data.popular_tags}
              destinationsHealth={data.destinations_health}
            />

            <PredictiveForecast forecastData={data.predictive_forecast} />

            {/* 7. Achievement Badges & Global Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
              <div className="lg:col-span-2">
                <AchievementsGrid badges={data.gamification.badges} />
              </div>
              <div>
                <LeaderboardCard leaderboard={data.predictive_forecast.leaderboard} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
