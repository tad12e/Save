import React, { useState } from 'react';
import { DestinationConfig } from '../../types';
import { getStoredPrivacyMode, saveStoredPrivacyMode } from '../../lib/storage';
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
  Save,
  HardDrive
} from 'lucide-react';

interface SettingsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ destinations, setDestinations }) => {
  const [defaultDestId, setDefaultDestId] = useState<string>(
    destinations.find(d => d.isDefault)?.id || destinations[0]?.id || ''
  );
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => getStoredPrivacyMode());
  const [aiExtractionPrompt, setAiExtractionPrompt] = useState(
    "Extract job title, company name, salary range, application deadline, and key responsibilities into JSON."
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    saveStoredPrivacyMode(isPrivacyMode);
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
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn font-sans text-stone-200">
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

      {/* Local Privacy Vault Mode */}
      <div className="bg-[#080808] border border-amber-500/30 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>Local Privacy Storage Mode (On-Device Vault)</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-sm">
            100% PRIVATE & OFFLINE
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          When enabled, all web clips, notes, and bookmarks are stored exclusively on your device hard drive using browser-native IndexedDB & LocalStorage. Zero network payloads sent to external servers.
        </p>

        <label className="flex items-center justify-between p-3.5 bg-[#050505] border border-white/10 rounded-sm cursor-pointer hover:border-amber-500/30 transition-all">
          <div className="space-y-0.5">
            <span className="font-mono text-xs text-white font-semibold flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              Enable On-Device Local Privacy Storage
            </span>
            <p className="text-[11px] text-stone-500 font-sans">Store clips in local browser database only. No cloud database transmission.</p>
          </div>
          <input
            type="checkbox"
            checked={isPrivacyMode}
            onChange={(e) => setIsPrivacyMode(e.target.checked)}
            className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
          />
        </label>
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

      {/* Destination Category Routing Mode */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
          <Sliders className="w-4 h-4 text-amber-500" />
          <span>Destination Table Routing Mode</span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          Choose how clips are organized in external destinations like Google Sheets, Notion, and Airtable.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-xs">
          <label className="p-4 rounded-sm border bg-[#050505] border-amber-500/50 text-amber-300 flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="routingMode"
              defaultChecked
              className="mt-0.5 w-4 h-4 text-amber-500 accent-amber-500"
            />
            <div className="space-y-1">
              <span className="font-serif font-bold text-white block text-sm">Dynamic Category Tabs</span>
              <p className="text-[11px] text-stone-400 font-sans">
                Automatically creates and routes clips into dedicated category tabs (<code className="text-amber-400">Jobs</code>, <code className="text-amber-400">Scholarships</code>, <code className="text-amber-400">Articles</code>, <code className="text-amber-400">Events</code>).
              </p>
            </div>
          </label>

          <label className="p-4 rounded-sm border bg-[#050505] border-white/10 text-stone-400 hover:border-white/20 flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="routingMode"
              className="mt-0.5 w-4 h-4 text-amber-500 accent-amber-500"
            />
            <div className="space-y-1">
              <span className="font-serif font-bold text-white block text-sm">Single Consolidated Table</span>
              <p className="text-[11px] text-stone-400 font-sans">
                Stores all clips in a single master sheet/table regardless of content category.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Linked Resource Hubs (X/Twitter, Sheets, Lists) */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
          <Puzzle className="w-4 h-4 text-amber-500" />
          <span>Social Media & Linked Resource Hubs</span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          When clipping an X/Twitter post, LinkedIn share, or article containing an embedded Google Sheet or job list:
        </p>

        <div className="space-y-2 font-mono text-xs">
          <label className="flex items-center justify-between p-3.5 bg-[#050505] border border-white/10 rounded-sm cursor-pointer hover:border-amber-500/30 transition-all">
            <div className="space-y-0.5">
              <span className="font-serif text-white font-bold block text-sm">Auto-Extract Linked Sub-Rows (Parent-Child Items)</span>
              <p className="text-[11px] text-stone-400 font-sans">
                Extracts rows from linked Google Sheets into individual items referencing the parent tweet/post author and source URL.
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 rounded text-amber-500 accent-amber-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* AI Extraction Prompt Configuration */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-serif font-bold text-white">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Extraction Prompt Rules</span>
        </div>
        <p className="text-xs text-stone-400 font-sans">
          Customize instructions passed to Gemini when parsing scraped webpage content into structured fields.
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
