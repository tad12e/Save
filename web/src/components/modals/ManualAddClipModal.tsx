import React, { useState } from 'react';
import { ClipType, DestinationConfig, ClipItem, StorageMode, CustomPageConfig } from '../../types';
import { Bookmark, X, Plus, Sparkles, Send, Cloud, HardDrive, Shield } from 'lucide-react';

interface ManualAddClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: DestinationConfig[];
  customPages?: CustomPageConfig[];
  initialPageId?: string;
  onAddClip: (newClip: ClipItem) => void;
}

export const ManualAddClipModal: React.FC<ManualAddClipModalProps> = ({
  isOpen,
  onClose,
  destinations,
  customPages = [],
  initialPageId,
  onAddClip,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [type, setType] = useState<ClipType>('job');
  const [selectedPageId, setSelectedPageId] = useState<string>(initialPageId || '');
  const [storageMode, setStorageMode] = useState<StorageMode>('cloud');
  const [tagsText, setTagsText] = useState('Remote, React, HighPay');
  const [company, setCompany] = useState('');
  const [salary, setSalary] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);

    let domain = 'web.com';
    try {
      domain = new URL(url).hostname;
    } catch (err) {}

    const createdClip: ClipItem = {
      id: `clip_${Date.now()}`,
      title,
      url,
      selectedText,
      summary: selectedText ? `AI Summary: ${selectedText.slice(0, 100)}...` : `Clipped webpage item saved from ${url}`,
      type,
      tags: tags.length ? tags : ['Saved'],
      createdAt: new Date().toISOString(),
      sourceApp: 'Web App',
      syncedTo: destinations.filter(d => d.connected).map(d => d.type),
      storageMode,
      pageId: selectedPageId || undefined,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      extractedData: {
        company: company || undefined,
        salary: salary || undefined
      }
    };

    onAddClip(createdClip);
    onClose();

    // Reset form
    setTitle('');
    setUrl('');
    setSelectedText('');
    setCompany('');
    setSalary('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#080808] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bookmark className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-white text-lg font-medium">
              Manual Clip Entry
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-[#080808] overflow-y-auto">
          
          {/* STORAGE CHOICE SELECTOR */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-semibold">
              <Shield className="w-3.5 h-3.5" /> Storage Mode Choice
            </label>
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setStorageMode('cloud')}
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-all ${
                  storageMode === 'cloud'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300 font-bold'
                    : 'border-white/5 bg-[#030303] text-stone-400 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-1 uppercase text-[11px]">
                  <Cloud className="w-3.5 h-3.5 text-blue-400" /> ☁ Cloud Storage
                </span>
                <span className="text-[9px] text-stone-400 font-sans">Synced across all devices.</span>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode('local')}
                className={`p-2.5 rounded border text-left flex flex-col gap-0.5 transition-all ${
                  storageMode === 'local'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-white/5 bg-[#030303] text-stone-400 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-1 uppercase text-[11px]">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> 💻 Local Device
                </span>
                <span className="text-[9px] text-stone-400 font-sans">Private & available offline.</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Title / Headline *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Staff Engineer @ Vercel"
              className="w-full px-3.5 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-serif text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Source URL *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://x.com/post/12345"
              className="w-full px-3.5 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Category Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ClipType)}
                className="w-full px-3 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-mono text-xs"
              >
                <option value="job">Job Opening</option>
                <option value="education">Education / Academic</option>
                <option value="research">Research Paper</option>
                <option value="book">Book / Reading Note</option>
                <option value="project">Project / Repository</option>
                <option value="programming">Code Snippet</option>
                <option value="course">Course / Masterclass</option>
                <option value="event">Event / Hackathon</option>
                <option value="scholarship">Scholarship / Grant</option>
                <option value="general">General Bookmark</option>
              </select>
            </div>

            {/* Custom Page Assignment */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Assign Custom Page
              </label>
              <select
                value={selectedPageId}
                onChange={e => setSelectedPageId(e.target.value)}
                className="w-full px-3 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-mono text-xs"
              >
                <option value="">General Vault</option>
                {customPages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Company / Author / Host
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Stripe / Martin Kleppmann"
              className="w-full px-3 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Excerpt / Raw Content
            </label>
            <textarea
              value={selectedText}
              onChange={e => setSelectedText(e.target.value)}
              placeholder="Paste selected post description or key requirements..."
              rows={3}
              className="w-full px-3 py-2 bg-[#050505] text-stone-300 rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              placeholder="Remote, React, $150k"
              className="w-full px-3.5 py-2 bg-[#050505] text-stone-300 rounded-sm border border-white/10 focus:border-amber-500/50 outline-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#050505] text-stone-400 border border-white/10 rounded-sm font-mono text-xs uppercase tracking-wider hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-bold rounded-sm shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Save Clip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
