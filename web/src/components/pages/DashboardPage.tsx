import React, { useState } from 'react';
import { 
  ClipItem, 
  DestinationConfig, 
  JobCard, 
  ConnectionSyncLog 
} from '../../types';
import { TabType } from '../layout/Sidebar';
import { 
  LayoutDashboard, 
  Bookmark, 
  Radio, 
  Briefcase, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  ChevronRight, 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  FileSpreadsheet, 
  FileText, 
  Table, 
  HardDrive, 
  Puzzle, 
  Sliders, 
  Star,
  Search,
  Check,
  Send,
  Flame,
  Activity,
  BarChart2,
  Terminal
} from 'lucide-react';

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

export const DashboardPage: React.FC<DashboardPageProps> = ({
  clips,
  setClips,
  destinations,
  setDestinations,
  jobs,
  logs,
  setActiveTab,
  onOpenManualAddModal,
  onRefreshSync,
  isRefreshing = false,
  toggleExtensionWidget,
  theme = 'terminal'
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [pingingDestId, setPingingDestId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activity' | 'analytics' | 'action_hub' | 'logs'>('overview');
  const [hoveredHeatCell, setHoveredHeatCell] = useState<{ date: string; count: number } | null>(null);

  // Dynamic Theme Helpers
  const isLight = theme === 'light';
  const isDark = theme === 'dark';
  
  const cardBgClass = isLight 
    ? 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-amber-500/50' 
    : isDark 
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-lg hover:border-indigo-500/50' 
    : 'bg-[#080808] border-white/5 text-white hover:border-amber-500/40';

  const innerBgClass = isLight 
    ? 'bg-slate-50 border-slate-200' 
    : isDark 
    ? 'bg-slate-800/80 border-slate-700/60' 
    : 'bg-[#050505] border-white/5';

  const titleClass = isLight 
    ? 'text-slate-900' 
    : 'text-white';

  const subtextClass = isLight 
    ? 'text-slate-500' 
    : isDark 
    ? 'text-slate-400' 
    : 'text-stone-400';

  // Calculated Stats
  const totalClips = clips.length;
  const activeDestinations = destinations.filter(d => d.connected && d.status === 'active');
  const totalSynced = destinations.reduce((acc, curr) => acc + curr.itemsSyncedCount, 0);

  // Job status metrics
  const savedJobsCount = jobs.filter(j => j.status === 'saved').length;
  const appliedJobsCount = jobs.filter(j => j.status === 'applied').length;
  const interviewingJobsCount = jobs.filter(j => j.status === 'interviewing').length;
  const offerJobsCount = jobs.filter(j => j.status === 'offer').length;

  // Generate GitHub/LeetCode style contribution matrix data (16 weeks x 7 days)
  const heatmapWeeks = React.useMemo(() => {
    const weeks = [];
    const today = new Date();
    for (let w = 15; w >= 0; w--) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (w * 7 + (6 - d)));
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const daySeed = (dateObj.getDate() * 7 + dateObj.getMonth() * 13) % 10;
        let count = 0;
        if (daySeed > 3) count = (daySeed % 4) + 1;
        if (w === 0 && d >= 4) count = 3 + (d % 3); // Active streak
        days.push({ date: dateStr, count, isToday: w === 0 && d === 6 });
      }
      weeks.push(days);
    }
    return weeks;
  }, []);

  const filteredClips = clips.filter(clip => {
    const matchesFilter = filterType === 'all' || clip.type === filterType;
    const matchesSearch = 
      clip.title.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      clip.summary.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      clip.tags.some(t => t.toLowerCase().includes(dashboardSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleToggleFavorite = (clipId: string) => {
    setClips(prev =>
      prev.map(c => c.id === clipId ? { ...c, isFavorite: !c.isFavorite } : c)
    );
  };

  const handleTestPingDest = (destId: string) => {
    setPingingDestId(destId);
    setTimeout(() => {
      setPingingDestId(null);
    }, 1000);
  };

  const renderDestIcon = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'google_sheets':
        return <FileSpreadsheet className={`${className} text-emerald-400`} />;
      case 'notion':
        return <FileText className={`${className} ${isLight ? 'text-slate-700' : 'text-stone-200'}`} />;
      case 'airtable':
        return <Table className={`${className} text-cyan-400`} />;
      case 'webhook':
        return <Zap className={`${className} text-indigo-400`} />;
      case 'custom_db':
        return <HardDrive className={`${className} text-blue-400`} />;
      default:
        return <Radio className={`${className} text-amber-500`} />;
    }
  };

  return (
    <div className={`p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn min-h-screen transition-colors ${
      isLight ? 'bg-slate-100/70 text-slate-900' : isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#050505] text-white'
    }`}>
      {/* Hero Welcome Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b ${
        isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-amber-500 uppercase bg-amber-500/10 px-2.5 py-1 border border-amber-500/30 rounded-sm">
              {theme === 'terminal' ? 'Vault Command Center' : theme === 'light' ? 'Workspace Dashboard' : 'Central Pipeline'}
            </span>
            <span className="opacity-40 text-xs">•</span>
            <span className={`text-xs font-mono ${subtextClass}`}>Live Uplink Active</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-serif leading-tight ${titleClass}`}>
            Executive <span className="italic opacity-70">Workspace Dashboard</span>
          </h1>
          <p className={`text-xs md:text-sm mt-2 max-w-2xl leading-relaxed ${subtextClass}`}>
            Centralized hub for opportunity web clips, connected destination health, job application pipelines, and AI digest insights.
          </p>
        </div>

        {/* Quick Action Button Hub */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenManualAddModal}
            className="px-4 py-2.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-semibold shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Clip Opportunity</span>
          </button>

          <button
            onClick={toggleExtensionWidget}
            className={`px-4 py-2.5 rounded-sm border font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
              isLight ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50' :
              isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' :
              'bg-[#080808] text-stone-200 border-white/10 hover:border-amber-500/40'
            }`}
          >
            <Puzzle className="w-4 h-4 text-amber-500" />
            <span>Clipper Extension</span>
          </button>

          <button
            onClick={onRefreshSync}
            disabled={isRefreshing}
            className={`p-2.5 rounded-sm border transition-colors ${
              isLight ? 'bg-white text-slate-600 border-slate-300 hover:text-amber-600' :
              isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' :
              'bg-[#080808] text-stone-400 hover:text-amber-400 border-white/10'
            }`}
            title="Sync All Destinations"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (Mini Pages) */}
      <div className={`flex items-center gap-2 pb-2 border-b overflow-x-auto ${
        isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
      }`}>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold shadow-sm'
              : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-200/60' : 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activity')}
          className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeSubTab === 'activity'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold shadow-sm'
              : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-200/60' : 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Activity & Streak</span>
          <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded font-mono">14 Days</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeSubTab === 'analytics'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold shadow-sm'
              : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-200/60' : 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Clipped Analytics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('action_hub')}
          className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeSubTab === 'action_hub'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold shadow-sm'
              : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-200/60' : 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>AI Action Center</span>
          <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.2 rounded font-mono">2 Recs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap ${
            activeSubTab === 'logs'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 font-semibold shadow-sm'
              : isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-200/60' : 'border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sync Audit Stream</span>
        </button>
      </div>

      {/* GitHub/LeetCode Style Clipping Activity Matrix & Streak Grid */}
      {(activeSubTab === 'overview' || activeSubTab === 'activity') && (
        <div className={`rounded-sm p-6 space-y-5 border transition-all ${
          isLight ? 'bg-gradient-to-br from-emerald-500/5 via-white to-slate-50 border-emerald-500/30 text-slate-900 shadow-sm' :
          isDark ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-[#080808] border-emerald-500/25 text-slate-100 shadow-xl' :
          'bg-gradient-to-br from-emerald-950/40 via-[#080808] to-[#050505] border-emerald-500/30 text-white shadow-2xl'
        }`}>
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h2 className={`text-xl font-serif flex items-center gap-2 ${titleClass}`}>
                    Clipping Activity & Contribution Matrix
                  </h2>
                  <p className={`text-xs mt-0.5 ${subtextClass}`}>
                    GitHub/LeetCode style daily commit map of web items saved & synced.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30 uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                <span>14 Day Streak</span>
              </span>
              <div className="h-6 w-px bg-stone-300 dark:bg-stone-800"></div>
              <div className="text-right">
                <p className="text-emerald-400 font-bold">184 Clips</p>
                <p className={`text-[10px] ${subtextClass}`}>THIS YEAR</p>
              </div>
            </div>
          </div>

          {/* Matrix + Side Habit Stats 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left 3 Columns: GitHub Green Contribution Matrix */}
            <div className="lg:col-span-3 space-y-3">
              {/* Months Row Header */}
              <div className="flex justify-between text-[10px] font-mono text-emerald-500/80 uppercase px-1">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-1.5 min-w-[580px]">
                  {heatmapWeeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1.5">
                      {week.map((day, dIndex) => {
                        let colorClass = isLight 
                          ? 'bg-slate-200 border-slate-300' 
                          : 'bg-stone-900/80 border-stone-800';
                        
                        if (day.count === 1) {
                          colorClass = 'bg-emerald-900/70 border-emerald-700/60 text-emerald-300';
                        } else if (day.count === 2) {
                          colorClass = 'bg-emerald-600 border-emerald-500 text-black';
                        } else if (day.count >= 3) {
                          colorClass = 'bg-emerald-400 border-emerald-300 text-black shadow-sm shadow-emerald-500/40';
                        }

                        return (
                          <div
                            key={dIndex}
                            onMouseEnter={() => setHoveredHeatCell({ date: day.date, count: day.count })}
                            onMouseLeave={() => setHoveredHeatCell(null)}
                            className={`w-3.5 h-3.5 rounded-sm border transition-all transform hover:scale-125 hover:z-10 cursor-pointer ${colorClass} ${
                              day.isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''
                            }`}
                            title={`${day.date}: ${day.count} items saved`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend & Hover Info */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-emerald-400 font-semibold">
                  {hoveredHeatCell ? `${hoveredHeatCell.date}: ${hoveredHeatCell.count} saved clips` : 'Hover over cells for daily details'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className={subtextClass}>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-stone-900 border border-stone-800"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-900/70 border border-emerald-700"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-600 border border-emerald-500"></div>
                  <div className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-300"></div>
                  <span className={subtextClass}>More</span>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Mini Habit & Goal Tracker Panel */}
            <div className={`p-4 border rounded-sm space-y-3 font-mono text-xs ${
              isLight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-950/20 border-emerald-500/30'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">DAILY HABIT GOAL</span>
                <span className="text-emerald-400 font-bold">5/5 SAVED</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-full rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className={subtextClass}>Peak Engagement:</span>
                  <span className="text-emerald-400 font-medium">2:00 - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className={subtextClass}>Consistency Index:</span>
                  <span className="text-emerald-400 font-medium">94% (Top 5%)</span>
                </div>
                <div className="flex justify-between">
                  <span className={subtextClass}>Longest Streak:</span>
                  <span className="text-stone-300 font-medium">28 Days</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Metrics Row - 4 High Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Saved Vault Items */}
        <div 
          onClick={() => setActiveTab('clips')}
          className={`group cursor-pointer rounded-sm p-5 transition-all relative overflow-hidden border ${cardBgClass}`}
        >
          <div className="flex items-center justify-between opacity-80 mb-3">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">SAVED VAULT</span>
            <div className={`w-8 h-8 rounded-sm border flex items-center justify-center ${innerBgClass}`}>
              <Bookmark className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-serif ${titleClass}`}>{totalClips}</span>
            <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this week
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-sans truncate ${subtextClass}`}>
            {clips.filter(c => c.type === 'job').length} Job Cards • {clips.filter(c => c.type === 'article').length} Articles
          </p>
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-amber-500 group-hover:underline">
            <span>Explore Vault</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2: Active Destination Uplinks */}
        <div 
          onClick={() => setActiveTab('connections')}
          className={`group cursor-pointer rounded-sm p-5 transition-all relative overflow-hidden border ${cardBgClass}`}
        >
          <div className="flex items-center justify-between opacity-80 mb-3">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">UPLINK PIPELINE</span>
            <div className={`w-8 h-8 rounded-sm border flex items-center justify-center ${innerBgClass}`}>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-serif ${titleClass}`}>{activeDestinations.length} <span className="opacity-50 text-lg">/ {destinations.length}</span></span>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              100% OK
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-sans truncate ${subtextClass}`}>
            Google Sheets, Notion, Webhooks active
          </p>
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-amber-500 group-hover:underline">
            <span>Manage Connections</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Total Synced Payloads */}
        <div 
          onClick={() => setActiveTab('connections')}
          className={`group cursor-pointer rounded-sm p-5 transition-all relative overflow-hidden border ${cardBgClass}`}
        >
          <div className="flex items-center justify-between opacity-80 mb-3">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">ITEMS SYNCED</span>
            <div className={`w-8 h-8 rounded-sm border flex items-center justify-center ${innerBgClass}`}>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-mono text-amber-500 font-bold">{totalSynced}</span>
            <span className={`text-[10px] font-mono ${subtextClass}`}>
              {logs.length} Log Entries
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-sans truncate ${subtextClass}`}>
            Auto-formatted JSON & tabular rows
          </p>
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-amber-500 group-hover:underline">
            <span>View Sync Audit</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Job Application Funnel */}
        <div 
          onClick={() => setActiveTab('jobs')}
          className={`group cursor-pointer rounded-sm p-5 transition-all relative overflow-hidden border ${cardBgClass}`}
        >
          <div className="flex items-center justify-between opacity-80 mb-3">
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">JOB PIPELINE</span>
            <div className={`w-8 h-8 rounded-sm border flex items-center justify-center ${innerBgClass}`}>
              <Briefcase className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-serif ${titleClass}`}>{jobs.length}</span>
            <span className="text-[10px] font-mono text-violet-500">
              {interviewingJobsCount} Interviewing
            </span>
          </div>
          <p className={`text-[11px] mt-2 font-sans truncate ${subtextClass}`}>
            {appliedJobsCount} Applied • {offerJobsCount} Offers
          </p>
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-amber-500 group-hover:underline">
            <span>Open Job Kanban</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Recent Opportunity Clips & Job Funnel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Clips Stream */}
          <div className={`rounded-sm p-6 space-y-5 border ${cardBgClass}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div>
                <h2 className={`text-xl font-serif flex items-center gap-2 ${titleClass}`}>
                  <Bookmark className="w-5 h-5 text-amber-500" />
                  Recent Opportunity Clips
                </h2>
                <p className={`text-xs mt-0.5 ${subtextClass}`}>
                  Captured web snippets, job postings, and research notes.
                </p>
              </div>

              {/* Quick Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative w-40">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dashboardSearch}
                    onChange={e => setDashboardSearch(e.target.value)}
                    placeholder="Filter clips..."
                    className={`w-full pl-8 pr-2 py-1 text-xs rounded-sm border focus:border-amber-500 outline-none font-sans ${
                      isLight ? 'bg-slate-100 text-slate-900 border-slate-300 placeholder:text-slate-400' :
                      isDark ? 'bg-slate-800 text-slate-100 border-slate-700 placeholder:text-slate-500' :
                      'bg-[#050505] text-stone-200 border-white/10 placeholder:text-stone-600'
                    }`}
                  />
                </div>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className={`px-2.5 py-1 text-xs rounded-sm border font-mono ${
                    isLight ? 'bg-slate-100 text-slate-800 border-slate-300' :
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' :
                    'bg-[#050505] text-stone-300 border-white/10'
                  }`}
                >
                  <option value="all">ALL TYPES</option>
                  <option value="job">JOBS</option>
                  <option value="article">ARTICLES</option>
                  <option value="deal">DEALS</option>
                  <option value="general">GENERAL</option>
                </select>
              </div>
            </div>

            {/* Clips List */}
            <div className="space-y-3">
              {filteredClips.slice(0, 5).map(clip => (
                <div
                  key={clip.id}
                  className={`p-4 border rounded-sm transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' :
                    isDark ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600' :
                    'bg-[#050505] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        {clip.type}
                      </span>
                      <span className={`text-[10px] font-mono ${subtextClass}`}>
                        {clip.sourceApp}
                      </span>
                      <span className="opacity-40 text-xs">•</span>
                      <span className={`text-[10px] font-mono ${subtextClass}`}>
                        {new Date(clip.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className={`font-serif text-base group-hover:text-amber-500 transition-colors truncate ${titleClass}`}>
                      {clip.title}
                    </h3>

                    {/* Extracted Metadata Pills */}
                    {clip.extractedData && (
                      <div className={`flex items-center gap-3 text-xs font-sans flex-wrap ${subtextClass}`}>
                        {clip.extractedData.company && (
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 opacity-60" />
                            {clip.extractedData.company}
                          </span>
                        )}
                        {clip.extractedData.salary && (
                          <span className="flex items-center gap-1 text-emerald-500 font-mono text-[11px]">
                            <DollarSign className="w-3 h-3" />
                            {clip.extractedData.salary}
                          </span>
                        )}
                        {clip.extractedData.location && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 opacity-60" />
                            {clip.extractedData.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleFavorite(clip.id)}
                      className={`p-2 rounded-sm border transition-colors ${
                        clip.isFavorite
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                          : isLight ? 'border-slate-300 text-slate-500 hover:text-slate-900' : 'border-white/5 text-stone-500 hover:text-white'
                      }`}
                      title={clip.isFavorite ? 'Unfavorite' : 'Favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-500' : ''}`} />
                    </button>

                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-sm border transition-colors ${
                        isLight ? 'border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400' :
                        isDark ? 'border-slate-700 text-slate-400 hover:text-white' :
                        'border-white/5 text-stone-400 hover:text-white hover:border-white/20'
                      }`}
                      title="Open Source Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}

              {filteredClips.length === 0 && (
                <div className={`p-8 text-center border rounded-sm ${innerBgClass}`}>
                  <Bookmark className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                  <p className={`text-xs font-serif ${subtextClass}`}>No opportunity clips match your query.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('clips')}
                className="text-xs font-mono uppercase tracking-wider text-amber-500 hover:underline flex items-center gap-1"
              >
                View all {clips.length} clips in Vault <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Job Kanban Funnel Progress Overview */}
          <div className={`rounded-sm p-6 space-y-5 border ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div>
                <h2 className={`text-xl font-serif flex items-center gap-2 ${titleClass}`}>
                  <Briefcase className="w-5 h-5 text-violet-400" />
                  Job Application Pipeline Status
                </h2>
                <p className={`text-xs mt-0.5 ${subtextClass}`}>
                  Real-time breakdown of job applications tracked in your Kanban board.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('jobs')}
                className="px-3 py-1.5 rounded-sm bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-mono uppercase tracking-wider hover:bg-violet-500/20 transition-colors flex items-center gap-1.5"
              >
                <span>Open Kanban</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`p-4 border rounded-sm text-center space-y-1 ${innerBgClass}`}>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${subtextClass}`}>SAVED</span>
                <p className={`text-2xl font-serif ${titleClass}`}>{savedJobsCount}</p>
                <div className="w-full bg-stone-300 dark:bg-stone-800 h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-stone-500 h-full" style={{ width: `${jobs.length ? (savedJobsCount/jobs.length)*100 : 0}%` }}></div>
                </div>
              </div>

              <div className={`p-4 border rounded-sm text-center space-y-1 ${innerBgClass}`}>
                <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest">APPLIED</span>
                <p className={`text-2xl font-serif ${titleClass}`}>{appliedJobsCount}</p>
                <div className="w-full bg-stone-300 dark:bg-stone-800 h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-blue-500 h-full" style={{ width: `${jobs.length ? (appliedJobsCount/jobs.length)*100 : 0}%` }}></div>
                </div>
              </div>

              <div className={`p-4 border rounded-sm text-center space-y-1 ${innerBgClass}`}>
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">INTERVIEWING</span>
                <p className={`text-2xl font-serif ${titleClass}`}>{interviewingJobsCount}</p>
                <div className="w-full bg-stone-300 dark:bg-stone-800 h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-500 h-full" style={{ width: `${jobs.length ? (interviewingJobsCount/jobs.length)*100 : 0}%` }}></div>
                </div>
              </div>

              <div className={`p-4 border rounded-sm text-center space-y-1 ${innerBgClass}`}>
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">OFFERS</span>
                <p className={`text-2xl font-serif ${titleClass}`}>{offerJobsCount}</p>
                <div className="w-full bg-stone-300 dark:bg-stone-800 h-1 rounded-full overflow-hidden mt-2">
                  <div className="bg-emerald-500 h-full" style={{ width: `${jobs.length ? (offerJobsCount/jobs.length)*100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* New Visual Analytics Card */}
          <div className={`rounded-sm p-6 space-y-5 border ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div>
                <h2 className={`text-xl font-serif flex items-center gap-2 ${titleClass}`}>
                  <BarChart2 className="w-5 h-5 text-blue-400" />
                  Category Velocity & Source Usage
                </h2>
                <p className={`text-xs mt-0.5 ${subtextClass}`}>
                  Visual breakdown of saved content categories, device sources, and extraction habits.
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                REAL-TIME METRICS
              </span>
            </div>

            {/* Sub Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Velocity Progress Bars */}
              <div className={`p-4 border rounded-sm space-y-3 ${innerBgClass}`}>
                <h3 className={`text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold`}>
                  Top Saved Categories
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={titleClass}>Job Applications</span>
                      <span className="font-mono text-amber-500">42% (77 clips)</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={titleClass}>Tech Articles & Docs</span>
                      <span className="font-mono text-blue-400">28% (51 shadow)</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={titleClass}>Research & Whitepapers</span>
                      <span className="font-mono text-emerald-400">18% (33 clips)</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={titleClass}>Software Deals & Tools</span>
                      <span className="font-mono text-violet-400">12% (23 clips)</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-violet-400 h-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Usage & Extraction Speedometer Dial */}
              <div className={`p-4 border rounded-sm space-y-3 ${innerBgClass}`}>
                <h3 className={`text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold`}>
                  Source & Device Usage
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={subtextClass}>Desktop Peeking Extension</span>
                      <span className="font-mono text-emerald-400 font-bold">78%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={subtextClass}>Mobile Web App</span>
                      <span className="font-mono text-blue-400 font-bold">15%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={subtextClass}>Webhook & API Ingestion</span>
                      <span className="font-mono text-amber-500 font-bold">7%</span>
                    </div>
                    <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: '7%' }}></div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-black/20 border border-white/5 text-[10px] font-mono text-stone-400 flex items-center justify-between">
                    <span>AI Extraction Confidence:</span>
                    <span className="text-emerald-400 font-bold">98.6% Accurate</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Webhook & Payload Ingest Inspector Terminal */}
          <div className={`rounded-sm p-6 space-y-4 border ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className={`text-lg font-serif ${titleClass}`}>Live Webhook & Payload Inspector</h3>
                  <p className={`text-xs mt-0.5 ${subtextClass}`}>
                    Monitors extension events, API webhooks, and raw JSON payload transformations in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Endpoint Ready
                </span>
              </div>
            </div>

            {/* Live Terminal Log Viewer */}
            <div className="bg-[#030303] border border-white/10 rounded-sm p-4 font-mono text-xs space-y-2 text-stone-300">
              <div className="flex items-center justify-between text-[10px] text-stone-500 border-b border-white/5 pb-2">
                <span>POST https://api.saveapp.io/v1/ingest/clip</span>
                <span className="text-amber-400">HEADERS: Bearer aes256_sec_token</span>
              </div>

              <div className="text-[11px] space-y-1.5 pt-1 text-emerald-400">
                <div className="flex items-start gap-2">
                  <span className="text-stone-500">[13:48:02]</span>
                  <span className="text-blue-400 font-bold">HTTP 200 OK</span>
                  <span className="text-stone-300">Extracted metadata from "Senior Full Stack Engineer"</span>
                </div>
                <div className="flex items-start gap-2 text-stone-400">
                  <span className="text-stone-500">[13:42:15]</span>
                  <span className="text-blue-400 font-bold">HTTP 200 OK</span>
                  <span className="text-stone-300">Synced 1 bookmark to Notion & Google Sheets</span>
                </div>
                <div className="flex items-start gap-2 text-stone-400">
                  <span className="text-stone-500">[13:30:00]</span>
                  <span className="text-emerald-400 font-bold">EVENT</span>
                  <span className="text-stone-300">Peeking Floating Widget Edge Trigger Triggered</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                <span className="text-stone-500">PAYLOAD LATENCY: 142ms</span>
                <button
                  onClick={() => alert('Test webhook payload sent! Status 200 OK')}
                  className="text-amber-400 hover:text-amber-300 underline font-mono"
                >
                  [ Send Test Payload ]
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Integrations & AI Digest Spotlight */}
        <div className="space-y-8">
          
          {/* AI Action Center Card */}
          <div className={`border rounded-sm p-6 space-y-4 relative overflow-hidden shadow-xl ${
            isLight ? 'bg-gradient-to-br from-violet-500/5 via-amber-500/5 to-white border-violet-500/30 text-slate-900' :
            isDark ? 'bg-slate-900 border-violet-500/30 text-slate-100' :
            'bg-[#080808] border-violet-500/30 text-white'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className={`text-lg font-serif ${titleClass}`}>AI Action Center</h3>
              </div>
              <span className="text-[9px] font-mono uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Agent
              </span>
            </div>

            <p className={`text-xs ${subtextClass}`}>Found 2 high-impact opportunity recommendations for your pipeline:</p>

            {/* Action Item 1 */}
            <div className={`p-3.5 border rounded-sm space-y-2 text-xs ${innerBgClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/30 uppercase">
                  Action Item 1
                </span>
                <span className="text-[9px] font-mono text-stone-400">High Impact</span>
              </div>
              <p className={`font-serif font-medium ${titleClass}`}>
                Senior Engineer position saved 2 days ago requires follow-up.
              </p>
              <p className={`text-[11px] leading-relaxed ${subtextClass}`}>
                Average response rate increases by 42% when applying within 3 days of bookmarking.
              </p>
              <button
                onClick={() => setActiveTab('jobs')}
                className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Review & Apply Now</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Action Item 2 */}
            <div className={`p-3.5 border rounded-sm space-y-2 text-xs ${innerBgClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase">
                  Optimization 2
                </span>
                <span className="text-[9px] font-mono text-stone-400">Auto-Tag</span>
              </div>
              <p className={`font-serif font-medium ${titleClass}`}>
                Auto-extract salary metrics for 3 uncategorized clips.
              </p>
              <button
                onClick={() => setActiveTab('clips')}
                className="w-full py-1.5 px-3 rounded border border-white/10 hover:border-amber-500/40 font-mono text-[10px] uppercase text-stone-300 hover:text-white transition-colors"
              >
                Run AI Auto-Tagging
              </button>
            </div>
          </div>

          {/* Connected Integrations Quick Widget */}
          <div className={`rounded-sm p-6 space-y-4 border ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div>
                <h3 className={`text-lg font-serif flex items-center gap-2 ${titleClass}`}>
                  <Radio className="w-4 h-4 text-amber-500" />
                  Active Integrations
                </h3>
                <p className={`text-[11px] mt-0.5 ${subtextClass}`}>
                  Target storage destinations for clips.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('connections')}
                className="text-[10px] font-mono text-amber-500 uppercase tracking-wider hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {destinations.map(dest => {
                const isPinging = pingingDestId === dest.id;

                return (
                  <div
                    key={dest.id}
                    className={`p-3 border rounded-sm flex items-center justify-between text-xs ${innerBgClass}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded border shrink-0 ${cardBgClass}`}>
                        {renderDestIcon(dest.type, 'w-4 h-4')}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <p className={`font-medium truncate ${titleClass}`}>{dest.name}</p>
                          {dest.isDefault && (
                            <span className="text-[8px] font-mono uppercase bg-amber-500/20 text-amber-500 px-1 rounded border border-amber-500/30">
                              DEF
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-mono truncate ${subtextClass}`}>
                          {dest.targetResourceName || 'Configured'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {dest.connected ? (
                        <button
                          onClick={() => handleTestPingDest(dest.id)}
                          disabled={isPinging}
                          className="px-2 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-mono uppercase hover:bg-emerald-500/20 flex items-center gap-1"
                        >
                          {isPinging ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          <span>Ping</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('connections')}
                          className="px-2 py-1 rounded-sm bg-stone-700 text-stone-300 text-[9px] font-mono uppercase hover:text-white"
                        >
                          Off
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Digest Spotlight Card */}
          <div className={`border rounded-sm p-6 space-y-4 relative overflow-hidden shadow-xl ${
            isLight ? 'bg-gradient-to-br from-amber-500/5 to-white border-amber-500/30 text-slate-900' :
            isDark ? 'bg-slate-900 border-amber-500/30 text-slate-100' :
            'bg-[#080808] border-amber-500/30 text-white'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className={`flex items-center justify-between pb-3 border-b relative z-10 ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className={`text-lg font-serif ${titleClass}`}>AI Weekly Synthesis</h3>
              </div>
              <span className="text-[9px] font-mono uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                PRO AI
              </span>
            </div>

            <div className={`space-y-3 relative z-10 text-xs font-sans leading-relaxed ${subtextClass}`}>
              <p className="italic">
                "High salary trajectory detected in senior engineering roles saved this week. Average compensation range: <span className="text-emerald-500 font-mono font-semibold">$150,000 - $185,000</span>."
              </p>
              <div className={`p-3 border rounded-sm space-y-1 font-mono text-[11px] ${innerBgClass}`}>
                <p className="text-amber-500 font-medium">• Key Skill Match: TypeScript, React, Cloud SQL</p>
                <p>• Top Market Tag: #Remote #StaffEngineer</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('digest')}
              className="w-full py-2.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 relative z-10"
            >
              <span>Explore AI Digest Insights</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Sync Audit Mini Stream */}
          <div className={`rounded-sm p-6 space-y-4 border ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-slate-200' : isDark ? 'border-slate-800' : 'border-white/5'
            }`}>
              <h3 className={`text-lg font-serif flex items-center gap-2 ${titleClass}`}>
                <Clock className="w-4 h-4 text-amber-500" />
                Recent Sync Logs
              </h3>
              <span className={`text-[10px] font-mono ${subtextClass}`}>{logs.length} logged</span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              {logs.slice(0, 4).map(log => (
                <div key={log.id} className={`p-2.5 border rounded-sm space-y-1 ${innerBgClass}`}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-500 font-semibold">{log.destinationName}</span>
                    <span className={subtextClass}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`font-sans text-xs truncate ${titleClass}`}>{log.clipTitle}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
