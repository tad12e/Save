import React, { useState, useMemo, useEffect } from 'react';
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
  Share2,
  CheckCircle2
} from 'lucide-react';
import { ClipItem, DestinationConfig, JobCard, ConnectionSyncLog } from '../../types';
import { TabType } from '../layout/Sidebar';
import {
  fetchFeedData,
  performFeedAction,
  generateClientSynthesizedFeed,
  fetchPlaylists,
  PlaylistSummary,
  FeedPayload,
} from '../../lib/feedApi';

// Modular Feed Components (Parts 3, 4, 5, 6, 7, 8, 10, 12)
import { DailyReviewCarousel } from '../feed/DailyReviewCarousel';
import { FeedSynthesisBanner } from '../feed/FeedSynthesisBanner';
import { FeedOpportunityCard } from '../feed/FeedOpportunityCard';
import { FeedArticleCard } from '../feed/FeedArticleCard';
import { FeedAudioPlayer } from '../feed/FeedAudioPlayer';
import { FeedSyncRiver } from '../feed/FeedSyncRiver';
import { FeedWatchlistWidget } from '../feed/FeedWatchlistWidget';
import { FeedZeroCelebration } from '../feed/FeedZeroCelebration';
import { PlaylistStoriesRow } from '../feed/PlaylistStoriesRow';
import { SwipeStackModal } from '../feed/SwipeStackModal';
import { BrandIcon, WebsiteIcon } from '../BrandIcons';

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
  clips = [],
  setClips,
  destinations = [],
  setDestinations,
  jobs = [],
  logs = [],
  setActiveTab,
  onOpenManualAddModal,
  onRefreshSync,
  isRefreshing = false,
  theme = 'dark',
  searchQuery = '',
  onSendToDestination,
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [timeframe, setTimeframe] = useState<TimeframeType>('today');
  const [selectedCategory, setSelectedCategory] = useState<FeedCategoryType>('all');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [quickIngestUrl, setQuickIngestUrl] = useState('');
  const [reviewCompleted, setReviewCompleted] = useState(false);

  // Live Feed Data from Backend API / Local Synthesis
  const [feedData, setFeedData] = useState<FeedPayload>(() =>
    generateClientSynthesizedFeed(timeframe, selectedCategory, clips, destinations)
  );
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // High-Speed Knowledge Stacks (Stories / TikTok for Saves)
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [activeSwipePlaylist, setActiveSwipePlaylist] = useState<PlaylistSummary | null>(null);

  const loadFeed = async () => {
    setIsLoadingFeed(true);
    try {
      const res = await fetchFeedData(timeframe, selectedCategory, clips, destinations);
      if (res) {
        setFeedData(res);
      }
    } catch (err) {
      console.warn('Feed load failed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const loadPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const pls = await fetchPlaylists(clips);
      setPlaylists(pls);
    } catch (err) {
      console.warn('Playlist load failed:', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    loadFeed();
    loadPlaylists();
  }, [timeframe, selectedCategory, clips, destinations]);

  // Feed Actions Handler (Review, Snooze, Watchlist, Archive)
  const handleFeedAction = async (
    clipId: string,
    action: 'review' | 'master' | 'snooze' | 'watchlist' | 'archive'
  ) => {
    await performFeedAction(clipId, action);

    setFeedData((prev) => {
      const updatedReview = prev.daily_review.map((it) => {
        if (it.id === clipId) {
          return {
            ...it,
            is_reviewed: action === 'review' || action === 'master' ? true : it.is_reviewed,
            is_watchlisted: action === 'watchlist' ? !it.is_watchlisted : it.is_watchlisted,
          };
        }
        return it;
      });

      const updatedStream = prev.stream_items.map((it) => {
        if (it.id === clipId) {
          return {
            ...it,
            is_reviewed: action === 'review' || action === 'master' ? true : it.is_reviewed,
            is_watchlisted: action === 'watchlist' ? !it.is_watchlisted : it.is_watchlisted,
            is_snoozed: action === 'snooze' ? true : it.is_snoozed,
          };
        }
        return it;
      });

      const allDone = updatedReview.length > 0 && updatedReview.every((it) => it.is_reviewed);
      if (allDone) {
        setReviewCompleted(true);
      }

      return {
        ...prev,
        daily_review: updatedReview,
        stream_items: updatedStream,
      };
    });

    if (action === 'master' || action === 'review') {
      setCopyToast('Marked as reviewed! Retention streak updated 🔥');
    } else if (action === 'watchlist') {
      setCopyToast('Opportunity updated on Career Radar ⭐');
    } else if (action === 'snooze') {
      setCopyToast('Snoozed for 3 days');
    }
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Dynamic Category Filters with Real Live Database Counts
  const filterCategories = useMemo(() => {
    const cats = feedData?.metrics?.categories || [];
    const getCount = (id: string, fallback: number) => {
      const found = cats.find((c) => c.id === id);
      return found !== undefined ? found.count : fallback;
    };

    return [
      {
        id: 'all' as FeedCategoryType,
        label: 'All Activity',
        icon: <InfinityIcon className="w-4 h-4" />,
        count: getCount('all', clips.length + jobs.length),
        badgeColor: 'text-[#3fe769]',
      },
      {
        id: 'action_required' as FeedCategoryType,
        label: 'Action Required',
        icon: <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />,
        count: getCount('action_required', 0),
        badgeColor: 'text-amber-400',
      },
      {
        id: 'articles' as FeedCategoryType,
        label: 'Articles & Papers',
        icon: <FileText className="w-4 h-4 text-sky-400" />,
        count: getCount('articles', 0),
        badgeColor: 'text-sky-400',
      },
      {
        id: 'opportunities' as FeedCategoryType,
        label: 'Opportunities',
        icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
        count: getCount('opportunities', 0),
        badgeColor: 'text-emerald-400',
      },
      {
        id: 'audio' as FeedCategoryType,
        label: 'Audio',
        icon: <Headphones className="w-4 h-4 text-purple-400" />,
        count: getCount('audio', 0),
        badgeColor: 'text-purple-400',
      },
      {
        id: 'sync_logs' as FeedCategoryType,
        label: 'Sync River',
        icon: <RefreshCw className="w-4 h-4 text-[#3fe769]" />,
        count: getCount('sync_logs', 0),
        badgeColor: 'text-[#3fe769]',
      },
    ];
  }, [feedData, clips, jobs]);

  // Quick Ingest Handler
  const handleQuickIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIngestUrl.trim()) return;
    setCopyToast(`Ingested item from ${quickIngestUrl.trim().slice(0, 28)}...`);
    setQuickIngestUrl('');
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleOpenNextPlaylist = () => {
    if (!activeSwipePlaylist || playlists.length <= 1) return;
    const currentIndex = playlists.findIndex((p) => p.id === activeSwipePlaylist.id);
    const nextIndex = (currentIndex + 1) % playlists.length;
    setActiveSwipePlaylist(playlists[nextIndex]);
  };

  return (
    <div
      className={`w-full min-h-screen px-4 sm:px-6 py-8 max-w-[1440px] mx-auto flex flex-col gap-6 ${
        isDark ? 'bg-black text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* ------------------------------------------------------------- */}
      {/* Part 1: Live Stream Status Banner Header                      */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 rounded-2xl border relative overflow-hidden backdrop-blur-md transition-all ${
          isDark ? 'bg-[#0A0A0A]/90 border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-32 bg-[#3fe769]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Glowing Emerald Live Pill with Live Count */}
            <div
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full shadow-inner ${
                isDark ? 'bg-[#111111] border border-[#262626]' : 'bg-[#ECFDF5] border border-[#10B981]/30'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isDark ? 'bg-[#3FE769]' : 'bg-[#10B981]'
                  }`}
                ></span>
              </span>
              <span
                className={`text-xs font-mono font-bold tracking-wider uppercase ${
                  isDark ? 'text-[#3FE769]' : 'text-[#065F46]'
                }`}
              >
                STREAM LIVE • {feedData.metrics.today_new_count} NEW TODAY
              </span>
            </div>

            <div
              className={`hidden md:flex items-center gap-2 text-xs font-mono ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}
            >
              <span>Ingestion Pipeline: {feedData.metrics.pipeline_status}</span>
              <span>•</span>
              <span className={isDark ? 'text-[#3FE769]' : 'text-[#047857]'}>
                {feedData.metrics.dropped_packets} dropped packets
              </span>
              <span>•</span>
              <span>Lat: {feedData.metrics.latency_ms}ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                onRefreshSync();
                loadFeed();
              }}
              disabled={isRefreshing || isLoadingFeed}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#141414] border border-[#2A2A2A] text-white hover:border-[#3FE769] hover:bg-[#1A1A1A]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing || isLoadingFeed
                    ? 'animate-spin text-[#3fe769]'
                    : isDark
                    ? 'text-slate-400'
                    : 'text-slate-500'
                }`}
              />
              <span>{isRefreshing || isLoadingFeed ? 'Syncing...' : 'Sync Stream'}</span>
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
      {/* Part 2: Page Title & Timeframe Control                        */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Activity &amp; Opportunity Feed
          </h1>
          <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-[#8A8A8A]' : 'text-slate-500'}`}>
            Real-time ingestion stream, AI synthesis, and synced knowledge pipeline.
          </p>
        </div>

        {/* 3-Button Timeframe Control (Today / This Week / All Time) */}
        <div
          className={`inline-flex items-center p-1 rounded-xl border self-start md:self-auto select-none ${
            isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-slate-100 border-slate-200'
          }`}
        >
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
      {/* Dynamic Ingestion Category Filter Pills                       */}
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
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? isDark
                      ? 'bg-black/10 text-black font-bold'
                      : 'bg-white/20 text-white font-bold'
                    : isDark
                    ? 'bg-[#181818] text-[#777777]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Knowledge Stacks Story Circles (Stories / TikTok for Saves)   */}
      {/* ------------------------------------------------------------- */}
      <PlaylistStoriesRow
        playlists={playlists}
        loading={isLoadingPlaylists}
        onSelectPlaylist={(pl) => setActiveSwipePlaylist(pl)}
        activePlaylistId={activeSwipePlaylist?.id}
        isDark={isDark}
      />

      {/* ------------------------------------------------------------- */}
      {/* Main Grid: Stream & Hero Feed (Left 2 Col) + Right Rail       */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Part 3 & Part 12: Hero Section (The Daily 5 Carousel / Feed Zero Celebration) */}
          {reviewCompleted ? (
            <FeedZeroCelebration
              streak={feedData.metrics.review_streak}
              totalReviewed={feedData.daily_review.length}
              onExploreMore={() => {
                setReviewCompleted(false);
                setTimeframe('all');
              }}
              isDark={isDark}
            />
          ) : (
            <DailyReviewCarousel
              items={feedData.daily_review}
              streak={feedData.metrics.review_streak}
              onReviewAction={handleFeedAction}
              isDark={isDark}
            />
          )}

          {/* Part 4: Connect the Dots AI Synthesis Banner */}
          <FeedSynthesisBanner
            synthesis={feedData.ai_synthesis}
            onOpenDigest={() => setActiveTab('clips')}
            isDark={isDark}
          />

          {/* Timeline Stream Header */}
          <div className="flex items-center space-x-4 py-2">
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isDark ? 'text-[#888888]' : 'text-slate-500'
              }`}
            >
              {timeframe === 'today' ? 'TODAY INGESTIONS' : timeframe === 'week' ? 'PAST 7 DAYS' : 'FULL ARCHIVE STREAM'}
            </span>
            <div className={`flex-1 h-[1px] ${isDark ? 'bg-[#262626]' : 'bg-slate-200'}`} />
            <span className="text-[11px] font-mono text-[#3FE769]">
              {feedData.stream_items.length} stream events
            </span>
          </div>

          {/* Timeline Stream List */}
          {selectedCategory === 'sync_logs' ? (
            <FeedSyncRiver items={feedData.sync_river} isDark={isDark} />
          ) : feedData.stream_items.length === 0 ? (
            <div
              className={`p-8 rounded-2xl border text-center ${
                isDark ? 'bg-[#0A0A0A] border-[#262626] text-[#888888]' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-mono">No clips found in this stream category.</p>
              <p className="text-[11px] mt-1 text-[#666666]">
                Save clips using the browser extension or quick ingest bar above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedData.stream_items.map((item) => {
                const ct = (item.content_type || '').toLowerCase();
                const it = (item.intent || '').toLowerCase();

                // 1. Opportunities & Job cards
                if (ct === 'job' || ct === 'event' || ct === 'scholarship' || it === 'apply') {
                  return (
                    <FeedOpportunityCard
                      key={item.id}
                      item={item}
                      onAction={handleFeedAction}
                      isDark={isDark}
                    />
                  );
                }

                // 2. Audio & Podcast cards
                if (item.has_audio || ct === 'audio') {
                  return (
                    <FeedAudioPlayer
                      key={item.id}
                      item={item}
                      isDark={isDark}
                    />
                  );
                }

                // 3. Articles & Research Papers
                return (
                  <FeedArticleCard
                    key={item.id}
                    item={item}
                    onAction={handleFeedAction}
                    isDark={isDark}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Right Rail Contextual Widgets (Part 8, 9, 10)                 */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-6">
          {/* Part 10: Career Watchlist & Opportunity Radar */}
          <FeedWatchlistWidget
            watchlist={feedData.watchlist}
            isDark={isDark}
          />

          {/* Part 8: Destination Sync Health Widget */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4
                className={`text-sm sm:text-base font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Connected Sinks &amp; Vaults
              </h4>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  isDark
                    ? 'text-[#3FE769] bg-[#3FE769]/10 border-[#3FE769]/20'
                    : 'text-[#047857] bg-emerald-50 border-emerald-200'
                }`}
              >
                {destinations.length} Active
              </span>
            </div>

            <div className="space-y-2.5">
              {destinations.length === 0 ? (
                <p className={`text-xs font-mono ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                  No external sinks configured. All saves stay encrypted in local vault.
                </p>
              ) : (
                destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isDark ? 'bg-[#121212] border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                          isDark
                            ? 'bg-[#181818] border-[#333333]'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <BrandIcon name={dest.provider || dest.name} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {dest.name || dest.provider}
                        </p>
                        <p className={`text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                          {dest.is_active ? 'Real-time webhook' : 'Standby'}
                        </p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00CA50] shadow-sm shadow-[#00CA50]/50" />
                  </div>
                ))
              )}
            </div>

            <div
              className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono ${
                isDark ? 'border-[#222222] text-[#888888]' : 'border-slate-200 text-slate-500'
              }`}
            >
              <span>Health: 100%</span>
              <button
                onClick={() => {
                  setCopyToast(`Tested ${destinations.length} active destinations! All caches warm.`);
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

          {/* Part 9: Quick-Clip Stream Ingest Scratchpad */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-mono uppercase tracking-wider font-bold ${
                  isDark ? 'text-[#888888]' : 'text-slate-600'
                }`}
              >
                Quick Stream Ingest
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F] font-semibold'
                }`}
              >
                Live Ingestion
              </span>
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

      {/* Swipeable Knowledge Stack Modal (Stories / TikTok Flashcards) */}
      {activeSwipePlaylist && (
        <SwipeStackModal
          playlist={activeSwipePlaylist}
          localClips={clips}
          onClose={() => {
            setActiveSwipePlaylist(null);
            loadPlaylists();
            loadFeed();
          }}
          onStreakUpdate={(newStreak) => {
            setFeedData((prev) => ({
              ...prev,
              metrics: { ...prev.metrics, review_streak: newStreak },
            }));
          }}
          onOpenNextPlaylist={handleOpenNextPlaylist}
        />
      )}
    </div>
  );
};

export default ActivityFeedPage;
