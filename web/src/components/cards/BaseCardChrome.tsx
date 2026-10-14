import React from 'react';
import { 
  Check, 
  ExternalLink, 
  Folder, 
  Globe, 
  Laptop, 
  Maximize2, 
  Send, 
  Smartphone, 
  Star, 
  Trash2 
} from 'lucide-react';
import { ClipItem, CustomCategoryConfig, CustomPageConfig } from '../../types';
import { BrandIcon } from '../BrandIcons';
import { 
  formatClipDate, 
  getClipContentTypeKey, 
  getClipContentTypeMeta, 
  getClipIntent, 
  getClipSourceKey, 
  getClipSourceMeta, 
  getDomainFromUrl, 
  getIntentBadgeStyle, 
  getSourceFormatLabel 
} from '../pages/ClipsPage';

interface CardHeaderChromeProps {
  clip: ClipItem;
  isDark: boolean;
  isSelected?: boolean;
  onToggleSelect?: (clipId: string) => void;
  onToggleFavorite: (clipId: string) => void;
  showCheckbox?: boolean;
}

export const CardHeaderChrome: React.FC<CardHeaderChromeProps> = ({
  clip,
  isDark,
  isSelected = false,
  onToggleSelect,
  onToggleFavorite,
  showCheckbox = true,
}) => {
  const domain = getDomainFromUrl(clip.url);
  const formatLabel = getSourceFormatLabel(clip);
  const sourceKey = getClipSourceKey(clip);
  const sourceMeta = getClipSourceMeta(sourceKey);

  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Selection Checkbox (visible when selected or on card hover) */}
        {showCheckbox && onToggleSelect && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(clip.id);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isSelected
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : isDark
                  ? 'border-[#333333] hover:border-[#555555] bg-[#161616] text-transparent opacity-0 group-hover:opacity-100'
                  : 'border-slate-300 hover:border-slate-400 bg-white text-transparent opacity-0 group-hover:opacity-100'
            }`}
            title={isSelected ? 'Deselect clip' : 'Select clip'}
            aria-label={isSelected ? 'Deselect clip' : 'Select clip'}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </button>
        )}

        {/* Domain & Source Pill with Authentic BrandIcon */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono shrink-0 max-w-[200px] truncate ${
            isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          {sourceKey !== 'other' ? (
            <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
              <BrandIcon name={sourceMeta.brandIcon} className="w-3.5 h-3.5" />
            </div>
          ) : clip.faviconUrl ? (
            <img
              src={clip.faviconUrl}
              alt=""
              className="w-3.5 h-3.5 rounded-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{domain}</span>
          <span className="opacity-40">•</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">{formatLabel}</span>
        </div>
      </div>

      {/* Star Favorite Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(clip.id);
        }}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
          clip.isFavorite
            ? 'text-amber-400 bg-amber-400/10'
            : isDark
              ? 'text-[#666666] hover:text-amber-400 hover:bg-[#1C1B1B]'
              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
        }`}
        title={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
        aria-label={clip.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
      >
        <Star className={`w-3.5 h-3.5 transition-transform ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
      </button>
    </div>
  );
};

interface CardIntentBadgesProps {
  clip: ClipItem;
  isDark: boolean;
  customCategories?: CustomCategoryConfig[];
  customPages?: CustomPageConfig[];
}

export const CardIntentBadges: React.FC<CardIntentBadgesProps> = ({
  clip,
  isDark,
  customCategories,
  customPages = [],
}) => {
  const intent = getClipIntent(clip, customCategories);
  const intentStyle = getIntentBadgeStyle(intent, isDark, customCategories);
  const typeKey = getClipContentTypeKey(clip);
  const typeMeta = getClipContentTypeMeta(typeKey);
  const TypeIcon = typeMeta.icon;
  const customPage = customPages.find((p) => p.id === clip.pageId || p.slug === clip.pageId);

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      {/* Intent Pill */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: intentStyle.dot }} />
        <span>{intent}</span>
      </span>

      {/* Content Type Pill */}
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border"
        style={{ backgroundColor: typeMeta.bg, color: typeMeta.color, borderColor: `${typeMeta.color}35` }}
      >
        <TypeIcon className="w-2.5 h-2.5 shrink-0" />
        <span>{typeMeta.label}</span>
      </span>

      {/* Custom Page Pill (if assigned) */}
      {customPage && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border truncate max-w-[140px]"
          style={{ backgroundColor: `${customPage.color}18`, color: customPage.color, borderColor: `${customPage.color}40` }}
          title={customPage.name}
        >
          <Folder className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{customPage.name}</span>
        </span>
      )}

      {/* Salary / Price / Company metric if present */}
      {clip.extractedData?.salary && (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
          {clip.extractedData.salary}
        </span>
      )}
      {clip.extractedData?.price && !clip.extractedData?.salary && (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
          {clip.extractedData.price}
        </span>
      )}
      {clip.extractedData?.company && (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono truncate max-w-[130px] border ${
            isDark ? 'bg-[#181818] border-[#262626] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          {clip.extractedData.company}
        </span>
      )}
    </div>
  );
};

interface CardFooterChromeProps {
  clip: ClipItem;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
  onDelete: (clipId: string) => void;
  onSync?: (clip: ClipItem, destType: string) => void;
  isSynced?: boolean;
}

export const CardFooterChrome: React.FC<CardFooterChromeProps> = ({
  clip,
  isDark,
  onOpenDetail,
  onDelete,
  onSync,
  isSynced = false,
}) => {
  const isMobileApp = clip.sourceApp.includes('Mobile');
  const sourceLabel = clip.sourceApp.replace('Chrome Extension', 'Chrome').replace('Mobile Share Sheet', 'Mobile');

  return (
    <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
      {/* Capture Source & Timestamp */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#777777] min-w-0 truncate">
        {isMobileApp ? <Smartphone className="w-3.5 h-3.5 shrink-0" /> : <Laptop className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{sourceLabel}</span>
        <span>•</span>
        <span className="shrink-0">{formatClipDate(clip.createdAt)}</span>
      </div>

      {/* Destination Badges & Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 1-Tap Sync / Synced Badge */}
        {clip.syncedTo && clip.syncedTo.length > 0 ? (
          <div className="flex items-center gap-1">
            {clip.syncedTo.slice(0, 2).map((dest) => (
              <span
                key={dest}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{dest === 'google_sheets' ? 'Sheets' : dest === 'notion' ? 'Notion' : dest}</span>
              </span>
            ))}
          </div>
        ) : onSync ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSync(clip, 'notion');
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1 ${
              isSynced
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                : isDark
                  ? 'bg-[#181818] border-[#2B2B2B] text-[#888888] hover:text-white hover:border-[#3FE769]/50'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="1-Tap Sync to Notion"
          >
            {isSynced ? <Check className="w-2.5 h-2.5" /> : <Send className="w-2.5 h-2.5" />}
            <span>{isSynced ? 'Synced!' : 'Sync'}</span>
          </button>
        ) : null}

        {/* Open Drawer Modal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(clip);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Open Clip Drawer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* External Link */}
        <a
          href={clip.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Open Source Link"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(clip.id);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'text-[#888888] hover:text-red-400 hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
          }`}
          title="Delete Clip"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
