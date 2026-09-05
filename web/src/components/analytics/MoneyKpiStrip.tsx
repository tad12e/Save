import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Gauge } from 'lucide-react';
import { MoneySummary } from '../../lib/analyticsApi';

interface MoneyKpiStripProps {
  money?: MoneySummary;
  isDark?: boolean;
}

// Real backend money (olap_engine._assemble_modules). Falls back to the
// same backend formula when money is missing so offline matches backend.
export const MoneyKpiStrip: React.FC<MoneyKpiStripProps> = ({ money, isDark }) => {
  const saved = money?.saved_dollar_value ?? 0;
  const hours = money?.time_saved_hours ?? 0;
  const rate = money?.action_rate_percent ?? 0;

  const shell = isDark
    ? 'bg-[#0A0A0A] border-[#262626]'
    : 'bg-white border-slate-200/80';
  const label = isDark ? 'text-[#878787]' : 'text-slate-500';
  const value = isDark ? 'text-[#EDEDED]' : 'text-slate-900';
  const sub = isDark ? 'text-[#A1A1A1]' : 'text-slate-400';
  const tile = isDark
    ? 'bg-[#111111] border-[#262626]'
    : 'bg-slate-50/80 border-slate-200/80';

  const items = [
    {
      id: 'saved_value',
      label: 'SAVED VALUE',
      display: `$${saved.toLocaleString()}`,
      subtext: `${hours}h saved · $25/hr`,
      icon: DollarSign,
      accent: isDark ? 'text-[#00CA50]' : 'text-emerald-700',
    },
    {
      id: 'time_saved',
      label: 'TIME SAVED',
      display: `${hours}h`,
      subtext: '~15 min per clip',
      icon: Clock,
      accent: isDark ? 'text-[#EDEDED]' : 'text-slate-900',
    },
    {
      id: 'action_rate',
      label: 'ACTION RATE',
      display: `${rate}%`,
      subtext: 'Opportunities actioned',
      icon: Gauge,
      accent: isDark ? 'text-[#00CA50]' : 'text-emerald-700',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 }}
      className={`w-full rounded-2xl border p-4 sm:p-5 ${shell}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border p-3.5 ${tile}`}
          >
            <div className="shrink-0">
              <item.icon className={`w-4 h-4 ${item.accent}`} />
            </div>
            <div className="min-w-0">
              <div className={`text-[10px] font-mono font-semibold tracking-wider uppercase ${label}`}>
                {item.label}
              </div>
              <div className={`text-xl font-bold font-sans tracking-tight ${value}`}>
                {item.display}
              </div>
              <div className={`text-[11px] font-sans ${sub}`}>{item.subtext}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
