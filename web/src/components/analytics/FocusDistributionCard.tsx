import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ReactIcon,
  OpenAIIcon,
  LinkedInIcon,
  FigmaIcon,
  DockerIcon,
  PythonIcon,
} from '../BrandIcons';

interface FocusDistributionCardProps {
  knowledgeRadar?: Array<{ subject: string; currentPeriod: number; previousPeriod: number; count?: number }>;
  clips?: any[];
  isDark?: boolean;
}

export const FocusDistributionCard: React.FC<FocusDistributionCardProps> = ({
  knowledgeRadar,
  clips,
  isDark = true,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const renderSubjectIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('ai') || l.includes('llm') || l.includes('research'))
      return <OpenAIIcon className="w-4 h-4 text-[#3FE769]" />;
    if (l.includes('web') || l.includes('code') || l.includes('engine') || l.includes('architect'))
      return <ReactIcon className="w-4 h-4" />;
    if (l.includes('job') || l.includes('career') || l.includes('talent') || l.includes('ops'))
      return <LinkedInIcon className="w-4 h-4" />;
    if (l.includes('design') || l.includes('product') || l.includes('ui'))
      return <FigmaIcon className="w-4 h-4" />;
    if (l.includes('cloud') || l.includes('devops') || l.includes('infra') || l.includes('tools'))
      return <DockerIcon className="w-4 h-4" />;
    if (l.includes('data') || l.includes('analyt') || l.includes('fintech') || l.includes('market'))
      return <PythonIcon className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4 text-[#3FE769]" />;
  };

  const subjects = React.useMemo(() => {
    if (clips && clips.length > 0) {
      const areaCounts: Record<string, number> = {
        'Web Architecture': 0,
        'AI & LLMs': 0,
        'Job Ops & Careers': 0,
        'Design Systems': 0,
        'Cloud & DevOps': 0,
        'Data & Analytics': 0,
      };

      clips.forEach((c: any) => {
        const ctype = (c.content_type || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.map((t: string) => String(t).toLowerCase()) : [];

        if (ctype.includes('job') || tags.includes('career') || tags.includes('jobs') || tags.includes('hiring')) {
          areaCounts['Job Ops & Careers']++;
        } else if (tags.includes('ai') || tags.includes('ml') || tags.includes('gpt') || tags.includes('llm') || title.includes('ai')) {
          areaCounts['AI & LLMs']++;
        } else if (tags.includes('design') || tags.includes('ui') || tags.includes('ux') || tags.includes('figma')) {
          areaCounts['Design Systems']++;
        } else if (tags.includes('cloud') || tags.includes('devops') || tags.includes('docker') || tags.includes('aws')) {
          areaCounts['Cloud & DevOps']++;
        } else if (tags.includes('data') || tags.includes('analytics') || tags.includes('python') || tags.includes('sql')) {
          areaCounts['Data & Analytics']++;
        } else {
          areaCounts['Web Architecture']++;
        }
      });

      const maxClips = Math.max(...Object.values(areaCounts), 1);

      return Object.entries(areaCounts).map(([label, count]) => {
        const depth = Math.min(100, Math.round((count / maxClips) * 100));
        return {
          label,
          depth: count > 0 ? Math.max(10, depth) : 0,
          count,
          iconType: label.toLowerCase(),
          paceDelta: count > 0 ? Math.round((count / (clips.length || 1)) * 100) : 0,
        };
      });
    }

    if (knowledgeRadar && knowledgeRadar.length > 0 && knowledgeRadar.some(k => k.currentPeriod > 0 || (k as any).count > 0)) {
      return knowledgeRadar.slice(0, 6).map((item) => {
        const delta = Math.round(Math.abs(item.currentPeriod - (item.previousPeriod ?? 60)) * 0.8 * 10) / 10;
        const realCount = (item as any).count ?? (item.currentPeriod > 0 ? Math.max(1, Math.round(item.currentPeriod / 15)) : 0);
        return {
          label: item.subject,
          depth: Math.min(100, Math.max(0, item.currentPeriod)),
          count: realCount,
          iconType: item.subject.toLowerCase(),
          paceDelta: delta || 0,
        };
      });
    }

    return [
      { label: 'Web Architecture', depth: 0, count: 0, iconType: 'web', paceDelta: 0 },
      { label: 'AI & LLMs', depth: 0, count: 0, iconType: 'ai', paceDelta: 0 },
      { label: 'Job Ops & Careers', depth: 0, count: 0, iconType: 'job', paceDelta: 0 },
      { label: 'Design Systems', depth: 0, count: 0, iconType: 'design', paceDelta: 0 },
      { label: 'Cloud & DevOps', depth: 0, count: 0, iconType: 'cloud', paceDelta: 0 },
      { label: 'Data & Analytics', depth: 0, count: 0, iconType: 'data', paceDelta: 0 },
    ];
  }, [clips, knowledgeRadar]);

  const averageDepth = Math.round(
    subjects.reduce((sum, s) => sum + s.depth, 0) / Math.max(1, subjects.length)
  );

  const getBrandHoverStyles = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('ai') || l.includes('llm') || l.includes('research'))
      return 'hover:border-[#10A37F]/60 hover:shadow-[0_0_16px_rgba(16,163,127,0.15)]';
    if (l.includes('web') || l.includes('code') || l.includes('engine') || l.includes('architect'))
      return 'hover:border-[#61DAFB]/60 hover:shadow-[0_0_16px_rgba(97,218,251,0.15)]';
    if (l.includes('job') || l.includes('career') || l.includes('talent') || l.includes('ops'))
      return 'hover:border-[#0A66C2]/60 hover:shadow-[0_0_16px_rgba(10,102,194,0.15)]';
    if (l.includes('design') || l.includes('product') || l.includes('ui'))
      return 'hover:border-[#F24E1E]/60 hover:shadow-[0_0_16px_rgba(242,78,30,0.15)]';
    if (l.includes('cloud') || l.includes('devops') || l.includes('infra') || l.includes('tools'))
      return 'hover:border-[#2496ED]/60 hover:shadow-[0_0_16px_rgba(36,150,237,0.15)]';
    if (l.includes('data') || l.includes('analyt') || l.includes('fintech') || l.includes('market'))
      return 'hover:border-[#3776AB]/60 hover:shadow-[0_0_16px_rgba(55,118,171,0.15)]';
    return 'hover:border-[#3FE769]/60 hover:shadow-[0_0_16px_rgba(63,231,105,0.15)]';
  };

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
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}
            >
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3
                className={`text-sm sm:text-base font-bold font-['Outfit',sans-serif] tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Subject Specialty &amp; Focus
              </h3>
              <p
                className={`text-[11px] font-['Inter',sans-serif] mt-0.5 ${
                  isDark ? 'text-[#878787]' : 'text-slate-500'
                }`}
              >
                Discipline mastery &amp; domain balance across 6 core areas
              </p>
            </div>
          </div>

          <motion.span
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border cursor-pointer transition-all ${
              isDark
                ? 'bg-[#1C1B1B] text-[#3FE769] border-[#2A2A2A] hover:border-[#3FE769]/40'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3FE769]" />
            {averageDepth}% Specialty Index
          </motion.span>
        </div>

        {/* Modular 2x3 Grid of Discipline Cards with Brand-colored Glows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 my-2">
          {subjects.map((subj) => {
            const isSelected = selectedSubject === subj.label;
            const brandGlow = getBrandHoverStyles(subj.label);

            return (
              <motion.div
                key={subj.label}
                whileHover={{ y: -3, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                onClick={() =>
                  setSelectedSubject(isSelected ? null : subj.label)
                }
                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group select-none ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1C281F] border-[#3FE769] shadow-[0_0_16px_rgba(63,231,105,0.15)]'
                      : 'bg-emerald-50 border-emerald-400 shadow-xs'
                    : isDark
                    ? `bg-[#141414] border-[#222222] ${brandGlow} hover:bg-[#181818]`
                    : `bg-slate-50/70 border-slate-200 ${brandGlow} hover:bg-white`
                }`}
              >
                {/* Top Row: Icon + Depth Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-110 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#162E1D] text-[#3FE769] border-[#3FE769]/50'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isDark
                        ? 'bg-[#1C1B1B] border-[#2A2A2A]'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    {renderSubjectIcon(subj.label)}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-[#3FE769] text-black border-[#3FE769]'
                          : 'bg-emerald-800 text-white border-emerald-800'
                        : isDark
                        ? 'bg-[#1C281F] text-[#3FE769] border-[#2D6A4F]/60'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {subj.depth}% Depth
                  </span>
                </div>

                {/* Middle Row: Title & Volume */}
                <div className="my-1">
                  <h4
                    className={`text-xs sm:text-[13px] font-bold font-['Outfit',sans-serif] tracking-tight truncate transition-colors ${
                      isSelected
                        ? isDark ? 'text-[#3FE769]' : 'text-emerald-800'
                        : isDark ? 'text-white group-hover:text-white' : 'text-slate-900'
                    }`}
                  >
                    {subj.label}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] mt-1 font-['Inter',sans-serif]">
                    <span
                      className={`font-medium ${
                        isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
                      }`}
                    >
                      {subj.count} clips
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold transition-transform duration-200 group-hover:scale-105 ${
                        isDark ? 'text-[#3FE769]' : 'text-emerald-700'
                      }`}
                    >
                      <TrendingUp className="w-2.5 h-2.5" />
                      +{subj.paceDelta}%
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Micro-Progress Line */}
                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${
                    isDark ? 'bg-[#242424]' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
                    }`}
                    style={{ width: `${subj.depth}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className={`pt-3 mt-3 border-t flex items-center justify-between text-[11px] font-['Inter',sans-serif] ${
          isDark
            ? 'border-[#222222] text-[#878787]'
            : 'border-slate-100 text-slate-500'
        }`}
      >
        <span>6 Core Disciplines Monitored</span>
        <span
          className={`font-mono font-medium ${
            isDark ? 'text-[#3FE769]' : 'text-emerald-700'
          }`}
        >
          {selectedSubject ? `Selected: ${selectedSubject}` : 'Balanced Domain Density'}
        </span>
      </div>
    </motion.div>
  );
};
