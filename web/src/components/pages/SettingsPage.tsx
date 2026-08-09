import React, { useState } from 'react';
import { DestinationConfig } from '../../types';
import { 
  Settings, 
  Radio, 
  Sliders, 
  Sparkles, 
  Key, 
  Puzzle, 
  Check, 
  Star, 
  ShieldCheck, 
  Save 
} from 'lucide-react';

interface SettingsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ destinations, setDestinations }) => {
  const [defaultDestId, setDefaultDestId] = useState<string>(
    destinations.find(d => d.isDefault)?.id || destinations[0]?.id || ''
  );
  const [aiExtractionPrompt, setAiExtractionPrompt] = useState(
    "Extract job title, company name, salary range, application deadline, and key responsibilities into JSON."
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setDestinations(prev =>
      prev.map(d => ({
        ...d,
        isDefault: d.id === defaultDestId
      }))
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn font-sans text-stone-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-serif font-extrabold text-white">
            Clipper Settings & Extension Preferences
          </h1>
        </div>
        <p className="text-xs text-stone-400 mt-1 font-sans">
          Manage extension default save targets, custom AI extraction instructions, and security keys.
        </p>
      </div>

      {/* Default Destination Selection */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
          <Radio className="w-4 h-4 text-amber-500" />
          <span>Default Save Destination (Extension & Floating Button)</span>
        </div>
        <p className="text-xs text-stone-400 font-sans">
          When you single-click the floating 28px extension button, Clipper will instantly format and append clips into this target.
        </p>

        <div className="space-y-2.5 font-mono text-xs">
          {destinations.map(d => (
            <label
              key={d.id}
              className={`flex items-center justify-between p-3.5 rounded-sm border cursor-pointer transition-all ${
                defaultDestId === d.id
                  ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                  : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="defaultDest"
                  checked={defaultDestId === d.id}
                  onChange={() => setDefaultDestId(d.id)}
                  className="w-4 h-4 text-amber-500 accent-amber-500"
                />
                <div>
                  <span className="font-serif font-bold text-white flex items-center gap-1.5 text-sm">
                    {d.name}
                    {d.isDefault && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        CURRENT DEFAULT
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-stone-500 block font-mono">{d.targetResourceName || 'Configured Storage'}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${d.connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-stone-900 text-stone-500'}`}>
                {d.connected ? 'Connected' : 'Disconnected'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Extraction Prompt Configuration */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Extraction Prompt Rules</span>
        </div>
        <p className="text-xs text-stone-400 font-sans">
          Customize instructions passed to Gemini/Claude when parsing scraped webpage content into structured fields.
        </p>

        <textarea
          value={aiExtractionPrompt}
          onChange={e => setAiExtractionPrompt(e.target.value)}
          rows={3}
          className="w-full p-3 bg-[#050505] text-stone-200 text-xs rounded-sm border border-white/10 font-mono focus:border-amber-500 outline-none leading-relaxed"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess && (
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Preferences Saved Successfully!
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          className="ml-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs rounded-sm shadow-md flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};
