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
    <svg viewBox="0 0 64 24" className="w-16 h-6 shrink-0" fill="none">
      <polyline points={pts} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Stitch Core Layout Components
import { SavesPerWeekAreaChart } from '../analytics/SavesPerWeekAreaChart';
import { IntentBreakdownDonut } from '../analytics/IntentBreakdownDonut';
import { OpportunityOutcomesFunnel } from '../analytics/OpportunityOutcomesFunnel';
import { CaptureHeatmapCard } from '../analytics/CaptureHeatmapCard';
import { TopKnowledgeSourcesTable } from '../analytics/TopKnowledgeSourcesTable';

interface AnalyticsPageProps {
  clips: ClipItem[];
  destinations: DestinationConfig[];
  theme?: 'terminal' | 'dark' | 'light';
  setTheme?: (theme: 'terminal' | 'dark' | 'light') => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ clips, destinations, theme = 'dark', setTheme }) => {
  const { selectedPeriod, setSelectedPeriod } = useAnalyticsStore();
  const isDark = theme === 'dark' || theme === 'terminal';

  // Multi-Dimensional OLAP Filter States
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '12M' | 'custom'>('30D');
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'apply' | 'learn' | 'track' | 'attend'>('all');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Shared query hook with 5-minute cache time (same key as DashboardPage)
  const { data, isLoading, isFetching, refetch } = useAnalyticsQuery(clips, destinations);

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

        {/* Stitch Crimson Alert Banner: Expired Opportunities */}
        <div className="bg-[#180808] border border-[#4A1111] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2D0D0D] border border-[#5C1A1A] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-rose-200 font-['Outfit',sans-serif]">
                12 Opportunities Expired Unactioned
              </h3>
              <p className="text-[11px] text-rose-400/80 font-['Inter',sans-serif] mt-0.5">
                Jobs, events, scholarships passed deadlines.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (data?.opportunity_funnel) {
                // Focus / review action
              }
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
          >
            Review
          </button>
        </div>

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
                <option value="all">All Destinations (482)</option>
                <option value="notion">Notion (142)</option>
                <option value="sheets">Sheets (148)</option>
                <option value="obsidian">Obsidian (96)</option>
                <option value="webhook">Webhook (96)</option>
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
            {/* Box 2: Four Tectonic KPI Metric Tiles (Stitch Screen 7cff5690f6924342a24b6abc44366f33) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Metric 1: Total Clips Ingested */}
              <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Total Clips Ingested
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    +{data.kpis?.total_clips?.delta_pct ?? 18.4}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              </div>

              {/* Metric 2: Processing Rate */}
              <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Processing Rate
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    +5.1%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {data.kpis?.destinations_active?.health_pct ? `${data.kpis.destinations_active.health_pct}%` : '78.2%'}
                  </div>
                  <MicroSpark values={data.kpis?.weekly_velocity?.sparkline} stroke={isDark ? '#3FE769' : '#2D6A4F'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <span>
                    {data.kpis?.total_clips?.value
                      ? `${Math.round(data.kpis.total_clips.value * 0.78)} of ${data.kpis.total_clips.value} read or exported`
                      : '1,116 of 1,428 read or exported'}
                  </span>
                </p>
              </div>

              {/* Metric 3: Opportunity Conversion */}
              <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    Opportunity Conversion
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#F59E0B] border border-[#2A2A2A]'
                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    +2.8% QoQ
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${isDark ? 'text-amber-400' : 'text-slate-900'}`}>
                    14.2%
                  </div>
                  <MicroSpark values={data.kpis?.active_streak?.sparkline} stroke={isDark ? '#F59E0B' : '#D97706'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <span>6 active interview rounds / 42 applied</span>
                </p>
              </div>

              {/* Metric 4: P95 Sync Latency */}
              <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626]'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                    P95 Sync Latency
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <Zap className="w-3 h-3" />
                    -42ms faster
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    310ms
                  </div>
                  <MicroSpark values={data.kpis?.destinations_active?.sparkline} stroke={isDark ? '#3FE769' : '#2D6A4F'} />
                </div>
                <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-emerald-600'}`} />
                  <span>99.98% pipeline uptime</span>
                </p>
              </div>
            </div>

            {/* 4. Main Charts Row (Stitch 8-col / 4-col Split: Saves per Week & Intent Breakdown) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Saves per Week by Intent (8 cols) */}
              <div className="lg:col-span-8 h-full flex flex-col">
                <SavesPerWeekAreaChart
                  historicalData={data.predictive_forecast.historical_trend}
                  isDark={isDark}
                />
              </div>

              {/* Right: Intent Breakdown Donut (4 cols) */}
              <div className="lg:col-span-4 h-full flex flex-col">
                <IntentBreakdownDonut
                  contentBreakdown={data.content_breakdown}
                  totalCount={data.kpis?.total_clips?.value}
                  isDark={isDark}
                />
              </div>
            </div>

            {/* 5. Stitch Opportunity Outcomes Funnel (Box 5) */}
            <OpportunityOutcomesFunnel
              funnelData={data.opportunity_funnel}
              money={data.money}
              isDark={isDark}
            />

            {/* Part 6: Lower OLAP Grid (Stitch 5-col / 7-col Split: Capture Heatmap & Top Knowledge Sources) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              {/* Left: Capture Heatmap (5 cols) */}
              <div className="lg:col-span-5 h-full flex flex-col">
                <CaptureHeatmapCard
                  days={data.contribution_matrix?.days}
                  currentStreak={data.streak_momentum?.current_streak_days ?? 14}
                  longestStreak={data.contribution_matrix?.longest_streak ?? 38}
                  isDark={isDark}
                />
              </div>

              {/* Right: Top Knowledge Sources Table (7 cols) */}
              <div className="lg:col-span-7 h-full flex flex-col">
                <TopKnowledgeSourcesTable
                  destinations={data.destinations_health?.destinations}
                  isDark={isDark}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
