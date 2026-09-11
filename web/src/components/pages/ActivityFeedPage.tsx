import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  Copy, 
  Play, 
  Pause, 
  Clock, 
  Layers, 
  ArrowUpRight,
  Filter,
  Flame,
  Bookmark,
  Calendar,
  Zap,
  CheckCircle,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  Headphones,
  Briefcase,
  Activity,
  Infinity as InfinityIcon,
  HardDrive,
  Share2
} from 'lucide-react';
import { ClipItem, DestinationConfig, JobCard, ConnectionSyncLog } from '../../types';
import { TabType } from '../layout/Sidebar';

export interface ActivityFeedPageProps {
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
  theme?: 'terminal' | 'dark' | 'light';
  searchQuery?: string;
  onSendToDestination?: (clip: ClipItem, destType: string) => void;
}

export type TimeframeType = 'today' | 'week' | 'all';
export type FeedCategoryType = 'all' | 'action_required' | 'articles' | 'opportunities' | 'audio' | 'sync_logs';

export const ActivityFeedPage: React.FC<ActivityFeedPageProps> = ({
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
  theme = 'dark',
  searchQuery = '',
  onSendToDestination
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [timeframe, setTimeframe] = useState<TimeframeType>('today');
  const [selectedCategory, setSelectedCategory] = useState<FeedCategoryType>('all');

  // Filter Categories Specification matching Stitch
  const filterCategories = useMemo(() => [
    {
      id: 'all' as FeedCategoryType,
      label: 'All Activity',
      icon: <InfinityIcon className="w-4 h-4" />,
      count: clips.length + jobs.length,
      badgeColor: 'text-[#3fe769]'
    },
    {
      id: 'action_required' as FeedCategoryType,
      label: 'Action Required',
      icon: <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />,
      count: 3, // High-priority matches & deadlines
      badgeColor: 'text-amber-400'
    },
    {
      id: 'articles' as FeedCategoryType,
      label: 'Articles & Papers',
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      count: clips.filter(c => c.type === 'research' || c.type === 'article').length || 4,
      badgeColor: 'text-sky-400'
    },
    {
      id: 'opportunities' as FeedCategoryType,
      label: 'Opportunities',
      icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
      count: jobs.length || 5,
      badgeColor: 'text-emerald-400'
    },
    {
      id: 'audio' as FeedCategoryType,
      label: 'Audio',
      icon: <Headphones className="w-4 h-4 text-purple-400" />,
      count: 2,
      badgeColor: 'text-purple-400'
    },
    {
      id: 'sync_logs' as FeedCategoryType,
      label: 'Sync Logs',
      icon: <RefreshCw className="w-4 h-4 text-[#3fe769]" />,
      count: logs.length || 8,
      badgeColor: 'text-[#3fe769]'
    }
  ], [clips, jobs, logs]);

  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [digestGenerated, setDigestGenerated] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(8);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [quickIngestUrl, setQuickIngestUrl] = useState('');
  const [syncedDestinations, setSyncedDestinations] = useState<Record<string, boolean>>({
    'arxiv-notion': true,
    'arxiv-googlesheets': true,
    'spotify-notion': true,
  });

  const handleCopySummary = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast('Takeaway summary copied to clipboard!');
    setTimeout(() => setCopyToast(null), 2500);
  };

  const toggleDestinationSync = (cardId: string, destName: string) => {
    const key = `${cardId}-${destName.toLowerCase().replace(/\s+/g, '')}`;
    const newState = !syncedDestinations[key];
    setSyncedDestinations(prev => ({ ...prev, [key]: newState }));
    setCopyToast(newState ? `Synced to ${destName}!` : `Removed sync to ${destName}`);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleToggleWatchlist = () => {
    setIsWatchlisted(prev => {
      const next = !prev;
      setCopyToast(next ? 'Added to Career Watchlist!' : 'Removed from Career Watchlist');
      setTimeout(() => setCopyToast(null), 2500);
      return next;
    });
  };

  const handleQuickIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIngestUrl.trim()) return;
    setCopyToast(`Ingested item from ${quickIngestUrl.trim().slice(0, 24)}...`);
    setQuickIngestUrl('');
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleGenerateDeepDigest = () => {
    setIsGeneratingDigest(true);
    setTimeout(() => {
      setIsGeneratingDigest(false);
      setDigestGenerated(true);
    }, 1200);
  };

  return (
    <div className={`w-full min-h-screen px-6 py-8 max-w-[1440px] mx-auto flex flex-col gap-6 ${
      isDark ? 'bg-black text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* ------------------------------------------------------------- */}
      {/* 1. Live Stream Status Banner Header                           */}
      {/* ------------------------------------------------------------- */}
      <div className={`p-4 rounded-2xl border relative overflow-hidden backdrop-blur-md transition-all ${
        isDark ? 'bg-[#0A0A0A]/90 border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#3fe769]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Glowing Emerald Live Pill */}
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full shadow-inner ${
              isDark ? 'bg-[#111111] border border-[#262626]' : 'bg-[#ECFDF5] border border-[#10B981]/30'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isDark ? 'bg-[#3FE769]' : 'bg-[#10B981]'}`}></span>
              </span>
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#3FE769]' : 'text-[#065F46]'
              }`}>
                STREAM LIVE • 12 NEW TODAY
              </span>
            </div>

            <div className={`hidden md:flex items-center gap-2 text-xs font-mono ${
              isDark ? 'text-white/40' : 'text-slate-500'
            }`}>
              <span>Ingestion Pipeline: Active</span>
              <span>•</span>
              <span className={isDark ? 'text-[#3FE769]' : 'text-[#047857]'}>0 dropped packets</span>
              <span>•</span>
              <span>Lat: 18ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefreshSync}
              disabled={isRefreshing}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#3FE769] hover:bg-[#1A1A1A]' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3fe769]' : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Stream'}</span>
            </button>

            <button
              onClick={onOpenManualAddModal}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] ${
                isDark
                  ? 'bg-[#EDEDED] hover:bg-white text-black'
                  : 'bg-[#2D6A4F] hover:bg-[#23533e] text-white'
              }`}
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>Save Clip</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Page Title & Timeframe Segmented Control                   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
            Activity &amp; Content Feed
          </h1>
          <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-[#8A8A8A]' : 'text-slate-500'}`}>
            Real-time ingestion stream, AI synthesis, and synced knowledge pipeline.
          </p>
        </div>

        {/* 3-Button Timeframe Control (Today / This Week / All Time) */}
        <div className={`inline-flex items-center p-1 rounded-xl border self-start md:self-auto select-none ${
          isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-slate-100 border-slate-200'
        }`}>
          {(['today', 'week', 'all'] as const).map((t) => {
            const isActive = timeframe === t;
            return (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-lg transition-all capitalize cursor-pointer ${
                  isActive
                    ? isDark 
                      ? 'bg-[#262626] text-white shadow font-semibold' 
                      : 'bg-white text-slate-900 shadow font-semibold'
                    : isDark 
                      ? 'text-[#888888] hover:text-white' 
                      : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'All Time'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Horizontal Ingestion Category Filter Pills                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {filterCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? isDark
                    ? 'bg-[#EDEDED] text-black border-[#EDEDED] font-semibold shadow-sm'
                    : 'bg-[#2D6A4F] text-white border-[#2D6A4F] font-semibold shadow-sm'
                  : isDark
                    ? 'bg-[#0A0A0A] border-[#262626] text-[#A1A1A1] hover:text-white hover:border-[#3A3A3A]'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span className={isActive ? (isDark ? 'text-black' : 'text-white') : ''}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive
                  ? isDark ? 'bg-black/10 text-black font-bold' : 'bg-white/20 text-white font-bold'
                  : isDark ? 'bg-[#181818] text-[#777777]' : 'bg-slate-100 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Main Grid: Stream & AI Digest (Left 2 Col) + Right Rail    */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pinned AI Daily Synthesis Card */}
          <div className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden transition-all ${
            isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {/* Radial ambient glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#3FE769]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center space-x-2">
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
                  isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                }`}>
                  AI Daily Synthesis
                </span>
              </div>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                isDark ? 'text-[#888888] bg-[#141414] border-[#222222]' : 'text-slate-600 bg-slate-100 border-slate-200 font-medium'
              }`}>
                Updated 12m ago
              </span>
            </div>

            {/* Headline & Abstract */}
            <div className="relative z-10">
              <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                High-Density Knowledge Synthesis: MoE Architectures &amp; Bio-Compute Integration
              </h3>
              <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-[#A1A1A1]' : 'text-slate-600'}`}>
                Today's ingestions show strong convergence around sparse Mixture of Experts (MoE) routing efficiency and early biological neural net compute interfaces.
              </p>
            </div>

            {/* 3 Numbered Synthesis Takeaways */}
            <div className="space-y-3 mb-6 relative z-10">
              <div className={`flex items-start space-x-3.5 p-3.5 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212]/90 border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-mono font-bold text-sm shrink-0 pt-0.5 ${
                  isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                }`}>01</span>
                <p className={`text-xs sm:text-sm leading-snug ${
                  isDark ? 'text-[#E5E5E5]' : 'text-slate-800 font-medium'
                }`}>
                  arXiv preprint on dynamic token routing reduces inference compute overhead by 34% without perplexity loss.
                </p>
              </div>

              <div className={`flex items-start space-x-3.5 p-3.5 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212]/90 border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-mono font-bold text-sm shrink-0 pt-0.5 ${
                  isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                }`}>02</span>
                <p className={`text-xs sm:text-sm leading-snug ${
                  isDark ? 'text-[#E5E5E5]' : 'text-slate-800 font-medium'
                }`}>
                  Y Combinator remote role match at Anthropic highlights urgent demand for evals infrastructure engineers.
                </p>
              </div>

              <div className={`flex items-start space-x-3.5 p-3.5 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212]/90 border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`font-mono font-bold text-sm shrink-0 pt-0.5 ${
                  isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                }`}>03</span>
                <p className={`text-xs sm:text-sm leading-snug ${
                  isDark ? 'text-[#E5E5E5]' : 'text-slate-800 font-medium'
                }`}>
                  Spotify interview podcast with Ilya Sutskever outlines next-gen scaling limiters and safety heuristics.
                </p>
              </div>
            </div>

            {/* Footer Metadata & Deep Digest Trigger */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t relative z-10 ${
              isDark ? 'border-[#222222]' : 'border-slate-200'
            }`}>
              <div className={`flex items-center space-x-2 text-xs font-mono ${
                isDark ? 'text-[#888888]' : 'text-slate-500'
              }`}>
                <span>Synthesized from 12 ingested items</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded border ${
                  isDark ? 'bg-[#181818] border-[#282828] text-white' : 'bg-slate-100 border-slate-200 text-slate-700 font-medium'
                }`}>
                  Model: Claude 3.5 Sonnet
                </span>
              </div>

              <div className="flex items-center gap-2">
                {digestGenerated ? (
                  <button
                    onClick={() => setActiveTab('digest')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3FE769] text-black hover:bg-[#34c759] transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Digest Ready • Open Full Digest</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateDeepDigest}
                    disabled={isGeneratingDigest}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center space-x-2 transition-all cursor-pointer ${
                      isDark 
                        ? 'bg-[#111111] border-[#333333] hover:border-[#3FE769] text-white hover:bg-[#1A1A1A]' 
                        : 'bg-[#2D6A4F] border-transparent text-white hover:bg-[#23533e] shadow-sm'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingDigest ? 'animate-spin' : ''} ${isDark ? 'text-[#3FE769]' : 'text-white'}`} />
                    <span>{isGeneratingDigest ? 'Synthesizing Deep Digest...' : 'Generate Deep Digest'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* Chronological Timeline Stream: TODAY                     */}
          {/* --------------------------------------------------------- */}
          <div className="space-y-4">
            {/* Timeline Group Header: TODAY */}
            <div className="flex items-center space-x-4 py-2">
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#888888]' : 'text-slate-500'
              }`}>
                TODAY — September 11, 2026
              </span>
              <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#262626]' : 'bg-slate-200'}`} />
              <span className="text-[11px] font-mono text-[#3FE769]">4 new events</span>
            </div>

            {/* Item 1: arXiv Research Paper Card */}
            <div className={`p-6 rounded-2xl border transition-all hover:border-[#3A3A3A] relative ${
              isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-[#141414] border-[#262626] text-[#3FE769]' : 'bg-[#ECFDF5] border-[#10B981]/30 text-[#047857]'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                    }`}>
                      arXiv:2609.04112
                    </span>
                    <h4 className={`text-base sm:text-lg font-bold tracking-tight transition-colors cursor-pointer ${
                      isDark ? 'text-white hover:text-[#3FE769]' : 'text-slate-900 hover:text-[#2D6A4F]'
                    }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Scaling Mixture of Experts with Dynamic Token Pruning
                    </h4>
                  </div>
                </div>
                <span className={`text-xs font-mono shrink-0 pt-1 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>10:42 AM</span>
              </div>

              <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-[#B4B4B4]' : 'text-slate-600'}`}>
                We introduce a novel gating mechanism that dynamically drops redundant tokens during intermediate routing stages in transformer networks, achieving linear speedup on H100 clusters.
              </p>

              {/* Nested AI Key Takeaway Box */}
              <div className={`p-4 rounded-xl border mb-4 transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222]' : 'bg-emerald-50/50 border-emerald-100'
              }`}>
                <div className="flex items-center space-x-2 mb-1.5">
                  <Zap className={`w-4 h-4 ${isDark ? 'text-[#3FE769] fill-[#3FE769]/20' : 'text-[#2D6A4F] fill-[#2D6A4F]/20'}`} />
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    AI Key Takeaway
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#EDEDED]' : 'text-slate-800 font-medium'}`}>
                  Directly applicable to our local retrieval pipeline. Eliminates 40% memory bandwidth bottleneck in transformer decoding.
                </p>
              </div>

              {/* Bottom Action Rail */}
              <div className={`flex flex-wrap items-center justify-between gap-4 pt-4 border-t ${
                isDark ? 'border-[#222222]' : 'border-slate-200'
              }`}>
                {/* Topic Hashtags */}
                <div className="flex items-center space-x-1.5">
                  {['#AI', '#LLMs', '#MoE'].map(tag => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                        isDark ? 'bg-[#121212] border-[#222222] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Destination Sync & Copy Summary Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleDestinationSync('arxiv', 'Notion')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      syncedDestinations['arxiv-notion']
                        ? isDark
                          ? 'bg-[#141414] border-[#2E2E2E] text-white hover:border-[#3FE769]'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isDark
                          ? 'bg-transparent border-[#222222] text-[#666666]'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${syncedDestinations['arxiv-notion'] ? 'text-[#3FE769]' : 'text-slate-600'}`} />
                    <span>Notion</span>
                  </button>

                  <button
                    onClick={() => toggleDestinationSync('arxiv', 'Google Sheets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      syncedDestinations['arxiv-googlesheets']
                        ? isDark
                          ? 'bg-[#141414] border-[#2E2E2E] text-white hover:border-[#3FE769]'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isDark
                          ? 'bg-transparent border-[#222222] text-[#666666]'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${syncedDestinations['arxiv-googlesheets'] ? 'text-[#3FE769]' : 'text-slate-600'}`} />
                    <span>Google Sheets</span>
                  </button>

                  <button
                    onClick={() => handleCopySummary('Scaling Mixture of Experts with Dynamic Token Pruning: Eliminates 40% memory bandwidth bottleneck in transformer decoding.')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#111111] border-[#333333] hover:border-[#3FE769] text-white hover:text-[#3FE769]'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* Item 2: Spotify Audio Podcast Bookmark Card               */}
            {/* --------------------------------------------------------- */}
            <div className={`p-6 rounded-2xl border transition-all hover:border-[#3A3A3A] relative ${
              isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-[#141414] border-[#262626] text-[#3FE769]' : 'bg-[#ECFDF5] border-[#10B981]/30 text-[#047857]'
                  }`}>
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                    }`}>
                      Spotify • The Cognitive Architect
                    </span>
                    <h4 className={`text-base sm:text-lg font-bold tracking-tight transition-colors cursor-pointer ${
                      isDark ? 'text-white hover:text-[#3FE769]' : 'text-slate-900 hover:text-[#2D6A4F]'
                    }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Ep. 84: Safe Superintelligence &amp; Algorithmic Guardrails
                    </h4>
                  </div>
                </div>
                <span className={`text-xs font-mono shrink-0 pt-1 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>09:15 AM</span>
              </div>

              {/* Interactive Audio Waveform Player */}
              <div className={`p-4 rounded-xl border mb-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Play / Pause Circular Trigger */}
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-11 h-11 rounded-full bg-[#3FE769] hover:bg-[#34C759] text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-md"
                  title={isPlayingAudio ? 'Pause episode' : 'Play episode preview'}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5 fill-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  )}
                </button>

                {/* Waveform & Duration */}
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center justify-between text-xs font-mono mb-1.5 ${
                    isDark ? 'text-[#888888]' : 'text-slate-500'
                  }`}>
                    <span className={`font-bold ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`}>
                      {isPlayingAudio ? '14:22 [Playing]' : '14:22'}
                    </span>
                    <span>48:10</span>
                  </div>

                  {/* Multi-bar Waveform Visualizer */}
                  <div className="h-8 flex items-center gap-1 overflow-x-auto py-1 select-none">
                    {[16, 24, 32, 20, 12, 8, 20, 28, 16, 24, 12, 20, 32, 16, 24, 8, 20, 28, 12, 16, 24, 12, 20, 8].map((h, i) => {
                      const isPlayed = i <= audioProgress;
                      return (
                        <div
                          key={i}
                          onClick={() => setAudioProgress(i)}
                          className={`w-1 rounded-full cursor-pointer transition-all duration-200 ${
                            isPlayed 
                              ? `bg-[#3FE769] ${isPlayingAudio && i % 2 === 0 ? 'animate-pulse' : ''}` 
                              : isDark ? 'bg-[#333333] hover:bg-[#555555]' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                          style={{ height: `${h}px` }}
                          title={`Jump to ${Math.floor((i / 24) * 48)}m`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Auto-routed Pill */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 self-start sm:self-center border ${
                  isDark ? 'bg-[#181818] border-[#282828] text-[#888888]' : 'bg-[#ECFDF5] border-[#10B981]/30 text-[#047857]'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-[#3FE769]' : 'bg-[#10B981]'}`} />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-[#065F46]'}`}>Auto-routed</span>
                </div>
              </div>

              {/* Bottom Action Rail */}
              <div className={`flex flex-wrap items-center justify-between gap-4 pt-4 border-t ${
                isDark ? 'border-[#222222]' : 'border-slate-200'
              }`}>
                {/* Hashtag Pills */}
                <div className="flex items-center space-x-1.5">
                  {['#Podcast', '#Safety', '#Scaling'].map(tag => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                        isDark ? 'bg-[#121212] border-[#222222] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Sync & Copy Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleDestinationSync('spotify', 'Notion')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      syncedDestinations['spotify-notion']
                        ? isDark
                          ? 'bg-[#141414] border-[#2E2E2E] text-white hover:border-[#3FE769]'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isDark
                          ? 'bg-transparent border-[#222222] text-[#666666]'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${syncedDestinations['spotify-notion'] ? 'text-[#3FE769]' : 'text-slate-600'}`} />
                    <span>Notion</span>
                  </button>

                  <button
                    onClick={() => handleCopySummary('Ep. 84: Safe Superintelligence & Algorithmic Guardrails (Ilya Sutskever) — Scaling limiters, alignment evals, and safety architectures.')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#111111] border-[#333333] hover:border-[#3FE769] text-white hover:text-[#3FE769]'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Summary</span>
                  </button>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* Item 3: Y Combinator Job & Opportunity Card               */}
            {/* --------------------------------------------------------- */}
            <div className={`p-6 rounded-2xl border transition-all hover:border-[#3A3A3A] relative ${
              isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-[#141414] border-[#262626] text-[#3FE769]' : 'bg-[#ECFDF5] border-[#10B981]/30 text-[#047857]'
                  }`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                      }`}>
                        Y Combinator • W24
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold uppercase tracking-wider border ${
                        isDark ? 'bg-[#3FE769]/15 text-[#3FE769] border-[#3FE769]/30' : 'bg-emerald-100 text-[#047857] border-emerald-200'
                      }`}>
                        MATCH: 98%
                      </span>
                    </div>
                    <h4 className={`text-base sm:text-lg font-bold tracking-tight transition-colors cursor-pointer ${
                      isDark ? 'text-white hover:text-[#3FE769]' : 'text-slate-900 hover:text-[#2D6A4F]'
                    }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Founding AI Systems Engineer — Anthropic Ecosystem
                    </h4>
                  </div>
                </div>
                <span className={`text-xs font-mono shrink-0 pt-1 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>08:30 AM</span>
              </div>

              {/* 3-Column Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-[#888888]' : 'text-slate-500'
                  }`}>
                    Compensation
                  </span>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    $180k - $240k + Equity
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-[#888888]' : 'text-slate-500'
                  }`}>
                    Location / Type
                  </span>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    San Francisco / Hybrid
                  </p>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-[#888888]' : 'text-slate-500'
                  }`}>
                    Match Vector
                  </span>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 truncate ${isDark ? 'text-[#3FE769]' : 'text-[#047857]'}`}>
                    PyTorch + Rust + Vector DBs
                  </p>
                </div>
              </div>

              {/* Bottom Action Rail */}
              <div className={`flex flex-wrap items-center justify-between gap-4 pt-4 border-t ${
                isDark ? 'border-[#222222]' : 'border-slate-200'
              }`}>
                {/* Hashtags */}
                <div className="flex items-center space-x-1.5">
                  {['#Jobs', '#Remote', '#YCW24'].map(tag => (
                    <span
                      key={tag}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border ${
                        isDark ? 'bg-[#121212] border-[#222222] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Watchlist & Apply Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleWatchlist}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isWatchlisted
                        ? isDark ? 'bg-[#181818] border-[#3FE769] text-[#3FE769]' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isDark
                          ? 'bg-[#111111] border-[#333333] hover:border-[#3FE769] text-white hover:bg-[#1A1A1A]'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isWatchlisted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#3FE769]" />
                        <span>Watchlisted</span>
                      </>
                    ) : (
                      <span>Add to Watchlist</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setCopyToast('Application portal link copied & opened in vault!');
                      setTimeout(() => setCopyToast(null), 2500);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm hover:scale-[1.02] ${
                      isDark
                        ? 'bg-[#EDEDED] hover:bg-white text-black'
                        : 'bg-[#2D6A4F] hover:bg-[#23533e] text-white'
                    }`}
                  >
                    <span>Apply Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Right Rail Contextual Widgets (Destination Health & Deadlines) */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          {/* Destination Sync Status Widget */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-base font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                Destination Sync Status
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                isDark ? 'text-[#3FE769] bg-[#3FE769]/10 border-[#3FE769]/20' : 'text-[#047857] bg-emerald-50 border-emerald-200'
              }`}>
                All Active
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Notion Workspace */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                    isDark ? 'bg-[#181818] border-[#333333] text-white' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                  }`}>
                    N
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notion Workspace</p>
                    <p className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>Synced 2m ago</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00CA50] shadow-sm shadow-[#00CA50]/50" />
              </div>

              {/* Google Sheets Vault */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                    isDark ? 'bg-[#181818] border-[#333333] text-[#3FE769]' : 'bg-emerald-50 border-emerald-200 text-[#047857]'
                  }`}>
                    GS
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Sheets Vault</p>
                    <p className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>Synced 14m ago</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00CA50] shadow-sm shadow-[#00CA50]/50" />
              </div>

              {/* Airtable Research Base */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                    isDark ? 'bg-[#181818] border-[#333333] text-cyan-400' : 'bg-sky-50 border-sky-200 text-sky-700'
                  }`}>
                    A
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Airtable Research Base</p>
                    <p className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>Synced 1h ago</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00CA50] shadow-sm shadow-[#00CA50]/50" />
              </div>

              {/* Spotify Library Sync */}
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs font-mono ${
                    isDark ? 'bg-[#181818] border-[#333333] text-[#3FE769]' : 'bg-emerald-50 border-emerald-200 text-[#047857]'
                  }`}>
                    S
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Spotify Library Sync</p>
                    <p className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>Real-time webhook</p>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00CA50] shadow-sm shadow-[#00CA50]/50" />
              </div>
            </div>

            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
              isDark ? 'border-[#222222] text-[#888888]' : 'border-slate-200 text-slate-500'
            }`}>
              <span>Health: 100%</span>
              <button
                onClick={() => {
                  setCopyToast('Pinged all 4 active destinations! All caches warm.');
                  setTimeout(() => setCopyToast(null), 2500);
                }}
                className={`cursor-pointer transition-colors ${
                  isDark ? 'text-[#3FE769] hover:underline' : 'text-[#2D6A4F] hover:underline font-semibold'
                }`}
              >
                Test Ping All Sinks
              </button>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-base font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                Upcoming Deadlines
              </h4>
              <Calendar className={`w-4 h-4 ${isDark ? 'text-[#888888]' : 'text-slate-400'}`} />
            </div>

            <div className="space-y-4">
              {/* NSF SBIR Phase I */}
              <div className={`pb-3 border-b ${isDark ? 'border-[#222222]' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${
                    isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                  }`}>NSF SBIR Phase I</span>
                  <span className="text-[11px] font-mono text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                    3 Days Left
                  </span>
                </div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quantum Neural Interconnect Proposal</p>
                <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                  Final review pending on draft #4 vector embeddings.
                </p>
              </div>

              {/* YC S26 Batch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${
                    isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                  }`}>YC S26 Batch</span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                    isDark ? 'text-[#888888] bg-[#181818] border-[#282828]' : 'text-slate-600 bg-slate-100 border-slate-200 font-medium'
                  }`}>
                    18 Days Left
                  </span>
                </div>
                <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Founder Video &amp; Traction Metrics</p>
                <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                  Pitch deck synced from Google Drive vault.
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Clip Stream Ingest Scratchpad */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-mono uppercase tracking-wider font-bold ${
                isDark ? 'text-[#888888]' : 'text-slate-600'
              }`}>
                Quick Stream Ingest
              </span>
              <span className={`text-[10px] font-mono ${
                isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F] font-semibold'
              }`}>Live Ingestion</span>
            </div>
            <form onSubmit={handleQuickIngest} className="flex flex-col gap-2">
              <input
                type="text"
                value={quickIngestUrl}
                onChange={(e) => setQuickIngestUrl(e.target.value)}
                placeholder="Paste URL, paper link, or prompt..."
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                  isDark
                    ? 'bg-[#121212] border-[#262626] text-white placeholder-[#666666] focus:border-[#3FE769]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2D6A4F]'
                }`}
              />
              <button
                type="submit"
                className={`w-full py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  isDark
                    ? 'bg-[#181818] hover:bg-[#222222] border-[#333333] hover:border-[#3FE769] text-white'
                    : 'bg-[#2D6A4F] hover:bg-[#23533e] border-transparent text-white shadow-sm'
                }`}
              >
                <span>+ Ingest to Stream</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Copy / Sync Notification Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#111111] border border-[#3FE769]/50 text-white shadow-2xl text-xs font-medium backdrop-blur-lg"
          >
            <CheckCircle className="w-4 h-4 text-[#3FE769]" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityFeedPage;
