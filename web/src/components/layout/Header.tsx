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

// Static copy of Stitch Premium header (64px, glassy).
// Wiring preserved: global search, notifications, manual sync, auth menu,
// sidebar collapse toggle.
export const Header: React.FC<HeaderProps> = (props) => {
  const {
    searchQuery,
    setSearchQuery,
    onRefreshSync,
    isRefreshing,
    currentUser,
    onOpenAuthModal,
    onLogout,
    onToggleSidebar,
    sidebarCollapsed = false,
  } = props;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  return (
    <header
      className={`fixed top-0 right-0 h-[64px] z-30 bg-white/85 backdrop-blur-[12px] border-b border-slate-200 flex items-center justify-between px-6 left-0 ${
        sidebarCollapsed ? 'md:left-[64px]' : 'md:left-[256px]'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          aria-label="Collapse sidebar"
          onClick={onToggleSidebar}
          className="h-11 w-11 hidden md:flex items-center justify-center text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <div className="relative w-[280px] lg:w-[420px] group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-[18px] h-[18px]" />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-12 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-[13px] leading-[20px] placeholder:text-slate-400 focus:outline-none focus:border-[#2D6A4F] focus:ring-4 focus:ring-[#2D6A4F]/15 focus:bg-white transition-all shadow-sm"
            placeholder="Search opportunities, clips, notes... (Ctrl+K)"
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[11px] leading-[14px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-400 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] leading-[14px] border border-slate-200/50">
          <RefreshCw className={`w-[14px] h-[14px] text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Ready</span>
        </div>
        <button
          onClick={onRefreshSync}
          title="Force Sync"
          className="hidden sm:flex h-11 w-11 items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-11 w-11 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-xl z-50 p-4 space-y-3 border bg-white border-slate-200 text-slate-900">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  System Activity
                </span>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  2 New
                </span>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 flex gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-sans font-semibold">Google Sheets Sync Complete</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">Row #143 appended to Vault 2026</p>
                  <p className="text-[9px] font-mono text-emerald-600 mt-1 uppercase tracking-wider">2 mins ago</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border bg-slate-50 border-slate-200 flex gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-sans font-semibold">AI Weekly Digest Ready</p>
                  <p className="text-slate-500 text-[11px] font-mono mt-0.5">12 opportunities scored & grouped</p>
                  <p className="text-[9px] font-mono text-emerald-600 mt-1 uppercase tracking-wider">1 hour ago</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="h-5 w-px bg-slate-200"></div>
        {currentUser ? (
          <div className="relative">
            <button onClick={() => setShowAccount(!showAccount)} title={currentUser.name}>
              <div className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white text-[11px] font-sans font-bold flex items-center justify-center ring-1 ring-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </button>
            {showAccount && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl z-50 p-3 border bg-white border-slate-200">
                <div className="px-2 py-1.5">
                  <div className="text-[13px] font-sans font-semibold text-slate-900 truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] font-sans text-slate-500 truncate">
                    {currentUser.email}
                  </div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setShowAccount(false);
                    }}
                    className="w-full mt-1 flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-sans text-red-600 hover:bg-red-50 transition-colors"
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
            className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold bg-[#2D6A4F] hover:bg-[#245640] text-white transition-colors flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
