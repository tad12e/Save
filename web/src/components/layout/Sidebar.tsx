import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Radio,
  Bookmark,
  Briefcase,
  Sparkles,
  Settings,
  BarChart3,
  Layers,
  Lock,
  ChevronsUpDown,
  MoreVertical,
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
  collapsed?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bookmark,
};

// Static copy of Stitch Premium sidebar (256px, light).
// Wiring preserved: tab switching, custom pages (if any), extension toggle
// on the unfold control. `collapsed` renders a 64px icon rail.
export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { activeTab, setActiveTab, customPages, toggleExtensionWidget, collapsed = false } = props;
  const reduceMotion = useReducedMotion();
  const pillSpring = { type: 'spring', stiffness: 380, damping: 30 } as const;

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'connections', label: 'Connections', icon: <Radio className="w-[18px] h-[18px]" /> },
    { id: 'clips', label: 'Clips', icon: <Bookmark className="w-[18px] h-[18px]" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-[18px] h-[18px]" /> },
    { id: 'digest', label: 'Digest', icon: <Sparkles className="w-[18px] h-[18px]" /> },
    { id: 'boards', label: 'Boards', icon: <Layers className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
  ];

  // User created custom pages (exclude system defaults rendered above)
  const userCustomPages = customPages.filter(
    (p) => p.id !== 'page_job' && p.id !== 'page_education'
  );

  if (collapsed) {
    return (
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-[64px] bg-white border-r border-slate-200 flex-col items-center py-4 justify-between select-none">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col items-center gap-1.5 mt-4">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#a1f4c8] text-[#0f5238]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-[256px] bg-white border-r border-slate-200 flex-col justify-between transition-all duration-200 select-none">
      <div className="flex flex-col">
        <div className="h-[64px] px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2D6A4F] rounded-lg flex items-center justify-center shrink-0">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-[15px] leading-[22px] font-semibold text-slate-900 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Save
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#a1f4c8]/50 text-[#005236] text-[11px] leading-[14px] tracking-[0.02em] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#116c4a]"></span>
            <span>Vault</span>
          </div>
        </div>
        <div className="px-3 py-3">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-3 h-9 rounded-lg transition-colors font-medium text-[14px] leading-[20px] ${
                    isActive
                      ? 'text-[#0f5238]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isActive &&
                    (reduceMotion ? (
                      <span className="absolute inset-0 bg-[#a1f4c8] rounded-lg" />
                    ) : (
                      <motion.span
                        layoutId="side-pill"
                        className="absolute inset-0 bg-[#a1f4c8] rounded-lg"
                        transition={{ ...pillSpring }}
                      />
                    ))}
                  <span className="relative z-10 flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </motion.button>
              );
            })}
            {userCustomPages.map((page) => {
              const isActive = activeTab === page.id;
              const PageIconComp = ICON_MAP[page.iconName] || Bookmark;
              return (
                <button
                  key={page.id}
                  onClick={() => setActiveTab(page.id)}
                  className={`flex items-center gap-3 px-3 h-9 rounded-lg transition-colors font-medium text-[14px] leading-[20px] ${
                    isActive
                      ? 'bg-[#a1f4c8] text-[#0f5238]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <PageIconComp className="w-[18px] h-[18px]" />
                  <span className="truncate">{page.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex flex-col border-t border-slate-200">
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-[18px] h-[18px] text-slate-500" />
              <span className="font-medium text-[14px] leading-[20px] text-slate-700 truncate">
                Main Vault
              </span>
            </div>
            <button
              onClick={toggleExtensionWidget}
              title="Toggle Clipper Extension"
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] leading-[14px] text-slate-500">Cloud Synced</span>
            </div>
            <span className="text-[11px] leading-[14px] text-slate-400">Just now</span>
          </div>
        </div>
        <div className="p-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white text-[11px] font-sans font-bold flex items-center justify-center shrink-0">
              AR
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-[13px] leading-[20px] text-slate-700 truncate">
                Alex Rivera
              </span>
              <span className="text-[11px] leading-[14px] text-slate-500 truncate">alex@vault.io</span>
            </div>
          </div>
          <button
            aria-label="User actions"
            className="h-11 w-11 flex items-center justify-center text-slate-500 hover:text-slate-700 rounded transition-colors"
          >
            <MoreVertical className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
