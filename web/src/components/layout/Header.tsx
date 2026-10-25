import React, { useState, useMemo } from 'react';
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
  Upload,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { DestinationConfig, ConnectionSyncLog, ClipItem } from '../../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  destinations: DestinationConfig[];
  onQuickAddClip: () => void;
  onOpenBulkImport?: () => void;
  onOpenMusicRadar?: () => void;
  onOpenCreatePageModal?: () => void;
  onRefreshSync: () => void;
  isRefreshing: boolean;
  theme: 'terminal' | 'dark' | 'light';
  setTheme: (theme: 'terminal' | 'dark' | 'light') => void;
  currentUser?: { name: string; email: string } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  logs?: ConnectionSyncLog[];
  clips?: ClipItem[];
}

function formatRelativeTime(dateInput?: string): string {
  if (!dateInput) return 'Just now';
  const parsed = Date.parse(dateInput);
  if (isNaN(parsed)) return dateInput;
  const diffSec = Math.floor((Date.now() - parsed) / 1000);
  if (diffSec < 0 || diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// Stitch Premium header (64px, glassy / dark).
export const Header: React.FC<HeaderProps> = (props) => {
  const {
    searchQuery,
    setSearchQuery,
    onOpenBulkImport,
    onOpenCreatePageModal,
    onRefreshSync,
    isRefreshing,
    theme,
    setTheme,
    currentUser,
    onOpenAuthModal,
    onLogout,
    onToggleSidebar,
    sidebarCollapsed = false,
    logs = [],
    clips = [],
  } = props;
  const isDark = theme === 'dark' || theme === 'terminal';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [clearedAt, setClearedAt] = useState<number>(0);

  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      timeAgo: string;
      timestamp: number;
      type: 'sync_success' | 'sync_failed' | 'sync_pending' | 'clip_saved';
    }> = [];

    // 1. Live Destination Sync Logs from PostgreSQL backend
    if (logs && logs.length > 0) {
      for (const log of logs.slice(0, 10)) {
        const ts = log.timestamp ? Date.parse(log.timestamp) || Date.now() : Date.now();
        if (ts <= clearedAt) continue;

        if (log.status === 'failed') {
          list.push({
            id: `log-${log.id}`,
            title: `${log.destinationName || 'Destination'} Sync Failed`,
            description: log.details || (log.clipTitle ? `Failed to sync "${log.clipTitle}"` : 'Sync pipeline encountered an error'),
            timeAgo: formatRelativeTime(log.timestamp),
            timestamp: ts,
            type: 'sync_failed',
          });
        } else if (log.status === 'pending' || log.status === 'retrying') {
          list.push({
            id: `log-${log.id}`,
            title: `${log.destinationName || 'Destination'} Syncing`,
            description: log.clipTitle ? `Processing "${log.clipTitle}"...` : 'Queued for sync...',
            timeAgo: formatRelativeTime(log.timestamp),
            timestamp: ts,
            type: 'sync_pending',
          });
        } else {
          list.push({
            id: `log-${log.id}`,
            title: `${log.destinationName || 'Destination'} Sync Complete`,
            description: log.clipTitle
              ? `Synced "${log.clipTitle.slice(0, 36)}${log.clipTitle.length > 36 ? '...' : ''}" (${log.durationMs || 120}ms)`
              : `Payload updated (${log.payloadSize || '1.2 KB'})`,
            timeAgo: formatRelativeTime(log.timestamp),
            timestamp: ts,
            type: 'sync_success',
          });
        }
      }
    }

    // 2. Real Captured Clips
    if (clips && clips.length > 0) {
      for (const clip of clips.slice(0, 3)) {
        const ts = clip.createdAt ? Date.parse(clip.createdAt) || Date.now() : Date.now();
        if (ts <= clearedAt) continue;

        list.push({
          id: `clip-${clip.id}`,
          title: 'Clip Captured',
          description: clip.title
            ? `"${clip.title.slice(0, 38)}${clip.title.length > 38 ? '...' : ''}" saved to ${clip.category || 'Vault'}`
            : 'New content clipped to Vault',
          timeAgo: formatRelativeTime(clip.createdAt),
          timestamp: ts,
          type: 'clip_saved',
        });
      }
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, clips, clearedAt]);

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
        {onOpenBulkImport && (
          <button
            id="bulk-import-header-btn"
            onClick={onOpenBulkImport}
            className={`h-9 px-3 sm:px-3.5 flex items-center gap-1.5 sm:gap-2 rounded-xl text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-sm ${
              isDark
                ? 'bg-gradient-to-r from-emerald-500/15 to-[#3FE769]/10 hover:from-emerald-500/25 hover:to-[#3FE769]/20 text-[#3FE769] border border-[#3FE769]/30 hover:border-[#3FE769]/60 hover:shadow-[0_0_12px_rgba(63,231,105,0.15)]'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 hover:border-emerald-400'
            }`}
            title="Bulk import bookmarks from Browser, Twitter/X, Reddit, or CSV"
          >
            <Upload className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-emerald-700'}`} />
            <span className="font-semibold whitespace-nowrap">Bulk Import</span>
          </button>
        )}

        {onOpenCreatePageModal && (
          <button
            id="add-custom-page-header-btn"
            onClick={onOpenCreatePageModal}
            className={`h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-150 cursor-pointer shadow-sm ${
              isDark
                ? 'bg-[#181818] hover:bg-[#222222] text-[#EDEDED] border border-[#2E2E2E] hover:border-[#3FE769]/50 hover:shadow-[0_0_10px_rgba(63,231,105,0.1)]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-emerald-500'
            }`}
            title="Create a new custom page"
          >
            <Plus className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-emerald-600'}`} />
            <span className="font-semibold whitespace-nowrap">New Page</span>
          </button>
        )}

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
          {showNotifications && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
          )}
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
            {notifications.length > 0 && (
              <span
                className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600 ring-2 ${
                  isDark ? 'ring-black' : 'ring-white'
                }`}
              ></span>
            )}
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-84 rounded-2xl shadow-xl z-50 p-4 space-y-3 border ${
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
                <div className="flex items-center gap-2">
                  {notifications.length > 0 ? (
                    <>
                      <button
                        onClick={() => setClearedAt(Date.now())}
                        className={`text-[10px] font-mono hover:underline cursor-pointer transition-colors ${
                          isDark ? 'text-[#878787] hover:text-white' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Clear
                      </button>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          isDark
                            ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {notifications.length} New
                      </span>
                    </>
                  ) : (
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isDark ? 'bg-[#141414] text-[#666666]' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      Quiet
                    </span>
                  )}
                </div>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5 custom-scrollbar">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex gap-2.5 transition-colors ${
                        isDark
                          ? 'bg-[#141414] border-[#222222]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {item.type === 'sync_success' && (
                        <CheckCircle className="w-4 h-4 text-[#3FE769] shrink-0 mt-0.5" />
                      )}
                      {item.type === 'sync_failed' && (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      {item.type === 'sync_pending' && (
                        <RefreshCw className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-spin" />
                      )}
                      {item.type === 'clip_saved' && (
                        <Sparkles className="w-4 h-4 text-[#3FE769] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-sans font-semibold truncate">{item.title}</p>
                        <p
                          className={`text-[11px] font-mono mt-0.5 break-words line-clamp-2 ${
                            isDark ? 'text-[#878787]' : 'text-slate-500'
                          }`}
                        >
                          {item.description}
                        </p>
                        <p className={`text-[9px] font-mono mt-1 uppercase tracking-wider ${
                          item.type === 'sync_failed' ? 'text-red-400' : 'text-[#3FE769]'
                        }`}>
                          {item.timeAgo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center flex flex-col items-center justify-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                    isDark ? 'bg-[#141414] text-[#666666]' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Bell className="w-4 h-4 opacity-60" />
                  </div>
                  <p className={`text-xs font-medium ${isDark ? 'text-[#A0A0A0]' : 'text-slate-700'}`}>
                    All caught up
                  </p>
                  <p className={`text-[11px] mt-1 max-w-[200px] leading-relaxed ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>
                    Destination sync logs and new clip events will appear here in real time.
                  </p>
                </div>
              )}
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
            {showAccount && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAccount(false)}
              />
            )}
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
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-block text-[11px] font-sans ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Guest <span className="opacity-70">• You did not sign in</span>
            </span>
            <button
              onClick={onOpenAuthModal}
              className={`px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'bg-[#1C1B1B] hover:bg-[#222222] border border-[#2A2A2A] text-[#3FE769]' : 'bg-[#2D6A4F] hover:bg-[#245640]'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
