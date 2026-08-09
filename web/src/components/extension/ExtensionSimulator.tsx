import React, { useState, useEffect } from 'react';
import { DestinationConfig, ClipItem } from '../../types';
import { 
  Settings, 
  Check, 
  FileSpreadsheet, 
  FileText, 
  Table, 
  Zap, 
  X, 
  ArrowLeft, 
  Sparkles,
  Info
} from 'lucide-react';

interface ExtensionSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: DestinationConfig[];
  onSaveClip: (clipData: {
    title: string;
    url: string;
    selectedText?: string;
    destinationType: string;
    targetResourceName?: string;
  }) => void;
}

export const ExtensionSimulator: React.FC<ExtensionSimulatorProps> = ({
  isOpen,
  onClose,
  destinations,
  onSaveClip,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'mode1_quick' | 'mode2_configure'>('mode1_quick');
  const [simulatedSelectionText, setSimulatedSelectionText] = useState(
    'Senior React & AI Engineer wanted. Remote worldwide. Salary: $150,000 - $180,000 + equity. Apply at vercel.com/careers'
  );
  const [chosenDestId, setChosenDestId] = useState<string>(
    destinations.find(d => d.isDefault)?.id || destinations[0]?.id || ''
  );
  const [rememberChoice, setRememberChoice] = useState(true);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [quickSaveCheck, setQuickSaveCheck] = useState(false);

  const defaultDest = destinations.find(d => d.id === chosenDestId) || destinations[0];

  const handleFloatingButtonClick = () => {
    if (simulatedSelectionText.trim().length > 0) {
      // Case B: Text selected -> open Selection Mini-Panel
      setPanelOpen(true);
      setPanelMode('mode1_quick');
    } else {
      // Case A: No text selected -> quick save current page immediately!
      setQuickSaveCheck(true);
      onSaveClip({
        title: 'Clipped Page: ' + document.title,
        url: window.location.href,
        destinationType: defaultDest?.type || 'google_sheets',
        targetResourceName: defaultDest?.targetResourceName
      });
      setTimeout(() => setQuickSaveCheck(false), 1500);
    }
  };

  const handleExecuteSave = () => {
    setIsSavedSuccess(true);
    onSaveClip({
      title: 'Senior React & AI Engineer Opportunity',
      url: 'https://x.com/tech_careers/status/18219482104921',
      selectedText: simulatedSelectionText,
      destinationType: defaultDest?.type || 'google_sheets',
      targetResourceName: defaultDest?.targetResourceName
    });

    setTimeout(() => {
      setIsSavedSuccess(false);
      setPanelOpen(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 select-none">
      {/* 28px Peeking Floating Button */}
      <div className="relative">
        <button
          onClick={handleFloatingButtonClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`group flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isHovered || panelOpen ? 'translate-x-0 opacity-100 shadow-xl shadow-amber-500/20' : 'translate-x-3.5 opacity-60'
          }`}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: quickSaveCheck ? '#050505' : '#080808',
            border: '1px solid #f59e0b',
          }}
          title="Clipper Extension (Click to Save)"
        >
          {quickSaveCheck ? (
            <Check className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
              <path d="M7 8h12M7 13h8M7 18h10" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="20" cy="18" r="4" fill="#f59e0b" />
              <path d="M18.5 18l1 1 2-2" stroke="black" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Floating Tooltip Label on Hover */}
        {isHovered && !panelOpen && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#080808] text-amber-400 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm shadow-md border border-white/10 animate-fadeIn">
            Clipper Floating Save
          </div>
        )}
      </div>

      {/* 240px Text Selection Mini-Panel */}
      {panelOpen && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-[240px] bg-[#080808] text-stone-200 border border-white/10 rounded-sm shadow-2xl p-3.5 z-50 space-y-3 animate-fadeIn">
          {/* Close Handle */}
          <button
            onClick={() => setPanelOpen(false)}
            className="absolute top-2.5 right-2.5 text-stone-500 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {panelMode === 'mode1_quick' ? (
            /* MODE 1 — Quick Save */
            <div className="space-y-3 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-1.5 font-serif text-white text-xs">
                  <div className="w-4 h-4 rounded-sm bg-amber-500 text-black flex items-center justify-center font-bold text-[10px]">
                    C
                  </div>
                  <span>Clipper Uplink</span>
                </div>

                <button
                  onClick={() => setPanelMode('mode2_configure')}
                  className="p-1 rounded-sm text-stone-500 hover:text-amber-400 hover:bg-white/[0.04] transition-colors"
                  title="Configure Destination (⚙)"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Preview */}
              <div className="p-2 rounded-sm bg-[#050505] border border-white/5 text-[11px] text-stone-400 italic line-clamp-2 leading-tight font-sans">
                "{simulatedSelectionText}"
              </div>

              {/* Destination Row */}
              <div className="p-2 rounded-sm bg-[#050505] border border-amber-500/20 flex items-center justify-between text-[11px] font-mono">
                <span className="text-stone-500">TARGET:</span>
                <span className="font-bold text-amber-400 truncate max-w-[110px]">
                  {defaultDest?.name || 'Google Sheets'}
                </span>
              </div>

              {/* Save Now CTA Button */}
              <button
                onClick={handleExecuteSave}
                disabled={isSavedSuccess}
                className={`w-full py-2 px-3 rounded-sm font-mono tracking-wider uppercase font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isSavedSuccess
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved ✓</span>
                  </>
                ) : (
                  <span>Save now</span>
                )}
              </button>
            </div>
          ) : (
            /* MODE 2 — Configure Destination */
            <div className="space-y-3 text-xs">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <button
                  onClick={() => setPanelMode('mode1_quick')}
                  className="text-stone-500 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-serif text-white text-xs">Configure Target</span>
              </div>

              {/* Destination Radio List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {destinations.map(dest => (
                  <label
                    key={dest.id}
                    onClick={() => setChosenDestId(dest.id)}
                    className={`flex items-center gap-2 p-2 rounded-sm border cursor-pointer text-[11px] font-mono transition-all ${
                      chosenDestId === dest.id
                        ? 'bg-[#050505] border-amber-500 text-amber-400 font-bold'
                        : 'bg-[#050505] border-white/5 text-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="configDest"
                      checked={chosenDestId === dest.id}
                      onChange={() => setChosenDestId(dest.id)}
                      className="w-3 h-3 text-amber-500 accent-amber-500"
                    />
                    <span className="truncate">{dest.name}</span>
                  </label>
                ))}
              </div>

              {/* Remember Checkbox */}
              <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-stone-500 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberChoice}
                  onChange={e => setRememberChoice(e.target.checked)}
                  className="w-3.5 h-3.5 text-amber-500 rounded-sm accent-amber-500"
                />
                <span>Remember this target</span>
              </label>

              {/* Save with Config CTA */}
              <button
                onClick={handleExecuteSave}
                disabled={isSavedSuccess}
                className={`w-full py-2 px-3 rounded-sm font-mono tracking-wider uppercase font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  isSavedSuccess
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved ✓</span>
                  </>
                ) : (
                  <span>Save with Config</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
