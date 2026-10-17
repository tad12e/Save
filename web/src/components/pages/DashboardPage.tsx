import React, { useState, useEffect, useMemo } from 'react';
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
import { getClipIntent } from './ClipsPage';
import { ClipCinemaViewer } from '../cards/ClipCinemaViewer';

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
  currentUser?: { name: string; email: string } | null;
  dashboardData?: any;
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

export const FONT_GAMBETTA = "'Gambetta', 'Playfair Display', Georgia, Cambria, 'Times New Roman', Times, serif";

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

function badgeClass(badge: BadgeKind, amber?: boolean, isDark?: boolean): string {
  if (isDark) {
    if (amber) return 'bg-[#2A1715] text-[#F87171] border-[#4A1E1C]';
    switch (badge) {
      case 'LEARN':
        return 'bg-[#12231A] text-[#3FE769] border-[#1C3E2D]';
      case 'APPLY':
        return 'bg-[#2A1715] text-[#F87171] border-[#4A1E1C]';
      case 'TRACK':
        return 'bg-[#181818] text-[#A1A1A1] border-[#262626]';
      case 'HIRE':
        return 'bg-[#16221B] text-[#3FE769] border-[#23422F]';
    }
  }
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

function GoalRing({ current, target, pct, isDark }: { current: number; target: number; pct: number; isDark?: boolean }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="w-[72px] h-[72px] -rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" stroke={isDark ? '#262626' : '#E2E8F0'} strokeWidth="8" />
        <circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke={isDark ? '#3FE769' : '#2D6A4F'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * C} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-[15px] font-bold leading-none ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
          style={{ fontFamily: FONT_GAMBETTA }}
        >
          {current}/{target}
        </span>
      </div>
    </div>
  );
}

function mapClipToStaticClip(c: ClipItem): StaticClip {
  const intent = getClipIntent(c);
  let badge: BadgeKind = 'LEARN';
  if (intent === 'apply' || intent === 'attend') badge = 'APPLY';
  else if (intent === 'hire') badge = 'HIRE';
  else if (intent === 'track' || intent === 'buy') badge = 'TRACK';
  else badge = 'LEARN';

  let domain = 'web';
  try {
    if (c.url) {
      domain = new URL(c.url).hostname.replace(/^www\./, '');
    }
  } catch {
    domain = 'web';
  }

  let timeStr = 'Recently';
  if (c.createdAt) {
    const diffHours = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) timeStr = 'Just now';
    else if (diffHours < 24) timeStr = `${Math.floor(diffHours)}h ago`;
    else if (diffHours < 48) timeStr = 'Yesterday';
    else timeStr = `${Math.floor(diffHours / 24)}d ago`;
  }

  const deadline = c.extractedData?.deadline;
  const badgeExtra = deadline ? `DUE ${deadline}` : undefined;

  const syncDestinations = (c.syncedTo && c.syncedTo.length > 0)
    ? c.syncedTo.map(s => String(s).replace(/_/g, ' ')).join(', ')
    : 'Vault';

  return {
    id: c.id,
    badge,
    badgeExtra,
    domain,
    time: timeStr,
    title: c.title || c.url || 'Untitled Clip',
    excerpt: c.summary || c.selectedText || 'No excerpt available',
    tags: (c.tags && c.tags.length > 0) ? c.tags.map(t => t.startsWith('#') ? t : `#${t}`) : ['#Knowledge'],
    sync: syncDestinations,
    amber: badge === 'APPLY',
  };
}

export const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const {
    clips = [],
    destinations = [],
    onOpenManualAddModal,
    onRefreshSync,
    isRefreshing = false,
    theme = 'dark',
    currentUser,
    dashboardData,
    setActiveTab,
  } = props;
  const isDark = theme === 'dark' || theme === 'terminal';
  const cardClass = isDark
    ? 'bg-[#0E0E0E] border border-[#262626] rounded-2xl shadow-xs'
    : 'bg-white border border-slate-200 rounded-2xl shadow-sm';
  const [activeFilter, setActiveFilter] = useState('All');
  const [filterQuery, setFilterQuery] = useState('');
  const [starred, setStarred] = useState<Set<string>>(() => {
    return new Set(clips.filter(c => c.isFavorite).map(c => c.id));
  });
  const [gridView, setGridView] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [cinemaClip, setCinemaClip] = useState<ClipItem | null>(null);
  const [activeDonut, setActiveDonut] = useState<number | null>(null);
  const [doneDeadlines, setDoneDeadlines] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion ? { duration: 0 } : { ...SPRING };

  const userName = currentUser?.name?.split(' ')[0] || dashboardData?.user?.name?.split(' ')[0] || 'Guest';

  // Dynamic clips strictly from live backend (empty array if no clips yet)
  const dynamicClips: StaticClip[] = useMemo(() => {
    if (clips && clips.length > 0) {
      return clips.map(mapClipToStaticClip);
    }
    return [];
  }, [clips]);

  // Exact live breakdown using getClipIntent
  const intentCounts = useMemo(() => {
    const counts = { All: dynamicClips.length, Apply: 0, Learn: 0, Track: 0, Hire: 0 };
    dynamicClips.forEach(c => {
      if (c.badge === 'APPLY') counts.Apply++;
      else if (c.badge === 'LEARN') counts.Learn++;
      else if (c.badge === 'TRACK') counts.Track++;
      else if (c.badge === 'HIRE') counts.Hire++;
    });
    return counts;
  }, [dynamicClips]);

  // Filter Pills (matching exact counts)
  const filterCounts = useMemo(() => {
    return [
      { label: 'All', count: intentCounts.All, dot: null as string | null },
      { label: 'Apply', count: intentCounts.Apply, dot: 'bg-amber-500' },
      { label: 'Learn', count: intentCounts.Learn, dot: null as string | null },
      { label: 'Track', count: intentCounts.Track, dot: null as string | null },
      { label: 'Hire', count: intentCounts.Hire, dot: null as string | null },
    ];
  }, [intentCounts]);

  // 1. Total Clips Card
  const liveClipsCount = dynamicClips.length;
  const savedThisWeekCount = useMemo(() => {
    if (dashboardData?.stats?.saved_this_week !== undefined) {
      return dashboardData.stats.saved_this_week;
    }
    if (!clips || clips.length === 0) return 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return clips.filter(c => {
      const dateVal = c.createdAt || (c as any).created_at;
      if (!dateVal) return false;
      try {
        return new Date(dateVal).getTime() >= sevenDaysAgo;
      } catch {
        return false;
      }
    }).length;
  }, [clips, dashboardData?.stats?.saved_this_week]);

  // Right Rail: Live top story title from latest clip
  const topStoryTitle = useMemo(() => {
    if (dynamicClips.length > 0 && dynamicClips[0].title) {
      return dynamicClips[0].title.slice(0, 48) + (dynamicClips[0].title.length > 48 ? '...' : '');
    }
    return 'No saved opportunities yet';
  }, [dynamicClips]);

  // Live weekly digest summary from backend AI highlight or synthesized from latest clips
  const weekDigestSummary = useMemo(() => {
    if (dashboardData?.ai_digest_highlight?.summary) {
      return dashboardData.ai_digest_highlight.summary;
    }
    if (dynamicClips.length === 0) {
      return 'No saves recorded this week yet. Clip opportunities or articles to generate an automated weekly digest.';
    }
    return `Top story: ${topStoryTitle}. ${intentCounts.Apply} opportunities tracked across your vault.`;
  }, [dashboardData?.ai_digest_highlight?.summary, dynamicClips.length, topStoryTitle, intentCounts.Apply]);

  // 2. Apply Deadlines Card: EXACTLY matches intentCounts.Apply
  const liveExpiringCount = intentCounts.Apply;
  const expiringSublabel = useMemo(() => {
    const applyClips = dynamicClips.filter(c => c.badge === 'APPLY');
    const withTitles = applyClips.filter(c => c.title && c.title !== c.domain);
    if (withTitles.length >= 2) {
      return `${withTitles[0].title.slice(0, 18)}... & ${withTitles[1].title.slice(0, 18)}...`;
    } else if (withTitles.length === 1) {
      return withTitles[0].title.slice(0, 36);
    }
    return applyClips.length > 0 ? `${applyClips.length} active opportunities` : 'All applications on track';
  }, [dynamicClips]);

  // 3. Learn Backlog Card: EXACTLY matches intentCounts.Learn
  const liveBacklogCount = intentCounts.Learn;
  const learnSublabel = useMemo(() => {
    const learnClips = dynamicClips.filter(c => c.badge === 'LEARN');
    const flagged = learnClips.filter(c => c.tags && c.tags.some(t => {
      const lower = t.toLowerCase();
      return lower.includes('ai') || lower.includes('high') || lower.includes('important') || lower.includes('read') || lower.includes('study');
    }));
    return flagged.length > 0 ? `${flagged.length} flagged high relevance` : `${learnClips.length} items in reading queue`;
  }, [dynamicClips]);

  // 4. Active Syncs Card: Live from destinations
  const activeDestinations = useMemo(() => {
    return destinations.filter(d => d.connected && d.status === 'active');
  }, [destinations]);

  const liveActiveSyncs = Math.max(1, activeDestinations.length);
  const syncSublabel = useMemo(() => {
    if (activeDestinations.length > 0) {
      return activeDestinations.map(d => d.name).join(', ');
    }
    return 'Save Vault (Cloud)';
  }, [activeDestinations]);

  // Right Rail: Live Donut Breakdown from intentCounts
  const dynamicDonut = useMemo(() => {
    const total = Math.max(1, dynamicClips.length);
    const slices = [
      { name: 'Learn', count: intentCounts.Learn, color: '#2D6A4F' },
      { name: 'Track', count: intentCounts.Track, color: '#40916C' },
      { name: 'Apply', count: intentCounts.Apply, color: '#D97706' },
      { name: 'Hire', count: intentCounts.Hire, color: '#EC4899' },
    ];

    const circumference = 251.327;
    let accumulated = 0;

    return slices.map((s) => {
      const pct = Math.round((s.count / total) * 100);
      const dash = ((s.count / total) * circumference).toFixed(1);
      const offset = (-accumulated).toFixed(1);
      accumulated += (s.count / total) * circumference;
      return {
        name: s.name,
        count: s.count,
        pct,
        color: s.color,
        dash,
        offset,
      };
    });
  }, [dynamicClips.length, intentCounts]);

  // Right Rail: Live Top Tags from dynamicClips
  const dynamicTopTags = useMemo(() => {
    const tagFreq: Record<string, number> = {};
    dynamicClips.forEach(c => {
      (c.tags || []).forEach(raw => {
        const clean = raw.trim();
        if (!clean) return;
        const tag = clean.startsWith('#') ? clean : `#${clean}`;
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });
    return Object.entries(tagFreq)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [dynamicClips]);

  // Right Rail: Live Urgent Deadlines from dynamicClips or backend upcoming_deadlines
  const dynamicDeadlines = useMemo(() => {
    if (dashboardData?.upcoming_deadlines && dashboardData.upcoming_deadlines.length > 0) {
      return dashboardData.upcoming_deadlines.map((b: any) => {
        const deadlineStr = b.deadline_date ? `Due ${b.deadline_date}` : 'Action Required';
        return {
          title: (b.title || b.url || 'Opportunity').slice(0, 44),
          badge: deadlineStr,
          sub: b.summary ? b.summary.slice(0, 64) + (b.summary.length > 64 ? '...' : '') : 'Opportunity review & submission checklist',
          dot: 'bg-[#EA580C]',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-200/50',
        };
      });
    }

    const candidateClips = dynamicClips.filter(c => c.badgeExtra || c.badge === 'APPLY');
    if (candidateClips.length === 0) {
      return [];
    }

    return candidateClips.slice(0, 4).map((c) => {
      let badge = 'Open Action';
      let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200/50';
      let dot = 'bg-amber-400';

      if (c.badgeExtra) {
        badge = c.badgeExtra.replace(/^DUE\s*/i, '');
        badgeClass = 'bg-orange-100 text-orange-800 border-orange-200/50';
        dot = 'bg-[#EA580C]';
      }

      return {
        title: c.title.slice(0, 44),
        badge,
        sub: c.excerpt ? c.excerpt.slice(0, 64) + (c.excerpt.length > 64 ? '...' : '') : 'Opportunity review & submission checklist',
        dot,
        badgeClass,
      };
    });
  }, [dashboardData?.upcoming_deadlines, dynamicClips]);

  // Right Rail: Live Sync Stream Health from destinations
  const dynamicSyncRows = useMemo(() => {
    if (dashboardData?.destinations_status && dashboardData.destinations_status.length > 0) {
      return dashboardData.destinations_status.map((d: any, idx: number) => {
        const isConnected = Boolean(d.connected);
        const count = d.items_synced ?? (isConnected ? liveClipsCount : 0);
        const detail = isConnected ? `${count} items synced • Realtime` : 'Not configured';
        const timeAgo = isConnected ? 'Active' : 'Offline';
        return {
          name: d.name,
          detail,
          time: timeAgo,
          live: isConnected,
          delay: idx === 1 ? '0.2s' : '',
        };
      });
    }

    if (destinations && destinations.length > 0) {
      return destinations.map((d, idx) => {
        const isVault = d.id === 'dest_save_vault' || d.type === 'custom_db';
        const isConnected = d.connected && d.status === 'active';
        const count = isVault ? liveClipsCount : (d.itemsSyncedCount || 0);
        const detail = isConnected ? `${count} items synced • Realtime` : 'Not configured';
        const timeAgo = isConnected ? 'Active' : 'Offline';
        return {
          name: d.name,
          detail,
          time: timeAgo,
          live: isConnected,
          delay: idx === 1 ? '0.2s' : '',
        };
      });
    }

    return [
      { name: 'Save Vault (Cloud Database)', detail: `${liveClipsCount} items synced • Realtime`, time: 'Active', live: true, delay: '' },
    ];
  }, [dashboardData?.destinations_status, destinations, liveClipsCount]);

  // Right Rail: Live Save Streak from clip timestamps
  const { liveStreakDays, liveStreakOn, realStreakCount, bestStreak } = useMemo(() => {
    const now = new Date();
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6

    const savedDates = new Set<string>();
    clips.forEach(c => {
      if (c.createdAt) {
        try {
          const d = new Date(c.createdAt).toISOString().split('T')[0];
          savedDates.add(d);
        } catch {}
      }
    });

    const streakOn = [false, false, false, false, false, false, false];
    for (let i = 0; i <= currentDayOfWeek; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - (currentDayOfWeek - i));
      const dateStr = d.toISOString().split('T')[0];
      if (savedDates.has(dateStr)) {
        streakOn[i] = true;
      }
    }

    let consecutive = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (savedDates.has(dateStr)) {
        consecutive++;
      } else if (i > 0) {
        break;
      }
    }

    const calculatedStreak = consecutive;
    const best = Math.max(calculatedStreak, savedDates.size);

    return {
      liveStreakDays: dayNames,
      liveStreakOn: streakOn,
      realStreakCount: calculatedStreak,
      bestStreak: best,
    };
  }, [clips]);

  // Right Rail: Live Daily Goal from clips saved today vs goal target 10
  const { savedTodayCount, dailyGoalTarget, goalPct } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayClips = clips.filter(c => {
      if (!c.createdAt) return false;
      try {
        return new Date(c.createdAt).toISOString().split('T')[0] === todayStr;
      } catch {
        return false;
      }
    }).length;

    const count = todayClips;
    const target = 10;
    const pct = Math.min(100, Math.round((count / target) * 100));

    return {
      savedTodayCount: count,
      dailyGoalTarget: target,
      goalPct: pct,
    };
  }, [clips]);

  const totalCount = useCountUp(liveClipsCount);
  const expiringCount = useCountUp(liveExpiringCount);
  const backlogCount = useCountUp(liveBacklogCount);
  const liveCount = useCountUp(liveActiveSyncs);
  const digestCount = useCountUp(savedThisWeekCount);
  const streakCount = useCountUp(realStreakCount);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (e.key === 'Escape') {
        setCinemaClip(null);
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

  const visibleClips = showEmpty ? [] : dynamicClips.filter((c) => matchesFilter(c) && matchesQuery(c));

  return (
    <div
      className={`min-h-screen font-gambetta antialiased pb-14 transition-colors duration-200 ${
        isDark ? 'bg-[#000000] text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'
      }`}
      style={{ fontFamily: FONT_GAMBETTA }}
    >
      <div className="w-full px-8 py-8">
        <AnimatePresence>
          {cinemaClip && (
            <ClipCinemaViewer
              clip={cinemaClip}
              allClips={clips}
              onClose={() => setCinemaClip(null)}
              onNavigate={(c) => setCinemaClip(c)}
              destinations={destinations}
              onSendToDestination={() => {}}
              onToggleStorage={() => {}}
              onToggleFavorite={(id) => toggleStar(id)}
              onDeleteClip={(id) => {
                setClips(prev => prev.filter(c => c.id !== id));
                setCinemaClip(null);
              }}
              isDark={isDark}
            />
          )}
        </AnimatePresence>
        <div className="flex flex-col w-full gap-6">
          {/* Greeting + actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1
                  className={`text-[32px] leading-[40px] tracking-[-0.02em] font-semibold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  Good morning, {userName}
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] leading-[14px] tracking-[0.02em] font-semibold shadow-sm border ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                      : 'bg-[#a1f4c8] text-[#005236] border-[#86d7ad]/30'
                  }`}
                >
                  PRO VAULT
                </span>
              </div>
              <p className={`text-[14px] leading-[20px] flex items-center gap-3 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                <span>{totalCount} clips synchronized across {liveCount} active streams</span>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-slate-300'}`}></span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-[13px] leading-[20px] border ${
                    isDark
                      ? 'text-[#EDEDED] bg-[#141414] border-[#262626]'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FE769]"></span>
                  </span>
                  All systems nominal
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 self-start md:self-auto">
              <motion.button
                onClick={onRefreshSync}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className={`flex items-center gap-2 px-3 h-10 rounded-xl border transition-colors shadow-sm select-none group cursor-pointer ${
                  isDark
                    ? 'bg-[#141414] text-[#EDEDED] border-[#262626] hover:bg-[#1E1E1E]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <RefreshCw
                  className={`text-[18px] w-[18px] h-[18px] group-hover:rotate-180 transition-transform duration-500 ${
                    isDark ? 'text-[#3FE769]' : 'text-slate-500'
                  } ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="font-medium text-[13px] leading-[20px]">Sync Now</span>
                <span className={`text-[11px] leading-[14px] ml-0.5 ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>
                  {isRefreshing ? 'Syncing...' : 'Just now'}
                </span>
              </motion.button>
              <motion.button
                onClick={onOpenManualAddModal}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className={`relative flex items-center gap-2 px-4 h-10 rounded-xl transition-colors shadow-sm select-none overflow-hidden group cursor-pointer ${
                  isDark
                    ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] hover:bg-[#222222]'
                    : 'bg-[#2D6A4F] text-white hover:bg-[#245640]'
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-white/20"></div>
                <Plus className="text-[18px] w-[18px] h-[18px] relative z-10" />
                <span className="font-medium text-[13px] leading-[20px] tracking-wide relative z-10">
                  Save Clip
                </span>
                <kbd
                  className={`ml-1 px-1.5 py-0.5 rounded text-[11px] leading-[14px] font-mono relative z-10 border shadow-inner ${
                    isDark
                      ? 'bg-[#111111] text-[#3FE769] border-[#262626]'
                      : 'bg-black/20 text-white/90 border-white/10'
                  }`}
                >
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
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all ${
                isDark ? 'hover:border-[#383838]' : 'hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1C1B1B] text-[#3FE769]' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Bookmark className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`font-medium text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Total Clips</span>
                </div>
                <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] leading-[14px] font-medium border ${
                  isDark ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  +12% mo
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span
                  className={`text-[36px] leading-[44px] tracking-tight font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {totalCount}
                </span>
                <svg className={`w-24 h-8 ${isDark ? 'text-[#3FE769]' : 'text-emerald-500'}`} fill="none" viewBox="0 0 80 28">
                  <path d="M1 22L14 19L28 23L42 14L56 16L70 6L79 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  <path d="M1 22L14 19L28 23L42 14L56 16L70 6L79 9V28H1V22Z" fill="currentColor" fillOpacity={isDark ? "0.15" : "0.1"}></path>
                </svg>
              </div>
              <p className={`mt-2 text-[11px] leading-[14px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>{savedThisWeekCount} saved this week</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.03 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all ${
                isDark ? 'hover:border-[#383838]' : 'hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#2A1715] text-[#F87171]' : 'bg-amber-50 text-amber-600'}`}>
                    <CalendarDays className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`font-medium text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Apply Deadlines</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] leading-[14px] font-medium border ${
                  isDark ? 'bg-[#2A1715] text-[#F87171] border-[#4A1E1C]' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  &lt;48h left
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className={`text-[36px] leading-[44px] tracking-tight font-semibold ${isDark ? 'text-[#F87171]' : 'text-amber-600'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {expiringCount}
                </span>
                <span className={`text-[15px] leading-[22px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} style={{ fontFamily: FONT_GAMBETTA }}>
                  Expiring
                </span>
              </div>
              <p className={`mt-2 text-[11px] leading-[14px] truncate ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} title={expiringSublabel}>{expiringSublabel}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.06 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all ${
                isDark ? 'hover:border-[#383838]' : 'hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#141B26] text-[#60A5FA]' : 'bg-blue-50 text-blue-600'}`}>
                    <GraduationCap className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`font-medium text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Learn Backlog</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] leading-[14px] font-medium border ${
                  isDark ? 'bg-[#141414] text-[#878787] border-[#262626]' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  Avg 4m read
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className={`text-[36px] leading-[44px] tracking-tight font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {backlogCount}
                </span>
                <span className={`text-[15px] leading-[22px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} style={{ fontFamily: FONT_GAMBETTA }}>
                  Clips
                </span>
              </div>
              <p className={`mt-2 text-[11px] leading-[14px] font-medium truncate ${isDark ? 'text-[#60A5FA]' : 'text-blue-600'}`} title={learnSublabel}>
                {learnSublabel}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: ENTER_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.09 }}
              className={`${cardClass} p-6 flex flex-col justify-between relative transition-all ${
                isDark ? 'hover:border-[#383838]' : 'hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.06)] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-[#1C1B1B] text-[#3FE769]' : 'bg-slate-100 text-slate-600'}`}>
                    <Network className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`font-medium text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Active Syncs</span>
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3FE769]"></span>
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className={`text-[36px] leading-[44px] tracking-tight font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {liveCount}
                </span>
                <span className={`text-[15px] leading-[22px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} style={{ fontFamily: FONT_GAMBETTA }}>
                  Live
                </span>
              </div>
              <p className={`mt-2 text-[11px] leading-[14px] truncate ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} title={syncSublabel}>
                {syncSublabel}
              </p>
            </motion.div>
          </div>

          {/* Intent tabs + filter bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
              {filterCounts.map((f) => {
                const isActive = activeFilter === f.label;
                return (
                  <motion.button
                    key={f.label}
                    onClick={() => setActiveFilter(f.label)}
                    whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                    className={`relative flex items-center gap-2 px-4 h-9 rounded-full font-medium text-[13px] leading-[20px] transition-colors shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : isDark
                        ? 'bg-[#111111] text-[#A1A1A1] hover:text-white hover:bg-[#181818] border border-[#262626]'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {isActive &&
                      (reduceMotion ? (
                        <span
                          className={`absolute inset-0 rounded-full shadow-sm ${
                            isDark ? 'bg-[#1C1B1B] border border-[#262626]' : 'bg-[#2D6A4F]'
                          }`}
                        />
                      ) : (
                        <motion.span
                          layoutId="filter-pill"
                          className={`absolute inset-0 rounded-full shadow-sm ${
                            isDark ? 'bg-[#1C1B1B] border border-[#262626]' : 'bg-[#2D6A4F]'
                          }`}
                          transition={{ ...SPRING }}
                        />
                      ))}
                    {f.dot && (
                      <span className={`w-1.5 h-1.5 rounded-full relative z-10 ${f.dot}`}></span>
                    )}
                    <span className="relative z-10">{f.label}</span>
                    <span
                      className={`relative z-10 px-2 py-0.5 rounded-full text-[11px] leading-[14px] ${
                        isActive
                          ? isDark
                            ? 'bg-white/10 text-white'
                            : 'bg-white/20 text-white'
                          : isDark
                          ? 'text-[#878787] bg-[#1C1B1B]'
                          : 'text-slate-400 bg-slate-100'
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
                  className={`h-9 pl-9 pr-3 text-[13px] leading-[20px] rounded-xl focus:outline-none transition-all shadow-sm w-48 ${
                    isDark
                      ? 'bg-[#111111] border border-[#262626] text-white placeholder:text-[#666666] focus:border-[#3FE769] focus:ring-2 focus:ring-[#3FE769]/15'
                      : 'bg-white border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/10'
                  }`}
                  placeholder="Filter current view..."
                  type="text"
                />
                <ListFilter className={`absolute left-2.5 top-2.5 w-4 h-4 pointer-events-none ${isDark ? 'text-[#666666]' : 'text-slate-400'}`} />
              </div>
              <div className={`h-5 w-px mx-0.5 ${isDark ? 'bg-[#262626]' : 'bg-slate-200'}`}></div>
              <button
                className={`h-9 px-3 rounded-xl border flex items-center gap-1 font-medium text-[13px] leading-[20px] transition-colors shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-[#111111] border-[#262626] text-[#A1A1A1] hover:text-white hover:bg-[#181818]'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Newest First</span>
              </button>
              <div className={`flex p-0.5 rounded-xl border ${isDark ? 'bg-[#111111] border-[#262626]' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  onClick={() => setGridView(false)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    !gridView
                      ? isDark
                        ? 'bg-[#1C1B1B] shadow-sm text-white'
                        : 'bg-white shadow-sm text-slate-900'
                      : isDark
                      ? 'text-[#666666] hover:text-white'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridView(true)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    gridView
                      ? isDark
                        ? 'bg-[#1C1B1B] shadow-sm text-white'
                        : 'bg-white shadow-sm text-slate-900'
                      : isDark
                      ? 'text-[#666666] hover:text-white'
                      : 'text-slate-500 hover:text-slate-900'
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
                    className={`text-[22px] leading-[28px] tracking-[-0.015em] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontFamily: FONT_GAMBETTA }}
                  >
                    Recent Clips
                  </h2>
                  <span className={`text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                    Showing {visibleClips.length} of {dynamicClips.length} clips
                  </span>
                </div>
                <button
                  onClick={() => setShowEmpty((v) => !v)}
                  className={`text-[11px] leading-[14px] font-medium hover:underline flex items-center gap-1 h-11 px-2 cursor-pointer ${
                    isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Toggle Empty State</span>
                </button>
              </div>

              {!showEmpty && visibleClips.length === 0 ? (
                <div className={`${cardClass} p-12 flex flex-col items-center justify-center text-center`}>
                  <div
                    className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 shadow-sm ${
                      isDark ? 'bg-[#141414] border-[#262626] text-[#3FE769]' : 'bg-slate-50 border-slate-100 text-[#2D6A4F]'
                    }`}
                  >
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <h3
                    className={`text-[20px] leading-[26px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontFamily: FONT_GAMBETTA }}
                  >
                    {dynamicClips.length === 0 ? 'You do not have anything saved yet' : 'No clips match this filter'}
                  </h3>
                  <p className={`text-[13px] leading-[18px] max-w-sm mb-5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                    {dynamicClips.length === 0
                      ? 'Your vault is completely empty. Clip articles, links, or notes to get started.'
                      : 'Try resetting your filter or searching for another topic.'}
                  </p>
                  {dynamicClips.length === 0 && (
                    <button
                      onClick={onOpenManualAddModal}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isDark ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] hover:bg-[#222222]' : 'bg-[#2D6A4F] text-white hover:bg-[#245640]'
                      }`}
                    >
                      + Save Your First Clip
                    </button>
                  )}
                </div>
              ) : !showEmpty && (
                <div className={`${cardClass} overflow-hidden flex flex-col`}>
                  {visibleClips.map((clip) => (
                    <article
                      key={clip.id}
                      onClick={() => {
                        const full = clips.find(c => c.id === clip.id);
                        if (full) {
                          setCinemaClip(full);
                        } else {
                          setCinemaClip({
                            id: clip.id,
                            title: clip.title,
                            url: `https://${clip.domain}`,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            tags: clip.tags,
                            summary: clip.excerpt,
                          });
                        }
                      }}
                      className={`p-6 transition-colors group flex flex-col sm:flex-row gap-4 justify-between items-start border-b last:border-b-0 cursor-pointer ${
                        clip.amber
                          ? isDark
                            ? 'bg-[#1C120C]/40 hover:bg-[#1C120C]/70 border-b-[#381F14]'
                            : 'bg-amber-50/30 hover:bg-amber-50/60 border-b-amber-100'
                          : isDark
                          ? 'hover:bg-[#141414] border-b-[#1F1F1F]'
                          : 'hover:bg-[#F8FAFC] border-b-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                            clip.amber
                              ? isDark
                                ? 'bg-[#2A1715] border-[#4A1E1C] text-[#F87171]'
                                : 'bg-amber-100 border-amber-200/50 text-amber-700'
                              : isDark
                              ? 'bg-[#141414] border-[#262626] text-[#A1A1A1]'
                              : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}
                        >
                          <Link2 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[11px] leading-[14px] font-semibold tracking-wide ${badgeClass(
                                clip.badge,
                                clip.amber,
                                isDark
                              )}`}
                            >
                              {clip.badge}
                              {clip.badgeExtra ? ` • ${clip.badgeExtra}` : ''}
                            </span>
                            <span
                              className={`text-[11px] leading-[14px] font-mono tracking-tight px-1.5 py-0.5 rounded border ${
                                isDark
                                  ? 'bg-[#141414] text-[#878787] border-[#262626]'
                                  : 'text-slate-500 bg-slate-50 border-slate-100'
                              }`}
                            >
                              {clip.domain}
                            </span>
                            <span className={`inline-block w-1 h-1 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-slate-300'}`}></span>
                            <span className={`text-[11px] leading-[14px] ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>
                              {clip.time}
                            </span>
                          </div>
                          <span
                            className={`text-[16px] leading-[24px] font-semibold transition-colors line-clamp-1 cursor-pointer ${
                              isDark ? 'text-[#EDEDED] hover:text-[#3FE769]' : 'text-slate-900 hover:text-[#2D6A4F]'
                            }`}
                          >
                            {clip.title}
                          </span>
                          <p className={`text-[14px] leading-[22px] line-clamp-2 pr-4 ${isDark ? 'text-[#A1A1A1]' : 'text-slate-600'}`}>
                            {clip.excerpt}
                          </p>
                          <div className="flex items-center flex-wrap gap-3 pt-2">
                            <div className="flex items-center gap-1.5 text-[11px] leading-[14px]">
                              {clip.tags.map((t) => (
                                <span
                                  key={t}
                                  className={`px-2 py-1 rounded-full font-medium ${
                                    isDark ? 'bg-[#181818] text-[#A1A1A1]' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <span className={`inline-block w-1 h-1 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-slate-300'}`}></span>
                            <div
                              className={`flex items-center gap-1 text-[11px] leading-[14px] px-2 py-1 rounded-full ${
                                clip.amber
                                  ? isDark
                                    ? 'text-[#F87171] bg-[#2A1715]'
                                    : 'text-amber-700 bg-amber-100/50'
                                  : isDark
                                  ? 'text-[#3FE769] bg-[#1C1B1B]'
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
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border border-transparent transition-all cursor-pointer ${
                            starred.has(clip.id)
                              ? 'text-amber-500'
                              : isDark
                              ? 'text-[#878787] hover:text-amber-400 hover:bg-[#181818] hover:border-[#262626]'
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
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border border-transparent transition-all cursor-pointer ${
                            isDark
                              ? 'text-[#878787] hover:text-[#3FE769] hover:bg-[#181818] hover:border-[#262626]'
                              : 'text-slate-400 hover:text-[#2D6A4F] hover:bg-white hover:border-slate-200 hover:shadow-sm'
                          }`}
                          title="Copy URL"
                        >
                          <Copy className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className={`h-9 w-9 flex items-center justify-center rounded-lg border border-transparent transition-all cursor-pointer ${
                            isDark
                              ? 'text-[#878787] hover:text-white hover:bg-[#181818] hover:border-[#262626]'
                              : 'text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 hover:shadow-sm'
                          }`}
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
                  <div
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 shadow-sm ${
                      isDark ? 'bg-[#141414] border-[#262626] text-[#3FE769]' : 'bg-slate-50 border-slate-100 text-[#2D6A4F]'
                    }`}
                  >
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3
                    className={`text-[22px] leading-[28px] tracking-[-0.015em] font-semibold mb-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    style={{ fontFamily: FONT_GAMBETTA }}
                  >
                    You do not have anything saved yet
                  </h3>
                  <p className={`text-[14px] leading-[20px] max-w-md mb-6 ${isDark ? 'text-[#A1A1A1]' : 'text-slate-600'}`}>
                    Your vault is completely empty. Save articles, links, or notes using the browser extension or manual add.
                  </p>
                  <div
                    className={`p-5 border rounded-xl w-full max-w-sm text-left mb-6 ${
                      isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-medium text-[13px] leading-[20px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Starter: YC Application Template
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] leading-[14px] font-medium border ${
                          isDark ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]' : 'bg-emerald-100 text-emerald-800 border-emerald-200/60'
                        }`}
                      >
                        Ready
                      </span>
                    </div>
                    <p className={`text-[11px] leading-[14px] leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                      Includes default rubric, evaluation criteria, and pitch deck clip markers.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onOpenManualAddModal}
                      className={`px-5 h-10 rounded-xl font-medium text-[13px] leading-[20px] transition-colors shadow-sm cursor-pointer ${
                        isDark ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A] hover:bg-[#222222]' : 'bg-[#2D6A4F] text-white hover:bg-[#245640]'
                      }`}
                    >
                      Import Bookmarks
                    </button>
                    <button
                      onClick={() => setShowEmpty(false)}
                      className={`px-5 h-10 rounded-xl font-medium text-[13px] leading-[20px] transition-colors shadow-sm border cursor-pointer ${
                        isDark ? 'bg-[#141414] border-[#262626] text-white hover:bg-[#1E1E1E]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
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
                  className={`text-[22px] leading-[28px] tracking-[-0.015em] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  This Week
                </h2>
                <span className={`text-[13px] leading-[20px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Digest &amp; goals</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={enter}
                className={`${cardClass} p-6`}
              >
                <span className={`text-[11px] leading-[14px] tracking-[0.02em] font-medium uppercase ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Week Digest
                </span>
                <div
                  className={`text-[30px] leading-[38px] font-semibold tracking-tight tabular-nums mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {digestCount} <span className={`text-[14px] font-medium ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>saves</span>
                </div>
                <p className={`text-[12px] leading-[18px] mt-1 line-clamp-3 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  {weekDigestSummary}
                </p>
                <button
                  onClick={() => setActiveTab?.('clips')}
                  className={`mt-2 inline-flex items-center gap-1 text-[12px] font-medium hover:underline cursor-pointer ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`}
                >
                  View clips
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.03 }}
                className={`${cardClass} p-6`}
              >
                <span className={`text-[11px] leading-[14px] tracking-[0.02em] font-medium uppercase inline-flex items-center gap-1.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  <Flame className="w-3.5 h-3.5 text-[#EA580C]" />
                  Save Streak
                </span>
                <div
                  className={`text-[30px] leading-[38px] font-semibold tracking-tight tabular-nums mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: FONT_GAMBETTA }}
                >
                  {streakCount} <span className={`text-[14px] font-medium ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>days</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {liveStreakDays.map((d, i) => (
                    <span key={i} className="flex flex-col items-center gap-1">
                      <span
                        className={`w-4 h-4 rounded-full ${
                          liveStreakOn[i]
                            ? 'bg-[#EA580C]'
                            : isDark
                            ? 'bg-[#181818] border border-[#262626]'
                            : 'bg-slate-100 border border-slate-200'
                        }`}
                      />
                      <span className={`text-[8.5px] font-sans ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>{d}</span>
                    </span>
                  ))}
                  <span className={`ml-auto text-[11px] font-sans ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>Best {bestStreak}d</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.06 }}
                className={`${cardClass} p-6 flex items-center gap-3`}
              >
                <GoalRing current={savedTodayCount} target={dailyGoalTarget} pct={goalPct} isDark={isDark} />
                <div className="min-w-0">
                  <span className={`text-[11px] leading-[14px] tracking-[0.02em] font-medium uppercase ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                    Daily Goal
                  </span>
                  <div className={`text-[14px] font-medium mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{savedTodayCount} of {dailyGoalTarget} today</div>
                  <div className={`h-1.5 rounded-full mt-2 overflow-hidden ${isDark ? 'bg-[#1F1F1F]' : 'bg-slate-100'}`}>
                    <div className={`h-full rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'}`} style={{ width: `${goalPct}%` }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: ENTER_Y }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: 0.09 }}
                className={`${cardClass} p-6`}
              >
                <span className={`text-[11px] leading-[14px] tracking-[0.02em] font-medium uppercase ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Top Tags
                </span>
                {dynamicTopTags.length === 0 ? (
                  <p className={`text-[12px] mt-2 italic ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>No tags indexed yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dynamicTopTags.map((t) => (
                      <span
                        key={t.tag}
                        className={`inline-flex items-center gap-1 text-[11px] leading-[14px] font-medium rounded-full px-2 py-0.5 ${
                          isDark
                            ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                            : 'bg-[#DCFCE7] text-[#166534]'
                        }`}
                      >
                        {t.tag}
                        <span className="font-bold tabular-nums">{t.count}</span>
                      </span>
                    ))}
                  </div>
                )}
                <p className={`text-[11px] leading-[14px] mt-2 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>{dynamicClips.length} clips synced</p>
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
                    className={`text-[15px] leading-[22px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontFamily: FONT_GAMBETTA }}
                  >
                    Intent Distribution
                  </h3>
                </div>
                <div className="flex items-center justify-center py-3">
                  <div className="relative w-44 h-44 flex items-center justify-center group cursor-default">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Track background */}
                      <circle cx="50" cy="50" fill="none" r="40" stroke={isDark ? '#1F1F1F' : '#F1F5F9'} strokeWidth="12" />
                      {dynamicDonut.map((s, idx) => {
                        const darkColors = ['#444444', '#777777', '#00CA50', '#86D7AD', '#555555', '#333333'];
                        const segColor = isDark ? (darkColors[idx] || s.color) : s.color;
                        return (
                          <circle
                            key={s.name}
                            cx="50"
                            cy="50"
                            fill="none"
                            r="40"
                            stroke={segColor}
                            strokeDasharray={`${s.dash} 251.3`}
                            strokeDashoffset={s.offset}
                            strokeLinecap="round"
                            strokeWidth={activeDonut === idx ? 15 : 12}
                            opacity={activeDonut === null || activeDonut === idx ? 1 : 0.3}
                            onMouseEnter={() => setActiveDonut(idx)}
                            onMouseLeave={() => setActiveDonut(null)}
                            className="transition-all duration-150 cursor-pointer"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span
                        className={`text-[28px] leading-[36px] tracking-tight font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: FONT_GAMBETTA }}
                      >
                        {activeDonut !== null ? `${dynamicDonut[activeDonut].pct}%` : `${totalCount}`}
                      </span>
                      <span className={`text-[11px] leading-[14px] uppercase tracking-wider font-medium mt-1 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                        {activeDonut !== null ? dynamicDonut[activeDonut].name : 'Total'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                  {dynamicDonut.map((d, idx) => {
                    const darkColors = ['#444444', '#777777', '#00CA50', '#86D7AD', '#555555', '#333333'];
                    const dotColor = isDark ? (darkColors[idx] || d.color) : d.color;
                    return (
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
                            className={`w-2.5 h-2.5 rounded-full ring-2 shadow-sm ${isDark ? 'ring-[#1F1F1F]' : 'ring-white'}`}
                            style={{ background: dotColor }}
                          ></span>
                          <span className={`text-[13px] transition-colors ${
                            isDark ? 'text-[#A1A1A1] group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                          }`}>
                            {d.name}
                          </span>
                        </div>
                        <span className={`text-[11px] leading-[14px] font-mono ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                          {d.pct}%
                        </span>
                      </div>
                    );
                  })}
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#2A1715] text-[#EA580C]' : 'bg-orange-50 text-[#EA580C]'}`}>
                      <AlarmClock className="w-4 h-4" />
                    </div>
                    <h3
                      className={`text-[15px] leading-[22px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                      style={{ fontFamily: FONT_GAMBETTA }}
                    >
                      Urgent Deadlines
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[11px] leading-[14px] font-semibold border ${
                    isDark
                      ? 'bg-[#2A1715] text-[#EA580C] border-[#4A1E1C]'
                      : 'bg-orange-100 text-orange-800 border-orange-200/50'
                  }`}>
                    {dynamicDeadlines.length} Actions
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {dynamicDeadlines.length === 0 ? (
                    <div className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center ${
                      isDark ? 'bg-[#141414] border-[#262626] text-[#878787]' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <Check className={`w-5 h-5 mb-1.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                      <p className={`text-[13px] font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>All deadlines on track</p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>No urgent action items pending</p>
                    </div>
                  ) : (
                    dynamicDeadlines.map((d, idx) => {
                      const isDone = doneDeadlines.has(d.title);
                      return (
                        <React.Fragment key={d.title}>
                          <div className="flex gap-3 items-start group">
                            <div
                              className={`w-2 h-2 rounded-full mt-2 shrink-0 transition-colors ${
                                isDone
                                  ? 'bg-[#3FE769]'
                                  : idx === 0
                                    ? 'bg-[#EA580C]'
                                    : idx === 1
                                      ? 'bg-amber-400'
                                      : isDark ? 'bg-[#444444]' : 'bg-slate-300'
                              }`}
                            ></div>
                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`font-medium text-[14px] truncate transition-colors ${
                                    isDone
                                      ? isDark ? 'text-[#666666] line-through' : 'text-slate-400 line-through'
                                      : isDark ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {d.title}
                                </span>
                                {isDone ? (
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 border ${
                                    isDark
                                      ? 'bg-[#12231A] text-[#3FE769] border-[#1C3E2D]'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200/50'
                                  }`}>
                                    Done
                                  </span>
                                ) : (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 border ${
                                      isDark
                                        ? 'bg-[#1C1B1B] text-[#EDEDED] border-[#262626]'
                                        : d.badgeClass
                                    }`}
                                  >
                                    {deadlineBadge(d)}
                                  </span>
                                )}
                              </div>
                              <span className={`text-[13px] leading-[18px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>{d.sub}</span>
                              {!isDone && (
                                <span className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  <button
                                    onClick={() => toggleDone(d.title)}
                                    className={`text-[11px] font-semibold rounded-full px-2 py-0.5 transition-colors cursor-pointer border ${
                                      isDark
                                        ? 'text-[#3FE769] bg-[#12231A] hover:bg-[#1A3326] border-[#1C3E2D]'
                                        : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-200/60'
                                    }`}
                                  >
                                    Mark done
                                  </button>
                                  <button
                                    onClick={() => snoozeDeadline(d.title)}
                                    className={`text-[11px] font-semibold rounded-full px-2 py-0.5 transition-colors cursor-pointer border ${
                                      isDark
                                        ? 'text-[#A1A1A1] bg-[#181818] hover:bg-[#222222] border-[#262626]'
                                        : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-transparent'
                                    }`}
                                  >
                                    Snooze
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                          {idx < dynamicDeadlines.length - 1 && <div className={`h-px ml-5 ${isDark ? 'bg-[#1F1F1F]' : 'bg-slate-100'}`}></div>}
                        </React.Fragment>
                      );
                    })
                  )}
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1C1B1B] text-[#3FE769]' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <h3
                      className={`text-[15px] leading-[22px] font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                      style={{ fontFamily: FONT_GAMBETTA }}
                    >
                      Sync Stream Health
                    </h3>
                  </div>
                  <span className={`text-[12px] font-semibold tracking-wide ${isDark ? 'text-[#3FE769]' : 'text-emerald-600'}`}>
                    {activeDestinations.length > 0 ? '100% Operational' : 'Offline'}
                  </span>
                </div>
                <div className="relative flex flex-col gap-4 overflow-hidden">
                  {isRefreshing && !reduceMotion && (
                    <motion.div
                      className={`absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent pointer-events-none ${
                        isDark ? 'via-[#3FE769]/20' : 'via-emerald-200/50'
                      } to-transparent`}
                      animate={{ x: ['-120%', '420%'] }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    />
                  )}
                  {dynamicSyncRows.map((r) => (
                    <div key={r.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="relative flex h-2 w-2 shrink-0">
                          {r.live ? (
                            <>
                              <span
                                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"
                                style={r.delay ? { animationDelay: r.delay } : undefined}
                              ></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FE769]"></span>
                            </>
                          ) : (
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isDark ? 'bg-[#333333]' : 'bg-slate-300'}`}></span>
                          )}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-medium text-[14px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {r.name}
                          </span>
                          <span className={`text-[12px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>{r.detail}</span>
                        </div>
                      </div>
                      <span className={`text-[11px] leading-[14px] font-mono transition-colors ${
                        isDark ? 'text-[#666666] group-hover:text-[#A1A1A1]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        {r.time}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  className={`mt-2 w-full h-10 rounded-xl border transition-colors font-medium text-[13px] flex items-center justify-center gap-2 group cursor-pointer ${
                    isDark
                      ? 'bg-[#141414] border-[#262626] text-[#A1A1A1] hover:text-white hover:bg-[#1E1E1E]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
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
