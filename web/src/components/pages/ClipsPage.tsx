import React, { useState } from 'react';
import { ClipItem, ClipType, DestinationConfig, CustomPageConfig, StorageMode } from '../../types';
import { 
  Bookmark, 
  Search, 
  Grid, 
  List, 
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
  Filter
} from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloud' | 'local'>('all');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailModalClip, setDetailModalClip] = useState<ClipItem | null>(null);
  const [syncedState, setSyncedState] = useState<{ [key: string]: boolean }>({});

  const categories = [
    { id: 'all', label: 'All Save Clips', count: clips.length },
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
      const matchesCategory = selectedCategory === 'all' || clip.type === selectedCategory;
      const matchesStorage = storageFilter === 'all' || clip.storageMode === storageFilter;
      const matchesPage = selectedPageFilter === 'all' || clip.pageId === selectedPageFilter;
      const matchesSearch = 
        !searchQuery ||
        clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesStorage && matchesPage && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return a.title.localeCompare(b.title);
    });

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
  const isDark = theme === 'dark';

  const cardBgClass = isLight 
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
    : isDark 
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' 
    : 'bg-[#080808] border-white/10 text-stone-200';

  const innerBgClass = isLight ? 'bg-slate-50 border-slate-200' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#030303] border-white/5';
  const subtextClass = isLight ? 'text-slate-600' : 'text-stone-400';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn font-sans text-stone-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px] border border-amber-500/30 uppercase tracking-widest font-semibold">
              NATIVE IN-APP STORAGE
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Offline Ready
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-serif text-white leading-tight font-bold">
            Save Clips & <span className="italic text-stone-400 font-normal">Vault Storage.</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed ${subtextClass}`}>
            Direct in-app bookmark and clipping engine. Save articles, job postings, notes, and research pages directly into Save without relying on external 3rd-party services.
          </p>
        </div>

        {/* View Switchers & Add CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#080808] border border-white/5 rounded-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-sm text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-sm text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenManualAddModal}
            className="px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono tracking-wider uppercase font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Save New Clip</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className={`p-4 rounded-sm border space-y-4 ${cardBgClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Storage Choice Pills */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              Privacy Storage Location
            </label>
            <div className="flex items-center gap-2 text-xs font-mono">
              <button
                onClick={() => setStorageFilter('all')}
                className={`px-3 py-1.5 rounded-sm text-xs transition-all ${
                  storageFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-[#030303] text-stone-400 border border-white/5 hover:text-white'
                }`}
              >
                All Storage ({clips.length})
              </button>

              <button
                onClick={() => setStorageFilter('cloud')}
                className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${
                  storageFilter === 'cloud'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold'
                    : 'bg-[#030303] text-stone-400 border border-white/5 hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>☁ Cloud Server ({clips.filter(c => c.storageMode === 'cloud').length})</span>
              </button>

              <button
                onClick={() => setStorageFilter('local')}
                className={`px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-all ${
                  storageFilter === 'local'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'bg-[#030303] text-stone-400 border border-white/5 hover:text-white'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>💻 Device Offline ({clips.filter(c => c.storageMode === 'local').length})</span>
              </button>
            </div>
          </div>

          {/* Custom Page Dropdown Filter & Sort Dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Custom Page Filter */}
            {customPages.length > 0 && (
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  Page Collection
                </label>
                <select
                  value={selectedPageFilter}
                  onChange={(e) => setSelectedPageFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-sm border focus:outline-none focus:border-amber-500/60 font-sans ${innerBgClass}`}
                >
                  <option value="all">All Custom Pages</option>
                  {customPages.map(page => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                Sort Order
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-1.5 text-xs rounded-sm border focus:outline-none focus:border-amber-500/60 font-sans ${innerBgClass}`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-black/5 dark:border-white/5 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-sm text-[11px] font-mono tracking-wider uppercase shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'bg-[#030303] text-stone-400 border border-white/5 hover:text-white'
              }`}
            >
              {cat.label} [{cat.count}]
            </button>
          ))}
        </div>
      </div>

      {/* Clips Cards List / Grid */}
      {filteredClips.length === 0 ? (
        <div className={`text-center py-20 border rounded-sm p-8 space-y-4 ${cardBgClass}`}>
          <Bookmark className="w-10 h-10 text-stone-600 mx-auto" />
          <h3 className="font-serif text-xl text-white">No clips found in this view</h3>
          <p className={`text-xs max-w-sm mx-auto leading-relaxed ${subtextClass}`}>
            Adjust your search query, change storage choice filters, or click "Save New Clip" above.
          </p>
          <button
            onClick={onOpenManualAddModal}
            className="mt-2 px-4 py-2 bg-amber-500 text-black text-xs font-mono uppercase tracking-wider font-semibold rounded-sm shadow-md"
          >
            Save First Clip
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClips.map(clip => {
            const isLocal = clip.storageMode === 'local';
            const assignedPage = customPages.find(p => p.id === clip.pageId);

            return (
              <div
                key={clip.id}
                className={`border rounded-sm p-6 shadow-sm hover:border-amber-500/40 transition-all flex flex-col justify-between group ${cardBgClass}`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {clip.faviconUrl ? (
                        <img src={clip.faviconUrl} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      
                      {assignedPage ? (
                        <span 
                          style={{ backgroundColor: assignedPage.bgColor || 'rgba(245,158,11,0.1)', color: assignedPage.color, borderColor: assignedPage.color + '40' }}
                          className="px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider truncate font-semibold"
                        >
                          {assignedPage.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {clip.type}
                        </span>
                      )}
                    </div>

                    {/* Storage Mode Pill Indicator & Direct Toggle */}
                    <button
                      onClick={() => handleToggleStorage(clip.id)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 shrink-0 uppercase tracking-wider transition-all ${
                        isLocal 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' 
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25'
                      }`}
                      title="Click to switch storage location between Local Device & Cloud Server"
                    >
                      {isLocal ? (
                        <>
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>💻 Device</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-2.5 h-2.5" />
                          <span>☁ Cloud</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setDetailModalClip(clip)}
                    className="font-serif text-lg font-medium text-white hover:text-amber-400 cursor-pointer line-clamp-2 leading-snug"
                  >
                    {clip.title}
                  </h3>

                  {/* Extracted Data Pills */}
                  {clip.extractedData && (
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-stone-400">
                      {clip.extractedData.company && (
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${innerBgClass}`}>
                          <Building className="w-3 h-3 text-stone-500" />
                          {clip.extractedData.company}
                        </span>
                      )}
                      {clip.extractedData.salary && (
                        <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-sm border border-amber-500/20">
                          <DollarSign className="w-3 h-3 text-amber-500" />
                          {clip.extractedData.salary}
                        </span>
                      )}
                    </div>
                  )}

                  {/* AI Summary / Excerpt */}
                  <div className={`p-3 rounded-sm border text-xs space-y-1 ${innerBgClass}`}>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-amber-500 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Takeaway</span>
                    </div>
                    <p className={`line-clamp-2 leading-relaxed text-[11px] font-sans ${subtextClass}`}>{clip.summary}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {clip.tags.map(t => (
                      <span key={t} className={`text-[9px] font-mono uppercase tracking-wider text-stone-400 border px-2 py-0.5 rounded-sm ${innerBgClass}`}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-amber-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 truncate max-w-[140px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">{new URL(clip.url).hostname}</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(clip.id)}
                      className="p-1 text-stone-500 hover:text-amber-400 transition-colors"
                      title="Favorite"
                    >
                      <Star className={`w-4 h-4 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => deleteClip(clip.id)}
                      className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                      title="Delete Clip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className={`border rounded-sm overflow-hidden divide-y divide-white/5 ${cardBgClass}`}>
          {filteredClips.map(clip => (
            <div key={clip.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  {clip.type}
                </span>
                <div className="min-w-0 flex-1">
                  <h4
                    onClick={() => setDetailModalClip(clip)}
                    className="font-serif text-lg text-white hover:text-amber-400 truncate cursor-pointer font-medium"
                  >
                    {clip.title}
                  </h4>
                  <p className={`text-xs truncate mt-0.5 font-sans ${subtextClass}`}>{clip.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                <span className={`text-[10px] uppercase ${clip.storageMode === 'local' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {clip.storageMode === 'local' ? '💻 Device' : '☁ Cloud'}
                </span>
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-sm bg-[#050505] text-stone-400 border border-white/5 hover:text-amber-400"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clip Detail Modal */}
      {detailModalClip && (
        <ClipDetailModal
          clip={detailModalClip}
          onClose={() => setDetailModalClip(null)}
          destinations={destinations}
          onSendToDestination={onSendToDestination}
          onToggleStorage={handleToggleStorage}
        />
      )}
    </div>
  );
};

// Sub-Component: Clip Detail Modal
const ClipDetailModal: React.FC<{
  clip: ClipItem;
  onClose: () => void;
  destinations: DestinationConfig[];
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  onToggleStorage: (id: string) => void;
}> = ({ clip, onClose, destinations, onSendToDestination, onToggleStorage }) => {
  const [exportedDest, setExportedDest] = useState<string | null>(null);

  const handleExport = (destType: string) => {
    onSendToDestination(clip, destType);
    setExportedDest(destType);
    setTimeout(() => setExportedDest(null), 2500);
  };

  const isLocal = clip.storageMode === 'local';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-[#080808] border border-white/10 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest font-semibold">
              {clip.type}
            </span>
            <span className="text-xs font-mono text-stone-500">App Source: {clip.sourceApp}</span>
          </div>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 bg-[#080808] text-stone-200">
          <h2 className="text-2xl font-serif text-white leading-snug font-bold">
            {clip.title}
          </h2>

          {/* Storage Choice Selector Component */}
          <div className="p-4 rounded-sm bg-[#030303] border border-white/10 space-y-3 font-mono text-xs">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
              Storage Choice & Privacy Mode
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                  !isLocal
                    ? 'border-blue-500 bg-blue-500/15 text-blue-300 font-bold'
                    : 'border-white/5 bg-[#050505] text-stone-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 uppercase text-[11px]">
                    <Cloud className="w-4 h-4 text-blue-400" /> ☁ Server Cloud
                  </span>
                  {!isLocal && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] text-stone-400 font-sans font-normal">
                  Synced across all your devices.
                </span>
              </button>

              <button
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                  isLocal
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                    : 'border-white/5 bg-[#050505] text-stone-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 uppercase text-[11px]">
                    <HardDrive className="w-4 h-4 text-emerald-400" /> 💻 Local Device
                  </span>
                  {isLocal && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[10px] text-stone-400 font-sans font-normal">
                  Private & available offline.
                </span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-sm bg-[#050505] border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-500 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AI Extracted Summary</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              {clip.summary}
            </p>
          </div>

          {clip.selectedText && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Clipped Excerpt</h4>
              <blockquote className="p-3.5 rounded-sm bg-[#050505] text-xs text-stone-300 italic border-l-2 border-amber-500 leading-relaxed font-serif">
                "{clip.selectedText}"
              </blockquote>
            </div>
          )}

          {/* Sync Actions */}
          <div className="pt-2 border-t border-white/5">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-2">Sync directly to destination</h4>
            <div className="flex flex-wrap gap-2">
              {destinations.filter(d => d.connected).map(dest => (
                <button
                  key={dest.id}
                  onClick={() => handleExport(dest.type)}
                  className="px-3.5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider bg-[#050505] text-stone-300 border border-white/10 hover:border-amber-500/50 hover:text-amber-400 transition-all flex items-center gap-1.5"
                >
                  {exportedDest === dest.type ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Send className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{exportedDest === dest.type ? `Synced!` : dest.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#050505] flex items-center justify-between">
          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono uppercase tracking-wider text-amber-500 hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            Open Source Webpage
          </a>
          <button onClick={onClose} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono uppercase tracking-wider font-semibold rounded-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
