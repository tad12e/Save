import React from 'react';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface OpportunityOutcomesFunnelProps {
  funnelData?: AnalyticsPayload['opportunity_funnel'];
  money?: AnalyticsPayload['money'];
  clips?: any[];
  isDark?: boolean;
}

export const OpportunityOutcomesFunnel: React.FC<OpportunityOutcomesFunnelProps> = ({
  funnelData,
  money,
  clips,
  isDark = false,
}) => {
  const { stages, categories } = React.useMemo(() => {
    if (clips && clips.length > 0) {
      const total = clips.length;
      const applied = clips.filter((c: any) => {
        const ct = (c.content_type || '').toLowerCase();
        const it = (c.intent || '').toLowerCase();
        return ct === 'job' || it.includes('apply') || c.status === 'in_progress' || c.status === 'review' || c.status === 'done' || c.deadline_date;
      }).length;

      const review = clips.filter((c: any) => {
        return c.status === 'in_progress' || c.status === 'review' || (Array.isArray(c.tags) && c.tags.some((t: string) => String(t).toLowerCase().includes('interview')));
      }).length;

      const done = clips.filter((c: any) => c.status === 'done').length;

      const computedStages = [
        { label: 'Saved', count: `${total} clips`, rate: '100%', isKey: false },
        { label: 'Applied', count: `${applied} opportunities`, rate: `${Math.round((applied / (total || 1)) * 100)}%`, isKey: false },
        { label: 'In Review', count: `${review} active`, rate: `${Math.round((review / (total || 1)) * 100)}%`, isKey: false },
        { label: 'Realized', count: `${done} completed`, rate: `${Math.round((done / (total || 1)) * 100)}%`, isKey: true },
      ];

      const getCategoryRate = (typePattern: string, intentPattern?: string) => {
        const matches = clips.filter((c: any) => {
          const ct = (c.content_type || '').toLowerCase();
          const it = (c.intent || '').toLowerCase();
          return ct.includes(typePattern) || (intentPattern ? it.includes(intentPattern) : false);
        });
        if (matches.length === 0) return '0%';
        const actioned = matches.filter((c: any) => c.status !== 'pending' || c.intent === 'apply' || c.deadline_date);
        return `${Math.round((actioned.length / matches.length) * 100)}%`;
      };

      const computedCategories = [
        { label: 'Jobs', rate: getCategoryRate('job', 'apply') },
        { label: 'Events', rate: getCategoryRate('event') },
        { label: 'Courses', rate: getCategoryRate('course', 'learn') },
        { label: 'Tools', rate: getCategoryRate('tool') },
      ];

      return { stages: computedStages, categories: computedCategories };
    }

    if (funnelData && funnelData.length >= 4) {
      const computedStages = [
        { label: 'Saved', count: `${funnelData[0].count} clips`, rate: `${Math.round(funnelData[0].conversion_pct)}%`, isKey: false },
        { label: 'Applied', count: `${funnelData[1].count} jobs`, rate: `${Math.round(funnelData[1].conversion_pct)}%`, isKey: false },
        { label: 'Interview', count: `${funnelData[2].count} rounds`, rate: `${Math.round(funnelData[2].conversion_pct)}%`, isKey: false },
        { label: 'Offer', count: `${funnelData[3].count} offers`, rate: `${Math.round(funnelData[3].conversion_pct)}%`, isKey: true },
      ];
      const computedCategories = [
        { label: 'Jobs', rate: computedStages[1].rate },
        { label: 'Events', rate: '0%' },
        { label: 'Courses', rate: '0%' },
        { label: 'Tools', rate: '0%' },
      ];
      return { stages: computedStages, categories: computedCategories };
    }

    const emptyStages = [
      { label: 'Saved', count: '0 clips', rate: '0%', isKey: false },
      { label: 'Applied', count: '0 opportunities', rate: '0%', isKey: false },
      { label: 'In Review', count: '0 active', rate: '0%', isKey: false },
      { label: 'Realized', count: '0 completed', rate: '0%', isKey: true },
    ];
    const emptyCategories = [
      { label: 'Jobs', rate: '0%' },
      { label: 'Events', rate: '0%' },
      { label: 'Courses', rate: '0%' },
      { label: 'Tools', rate: '0%' },
    ];
    return { stages: emptyStages, categories: emptyCategories };
  }, [clips, funnelData]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-all ${
        isDark ? 'bg-[#0E0E0E] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Opportunity Outcomes
            </h2>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              {stages[1]?.rate || '0%'} Action Rate
            </span>
          </div>
          <p className={`text-xs font-['Inter',sans-serif] mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
            Pipeline conversion progression from initial bookmark to final decision
          </p>
        </div>

        {money?.realized_value_index && (
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto border ${
              isDark
                ? 'bg-[#181818] border-[#262626] text-[#EDEDED]'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
            <span className="font-semibold">{money.realized_value_index}</span>
          </div>
        )}
      </div>

      {/* 4-Stage Horizontal Pipeline */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 mb-4">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.label}>
            <div
              className={`flex-1 w-full rounded-xl py-2.5 px-3 sm:py-3 sm:px-3.5 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-0.5 border ${
                stage.isKey
                  ? isDark
                    ? 'bg-[#00CA50]/10 border-[#00CA50]/30 text-[#3FE769]'
                    : 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]'
                  : isDark
                  ? 'bg-[#181818] border-[#262626] text-white hover:border-[#333333]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  stage.isKey
                    ? isDark
                      ? 'text-[#3FE769]'
                      : 'text-[#166534]'
                    : isDark
                    ? 'text-[#878787]'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
              <span
                className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] mt-0.5 tracking-tight ${
                  stage.isKey
                    ? isDark
                      ? 'text-[#3FE769]'
                      : 'text-[#15803D]'
                    : isDark
                    ? 'text-white'
                    : 'text-slate-900'
                }`}
              >
                {stage.count}
              </span>
              <span
                className={`text-[11px] font-mono font-medium mt-0.5 ${
                  stage.isKey
                    ? isDark
                      ? 'text-[#3FE769]/80'
                      : 'text-[#166534]/80'
                    : isDark
                    ? 'text-[#878787]'
                    : 'text-slate-400'
                }`}
              >
                {stage.rate}
              </span>
            </div>

            {/* Connecting Arrow between steps */}
            {idx < stages.length - 1 && (
              <div className="hidden md:flex items-center justify-center px-0.5">
                <ArrowRight
                  className={`w-3.5 h-3.5 ${isDark ? 'text-[#3A3A3A]' : 'text-slate-300'}`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Category Breakdown Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-[#1F1F1F]">
        {categories.map((cat, idx) => (
          <div
            key={cat.label}
            className={`flex flex-col items-center justify-center py-1 px-2 text-center ${
              idx > 0 ? 'sm:border-l border-slate-100 dark:border-[#1F1F1F]' : ''
            }`}
          >
            <span className={`text-[11px] font-medium ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
              {cat.label}
            </span>
            <span
              className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] mt-0.5 tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {cat.rate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
