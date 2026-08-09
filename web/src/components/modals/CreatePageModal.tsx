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
  { hex: '#F59E0B', label: 'Amber', bg: 'rgba(245, 158, 11, 0.15)' },
  { hex: '#10B981', label: 'Emerald', bg: 'rgba(16, 185, 129, 0.15)' },
  { hex: '#8B5CF6', label: 'Violet', bg: 'rgba(139, 92, 246, 0.15)' },
  { hex: '#3B82F6', label: 'Blue', bg: 'rgba(59, 130, 246, 0.15)' },
  { hex: '#EC4899', label: 'Rose', bg: 'rgba(236, 72, 153, 0.15)' },
  { hex: '#06B6D4', label: 'Cyan', bg: 'rgba(6, 182, 212, 0.15)' },
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
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Cpu');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const [description, setDescription] = useState('');
  const [aiGoalPrompt, setAiGoalPrompt] = useState(PRESET_GOALS[0]);

  if (!isOpen) return null;

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
      description: description.trim() || `Custom analysis workspace for ${name.trim()}.`,
      contentTypes: ['general', 'article', 'research'],
      aiGoalPrompt: aiGoalPrompt.trim() || PRESET_GOALS[0],
      createdAt: new Date().toISOString(),
      isSystemDefault: false
    };

    onCreatePage(newPage);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#080808] border border-amber-500/30 rounded-sm shadow-2xl overflow-hidden text-stone-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0c0c0c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-white font-medium">Create Custom Analysis Page</h2>
              <p className="text-xs font-sans text-stone-400">Organize saved clips into custom spaces with tailored AI analysis.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-sm text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans max-h-[80vh] overflow-y-auto">
          
          {/* Page Name */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-300">
              Page Name <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Research Papers, Books, SaaS Tools, Code Snippets..."
              className="w-full bg-[#030303] border border-white/10 rounded-sm p-3 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500/60 font-sans"
            />
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-300">
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
                    className={`p-3 rounded-sm border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-md'
                        : 'border-white/5 bg-[#030303] text-stone-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[9px] font-mono truncate max-w-full">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-2">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-300">
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black font-bold" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-300">
              Page Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this custom page tracks..."
              className="w-full bg-[#030303] border border-white/10 rounded-sm p-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* AI Goal Prompt / Purpose */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-violet-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> AI Analysis Purpose
              </span>
              <span className="text-[9px] text-stone-500">Custom Prompt Rules</span>
            </label>
            
            <textarea
              rows={2}
              value={aiGoalPrompt}
              onChange={(e) => setAiGoalPrompt(e.target.value)}
              placeholder="What should the AI analyze for clips added to this page?"
              className="w-full bg-[#030303] border border-white/10 rounded-sm p-3 text-stone-200 focus:outline-none focus:border-violet-500/60 font-sans text-xs leading-relaxed"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_GOALS.slice(0, 3).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAiGoalPrompt(preset)}
                  className="text-[9px] font-mono px-2 py-1 rounded bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm border border-white/10 text-stone-400 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Page</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
