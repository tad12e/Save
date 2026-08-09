import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  CheckCircle, 
  Radio, 
  Sparkles, 
  ExternalLink,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';
import { DestinationConfig } from '../../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  destinations: DestinationConfig[];
  onQuickAddClip: () => void;
  onRefreshSync: () => void;
  isRefreshing: boolean;
  theme: 'terminal' | 'dark' | 'light';
  setTheme: (theme: 'terminal' | 'dark' | 'light') => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  destinations,
  onQuickAddClip,
  onRefreshSync,
  isRefreshing,
  theme,
  setTheme
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const activeDests = destinations.filter(d => d.connected && d.status === 'active');
  const defaultDest = destinations.find(d => d.isDefault) || destinations[0];

  const headerBgClass = 
    theme === 'light' ? 'bg-white border-b border-slate-200 text-slate-800' :
    theme === 'dark' ? 'bg-slate-900 border-b border-slate-800 text-white' :
    'bg-[#080808] border-b border-white/5 text-white';

  const searchBgClass = 
    theme === 'light' ? 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500 placeholder:text-slate-400' :
    theme === 'dark' ? 'bg-slate-800 text-slate-100 border-slate-700 focus:border-amber-500 placeholder:text-slate-500' :
    'bg-[#050505] text-stone-200 border-white/10 focus:border-amber-500/60 placeholder:text-stone-600';

  return (
    <header className={`sticky top-0 z-20 h-20 px-6 sm:px-8 flex items-center justify-between gap-6 transition-colors ${headerBgClass}`}>
      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search opportunities, job cards, tags, notes..."
          className={`w-full pl-10 pr-4 py-2 text-xs rounded-sm border focus:outline-none transition-all font-sans ${searchBgClass}`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-wider text-stone-400 hover:text-amber-500"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Default Destination Quick Badge */}
        {defaultDest && (
          <div className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-sm border text-[10px] font-mono tracking-wider ${
            theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' :
            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' :
            'bg-[#050505] border-white/5 text-stone-400'
          }`}>
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span className="opacity-60">DEFAULT:</span>
            <span className="font-semibold flex items-center gap-1.5">
              {defaultDest.name}
              <CheckCircle className="w-3 h-3 text-amber-500 inline" />
            </span>
          </div>
        )}

        {/* 3-Way Theme Switcher Selector */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`px-3 py-1.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
              theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' :
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' :
              'bg-[#050505] border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
            }`}
            title="Switch Theme Paradigm"
          >
            {theme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-600" />}
            {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            {theme === 'terminal' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">
              {theme === 'light' ? 'Light Mode' : theme === 'dark' ? 'Dark Mode' : 'OLED Amber'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showThemeMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-sm shadow-2xl z-50 p-2 space-y-1 text-xs border ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' :
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' :
              'bg-[#080808] border-white/10 text-white'
            }`}>
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-stone-500 border-b border-white/5 mb-1">
                Theme Paradigm
              </div>

              <button
                onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-sm font-sans flex items-center justify-between ${
                  theme === 'light' ? 'bg-amber-500/10 text-amber-600 font-semibold' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode
                </span>
                {theme === 'light' && <CheckCircle className="w-3 h-3 text-amber-500" />}
              </button>

              <button
                onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-sm font-sans flex items-center justify-between ${
                  theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Standard Dark
                </span>
                {theme === 'dark' && <CheckCircle className="w-3 h-3 text-indigo-400" />}
              </button>

              <button
                onClick={() => { setTheme('terminal'); setShowThemeMenu(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-sm font-sans flex items-center justify-between ${
                  theme === 'terminal' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30' : 'hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2 text-amber-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5" /> OLED Cyberpunk
                </span>
                {theme === 'terminal' && <CheckCircle className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Sync Ping Refresh Button */}
        <button
          onClick={onRefreshSync}
          disabled={isRefreshing}
          className="p-2 rounded-sm text-stone-400 hover:text-amber-400 hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/5"
          title="Force Uplink Sync"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
        </button>

        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-sm text-stone-400 hover:text-amber-400 hover:bg-white/[0.04] transition-colors relative border border-transparent hover:border-white/5"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#080808]"></span>
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-3 w-80 rounded-sm shadow-2xl z-50 p-4 space-y-3 border ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-800' :
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' :
              'bg-[#080808] border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                <span className="font-serif text-sm font-medium">System Activity</span>
                <span className="text-[9px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  2 New
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className={`p-3 rounded-sm border flex gap-2.5 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-white/5'
                }`}>
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-xs">Google Sheets Sync Complete</p>
                    <p className="text-stone-500 text-[11px] font-mono mt-0.5">Row #143 appended to Vault 2026</p>
                    <p className="text-[9px] font-mono text-amber-500/80 mt-1 uppercase tracking-wider">2 mins ago</p>
                  </div>
                </div>
                <div className={`p-3 rounded-sm border flex gap-2.5 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-white/5'
                }`}>
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-xs">AI Weekly Digest Ready</p>
                    <p className="text-stone-500 text-[11px] font-mono mt-0.5">12 opportunities scored & grouped</p>
                    <p className="text-[9px] font-mono text-amber-500/80 mt-1 uppercase tracking-wider">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Clip CTA Button */}
        <button
          onClick={onQuickAddClip}
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-sm text-xs font-mono tracking-wider uppercase font-semibold shadow-md shadow-amber-500/10 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Save Clip</span>
        </button>
      </div>
    </header>
  );
};
