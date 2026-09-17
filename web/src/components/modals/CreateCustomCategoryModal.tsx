import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Sparkles,
  Tag,
  Target,
  Rocket,
  Flame,
  Code2,
  Heart,
  Gift,
  Coffee,
  BookOpen,
  Layers,
  Zap,
  Star,
  Check
} from 'lucide-react';
import { CustomCategoryConfig, GroupByDimension } from '../../types';

interface CreateCustomCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newCat: CustomCategoryConfig) => void;
  defaultDimension?: GroupByDimension;
  theme?: 'terminal' | 'dark' | 'light';
}

const COLOR_OPTIONS = [
  { hex: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)', name: 'Indigo' },
  { hex: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', name: 'Emerald' },
  { hex: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', name: 'Violet' },
  { hex: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)', name: 'Pink' },
  { hex: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', name: 'Amber' },
  { hex: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', name: 'Cyan' },
  { hex: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', name: 'Rose' },
  { hex: '#14B8A6', bg: 'rgba(20, 184, 166, 0.15)', name: 'Teal' },
  { hex: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', name: 'Orange' },
  { hex: '#64748B', bg: 'rgba(100, 116, 139, 0.15)', name: 'Slate' },
];

const ICON_OPTIONS = [
  { name: 'Target', icon: Target },
  { name: 'Rocket', icon: Rocket },
  { name: 'Flame', icon: Flame },
  { name: 'Code2', icon: Code2 },
  { name: 'Heart', icon: Heart },
  { name: 'Gift', icon: Gift },
  { name: 'Coffee', icon: Coffee },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Tag', icon: Tag },
];

export const CreateCustomCategoryModal: React.FC<CreateCustomCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultDimension = 'intent',
  theme = 'terminal',
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [dimension, setDimension] = useState<GroupByDimension>(defaultDimension);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [selectedIconName, setSelectedIconName] = useState('Rocket');
  const [keywords, setKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a name for the category.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cat';
    const splitKeywords = keywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const newCategory: CustomCategoryConfig = {
      id: `custom_${Date.now()}`,
      dimension,
      name: trimmed,
      slug,
      color: selectedColor.hex,
      bgColor: selectedColor.bg,
      iconName: selectedIconName,
      description: description.trim(),
      keywords: splitKeywords,
      createdAt: new Date().toISOString(),
    };

    onCreated(newCategory);
    setIsSubmitting(false);
    onClose();
  };

  const getDimensionTitle = () => {
    switch (dimension) {
      case 'intent': return 'Intent (Action Verb)';
      case 'source': return 'Source Platform';
      case 'type': return 'Content Type';
      default: return 'Custom Category';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
            isDark ? 'bg-[#0D0D0D] border-[#262626] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-[#1F1F1F] bg-[#121212]' : 'border-slate-100 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: selectedColor.bg, color: selectedColor.hex }}
              >
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Add Custom {dimension === 'intent' ? 'Intent' : dimension === 'type' ? 'Content Type' : 'Category'}
                </h2>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                  Create your own category in {getDimensionTitle()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            {/* Target Dimension Selector */}
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${
                isDark ? 'text-stone-400' : 'text-slate-500'
              }`}>
                Dimension
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['intent', 'type', 'source'] as GroupByDimension[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDimension(d)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      dimension === d
                        ? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-sm'
                        : isDark
                        ? 'border-[#222222] bg-[#141414] text-stone-300 hover:border-[#333333]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d === 'intent' ? '🎯 Intent' : d === 'type' ? '📑 Content Type' : '🌐 Source'}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-stone-400' : 'text-slate-500'
              }`}>
                Name {dimension === 'intent' ? '(e.g. Build, Cook, Gift, Review)' : '(e.g. Podcast, Recipe)'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={dimension === 'intent' ? 'e.g. Build' : 'e.g. Podcast'}
                maxLength={40}
                required
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
                  isDark ? 'bg-[#151515] border-[#2B2B2B] text-white placeholder-stone-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Color Palette */}
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${
                isDark ? 'text-stone-400' : 'text-slate-500'
              }`}>
                Color Accent
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => {
                  const isSelected = selectedColor.hex === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={c.name}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        isSelected ? 'scale-110 ring-2 ring-white shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Selection */}
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-2 ${
                isDark ? 'text-stone-400' : 'text-slate-500'
              }`}>
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map(opt => {
                  const IconCmp = opt.icon;
                  const isSelected = selectedIconName === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedIconName(opt.name)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400 ring-1 ring-blue-500'
                          : isDark
                          ? 'border-[#222222] bg-[#141414] text-stone-400 hover:text-white hover:border-[#333333]'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <IconCmp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Description / Keywords */}
            <div>
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${
                isDark ? 'text-stone-400' : 'text-slate-500'
              }`}>
                Auto-classification Keywords (optional, comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. build, prototype, ship, deploy"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
                  isDark ? 'bg-[#151515] border-[#2B2B2B] text-white placeholder-stone-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <p className={`text-[11px] mt-1 ${isDark ? 'text-stone-500' : 'text-slate-400'}`}>
                Clips containing these keywords will automatically map to this {dimension === 'intent' ? 'intent' : 'category'}.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
            }`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-medium rounded-xl border transition-colors ${
                  isDark ? 'border-[#282828] text-stone-300 hover:bg-[#1C1C1C]' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Creating...' : `Add ${dimension === 'intent' ? 'Intent' : 'Category'}`}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
