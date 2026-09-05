import React from 'react';
import { RefreshCw, AlertCircle, DollarSign } from 'lucide-react';
import { AnalyticsPayload } from '../lib/analyticsApi';
import { MoneyKpiStrip } from '../components/analytics/MoneyKpiStrip';
import { StitchCard, StitchSectionLabel } from './StitchCard';
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

function TrendLine({ values, stroke, grid }: { values: number[]; stroke: string; grid: string }) {
  const max = Math.max(...values, 1);
  const stepX = 560 / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${i * stepX},${150 - (v / max) * 130}`);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  return (
    <svg viewBox="0 0 560 160" className="w-full h-40" fill="none" preserveAspectRatio="none">
      {[30, 70, 110, 150].map((y) => (
        <line key={y} x1="0" y1={y} x2="560" y2={y} stroke={grid} strokeWidth="1" />
      ))}
      <path d={line} stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Stitch "Save - Analytics & OLAP" rebuilt as UI-only (Vercel dark / Stitch light).
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

  const R = 44;
  const C = 2 * Math.PI * R;
  let donutOffset = 25;

  return (
    <div className={`min-h-screen font-sans pb-16 ${stitchCanvas(theme)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={`text-2xl sm:text-[28px] font-bold tracking-tight ${stitchHeading(theme)}`}>
              Analytics & OLAP Insights
            </h1>
            <p className={`text-[13px] font-sans mt-0.5 ${stitchSecondary(theme)}`}>
              Real-time dimensional metrics across all connected knowledge vaults
            </p>
          </div>
          <button
            onClick={onRefresh}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-sans font-bold transition-all ${
              dark ? 'bg-[#EDEDED] text-black' : 'bg-[#2D6A4F] text-white hover:bg-[#245640]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'SYNCING...' : 'REFRESH'}
          </button>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <StitchCard key={k.id} theme={theme} className="!p-4">
              <div className={`text-[10px] font-sans font-bold tracking-wider ${stitchMuted(theme)}`}>
                {k.label}
              </div>
              <div className={`text-2xl font-bold tracking-tight mt-1 ${stitchHeading(theme)}`}>
                {k.value}
              </div>
              <div className="flex items-end justify-between gap-2 mt-1">
                <span className={`text-[11px] font-sans ${dark ? 'text-[#00CA50]' : 'text-[#166534]'}`}>
                  {k.sub}
                </span>
                <MiniSpark values={k.spark} stroke={spark} />
              </div>
            </StitchCard>
          ))}
        </div>

        {/* Real backend money */}
        <MoneyKpiStrip money={data.money} isDark={dark} />

        {/* Trend + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StitchCard theme={theme}>
            <StitchSectionLabel theme={theme}>Saves per Week by Intent</StitchSectionLabel>
            <div className="mt-3">
              <TrendLine values={trend} stroke={spark} grid={grid} />
            </div>
            <div className={`flex justify-between text-[10px] font-sans mt-1 ${stitchMuted(theme)}`}>
              <span>{data.predictive_forecast.historical_trend[0]?.date}</span>
              <span>{data.predictive_forecast.historical_trend[data.predictive_forecast.historical_trend.length - 1]?.date} (Peak)</span>
            </div>
          </StitchCard>

          <StitchCard theme={theme}>
            <StitchSectionLabel theme={theme}>Intent Breakdown</StitchSectionLabel>
            <div className="flex items-center gap-4 mt-3">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 112 112" className="w-28 h-28 -rotate-90">
                  <circle cx="56" cy="56" r={R} fill="none" stroke={dark ? '#262626' : '#F1F5F9'} strokeWidth="14" />
                  {data.content_breakdown.map((c) => {
                    const len = (c.percentage / 100) * C;
                    const el = (
                      <circle
                        key={c.type}
                        cx="56"
                        cy="56"
                        r={R}
                        fill="none"
                        stroke={c.color}
                        strokeWidth="14"
                        strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`}
                        strokeDashoffset={-donutOffset}
                      />
                    );
                    donutOffset += len;
                    return el;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-xl font-bold font-sans ${stitchHeading(theme)}`}>
                    {data.content_breakdown.reduce((a, c) => a + c.count, 0)}
                  </span>
                  <span className={`text-[9px] font-sans font-bold tracking-wider ${stitchMuted(theme)}`}>
                    TOTAL
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                {data.content_breakdown.slice(0, 5).map((c) => (
                  <div key={c.type} className="flex items-center gap-2 text-xs font-sans">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className={`truncate ${stitchSecondary(theme)}`}>{c.name}</span>
                    <span className={`ml-auto font-semibold shrink-0 ${stitchHeading(theme)}`}>
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </StitchCard>
        </div>

        {/* Heatmap + sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StitchCard theme={theme}>
            <div className="flex items-center justify-between">
              <StitchSectionLabel theme={theme}>Capture Heatmap</StitchSectionLabel>
              <span className={`text-[10px] font-sans ${stitchMuted(theme)}`}>
                {data.contribution_matrix.total_active_days} active days
              </span>
            </div>
            <div className="grid grid-cols-16 gap-1 mt-3" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
              {heatDays.map((d) => (
                <span
                  key={d.date}
                  title={`${d.date}: ${d.count}`}
                  className="aspect-square rounded-[3px]"
                  style={{ background: heatColor(d.count) }}
                />
              ))}
            </div>
          </StitchCard>

          <StitchCard theme={theme}>
            <StitchSectionLabel theme={theme}>Top Knowledge Sources</StitchSectionLabel>
            <div className="space-y-2 mt-3">
              {data.destinations_health.destinations.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${d.is_active ? (dark ? 'bg-[#00CA50]' : 'bg-[#16A34A]') : 'bg-[#DC2626]'}`}
                  />
                  <span className={`text-[12px] font-sans truncate ${stitchSecondary(theme)}`}>{d.name}</span>
                  <span className={`ml-auto text-[11px] font-mono shrink-0 ${stitchMuted(theme)}`}>
                    {d.uptime} · {d.latency_ms}ms
                  </span>
                </div>
              ))}
            </div>
          </StitchCard>
        </div>

        {/* Funnel + money outcomes */}
        <StitchCard theme={theme}>
          <StitchSectionLabel theme={theme}>Opportunity Outcomes</StitchSectionLabel>
          <div className="space-y-2.5 mt-3">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-3">
                <div
                  className={`flex-1 h-9 rounded-xl overflow-hidden flex items-center ${
                    dark ? 'bg-[#111111]' : 'bg-[#F1F5F9]'
                  }`}
                >
                  <div
                    className="h-full rounded-xl flex items-center px-3"
                    style={{
                      width: `${Math.max(12, Math.min(100, f.conversion_pct))}%`,
                      background: dark ? '#00CA50' : '#2D6A4F',
                    }}
                  >
                    <span className="text-xs font-bold text-white font-sans whitespace-nowrap">
                      {f.stage} — {f.count}
                    </span>
                  </div>
                </div>
                <span className={`w-12 text-right text-xs font-mono font-bold ${dark ? 'text-[#00CA50]' : 'text-[#166534]'}`}>
                  {Math.round(f.conversion_pct)}%
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/70 flex items-start gap-2.5 mt-4">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-rose-900 font-sans">
                {data.money.missed_deadlines_count} Opportunities Expired Unactioned
              </h5>
              <p className="text-[11px] text-rose-700 font-sans mt-0.5">
                Jobs, events, and scholarships passed deadlines recently. Act earlier to secure slots!
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/70 flex items-center justify-between mt-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-800" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-emerald-800 tracking-wider">
                  Opportunity Value Captured
                </span>
                <div className="text-sm font-bold text-emerald-950 font-sans">
                  {data.money.realized_value_index} · {data.money.time_saved_hours}h saved
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              ${data.money.saved_dollar_value.toLocaleString()} TOTAL
            </span>
          </div>
        </StitchCard>
      </div>
    </div>
  );
};
