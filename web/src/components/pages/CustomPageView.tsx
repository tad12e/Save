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
  Share2,
  FolderPlus,
  X,
  Star,
  LayoutGrid,
  List,
  Columns3,
  Clock,
  Check,
  User,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { PolymorphicClipCard } from '../cards/PolymorphicClipCard';
import { ClipCinemaViewer } from '../cards/ClipCinemaViewer';
import { updateClipBackend } from '../../lib/api';

interface CustomPageViewProps {
  page: CustomPageConfig;
  clips: ClipItem[];
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  destinations: DestinationConfig[];
  customPages?: CustomPageConfig[];
  setActiveTab?: (tab: string) => void;
  onOpenAddClip: (pageId?: string) => void;
  onDeletePage?: (pageId: string) => void;
  onOpenCreatePageModal?: () => void;
  onOpenCreateSubPage?: (parentPage: CustomPageConfig) => void;
  onSendToDestination?: (clip: ClipItem, destType: string) => void;
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
  Bookmark,
  User
};

export const CustomPageView: React.FC<CustomPageViewProps> = ({
  page,
  clips,
  setClips,
  destinations,
  customPages = [],
  setActiveTab,
  onOpenAddClip,
  onDeletePage,
  onOpenCreatePageModal,
  onOpenCreateSubPage,
  onSendToDestination,
  theme = 'terminal',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [selectedSubPageFilter, setSelectedSubPageFilter] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloud' | 'local'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'columns' | 'list'>('grid');
  const [cinemaClip, setCinemaClip] = useState<ClipItem | null>(null);
  const [syncedState, setSyncedState] = useState<Record<string, boolean>>({});

  // Vault Import Modal states
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [addingClipIds, setAddingClipIds] = useState<Set<string>>(new Set());

  const PageIcon = ICON_MAP[page.iconName] || Bookmark;
  const isLight = theme === 'light';
  const isDark = theme === 'dark' || theme === 'terminal';

  // Sub-pages nested under this custom page (e.g. Author Shelves in Books)
  const subPages = customPages.filter(p => p.parentId === page.id);
  const subPageIds = new Set(subPages.map(p => p.id));

  // Parent page object if current page is a nested sub-page (e.g. Books is parent of Walter Isaacson)
  const parentPageObj = page.parentId ? customPages.find(p => p.id === page.parentId) : null;

  // Sibling sub-pages (e.g. other author shelves under the same parent)
  const siblingPages = parentPageObj 
    ? customPages.filter(p => p.parentId === parentPageObj.id && p.id !== page.id)
    : [];

  const isAuthorSubPage = Boolean(parentPageObj);
  const isParentShelfSpace = subPages.length > 0 || page.slug === 'books' || page.name.toLowerCase().includes('book');

  // Base clips belonging to this page (explicit pageId, child author sub-pages, or matched contentTypes)
  const pageClips = clips.filter(clip => {
    const isDirectMatch = clip.pageId === page.id;
    const isSubPageMatch = clip.pageId ? subPageIds.has(clip.pageId) : false;
    const isTypeMatch = page.contentTypes.includes(clip.type);
    return isDirectMatch || isSubPageMatch || isTypeMatch;
  });

  // Extract all unique tags and intents from clips in this space
  const allTags = Array.from(new Set(pageClips.flatMap(c => c.tags || [])));
  const availableIntents = Array.from(new Set(pageClips.map(c => c.intent).filter(Boolean)));

  // Available clips from total vault that are NOT yet directly in this space
  const availableVaultClips = clips.filter(clip => clip.pageId !== page.id);
  const filteredVaultClips = availableVaultClips.filter(c => {
    if (!vaultSearch.trim()) return true;
    const q = vaultSearch.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.summary && c.summary.toLowerCase().includes(q)) ||
      (c.url && c.url.toLowerCase().includes(q)) ||
      (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  // Multi-filter for clips in this view (Search, Tag, Intent, SubPage/Author Filter, Storage)
  const filteredClips = pageClips.filter(clip => {
    const matchesSearch = 
      (clip.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clip.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clip.selectedText && clip.selectedText.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (clip.url || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag ? clip.tags.includes(selectedTag) : true;
    const matchesIntent = selectedIntent === 'all' ? true : clip.intent?.toLowerCase() === selectedIntent.toLowerCase();
    const matchesSubPage = selectedSubPageFilter === 'all' ? true : clip.pageId === selectedSubPageFilter;
    const matchesStorage = storageFilter === 'all' ? true : clip.storageMode === storageFilter;

    return matchesSearch && matchesTag && matchesIntent && matchesSubPage && matchesStorage;
  });

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

  const handleToggleFavorite = (clipId: string) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const handleDeleteClip = (clipId: string) => {
    setClips(prev => prev.filter(c => c.id !== clipId));
    if (cinemaClip && cinemaClip.id === clipId) {
      setCinemaClip(null);
    }
  };

  const handleExportClick = (clip: ClipItem, destType: string) => {
    if (onSendToDestination) {
      onSendToDestination(clip, destType);
      const key = `${clip.id}_${destType}`;
      setSyncedState(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSyncedState(prev => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const handleAddClipToThisPage = async (clipId: string) => {
    setAddingClipIds(prev => new Set(prev).add(clipId));
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, pageId: page.id } : c));
    try {
      await updateClipBackend(clipId, { custom_page_id: page.id });
    } catch (e) {
      console.warn("Failed to persist clip page assignment:", e);
    }
    setAddingClipIds(prev => {
      const next = new Set(prev);
      next.delete(clipId);
      return next;
    });
  };

  const handleRemoveClipFromThisPage = async (clipId: string) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, pageId: undefined } : c));
    try {
      await updateClipBackend(clipId, { custom_page_id: null });
    } catch (e) {
      console.warn("Failed to remove clip from page:", e);
    }
  };


  // Compute breadcrumb trail for nested hierarchy
  const breadcrumbTrail: CustomPageConfig[] = [];
  let curr: CustomPageConfig | undefined = page;
  while (curr && curr.parentId) {
    const parent = customPages.find(p => p.id === curr!.parentId);
    if (parent) {
      breadcrumbTrail.unshift(parent);
      curr = parent;
    } else {
      break;
    }
  }

  const subtextClass = isLight ? 'text-slate-600' : 'text-[#878787]';
  const cardBgClass = isLight 
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
    : 'bg-[#0A0A0A] border-[#222222] text-[#EDEDED]';
  const innerBgClass = isLight 
    ? 'bg-slate-50 border-slate-200' 
    : 'bg-[#121212] border-[#222222]';

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn font-sans text-[#EDEDED]">
      
      {/* ─── Breadcrumb Navigation ─── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-[#878787] flex-wrap">
        <button
          onClick={() => setActiveTab && setActiveTab('dashboard')}
          className="hover:text-white transition-colors cursor-pointer"
        >
          <span>Home</span>
        </button>
        <span>/</span>
        <button
          onClick={() => setActiveTab && setActiveTab('clips')}
          className="hover:text-white transition-colors cursor-pointer"
        >
          <span>Clips</span>
        </button>
        <span>/</span>
        {breadcrumbTrail.map((parent) => (
          <React.Fragment key={parent.id}>
            <button
              onClick={() => setActiveTab && setActiveTab(parent.id)}
              className="text-[#3FE769] hover:underline font-semibold transition-colors cursor-pointer"
            >
              {parent.name}
            </button>
            <span>/</span>
          </React.Fragment>
        ))}
        <span className="text-white font-bold flex items-center gap-1.5">
          {isAuthorSubPage && <User className="w-3.5 h-3.5 text-[#3FE769]" />}
          <span>{page.name}</span>
        </span>
      </nav>

      {/* ─── Custom Page Header Banner ─── */}
      <div className={`rounded-2xl p-6 sm:p-8 border relative overflow-hidden transition-all ${
        isLight 
          ? 'bg-gradient-to-r from-slate-50 via-white to-slate-100 border-slate-200 text-slate-900 shadow-md' 
          : 'bg-[#0A0A0A] border-[#222222] text-white shadow-2xl'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div 
              style={{ backgroundColor: page.bgColor || page.color + '20', color: page.color, borderColor: page.color + '40' }}
              className="p-3.5 rounded-xl border shadow-lg shrink-0 flex items-center justify-center font-mono font-bold"
            >
              {isAuthorSubPage ? (
                <User className="w-8 h-8" />
              ) : (
                <PageIcon className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-white uppercase">
                  {page.name}
                </h1>
                <span 
                  style={{ backgroundColor: page.color + '20', color: page.color, borderColor: page.color + '40' }}
                  className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold"
                >
                  {isAuthorSubPage 
                    ? `AUTHOR SHELF · PART OF ${parentPageObj?.name?.toUpperCase()}` 
                    : page.parentId 
                    ? 'NESTED SUB-SPACE' 
                    : isParentShelfSpace 
                    ? 'MASTER SHELF & CATALOG' 
                    : 'CUSTOM WORKSPACE'}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#181818] border border-[#2E2E2E] text-[#3FE769]">
                  {pageClips.length} {pageClips.length === 1 ? 'clip' : 'clips'}
                </span>
              </div>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${subtextClass}`}>
                {page.description || (isAuthorSubPage 
                  ? `Dedicated shelf and author collection for ${page.name}.` 
                  : `Specialized collection and analysis workspace for ${page.name}.`)}
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => onOpenAddClip(page.id)}
              className="px-4 py-2.5 rounded-xl bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(63,231,105,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Clip</span>
            </button>

            <button
              onClick={() => setShowVaultModal(true)}
              className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider cursor-pointer shadow-sm ${
                isLight
                  ? 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  : 'border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'
              }`}
              title="Add existing saved clips from your vault into this space"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add from Vault</span>
            </button>

            {onOpenCreateSubPage && (
              <button
                onClick={() => onOpenCreateSubPage(page)}
                className={`px-3.5 py-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider cursor-pointer ${
                  isLight
                    ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    : 'border-[#3FE769]/40 bg-[#3FE769]/10 hover:bg-[#3FE769]/20 text-[#3FE769]'
                }`}
                title={`Add author shelf or sub-page inside ${page.name}`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isParentShelfSpace ? 'Add Author Shelf' : 'Add Sub-Page'}</span>
              </button>
            )}

            {onOpenCreatePageModal && (
              <button
                onClick={onOpenCreatePageModal}
                className={`px-3.5 py-2.5 rounded-xl border transition-colors flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider cursor-pointer ${
                  isLight
                    ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    : 'border-[#262626] bg-[#141414] hover:bg-[#1C1C1C] text-stone-200'
                }`}
                title="Create a new custom analysis page"
              >
                <Plus className="w-4 h-4 text-stone-400" />
                <span>New Space</span>
              </button>
            )}

            {!page.isSystemDefault && onDeletePage && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${page.name}"?`)) {
                    onDeletePage(page.id);
                  }
                }}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600'
                    : 'border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400'
                }`}
                title="Delete this custom page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Sibling Author Switcher (When inside an author sub-page) ─── */}
      {isAuthorSubPage && parentPageObj && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0E0E0E] border border-[#222222] flex-wrap text-xs">
          <button
            onClick={() => setActiveTab && setActiveTab(parentPageObj.id)}
            className="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222] text-[#3FE769] hover:text-white border border-[#2A2A2A] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All {parentPageObj.name}</span>
          </button>
          <div className="h-4 w-px bg-[#262626]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#737373] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#3FE769]" />
            <span>Author Shelves:</span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#3FE769]/15 text-[#3FE769] border border-[#3FE769]/40 font-semibold flex items-center gap-1.5 shadow-sm">
            <User className="w-3 h-3" />
            <span>{page.name}</span>
            <span className="text-[10px] opacity-80">({pageClips.length})</span>
          </span>
          {siblingPages.map(sib => {
            const sibCount = clips.filter(c => c.pageId === sib.id).length;
            return (
              <button
                key={sib.id}
                onClick={() => setActiveTab && setActiveTab(sib.id)}
                className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1C1C1C] text-[#A1A1A1] hover:text-white border border-[#222222] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3 h-3 text-[#666]" />
                <span>{sib.name}</span>
                <span className="text-[10px] font-mono text-[#666]">({sibCount})</span>
              </button>
            );
          })}
          {onOpenCreateSubPage && (
            <button
              onClick={() => onOpenCreateSubPage(parentPageObj)}
              className="px-2.5 py-1.5 rounded-lg border border-dashed border-[#333] hover:border-[#3FE769] text-[#737373] hover:text-[#3FE769] transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              title={`Add another author shelf inside ${parentPageObj.name}`}
            >
              <Plus className="w-3 h-3" />
              <span>Add Author</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Author Shelves & Classified Spaces Gallery (In Parent Catalog Space) ─── */}
      {(subPages.length > 0 || isParentShelfSpace) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#3FE769]/10 border border-[#3FE769]/30 flex items-center justify-center text-[#3FE769]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Author Shelves & Classified Spaces</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#181818] border border-[#2A2A2A] text-[#3FE769] font-semibold">
                    {subPages.length} {subPages.length === 1 ? 'Shelf' : 'Shelves'}
                  </span>
                </h3>
                <p className="text-[11px] text-[#737373]">
                  Browse books classified by author or drill down into dedicated spaces.
                </p>
              </div>
            </div>

            {onOpenCreateSubPage && (
              <button
                onClick={() => onOpenCreateSubPage(page)}
                className="px-3 py-1.5 rounded-xl border border-[#3FE769]/40 bg-[#3FE769]/10 hover:bg-[#3FE769]/20 text-[#3FE769] text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Author Shelf</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subPages.map(sub => {
              const subClips = clips.filter(c => c.pageId === sub.id);
              const initials = sub.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AU';
              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveTab && setActiveTab(sub.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                    isLight
                      ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow-md'
                      : 'bg-[#0D0D0D] hover:bg-[#141414] border-[#222222] hover:border-[#3FE769]/50 shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div 
                          style={{ backgroundColor: sub.color + '20', color: sub.color, borderColor: sub.color + '40' }}
                          className="w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-inner"
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#3FE769] transition-colors">
                            {sub.name}
                          </h4>
                          <span className="text-[11px] font-mono text-[#878787] flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#3FE769]" />
                            <span>{subClips.length} {subClips.length === 1 ? 'book' : 'books'}</span>
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#555] group-hover:text-[#3FE769] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Book previews inside shelf */}
                    {subClips.length > 0 ? (
                      <div className="space-y-1 pt-1 border-t border-[#1C1C1C]">
                        {subClips.slice(0, 2).map(c => (
                          <p key={c.id} className="text-[11px] text-[#A1A1A1] truncate flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#3FE769] shrink-0" />
                            <span className="truncate">{c.title || c.url}</span>
                          </p>
                        ))}
                        {subClips.length > 2 && (
                          <span className="text-[10px] font-mono text-[#666] block">
                            +{subClips.length - 2} more in shelf
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] font-mono text-[#555] italic pt-1 border-t border-[#1C1C1C]">
                        Shelf empty — add clips or auto-route
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-[10px] font-mono text-[#737373]">
                    <span className="uppercase tracking-wider">Author Shelf</span>
                    <span className="text-[#3FE769] group-hover:underline">Open Space →</span>
                  </div>
                </div>
              );
            })}

            {/* + Add Author Shelf Action Card */}
            {onOpenCreateSubPage && (
              <button
                onClick={() => onOpenCreateSubPage(page)}
                className="p-5 rounded-2xl border border-dashed border-[#2A2A2A] hover:border-[#3FE769]/60 bg-[#0E0E0E]/40 hover:bg-[#141414] transition-all flex flex-col items-center justify-center gap-3 text-center group cursor-pointer min-h-[140px]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#161616] group-hover:bg-[#3FE769]/10 border border-[#2A2A2A] group-hover:border-[#3FE769]/40 flex items-center justify-center text-[#737373] group-hover:text-[#3FE769] transition-all">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-stone-200 group-hover:text-white block">
                    + Add Author Shelf
                  </span>
                  <span className="text-[10px] font-mono text-[#666]">
                    Create sub-page in {page.name}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── AI Workspace Insights Banner ─── */}
      <div className={`rounded-xl p-5 border relative overflow-hidden ${
        isLight ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-[#0E0E0E] border-[#1F1F1F] text-[#D4D4D4]'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3FE769]/10 border border-[#3FE769]/30 flex items-center justify-center shrink-0 text-[#3FE769]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#3FE769]">
                  AI Extraction Rule
                </span>
                <span className="text-[10px] font-mono text-[#666]">Active for this space</span>
              </div>
              <p className="text-xs leading-relaxed text-[#EDEDED] font-sans">
                "{page.aiGoalPrompt || 'Summarize key takeaways, main thesis, and actionable points.'}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-[#878787] flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-[#262626]">
              💻 {pageClips.filter(c => c.storageMode === 'local').length} Local
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-[#262626]">
              ☁ {pageClips.filter(c => c.storageMode === 'cloud').length} Cloud
            </span>
            {allTags.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-[#161616] border border-[#262626] text-[#A1A1A1]">
                {allTags.length} Unique Tags
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Controls & Filter Toolbar (Matching Main Clips Page) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search bar inside this space */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${pageClips.length} clips in ${page.name}...`}
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors ${innerBgClass}`}
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Storage Filter Pills */}
            <div className="flex items-center gap-1.5 font-sans text-xs bg-[#121212] p-1 rounded-xl border border-[#222]">
              <button
                onClick={() => setStorageFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition-all cursor-pointer ${
                  storageFilter === 'all'
                    ? 'bg-[#3FE769] text-black shadow-sm'
                    : 'text-[#878787] hover:text-white'
                }`}
              >
                All ({pageClips.length})
              </button>
              <button
                onClick={() => setStorageFilter('cloud')}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  storageFilter === 'cloud'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-[#878787] hover:text-white'
                }`}
              >
                <Cloud className="w-3 h-3" />
                <span>Cloud</span>
              </button>
              <button
                onClick={() => setStorageFilter('local')}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  storageFilter === 'local'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-[#878787] hover:text-white'
                }`}
              >
                <HardDrive className="w-3 h-3" />
                <span>Local</span>
              </button>
            </div>

            {/* View Mode Switcher (Grid / Columns / List) */}
            <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#222]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#242424] text-[#3FE769]' : 'text-[#737373] hover:text-white'
                }`}
                title="Grid layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('columns')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'columns' ? 'bg-[#242424] text-[#3FE769]' : 'text-[#737373] hover:text-white'
                }`}
                title="Columns / Masonry layout"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#242424] text-[#3FE769]' : 'text-[#737373] hover:text-white'
                }`}
                title="List layout"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Author Shelves Filter Pills (When on space with sub-spaces) ─── */}
        {subPages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-[#737373] mr-1 flex items-center gap-1">
              <User className="w-3 h-3 text-[#3FE769]" />
              <span>Author Shelf:</span>
            </span>
            <button
              onClick={() => setSelectedSubPageFilter('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedSubPageFilter === 'all'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#141414] border border-[#262626] text-[#878787] hover:text-white'
              }`}
            >
              All Books ({pageClips.length})
            </button>
            {subPages.map(sub => {
              const count = clips.filter(c => c.pageId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubPageFilter(sub.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedSubPageFilter === sub.id
                      ? 'bg-[#3FE769] text-black font-bold shadow-sm'
                      : 'bg-[#141414] border border-[#262626] text-[#878787] hover:text-white'
                  }`}
                >
                  <span>👤 {sub.name}</span>
                  <span className="opacity-75 font-semibold">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Intent Filter Pills (If clips have intents) */}
        {availableIntents.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
            <span className="text-[10px] font-mono uppercase text-[#737373] mr-1">Intent:</span>
            <button
              onClick={() => setSelectedIntent('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedIntent === 'all'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#141414] border border-[#262626] text-[#878787] hover:text-white'
              }`}
            >
              All
            </button>
            {availableIntents.map(intent => (
              <button
                key={intent}
                onClick={() => setSelectedIntent(intent)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedIntent.toLowerCase() === intent.toLowerCase()
                    ? 'bg-[#3FE769] text-black font-bold'
                    : 'bg-[#141414] border border-[#262626] text-[#878787] hover:text-white'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Clips Feed (Rendered with PolymorphicClipCard) ─── */}
      <div>
        {filteredClips.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[#262626] bg-[#0A0A0A] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#222] flex items-center justify-center mx-auto text-[#3FE769]">
              <PageIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-sans text-sm font-semibold text-white">No clips in this space yet</h3>
              <p className="text-xs text-[#737373] max-w-md mx-auto">
                Add any clip from your existing vault or save a new link directly into this space.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowVaultModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add from Vault</span>
              </button>
              <button
                onClick={() => onOpenAddClip(page.id)}
                className="px-4 py-2 rounded-xl bg-[#3FE769] hover:bg-[#34c759] text-black font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Clip</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'columns' ? (
          /* Masonry Columns Layout */
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
            {filteredClips.map((clip) => (
              <div key={clip.id} className="break-inside-avoid relative group">
                <PolymorphicClipCard
                  clip={clip}
                  isDark={isDark}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetail={(c) => setCinemaClip(c)}
                  onDelete={handleDeleteClip}
                  onSync={(c) => handleExportClick(c, 'notion')}
                  isSynced={Boolean(syncedState[`${clip.id}_notion`])}
                  customPages={customPages}
                  layoutMode="grid"
                />
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          /* List Layout */
          <div className="flex flex-col gap-3">
            {filteredClips.map((clip) => (
              <div key={clip.id} className="relative group">
                <PolymorphicClipCard
                  clip={clip}
                  isDark={isDark}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetail={(c) => setCinemaClip(c)}
                  onDelete={handleDeleteClip}
                  onSync={(c) => handleExportClick(c, 'notion')}
                  isSynced={Boolean(syncedState[`${clip.id}_notion`])}
                  customPages={customPages}
                  layoutMode="list"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClips.map((clip) => (
              <div key={clip.id} className="relative group">
                <PolymorphicClipCard
                  clip={clip}
                  isDark={isDark}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenDetail={(c) => setCinemaClip(c)}
                  onDelete={handleDeleteClip}
                  onSync={(c) => handleExportClick(c, 'notion')}
                  isSynced={Boolean(syncedState[`${clip.id}_notion`])}
                  customPages={customPages}
                  layoutMode="grid"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Cinema Viewer Modal (Distraction-Free Deep Reader) ─── */}
      {cinemaClip && (
        <ClipCinemaViewer
          clip={cinemaClip}
          allClips={pageClips}
          onClose={() => setCinemaClip(null)}
          onNavigate={(c) => setCinemaClip(c)}
          destinations={destinations}
          onSendToDestination={onSendToDestination || (() => {})}
          onToggleStorage={handleToggleClipStorage}
          onToggleFavorite={handleToggleFavorite}
          onDeleteClip={handleDeleteClip}
          isDark={isDark}
        />
      )}

      {/* ─── Add Existing Clips from Vault Modal ─── */}
      {showVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-[#EDEDED] flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C1C1C] bg-[#0E0E0E]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-sm">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-sans text-sm font-semibold text-white tracking-tight">Add Saved Clips to {page.name}</h2>
                  <p className="text-[11px] font-sans text-[#878787]">Select any existing clip from your total vault to file under this workspace.</p>
                </div>
              </div>
              <button
                onClick={() => setShowVaultModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#878787] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 border-b border-[#1C1C1C] bg-[#0B0B0B]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  type="text"
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder={`Search across ${availableVaultClips.length} available saved clips...`}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#141414] border border-[#262626] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] font-sans transition-colors"
                />
              </div>
            </div>

            {/* List of Available Clips */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-2.5 max-h-[50vh]">
              {filteredVaultClips.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#737373] space-y-1">
                  <p>{availableVaultClips.length === 0 ? "All saved clips are already in this workspace!" : "No clips match your search."}</p>
                  <p className="text-[11px] text-[#555]">Try typing another title, tag, or topic.</p>
                </div>
              ) : (
                filteredVaultClips.map(clip => {
                  const isAdding = addingClipIds.has(clip.id);
                  return (
                    <div
                      key={clip.id}
                      className="p-3.5 rounded-xl border border-[#222222] bg-[#121212] hover:border-[#333333] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {clip.faviconUrl ? (
                            <img src={clip.faviconUrl} alt="" className="w-3.5 h-3.5 rounded shrink-0" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5 text-[#3FE769] shrink-0" />
                          )}
                          <h3 className="text-xs font-semibold text-white truncate">{clip.title}</h3>
                        </div>
                        <p className="text-[11px] text-[#878787] truncate">{clip.summary || clip.url}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[#A1A1A1] border border-[#2A2A2A]">
                            {clip.type}
                          </span>
                          {clip.tags && clip.tags.slice(0, 3).map((t, idx) => (
                            <span key={idx} className="text-[9px] text-[#737373] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={isAdding}
                        onClick={() => handleAddClipToThisPage(clip.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#3FE769] hover:bg-[#34c759] text-black font-semibold text-[11px] uppercase tracking-wider shrink-0 transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isAdding ? 'Adding...' : 'Add to Space'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1C1C1C] flex items-center justify-between bg-[#0E0E0E] text-xs">
              <span className="text-[11px] text-[#737373]">
                Showing {filteredVaultClips.length} of {availableVaultClips.length} available clips
              </span>
              <button
                onClick={() => setShowVaultModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] text-white text-xs font-semibold transition-colors cursor-pointer border border-[#2E2E2E]"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
