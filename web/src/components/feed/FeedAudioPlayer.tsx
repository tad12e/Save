import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Headphones,
  Play,
  Pause,
  Clock,
  ExternalLink,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { FeedStreamItem } from '../../lib/feedApi';
import { WebsiteIcon } from '../BrandIcons';

interface FeedAudioPlayerProps {
  item: FeedStreamItem;
  isDark?: boolean;
}

export const FeedAudioPlayer: React.FC<FeedAudioPlayerProps> = ({
  item,
  isDark = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);

  const togglePlay = () => {
    setIsPlaying((p) => !p);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden group ${
        isDark
          ? 'bg-[#0A0A0A] border-[#262626] hover:border-[#3A3A3A]'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark
                ? 'bg-[#181220] border-purple-900/50'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <WebsiteIcon
              domain={item.domain}
              url={item.url}
              name={item.source_platform || 'spotify'}
              className="w-5 h-5"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-[#1C1428] text-purple-400 border-purple-800/40'
                    : 'bg-purple-50 text-purple-800 border-purple-200'
                }`}
              >
                Audio Clip • {item.content_type.toUpperCase()}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                <WebsiteIcon domain={item.domain} url={item.url} name={item.title} className="w-3.5 h-3.5" />
                {item.domain}
              </span>
            </div>

            <h4
              className={`text-base sm:text-lg font-bold font-['Outfit',sans-serif] tracking-tight transition-colors ${
                isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-900 group-hover:text-[#2D6A4F]'
              }`}
            >
              {item.title}
            </h4>
          </div>
        </div>

        <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
          {item.time_ago}
        </span>
      </div>

      <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-[#B4B4B4]' : 'text-slate-600'}`}>
        {item.summary}
      </p>

      {/* Mini Audio Visualizer Player Bar */}
      <div
        className={`p-3.5 rounded-xl border mb-4 flex flex-col gap-2.5 ${
          isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-xs ${
                isPlaying
                  ? isDark
                    ? 'bg-[#3FE769] text-black'
                    : 'bg-[#2D6A4F] text-white'
                  : isDark
                  ? 'bg-white text-black'
                  : 'bg-slate-900 text-white'
              }`}
              title={isPlaying ? 'Pause' : 'Play Audio'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div>
              <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isPlaying ? 'Playing Audio Stream' : 'Listen to Audio'}
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                1:18 / 4:32
              </span>
            </div>
          </div>

          {/* Animated Waveform Equalizer */}
          <div className="flex items-center gap-1 h-5">
            {[40, 75, 100, 60, 90, 45, 80, 55, 95, 30].map((h, idx) => (
              <motion.div
                key={idx}
                animate={isPlaying ? { height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] } : { height: '30%' }}
                transition={{ duration: 0.8, repeat: Infinity, delay: idx * 0.08 }}
                className={`w-1 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'}`}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = ((e.clientX - rect.left) / rect.width) * 100;
            setProgress(Math.max(0, Math.min(100, pos)));
          }}
          className={`w-full h-1.5 rounded-full overflow-hidden cursor-pointer ${
            isDark ? 'bg-[#262626]' : 'bg-slate-200'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1E1E1E]">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold transition-colors ${
            isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900'
          }`}
        >
          <span>Open Audio Source</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <span className="text-xs font-mono text-slate-500 dark:text-[#777777]">
          Synced: {item.destination_name}
        </span>
      </div>
    </motion.div>
  );
};
