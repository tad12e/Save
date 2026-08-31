import React from 'react';
import { motion } from 'framer-motion';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface ConsistencyHeatmapCardProps {
  days: AnalyticsPayload['contribution_matrix']['days'];
}

export const ConsistencyHeatmapCard: React.FC<ConsistencyHeatmapCardProps> = ({ days }) => {
  // Take recent ~120 days to create a neat 5-row or 7-row rounded pill matrix matching Image 2
  const recentDays = days && days.length > 0 ? days.slice(-140) : [];

  // Group into columns of 5 or 7 rows
  const rows = 5;
  const cols = Math.ceil(recentDays.length / rows);
  const gridMatrix: Array<Array<{ date: string; count: number }>> = Array.from({ length: rows }, () => []);

  recentDays.forEach((item, idx) => {
    const rowIdx = idx % rows;
    gridMatrix[rowIdx].push(item);
  });

  const getDotColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 border-slate-200/60';
    if (count <= 2) return 'bg-emerald-200 border-emerald-300';
    if (count <= 5) return 'bg-emerald-400 border-emerald-500';
    if (count <= 8) return 'bg-emerald-600 border-emerald-700';
    return 'bg-emerald-800 border-emerald-900';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      {/* Header with LESS/MORE scale */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
          CONSISTENCY HEATMAP
        </span>

        <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400">
          <span>LESS</span>
          <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-100 border border-slate-200" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-200" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-700" />
          <span>MORE</span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex flex-col gap-1.5 min-w-[340px]">
          {gridMatrix.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5 justify-between">
              {row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  title={`${cell.date}: ${cell.count} clips`}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] border transition-all cursor-pointer hover:scale-115 hover:shadow-xs ${getDotColor(
                    cell.count
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
