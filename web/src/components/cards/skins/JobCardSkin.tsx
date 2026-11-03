import React from 'react';
import { Briefcase, MapPin, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { ClipItem } from '../../../types';
import { JobMeta } from '../../../types/clipPlatform';

interface JobCardSkinProps {
  clip: ClipItem;
  meta?: JobMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

export const JobCardSkin: React.FC<JobCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const company = meta?.company || clip.sourceAuthor || 'Hiring Company';
  const role = meta?.role || clip.title || 'Job Opening';
  const location = meta?.location || 'Remote / Hybrid';
  const salary = meta?.salary;
  const deadline = meta?.deadline;
  const applyUrl = meta?.apply_url || clip.url;

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* Company Header & Location */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors cursor-pointer truncate max-w-[170px]"
          >
            <Briefcase className="w-3 h-3 shrink-0" />
            <span className="truncate">{company}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {salary && (
          <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <DollarSign className="w-3 h-3" />
            <span>{salary}</span>
          </div>
        )}
      </div>

      {/* Role Title */}
      <h3
        onClick={() => onOpenDetail(clip)}
        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 leading-snug cursor-pointer"
      >
        {role}
      </h3>

      {/* Summary / Description */}
      {clip.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {clip.summary}
        </p>
      )}

      {/* Deadline if present */}
      {deadline && (
        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400">
          <Calendar className="w-3 h-3" />
          <span>Apply by {new Date(deadline).toLocaleDateString()}</span>
        </div>
      )}

      {/* Apply CTA Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(applyUrl, '_blank', 'noopener,noreferrer');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
        >
          <span>Apply on {company}</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </button>
      </div>
    </div>
  );
};

