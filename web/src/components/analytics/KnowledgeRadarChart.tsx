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
import { AnalyticsPayload } from '../../lib/analyticsApi';

interface KnowledgeRadarChartProps {
  knowledgeRadar: AnalyticsPayload['knowledge_radar'];
}

export const KnowledgeRadarChart: React.FC<KnowledgeRadarChartProps> = ({ knowledgeRadar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.38 }}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Compass className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-900 uppercase">
              KNOWLEDGE FINGERPRINT RADAR
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Domain depth & multi-axis expertise balance
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          AI & Web Peak
        </span>
      </div>

      {/* Spider Radar Canvas */}
      <div className="w-full h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={knowledgeRadar}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#CBD5E1" tick={{ fill: '#94A3B8', fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '4px' }} />
            <Radar
              name="This Period"
              dataKey="currentPeriod"
              stroke="#2D6A4F"
              fill="#2D6A4F"
              fillOpacity={0.45}
              strokeWidth={2}
            />
            <Radar
              name="Previous Period"
              dataKey="previousPeriod"
              stroke="#94A3B8"
              fill="#94A3B8"
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-sans">
        <span>6 Core Knowledge Verticals</span>
        <span className="font-mono text-emerald-700 font-medium">+28% expansion in AI research</span>
      </div>
    </motion.div>
  );
};
