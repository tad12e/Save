import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface ContentTypeDonutProps {
  contentBreakdown: AnalyticsPayload['content_breakdown'];
}

export const ContentTypeDonut: React.FC<ContentTypeDonutProps> = ({ contentBreakdown }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const totalClips = contentBreakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <PieIcon className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              CONTENT TYPE DONUT
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Knowledge vault breakdown by category
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {totalClips} Total
        </span>
      </div>

      {/* Donut Chart with Center Metric */}
      <div className="relative w-full h-52 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(val: any, name: any) => [`${val} clips (${Math.round((val / totalClips) * 100)}%)`, name]}
            />
            <Pie
              data={contentBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {contentBreakdown.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? '#0F172A' : '#FFFFFF'}
                  strokeWidth={activeIndex === index ? 2 : 1}
                  className="transition-all cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-serif text-slate-900">
            {activeIndex !== null && contentBreakdown[activeIndex]
              ? `${contentBreakdown[activeIndex].percentage}%`
              : `${totalClips}`}
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {activeIndex !== null && contentBreakdown[activeIndex]
              ? contentBreakdown[activeIndex].name.split(' ')[0]
              : 'ITEMS'}
          </span>
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100">
        {contentBreakdown.map((item, idx) => (
          <div
            key={item.type}
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
            className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer text-xs ${
              activeIndex === idx
                ? 'bg-emerald-50/80 border-emerald-300'
                : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-sans text-slate-700 truncate">{item.name}</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-900 shrink-0 ml-1">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
