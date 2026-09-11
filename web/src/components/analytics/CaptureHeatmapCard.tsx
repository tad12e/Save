import React, { useState, useMemo } from 'react';
import { Flame } from 'lucide-react';

interface DayActivity {
  date: string;
  count: number;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  weekIndex: number; // 0 to 15
}

export interface CaptureHeatmapCardProps {
  days?: Array<{ date: string; count: number }>;
  currentStreak?: number;
  longestStreak?: number;
  isDark?: boolean;
}

export const CaptureHeatmapCard: React.FC<CaptureHeatmapCardProps> = ({
  days,
  currentStreak = 14,
  longestStreak = 38,
  isDark = false,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Generate 16 calendar weeks matrix (16 cols x 7 rows = 112 days)
  const { weeks, totalActiveDays } = useMemo(() => {
    const daysMap = new Map<string, number>();
    if (days && days.length > 0) {
      days.forEach((d) => daysMap.set(d.date, d.count));
    }

    // Benchmark realistic calendar distribution leading up to today
    const now = new Date();
    const resultWeeks: DayActivity[][] = [];
    let activeDaysCount = 0;

    // Align to the end of the current week (Sunday)
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (6 - currentDayOfWeek));

    // 16 weeks = 112 days
    for (let w = 0; w < 16; w++) {
      const week: DayActivity[] = [];
      for (let d = 0; d < 7; d++) {
        const offsetDays = (15 - w) * 7 + (6 - d);
        const cellDate = new Date(endDate);
        cellDate.setDate(endDate.getDate() - offsetDays);
        const dateStr = cellDate.toISOString().slice(0, 10);

        // Value resolution
        let count = daysMap.get(dateStr);
        if (count === undefined) {
          // Synthetic realistic benchmark matching 14-day streak & active rhythm
          const daysFromEnd = offsetDays;
          if (daysFromEnd <= 14) {
            // Active streak: daily activity
            count = ((daysFromEnd * 7 + d * 3) % 9) + 2;
          } else {
            // Realistic pattern across the 16 weeks
            const pseudo = (w * 13 + d * 7) % 17;
            count = pseudo > 7 ? (pseudo % 12) + 1 : 0;
          }
        }

        if (count > 0) activeDaysCount++;

        week.push({
          date: dateStr,
          count,
          dayOfWeek: d,
          weekIndex: w,
        });
      }
      resultWeeks.push(week);
    }

    return { weeks: resultWeeks, totalActiveDays: activeDaysCount };
  }, [days]);

  // Color intensity scale
  const getCellColor = (count: number) => {
    if (count === 0) {
      return isDark ? '#1C1B1B' : '#F1F5F9';
    }
    if (count <= 2) {
      return isDark ? '#143823' : '#BBF7D0';
    }
    if (count <= 5) {
      return isDark ? '#1B5E35' : '#86EFAC';
    }
    if (count <= 9) {
      return isDark ? '#238947' : '#40916C';
    }
    return isDark ? '#3FE769' : '#2D6A4F';
  };

  const dayLabels = [
    { label: 'Mon', index: 0 },
    { label: '', index: 1 },
    { label: 'Wed', index: 2 },
    { label: '', index: 3 },
    { label: 'Fri', index: 4 },
    { label: '', index: 5 },
    { label: 'Sun', index: 6 },
  ];

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full border transition-all relative ${
        isDark ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Capture Heatmap
            </h2>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
              }`}
            >
              <Flame className={`w-3 h-3 ${isDark ? 'text-[#3FE769]' : 'text-[#16A34A]'}`} />
              {currentStreak} Day Streak
            </span>
          </div>
          <p className={`text-xs font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            Daily ingestion volume across the last 16 calendar weeks.
          </p>
        </div>
      </div>

      {/* 16-Week Heatmap Matrix */}
      <div className="my-auto py-3 overflow-x-auto">
        <div className="flex items-start gap-2 min-w-[340px]">
          {/* Row Day Labels */}
          <div className="flex flex-col justify-between h-[126px] py-0.5 pr-1 shrink-0">
            {dayLabels.map((d, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-mono leading-none h-[14px] flex items-center ${
                  isDark ? 'text-[#666666]' : 'text-slate-400'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>

          {/* 16 Week Columns */}
          <div className="grid grid-cols-16 gap-1 sm:gap-1.5 flex-1" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1 sm:gap-1.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className="w-full aspect-square rounded-[3px] transition-transform hover:scale-125 cursor-pointer relative"
                    style={{ backgroundColor: getCellColor(day.count) }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        date: day.date,
                        count: day.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredCell && (
        <div
          className={`fixed -translate-x-1/2 -translate-y-full -mt-2 px-2.5 py-1 rounded-lg text-[11px] font-mono z-50 pointer-events-none shadow-lg border whitespace-nowrap ${
            isDark
              ? 'bg-[#181818] border-[#333333] text-white'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
          style={{ left: hoveredCell.x, top: hoveredCell.y }}
        >
          <span className="font-semibold">{hoveredCell.count} clips</span> on {hoveredCell.date}
        </div>
      )}

      {/* Footer: Streak info + Intensity Legend */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1F1F1F] text-xs">
        <div className={`font-mono text-[11px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
          Streak: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentStreak}d</span> · Longest:{' '}
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{longestStreak}d</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {[0, 2, 5, 8, 12].map((lvl, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-[2px]"
                style={{ backgroundColor: getCellColor(lvl) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
