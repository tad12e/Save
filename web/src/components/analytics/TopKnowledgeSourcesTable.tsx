import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import {
  XTwitterIcon,
  ArxivIcon,
  SubstackIcon,
  GitHubIcon,
  YCombinatorIcon,
  NotionIcon,
  YouTubeIcon,
  MediumIcon,
  LinearIcon,
  LinkedInIcon,
} from '../BrandIcons';

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
  sources?: any[];
  clips?: any[];
  isDark?: boolean;
}

export const TopKnowledgeSourcesTable: React.FC<TopKnowledgeSourcesTableProps> = ({
  sources,
  clips,
  isDark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const getDomainIcon = (dom: string) => {
    const d = dom.toLowerCase();
    if (d.includes('twitter') || d.includes('x.com')) return <XTwitterIcon className="w-4 h-4 text-white" />;
    if (d.includes('arxiv')) return <ArxivIcon className="w-4 h-4" />;
    if (d.includes('substack')) return <SubstackIcon className="w-4 h-4" />;
    if (d.includes('github')) return <GitHubIcon className="w-4 h-4 text-white" />;
    if (d.includes('ycombinator') || d.includes('news.ycombinator')) return <YCombinatorIcon className="w-4 h-4" />;
    if (d.includes('notion')) return <NotionIcon className="w-4 h-4" />;
    if (d.includes('youtube')) return <YouTubeIcon className="w-4 h-4" />;
    if (d.includes('medium')) return <MediumIcon className="w-4 h-4 text-white" />;
    if (d.includes('linear')) return <LinearIcon className="w-4 h-4" />;
    if (d.includes('linkedin')) return <LinkedInIcon className="w-4 h-4" />;
    return <span className="font-mono text-[10px] font-bold uppercase">{dom.slice(0, 2)}</span>;
  };

  // Curated live origins from backend or extracted directly from clips
  const allSources: KnowledgeSourceItem[] = useMemo(() => {
    let sourceList: any[] = [];

    if (sources && sources.length > 0) {
      sourceList = sources;
    } else if (clips && clips.length > 0) {
      const domainMap: Record<string, number> = {};
      clips.forEach((c: any) => {
        const url = c.url || '';
        if (url) {
          try {
            let host = new URL(url).hostname.toLowerCase();
            if (host.startsWith('www.')) host = host.slice(4);
            if (host) {
              domainMap[host] = (domainMap[host] || 0) + 1;
            }
          } catch {
            // ignore malformed url
          }
        }
      });
      const totalSourced = Object.values(domainMap).reduce((a, b) => a + b, 0) || 1;
      sourceList = Object.entries(domainMap)
        .sort((a, b) => b[1] - a[1])
        .map(([domain, count], idx) => {
          let theme: 'emerald' | 'blue' | 'amber' | 'purple' = 'emerald';
          let intent = 'Track/Learn';
          if (domain.includes('arxiv') || domain.includes('substack') || domain.includes('medium')) {
            theme = 'blue';
            intent = 'Learn';
          } else if (domain.includes('github') || domain.includes('x.com') || domain.includes('twitter')) {
            theme = 'emerald';
            intent = 'Track';
          } else if (domain.includes('ycombinator') || domain.includes('linkedin')) {
            theme = 'amber';
            intent = 'Apply/Career';
          } else if (domain.includes('youtube') || domain.includes('spotify')) {
            theme = 'purple';
            intent = 'Media/Learn';
          }
          return {
            id: String(idx + 1),
            domain,
            displayName: domain,
            clips: count,
            primaryIntent: intent,
            intentTheme: theme,
            sharePct: Math.round((count / totalSourced) * 1000) / 10,
            trend: '+12%',
            isPositive: true,
          };
        });
    }

    return sourceList.map((s, idx) => ({
      id: s.id || String(idx + 1),
      domain: s.domain,
      displayName: s.displayName || s.domain,
      clips: s.clips,
      primaryIntent: s.primaryIntent || 'Knowledge',
      intentTheme: s.intentTheme || 'emerald',
      sharePct: s.sharePct ?? 10.0,
      trend: s.trend || '+12%',
      isPositive: s.isPositive ?? true,
      iconBg: s.iconBg || (s.intentTheme === 'blue' ? (isDark ? '#1E293B' : '#DBEAFE') : (isDark ? '#1C1B1B' : '#F1F5F9')),
      iconColor: s.iconColor || (isDark ? '#3FE769' : '#166534'),
      iconContent: getDomainIcon(s.domain),
    }));
  }, [isDark, sources, clips]);

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
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full border transition-all duration-300 ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED] hover:border-[#3FE769]/50 hover:shadow-[0_0_25px_rgba(63,231,105,0.06)]'
          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-md'
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
            className={`text-xs rounded-xl pl-8 pr-7 py-1.5 focus:outline-none transition-all duration-200 border w-44 sm:w-52 ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-white placeholder-[#666666] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/20'
            }`}
          />
          {searchQuery && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </motion.button>
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
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-mono">
                  {searchQuery ? `No sources match "${searchQuery}"` : 'No external web sources clipped yet'}
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <tr
                  key={item.id}
                  className={`group transition-all duration-200 text-xs cursor-default ${
                    isDark ? 'hover:bg-[#151515]' : 'hover:bg-slate-50/80'
                  }`}
                >
                {/* Domain with custom badge */}
                <td className="py-2.5 pl-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                    >
                      {item.iconContent}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-semibold font-mono text-[12px] truncate transition-colors ${
                        isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-800 group-hover:text-[#2D6A4F]'
                      }`}>
                        {item.domain}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200 text-[#3FE769] shrink-0" />
                    </div>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination & Counter */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1F1F1F] text-xs">
        <span className={`text-[11px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
          Showing {currentItems.length} of {filtered.length} origins
        </span>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Prev
          </motion.button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentPage(p)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentPage === p
                  ? isDark
                    ? 'bg-[#3FE769] text-black shadow-xs font-bold'
                    : 'bg-[#2D6A4F] text-white shadow-xs font-bold'
                  : isDark
                  ? 'text-[#878787] hover:text-white hover:bg-[#181818]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p}
            </motion.button>
          ))}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-[#EDEDED] hover:bg-[#222222]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next
          </motion.button>
        </div>
      </div>
    </div>
  );
};
