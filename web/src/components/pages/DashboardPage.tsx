import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Star,
  Copy,
  Check,
  X,
  ExternalLink,
  MoreHorizontal,
  Clock,
  Flame,
  Radio,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowUpDown,
  LayoutGrid,
  List,
  ListFilter,
  TrendingUp,
  CalendarDays,
  GraduationCap,
  Network,
  AlarmClock,
  Link2,
  FileText,
  Eye,
} from 'lucide-react';
import {
  ClipItem,
  DestinationConfig,
  JobCard,
  ConnectionSyncLog,
} from '../../types';
import { TabType } from '../layout/Sidebar';

interface DashboardPageProps {
  clips: ClipItem[];
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
  jobs: JobCard[];
  logs: ConnectionSyncLog[];
  setActiveTab: (tab: TabType) => void;
  onOpenManualAddModal: () => void;
  onRefreshSync: () => void;
  isRefreshing?: boolean;
  toggleExtensionWidget: () => void;
  theme?: 'terminal' | 'dark' | 'light';
}

// ---------------------------------------------------------------------------
// Static copy of Stitch "Save - Home Dashboard (Premium)", transcribed from
// the exported HTML (exact tokens, copy, structure). Light only.
// Differences from the export: lucide icons instead of Material Symbols,
// recharts-free (inline SVG like the export), plus the requested middle
// "This Week" column. Wiring preserved: Save Clip modal, Sync Now,
// N keyboard shortcut, stars, filters, search, empty-state toggle.
// ---------------------------------------------------------------------------

type BadgeKind = 'LEARN' | 'APPLY' | 'TRACK' | 'HIRE';

interface StaticClip {
  id: string;
  badge: BadgeKind;
  badgeExtra?: string;
  domain: string;
  time: string;
  title: string;
  excerpt: string;
  tags: string[];
  sync: string;
  amber?: boolean;
}

const STATIC_CLIPS: StaticClip[] = [
  {
    id: 'c1',
    badge: 'LEARN',
    domain: 'twitter.com',
    time: '2h ago',
    title: 'Anthropic Claude 3.5 Sonnet Speculative Decoding & MoE Architecture Deep Dive',
    excerpt:
      'Empirical throughput metrics show 2.4x inference gain using speculative draft tokens with specialized KV-cache pruning mechanisms.',
    tags: ['#AI', '#LLMs', '#Benchmarks'],
    sync: 'Notion, Sheets',
  },
  {
    id: 'c2',
    badge: 'APPLY',
    badgeExtra: 'DUE OCT 28 (42h)',
    domain: 'grants.gov',
    time: '5h ago',
    title: 'NSF SBIR Phase I Proposal — High-Throughput Genomic Assembly ($275k Seed Grant)',
    excerpt:
      'Executive summary and preliminary technical validation sections completed. Requires letters of support and budget narrative upload.',
    tags: ['#Grants', '#DeepTech', '#BioTech'],
    sync: 'Sheets',
    amber: true,
  },
  {
    id: 'c3',
    badge: 'TRACK',
    domain: 'github.com',
    time: 'Yesterday',
    title: 'vLLM multi-lora-orchestrator release v0.6.2 with CUDA Graph Optimization',
    excerpt:
      'Hot-swapping dynamic LoRA adapters without recreating engine instances. Benchmarked at 180 tokens/sec on 8x H100 SXM nodes.',
    tags: ['#OpenSource', '#Inference', '#Rust'],
    sync: 'Obsidian',
  },
  {
    id: 'c4',
    badge: 'HIRE',
    domain: 'ycombinator.com',
    time: '2 days ago',
    title: 'YC Tech Companies 2026 Hiring & Founding Engineer Opportunities in AI Tooling',
    excerpt:
      'Curated index of 14 early-stage Series A startups building foundation model tooling, compiler infrastructure, and synthesis engines.',
    tags: ['#Career', '#Founders'],
    sync: 'Notion',
  },
  {
    id: 'c5',
    badge: 'LEARN',
    domain: 'youtube.com',
    time: '3 days ago',
    title: 'Keynote: Building Production-Grade Vector Search with HNSW and pgvector at Scale',
    excerpt:
      'Deep architectural walkthrough on partition strategies, RAM footprint optimization, and hybrid full-text indexing inside PostgreSQL 17.',
    tags: ['#Databases', '#Postgres'],
    sync: 'Notion',
  },
];

const FILTERS = [
  { label: 'All', count: 148, dot: null as string | null },
  { label: 'Apply', count: 18, dot: 'bg-amber-500' },
  { label: 'Learn', count: 74, dot: null as string | null },
  { label: 'Buy', count: 6, dot: null as string | null },
  { label: 'Attend', count: 9, dot: null as string | null },
  { label: 'Hire', count: 12, dot: null as string | null },
  { label: 'Track', count: 29, dot: null as string | null },
];

const DONUT = [
  { name: 'Learn', pct: 50, color: '#2D6A4F', dash: '119', offset: '-118.8' },
  { name: 'Track', pct: 20, color: '#40916C', dash: '47.6', offset: '-71.2' },
  { name: 'Apply', pct: 12, color: '#D97706', dash: '28.5', offset: '-42.7' },
  { name: 'Hire', pct: 8, color: '#86D7AD', dash: '19', offset: '-23.7' },
  { name: 'Attend', pct: 6, color: '#64748B', dash: '14.2', offset: '-9.5' },
  { name: 'Buy', pct: 4, color: '#CBD5E1', dash: '9.5', offset: '0' },
];

const DEADLINES = [
  {
    title: 'NSF SBIR Phase I',
    badge: '2 days (Oct 28)',
    sub: 'Review final indirect cost calculations',
    dot: 'bg-[#EA580C]',
    badgeClass: 'bg-red-100 text-red-700 border-red-200/50',
  },
  {
    title: 'OpenAI Resident Researcher',
    badge: '5 days (Oct 31)',
    sub: 'Submit publications portfolio & references',
    dot: 'bg-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/50',
  },
  {
    title: 'YC W25 Early Batch',
    badge: '8 days (Nov 03)',
    sub: 'Update 1-minute founder video link',
    dot: 'bg-slate-300',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200/50',
  },
];

const SYNC_ROWS = [
  { name: 'Google Sheets', detail: '148 items synced • 280ms', time: '2m ago', live: true, delay: '' },
  { name: 'Notion Workspace', detail: '142 items synced • 310ms', time: '12m ago', live: true, delay: '0.2s' },
  { name: 'Obsidian Local Hook', detail: 'All 148 notes mirrored', time: '34m ago', live: false, delay: '' },
  { name: 'Webhook Ingestion', detail: '96 payloads delivered', time: '1h ago', live: false, delay: '' },
];

const TOP_TAGS = [
  { tag: '#LLM', count: 32 },
  { tag: '#Grants', count: 18 },
  { tag: '#Career', count: 15 },
  { tag: '#Rust', count: 12 },
];

const STREAK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const STREAK_ON = [true, true, true, true, true, false, false];

const cardClass =
  'bg-white border border-slate-200 rounded-2xl shadow-sm';

// Springy-delight motion language: weightless lifts, physical presses,
// gentle entrances. Centralized so intensity stays consistent.
const SPRING = { type: 'spring', stiffness: 380, damping: 28 } as const;
const ENTER_Y = 8;

// rAF count-up for stat figures (tabular-nums upstream prevents jitter).
function useCountUp(target: number, duration = 700) {
  const reduceMotion = useReducedMotion();
  const [val, setVal] = useState(reduceMotion ? target : 0);
  useEffect(() => {
    if (reduceMotion) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduceMotion]);
  return val;
}

function badgeClass(badge: BadgeKind, amber?: boolean): string {
  if (amber) return 'bg-amber-100 text-amber-800 border-amber-200/60';
  switch (badge) {
    case 'LEARN':
      return 'bg-[#caead6]/60 text-[#1b724f] border-[#caead6]';
    case 'APPLY':
      return 'bg-amber-100 text-amber-800 border-amber-200/60';
    case 'TRACK':
      return 'bg-slate-100 text-slate-600 border-slate-200/60';
    case 'HIRE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200/60';
  }
}

function GoalRing({ pct }: { pct: number }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] -rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke="#2D6A4F"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-[#0F172A] leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
          7/10
        </span>
      </div>
    </div>
  );
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const { onOpenManualAddModal, onRefreshSync, isRefreshing = false } = props;
  const [activeFilter, setActiveFilter] = useState('All');
  const [filterQuery, setFilterQuery] = useState('');
  const [starred, setStarred] = useState<Set<string>>(new Set(['c2']));
  const [gridView, setGridView] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [openClip, setOpenClip] = useState<StaticClip | null>(null);
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [doneDeadlines, setDoneDeadlines] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion ? { duration: 0 } : { ...SPRING };

  const totalCount = useCountUp(148);
  const expiringCount = useCountUp(2);
  const backlogCount = useCountUp(24);
  const liveCount = useCountUp(4);
  const digestCount = useCountUp(12);
  const streakCount = useCountUp(14);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (e.key === 'Escape') {
        setOpenClip(null);
        return;
      }
      if ((e.key === 'n' || e.key === 'N') && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        onOpenManualAddModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onOpenManualAddModal]);

  const toggleDone = (title: string) => {
    setDoneDeadlines((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const snoozeDeadline = (title: string) => {
    setSnoozed((prev) => ({ ...prev, [title]: ((prev[title] || 0) + 1) % 4 }));
  };

  const deadlineBadge = (d: { title: string; badge: string }) => {
    const extra = snoozed[d.title] || 0;
    return extra > 0 ? `${d.badge} +${extra * 2}d` : d.badge;
  };

  const copyClipLink = async (clip: StaticClip) => {
    try {
      await navigator.clipboard.writeText(`https://save.app/clips/${clip.id}`);
    } catch {
      /* clipboard unavailable — still confirm */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const matchesFilter = (c: StaticClip) => {
    if (activeFilter === 'All') return true;
    return c.badge === activeFilter.toUpperCase();
  };

  const matchesQuery = (c: StaticClip) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  };

  const visibleClips = showEmpty ? [] : STATIC_CLIPS.filter((c) => matchesFilter(c) && matchesQuery(c));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-14">
      <div className="w-full px-8 py-8">
        <AnimatePresence>
          {openClip && (
            <>
              <motion.div
                key="reader-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
                onClick={() => setOpenClip(null)}
                className="fixed inset-0 z-40 bg-slate-900/30"
              />
              <motion.aside
                key="reader-panel"
                initial={reduceMotion ? { opacity: 0 } : { x: '100%' }}
                animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { x: '100%' }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING }}
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col"
              >
                <div className="flex items-center gap-2 p-6 pb-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] leading-[14px] font-semibold tracking-wide ${badgeClass(
                      openClip.badge,
                      openClip.amber
                    )}`}
                  >
                    {openClip.badge}
                    {openClip.badgeExtra ? ` • ${openClip.badgeExtra}` : ''}
                  </span>
                  <button
                    onClick={() => setOpenClip(null)}
                    className="ml-auto h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                </div>
                <div className="p-6 pt-3 overflow-y-auto">
                  <div className="text-[11px] leading-[14px] text-slate-400 font-mono">
                    {openClip.domain} · {openClip.time}
                  </div>
                  <h2
                    className="text-[22px] leading-[30px] font-semibold text-slate-900 mt-2"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {openClip.title}
                  </h2>
                  <p className="text-[14px] leading-[22px] text-slate-600 mt-3">{openClip.excerpt}</p>
                  <div className="flex items-center flex-wrap gap-1.5 mt-4">
                    {openClip.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] leading-[14px]"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] leading-[14px] font-medium">
                      <RefreshCw className="w-3.5 h-3.5" />
                      {openClip.sync}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <motion.button
                      onClick={() => copyClipLink(openClip)}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      className="flex-1 h-10 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#245640] transition-colors font-medium text-[13px] leading-[20px] flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copied ? 'Link copied' : 'Copy link'}
                    </motion.button>
                    <motion.button
                      onClick={() => toggleStar(openClip.id)}
                      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-colors ${
                        starred.has(openClip.id)
                          ? 'text-amber-500 border-amber-200 bg-amber-50'
                          : 'text-slate-400 border-slate-200 hover:text-amber-500 hover:border-amber-200'
                      }`}
                      title="Star clip"
                    >
                      <Star
                        className="w-[18px] h-[18px]"
                        fill={starred.has(openClip.id) ? 'currentColor' : 'none'}
                      />
                    </motion.button>
                  </div>
                  <p className="text-[11px] leading-[14px] text-slate-400 mt-4">
                    Press Esc or click outside to close
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <div className="flex flex-col w-full gap-6">
          {/* Greeting + actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1
                  className="text-[32px] leading-[40px] tracking-[-0.02em] font-semibold text-slate-900"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Good morning, Alex
                </h1>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#a1f4c8] text-[#005236] text-[11px] leading-[14px] tracking-[0.02em] font-semibold shadow-sm border border-[#86d7ad]/30">
                  PRO VAULT
                </span>
              </div>
              <p className="text-[14px] leading-[20px] text-slate-500 flex items-center gap-3">
                <span>148 clips synchronized across 6 active streams</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium text-[13px] leading-[20px] text-slate-600 bg-slate-100 border border-slate-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  All systems nominal
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
            <motion.button
              onClick={onRefreshSync}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              className="flex items-center gap-2 px-3 h-10 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm select-none group"
            >
                <RefreshCw
                  className={`text-[18px] w-[18px] h-[18px] text-slate-500 group-hover:rotate-180 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="font-medium text-[13px] leading-[20px]">Sync Now</span>
                <span className="text-slate-400 text-[11px] leading-[14px] ml-0.5">
                  {isRefreshing ? 'Syncing...' : 'Just now'}
                </span>
              </motion.button>
            <motion.button
              onClick={onOpenManualAddModal}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              className="relative flex items-center gap-2 px-4 h-10 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#245640] transition-colors shadow-sm select-none overflow-hidden group"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-white/20"></div>
                <Plus className="text-[18px] w-[18px] h-[18px] relative z-10" />
                <span className="font-medium text-[13px] leading-[20px] tracking-wide relative z-10">
                  Save Clip
                </span>
                <kbd className="ml-1 px-1.5 py-0.5 rounded bg-black/20 text-white/90 text-[11px] leading-[14px] font-mono relative z-10 border border-white/10 shadow-inner">
                  N
                </kbd>
              </motion.button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Bookmark className="w-[18px] h-[18px] text-emerald-600" />
                  </div>
                  <span className="font-medium text-[13px] leading-[20px] text-slate-500">Total Clips</span>
                </div>
                <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] leading-[14px] font-medium border border-emerald-100">
                  <TrendingUp className="w-3 h-3" />
                  +12% mo
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span
                  className="text-[36px] leading-[44px] text-slate-900 tracking-tight font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {totalCount}
                </span>
                <svg className="w-24 h-8 text-emerald-500" fill="none" viewBox="0 0 80 28">
                  <path d="M1 22L14 19L28 23L42 14L56 16L70 6L79 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  <path d="M1 22L14 19L28 23L42 14L56 16L70 6L79 9V28H1V22Z" fill="currentColor" fillOpacity="0.1"></path>
                </svg>
              </div>
              <p className="mt-2 text-[11px] leading-[14px] text-slate-500">42 saved this week</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.03 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <CalendarDays className="w-[18px] h-[18px] text-amber-600" />
                  </div>
                  <span className="font-medium text-[13px] leading-[20px] text-slate-500">Apply Deadlines</span>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] leading-[14px] font-medium border border-amber-100">
                  &lt;48h left
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className="text-[36px] leading-[44px] text-amber-600 tracking-tight font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {expiringCount}
                </span>
                <span className="text-[15px] leading-[22px] text-slate-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Expiring
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-[14px] text-slate-500 truncate">YC W25 &amp; NSF SBIR Grant</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.06 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <GraduationCap className="w-[18px] h-[18px] text-blue-600" />
                  </div>
                  <span className="font-medium text-[13px] leading-[20px] text-slate-500">Learn Backlog</span>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-50 text-slate-600 text-[11px] leading-[14px] font-medium border border-slate-200">
                  Avg 4m read
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className="text-[36px] leading-[44px] text-slate-900 tracking-tight font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {backlogCount}
                </span>
                <span className="text-[15px] leading-[22px] text-slate-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Clips
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-[14px] text-blue-600 font-medium truncate">
                8 flagged high relevance
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.09 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Network className="w-[18px] h-[18px] text-slate-600" />
                  </div>
                  <span className="font-medium text-[13px] leading-[20px] text-slate-500">Active Syncs</span>
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className="text-[36px] leading-[44px] text-slate-900 tracking-tight font-semibold"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {liveCount}
                </span>
                <span className="text-[15px] leading-[22px] text-slate-500" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Live
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-[14px] text-slate-500 truncate">
                Notion, Sheets, Obsidian, Webhook
              </p>
            </motion.div>
          </div>

          {/* Intent tabs + filter bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
              {FILTERS.map((f) => {
                const isActive = activeFilter === f.label;
                return (
                  <motion.button
                    key={f.label}
                    onClick={() => setActiveFilter(f.label)}
                    whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                    className={`relative flex items-center gap-2 px-4 h-9 rounded-full font-medium text-[13px] leading-[20px] transition-colors shrink-0 ${
                      isActive
                        ? 'text-white'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {isActive &&
                      (reduceMotion ? (
                        <span className="absolute inset-0 bg-[#2D6A4F] rounded-full shadow-sm" />
                      ) : (
                        <motion.span
                          layoutId="filter-pill"
                          className="absolute inset-0 bg-[#2D6A4F] rounded-full shadow-sm"
                          transition={{ ...SPRING }}
                        />
                      ))}
                    {f.dot && (
                      <span className={`w-1.5 h-1.5 rounded-full relative z-10 ${f.dot}`}></span>
                    )}
                    <span className="relative z-10">{f.label}</span>
                    <span
                      className={`relative z-10 px-2 py-0.5 rounded-full text-[11px] leading-[14px] ${
                        isActive ? 'bg-white/20 text-white' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      {f.count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
              <div className="relative">
                <input
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="h-9 pl-9 pr-3 bg-white border border-slate-200 text-slate-700 text-[13px] leading-[20px] rounded-xl placeholder:text-slate-400 focus:outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/10 transition-all shadow-sm w-48"
                  placeholder="Filter current view..."
                  type="text"
                />
                <ListFilter className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="h-5 w-px bg-slate-200 mx-0.5"></div>
              <button className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-1 font-medium text-[13px] leading-[20px] transition-colors shadow-sm">
                <ArrowUpDown className="w-4 h-4" />
                <span>Newest First</span>
              </button>
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setGridView(false)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    !gridView ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView(true)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    gridView ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Core layout: feed + This Week middle + right rail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Feed */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-baseline gap-2">
                  <h2
                    className="text-[22px] leading-[28px] tracking-[-0.015em] font-semibold text-slate-900"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Recent Clips
                  </h2>
                  <span className="text-[13px] leading-[20px] text-slate-500">
                    Showing {visibleClips.length} of 148 clips
                  </span>
                </div>
                <button
                  onClick={() => setShowEmpty((v) => !v)}
                  className="text-[#2D6A4F] text-[11px] leading-[14px] font-medium hover:underline flex items-center gap-1 h-11 px-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Toggle Empty State</span>
                </button>
              </div>

              {!showEmpty && (
                <div className={`${cardClass} overflow-hidden flex flex-col`}>
                  {visibleClips.map((clip) => (
                    <article
                      key={clip.id}
                      onClick={() => setOpenClip(clip)}
                      className={`p-6 hover:bg-[#F8FAFC] transition-colors group flex flex-col sm:flex-row gap-4 justify-between items-start border-b border-slate-100 last:border-b-0 cursor-pointer ${
                        clip.amber ? 'bg-amber-50/30 hover:bg-amber-50/60' : ''
                      } ${clip.amber ? 'border-amber-100' : ''}`}
                    >
                      <div className="flex items-start gap-5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                            clip.amber
                              ? 'bg-amber-100 border-amber-200/50'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <Link2 className={`w-5 h-5 ${clip.amber ? 'text-amber-700' : 'text-slate-500'}`} />
                        </div>
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[11px] leading-[14px] font-semibold tracking-wide ${badgeClass(
                                clip.badge,
                                clip.amber
                              )}`}
                            >
                              {clip.badge}
                              {clip.badgeExtra ? ` • ${clip.badgeExtra}` : ''}
                            </span>
                            <span className="text-[11px] leading-[14px] text-slate-500 font-mono tracking-tight bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {clip.domain}
                            </span>
                            <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[11px] leading-[14px] text-slate-400">{clip.time}</span>
                          </div>
                          <span className="text-[16px] leading-[24px] font-semibold text-slate-900 hover:text-[#2D6A4F] transition-colors line-clamp-1 cursor-pointer">
                            {clip.title}
                          </span>
                          <p className="text-[14px] leading-[22px] text-slate-600 line-clamp-2 pr-4">
                            {clip.excerpt}
                          </p>
                          <div className="flex items-center flex-wrap gap-3 pt-2">
                            <div className="flex items-center gap-1.5 text-[11px] leading-[14px] text-slate-500">
                              {clip.tags.map((t) => (
                                <span key={t} className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                            <div
                              className={`flex items-center gap-1 text-[11px] leading-[14px] px-2 py-1 rounded-full ${
                                clip.amber
                                  ? 'text-amber-700 bg-amber-100/50'
                                  : 'text-emerald-600 bg-emerald-50'
                              }`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span className="font-medium">{clip.sync}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`flex sm:flex-col items-center gap-0.5 self-end sm:self-start transition-opacity ${
                          starred.has(clip.id) ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(clip.id);
                          }}
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border border-transparent transition-all ${
                            starred.has(clip.id)
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                          }`}
                          title="Bookmark"
                        >
                          <Star
                            className="w-[18px] h-[18px]"
                            fill={starred.has(clip.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyClipLink(clip);
                          }}
                          className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-[#2D6A4F] rounded-lg hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all"
                          title="Copy URL"
                        >
                          <Copy className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all"
                          title="More options"
                        >
                          <MoreHorizontal className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {showEmpty && (
                <div className={`${cardClass} p-8 flex-col items-center justify-center text-center flex`}>
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#2D6A4F] mb-4 shadow-sm">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3
                    className="text-[22px] leading-[28px] tracking-[-0.015em] font-semibold text-slate-900 mb-2"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Vault Preview Mode: Clean Slate
                  </h3>
                  <p className="text-[14px] leading-[20px] text-slate-600 max-w-md mb-6">
                    No clips in this view. Test out the starter template or sync your bookmarks directly
                    from your browser.
                  </p>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl w-full max-w-sm text-left mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[13px] leading-[20px] text-slate-900">
                        Starter: YC Application Template
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] leading-[14px] font-medium border border-emerald-200/60">
                        Ready
                      </span>
                    </div>
                    <p className="text-[11px] leading-[14px] text-slate-500 leading-relaxed">
                      Includes default rubric, evaluation criteria, and pitch deck clip markers.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onOpenManualAddModal}
                      className="px-5 h-10 rounded-xl bg-[#2D6A4F] text-white font-medium text-[13px] leading-[20px] hover:bg-[#245640] transition-colors shadow-sm"
                    >
                      Import Bookmarks
                    </button>
                    <button
                      onClick={() => setShowEmpty(false)}
                      className="px-5 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[13px] leading-[20px] transition-colors shadow-sm"
                    >
                      Return to Feed
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* This Week middle column */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="flex items-baseline gap-2 px-1">
                <h2
                  className="text-[22px] leading-[28px] tracking-[-0.015em] font-semibold text-slate-900"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  This Week
                </h2>
                <span className="text-[13px] leading-[20px] text-slate-500">Digest & goals</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={enter}
                className={`${cardClass} p-6`}
              >
                <span className="text-[11px] leading-[14px] tracking-[0.02em] font-medium text-slate-500 uppercase">
                  Week Digest
                </span>
                <div
                  className="text-[30px] leading-[38px] font-semibold text-slate-900 tracking-tight tabular-nums mt-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {digestCount} <span className="text-[14px] font-sans font-medium text-slate-500">saves</span>
                </div>
                <p className="text-[12px] leading-[18px] text-slate-500 mt-1 line-clamp-3">
                  Top story: Anthropic Claude 3.5 Sonnet Speculative Decoding. 2 opportunities
                  expiring soon.
                </p>
                <button className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#2D6A4F] hover:underline">
                  View digest
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.03 }}
                className={`${cardClass} p-6`}
              >
                <span className="text-[11px] leading-[14px] tracking-[0.02em] font-medium text-slate-500 uppercase inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
                  Save Streak
                </span>
                <div
                  className="text-[30px] leading-[38px] font-semibold text-slate-900 tracking-tight tabular-nums mt-2"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {streakCount} <span className="text-[14px] font-sans font-medium text-slate-500">days</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {STREAK_DAYS.map((d, i) => (
                    <span key={i} className="flex flex-col items-center gap-1">
                      <span
                        className={`w-4 h-4 rounded-full ${
                          STREAK_ON[i] ? 'bg-[#EA580C]' : 'bg-slate-100 border border-slate-200'
                        }`}
                      />
                      <span className="text-[8.5px] font-sans text-slate-400">{d}</span>
                    </span>
                  ))}
                  <span className="ml-auto text-[11px] font-sans text-slate-500">Best 26d</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.06 }}
                className={`${cardClass} p-6 flex items-center gap-3`}
              >
                <GoalRing pct={70} />
                <div className="min-w-0">
                  <span className="text-[11px] leading-[14px] tracking-[0.02em] font-medium text-slate-500 uppercase">
                    Daily Goal
                  </span>
                  <div className="text-[14px] font-medium text-slate-900 mt-0.5">7 of 10 today</div>
                  <div className="h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                    <div className="h-full w-[70%] rounded-full bg-[#2D6A4F]" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.09 }}
                className={`${cardClass} p-6`}
              >
                <span className="text-[11px] leading-[14px] tracking-[0.02em] font-medium text-slate-500 uppercase">
                  Top Tags
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TOP_TAGS.map((t) => (
                    <span
                      key={t.tag}
                      className="inline-flex items-center gap-1 text-[11px] leading-[14px] font-medium bg-[#DCFCE7] text-[#166534] rounded-full px-2 py-0.5"
                    >
                      {t.tag}
                      <span className="font-bold tabular-nums">{t.count}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] leading-[14px] text-slate-500 mt-2">148 clips this month</p>
              </motion.div>
            </div>

            {/* Right rail */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Intent donut */}
              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.06 }}
                className={`${cardClass} p-6 flex flex-col gap-5`}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="text-[15px] leading-[22px] font-semibold text-slate-900"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Intent Distribution
                  </h3>
                </div>
                <div className="flex items-center justify-center py-3">
                  <div className="relative w-44 h-44 flex items-center justify-center group cursor-default">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {DONUT.map((s, idx) => (
                        <circle
                          key={s.name}
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke={s.color}
                          strokeDasharray={`${s.dash} 241.4`}
                          strokeDashoffset={s.offset}
                          strokeLinecap="round"
                          strokeWidth={activeDonut === idx ? 15 : 12}
                          opacity={activeDonut === null || activeDonut === idx ? 1 : 0.3}
                          onMouseEnter={() => setActiveDonut(idx)}
                          onMouseLeave={() => setActiveDonut(null)}
                          className="transition-all duration-150 cursor-pointer"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span
                        className="text-[28px] leading-[36px] text-slate-900 tracking-tight font-semibold tabular-nums"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {activeDonut !== null ? `${DONUT[activeDonut].pct}%` : '148'}
                      </span>
                      <span className="text-[11px] leading-[14px] text-slate-500 uppercase tracking-wider font-medium mt-1">
                        {activeDonut !== null ? DONUT[activeDonut].name : 'Total'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                  {DONUT.map((d, idx) => (
                    <div
                      key={d.name}
                      onMouseEnter={() => setActiveDonut(idx)}
                      onMouseLeave={() => setActiveDonut(null)}
                      className={`flex items-center justify-between group cursor-pointer transition-opacity duration-150 ${
                        activeDonut === null || activeDonut === idx ? '' : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                          style={{ background: d.color }}
                        ></span>
                        <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">
                          {d.name}
                        </span>
                      </div>
                      <span className="text-[11px] leading-[14px] text-slate-400 font-mono">
                        {d.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Deadlines */}
              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.09 }}
                className={`${cardClass} p-6 flex flex-col gap-5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <AlarmClock className="w-4 h-4 text-[#EA580C]" />
                    </div>
                    <h3
                      className="text-[15px] leading-[22px] font-semibold text-slate-900"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Urgent Deadlines
                    </h3>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] leading-[14px] font-semibold border border-orange-200/50">
                    3 Actions
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {DEADLINES.map((d, idx) => {
                    const isDone = doneDeadlines.has(d.title);
                    return (
                      <React.Fragment key={d.title}>
                        <div className="flex gap-3 items-start group">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 shrink-0 transition-colors ${
                              isDone
                                ? 'bg-emerald-500'
                                : idx === 0
                                  ? 'bg-[#EA580C]'
                                  : idx === 1
                                    ? 'bg-amber-400'
                                    : 'bg-slate-300'
                            }`}
                          ></div>
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`font-medium text-[14px] truncate transition-colors ${
                                  isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                                }`}
                              >
                                {d.title}
                              </span>
                              {isDone ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 border bg-emerald-100 text-emerald-800 border-emerald-200/50">
                                  Done
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 border ${d.badgeClass}`}
                                >
                                  {deadlineBadge(d)}
                                </span>
                              )}
                            </div>
                            <span className="text-[13px] leading-[18px] text-slate-500">{d.sub}</span>
                            {!isDone && (
                              <span className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <button
                                  onClick={() => toggleDone(d.title)}
                                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-full px-2 py-0.5 transition-colors"
                                >
                                  Mark done
                                </button>
                                <button
                                  onClick={() => snoozeDeadline(d.title)}
                                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full px-2 py-0.5 transition-colors"
                                >
                                  Snooze
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                        {idx < DEADLINES.length - 1 && <div className="h-px bg-slate-100 ml-5"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>

              {/* Sync health */}
              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.12 }}
                className={`${cardClass} p-6 flex flex-col gap-5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3
                      className="text-[15px] leading-[22px] font-semibold text-slate-900"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      Sync Stream Health
                    </h3>
                  </div>
                  <span className="text-[12px] text-emerald-600 font-semibold tracking-wide">
                    99.98% OK
                  </span>
                </div>
                <div className="relative flex flex-col gap-4 overflow-hidden">
                  {isRefreshing && !reduceMotion && (
                    <motion.div
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent pointer-events-none"
                      animate={{ x: ['-120%', '420%'] }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    />
                  )}
                  {SYNC_ROWS.map((r) => (
                    <div key={r.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                          {r.live ? (
                            <>
                              <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                                style={r.delay ? { animationDelay: r.delay } : undefined}
                              ></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </>
                          ) : (
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
                          )}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-[14px] text-slate-900 truncate">
                            {r.name}
                          </span>
                          <span className="text-[12px] text-slate-500">{r.detail}</span>
                        </div>
                      </div>
                      <span className="text-[11px] leading-[14px] text-slate-400 font-mono group-hover:text-slate-600 transition-colors">
                        {r.time}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-2 w-full h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-[13px] flex items-center justify-center gap-2 group">
                  <span>View Connection Metrics</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
