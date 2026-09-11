import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export interface KnowledgeSourceItem {
  id: string;
  domain: string;
  displayName: string;
  clips: number;
  primaryIntent: string;
  intentTheme: 'emerald' | 'blue' | 'amber' | 'purple';
  sharePct: number;
  trend: string;
  isPositive: boolean;
  iconBg: string;
  iconColor: string;
  iconContent: React.ReactNode;
}

export interface TopKnowledgeSourcesTableProps {
  destinations?: any[];
  isDark?: boolean;
}

export const TopKnowledgeSourcesTable: React.FC<TopKnowledgeSourcesTableProps> = ({
  isDark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Curated benchmark sources matching Stitch Light Screen 6fb4d64e13a74aa4890a8a72dd3ddda1
  const allSources: KnowledgeSourceItem[] = useMemo(
    () => [
      {
        id: '1',
        domain: 'twitter.com',
        displayName: 'twitter.com',
        clips: 543,
        primaryIntent: 'Track/Learn',
        intentTheme: 'emerald',
        sharePct: 38.0,
        trend: '+22%',
        isPositive: true,
        iconBg: '#0F1419',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-bold text-xs font-mono">𝕏</span>,
      },
      {
        id: '2',
        domain: 'arxiv.org',
        displayName: 'arxiv.org',
        clips: 342,
        primaryIntent: 'Learn',
        intentTheme: 'blue',
        sharePct: 23.6,
        trend: '+14%',
        isPositive: true,
        iconBg: isDark ? '#3D2020' : '#FEE2E2',
        iconColor: '#DC2626',
        iconContent: <span className="font-serif italic font-bold text-xs">a</span>,
      },
      {
        id: '3',
        domain: 'substack.com',
        displayName: 'substack.com',
        clips: 271,
        primaryIntent: 'Learn',
        intentTheme: 'blue',
        sharePct: 19.0,
        trend: '+6%',
        isPositive: true,
        iconBg: isDark ? '#2E1E12' : '#FFEDD5',
        iconColor: '#EA580C',
        iconContent: <span className="font-bold text-xs font-sans">S</span>,
      },
      {
        id: '4',
        domain: 'github.com',
        displayName: 'github.com',
        clips: 158,
        primaryIntent: 'Track/Code',
        intentTheme: 'emerald',
        sharePct: 10.9,
        trend: '+31%',
        isPositive: true,
        iconBg: isDark ? '#24292F' : '#0F172A',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-mono font-bold text-[11px]">gh</span>,
      },
      {
        id: '5',
        domain: 'ycombinator.com',
        displayName: 'ycombinator.com',
        clips: 74,
        primaryIntent: 'Apply/Hire',
        intentTheme: 'amber',
        sharePct: 5.2,
        trend: '+45%',
        isPositive: true,
        iconBg: '#FF6600',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-bold text-xs font-sans">Y</span>,
      },
      // Page 2 benchmark items
      {
        id: '6',
        domain: 'notion.so',
        displayName: 'notion.so',
        clips: 62,
        primaryIntent: 'Knowledge',
        intentTheme: 'emerald',
        sharePct: 4.3,
        trend: '+18%',
        isPositive: true,
        iconBg: isDark ? '#262626' : '#F1F5F9',
        iconColor: isDark ? '#FFFFFF' : '#0F172A',
        iconContent: <span className="font-serif font-bold text-xs">N</span>,
      },
      {
        id: '7',
        domain: 'youtube.com',
        displayName: 'youtube.com',
        clips: 51,
        primaryIntent: 'Learn',
        intentTheme: 'blue',
        sharePct: 3.5,
        trend: '+12%',
        isPositive: true,
        iconBg: '#FF0000',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-sans font-bold text-[10px]">▶</span>,
      },
      {
        id: '8',
        domain: 'medium.com',
        displayName: 'medium.com',
        clips: 39,
        primaryIntent: 'Knowledge',
        intentTheme: 'purple',
        sharePct: 2.7,
        trend: '-4%',
        isPositive: false,
        iconBg: isDark ? '#1C1B1B' : '#000000',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-serif font-bold text-xs">M</span>,
      },
      {
        id: '9',
        domain: 'linear.app',
        displayName: 'linear.app',
        clips: 31,
        primaryIntent: 'Action',
        intentTheme: 'emerald',
        sharePct: 2.1,
        trend: '+8%',
        isPositive: true,
        iconBg: '#5E6AD2',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-sans font-bold text-[10px]">L</span>,
      },
      {
        id: '10',
        domain: 'linkedin.com',
        displayName: 'linkedin.com',
        clips: 24,
        primaryIntent: 'Apply/Career',
        intentTheme: 'amber',
        sharePct: 1.6,
        trend: '+15%',
        isPositive: true,
        iconBg: '#0A66C2',
        iconColor: '#FFFFFF',
        iconContent: <span className="font-sans font-bold text-[11px]">in</span>,
      },
    ],
    [isDark]
  );

  // Filter based on search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allSources;
    const q = searchQuery.toLowerCase();
    return allSources.filter(
      (s) => s.domain.toLowerCase().includes(q) || s.primaryIntent.toLowerCase().includes(q)
    );
  }, [allSources, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getIntentBadgeClasses = (theme: KnowledgeSourceItem['intentTheme']) => {
    switch (theme) {
      case 'emerald':
        return isDark
          ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
          : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]';
      case 'blue':
        return isDark
          ? 'bg-[#1C1B1B] text-[#60A5FA] border border-[#2A2A2A]'
          : 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]';
      case 'amber':
        return isDark
          ? 'bg-[#1C1B1B] text-[#F59E0B] border border-[#2A2A2A]'
          : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]';
      case 'purple':
        return isDark
          ? 'bg-[#1C1B1B] text-[#C084FC] border border-[#2A2A2A]'
          : 'bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]';
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full border transition-all ${
        isDark ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header & Filter Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2
            className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Top Knowledge Sources
          </h2>
          <p className={`text-xs font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            Origination domains categorized by clip volume &amp; velocity
          </p>
        </div>

        {/* Filter domains search bar */}
        <div className="relative">
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#878787]' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter domains..."
            className={`text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none transition-colors border w-44 sm:w-52 ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-white placeholder-[#666666] focus:border-[#3FE769]'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2D6A4F]'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto my-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-[10px] uppercase font-semibold tracking-wider ${
              isDark ? 'border-[#1F1F1F] text-[#878787]' : 'border-slate-100 text-slate-400'
            }`}>
              <th className="pb-2 pl-1 font-medium">Domain</th>
              <th className="pb-2 text-center font-medium">Clips</th>
              <th className="pb-2 text-center font-medium">Primary Intent</th>
              <th className="pb-2 font-medium">Share %</th>
              <th className="pb-2 pr-1 text-right font-medium">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1F1F1F]">
            {currentItems.map((item) => (
              <tr
                key={item.id}
                className={`group transition-colors text-xs ${
                  isDark ? 'hover:bg-[#141414]' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Domain with custom badge */}
                <td className="py-2.5 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                    >
                      {item.iconContent}
                    </div>
                    <span className={`font-semibold font-mono text-[12px] truncate ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      {item.domain}
                    </span>
                  </div>
                </td>

                {/* Clip count */}
                <td className={`py-2.5 text-center font-mono font-medium ${
                  isDark ? 'text-[#EDEDED]' : 'text-slate-700'
                }`}>
                  {item.clips}
                </td>

                {/* Primary intent pill */}
                <td className="py-2.5 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getIntentBadgeClasses(item.intentTheme)}`}>
                    {item.primaryIntent}
                  </span>
                </td>

                {/* Share % with progress bar */}
                <td className="py-2.5 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-[#222222]' : 'bg-slate-100'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
                        }`}
                        style={{ width: `${Math.min(100, item.sharePct * 2.2)}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-mono font-semibold shrink-0 ${
                      isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
                    }`}>
                      {item.sharePct.toFixed(1)}%
                    </span>
                  </div>
                </td>

                {/* Trend */}
                <td className="py-2.5 pr-1 text-right">
                  <span
                    className={`inline-flex items-center justify-end gap-0.5 font-mono text-[11px] font-semibold ${
                      item.isPositive
                        ? isDark
                          ? 'text-[#3FE769]'
                          : 'text-[#15803D]'
                        : isDark
                        ? 'text-rose-400'
                        : 'text-rose-600'
                    }`}
                  >
                    {item.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination & Counter */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1F1F1F] text-xs">
        <span className={`text-[11px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
          Showing {currentItems.length} of {filtered.length === allSources.length ? '84' : filtered.length} origins
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentPage === p
                  ? isDark
                    ? 'bg-[#3FE769] text-black shadow-xs'
                    : 'bg-[#2D6A4F] text-white shadow-xs'
                  : isDark
                  ? 'text-[#878787] hover:text-white hover:bg-[#181818]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
