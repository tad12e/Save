import React, { useState } from 'react';
import { 
  Star, 
  GitFork, 
  Scale, 
  ExternalLink, 
  Copy, 
  Check, 
  Terminal 
} from 'lucide-react';
import { ClipItem } from '../../../types';
import { GitHubMeta, formatCompactCount } from '../../../types/clipPlatform';

interface GitHubCardSkinProps {
  clip: ClipItem;
  meta?: GitHubMeta;
  isDark: boolean;
  onOpenDetail: (clip: ClipItem) => void;
}

// ---------------------------------------------------------------------------
// GitHub Linguistic Color Table (Official GitHub linguistic colors)
// ---------------------------------------------------------------------------
const GITHUB_LANG_COLORS: Record<string, string> = {
  typescript: '#3178C6',
  javascript: '#F1E05A',
  python: '#3572A5',
  rust: '#DEA584',
  go: '#00ADD8',
  golang: '#00ADD8',
  'c++': '#F34B7D',
  cpp: '#F34B7D',
  c: '#555555',
  'c#': '#178600',
  csharp: '#178600',
  java: '#B07219',
  kotlin: '#A97BFF',
  swift: '#F05138',
  ruby: '#701516',
  php: '#4F5D95',
  dart: '#00B4AB',
  html: '#E34C26',
  css: '#563D7C',
  scss: '#C6538C',
  shell: '#89E051',
  bash: '#89E051',
  vue: '#41B883',
  svelte: '#FF3E00',
  zig: '#EC915C',
  elixir: '#6E4A7E',
  lua: '#000080',
  haskell: '#5E5086',
  scala: '#DC322F',
  clojure: '#DB5855',
  r: '#198CE7',
  julia: '#A270BA',
  solidity: '#AA6746',
  sql: '#E38C00',
  jupyter: '#DA5B0B',
};

function getLanguageColor(language?: string): string {
  if (!language) return '#8B949E';
  const key = language.trim().toLowerCase();
  return GITHUB_LANG_COLORS[key] || '#8B949E';
}

// Client-side fallback extraction for GitHub owner & repo from URL
function extractGitHubRepo(url?: string, clipTitle?: string): { owner?: string; repo?: string } {
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('github.com')) {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
        }
      }
    } catch {
      // ignore
    }
  }
  if (clipTitle && clipTitle.includes('/')) {
    const parts = clipTitle.split('/').map((p) => p.trim());
    if (parts.length >= 2 && !parts[0].includes(' ') && !parts[1].includes(' ')) {
      return { owner: parts[0], repo: parts[1] };
    }
  }
  return {};
}

// Authentic GitHub Octocat Logo SVG
const GitHubOctocatLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

// Authentic GitHub Repository Book Icon SVG
const GitHubRepoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.6-1.2-1.6 1.2a.25.25 0 0 1-.4-.2Z" />
  </svg>
);

/**
 * Native GitHub Repository Bookmark Card Skin (Part 8).
 * Replicates developer-focused GitHub repository cards:
 * - Subagent A: Owner/repo hierarchy, star counter, fork counter, license badge.
 * - Subagent B: Language indicator with authentic color dot, 2-line description, and topic pills.
 * - Zero iframes, zero external scripts, 60 FPS performance.
 */
export const GitHubCardSkin: React.FC<GitHubCardSkinProps> = ({
  clip,
  meta,
  isDark,
  onOpenDetail,
}) => {
  const [copiedClone, setCopiedClone] = useState(false);
  const fallback = extractGitHubRepo(clip.url, clip.title);

  const owner = meta?.owner || fallback.owner || clip.sourceAuthor || 'github';
  const repo = meta?.repo || fallback.repo || clip.title || 'repository';
  const stars = meta?.stars;
  const forks = meta?.forks;
  const language = meta?.language;
  const license = meta?.license;
  const topics = meta?.topics || [];
  const description = clip.summary || 'Open-source repository on GitHub.';

  const langColor = getLanguageColor(language);
  const repoUrl = clip.url && clip.url.includes('github.com')
    ? clip.url
    : `https://github.com/${owner}/${repo}`;

  const handleCopyClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cloneCmd = `git clone https://github.com/${owner}/${repo}.git`;
    navigator.clipboard.writeText(cloneCmd);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 font-sans select-text">
      {/* ─── Subagent A: Repository Header & Hierarchy ─── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Repo Icon */}
          <div className={`p-1.5 rounded-lg shrink-0 ${isDark ? 'bg-white/5 text-[#8B949E]' : 'bg-slate-100 text-slate-600'}`}>
            <GitHubRepoIcon className="w-4 h-4" />
          </div>

          {/* Owner / Repo Breadcrumb */}
          <div className="flex items-baseline gap-1 font-mono text-sm leading-tight truncate">
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://github.com/${owner}`, '_blank', 'noopener,noreferrer');
              }}
              className="text-[#8B949E] hover:underline cursor-pointer truncate max-w-[120px]"
              title={`View ${owner}'s profile`}
            >
              {owner}
            </span>
            <span className="text-[#6E7681]">/</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.open(repoUrl, '_blank', 'noopener,noreferrer');
              }}
              className={`font-semibold truncate hover:underline cursor-pointer ${
                isDark ? 'text-[#58A6FF] hover:text-[#79C0FF]' : 'text-[#0969DA] hover:text-[#0550AE]'
              }`}
              title={`View repository ${owner}/${repo}`}
            >
              {repo}
            </span>
          </div>

          {/* Visibility Pill */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 text-[#8B949E] border-[#30363D] dark:border-[#30363D] bg-transparent">
            Public
          </span>
        </div>

        {/* GitHub Octocat Brand Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(repoUrl, '_blank', 'noopener,noreferrer');
          }}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            isDark ? 'text-[#8B949E] hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Open repository on GitHub"
        >
          <GitHubOctocatLogo className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Subagent B: Repository Description ─── */}
      <p
        onClick={() => onOpenDetail(clip)}
        className={`text-xs leading-[19px] line-clamp-2 cursor-pointer font-sans ${
          isDark ? 'text-[#8B949E]' : 'text-slate-600'
        }`}
        title={description}
      >
        {description}
      </p>

      {/* ─── Subagent B: Topic Badges (Up to 3 topics) ─── */}
      {topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {topics.slice(0, 3).map((topic, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://github.com/topics/${topic}`, '_blank', 'noopener,noreferrer');
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#388BFD]/12 hover:bg-[#388BFD]/22 text-[#58A6FF] border border-[#388BFD]/25 transition-colors cursor-pointer"
              title={`Topic: ${topic}`}
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      {/* ─── Subagents A & B: Languages, Metrics & Clone Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 text-xs pt-1 border-t border-black/5 dark:border-white/5 select-none font-mono">
        {/* Left: Language & Metrics (Stars, Forks, License) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subagent B: Language Colored Dot */}
          {language && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: langColor }}
              />
              <span className={`text-[11px] font-medium ${isDark ? 'text-[#C9D1D9]' : 'text-slate-700'}`}>
                {language}
              </span>
            </div>
          )}

          {/* Subagent A: Stars Counter */}
          {stars !== undefined && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${repoUrl}/stargazers`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-amber-400 transition-colors text-[#8B949E]"
              title={`${stars.toLocaleString()} stars`}
            >
              <Star className="w-3.5 h-3.5 fill-[#E3B341] text-[#E3B341]" />
              <span className="text-[11px] font-semibold text-[#8B949E] hover:text-amber-400">
                {formatCompactCount(stars)}
              </span>
            </div>
          )}

          {/* Subagent A: Forks Counter */}
          {forks !== undefined && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                window.open(`${repoUrl}/network/members`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-sky-400 transition-colors text-[#8B949E]"
              title={`${forks.toLocaleString()} forks`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">
                {formatCompactCount(forks)}
              </span>
            </div>
          )}

          {/* Subagent A: License Badge */}
          {license && (
            <div
              className="flex items-center gap-1 text-[#8B949E]"
              title={`License: ${license}`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="text-[11px] truncate max-w-[90px]">
                {license}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Clone / Link Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyClone}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              copiedClone
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : isDark
                  ? 'bg-white/5 text-[#8B949E] hover:text-white border-white/10 hover:bg-white/10'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-200'
            }`}
            title="Copy 'git clone' command"
          >
            {copiedClone ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Terminal className="w-3 h-3" />
                <span>Clone</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.open(repoUrl, '_blank', 'noopener,noreferrer');
            }}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-[#8B949E] hover:text-[#58A6FF] hover:bg-white/5' : 'text-slate-400 hover:text-[#0969DA] hover:bg-slate-100'
            }`}
            title="Open in GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
