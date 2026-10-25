import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Cpu, 
  FolderGit2, 
  GraduationCap, 
  Briefcase, 
  Code2, 
  Layers, 
  Lightbulb, 
  Compass, 
  Search, 
  Rocket, 
  Star, 
  Terminal, 
  Bookmark,
  Check,
  Shield,
  Cloud,
  HardDrive
} from 'lucide-react';
import { CustomPageConfig, ClipType } from '../../types';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage: (page: CustomPageConfig) => void;
  parentPage?: CustomPageConfig | null;
  customPages?: CustomPageConfig[];
}

const AVAILABLE_ICONS = [
  { name: 'BookOpen', label: 'Books & Reading', Icon: BookOpen },
  { name: 'Cpu', label: 'AI & Research', Icon: Cpu },
  { name: 'FolderGit2', label: 'Projects & Code', Icon: FolderGit2 },
  { name: 'Code2', label: 'Programming', Icon: Code2 },
  { name: 'GraduationCap', label: 'Education', Icon: GraduationCap },
  { name: 'Briefcase', label: 'Jobs & Careers', Icon: Briefcase },
  { name: 'Lightbulb', label: 'Ideas & Brainstorm', Icon: Lightbulb },
  { name: 'Layers', label: 'Architecture', Icon: Layers },
  { name: 'Compass', label: 'Explore & Deals', Icon: Compass },
  { name: 'Search', label: 'Market Research', Icon: Search },
  { name: 'Rocket', label: 'Startups & Launch', Icon: Rocket },
  { name: 'Terminal', label: 'CLI & Scripts', Icon: Terminal },
];

const ACCENT_COLORS = [
  { hex: '#3FE769', label: 'Emerald', bg: 'rgba(63, 231, 105, 0.15)' },
  { hex: '#38BDF8', label: 'Sky', bg: 'rgba(56, 189, 248, 0.15)' },
  { hex: '#A855F7', label: 'Violet', bg: 'rgba(168, 85, 247, 0.15)' },
  { hex: '#F59E0B', label: 'Amber', bg: 'rgba(245, 158, 11, 0.15)' },
  { hex: '#EC4899', label: 'Rose', bg: 'rgba(236, 72, 153, 0.15)' },
  { hex: '#14B8A6', label: 'Teal', bg: 'rgba(20, 184, 166, 0.15)' },
];

const PRESET_GOALS = [
  "Summarize key takeaways, main thesis, and actionable points.",
  "Extract code snippets, setup instructions, and architecture patterns.",
  "Identify pricing, feature comparisons, and lifetime value metrics.",
  "Extract grant deadlines, eligibility, and submission requirements.",
  "Catalog research methodology, benchmarks, and citation links."
];

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  onCreatePage,
  parentPage = null,
  customPages = [],
}) => {
  const [name, setName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState('Cpu');
  const [selectedColor, setSelectedColor] = useState('#3FE769');
  const [description, setDescription] = useState('');
  const [aiGoalPrompt, setAiGoalPrompt] = useState(PRESET_GOALS[0]);

  // Sync selectedParentId and smart defaults whenever modal opens or parentPage changes
  React.useEffect(() => {
    if (isOpen) {
      if (parentPage) {
        setSelectedParentId(parentPage.id);
        setSelectedColor(parentPage.color || '#3FE769');
        const isParentBooks = parentPage.slug === 'books' || parentPage.name.toLowerCase().includes('book');
        if (isParentBooks) {
          setSelectedIcon('BookOpen');
          setAiGoalPrompt("Extract key mental models, biography milestones, thesis arguments, and memorable quotes by this author.");
        }
      } else {
        setSelectedParentId('');
      }
    }
  }, [isOpen, parentPage]);

  if (!isOpen) return null;

  const isAuthorMode = Boolean(
    parentPage && (parentPage.slug === 'books' || parentPage.name.toLowerCase().includes('book'))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const chosenColor = ACCENT_COLORS.find(c => c.hex === selectedColor) || ACCENT_COLORS[0];
    const newPage: CustomPageConfig = {
      id: `page_${Date.now()}`,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      iconName: selectedIcon,
      color: selectedColor,
      bgColor: chosenColor.bg,
      description: description.trim() || (isAuthorMode ? `Dedicated shelf for ${name.trim()} books and essays.` : `Custom workspace for ${name.trim()}.`),
      contentTypes: isAuthorMode ? ['book', 'article', 'general'] : ['general', 'article', 'research'],
      aiGoalPrompt: aiGoalPrompt.trim() || PRESET_GOALS[0],
      createdAt: new Date().toISOString(),
      isSystemDefault: false,
      parentId: selectedParentId || null,
    };

    onCreatePage(newPage);
    setName('');
    setDescription('');
    setSelectedParentId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden text-[#EDEDED] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1C1C] bg-[#0E0E0E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-[#3FE769] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#3FE769]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-base font-semibold text-white tracking-tight">
                  {parentPage 
                    ? (isAuthorMode ? `Add Author Shelf to "${parentPage.name}"` : `Add Sub-Page to "${parentPage.name}"`)
                    : 'Create Custom Analysis Page'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#181818] text-[#3FE769] border border-[#2A2A2A] font-bold uppercase tracking-wider">
                  {parentPage ? (isAuthorMode ? 'Author Shelf' : 'Sub-Space') : 'Custom Space'}
                </span>
              </div>
              <p className="text-xs font-sans text-[#878787] mt-0.5">
                {parentPage 
                  ? `Create a focused shelf inside ${parentPage.name} with dedicated AI analysis rules.`
                  : 'Organize saved clips into custom spaces with tailored AI analysis.'}
              </p>
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

        {/* Form Body with custom-scrollbar */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans overflow-y-auto custom-scrollbar flex-1">
          
          {/* Page Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              {isAuthorMode ? 'Author / Shelf Name' : 'Page Name'} <span className="text-[#3FE769]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAuthorMode ? "e.g. Walter Isaacson, Paul Graham, Nassim Taleb..." : "e.g. AI Research Papers, Books, SaaS Tools..."}
              className="w-full bg-[#121212] border border-[#222222] rounded-xl p-3 text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
            />
          </div>

          {/* Nest Inside Parent Workspace */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
                Nest Inside Parent Page (Sub-Page)
              </label>
              {selectedParentId && (
                <span className="text-[10px] text-[#3FE769] font-mono px-2 py-0.5 rounded-full bg-[#181818] border border-[#2A2A2A] font-bold">
                  Sub-Page Mode
                </span>
              )}
            </div>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full bg-[#121212] border border-[#222222] rounded-xl p-3 text-white focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans cursor-pointer transition-colors"
            >
              <option value="">None (Top-Level Page)</option>
              {customPages
                .filter(p => !['page_job', 'job', 'page_education', 'page_projects'].includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#121212] text-white">
                    {p.parentId ? '↳ ' : '📁 '} {p.name}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-[#737373]">
              Select an existing page to nest this as a sub-page, or leave as "None" for a top-level page.
            </p>
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Choose Page Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.Icon;
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#3FE769] bg-[#3FE769]/10 text-[#3FE769] font-semibold shadow-[0_0_12px_rgba(63,231,105,0.2)]'
                        : 'border-[#222222] bg-[#121212] text-[#878787] hover:text-white hover:border-[#333333]'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[10px] font-sans truncate max-w-full">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-2">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Page Theme Color Accent
            </label>
            <div className="flex items-center gap-3">
              {ACCENT_COLORS.map((col) => {
                const isSelected = selectedColor === col.hex;
                return (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    style={{ backgroundColor: col.hex }}
                    aria-label={col.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A] scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black font-bold stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1]">
              Page Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this custom page tracks..."
              className="w-full bg-[#121212] border border-[#222222] rounded-xl p-3 text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans transition-colors"
            />
          </div>

          {/* AI Goal Prompt / Purpose */}
          <div className="space-y-2 pt-2 border-t border-[#1C1C1C]">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#A1A1A1] flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#3FE769] font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> AI Analysis Purpose
              </span>
              <span className="text-[10px] text-[#666]">Custom Prompt Rules</span>
            </label>
            
            <textarea
              rows={2}
              value={aiGoalPrompt}
              onChange={(e) => setAiGoalPrompt(e.target.value)}
              placeholder="What should the AI analyze for clips added to this page?"
              className="w-full bg-[#121212] border border-[#222222] rounded-xl p-3 text-white placeholder-[#555] focus:outline-none focus:border-[#3FE769] focus:ring-1 focus:ring-[#3FE769]/30 font-sans text-xs leading-relaxed transition-colors"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_GOALS.slice(0, 3).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiGoalPrompt(preset)}
                  className="text-[10px] font-sans px-2.5 py-1 rounded-lg bg-[#181818] text-[#878787] hover:text-[#3FE769] hover:bg-[#222222] transition-colors border border-[#262626] cursor-pointer"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#262626] text-[#878787] hover:text-white hover:bg-[#1A1A1A] text-xs font-sans transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#3FE769] hover:bg-[#34c759] text-black font-sans font-semibold text-xs tracking-wide uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(63,231,105,0.2)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Page</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
