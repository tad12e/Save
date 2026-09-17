import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { FeedPayload } from '../../lib/feedApi';
import { BrandIcon } from '../BrandIcons';

interface FeedSynthesisBannerProps {
  synthesis: FeedPayload['ai_synthesis'];
  onOpenDigest: () => void;
  isDark?: boolean;
}

export const FeedSynthesisBanner: React.FC<FeedSynthesisBannerProps> = ({
  synthesis,
  onOpenDigest,
  isDark = true,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsReady(true);
    }, 1000);
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden transition-all shadow-sm ${
        isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Radial ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#3FE769]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className={`w-5 h-5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
          <span
            className={`text-xs font-mono font-bold tracking-wider uppercase ${
              isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
            }`}
          >
            Connect the Dots • AI Cross-Clip Synthesis
          </span>
        </div>
        <span
          className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
            isDark
              ? 'text-[#888888] bg-[#141414] border-[#222222]'
              : 'text-slate-600 bg-slate-100 border-slate-200 font-medium'
          }`}
        >
          {synthesis.item_count} items analyzed
        </span>
      </div>

      {/* Headline & Abstract */}
      <div className="relative z-10">
        <h3
          className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {synthesis.title}
        </h3>
        <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-[#A1A1A1]' : 'text-slate-600'}`}>
          {synthesis.abstract}
        </p>
      </div>

      {/* 3 Numbered Synthesis Takeaways */}
      <div className="space-y-2.5 mb-6 relative z-10">
        {synthesis.takeaways.map((point, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3.5 p-3.5 rounded-xl border transition-colors ${
              isDark ? 'bg-[#121212]/90 border-[#222222] hover:border-[#333333]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={`font-mono font-bold text-xs shrink-0 pt-0.5 ${
                isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
              }`}
            >
              0{idx + 1}
            </span>
            <p
              className={`text-xs sm:text-sm leading-snug ${
                isDark ? 'text-[#E5E5E5]' : 'text-slate-800 font-medium'
              }`}
            >
              {point}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Metadata & Deep Digest Trigger */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t relative z-10 ${
          isDark ? 'border-[#222222]' : 'border-slate-200'
        }`}
      >
        <div
          className={`flex items-center space-x-2 text-xs font-mono ${
            isDark ? 'text-[#888888]' : 'text-slate-500'
          }`}
        >
          <span>Synthesized from cross-domain research embeddings</span>
          <span>•</span>
          <span
            className={`px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
              isDark
                ? 'bg-[#181818] border-[#282828] text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 font-medium'
            }`}
          >
            <BrandIcon name={synthesis.model_name || 'claude'} className="w-3.5 h-3.5" />
            <span>Model: {synthesis.model_name || 'Claude 3.5 Sonnet'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isReady ? (
            <button
              onClick={onOpenDigest}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3FE769] text-black hover:bg-[#34c759] transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Digest Ready • Open Full Digest</span>
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center space-x-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#111111] border-[#333333] hover:border-[#3FE769] text-white hover:bg-[#1A1A1A]'
                  : 'bg-[#2D6A4F] border-transparent text-white hover:bg-[#23533e] shadow-sm'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''} ${
                  isDark ? 'text-[#3FE769]' : 'text-white'
                }`}
              />
              <span>{isGenerating ? 'Synthesizing Deep Digest...' : 'Generate Deep Digest'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
