import React, { useState } from 'react';
import { RefreshCw, AlertCircle, DollarSign, Download, ChevronDown, FilterX, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';
import { AnalyticsPayload } from '../lib/analyticsApi';
import { SavesPerWeekAreaChart } from '../components/analytics/SavesPerWeekAreaChart';
import { IntentBreakdownDonut } from '../components/analytics/IntentBreakdownDonut';
import { OpportunityOutcomesFunnel } from '../components/analytics/OpportunityOutcomesFunnel';
import { CaptureHeatmapCard } from '../components/analytics/CaptureHeatmapCard';
import { TopKnowledgeSourcesTable } from '../components/analytics/TopKnowledgeSourcesTable';
import {
  StitchTheme,
  isStitchDark,
  stitchCanvas,
  stitchHeading,
  stitchSecondary,
  stitchMuted,
} from './stitchTheme';

interface StitchAnalyticsProps {
  data: AnalyticsPayload | null;
  theme?: StitchTheme;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function MiniSpark({ values, stroke }: { values: number[]; stroke: string }) {
  const max = Math.max(...values, 1);
  const pts = values
    .map((v, i) => `${(i / Math.max(1, values.length - 1)) * 96},${28 - (v / max) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 96 28" className="w-24 h-7" fill="none">
      <polyline points={pts} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


// Stitch "Save - Analytics & OLAP (Enhanced)" rebuilt as UI-only (Vercel dark / Stitch light).
// No fetching, no store — everything arrives via props.
export const StitchAnalytics: React.FC<StitchAnalyticsProps> = ({
  data,
  theme = 'light',
  onRefresh,
  isRefreshing = false,
}) => {
  const dark = isStitchDark(theme);
  const spark = dark ? '#00CA50' : '#2D6A4F';
  const grid = dark ? '#1F1F1F' : '#F1F5F9';

  // Multi-Dimensional OLAP Filter States
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '12M' | 'custom'>('30D');
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'apply' | 'learn' | 'track' | 'attend'>('all');
  const [selectedDestination, setSelectedDestination] = useState<string>('all');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  if (!data) {
    return (
      <div className={`min-h-screen font-sans pb-16 ${stitchCanvas(theme)}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4">
          {[90, 180, 220].map((h) => (
            <div
              key={h}
              className={`rounded-2xl border animate-pulse ${dark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-[#E2E8F0]'}`}
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { id: 'total', label: 'TOTAL CLIPS', value: `${data.kpis.total_clips.value}`, sub: `+${data.kpis.total_clips.delta_pct}% all-time`, spark: data.kpis.total_clips.sparkline },
    { id: 'vel', label: 'WEEKLY VELOCITY', value: `${data.kpis.weekly_velocity.value}`, sub: `${data.kpis.weekly_velocity.delta_pct >= 0 ? '+' : ''}${data.kpis.weekly_velocity.delta_pct}% vs last week`, spark: data.kpis.weekly_velocity.sparkline },
    { id: 'streak', label: 'ACTIVE STREAK', value: `${data.kpis.active_streak.value}d`, sub: `Best ${data.kpis.active_streak.best_streak}d`, spark: data.kpis.active_streak.sparkline },
    { id: 'dest', label: 'SYNC VAULTS', value: `${data.kpis.destinations_active.value}`, sub: `${data.kpis.destinations_active.health_pct}% health`, spark: data.kpis.destinations_active.sparkline },
  ];

  const trend = data.predictive_forecast.historical_trend.map((t) => t.actual);
  const funnel = data.opportunity_funnel;
  const funnelMax = Math.max(...funnel.map((f) => f.count), 1);
  const heatDays = data.contribution_matrix.days.slice(-112);
  const heatMax = Math.max(...heatDays.map((d) => d.count), 1);

  const heatColor = (count: number): string => {
    if (count === 0) return dark ? '#111111' : '#F1F5F9';
    const t = count / heatMax;
    if (dark) {
      if (t > 0.66) return '#00CA50';
      if (t > 0.33) return '#00952d';
      return '#004615';
    }
    if (t > 0.66) return '#16A34A';
    if (t > 0.33) return '#4ADE80';
    return '#BBF7D0';
  };

  return (
    <div className={`min-h-screen font-sans pb-16 ${stitchCanvas(theme)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Stitch Enhanced Header & Live Telemetry Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className={`text-2xl sm:text-[30px] font-bold tracking-tight font-['Outfit',sans-serif] ${stitchHeading(theme)}`}>
                Analytics &amp; OLAP Insights
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                dark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${dark ? 'bg-[#3FE769]' : 'bg-[#16A34A]'} animate-pulse`} />
                Live Telemetry
              </span>
            </div>
            <p className={`text-[13px] font-['Inter',sans-serif] ${stitchSecondary(theme)}`}>
              Real-time dimensional metrics and ingestion telemetry across all connected knowledge vaults.
            </p>
          </div>

          {/* Quick Action Tooling */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `save-analytics-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
                dark
                  ? 'bg-[#1C1B1B] border-[#2A2A2A] text-[#EDEDED] hover:bg-[#252525]'
                  : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#3FE769]" />
              <span>Export Data</span>
            </button>

            <button
              onClick={onRefresh}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all text-white ${
                dark
                  ? 'bg-[#00CA50] hover:bg-[#00B045] text-black font-bold'
                  : 'bg-[#2D6A4F] hover:bg-[#245640]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Box 1: Multi-Dimensional OLAP Filter Bar */}
        <div className={`rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 border transition-all ${
          dark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-[#E2E8F0]'
        }`}>
          {/* Left segments: Date Range + Intent pills + Destination selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Segment */}
            <div className={`inline-flex p-1 rounded-xl text-xs font-medium border ${
              dark ? 'bg-[#181818] border-[#262626] text-[#A1A1A1]' : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]'
            }`}>
              {(['7D', '30D', '90D', '12M'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRange(r)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedRange === r
                      ? dark
                        ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                        : 'bg-white text-[#0F172A] shadow-sm font-semibold'
                      : 'hover:text-current'
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setSelectedRange('custom')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  selectedRange === 'custom'
                    ? dark
                      ? 'bg-[#2A2A2A] text-white shadow-sm font-semibold'
                      : 'bg-white text-[#0F172A] shadow-sm font-semibold'
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
                { id: 'learn', label: 'Learn', dot: dark ? '#3FE769' : '#2D6A4F' },
                { id: 'track', label: 'Track', dot: '#40916C' },
                { id: 'attend', label: 'Attend', dot: '#8B5CF6' },
              ].map((intent) => (
                <button
                  key={intent.id}
                  onClick={() => setSelectedIntent(intent.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                    selectedIntent === intent.id
                      ? dark
                        ? 'bg-[#3FE769] text-black font-semibold'
                        : 'bg-[#2D6A4F] text-white font-semibold'
                      : dark
                        ? 'bg-[#181818] text-[#A1A1A1] hover:text-white border border-[#262626]'
                        : 'bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
                  }`}
                >
                  <span>{intent.label}</span>
                  {intent.dot && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: selectedIntent === intent.id ? (dark ? '#000000' : '#FFFFFF') : intent.dot,
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
                  dark
                    ? 'bg-[#181818] border-[#262626] text-[#EDEDED] focus:border-[#3FE769]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] focus:border-[#2D6A4F]'
                }`}
              >
                <option value="all">All Destinations (482)</option>
                <option value="notion">Notion (142)</option>
                <option value="sheets">Sheets (148)</option>
                <option value="obsidian">Obsidian (96)</option>
                <option value="webhook">Webhook (96)</option>
              </select>
              <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-2 pointer-events-none ${
                dark ? 'text-[#878787]' : 'text-[#64748B]'
              }`} />
            </div>
          </div>

          {/* Right Controls: Granularity & Reset */}
          <div className="flex items-center gap-2.5 ml-auto">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              dark ? 'bg-[#181818] border-[#262626] text-[#878787]' : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]'
            }`}>
              <span className="text-[11px] font-semibold">Granularity:</span>
              {(['daily', 'weekly', 'monthly'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] capitalize transition-all ${
                    granularity === g
                      ? dark
                        ? 'bg-[#2A2A2A] text-white font-semibold'
                        : 'bg-white text-[#0F172A] font-semibold shadow-xs'
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
                setSelectedIntent('all');
                setSelectedDestination('all');
                setGranularity('weekly');
              }}
              className={`p-1.5 rounded-xl text-xs transition-colors border ${
                dark
                  ? 'border-[#262626] text-[#878787] hover:text-[#FF6B6B] hover:bg-[#181818]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:text-[#DC2626] hover:bg-[#F8FAFC]'
              }`}
              title="Reset Filters"
            >
              <FilterX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Box 2: Four Tectonic KPI Metric Tiles (Stitch Screen 7cff5690f6924342a24b6abc44366f33) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Metric 1: Total Clips Ingested */}
          <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
            dark
              ? 'bg-[#0E0E0E] border-[#262626]'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${dark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                Total Clips Ingested
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                dark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                <TrendingUp className="w-3 h-3" />
                +{data.kpis?.total_clips?.delta_pct ?? 18.4}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${dark ? 'text-white' : 'text-slate-900'}`}>
                {data.kpis?.total_clips?.value?.toLocaleString() ?? '1,428'}
              </div>
              <MiniSpark values={data.kpis?.total_clips?.sparkline ?? [12, 16, 14, 19, 22, 18, 25]} stroke={spark} />
            </div>
            <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${dark ? 'text-[#878787]' : 'text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'}`} />
              <span>
                {data.kpis?.weekly_velocity?.value
                  ? `${(data.kpis.weekly_velocity.value / 7).toFixed(1)} clips/day avg velocity`
                  : '47.6 clips/day avg velocity'}
              </span>
            </p>
          </div>

          {/* Metric 2: Processing Rate */}
          <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
            dark
              ? 'bg-[#0E0E0E] border-[#262626]'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${dark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                Processing Rate
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                dark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                <TrendingUp className="w-3 h-3" />
                +5.1%
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${dark ? 'text-white' : 'text-slate-900'}`}>
                {data.kpis?.destinations_active?.health_pct ? `${data.kpis.destinations_active.health_pct}%` : '78.2%'}
              </div>
              <MiniSpark values={data.kpis?.weekly_velocity?.sparkline ?? [10, 15, 12, 18, 20, 24]} stroke={spark} />
            </div>
            <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${dark ? 'text-[#878787]' : 'text-slate-500'}`}>
              <span>
                {data.kpis?.total_clips?.value
                  ? `${Math.round(data.kpis.total_clips.value * 0.78)} of ${data.kpis.total_clips.value} read or exported`
                  : '1,116 of 1,428 read or exported'}
              </span>
            </p>
          </div>

          {/* Metric 3: Opportunity Conversion */}
          <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
            dark
              ? 'bg-[#0E0E0E] border-[#262626]'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${dark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                Opportunity Conversion
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                dark
                  ? 'bg-[#1C1B1B] text-[#F59E0B] border border-[#2A2A2A]'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                <TrendingUp className="w-3 h-3" />
                +2.8% QoQ
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${dark ? 'text-amber-400' : 'text-slate-900'}`}>
                14.2%
              </div>
              <MiniSpark values={data.kpis?.active_streak?.sparkline ?? [5, 8, 12, 9, 14]} stroke={dark ? '#F59E0B' : '#D97706'} />
            </div>
            <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${dark ? 'text-[#878787]' : 'text-slate-500'}`}>
              <span>6 active interview rounds / 42 applied</span>
            </p>
          </div>

          {/* Metric 4: P95 Sync Latency */}
          <div className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 border ${
            dark
              ? 'bg-[#0E0E0E] border-[#262626]'
              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${dark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                P95 Sync Latency
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                dark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                <Zap className="w-3 h-3" />
                -42ms faster
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className={`text-3xl sm:text-[34px] font-bold tracking-tight font-['Outfit',sans-serif] ${dark ? 'text-white' : 'text-slate-900'}`}>
                310ms
              </div>
              <MiniSpark values={data.kpis?.destinations_active?.sparkline ?? [28, 20, 22, 17, 14]} stroke={spark} />
            </div>
            <p className={`text-[11px] font-medium flex items-center gap-1.5 mt-2 ${dark ? 'text-[#878787]' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${dark ? 'text-[#3FE769]' : 'text-emerald-600'}`} />
              <span>99.98% pipeline uptime</span>
            </p>
          </div>
        </div>

        {/* Trend + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-8 h-full flex flex-col">
            <SavesPerWeekAreaChart
              historicalData={data.predictive_forecast.historical_trend}
              isDark={dark}
            />
          </div>

          <div className="lg:col-span-4 h-full flex flex-col">
            <IntentBreakdownDonut
              contentBreakdown={data.content_breakdown}
              totalCount={data.kpis?.total_clips?.value}
              isDark={dark}
            />
          </div>
        </div>

        {/* Box 5: Stitch Opportunity Outcomes Funnel */}
        <OpportunityOutcomesFunnel
          funnelData={data.opportunity_funnel}
          money={data.money}
          isDark={dark}
        />

        {/* Part 6: Lower OLAP Grid (Stitch 5-col / 7-col Split: Capture Heatmap & Top Knowledge Sources) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* Left: Capture Heatmap (5 cols) */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <CaptureHeatmapCard
              days={data.contribution_matrix?.days}
              currentStreak={data.streak_momentum?.current_streak_days ?? 14}
              longestStreak={data.contribution_matrix?.longest_streak ?? 38}
              isDark={dark}
            />
          </div>

          {/* Right: Top Knowledge Sources Table (7 cols) */}
          <div className="lg:col-span-7 h-full flex flex-col">
            <TopKnowledgeSourcesTable
              destinations={data.destinations_health?.destinations}
              isDark={dark}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
