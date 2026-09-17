import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Compass, Sparkles } from 'lucide-react';

interface KnowledgeRadarChartProps {
  knowledgeRadar?: any[];
  clips?: any[];
  isDark?: boolean;
}

export const KnowledgeRadarChart: React.FC<KnowledgeRadarChartProps> = ({
  knowledgeRadar,
  clips,
  isDark = true,
}) => {
  // 10-Axis Mobile Parity Verticals
  const subjectsList = [
    'AI/ML', 'Engineering', 'Design', 'Business', 'Research',
    'Health', 'Finance', 'Culture', 'Tools', 'Career',
  ];

  const chartData = React.useMemo(() => {
    if (knowledgeRadar && knowledgeRadar.length >= 5 && knowledgeRadar.some((k) => (k.currentPeriod ?? k.score ?? 0) > 0)) {
      return knowledgeRadar.map((item, idx) => {
        const subj = item.subject || item.axis || item.name || subjectsList[idx % 10];
        const cur = item.currentPeriod ?? item.score ?? 0;
        const prev = item.previousPeriod ?? (cur > 0 ? Math.round(cur * 0.8) : 0);
        return {
          subject: subj,
          currentPeriod: cur,
          previousPeriod: prev,
          fullMark: 100,
        };
      });
    }

    if (clips && clips.length > 0) {
      const counts: Record<string, number> = {};
      subjectsList.forEach((s) => { counts[s] = 0; });
      clips.forEach((c: any) => {
        const ctype = (c.content_type || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.map((t: string) => String(t).toLowerCase()) : [];

        if (ctype.includes('job') || tags.includes('career')) counts['Career']++;
        else if (ctype.includes('tool') || tags.includes('github') || tags.includes('tools')) counts['Tools']++;
        else if (tags.includes('ai') || tags.includes('ml') || tags.includes('gpt')) counts['AI/ML']++;
        else if (tags.includes('design') || tags.includes('ui')) counts['Design']++;
        else if (tags.includes('finance') || tags.includes('fintech')) counts['Finance']++;
        else if (tags.includes('health') || tags.includes('fitness')) counts['Health']++;
        else if (tags.includes('research') || tags.includes('paper') || tags.includes('arxiv')) counts['Research']++;
        else counts['Engineering']++;
      });
      const maxC = Math.max(...Object.values(counts), 1);
      return subjectsList.map((subj) => {
        const score = Math.round((counts[subj] / maxC) * 100);
        return {
          subject: subj,
          currentPeriod: score,
          previousPeriod: score > 0 ? Math.max(10, Math.round(score * 0.8)) : 0,
          fullMark: 100,
        };
      });
    }

    return subjectsList.map((subj) => ({
      subject: subj,
      currentPeriod: 0,
      previousPeriod: 0,
      fullMark: 100,
    }));
  }, [knowledgeRadar, clips]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}
          >
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              10-Axis Knowledge Radar
            </h3>
            <p
              className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              Content intelligence &amp; multi-axis domain expertise balance
            </p>
          </div>
        </div>

        <motion.span
          whileHover={{ scale: 1.05 }}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border self-start sm:self-auto cursor-pointer transition-all ${
            isDark
              ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] hover:border-[#3FE769]/40'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <Sparkles className="w-3 h-3 text-[#3FE769]" />
          AI &amp; Research Peak
        </motion.span>
      </div>

      {/* Spider Radar Canvas */}
      <div className="w-full h-64 sm:h-72 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke={isDark ? '#262626' : '#E2E8F0'} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: isDark ? '#A1A1A1' : '#475569',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
              }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              stroke={isDark ? '#262626' : '#CBD5E1'}
              tick={{ fill: isDark ? '#666666' : '#94A3B8', fontSize: 9 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#181818' : '#0F172A',
                borderColor: isDark ? '#262626' : '#334155',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
                paddingTop: '8px',
              }}
            />
            <Radar
              name="This Period"
              dataKey="currentPeriod"
              stroke={isDark ? '#3FE769' : '#2D6A4F'}
              fill={isDark ? 'rgba(63, 231, 105, 0.2)' : 'rgba(45, 106, 79, 0.28)'}
              fillOpacity={1}
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              dot={{
                r: 3.5,
                fill: isDark ? '#3FE769' : '#2D6A4F',
                stroke: isDark ? '#000000' : '#FFFFFF',
                strokeWidth: 1.5,
                style: { filter: isDark ? 'drop-shadow(0 0 4px #3FE769)' : 'none' },
              }}
            />
            <Radar
              name="Previous Period"
              dataKey="previousPeriod"
              stroke={isDark ? '#666666' : '#94A3B8'}
              fill={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(148, 163, 184, 0.12)'}
              fillOpacity={1}
              strokeWidth={1.5}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
              dot={{
                r: 2.5,
                fill: isDark ? '#888888' : '#94A3B8',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div
        className={`pt-3 border-t flex items-center justify-between text-[11px] font-['Inter',sans-serif] ${
          isDark ? 'border-[#262626] text-[#878787]' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span>10 Core Knowledge Verticals</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3FE769] animate-pulse" />
          <span
            className={`font-mono font-medium ${
              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
            }`}
          >
            +28% expansion in AI &amp; Systems
          </span>
        </div>
      </div>
    </motion.div>
  );
};
