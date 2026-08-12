import React from 'react';
import { 
  LayoutDashboard,
  Radio, 
  Bookmark, 
  Briefcase, 
  Sparkles, 
  Users, 
  Settings, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Puzzle,
  GraduationCap,
  Plus,
  BookOpen,
  Cpu,
  FolderGit2,
  Code2,
  Lightbulb,
  Layers,
  Compass,
  Rocket,
  Terminal
} from 'lucide-react';
import { CustomPageConfig } from '../../types';

export type TabType = string;

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeConnectionsCount: number;
  totalClipsCount: number;
  customPages: CustomPageConfig[];
  onOpenCreatePageModal: () => void;
  toggleExtensionWidget: () => void;
  isExtensionOpen: boolean;
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
  Rocket,
  Terminal,
  Bookmark
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  activeConnectionsCount,
  totalClipsCount,
  customPages,
  onOpenCreatePageModal,
  toggleExtensionWidget,
  isExtensionOpen,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Standard main menu items
  const mainNavItems = [
    { 
      id: 'dashboard', 
      label: 'Home', 
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    { 
      id: 'clips', 
      label: 'Save Clips', 
      icon: <Bookmark className="w-4 h-4" />,
      badge: totalClipsCount 
    },
    { 
      id: 'page_job', 
      label: 'Job Opportunities', 
      icon: <Briefcase className="w-4 h-4" /> 
    },
    { 
      id: 'page_education', 
      label: 'Education & Academics', 
      icon: <GraduationCap className="w-4 h-4" /> 
    },
  ];

  const secondaryItems = [
    { 
      id: 'connections', 
      label: 'Connections', 
      icon: <Radio className="w-4 h-4" />,
      badge: `${activeConnectionsCount} Active` 
    },
    { 
      id: 'digest', 
      label: 'AI Weekly Digest', 
      icon: <Sparkles className="w-4 h-4" />,
      isNew: true
    },
    { 
      id: 'boards', 
      label: 'Shared Boards', 
      icon: <Users className="w-4 h-4" /> 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-4 h-4" /> 
    },
  ];

  // User created custom pages (exclude system defaults rendered above)
  const userCustomPages = customPages.filter(p => p.id !== 'page_job' && p.id !== 'page_education');

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 z-50 bg-[#080808] text-stone-200 flex flex-col h-screen border-r border-white/10 select-none transition-all duration-300 ease-in-out scrollbar-none ${
        isHovered
          ? 'w-64 shadow-2xl overflow-y-auto scrollbar-none'
          : 'w-16 overflow-y-auto scrollbar-none'
      }`}
    >
      {/* COLLAPSED ICON RAIL VIEW (When NOT Hovered) */}
      {!isHovered ? (
        <div className="flex flex-col items-center py-4 px-2 h-full justify-between">
          {/* Brand Logo Icon */}
          <div 
            className="w-10 h-10 bg-amber-500 rounded-sm flex items-center justify-center text-black font-serif font-black text-xl shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
            title="SAVE PRO - Universal Vault"
          >
            S
          </div>

          {/* Vertical Icon Rail */}
          <div className="flex-1 flex flex-col items-center gap-1.5 mt-5 w-full overflow-y-auto py-1 scrollbar-none">
            {/* Core Nav Icons */}
            {mainNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={`${item.label}${item.badge !== undefined ? ` (${item.badge})` : ''}`}
                  className={`w-10 h-10 rounded-sm flex items-center justify-center relative transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-mono font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator */}
            <div className="w-8 h-[1px] bg-white/10 my-1.5 shrink-0" />

            {/* Custom Pages Icons */}
            {userCustomPages.map((page) => {
              const isActive = activeTab === page.id;
              const PageIconComp = ICON_MAP[page.iconName] || Bookmark;
              return (
                <button
                  key={page.id}
                  onClick={() => setActiveTab(page.id)}
                  title={page.name}
                  className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <PageIconComp className="w-4 h-4" style={{ color: page.color }} />
                </button>
              );
            })}

            {/* Create Page Icon */}
            <button
              onClick={onOpenCreatePageModal}
              title="Create New Custom Page"
              className="w-10 h-10 rounded-sm flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-dashed border-amber-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Separator */}
            <div className="w-8 h-[1px] bg-white/10 my-1.5 shrink-0" />

            {/* Secondary Utils Icons */}
            {secondaryItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}

            {/* Chrome Extension Icon */}
            <button
              onClick={toggleExtensionWidget}
              title="Save Chrome Extension"
              className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all mt-1 ${
                isExtensionOpen
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-stone-400 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Puzzle className="w-4 h-4 text-amber-500" />
            </button>
          </div>

          {/* Active Vault Pulse Dot */}
          <div className="mt-2 pt-2 flex items-center justify-center shrink-0" title="Vault Active - 100% Online">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>
        </div>
      ) : (
        /* EXPANDED FULL SIDEBAR VIEW (When Hovered) */
        <>
          {/* Brand Header */}
          <div className="h-20 px-4 border-b border-white/5 flex items-center justify-between bg-[#080808] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-amber-500 rounded-sm flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20 shrink-0">
                <span className="font-serif text-lg font-black">S</span>
              </div>
              <div className="whitespace-nowrap min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-bold text-white tracking-tight uppercase">SAVE</h1>
                  <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                    PRO
                  </span>
                </div>
                <p className="text-[9px] font-mono text-stone-500 tracking-wider uppercase">Universal Vault</p>
              </div>
            </div>

            <div className="text-stone-500 hover:text-amber-400 p-1 rounded transition-colors shrink-0">
              <ChevronRight className="w-4 h-4 rotate-90 text-amber-400" />
            </div>
          </div>

          {/* Main Navigation Drawer Content */}
          <div className="p-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
            
            {/* Core Nav Header */}
            <div className="px-3 pt-2 pb-1 text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500 font-semibold">
              NAVIGATION
            </div>

            {mainNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-400'}`}>
                      {item.icon}
                    </span>
                    <span className={`text-xs font-sans whitespace-nowrap ${
                      isActive ? 'font-serif text-white tracking-wide' : ''
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'bg-stone-900 text-stone-400 border border-white/5'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* CUSTOM PAGES SECTION */}
            <div className="pt-4 mt-2 border-t border-white/5">
              <div className="px-3 pb-1.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500 font-semibold">
                <span>CUSTOM PAGES</span>
                <button
                  onClick={onOpenCreatePageModal}
                  className="text-amber-500 hover:text-amber-300 flex items-center gap-1 font-mono uppercase text-[9px] tracking-wider transition-colors hover:underline"
                  title="Create New Custom Page"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create</span>
                </button>
              </div>

              {/* User Custom Pages List */}
              <div className="space-y-1">
                {userCustomPages.map((page) => {
                  const isActive = activeTab === page.id;
                  const PageIconComp = ICON_MAP[page.iconName] || Bookmark;

                  return (
                    <button
                      key={page.id}
                      onClick={() => setActiveTab(page.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm'
                          : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span 
                          style={{ color: page.color }}
                          className="shrink-0 p-1 rounded bg-white/5 border border-white/5"
                        >
                          <PageIconComp className="w-3.5 h-3.5" />
                        </span>
                        <span className={`text-xs font-sans truncate whitespace-nowrap ${
                          isActive ? 'font-serif text-white tracking-wide' : ''
                        }`}>
                          {page.name}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Create Page Button */}
                <button
                  onClick={onOpenCreatePageModal}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-dashed border-amber-500/30 transition-all font-mono uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4 shrink-0 text-amber-500" />
                  <span className="text-[11px] font-bold">+ Create Page</span>
                </button>
              </div>
            </div>

            {/* SECONDARY SETTINGS & UTILS */}
            <div className="pt-4 mt-2 border-t border-white/5">
              <div className="px-3 pb-1 text-[9px] font-mono uppercase tracking-[0.2em] text-stone-500 font-semibold">
                SETTINGS & UTILS
              </div>

              {secondaryItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                        : 'text-stone-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-stone-400'}`}>
                        {item.icon}
                      </span>
                      <span className={`text-xs font-sans whitespace-nowrap ${
                        isActive ? 'font-serif text-white tracking-wide' : ''
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-stone-900 text-stone-400 border border-white/5">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Chrome Extension Widget Trigger Box */}
            <div className="mt-4 pt-4 border-t border-white/5 px-1">
              <div className="bg-[#050505] border border-white/5 rounded-sm p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-serif text-white">
                  <Puzzle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">Save Chrome Extension</span>
                </div>
                <button
                  onClick={toggleExtensionWidget}
                  className={`w-full py-1.5 px-2 rounded-sm text-[10px] font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                    isExtensionOpen
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 font-bold'
                      : 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span className="truncate">{isExtensionOpen ? 'Active Widget' : 'Launch Extension'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Sync Health & Vault Footer */}
          <div className="p-3 border-t border-white/5 bg-[#050505] shrink-0">
            <div className="flex items-center justify-between p-2 rounded-sm bg-[#080808] border border-white/5 text-xs text-stone-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-mono text-[9px] text-stone-300 tracking-wider">
                  VAULT ACTIVE
                </span>
              </div>
              <span className="text-[9px] text-amber-500 font-mono">100% ONLINE</span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
