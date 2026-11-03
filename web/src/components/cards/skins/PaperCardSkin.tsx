import React from 'react';
import { FileText, Download, Users, ExternalLink, Award } from 'lucide-react';
import { ClipItem } from '../../../types';
import { PaperMeta, formatCompactCount } from '../../../types/clipPlatform';

interface PaperCardSkinProps {
  clip: ClipItem;
  meta?: PaperMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

export const PaperCardSkin: React.FC<PaperCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const paperId = meta?.paper_id;
  const title = meta?.title || clip.title || 'Research Paper';
  const authors = meta?.authors || (clip.sourceAuthor ? [clip.sourceAuthor] : []);
  const year = meta?.published_year;
  const pdfUrl = meta?.pdf_url;
  const citations = meta?.citations;
  const doi = meta?.doi;

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* Paper Tag & Academic Badges */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(clip.url, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer truncate"
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span>{paperId ? `arXiv:${paperId}` : 'Paper'}</span>
          </div>

          {year && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {year}
            </span>
          )}
        </div>

        {citations !== undefined && citations > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 shrink-0">
            <Award className="w-3 h-3 text-amber-500" />
            <span>{formatCompactCount(citations)} citations</span>
          </div>
        )}
      </div>

      {/* Paper Title */}
      <h3
        onClick={() => onOpenDetail(clip)}
        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors line-clamp-2 leading-snug cursor-pointer"
      >
        {title}
      </h3>

      {/* Authors List */}
      {authors && authors.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
          <Users className="w-3 h-3 shrink-0 opacity-70" />
          <span className="line-clamp-1">{authors.join(', ')}</span>
        </div>
      )}

      {/* Abstract / Summary */}
      {clip.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5 italic">
          "{clip.summary}"
        </p>
      )}

      {/* DOI identifier if present */}
      {doi && (
        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
          DOI: {doi}
        </div>
      )}

      {/* Actions: Download PDF + View Abstract */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {pdfUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(pdfUrl, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3 h-3" />
            <span>PDF</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(clip.url, '_blank', 'noopener,noreferrer');
          }}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
        >
          <span>Abstract</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </button>
      </div>
    </div>
  );
};

