import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Share2,
  ExternalLink,
  ChevronDown,
  Download,
  FilterX,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Sun,
  Moon,
} from 'lucide-react';
import { useAnalyticsStore, TimeframePeriod } from '../../store/analyticsStore';
import { useAnalyticsQuery } from '../../lib/useAnalyticsQuery';
import { ClipItem, DestinationConfig } from '../../types';

function MicroSpark({ values, stroke }: { values?: number[]; stroke: string }) {
  const vals = values && values.length > 1 ? values : [12, 16, 14, 19, 22, 18, 25];
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const pts = vals
    .map((v, i) => `${(i / Math.max(1, vals.length - 1)) * 64},${22 - ((v - min) / range) * 18}`)
    .join(' ');
  return (
    <svg
      viewBox="0 0 64 24"
      className="w-16 h-6 shrink-0 transition-all duration-200 group-hover:scale-105"
      fill="none"
    >
      <polyline
        points={pts}
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-200"
        style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
      />
    </svg>
  );
}

// Stitch Core Layout Components
import { SavesPerWeekAreaChart } from '../analytics/SavesPerWeekAreaChart';
import { IntentBreakdownDonut } from '../analytics/IntentBreakdownDonut';
import { OpportunityOutcomesFunnel } from '../analytics/OpportunityOutcomesFunnel';
import { CaptureHeatmapCard } from '../analytics/CaptureHeatmapCard';
import { TopKnowledgeSourcesTable } from '../analytics/TopKnowledgeSourcesTable';
import { MascotBanner } from '../analytics/MascotBanner';
import { QuickStatsBar } from '../analytics/QuickStatsBar';
import { FocusRings } from '../analytics/FocusRings';
import { DailyFocusCard } from '../analytics/DailyFocusCard';
import { WeekdayBarChart } from '../analytics/WeekdayBarChart';
import { DensityAndRhythm } from '../analytics/DensityAndRhythm';
import { KnowledgeRadarChart } from '../analytics/KnowledgeRadarChart';
import { ContentTypeDonut } from '../analytics/ContentTypeDonut';
import { FocusDistributionCard } from '../analytics/FocusDistributionCard';
import { AchievementsGrid } from '../analytics/AchievementsGrid';
import { PredictiveForecast } from '../analytics/PredictiveForecast';

interface AnalyticsPageProps {
  clips: ClipItem[];
  destinations: DestinationConfig[];
  theme?: 'terminal' | 'dark' | 'light';
  setTheme?: (theme: 'terminal' | 'dark' | 'light') => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ clips = [], destinations = [], theme = 'dark', setTheme }) => {
  const { selectedPeriod, setSelectedPeriod } = useAnalyticsStore();
  const isDark = theme === 'dark' || theme === 'terminal';

  // Multi-Dimensional OLAP Filter States
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '12M' | 'custom'>('30D');
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'apply' | 'learn' | 'track' | 'attend'>('all');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Shared query hook with 5-minute cache time (same key as DashboardPage)
  const { data, isLoading, isFetching, refetch } = useAnalyticsQuery(
    clips,
    destinations,
    selectedIntent,
    selectedDestination
  );

  // Live dimensional metrics computed directly from backend payload / user vault
  const totalClips = data?.kpis?.total_clips?.value ?? clips.length;
  const reviewedClips = data?.opportunity_funnel?.[1]?.count ?? clips.filter(c => c.status && c.status !== 'pending').length;
  const processingRatePct = totalClips > 0 ? Math.round((reviewedClips / totalClips) * 100) : 100;

  const actionedClips = data?.opportunity_funnel?.[2]?.count ?? clips.filter(c => ['job', 'scholarship', 'event'].includes((c.content_type || '').toLowerCase()) || c.deadline_date).length;
  const actionRatePct = data?.money?.action_rate_percent ?? (totalClips > 0 ? Math.round((actionedClips / totalClips) * 1000) / 10 : 0);

  const activeDestCount = data?.destinations_health?.active_count ?? destinations.filter(d => d.is_active).length;
  const overallUptime = data?.destinations_health?.overall_uptime ?? '99.8%';
  const avgLatencyMs = data?.destinations_health?.destinations?.length
    ? Math.round(data.destinations_health.destinations.reduce((acc, d) => acc + (d.latency_ms || 85), 0) / data.destinations_health.destinations.length)
    : 85;

  const missedDeadlinesCount = data?.money?.missed_deadlines_count ?? 0;

  return (
    <div className={`min-h-screen font-sans pb-20 transition-colors duration-200 ${isDark ? 'bg-[#000000] text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Top Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4 sm:space-y-5">
        {/* Stitch Enhanced Header & Live Telemetry Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className={`text-2xl sm:text-[30px] font-bold tracking-tight font-['Outfit',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Analytics &amp; OLAP Insights
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#16A34A]'} animate-pulse`} />
                Live Telemetry
              </span>
            </div>
            <p className={`text-[13px] font-['Inter',sans-serif] ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
              Real-time dimensional metrics and ingestion telemetry across all connected knowledge vaults.
            </p>
          </div>

          {/* Stitch Action Buttons (Export, Overview, Queries, Bell & Theme Toggle) */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => {
                if (data) {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `save-analytics-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all border cursor-pointer ${
                isDark
                  ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#3FE769]" />
              <span>Export</span>
            </button>

            <button
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isDark
                  ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>

            <button
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isDark
                  ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              Queries
            </button>

            <button
              className={`p-1.5 rounded-xl text-xs transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#181818] border-[#262626] text-[#878787] hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const nextTheme = isDark ? 'light' : 'dark';
                if (setTheme) {
                  setTheme(nextTheme);
                }
              }}
              className={`p-1.5 rounded-xl text-xs transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#181818] border-[#262626] text-[#3FE769] hover:bg-[#222222]'
                  : 'bg-white border-slate-200 text-[#2D6A4F] hover:bg-slate-50'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Stitch Dynamic Alert Banner: Expired / Active Opportunities */}
        {missedDeadlinesCount > 0 ? (
          <div className="bg-[#180808] border border-[#4A1111] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2D0D0D] border border-[#5C1A1A] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-rose-200 font-['Outfit',sans-serif]">
                  {missedDeadlinesCount} Opportunit{missedDeadlinesCount === 1 ? 'y' : 'ies'} Expired Unactioned
                </h3>
                <p className="text-[11px] text-rose-400/80 font-['Inter',sans-serif] mt-0.5">
                  Jobs, events, or scholarships passed deadline without review.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedIntent('apply')}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
            >
              Review Pipeline
            </button>
          </div>
        ) : (
          <div className={`rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border transition-all ${
            isDark ? 'bg-[#0E1A11] border-[#1C3823]' : 'bg-emerald-50/70 border-emerald-200/80'
          }`}>
            <div className="flex items-start sm:items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-[#142A1B] border-[#20492E] text-[#3FE769]' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-bold font-['Outfit',sans-serif] ${
                  isDark ? 'text-emerald-200' : 'text-emerald-900'
                }`}>
                  All Tracked Deadlines Current
                </h3>
                <p className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                  isDark ? 'text-emerald-400/80' : 'text-emerald-700'
                }`}>
                  Zero overdue opportunities detected across your saved knowledge vaults.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedIntent('apply')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#142A1B] border-[#20492E] text-[#3FE769] hover:bg-[#1A3723]'
                  : 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              Filter Opportunities
            </button>
          </div>
        )}

        {/* Box 1: Multi-Dimensional OLAP Filter Bar */}
        <div className={`rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 border transition-all ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-slate-200'
        }`}>
          {/* Left segments: Date Range + Intent pills + Destination selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Segment */}
            <div className={`inline-flex p-1 rounded-xl text-xs font-medium border ${
              isDark ? 'bg-[#181818] border-[#262626] text-[#A1A1A1]' : 'bg-[#F1F5F9] border-slate-200 text-slate-600'
            }`}>
              {(['7D', '30D', '90D', '12M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedRange(r);
                    if (r === '7D') setSelectedPeriod('this_week');
                    else if (r === '30D') setSelectedPeriod('last_30_days');
                    else setSelectedPeriod('all_time');
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedRange === r
                      ? isDark
                        ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                        : 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'hover:text-current'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setSelectedRange('custom')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  selectedRange === 'custom'
                    ? isDark
                      ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                      : 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'hover:text-current'
                }`}
              >
                <span>Custom</span>
                <span className="hidden sm:inline text-[10px] opacity-75">(Oct 1 - Oct 28)</span>
              </button>
            </div>

            {/* Intent Multi-Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {[
                { id: 'all', label: 'All Intents' },
                { id: 'apply', label: 'Apply', dot: '#F59E0B' },
                { id: 'learn', label: 'Learn', dot: isDark ? '#3FE769' : '#2D6A4F' },
                { id: 'track', label: 'Track', dot: '#40916C' },
                { id: 'attend', label: 'Attend', dot: '#8B5CF6' },
              ].map((intent) => (
                <button
                  key={intent.id}
                  onClick={() => setSelectedIntent(intent.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedIntent === intent.id
                      ? isDark
                        ? 'bg-[#3FE769] text-black font-semibold'
                        : 'bg-[#2D6A4F] text-white font-semibold'
                      : isDark
                        ? 'bg-[#181818] text-[#A1A1A1] hover:text-white border border-[#262626]'
                        : 'bg-[#F8FAFC] text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>{intent.label}</span>
                  {intent.dot && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: selectedIntent === intent.id ? (isDark ? '#000000' : '#FFFFFF') : intent.dot,
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Destination Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className={`appearance-none text-xs rounded-xl pl-3 pr-8 py-1.5 focus:outline-none transition-colors cursor-pointer border ${
                  isDark
                    ? 'bg-[#181818] border-[#262626] text-[#EDEDED] focus:border-[#3FE769]'
                    : 'bg-[#F8FAFC] border-slate-200 text-slate-800 focus:border-[#2D6A4F]'
                }`}
              >
                <option value="all">All Destinations ({clips.length})</option>
                {destinations.map((dest) => {
                  const destKey = (dest.provider || dest.name || '').toLowerCase();
                  const count = clips.filter(
                    (c) => (c.destination || '').toLowerCase() === destKey || (c.destination || '').toLowerCase() === (dest.name || '').toLowerCase()
                  ).length;
                  return (
                    <option key={dest.id} value={destKey}>
                      {dest.name || dest.provider} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-2 pointer-events-none ${
                isDark ? 'text-[#878787]' : 'text-slate-400'
              }`} />
            </div>
          </div>

          {/* Right Controls: Granularity & Reset */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              isDark ? 'bg-[#181818] border-[#262626] text-[#878787]' : 'bg-[#F1F5F9] border-slate-200 text-slate-600'
            }`}>
              <span className="text-[11px] font-semibold">Granularity:</span>
              {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] capitalize transition-all cursor-pointer ${
                    granularity === g
                      ? isDark
                        ? 'bg-[#2A2A2A] text-white font-semibold'
                        : 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'hover:text-current'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedRange('30D');
                setSelectedPeriod('last_30_days');
                setSelectedIntent('all');
                setSelectedDestination('all');
                setGranularity('weekly');
              }}
              className={`p-1.5 rounded-xl text-xs transition-colors border cursor-pointer ${
                isDark
                  ? 'border-[#262626] text-[#878787] hover:text-[#FF6B6B] hover:bg-[#181818]'
                  : 'border-slate-200 text-slate-600 hover:text-[#DC2626] hover:bg-[#F8FAFC]'
              }`}
              title="Reset Filters"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            <p className="text-xs font-mono text-slate-500">
              Loading DuckDB OLAP analytics &amp; generating widgets...
            </p>
          </div>
        ) : (
          <>
            {/* Mascot AI Coaching Speech Bubble Banner */}
            <MascotBanner
              totalInPeriod={data.kpis?.total_clips?.value ?? 52}
              periodLabel={selectedPeriod.replace(/_/g, ' ')}
              velocityLabel={
                data.kpis?.total_clips?.delta_pct
                  ? `+${data.kpis.total_clips.delta_pct}% velocity`
                  : '+18.4% velocity'
              }
              isDark={isDark}
            />

            {/* 5-Metric Quick Stats Bar */}
            <QuickStatsBar
              kpis={data.kpis}
              isDark={isDark}
            />

            {/* Box 2: Four Tectonic KPI Metric Tiles (Stitch Screen 7cff5690f6924342a24b6abc44366f33) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Metric 1: Total Clips Ingested */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/50 hover:shadow-[0_0_24px_rgba(63,231,105,0.08)]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Total Clips Ingested
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-transform duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] group-hover:border-[#3FE769]/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    +{data.kpis?.total_clips?.delta_pct ?? 18.4}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {data.kpis?.total_clips?.value?.toLocaleString() ?? '1,428'}
                  </div>
                  <MicroSpark values={data.kpis?.total_clips?.sparkline} stroke={isDark ? '#3FE769' : '#2D6A4F'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'}`} />
                  <span>
                    {data.kpis?.weekly_velocity?.value
                      ? `${(data.kpis.weekly_velocity.value / 7).toFixed(1)} clips/day avg velocity`
                      : '47.6 clips/day avg velocity'}
                  </span>
                </p>
              </motion.div>

              {/* Metric 2: Processing Rate */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/50 hover:shadow-[0_0_24px_rgba(63,231,105,0.08)]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Processing Rate
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-transform duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] group-hover:border-[#3FE769]/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    {processingRatePct}% Vault
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {processingRatePct}%
                  </div>
                  <MicroSpark values={data.kpis?.weekly_velocity?.sparkline} stroke={isDark ? '#3FE769' : '#2D6A4F'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <span>
                    {reviewedClips} of {totalClips} processed or archived
                  </span>
                </p>
              </motion.div>

              {/* Metric 3: Opportunity Conversion */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] hover:border-amber-400/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.08)]'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Opportunity Conversion
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-transform duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#F59E0B] border border-[#2A2A2A] group-hover:border-[#F59E0B]/40'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    Live Pipeline
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-amber-400' : 'text-slate-900'}`}>
                    {actionRatePct}%
                  </div>
                  <MicroSpark values={data.kpis?.active_streak?.sparkline} stroke={isDark ? '#F59E0B' : '#D97706'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <span>{actionedClips} actionable opportunities / {totalClips} total</span>
                </p>
              </motion.div>

              {/* Metric 4: P95 Sync Latency */}
              <motion.div
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all cursor-pointer group select-none border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/50 hover:shadow-[0_0_24px_rgba(63,231,105,0.08)]'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    P95 Sync Latency
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-transform duration-200 group-hover:scale-105 ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] group-hover:border-[#3FE769]/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <Zap className="w-3 h-3" />
                    {activeDestCount} Live Syncs
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {avgLatencyMs}ms
                  </div>
                  <MicroSpark values={data.kpis?.destinations_active?.sparkline} stroke={isDark ? '#3FE769' : '#2D6A4F'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-emerald-600'}`} />
                  <span>{overallUptime} uptime · {activeDestCount} connected vaults</span>
                </p>
              </motion.div>
            </div>

            {/* 3. Streak & Momentum Rings + Daily Focus Goal (Responsive 2-Col Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              <FocusRings
                dailyFocus={data.daily_focus}
                streakMomentum={data.streak_momentum}
                isDark={isDark}
              />
              <DailyFocusCard
                dailyFocus={data.daily_focus}
                isDark={isDark}
              />
            </div>

            {/* 4. Saves per Week Area Chart (Full Width) */}
            <SavesPerWeekAreaChart
              historicalData={data.predictive_forecast?.historical_trend}
              clips={clips}
              isDark={isDark}
            />

            {/* 4.5. Content Intelligence & Intent Section: Intent Donut + 10-Axis Knowledge Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Intent Breakdown Donut (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <IntentBreakdownDonut
                  contentBreakdown={data.content_breakdown}
                  clips={clips}
                  totalCount={data.kpis?.total_clips?.value}
                  isDark={isDark}
                />
              </div>

              {/* Right: 10-Axis Knowledge Radar Polygon (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                <KnowledgeRadarChart
                  knowledgeRadar={data.knowledge_radar}
                  clips={clips}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 5. Weekday Rhythm & Density Curve Split Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Average Clips by Weekday (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                <WeekdayBarChart
                  weekdayRhythm={data.weekday_rhythm}
                  isDark={isDark}
                />
              </div>

              {/* Right: Density & Rhythm Card (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <DensityAndRhythm
                  historicalData={data.predictive_forecast?.historical_trend}
                  weekdayRhythm={data.weekday_rhythm}
                  clips={clips}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 6. Content Types & Subject Specialty Breakdown (Donut + Pills) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Content Type Donut (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <ContentTypeDonut
                  contentBreakdown={data.content_breakdown}
                  clips={clips}
                  totalCount={data.kpis?.total_clips?.value}
                  isDark={isDark}
                />
              </div>

              {/* Right: Subject Specialty & Focus Distribution Pills (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                <FocusDistributionCard
                  knowledgeRadar={data.knowledge_radar}
                  clips={clips}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 7. Stitch Opportunity Outcomes Funnel */}
            <OpportunityOutcomesFunnel
              funnelData={data.opportunity_funnel}
              money={data.money}
              clips={clips}
              isDark={isDark}
            />

            {/* 7.5. Gamification Badges Grid & Personal Records Milestone Summary */}
            <AchievementsGrid
              badges={data.gamification?.badges}
              personalBests={data.gamification?.personal_bests}
              clips={clips}
              isDark={isDark}
            />

            {/* Part 6: Lower OLAP Grid (Stitch 5-col / 7-col Split: Capture Heatmap & Top Knowledge Sources) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Capture Heatmap (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <CaptureHeatmapCard
                  days={data.contribution_matrix?.days}
                  clips={clips}
                  currentStreak={data.streak_momentum?.current_streak_days ?? (totalClips > 0 ? 1 : 0)}
                  longestStreak={data.contribution_matrix?.longest_streak ?? (totalClips > 0 ? 1 : 0)}
                  isDark={isDark}
                />
              </div>

              {/* Right: Top Knowledge Sources Table (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                <TopKnowledgeSourcesTable
                  destinations={data.destinations_health?.destinations}
                  sources={data.top_sources}
                  clips={clips}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 8. Predictive AI Trajectory & Opportunity Signals */}
            <PredictiveForecast
              forecastData={data.predictive_forecast}
              clips={clips}
              isDark={isDark}
            />
          </>
        )}
      </div>
    </div>
  );
};
