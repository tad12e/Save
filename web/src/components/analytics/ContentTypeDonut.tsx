import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  PieChart as PieIcon,
  Layers,
  FileText,
  Link2,
  Image as ImageIcon,
  Code2,
  Headphones,
  Video,
} from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

const renderContentTypeIcon = (type: string, color: string, isHovered?: boolean) => {
  const t = (type || '').toLowerCase();
  const iconClass = `w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isHovered ? 'scale-125' : 'scale-100'}`;
  
  if (t.includes('article') || t.includes('doc') || t.includes('essay'))
    return <FileText className={iconClass} style={{ color }} />;
  if (t.includes('link') || t.includes('bookmark'))
    return <Link2 className={iconClass} style={{ color }} />;
  if (t.includes('image') || t.includes('media') || t.includes('photo'))
    return <ImageIcon className={iconClass} style={{ color }} />;
  if (t.includes('code') || t.includes('snippet'))
    return <Code2 className={iconClass} style={{ color }} />;
  if (t.includes('audio') || t.includes('music'))
    return <Headphones className={iconClass} style={{ color }} />;
  if (t.includes('video') || t.includes('talk'))
    return <Video className={iconClass} style={{ color }} />;
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-200 ${isHovered ? 'scale-125' : 'scale-100'}`} style={{ backgroundColor: color }} />;
};

interface ContentTypeDonutProps {
  contentBreakdown?: AnalyticsPayload['content_breakdown'];
  clips?: any[];
  totalCount?: number;
  isDark?: boolean;
}

export const ContentTypeDonut: React.FC<ContentTypeDonutProps> = ({
  contentBreakdown,
  clips,
  totalCount,
  isDark = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // 6 Content Types parity with Mobile
  const TYPE_PALETTE: Record<string, string> = {
    article: isDark ? '#3FE769' : '#2D6A4F',
    job: '#F59E0B',
    tool: '#38BDF8',
    event: '#A855F7',
    product: '#FB7185',
    music: '#34D399',
    video: '#8B5CF6',
    audio: '#EC4899',
    code: '#6366F1',
    link: '#40916C',
    general: '#64748B',
  };

  const items = React.useMemo(() => {
    if (contentBreakdown && contentBreakdown.length > 0 && contentBreakdown.some(c => c.count > 0)) {
      return contentBreakdown.map((item) => ({
        type: item.type,
        name: item.name,
        count: item.count,
        percentage: item.percentage,
        color: item.color || TYPE_PALETTE[item.type.toLowerCase()] || (isDark ? '#3FE769' : '#2D6A4F'),
      }));
    }
    if (clips && clips.length > 0) {
      const typeCounts: Record<string, number> = {};
      clips.forEach((c: any) => {
        const ct = (c.content_type || 'article').toLowerCase();
        typeCounts[ct] = (typeCounts[ct] || 0) + 1;
      });
      const totalClips = clips.length || 1;
      return Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          percentage: Math.round((count / totalClips) * 100),
          color: TYPE_PALETTE[type] || (isDark ? '#3FE769' : '#2D6A4F'),
        }));
    }
    return [
      { type: 'general', name: 'Vault Clips', count: 0, percentage: 100, color: isDark ? '#262626' : '#E2E8F0' },
    ];
  }, [contentBreakdown, clips, isDark]);

  const total = totalCount ?? (clips ? clips.length : items.reduce((sum, item) => sum + item.count, 0));
  const activeItem =
    (activeIndex !== null && items[activeIndex]) ||
    (selectedType ? items.find((i) => i.type === selectedType) : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between transition-all h-full ${
        isDark
          ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#3FE769]/30 hover:shadow-[0_0_24px_rgba(63,231,105,0.06)]'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}
          >
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Content Type Donut
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Vault classification across 6 media formats
            </p>
          </div>
        </div>

        {selectedType ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType(null)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all border cursor-pointer ${
              isDark
                ? 'bg-[#1C281F] text-[#3FE769] border-[#3FE769]'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            Filtered · Reset ✕
          </motion.button>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {total.toLocaleString()} Items
          </span>
        )}
      </div>

      {/* Donut Chart with Center Metric */}
      <div className="relative w-full h-52 sm:h-56 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#181818' : '#0F172A',
                borderColor: isDark ? '#262626' : '#334155',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              }}
              formatter={(val: any, name: any) => [
                `${val} clips (${Math.round((val / total) * 100)}%)`,
                name,
              ]}
            />
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              dataKey="count"
              onClick={(_, index) => {
                const item = items[index];
                setSelectedType(selectedType === item.type ? null : item.type);
              }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {items.map((entry, index) => {
                const isItemActive =
                  activeIndex === index || selectedType === entry.type;
                const isDimmed =
                  (selectedType && selectedType !== entry.type) ||
                  (activeIndex !== null && activeIndex !== index && !selectedType);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    fillOpacity={isDimmed ? 0.35 : 1}
                    stroke={isDark ? '#0E0E0E' : '#FFFFFF'}
                    strokeWidth={isItemActive ? 3.5 : 1.5}
                    className="transition-all cursor-pointer outline-none"
                    style={{
                      filter: isItemActive ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Dynamic Label with AnimatePresence Morphing */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <AnimatePresence mode="wait">
            {activeItem ? (
              <motion.div
                key={`active-${activeItem.type}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <span
                  className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight leading-none"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.percentage}%
                </span>
                <span
                  className={`text-[9px] font-mono font-semibold uppercase tracking-wider mt-1 ${
                    isDark ? 'text-[#A1A1A1]' : 'text-slate-600'
                  }`}
                >
                  {activeItem.name.split(' ')[0]} ({activeItem.count})
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="default-total"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center"
              >
                <span
                  className={`text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight leading-none ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {total.toLocaleString()}
                </span>
                <span
                  className={`text-[9px] font-mono font-semibold uppercase tracking-wider mt-1 ${
                    isDark ? 'text-[#878787]' : 'text-slate-400'
                  }`}
                >
                  CLIPS TOTAL
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Legend Grid with Spring Physics */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t ${
          isDark ? 'border-[#262626]' : 'border-slate-100'
        }`}
      >
        {items.map((item, idx) => {
          const isItemActive = activeIndex === idx || selectedType === item.type;
          return (
            <motion.div
              key={item.type}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedType(selectedType === item.type ? null : item.type)}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                isItemActive
                  ? isDark
                    ? 'bg-[#1C281F] border-[#3FE769] shadow-xs'
                    : 'bg-emerald-50 border-emerald-300 shadow-xs'
                  : isDark
                  ? 'bg-[#181818] border-[#262626] hover:bg-[#202020]'
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {renderContentTypeIcon(item.type, item.color, isItemActive)}
                <span
                  className={`text-[11px] font-['Inter',sans-serif] truncate ${
                    isItemActive
                      ? isDark
                        ? 'text-white font-semibold'
                        : 'text-slate-900 font-semibold'
                      : isDark
                      ? 'text-[#EDEDED]'
                      : 'text-slate-700'
                  }`}
                >
                  {item.name}
                </span>
              </div>
              <span
                className={`font-mono text-[11px] font-bold shrink-0 ml-1 ${
                  isItemActive
                    ? isDark
                      ? 'text-[#3FE769]'
                      : 'text-emerald-700'
                    : isDark
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                {item.percentage}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
