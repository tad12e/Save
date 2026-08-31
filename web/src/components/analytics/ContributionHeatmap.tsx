import React from 'react';
import { motion } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Calendar, Flame, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';
import 'react-calendar-heatmap/dist/styles.css';

interface ContributionHeatmapProps {
  contributionMatrix: AnalyticsPayload['contribution_matrix'];
  streakDays: number;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  contributionMatrix,
  streakDays,
}) => {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 160);

  // Map count to green color scale classes
  const getClassForValue = (value: any) => {
    if (!value || value.count === 0) {
      return 'color-empty';
    }
    if (value.count <= 2) return 'color-scale-1';
    if (value.count <= 5) return 'color-scale-2';
    if (value.count <= 9) return 'color-scale-3';
    return 'color-scale-4';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
                ACTIVITY & CONTRIBUTION HEATMAP
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {contributionMatrix.total_active_days} Active Days
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Daily clipping consistency and volume distribution
            </p>
          </div>
        </div>

        {/* Quick Streak Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-600 font-sans text-[11px]">Current:</span>
            <strong className="font-mono text-slate-900">{streakDays}d</strong>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50/60 border border-emerald-200/70">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-600 font-sans text-[11px]">Best:</span>
            <strong className="font-mono text-emerald-800">{contributionMatrix.longest_streak}d</strong>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="min-w-[680px]">
          <style>{`
            .react-calendar-heatmap text {
              font-size: 8px;
              fill: #64748B;
              font-family: inherit;
            }
            .react-calendar-heatmap .color-empty {
              fill: #F1F5F9;
              rx: 2.5px;
            }
            .react-calendar-heatmap .color-scale-1 {
              fill: #BBF7D0;
              rx: 2.5px;
            }
            .react-calendar-heatmap .color-scale-2 {
              fill: #86EFAC;
              rx: 2.5px;
            }
            .react-calendar-heatmap .color-scale-3 {
              fill: #22C55E;
              rx: 2.5px;
            }
            .react-calendar-heatmap .color-scale-4 {
              fill: #15803D;
              rx: 2.5px;
            }
            .react-calendar-heatmap rect:hover {
              stroke: #0F172A;
              stroke-width: 1px;
            }
          `}</style>
          
          <CalendarHeatmap
            startDate={startDate}
            endDate={today}
            values={contributionMatrix.days}
            classForValue={getClassForValue}
            tooltipDataAttrs={(value: any) => {
              const dateStr = value?.date || 'No activity';
              const countStr = value?.count ? `${value.count} clips saved` : '0 clips saved';
              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-content': `${dateStr} — ${countStr}`,
              };
            }}
            showWeekdayLabels={true}
          />
          <ReactTooltip id="heatmap-tooltip" className="!bg-slate-900 !text-white !text-xs !py-1 !px-2.5 !rounded-md !shadow-lg font-mono z-50" />
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-sans">
        <span>Contributions over last 6 months</span>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] border border-slate-200" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#BBF7D0]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#86EFAC]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#22C55E]" />
          <span className="w-2.5 h-2.5 rounded-sm bg-[#15803D]" />
          <span>More</span>
        </div>
      </div>
    </motion.div>
  );
};
