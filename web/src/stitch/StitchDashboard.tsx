import React from 'react';
import { Bookmark, Clock, Flame, Radio, Plus } from 'lucide-react';
import { ClipItem, DestinationConfig, JobCard } from '../types';
import { MoneySummary } from '../lib/analyticsApi';
import { StitchCard, StitchSectionLabel } from './StitchCard';
import {
  StitchTheme,
  isStitchDark,
  stitchCanvas,
  stitchHeading,
  stitchSecondary,
  stitchMuted,
  stitchPrimaryButton,
  stitchMintBadge,
  stitchMetaChip,
  stitchInner,
} from './stitchTheme';

export interface StitchDeadline {
  title: string;
  meta: string;
  badge: string;
  urgent?: boolean;
}

export interface StitchIntentSlice {
  label: string;
  pct: number;
  colorLight: string;
  colorDark: string;
}

interface StitchDashboardProps {
  clips: ClipItem[];
  destinations: DestinationConfig[];
  theme?: StitchTheme;
  userName?: string;
  money?: MoneySummary;
  jobs?: JobCard[];
  deadlines?: StitchDeadline[];
  intentBreakdown?: StitchIntentSlice[];
  onSaveClip?: () => void;
}

const DEFAULT_INTENT: StitchIntentSlice[] = [
  { label: 'Learn', pct: 50, colorLight: '#2D6A4F', colorDark: '#00CA50' },
  { label: 'Apply', pct: 22, colorLight: '#3B82F6', colorDark: '#3B82F6' },
  { label: 'Track', pct: 12, colorLight: '#F59E0B', colorDark: '#F59E0B' },
  { label: 'Hire', pct: 9, colorLight: '#8B5CF6', colorDark: '#8B5CF6' },
  { label: 'Rest', pct: 7, colorLight: '#CBD5E1', colorDark: '#525252' },
];

const DEFAULT_DEADLINES: StitchDeadline[] = [
  { title: 'NSF SIBR Phase I', meta: '3 days left', badge: '3 days', urgent: true },
  { title: 'Qiskit Hackathon Finals', meta: '5 days left', badge: '5 days' },
  { title: 'VC W25 Early Batch', meta: '9 days left', badge: '9 days' },
];

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function Sparkline({ points, stroke }: { points: string; stroke: string }) {
  return (
    <svg viewBox="0 0 96 28" className="w-24 h-7" fill="none">
      <polyline points={points} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IntentDonut({
  total,
  slices,
  dark,
}: {
  total: number;
  slices: StitchIntentSlice[];
  dark: boolean;
}) {
  const R = 44;
  const C = 2 * Math.PI * R;
  let offset = 25;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 112 112" className="w-28 h-28 -rotate-90">
          <circle cx="56" cy="56" r={R} fill="none" stroke={dark ? '#262626' : '#F1F5F9'} strokeWidth="14" />
          {slices.map((s) => {
            const len = (s.pct / 100) * C;
            const el = (
              <circle
                key={s.label}
                cx="56"
                cy="56"
                r={R}
                fill="none"
                stroke={dark ? s.colorDark : s.colorLight}
                strokeWidth="14"
                strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold font-sans ${dark ? 'text-[#EDEDED]' : 'text-[#0F172A]'}`}>
            {total}
          </span>
          <span className={`text-[9px] font-sans font-bold tracking-wider ${dark ? 'text-[#878787]' : 'text-[#64748B]'}`}>
            TOTAL
          </span>
        </div>
      </div>
      <div className="space-y-1.5 min-w-0">
        {slices.slice(0, 4).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs font-sans">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: dark ? s.colorDark : s.colorLight }}
            />
            <span className={dark ? 'text-[#A1A1A1]' : 'text-[#475569]'}>{s.label}</span>
            <span className={`ml-auto font-semibold ${dark ? 'text-[#EDEDED]' : 'text-[#0F172A]'}`}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stitch "Save - Home Dashboard (Modern)" rebuilt as UI-only.
// No fetching, no store — everything arrives via props.
export const StitchDashboard: React.FC<StitchDashboardProps> = ({
  clips,
  destinations,
  theme = 'light',
  userName = 'Alex',
  money,
  jobs = [],
  deadlines = DEFAULT_DEADLINES,
  intentBreakdown = DEFAULT_INTENT,
  onSaveClip,
}) => {
  const dark = isStitchDark(theme);
  const totalClips = clips.length;
  const liveSyncs = destinations.filter((d) => d.connected).length || 4;
  const expiring = jobs.filter((j) => j.status === 'saved').length || 2;
  const weekly = money ? Math.round(money.time_saved_hours * 1.3) : 24;
  const recent = clips.slice(0, 5);
  const spark = dark ? '#00CA50' : '#2D6A4F';

  const stats = [
    { id: 'total', label: 'TOTAL CLIPS', value: `${totalClips}`, sub: `${totalClips} all-time`, icon: Bookmark, spark: '4,9 22,6 40,10 58,5 76,8 92,4' },
    { id: 'exp', label: 'APPLY DEADLINE', value: `${expiring} Expiring`, sub: 'Act within 5 days', icon: Clock, spark: '4,20 22,14 40,17 58,10 76,12 92,7' },
    { id: 'learn', label: 'LEARN BACKLOG', value: `${weekly} Clips`, sub: '+34% momentum', icon: Flame, spark: '4,18 22,12 40,15 58,8 76,10 92,5' },
    { id: 'live', label: 'ACTIVE SYNCS', value: `${liveSyncs} Live`, sub: 'All engines nominal', icon: Radio, spark: '4,10 22,14 40,9 58,13 76,8 92,11' },
  ];

  return (
    <div className={`min-h-screen font-sans pb-16 ${stitchCanvas(theme)}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-5">
        {/* Greeting hero */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className={`text-2xl sm:text-[32px] font-bold tracking-tight ${stitchHeading(theme)}`}>
              Good morning, {userName}
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-sans rounded-full px-2.5 py-1 ${stitchMintBadge(theme)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-[#00CA50]' : 'bg-[#166534]'}`} />
                {totalClips} clips synchronized · All engines nominal
              </span>
            </div>
          </div>
          <button
            onClick={onSaveClip}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-all ${stitchPrimaryButton(theme)}`}
          >
            <Plus className="w-4 h-4" />
            Save Clip
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StitchCard key={s.id} theme={theme} className="!p-4">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-sans font-bold tracking-wider ${stitchMuted(theme)}`}>
                  {s.label}
                </span>
                <s.icon className={`w-4 h-4 ${dark ? 'text-[#A1A1A1]' : 'text-[#64748B]'}`} />
              </div>
              <div className={`text-2xl font-bold tracking-tight mt-1 ${stitchHeading(theme)}`}>{s.value}</div>
              <div className="flex items-end justify-between gap-2 mt-1">
                <span className={`text-[11px] font-sans ${stitchSecondary(theme)}`}>{s.sub}</span>
                <Sparkline points={s.spark} stroke={spark} />
              </div>
            </StitchCard>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Apply', 'Learn', 'Buy', 'Attend', 'Hire', 'Track'].map((f, i) => (
            <span
              key={f}
              className={`shrink-0 text-[11px] font-sans font-semibold rounded-full px-3 py-1.5 border ${
                i === 0
                  ? dark
                    ? 'bg-[#EDEDED] text-black border-[#EDEDED]'
                    : 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : dark
                    ? 'bg-transparent text-[#A1A1A1] border-[#262626]'
                    : 'bg-white text-[#475569] border-[#E2E8F0]'
              }`}
            >
              {f}
            </span>
          ))}
          <span className={`ml-auto shrink-0 text-[11px] font-sans ${stitchMuted(theme)}`}>
            {totalClips} clips · Newest First
          </span>
        </div>

        {/* Feed + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-3">
            <StitchSectionLabel theme={theme}>Recent Clips</StitchSectionLabel>
            {recent.length === 0 && (
              <StitchCard theme={theme}>
                <p className={`text-sm font-sans ${stitchSecondary(theme)}`}>
                  No clips yet — saved items will appear here.
                </p>
              </StitchCard>
            )}
            {recent.map((clip) => (
              <StitchCard key={clip.id} theme={theme} className="!p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-sans ${
                      dark ? 'bg-[#111111] text-[#00CA50]' : 'bg-[#DCFCE7] text-[#166534]'
                    }`}
                  >
                    {domainOf(clip.url).charAt(0).toUpperCase()}
                  </span>
                  <span className={`text-[11px] font-mono ${stitchMuted(theme)}`}>
                    {domainOf(clip.url)} · {timeAgo(clip.createdAt)}
                  </span>
                </div>
                <h3 className={`text-[15px] font-semibold font-sans leading-snug mt-1.5 ${stitchHeading(theme)}`}>
                  {clip.title}
                </h3>
                <p className={`text-[13px] font-sans leading-relaxed mt-1 line-clamp-2 ${stitchSecondary(theme)}`}>
                  {clip.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {clip.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className={`text-[11px] font-sans font-medium rounded-full px-2.5 py-0.5 ${stitchMintBadge(theme)}`}
                    >
                      {t}
                    </span>
                  ))}
                  <span className={`text-[11px] font-sans rounded-full px-2.5 py-0.5 ${stitchMetaChip(theme)}`}>
                    {clip.type}
                  </span>
                </div>
              </StitchCard>
            ))}
          </div>

          <div className="space-y-4">
            <StitchCard theme={theme}>
              <div className="flex items-center justify-between mb-3">
                <StitchSectionLabel theme={theme}>Intent Distribution</StitchSectionLabel>
                <span className={`text-[10px] font-sans ${stitchMuted(theme)}`}>{totalClips} total</span>
              </div>
              <IntentDonut total={totalClips} slices={intentBreakdown} dark={dark} />
            </StitchCard>

            <StitchCard theme={theme}>
              <StitchSectionLabel theme={theme}>Urgent Deadlines</StitchSectionLabel>
              <div className="space-y-2.5 mt-3">
                {deadlines.map((d) => (
                  <div
                    key={d.title}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${stitchInner(theme)}`}
                  >
                    <div className="min-w-0">
                      <div className={`text-[13px] font-sans font-semibold truncate ${stitchHeading(theme)}`}>
                        {d.title}
                      </div>
                      <div className={`text-[11px] font-sans ${stitchMuted(theme)}`}>{d.meta}</div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-sans font-bold rounded-full px-2 py-0.5 ${
                        d.urgent
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : dark
                            ? 'bg-[#111111] text-[#A1A1A1] border border-[#262626]'
                            : 'bg-[#F1F5F9] text-[#475569]'
                      }`}
                    >
                      {d.badge}
                    </span>
                  </div>
                ))}
              </div>
            </StitchCard>

            <StitchCard theme={theme}>
              <StitchSectionLabel theme={theme}>Sync Stream Health</StitchSectionLabel>
              <div className="space-y-2 mt-3">
                {destinations.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        d.connected ? (dark ? 'bg-[#00CA50]' : 'bg-[#16A34A]') : 'bg-[#DC2626]'
                      }`}
                    />
                    <span className={`text-[12px] font-sans truncate ${stitchSecondary(theme)}`}>
                      {d.name}
                    </span>
                    <span className={`ml-auto text-[11px] font-sans shrink-0 ${stitchMuted(theme)}`}>
                      {d.connected ? `${d.itemsSyncedCount} synced` : 'Paused'}
                    </span>
                  </div>
                ))}
                {destinations.length === 0 && (
                  <p className={`text-[12px] font-sans ${stitchMuted(theme)}`}>No destinations connected.</p>
                )}
              </div>
            </StitchCard>
          </div>
        </div>
      </div>
    </div>
  );
};
