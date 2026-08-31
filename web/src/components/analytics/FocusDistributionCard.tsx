import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface FocusDistributionCardProps {
  knowledgeRadar?: Array<{ subject: string; currentPeriod: number; previousPeriod: number }>;
}

export const FocusDistributionCard: React.FC<FocusDistributionCardProps> = ({
  knowledgeRadar,
}) => {
  const radarData = knowledgeRadar || [
    { subject: 'Product', current: 70 },
    { subject: 'Engineering', current: 85 },
    { subject: 'Fundraising', current: 60 },
    { subject: 'Sales', current: 90 },
    { subject: 'Marketing', current: 65 },
    { subject: 'Customer Calls', current: 55 },
    { subject: 'Hiring', current: 75 },
    { subject: 'Strategy & Ops', current: 80 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.22 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
    >
      <div>
        <h3 className="text-base font-bold text-slate-900 font-sans tracking-tight">
          Focus Distribution
        </h3>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          A breakdown of your subject specialty
        </p>
      </div>

      {/* Spider Radar Polygon Canvas */}
      <div className="w-full h-64 sm:h-72 my-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'sans-serif', fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#E2E8F0" tick={false} axisLine={false} />
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
            <Radar
              name="Depth Score"
              dataKey="current"
              stroke="#2D6A4F"
              fill="#40916C"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
