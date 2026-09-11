import React, { useState } from 'react';
import {
  Search,
  Bell,
  CheckCircle,
  RefreshCw,
  Sparkles,
  LogOut,
  KeyRound,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { DestinationConfig } from '../../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  destinations: DestinationConfig[];
  onQuickAddClip: () => void;
  onOpenMusicRadar?: () => void;
  onRefreshSync: () => void;
  isRefreshing: boolean;
  theme: 'terminal' | 'dark' | 'light';
  setTheme: (theme: 'terminal' | 'dark' | 'light') => void;
  currentUser?: { name: string; email: string } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

// Stitch Premium header (64px, glassy / dark).
export const Header: React.FC<HeaderProps> = (props) => {
  const {
    searchQuery,
    setSearchQuery,
    onRefreshSync,
    isRefreshing,
    theme,
    setTheme,
    currentUser,
    onOpenAuthModal,
    onLogout,
    onToggleSidebar,
    sidebarCollapsed = false,
  } = props;
  const isDark = theme === 'dark' || theme === 'terminal';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  return (
    <header
      className={`fixed top-0 right-0 h-[64px] z-30 border-b flex items-center justify-between px-6 left-0 transition-colors duration-200 ${
        sidebarCollapsed ? 'md:left-[64px]' : 'md:left-[256px]'
      } ${
        isDark
          ? 'bg-[#000000]/95 border-[#1F1F1F] backdrop-blur-[12px]'
          : 'bg-white/85 border-slate-200 backdrop-blur-[12px]'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          aria-label="Collapse sidebar"
          onClick={onToggleSidebar}
          className={`h-11 w-11 hidden md:flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-[#878787] hover:text-white hover:bg-[#181818]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <div className="relative w-[280px] lg:w-[420px] group">
          <span
            className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
              isDark ? 'text-[#666666]' : 'text-slate-400'
            }`}
          >
            <Search className="w-[18px] h-[18px]" />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full h-10 pl-9 pr-12 rounded-xl text-[13px] leading-[20px] focus:outline-none transition-all shadow-sm ${
              isDark
                ? 'text-white bg-[#111111] border border-[#262626] placeholder:text-[#666666] focus:border-[#3FE769] focus:ring-4 focus:ring-[#3FE769]/15 focus:bg-[#181818]'
                : 'text-slate-700 bg-slate-50 border border-slate-200 placeholder:text-slate-400 focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/15 focus:bg-white'
            }`}
            placeholder="Search opportunities, clips, notes... (Ctrl+K)"
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd
              className={`text-[11px] leading-[14px] px-1.5 py-0.5 rounded border shadow-sm ${
                isDark
                  ? 'border-[#262626] bg-[#181818] text-[#878787]'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] leading-[14px] border ${
            isDark
              ? 'bg-[#181818] text-[#3FE769] border-[#262626]'
              : 'bg-slate-100 text-slate-600 border-slate-200/50'
          }`}
        >
          <RefreshCw
            className={`w-[14px] h-[14px] ${isDark ? 'text-[#3FE769]' : 'text-emerald-600'} ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span>Ready</span>
        </div>

        <button
          onClick={onRefreshSync}
          title="Force Sync"
          className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-[#878787] hover:text-white hover:bg-[#181818]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative h-10 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-[#878787] hover:text-white hover:bg-[#181818]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 ring-2 ${
                isDark ? 'ring-black' : 'ring-white'
              }`}
            ></span>
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl z-50 p-4 space-y-3 border ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626] text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div
                className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
                }`}
              >
                <span className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  System Activity
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                    isDark
                      ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  2 New
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border flex gap-2.5 ${
                  isDark
                    ? 'bg-[#141414] border-[#222222]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <CheckCircle className={`w-4 h-4 text-[#3FE769] shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-sans font-semibold">Google Sheets Sync Complete</p>
                  <p
                    className={`text-[11px] font-mono mt-0.5 ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    Row #143 appended to Vault 2026
                  </p>
                  <p className="text-[9px] font-mono text-[#3FE769] mt-1 uppercase tracking-wider">
                    2 mins ago
                  </p>
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border flex gap-2.5 ${
                  isDark
                    ? 'bg-[#141414] border-[#222222]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-sans font-semibold">AI Weekly Digest Ready</p>
                  <p
                    className={`text-[11px] font-mono mt-0.5 ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    12 opportunities scored &amp; grouped
                  </p>
                  <p className="text-[9px] font-mono text-[#3FE769] mt-1 uppercase tracking-wider">
                    1 hour ago
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Theme Toggle (Sun / Moon) in Header */}
        <button
          onClick={() => {
            const nextTheme = isDark ? 'light' : 'dark';
            setTheme(nextTheme);
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`h-10 w-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-[#3FE769] hover:bg-[#181818]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className={`h-5 w-px ${isDark ? 'bg-[#262626]' : 'bg-slate-200'}`}></div>

        {currentUser ? (
          <div className="relative">
            <button onClick={() => setShowAccount(!showAccount)} title={currentUser.name}>
              <div
                className={`w-9 h-9 rounded-full text-[11px] font-sans font-bold flex items-center justify-center ring-1 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${
                  isDark
                    ? 'bg-[#1C1B1B] border border-[#2A2A2A] text-[#3FE769] ring-[#262626]'
                    : 'bg-[#2D6A4F] text-white ring-slate-200'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </button>
            {showAccount && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl z-50 p-3 border ${
                  isDark
                    ? 'bg-[#0E0E0E] border-[#262626] text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="px-2 py-1.5">
                  <div className="text-[13px] font-sans font-semibold truncate">
                    {currentUser.name}
                  </div>
                  <div
                    className={`text-[11px] font-sans truncate ${
                      isDark ? 'text-[#878787]' : 'text-slate-500'
                    }`}
                  >
                    {currentUser.email}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setShowAccount(false);
                    }}
                    className={`w-full mt-1 flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-sans text-red-500 transition-colors ${
                      isDark ? 'hover:bg-[#181818]' : 'hover:bg-red-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white transition-colors flex items-center gap-1.5 ${
              isDark ? 'bg-[#1C1B1B] hover:bg-[#222222] border border-[#2A2A2A] text-[#3FE769]' : 'bg-[#2D6A4F] hover:bg-[#245640]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
