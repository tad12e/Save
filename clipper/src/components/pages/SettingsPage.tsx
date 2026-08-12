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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Clipper Settings & Extension Preferences
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage extension default save targets, custom AI extraction instructions, and security keys.
        </p>
      </div>

      {/* Default Destination Selection */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Radio className="w-4 h-4 text-violet-500" />
          <span>Default Save Destination (Extension & Floating Button)</span>
        </div>
        <p className="text-xs text-slate-500">
          When you single-click the floating 28px extension button, Clipper will instantly format and append clips into this target.
        </p>

        <div className="space-y-2.5">
          {destinations.map(d => (
            <label
              key={d.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                defaultDestId === d.id
                  ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 ring-1 ring-violet-500'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 text-xs">
                <input
                  type="radio"
                  name="defaultDest"
                  checked={defaultDestId === d.id}
                  onChange={() => setDefaultDestId(d.id)}
                  className="w-4 h-4 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {d.name}
                    {d.isDefault && (
                      <span className="text-[10px] bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 px-1.5 py-0.5 rounded font-extrabold">
                        CURRENT DEFAULT
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500 block">{d.targetResourceName || 'Configured Storage'}</span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.connected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {d.connected ? 'Connected' : 'Disconnected'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Extraction Prompt Configuration */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>AI Extraction Prompt Rules</span>
        </div>
        <p className="text-xs text-slate-500">
          Customize instructions passed to Gemini/Claude when parsing scraped webpage content into structured fields.
        </p>

        <textarea
          value={aiExtractionPrompt}
          onChange={e => setAiExtractionPrompt(e.target.value)}
          rows={3}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl border border-slate-200 dark:border-slate-700 font-mono focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Preferences Saved Successfully!
          </span>
        )}
        <button
          onClick={handleSaveSettings}
          className="ml-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-500/20 flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};
