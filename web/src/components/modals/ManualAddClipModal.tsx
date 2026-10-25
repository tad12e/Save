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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-[#0A0A0A] border border-[#262626] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1C1C1C] flex items-center justify-between bg-[#0E0E0E]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#3FE769] border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-sans text-white text-base font-semibold tracking-tight">
                Manual Clip Entry
              </h3>
              <p className="text-xs text-[#878787]">Manually save an item directly into your personal vault or custom page.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#878787] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-[#0A0A0A] overflow-y-auto custom-scrollbar flex-1">
          
          {/* STORAGE CHOICE SELECTOR */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#3FE769]" /> Storage Mode Choice
            </label>
            <div className="grid grid-cols-2 gap-2.5 font-sans text-xs">
              <button
                type="button"
                onClick={() => setStorageMode('cloud')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                  storageMode === 'cloud'
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-300 font-semibold shadow-sm'
                    : 'border-[#222222] bg-[#121212] text-[#878787] hover:border-[#333333]'
                }`}
              >
                <span className="flex items-center gap-1.5 uppercase text-[11px] font-semibold text-white">
                  <Cloud className="w-3.5 h-3.5 text-blue-400" /> Cloud Storage
                </span>
                <span className="text-[10px] text-[#878787]">Synced across all devices.</span>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode('local')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                  storageMode === 'local'
                    ? 'border-[#3FE769]/50 bg-[#3FE769]/15 text-[#3FE769] font-semibold shadow-[0_0_12px_rgba(63,231,105,0.15)]'
                    : 'border-[#222222] bg-[#121212] text-[#878787] hover:border-[#333333]'
                }`}
              >
                <span className="flex items-center gap-1.5 uppercase text-[11px] font-semibold text-white">
                  <HardDrive className="w-3.5 h-3.5 text-[#3FE769]" /> Local Device
                </span>
                <span className="text-[10px] text-[#878787]">Private & available offline.</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Title / Headline <span className="text-[#3FE769]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Staff Engineer @ Vercel"
              className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Source URL <span className="text-[#3FE769]">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://x.com/post/12345"
              className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Category Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ClipType)}
                className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs cursor-pointer transition-colors"
              >
                <option value="job" className="bg-[#121212]">Job Opening</option>
                <option value="education" className="bg-[#121212]">Education / Academic</option>
                <option value="research" className="bg-[#121212]">Research Paper</option>
                <option value="book" className="bg-[#121212]">Book / Reading Note</option>
                <option value="project" className="bg-[#121212]">Project / Repository</option>
                <option value="programming" className="bg-[#121212]">Code Snippet</option>
                <option value="course" className="bg-[#121212]">Course / Masterclass</option>
                <option value="event" className="bg-[#121212]">Event / Hackathon</option>
                <option value="scholarship" className="bg-[#121212]">Scholarship / Grant</option>
                <option value="general" className="bg-[#121212]">General Bookmark</option>
              </select>
            </div>

            {/* Custom Page Assignment */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Assign Custom Page
              </label>
              <select
                value={selectedPageId}
                onChange={e => setSelectedPageId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs cursor-pointer transition-colors"
              >
                <option value="" className="bg-[#121212]">General Vault</option>
                {customPages.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#121212]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Company / Author / Host
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Stripe / Martin Kleppmann"
              className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Excerpt / Raw Content
            </label>
            <textarea
              value={selectedText}
              onChange={e => setSelectedText(e.target.value)}
              placeholder="Paste selected post description or key requirements..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={e => setTagsText(e.target.value)}
              placeholder="Remote, React, $150k"
              className="w-full px-3.5 py-2.5 bg-[#121212] text-white rounded-xl border border-[#222222] focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 outline-none font-sans text-xs transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#141414] text-[#878787] hover:text-white border border-[#262626] rounded-xl font-sans text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(63,231,105,0.2)] flex items-center gap-2 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save Clip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
