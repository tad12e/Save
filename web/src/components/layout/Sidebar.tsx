import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bookmark,
  Lock,
  ChevronsUpDown,
  MoreVertical,
  LogOut,
  KeyRound,
  User,
  Settings,
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
  theme?: 'terminal' | 'dark' | 'light';
  currentUser?: { name: string; email: string } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

// ---------------------------------------------------------------------------
// Sidebar Icons matching Stitch Reference Designs exactly
// ---------------------------------------------------------------------------
export const HomeIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

export const AnalyticsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 17.5 8.5 11 13.5 15 20.5 7.5" />
    <circle cx="3.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="11" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="13.5" cy="15" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="20.5" cy="7.5" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const ConnectionsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="12" x2="6.5" y2="6.5" />
    <line x1="12" y1="12" x2="17.5" y2="6.5" />
    <line x1="12" y1="12" x2="6.5" y2="17.5" />
    <line x1="12" y1="12" x2="17.5" y2="17.5" />
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="6.5" cy="6.5" r="1.8" />
    <circle cx="17.5" cy="6.5" r="1.8" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
);

export const ClipsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const JobsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

export const DigestIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
    <path d="m19 19-.9 2.1a.5.5 0 0 1-.2.2L16 22l1.9.9a.5.5 0 0 1 .2.2l.9 1.9.9-1.9a.5.5 0 0 1 .2-.2l2.1-.9-2.1-.9a.5.5 0 0 1-.2-.2z" />
  </svg>
);

export const BoardsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const FeedIcon: React.FC<{ className?: string }> = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1.75" fill="currentColor" stroke="none" />
  </svg>
);

const ICON_MAP: Record<string, React.ElementType> = {
  Bookmark: ClipsIcon,
  Home: HomeIcon,
  Feed: FeedIcon,
  Analytics: AnalyticsIcon,
  Connections: ConnectionsIcon,
  Jobs: JobsIcon,
  Digest: DigestIcon,
  Boards: BoardsIcon,
  Settings: SettingsIcon,
};

// Static copy of Stitch Premium sidebar (256px).
// Wiring preserved: tab switching, custom pages (if any), extension toggle
// on the unfold control. `collapsed` renders a 64px icon rail.
export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    activeTab,
    setActiveTab,
    customPages,
    toggleExtensionWidget,
    collapsed = false,
    theme = 'dark',
    currentUser,
    onOpenAuthModal,
    onLogout,
  } = props;
  const isDark = theme === 'dark' || theme === 'terminal';
  const reduceMotion = useReducedMotion();
  const pillSpring = { type: 'spring', stiffness: 380, damping: 30 } as const;
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName = currentUser?.name || 'Guest User';
  const userEmail = currentUser?.email || 'Not signed in';
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0].toUpperCase())
        .slice(0, 2)
        .join('')
    : 'GU';

  const navItems: { id: string; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Home', icon: <HomeIcon className="w-[18px] h-[18px]" /> },
    { id: 'feed', label: 'Feed', icon: <FeedIcon className="w-[18px] h-[18px]" />, badge: 'LIVE' },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-[18px] h-[18px]" /> },
    { id: 'connections', label: 'Connections', icon: <ConnectionsIcon className="w-[18px] h-[18px]" /> },
    { id: 'clips', label: 'Clips', icon: <ClipsIcon className="w-[18px] h-[18px]" /> },
    { id: 'jobs', label: 'Jobs', icon: <JobsIcon className="w-[18px] h-[18px]" /> },
    { id: 'digest', label: 'Digest', icon: <DigestIcon className="w-[18px] h-[18px]" /> },
    { id: 'boards', label: 'Boards', icon: <BoardsIcon className="w-[18px] h-[18px]" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-[18px] h-[18px]" /> },
  ];

  // User created custom pages (exclude system defaults rendered above)
  const userCustomPages = customPages.filter(
    (p) => p.id !== 'page_job' && p.id !== 'page_education'
  );

  if (collapsed) {
    return (
      <aside
        className={`hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-[64px] border-r flex-col items-center py-4 justify-between select-none transition-colors duration-200 ${
          isDark ? 'bg-[#000000] border-[#1F1F1F]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isDark ? 'bg-[#1C1B1B] border border-[#2A2A2A]' : 'bg-[#2D6A4F]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-white'}`} />
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
                      ? isDark
                        ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                        : 'bg-[#a1f4c8] text-[#0f5238]'
                      : isDark
                      ? 'text-[#878787] hover:bg-[#181818] hover:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setActiveTab('settings')}
              title={`${userName} (${userEmail})`}
              className={`w-8 h-8 rounded-full text-[11px] font-sans font-bold flex items-center justify-center border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#1C1B1B] border-[#2A2A2A] text-[#3FE769] hover:border-[#3FE769]'
                  : 'bg-[#2D6A4F] text-white border-emerald-600 hover:bg-[#245640]'
              }`}
            >
              {userInitials}
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Sign In"
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#1C1B1B] border-[#2A2A2A] text-[#878787] hover:text-[#3FE769] hover:border-[#3FE769]'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FE769]"></span>
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 bottom-0 z-40 w-[256px] border-r flex-col justify-between transition-all duration-200 select-none ${
        isDark ? 'bg-[#000000] border-[#1F1F1F]' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col">
        <div
          className={`h-[64px] px-4 border-b flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F]' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isDark ? 'bg-[#1C1B1B] border border-[#2A2A2A]' : 'bg-[#2D6A4F]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-white'}`} />
            </div>
            <span
              className={`text-[15px] leading-[22px] font-semibold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Save
            </span>
          </div>
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] leading-[14px] tracking-[0.02em] font-medium ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                : 'bg-[#a1f4c8]/50 text-[#005236]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#116c4a]'}`}></span>
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
                  className={`group relative flex items-center gap-3 px-3 h-9 rounded-lg transition-colors font-medium text-[14px] leading-[20px] ${
                    isActive
                      ? isDark
                        ? 'text-white'
                        : 'text-[#0f5238]'
                      : isDark
                      ? 'text-[#A1A1A1] hover:bg-[#181818] hover:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {isActive &&
                    (reduceMotion ? (
                      <span
                        className={`absolute inset-0 rounded-lg ${
                          isDark ? 'bg-[#1C1B1B] border border-[#262626]' : 'bg-[#a1f4c8]'
                        }`}
                      />
                    ) : (
                      <motion.span
                        layoutId="side-pill"
                        className={`absolute inset-0 rounded-lg ${
                          isDark ? 'bg-[#1C1B1B] border border-[#262626]' : 'bg-[#a1f4c8]'
                        }`}
                        transition={{ ...pillSpring }}
                      />
                    ))}
                  <span className="relative z-10 flex items-center justify-between w-full">
                    <span className="flex items-center gap-3">
                      <span
                        className={`transition-colors ${
                          isActive
                            ? isDark
                              ? 'text-[#3FE769]'
                              : 'text-[#0f5238]'
                            : isDark
                            ? 'text-[#878787] group-hover:text-white'
                            : 'text-slate-500 group-hover:text-slate-900'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider leading-none ${
                        isActive
                          ? isDark ? 'bg-[#3FE769]/20 text-[#3FE769]' : 'bg-[#0f5238]/20 text-[#0f5238]'
                          : isDark ? 'bg-[#181818] text-[#3FE769] border border-[#262626]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
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
                      ? isDark
                        ? 'bg-[#1C1B1B] text-white border border-[#262626]'
                        : 'bg-[#a1f4c8] text-[#0f5238]'
                      : isDark
                      ? 'text-[#A1A1A1] hover:bg-[#181818] hover:text-white'
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
      <div className={`flex flex-col border-t ${isDark ? 'border-[#1F1F1F]' : 'border-slate-200'}`}>
        <div className="p-3 flex flex-col gap-2">
          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#181818]' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Lock className={`w-[18px] h-[18px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`} />
              <span
                className={`font-medium text-[14px] leading-[20px] truncate ${
                  isDark ? 'text-[#EDEDED]' : 'text-slate-700'
                }`}
              >
                Main Vault
              </span>
            </div>
            <button
              onClick={toggleExtensionWidget}
              title="Toggle Clipper Extension"
              className={`transition-colors ${
                isDark ? 'text-[#878787] hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FE769] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FE769]"></span>
              </span>
              <span
                className={`text-[11px] leading-[14px] ${
                  isDark ? 'text-[#878787]' : 'text-slate-500'
                }`}
              >
                Cloud Synced
              </span>
            </div>
            <span
              className={`text-[11px] leading-[14px] ${
                isDark ? 'text-[#666666]' : 'text-slate-400'
              }`}
            >
              Just now
            </span>
          </div>
        </div>
        <div
          className={`p-3 border-t relative ${
            isDark ? 'border-[#1F1F1F]' : 'border-slate-200'
          }`}
        >
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div
                className={`absolute bottom-full mb-2 left-2 right-2 rounded-xl shadow-2xl z-50 p-2 border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="px-2 py-1.5 border-b mb-1 border-opacity-10 border-current">
                  <div className="text-[12px] font-sans font-semibold truncate">
                    {userName}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    {userEmail}
                  </div>
                </div>

                {currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-sans transition-colors cursor-pointer ${
                        isDark ? 'hover:bg-[#181818] text-[#D1D5DB]' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 text-[#3FE769]" />
                      Account Settings
                    </button>
                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-sans text-red-500 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-[#181818]' : 'hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuthModal?.();
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-sans font-semibold transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#1C1B1B] hover:bg-[#222222] text-[#3FE769] border border-[#2A2A2A]'
                        : 'bg-[#2D6A4F] text-white hover:bg-[#245640]'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Sign In / Register
                  </button>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                if (currentUser) {
                  setShowUserMenu(!showUserMenu);
                } else {
                  onOpenAuthModal?.();
                }
              }}
              className="flex items-center gap-2 min-w-0 cursor-pointer flex-1 group"
              title={currentUser ? `${userName} (${userEmail})` : 'Click to Sign In'}
            >
              <div
                className={`w-8 h-8 rounded-full text-[11px] font-sans font-bold flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  isDark
                    ? 'bg-[#1C1B1B] border border-[#2A2A2A] text-[#3FE769]'
                    : 'bg-[#2D6A4F] text-white'
                }`}
              >
                {currentUser ? userInitials : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-medium text-[13px] leading-[20px] truncate ${
                    isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-700 group-hover:text-[#2D6A4F]'
                  }`}
                >
                  {userName}
                </span>
                <span
                  className={`text-[11px] leading-[14px] truncate ${
                    isDark ? 'text-[#878787]' : 'text-slate-500'
                  }`}
                >
                  {currentUser ? userEmail : 'Click to sign in'}
                </span>
              </div>
            </div>
            <button
              aria-label="User actions"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`h-8 w-8 flex items-center justify-center rounded transition-colors cursor-pointer ${
                isDark ? 'text-[#878787] hover:text-white hover:bg-[#181818]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
