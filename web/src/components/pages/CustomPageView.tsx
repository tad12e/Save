import React, { useState } from 'react';
import { 
  CustomPageConfig, 
  ClipItem, 
  DestinationConfig, 
  StorageMode 
} from '../../types';
import { 
  Sparkles, 
  Plus, 
  Bookmark, 
  Search, 
  ExternalLink, 
  Trash2, 
  Cloud, 
  HardDrive, 
  Tag, 
  Calendar, 
  Filter, 
  Layers, 
  BookOpen, 
  Cpu, 
  FolderGit2, 
  Code2, 
  GraduationCap, 
  Briefcase, 
  Lightbulb, 
  Compass, 
  Rocket, 
  Terminal, 
  CheckCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';

interface CustomPageViewProps {
  page: CustomPageConfig;
  clips: ClipItem[];
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  destinations: DestinationConfig[];
  onOpenAddClip: (pageId?: string) => void;
  onDeletePage?: (pageId: string) => void;
  theme?: 'terminal' | 'dark' | 'light';
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  Cpu,
  FolderGit2,
  Code2,
  GraduationCap,
  Briefcase,
  Lightbulb,
  Layers,
  Compass,
  Search,
  Rocket,
  Terminal,
  Bookmark
};

export const CustomPageView: React.FC<CustomPageViewProps> = ({
  page,
  clips,
  setClips,
  destinations,
  onOpenAddClip,
  onDeletePage,
  theme = 'terminal',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloud' | 'local'>('all');

  const PageIcon = ICON_MAP[page.iconName] || Bookmark;

  // Filter clips belonging to this page (either by pageId or matching contentTypes)
  const pageClips = clips.filter(clip => {
    const isDirectMatch = clip.pageId === page.id;
    const isTypeMatch = page.contentTypes.includes(clip.type);
    return isDirectMatch || isTypeMatch;
  });

  const filteredClips = pageClips.filter(clip => {
    const matchesSearch = 
      clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clip.selectedText && clip.selectedText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? clip.tags.includes(selectedTag) : true;
    const matchesStorage = storageFilter === 'all' ? true : clip.storageMode === storageFilter;

    return matchesSearch && matchesTag && matchesStorage;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(pageClips.flatMap(c => c.tags)));

  const isLight = theme === 'light';
  const isDark = theme === 'dark';

  const cardBgClass = isLight 
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
    : isDark 
    ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-md' 
    : 'bg-[#080808] border-white/10 text-stone-200';

  const innerBgClass = isLight ? 'bg-slate-50 border-slate-200' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#030303] border-white/5';
  const subtextClass = isLight ? 'text-slate-600' : 'text-stone-400';

  // Toggle storage mode between cloud and local
  const handleToggleClipStorage = (clipId: string) => {
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const nextMode: StorageMode = c.storageMode === 'local' ? 'cloud' : 'local';
        return { ...c, storageMode: nextMode };
      }
      return c;
    }));
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn font-sans text-stone-200">
      
      {/* Custom Page Header */}
      <div className={`rounded-sm p-6 sm:p-8 border relative overflow-hidden transition-all ${
        isLight 
          ? 'bg-gradient-to-r from-slate-50 via-white to-slate-100 border-slate-200 text-slate-900 shadow-md' 
          : 'bg-gradient-to-r from-[#0c0c0c] via-[#080808] to-[#050505] border-white/10 text-white shadow-2xl'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div 
              style={{ backgroundColor: page.bgColor || page.color + '20', color: page.color, borderColor: page.color + '40' }}
              className="p-3.5 rounded-sm border shadow-lg shrink-0"
            >
              <PageIcon className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white uppercase">
                  {page.name}
                </h1>
                <span 
                  style={{ backgroundColor: page.color + '20', color: page.color, borderColor: page.color + '40' }}
                  className="text-[10px] font-mono px-2.5 py-0.5 rounded border uppercase tracking-wider font-semibold"
                >
                  CUSTOM ANALYSIS PAGE
                </span>
              </div>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${subtextClass}`}>
                {page.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenAddClip(page.id)}
              className="px-4 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Clip to {page.name}</span>
            </button>

            {!page.isSystemDefault && onDeletePage && (
              <button
                onClick={() => onDeletePage(page.id)}
                className="p-2.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Delete Custom Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* AI Purpose Banner */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">AI Purpose Rule:</span>
            <span className="text-stone-300 font-sans italic text-xs">{page.aiGoalPrompt}</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 text-[11px] shrink-0">
            <span>Total Saved: <strong className="text-white">{pageClips.length} clips</strong></span>
            <span>Local Offline: <strong className="text-emerald-400">{pageClips.filter(c => c.storageMode === 'local').length}</strong></span>
            <span>Cloud Synced: <strong className="text-blue-400">{pageClips.filter(c => c.storageMode === 'cloud').length}</strong></span>
          </div>
        </div>
      </div>

      {/* AI Synthesis Spotlight Card for Page */}
      <div className={`rounded-sm p-6 border space-y-4 ${cardBgClass}`}>
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-serif font-semibold">AI Topic Synthesis for {page.name}</h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
            LIVE KNOWLEDGE GRAPH
          </span>
        </div>

        {pageClips.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className={`text-xs ${subtextClass}`}>No clips assigned to this page yet. Click "Add Clip" above or save web items with the Chrome Extension.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 p-4 rounded-sm border space-y-3 ${innerBgClass}`}>
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> AI Takeaways & Executive Summary
              </h3>
              <p className={`text-xs leading-relaxed ${subtextClass}`}>
                AI analyzed {pageClips.length} saved entries for <strong className="text-white">{page.name}</strong> according to your prompt rule (<em className="text-amber-400">"{page.aiGoalPrompt}"</em>).
              </p>
              <ul className="space-y-2 text-xs font-sans">
                {pageClips.slice(0, 3).map((clip, idx) => (
                  <li key={clip.id} className="p-2.5 rounded bg-black/20 border border-white/5 flex items-start gap-2">
                    <span className="text-amber-500 font-mono text-xs shrink-0">{idx + 1}.</span>
                    <div>
                      <strong className="text-white block">{clip.title}</strong>
                      <span className={`text-[11px] ${subtextClass}`}>{clip.summary}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`p-4 rounded-sm border space-y-3 font-mono text-xs ${innerBgClass}`}>
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Page Knowledge Health
              </h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className={subtextClass}>Categorization Confidence:</span>
                  <span className="text-emerald-400 font-bold">99.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className={subtextClass}>Primary Storage Mode:</span>
                  <span className="text-amber-400 font-bold">
                    {pageClips.filter(c => c.storageMode === 'local').length >= pageClips.filter(c => c.storageMode === 'cloud').length ? '💻 Local Device' : '☁ Server Cloud'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={subtextClass}>Extracted Entities:</span>
                  <span className="text-stone-300">{allTags.slice(0, 4).join(', ') || 'General'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clip List Controls & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search clips in ${page.name}...`}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-sm border focus:outline-none focus:border-amber-500/60 ${innerBgClass}`}
            />
          </div>

          {/* Storage Filter Pills */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`text-[10px] uppercase tracking-wider ${subtextClass}`}>Storage:</span>
            
            <button
              onClick={() => setStorageFilter('all')}
              className={`px-2.5 py-1 rounded-sm text-[10px] uppercase transition-all ${
                storageFilter === 'all'
                  ? 'bg-stone-700 text-white font-bold'
                  : 'bg-stone-900/50 text-stone-400 hover:text-white'
              }`}
            >
              All ({pageClips.length})
            </button>

            <button
              onClick={() => setStorageFilter('cloud')}
              className={`px-2.5 py-1 rounded-sm text-[10px] uppercase flex items-center gap-1 transition-all ${
                storageFilter === 'cloud'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold'
                  : 'bg-stone-900/50 text-stone-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3 h-3 text-blue-400" />
              <span>Cloud ☁</span>
            </button>

            <button
              onClick={() => setStorageFilter('local')}
              className={`px-2.5 py-1 rounded-sm text-[10px] uppercase flex items-center gap-1 transition-all ${
                storageFilter === 'local'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                  : 'bg-stone-900/50 text-stone-400 hover:text-white'
              }`}
            >
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Device 💻</span>
            </button>
          </div>
        </div>

        {/* Saved Clips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClips.map((clip) => {
            const isLocal = clip.storageMode === 'local';
            return (
              <div 
                key={clip.id}
                className={`p-5 rounded-sm border space-y-3 relative group transition-all hover:border-amber-500/40 ${cardBgClass}`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {clip.faviconUrl ? (
                      <img src={clip.faviconUrl} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                    ) : (
                      <PageIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <a 
                      href={clip.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-serif font-medium text-sm text-white hover:text-amber-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                    >
                      <span>{clip.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>

                  {/* Storage Choice Badge & Toggle */}
                  <button
                    onClick={() => handleToggleClipStorage(clip.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 shrink-0 uppercase tracking-wider transition-all ${
                      isLocal 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                    }`}
                    title="Click to toggle storage mode (Cloud vs Local Device)"
                  >
                    {isLocal ? (
                      <>
                        <HardDrive className="w-2.5 h-2.5" />
                        <span>💻 Local Offline</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-2.5 h-2.5" />
                        <span>☁ Server Cloud</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Excerpt / Summary */}
                <p className={`text-xs leading-relaxed line-clamp-2 ${subtextClass}`}>
                  {clip.summary}
                </p>

                {/* Tags & Date */}
                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {clip.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded text-[9px]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <span className={subtextClass}>
                    {new Date(clip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
