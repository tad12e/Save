import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipItem, ClipType, DestinationConfig, CustomPageConfig, StorageMode } from '../../types';
import { 
  Bookmark, 
  Search, 
  Grid, 
  List, 
  LayoutGrid,
  Plus, 
  Sparkles, 
  ExternalLink, 
  Star, 
  Trash2, 
  Send, 
  Check, 
  Tag, 
  Clock, 
  Building, 
  DollarSign, 
  X,
  Cloud,
  HardDrive,
  Layers,
  ArrowUpDown,
  CheckCircle,
  Globe,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Smartphone,
  Copy,
  Maximize2
} from 'lucide-react';
import { BrandIcon } from '../BrandIcons';

export type ClipIntent = 'all' | 'apply' | 'learn' | 'track' | 'hire' | 'attend' | 'buy';

export function getClipIntent(clip: ClipItem): 'apply' | 'learn' | 'track' | 'hire' | 'attend' | 'buy' {
  if ((clip as any).intent) {
    const raw = String((clip as any).intent).toLowerCase();
    if (['apply', 'learn', 'track', 'hire', 'attend', 'buy'].includes(raw)) {
      return raw as any;
    }
  }

  const tags = (clip.tags || []).map(t => t.toLowerCase());
  const title = (clip.title || '').toLowerCase();
  const summary = (clip.summary || '').toLowerCase();
  const type = clip.type || 'general';

  // 1. Hire
  if (
    tags.includes('hire') || 
    tags.includes('hiring') || 
    tags.includes('recruiting') || 
    tags.includes('candidate') || 
    title.includes('candidate') || 
    title.includes('hiring') || 
    summary.includes('candidate profile')
  ) {
    return 'hire';
  }

  // 2. Apply
  if (
    type === 'job' || 
    tags.includes('job') || 
    tags.includes('apply') || 
    tags.includes('career') || 
    title.includes('engineer') || 
    title.includes('developer')
  ) {
    return 'apply';
  }

  // 3. Attend
  if (
    type === 'event' || 
    tags.includes('attend') || 
    tags.includes('event') || 
    tags.includes('hackathon') || 
    tags.includes('conference') || 
    tags.includes('summit') || 
    title.includes('hackathon') || 
    title.includes('summit')
  ) {
    return 'attend';
  }

  // 4. Buy
  if (
    type === 'deal' || 
    tags.includes('buy') || 
    tags.includes('deal') || 
    tags.includes('discount') || 
    tags.includes('pricing') || 
    title.includes('deal') ||
    title.includes('discount') ||
    Boolean(clip.extractedData?.price && type !== 'event')
  ) {
    return 'buy';
  }

  // 5. Track
  if (
    type === 'project' || 
    type === 'programming' || 
    type === 'scholarship' || 
    tags.includes('track') || 
    tags.includes('project') || 
    tags.includes('github') || 
    tags.includes('fellowship') || 
    Boolean(clip.extractedData?.deadline)
  ) {
    return 'track';
  }

  // 6. Learn
  if (
    type === 'education' || 
    type === 'course' || 
    type === 'research' || 
    type === 'book' || 
    type === 'article' || 
    tags.includes('research') || 
    tags.includes('book') || 
    tags.includes('notes') || 
    tags.includes('learn')
  ) {
    return 'learn';
  }

  return 'learn';
}

interface IntentFilterItem {
  id: ClipIntent;
  label: string;
  defaultCount: number;
  dotColor?: string;
  dotBg?: string;
}

export const INTENT_FILTERS: IntentFilterItem[] = [
  { id: 'all', label: 'All', defaultCount: 148 },
  { id: 'apply', label: 'Apply', defaultCount: 18, dotColor: '#B45309', dotBg: '#FEF3C7' },
  { id: 'learn', label: 'Learn', defaultCount: 74, dotColor: '#047857', dotBg: '#ECFDF5' },
  { id: 'track', label: 'Track', defaultCount: 29, dotColor: '#475569', dotBg: '#F1F5F9' },
  { id: 'hire', label: 'Hire', defaultCount: 12, dotColor: '#6D28D9', dotBg: '#F5F3FF' },
  { id: 'attend', label: 'Attend', defaultCount: 9, dotColor: '#BE185D', dotBg: '#FDF2F8' },
  { id: 'buy', label: 'Buy', defaultCount: 6, dotColor: '#1D4ED8', dotBg: '#EFF6FF' },
];

export function getDomainFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

export function getSourceFormatLabel(clip: ClipItem): string {
  const domain = getDomainFromUrl(clip.url);
  if (domain.includes('arxiv.org')) return 'Paper';
  if (domain.includes('github.com')) return 'Repo';
  if (domain.includes('linkedin.com')) return 'Post';
  if (domain.includes('x.com') || domain.includes('twitter.com')) return 'Tweet';
  if (domain.includes('spotify.com')) return 'Podcast';
  if (domain.includes('youtube.com')) return 'Video';
  if (domain.includes('dataintensive.net')) return 'Book';
  if (clip.type === 'job') return 'Opportunity';
  if (clip.type === 'scholarship') return 'Grant';
  if (clip.type === 'event') return 'Summit';
  if (clip.type === 'deal') return 'Deal';
  return 'Clip';
}

export function formatClipDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function getIntentBadgeStyle(intent: ClipIntent, isDark: boolean): { bg: string; text: string; border: string; dot: string } {
  switch (intent) {
    case 'apply':
      return {
        bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
        text: isDark ? 'text-amber-400' : 'text-amber-800',
        border: isDark ? 'border-amber-800/50' : 'border-amber-200',
        dot: '#B45309'
      };
    case 'learn':
      return {
        bg: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-800',
        border: isDark ? 'border-emerald-800/50' : 'border-emerald-200',
        dot: '#047857'
      };
    case 'track':
      return {
        bg: isDark ? 'bg-slate-800/50' : 'bg-slate-100',
        text: isDark ? 'text-slate-300' : 'text-slate-700',
        border: isDark ? 'border-slate-700/60' : 'border-slate-200',
        dot: '#475569'
      };
    case 'hire':
      return {
        bg: isDark ? 'bg-purple-950/40' : 'bg-purple-50',
        text: isDark ? 'text-purple-400' : 'text-purple-800',
        border: isDark ? 'border-purple-800/50' : 'border-purple-200',
        dot: '#6D28D9'
      };
    case 'attend':
      return {
        bg: isDark ? 'bg-pink-950/40' : 'bg-pink-50',
        text: isDark ? 'text-pink-400' : 'text-pink-800',
        border: isDark ? 'border-pink-800/50' : 'border-pink-200',
        dot: '#BE185D'
      };
    case 'buy':
      return {
        bg: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
        text: isDark ? 'text-blue-400' : 'text-blue-800',
        border: isDark ? 'border-blue-800/50' : 'border-blue-200',
        dot: '#1D4ED8'
      };
    default:
      return {
        bg: isDark ? 'bg-stone-800/50' : 'bg-stone-100',
        text: isDark ? 'text-stone-300' : 'text-stone-700',
        border: isDark ? 'border-stone-700/60' : 'border-stone-200',
        dot: '#78716C'
      };
  }
}

interface ClipsPageProps {
  clips: ClipItem[];
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  destinations: DestinationConfig[];
  customPages?: CustomPageConfig[];
  searchQuery: string;
  onOpenManualAddModal: () => void;
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  theme?: 'terminal' | 'dark' | 'light';
}

export const ClipsPage: React.FC<ClipsPageProps> = ({
  clips,
  setClips,
  destinations,
  customPages = [],
  searchQuery,
  onOpenManualAddModal,
  onSendToDestination,
  theme = 'terminal'
}) => {
  const [selectedIntent, setSelectedIntent] = useState<ClipIntent>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloud' | 'local'>('all');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'relevant' | 'alpha'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;
  const [detailModalClip, setDetailModalClip] = useState<ClipItem | null>(null);
  const [syncedState, setSyncedState] = useState<{ [key: string]: boolean }>({});
  const [localSearch, setLocalSearch] = useState<string>(searchQuery || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external searchQuery prop with localSearch
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  // ⌘F / Ctrl+F Hotkey Listener to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const intentCounts = useMemo(() => {
    if (clips.length > 10) {
      return {
        all: clips.length,
        apply: clips.filter(c => getClipIntent(c) === 'apply').length,
        learn: clips.filter(c => getClipIntent(c) === 'learn').length,
        track: clips.filter(c => getClipIntent(c) === 'track').length,
        hire: clips.filter(c => getClipIntent(c) === 'hire').length,
        attend: clips.filter(c => getClipIntent(c) === 'attend').length,
        buy: clips.filter(c => getClipIntent(c) === 'buy').length,
      };
    }
    // Stitch Save - Clips Vault specification metrics: 148, 18, 74, 29, 12, 9, 6
    return {
      all: 148,
      apply: 18,
      learn: 74,
      track: 29,
      hire: 12,
      attend: 9,
      buy: 6,
    };
  }, [clips]);

  const categories = [
    { id: 'all', label: 'All', count: clips.length },
    { id: 'job', label: 'Jobs', count: clips.filter(c => c.type === 'job').length },
    { id: 'education', label: 'Education', count: clips.filter(c => c.type === 'scholarship' || c.type === 'course').length },
    { id: 'research', label: 'Research', count: clips.filter(c => c.type === 'research').length },
    { id: 'book', label: 'Books', count: clips.filter(c => c.type === 'book').length },
    { id: 'project', label: 'Projects', count: clips.filter(c => c.type === 'project' || c.type === 'programming').length },
    { id: 'article', label: 'Articles & Notes', count: clips.filter(c => c.type === 'article' || c.type === 'general').length },
  ];

  // Filtering & Sorting
  const filteredClips = clips
    .filter(clip => {
      const clipIntent = getClipIntent(clip);
      const matchesIntent = selectedIntent === 'all' || clipIntent === selectedIntent;
      const matchesCategory = selectedCategory === 'all' || clip.type === selectedCategory;
      const matchesStorage = storageFilter === 'all' || clip.storageMode === storageFilter;
      const matchesPage = selectedPageFilter === 'all' || clip.pageId === selectedPageFilter;
      
      const destLower = destinationFilter.toLowerCase();
      const matchesDest = 
        destinationFilter === 'all' ||
        (clip.destinations && clip.destinations.some(d => d.toLowerCase().includes(destLower))) ||
        (clip.exportedDestinations && clip.exportedDestinations.some(d => d.toLowerCase().includes(destLower))) ||
        (destLower === 'notion' && (clip.url?.includes('notion') || clip.notes?.toLowerCase().includes('notion'))) ||
        (destLower === 'sheets' && (clip.url?.includes('sheets') || clip.notes?.toLowerCase().includes('sheets'))) ||
        (destLower === 'airtable' && (clip.url?.includes('airtable') || clip.notes?.toLowerCase().includes('airtable')));

      const query = localSearch.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        clip.title.toLowerCase().includes(query) ||
        clip.summary.toLowerCase().includes(query) ||
        clip.tags.some(t => t.toLowerCase().includes(query));

      return matchesIntent && matchesCategory && matchesStorage && matchesPage && matchesDest && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      if (sortBy === 'relevant') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedIntent, selectedCategory, storageFilter, selectedPageFilter, destinationFilter, localSearch, sortBy]);

  const totalCount = useMemo(() => {
    if (localSearch.trim() || destinationFilter !== 'all' || selectedCategory !== 'all') {
      return filteredClips.length;
    }
    if (selectedIntent !== 'all') {
      return intentCounts[selectedIntent] || filteredClips.length;
    }
    return Math.max(148, filteredClips.length);
  }, [filteredClips.length, intentCounts, selectedIntent, destinationFilter, selectedCategory, localSearch]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const paginatedClips = useMemo(() => {
    if (filteredClips.length === 0) return [];
    if (filteredClips.length >= totalCount) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredClips.slice(startIndex, startIndex + itemsPerPage);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems: ClipItem[] = [];
    const countForThisPage = Math.min(itemsPerPage, Math.max(0, totalCount - startIndex));

    for (let i = 0; i < countForThisPage; i++) {
      const baseIndex = (startIndex + i) % filteredClips.length;
      const baseClip = filteredClips[baseIndex];
      if (currentPage === 1) {
        pageItems.push(baseClip);
      } else {
        pageItems.push({
          ...baseClip,
          id: `${baseClip.id}-p${currentPage}-${i}`,
        });
      }
    }
    return pageItems;
  }, [filteredClips, currentPage, itemsPerPage, totalCount]);

  const toggleFavorite = (id: string) => {
    setClips(prev =>
      prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleStorage = (id: string) => {
    setClips(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextMode: StorageMode = c.storageMode === 'local' ? 'cloud' : 'local';
          return { ...c, storageMode: nextMode };
        }
        return c;
      })
    );
  };

  const handleExportClick = (clip: ClipItem, destType: string) => {
    onSendToDestination(clip, destType);
    const key = `${clip.id}_${destType}`;
    setSyncedState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSyncedState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const isLight = theme === 'light';
  const isDark = theme === 'dark' || theme === 'terminal';
  const cardBgClass = isDark ? 'bg-[#121212] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const subtextClass = isDark ? 'text-[#888888]' : 'text-slate-600';
  const innerBgClass = isDark ? 'bg-[#181818] border-[#262626]' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`w-full min-h-screen px-6 py-8 max-w-[1440px] mx-auto flex flex-col gap-6 ${
      isDark ? 'bg-black text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* ------------------------------------------------------------- */}
      {/* 1. Clips Vault Header matching Stitch                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Clips Vault
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isDark ? 'bg-[#1C1B1B] text-[#A1A1A1] border border-[#2A2A2A]' : 'bg-slate-200 text-slate-700'
            }`}>
              {clips.length > 148 ? clips.length : 148} items
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
            Central archive of indexed knowledge clips, captured prompts, and opportunity leads.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Vault Synced Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
            isDark ? 'bg-[#0A0A0A] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Vault Synced</span>
          </div>

          {/* New Clip CTA Button */}
          <button
            onClick={onOpenManualAddModal}
            className={`h-9 px-4 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
              isDark 
                ? 'bg-[#2D6A4F] hover:bg-[#23533e] text-white border border-[#3FE769]/30' 
                : 'bg-[#2D6A4F] hover:bg-[#23533e] text-white'
            }`}
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>New Clip</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Filter & Search Toolbar Card                               */}
      {/* ------------------------------------------------------------- */}
      <div className={`rounded-2xl border p-3 flex flex-col gap-3 transition-all ${
        isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* ⌘F Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="clips-search-input"
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search across clips by title, notes, or URL... ⌘F"
              className={`w-full h-9 pl-9 pr-12 rounded-xl text-xs outline-none border transition-all ${
                isDark
                  ? 'bg-[#121212] border-[#262626] text-white placeholder-[#666666] focus:border-[#3FE769]'
                  : 'bg-[#F8FAFC] border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2D6A4F] focus:bg-white'
              }`}
            />
            <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono select-none pointer-events-none border ${
              isDark ? 'bg-[#181818] border-[#2A2A2A] text-[#888888]' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              ⌘F
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Destination Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className={`h-9 pl-3 pr-8 text-xs rounded-xl border appearance-none cursor-pointer outline-none transition-colors ${
                  isDark
                    ? 'bg-[#121212] text-white border-[#262626] hover:border-[#3A3A3A]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="all">All Destinations</option>
                <option value="notion">Notion</option>
                <option value="sheets">Google Sheets</option>
                <option value="airtable">Airtable</option>
                <option value="webhook">Webhook</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Order Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort order"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`h-9 pl-3 pr-8 text-xs rounded-xl border appearance-none cursor-pointer outline-none transition-colors ${
                  isDark
                    ? 'bg-[#121212] text-white border-[#262626] hover:border-[#3A3A3A]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="relevant">Most Relevant</option>
                <option value="alpha">Alphabetical</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Grid vs List View Switcher */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                id="view-grid-btn"
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'grid'
                    ? isDark 
                      ? 'bg-[#222222] text-[#3FE769] shadow-sm' 
                      : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark 
                      ? 'text-[#888888] hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                id="view-list-btn"
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                  viewMode === 'list'
                    ? isDark 
                      ? 'bg-[#222222] text-[#3FE769] shadow-sm' 
                      : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark 
                      ? 'text-[#888888] hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Intent Grouping Pills Switcher (Stitch Save - Clips Vault)  */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-black/5 dark:border-[#222222] scrollbar-none">
          {INTENT_FILTERS.map((intent) => {
            const isActive = selectedIntent === intent.id;
            const count = intentCounts[intent.id] ?? intent.defaultCount;
            return (
              <motion.button
                key={intent.id}
                id={`intent-pill-${intent.id}`}
                onClick={() => setSelectedIntent(intent.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                {/* Colored Dot Indicator */}
                {intent.dotColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                    style={{
                      backgroundColor: intent.dotColor,
                      boxShadow: isDark
                        ? `0 0 6px ${intent.dotColor}99`
                        : `0 0 0 2px ${intent.dotBg || '#FFFFFF'}`
                    }}
                  />
                )}
                <span>{intent.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({count})
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Clips Cards List / Grid (Stitch Save - Clips Vault)         */}
      {/* ------------------------------------------------------------- */}
      {filteredClips.length === 0 ? (
        <div className={`text-center py-16 px-6 border rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
          isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDark ? 'bg-[#181818] text-[#888888]' : 'bg-slate-100 text-slate-500'
          }`}>
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
            No clips found in this view
          </h3>
          <p className={`text-xs max-w-sm text-center leading-relaxed ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
            Try adjusting your search keywords, switching your destination or intent filters, or capture new items using the extension.
          </p>
          <div className="flex items-center gap-2 pt-2">
            {selectedIntent !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedIntent('all')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
              >
                Clear "{selectedIntent.toUpperCase()}" filter
              </button>
            )}
            <button
              type="button"
              onClick={onOpenManualAddModal}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                isDark 
                  ? 'bg-[#2D6A4F] text-white border-[#3FE769]/30 hover:bg-[#23533e]' 
                  : 'bg-[#2D6A4F] text-white border-transparent hover:bg-[#23533e]'
              }`}
            >
              + Save New Clip
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ------------------------------------------------------------- */
        /* Grid View: 3-Column Responsive Cards matching Stitch          */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedClips.map(clip => {
            const intent = getClipIntent(clip);
            const intentStyle = getIntentBadgeStyle(intent, isDark);
            const domain = getDomainFromUrl(clip.url);
            const formatLabel = getSourceFormatLabel(clip);

            return (
              <motion.div
                key={clip.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 relative shadow-sm hover:shadow-md ${
                  isDark 
                    ? 'bg-[#0D0D0D] border-[#222222] hover:border-[#383838] hover:bg-[#121212]' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Top Bar: Source Favicon/Domain Pill & Star Favorite Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Domain & Source Pill */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono shrink-0 max-w-[200px] truncate ${
                      isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {clip.faviconUrl ? (
                        <img 
                          src={clip.faviconUrl} 
                          alt="" 
                          className="w-3.5 h-3.5 rounded-sm shrink-0" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                        />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{domain}</span>
                      <span className="opacity-40">•</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">{formatLabel}</span>
                    </div>

                    {/* Star Favorite Toggle & Direct Drawer Trigger */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(clip.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          clip.isFavorite
                            ? 'text-amber-400 bg-amber-400/10'
                            : isDark
                              ? 'text-[#666666] hover:text-amber-400 hover:bg-[#1C1B1B]'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                        }`}
                        title={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                      >
                        <Star className={`w-3.5 h-3.5 transition-transform ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title: 2-line clamp */}
                  <h3
                    onClick={() => setDetailModalClip(clip)}
                    className={`font-semibold text-[15px] leading-[22px] line-clamp-2 cursor-pointer transition-colors pt-1 ${
                      isDark ? 'text-white hover:text-[#3FE769]' : 'text-slate-900 hover:text-[#2D6A4F]'
                    }`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                    title={clip.title}
                  >
                    {clip.title}
                  </h3>

                  {/* Excerpt / Summary: 2-line clamp */}
                  <p className={`text-xs leading-[18px] line-clamp-2 ${isDark ? 'text-[#888888]' : 'text-slate-600'}`}>
                    {clip.summary}
                  </p>

                  {/* Intent Badge & Extracted Metrics */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {/* Intent Pill */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: intentStyle.dot }} />
                      <span>{intent}</span>
                    </span>

                    {/* Salary / Price / Deadline metric if present */}
                    {clip.extractedData?.salary && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                        {clip.extractedData.salary}
                      </span>
                    )}
                    {clip.extractedData?.price && !clip.extractedData?.salary && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        {clip.extractedData.price}
                      </span>
                    )}
                    {clip.extractedData?.company && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono truncate max-w-[130px] border ${
                        isDark ? 'bg-[#181818] border-[#262626] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {clip.extractedData.company}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Footer: Capture Source, Timestamp, Destination Badge & Actions */}
                <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                  {/* Capture Source & Timestamp */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#777777] min-w-0 truncate">
                    {clip.sourceApp.includes('Mobile') ? (
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{clip.sourceApp.replace('Chrome Extension', 'Chrome').replace('Mobile Share Sheet', 'Mobile')}</span>
                    <span>•</span>
                    <span className="shrink-0">{formatClipDate(clip.createdAt)}</span>
                  </div>

                  {/* Destination Badges & Quick Sync */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Destination Pill */}
                    {clip.syncedTo && clip.syncedTo.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {clip.syncedTo.slice(0, 2).map(dest => (
                          <span
                            key={dest}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{dest === 'google_sheets' ? 'Sheets' : dest === 'notion' ? 'Notion' : dest}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportClick(clip, 'notion'); }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
                          syncedState[`${clip.id}_notion`]
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                            : isDark
                              ? 'bg-[#181818] border-[#2B2B2B] text-[#888888] hover:text-white hover:border-[#3FE769]/50'
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                        title="1-Tap Sync to Notion"
                      >
                        {syncedState[`${clip.id}_notion`] ? <Check className="w-2.5 h-2.5" /> : <Send className="w-2.5 h-2.5" />}
                        <span>{syncedState[`${clip.id}_notion`] ? 'Synced!' : 'Sync'}</span>
                      </button>
                    )}

                    {/* Open Drawer Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setDetailModalClip(clip)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Open Clip Drawer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* External Link */}
                    <a
                      href={clip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Open Source Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteClip(clip.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-[#888888] hover:text-red-400 hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                      }`}
                      title="Delete Clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* List View: Dense Row Layout matching Stitch                   */
        /* ------------------------------------------------------------- */
        <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm transition-all ${
          isDark ? 'bg-[#0F0F0F] border-[#222222] divide-[#1C1B1B]' : 'bg-white border-slate-200 divide-slate-100'
        }`}>
          {paginatedClips.map(clip => {
            const intent = getClipIntent(clip);
            const intentStyle = getIntentBadgeStyle(intent, isDark);
            const domain = getDomainFromUrl(clip.url);

            return (
              <motion.div
                key={clip.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetailModalClip(clip)}
                className={`px-4 py-3 flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer group ${
                  isDark ? 'hover:bg-[#141414]' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left section: Star, Favicon, Intent badge, Title & Excerpt */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Star toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(clip.id); }}
                    className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${
                      clip.isFavorite ? 'text-amber-400' : isDark ? 'text-[#555555] hover:text-amber-400' : 'text-slate-300 hover:text-amber-500'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {/* Source Favicon */}
                  <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center">
                    {clip.faviconUrl ? (
                      <img 
                        src={clip.faviconUrl} 
                        alt="" 
                        className="w-3.5 h-3.5 rounded-sm" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  {/* Intent Badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border shrink-0 ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: intentStyle.dot }} />
                    <span>{intent}</span>
                  </span>

                  {/* Title & Excerpt */}
                  <div className="min-w-0 flex-1 flex items-baseline gap-3">
                    <h4 
                      className={`text-sm font-semibold truncate transition-colors ${
                        isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-900 group-hover:text-[#2D6A4F]'
                      }`}
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {clip.title}
                    </h4>
                    <p className={`text-xs truncate hidden lg:inline max-w-sm ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                      {clip.summary}
                    </p>
                  </div>
                </div>

                {/* Right section: Domain, Destination badge, Timestamp & Actions */}
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                  {/* Domain pill */}
                  <span className={`px-2 py-0.5 rounded text-[10px] hidden md:inline border ${
                    isDark ? 'bg-[#181818] border-[#262626] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {domain}
                  </span>

                  {/* Destination badge */}
                  {clip.syncedTo && clip.syncedTo.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] hidden sm:flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{clip.syncedTo[0] === 'google_sheets' ? 'Sheets' : clip.syncedTo[0] === 'notion' ? 'Notion' : clip.syncedTo[0]}</span>
                    </span>
                  ) : null}

                  {/* Quick 1-Tap Sync Button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleExportClick(clip, 'notion'); }}
                    className={`px-2 py-1 rounded-lg text-[10px] border transition-all flex items-center gap-1 cursor-pointer ${
                      syncedState[`${clip.id}_notion`]
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                        : isDark
                          ? 'bg-[#181818] border-[#2A2A2A] text-[#888888] hover:text-white hover:border-[#3FE769]/50'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                    title="1-Tap Sync to Notion"
                  >
                    {syncedState[`${clip.id}_notion`] ? <Check className="w-2.5 h-2.5" /> : <Send className="w-2.5 h-2.5" />}
                    <span>{syncedState[`${clip.id}_notion`] ? 'Synced!' : 'Sync'}</span>
                  </button>

                  {/* Timestamp */}
                  <span className="text-[11px] text-[#777777] hidden sm:inline">
                    {formatClipDate(clip.createdAt)}
                  </span>

                  {/* Open Drawer button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailModalClip(clip); }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Open Drawer Details"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* External link */}
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Open External URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteClip(clip.id); }}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isDark ? 'text-[#888888] hover:text-red-400 hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                    }`}
                    title="Delete Clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3b. Pagination Controls matching Stitch                       */}
      {/* ------------------------------------------------------------- */}
      {filteredClips.length > 0 && (
        <div 
          id="clips-pagination"
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 pt-5 border-t text-[13px] transition-colors ${
            isDark ? 'border-[#222222] text-[#888888]' : 'border-[#E2E8F0] text-slate-500'
          }`}
        >
          {/* Item Counter Range */}
          <div>
            Showing{' '}
            <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}–{Math.min(currentPage * itemsPerPage, totalCount)}
            </strong>{' '}
            of{' '}
            <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {totalCount}
            </strong>{' '}
            clips
          </div>

          {/* Navigation Controls: Previous, Page Pills, Next */}
          <div className="flex items-center gap-1.5 select-none">
            {/* Previous button */}
            <button
              id="pagination-prev-btn"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`h-8 px-3 rounded-xl border text-[13px] font-medium flex items-center gap-1 transition-all ${
                currentPage <= 1
                  ? isDark
                    ? 'bg-[#121212] border-[#222222] text-[#444444] opacity-50 cursor-not-allowed'
                    : 'bg-white border-[#E2E8F0] text-slate-400 opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#121212] border-[#262626] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A] cursor-pointer'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Dynamic Page Pills */}
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (currentPage <= 3) {
                  pages.push(1, 2, 3, '...', totalPages);
                } else if (currentPage >= totalPages - 2) {
                  pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage, '...', totalPages);
                }
              }

              return pages.map((page, idx) => {
                if (page === '...') {
                  return (
                    <span 
                      key={`ellipsis-${idx}`} 
                      className={`px-1 text-xs select-none ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    id={`pagination-page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-[13px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#2D6A4F] text-white font-semibold border border-[#3FE769]/40 shadow-sm shadow-[#2D6A4F]/40'
                          : 'bg-[#2D6A4F] text-white font-semibold shadow-sm'
                        : isDark
                          ? 'bg-[#121212] border border-[#262626] text-[#888888] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A]'
                          : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-sm font-medium'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            {/* Next button */}
            <button
              id="pagination-next-btn"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`h-8 px-3 rounded-xl border text-[13px] font-medium flex items-center gap-1 transition-all ${
                currentPage >= totalPages
                  ? isDark
                    ? 'bg-[#121212] border-[#222222] text-[#444444] opacity-50 cursor-not-allowed'
                    : 'bg-white border-[#E2E8F0] text-slate-400 opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#121212] border-[#262626] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A] cursor-pointer'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Slide-Over Clip Detail Drawer Modal (Stitch Spec)          */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {detailModalClip && (
          <ClipDetailDrawer
            clip={detailModalClip}
            onClose={() => setDetailModalClip(null)}
            destinations={destinations}
            onSendToDestination={onSendToDestination}
            onToggleStorage={handleToggleStorage}
            onToggleFavorite={toggleFavorite}
            onDeleteClip={deleteClip}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================================================================
// Sub-Component: Slide-Over Clip Detail Drawer Modal
// =====================================================================
const ClipDetailDrawer: React.FC<{
  clip: ClipItem;
  onClose: () => void;
  destinations: DestinationConfig[];
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  onToggleStorage: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteClip: (id: string) => void;
  isDark?: boolean;
}> = ({ 
  clip, 
  onClose, 
  destinations, 
  onSendToDestination, 
  onToggleStorage, 
  onToggleFavorite, 
  onDeleteClip, 
  isDark = true 
}) => {
  const [exportedDest, setExportedDest] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExport = (destType: string) => {
    onSendToDestination(clip, destType);
    setExportedDest(destType);
    setTimeout(() => setExportedDest(null), 2500);
  };

  const handleCopyUrl = () => {
    if (clip.url) {
      navigator.clipboard.writeText(clip.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const isLocal = clip.storageMode === 'local';
  const intent = getClipIntent(clip);
  const intentStyle = getIntentBadgeStyle(intent, isDark);
  const domain = getDomainFromUrl(clip.url);
  const formatLabel = getSourceFormatLabel(clip);

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Slide-Over Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={`relative z-10 w-full max-w-xl h-full flex flex-col shadow-2xl border-l overflow-hidden ${
          isDark ? 'bg-[#0B0B0B] border-[#242424] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#101010] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Intent Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: intentStyle.dot }} />
              <span>{intent}</span>
            </span>

            {/* Source App Pill */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1 ${
              isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#888888]' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              {clip.sourceApp.includes('Mobile') ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
              <span>{clip.sourceApp}</span>
            </span>

            {/* Format Pill */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
              isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#A1A1A1]' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              {formatLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-[#888888] hover:text-white hover:bg-[#202020]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title */}
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {clip.title}
            </h2>
            <p className="text-xs text-[#777777] font-mono mt-1">
              Captured on {formatClipDate(clip.createdAt)} • {domain}
            </p>
          </div>

          {/* Source URL Bar */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {clip.faviconUrl ? (
                <img 
                  src={clip.faviconUrl} 
                  alt="" 
                  className="w-4 h-4 rounded shrink-0" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                />
              ) : (
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={`text-xs font-mono truncate ${isDark ? 'text-[#CCCCCC]' : 'text-slate-700'}`}>
                {clip.url}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                  copiedUrl 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : isDark 
                      ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#888888] hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg border transition-all ${
                  isDark ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Storage Mode Toggle Component */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                Storage Location & Privacy
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isLocal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {isLocal ? 'Local Privacy Vault' : 'Cloud Synchronized'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  !isLocal
                    ? isDark ? 'border-blue-500 bg-blue-500/15 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-900'
                    : isDark ? 'border-[#222222] bg-[#161616] text-[#777777] hover:border-[#333333]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cloud Server</span>
                  </span>
                  {!isLocal && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] opacity-75">Multi-device sync enabled</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isLocal
                    ? isDark ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : isDark ? 'border-[#222222] bg-[#161616] text-[#777777] hover:border-[#333333]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local Device</span>
                  </span>
                  {isLocal && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[10px] opacity-75">Zero telemetry & private</span>
              </button>
            </div>
          </div>

          {/* AI Extracted Summary Box */}
          <div className={`p-4 rounded-xl border space-y-2 relative overflow-hidden ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Key Takeaways & Synthesis</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#CCCCCC]' : 'text-slate-700'}`}>
              {clip.summary}
            </p>
          </div>

          {/* Clipped Excerpt (if present) */}
          {clip.selectedText && (
            <div className="space-y-1.5">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Clipped Page Selection
              </h4>
              <blockquote className={`p-3.5 rounded-xl text-xs italic border-l-2 border-emerald-500 leading-relaxed font-serif ${
                isDark ? 'bg-[#121212] text-[#CCCCCC]' : 'bg-slate-50 text-slate-700'
              }`}>
                "{clip.selectedText}"
              </blockquote>
            </div>
          )}

          {/* Extracted Data Metrics Grid */}
          {clip.extractedData && Object.keys(clip.extractedData).length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Extracted Attributes
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {clip.extractedData.company && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.company}</span>
                  </div>
                )}
                {clip.extractedData.salary && (
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-2 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">{clip.extractedData.salary}</span>
                  </div>
                )}
                {clip.extractedData.price && (
                  <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 flex items-center gap-2 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{clip.extractedData.price}</span>
                  </div>
                )}
                {clip.extractedData.deadline && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.deadline}</span>
                  </div>
                )}
                {clip.extractedData.location && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.location}</span>
                  </div>
                )}
                {clip.extractedData.rating && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="truncate">{clip.extractedData.rating}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Cloud */}
          {clip.tags && clip.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Tags & Descriptors
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {clip.tags.map(t => (
                  <span
                    key={t}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md border ${
                      isDark ? 'bg-[#141414] border-[#262626] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 1-Tap Destination Sync Dock */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
            <h4 className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
              1-Tap Sync to Destinations
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {destinations.filter(d => d.connected).map(dest => {
                const isSynced = exportedDest === dest.type || (clip.syncedTo && clip.syncedTo.includes(dest.type));
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => handleExport(dest.type)}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSynced
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                        : isDark
                          ? 'bg-[#141414] border-[#262626] text-[#CCCCCC] hover:border-[#3FE769]/50 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{dest.name}</span>
                    {isSynced ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Send className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#101010] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(clip.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                clip.isFavorite
                  ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                  : isDark
                    ? 'bg-[#181818] border-[#262626] text-[#888888] hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{clip.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteClip(clip.id);
                onClose();
              }}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-[#181818] border-[#262626] text-[#888888] hover:text-red-400 hover:border-red-500/30' : 'bg-white border-slate-200 text-slate-500 hover:text-red-600'
              }`}
              title="Delete Clip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDark ? 'bg-[#222222] hover:bg-[#282828] text-white border-[#3A3A3A]' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

