import React from 'react';
import { motion } from 'framer-motion';

interface SubjectsBarProps {
  tags?: Array<{ tag: string; count: number }>;
}

export const SubjectsBar: React.FC<SubjectsBarProps> = () => {
  const subjects = [
    { label: 'Product', color: '#EF4444' },
    { label: 'Engineering', color: '#10B981' },
    { label: 'Fundraising', color: '#3B82F6' },
    { label: 'Sales', color: '#F59E0B' },
    { label: 'Marketing', color: '#8B5CF6' },
    { label: 'AI & Research', color: '#14B8A6' },
    { label: 'Design System', color: '#EC4899' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <h4 className="text-sm font-bold text-slate-900 font-sans">Subjects</h4>
        <span className="text-xs font-mono text-slate-400">8 total</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {subjects.map((subj) => (
          <div
            key={subj.label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }} />
            <span className="text-[11px] font-sans">{subj.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
