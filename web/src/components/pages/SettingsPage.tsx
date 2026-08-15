import React, { useState, useEffect } from 'react';
import { DestinationConfig } from '../../types';
import { getStoredPrivacyMode, saveStoredPrivacyMode } from '../../lib/storage';
import { 
  Settings, 
  Radio, 
  Sliders, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Save,
  HardDrive,
  Music,
  PlayCircle,
  Briefcase,
  BookOpen,
  FolderGit2,
  Calendar,
  GraduationCap,
  Utensils,
  Zap,
  CheckCircle2,
  ListMusic,
  HelpCircle
} from 'lucide-react';

interface SettingsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
}

export type ConfirmationMode = 'auto' | 'confirm' | 'always_ask';

export const SettingsPage: React.FC<SettingsPageProps> = ({ destinations, setDestinations }) => {
  const [defaultDestId, setDefaultDestId] = useState<string>(
    destinations.find(d => d.isDefault)?.id || destinations[0]?.id || ''
  );
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => getStoredPrivacyMode());
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(() => {
    return (localStorage.getItem('clipper_confirmation_mode') as ConfirmationMode) || 'confirm';
  });

  // Category Routing Rules State
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('clipper_category_rules');
      return stored ? JSON.parse(stored) : {
        article: '',
        job: '',
        tool: '',
        scholarship: '',
        event: '',
        recipe: ''
      };
    } catch {
      return { article: '', job: '', tool: '', scholarship: '', event: '', recipe: '' };
    }
  });

  // Music & Playlist Configuration State
  const [musicProvider, setMusicProvider] = useState<'spotify' | 'youtube_music'>(() => {
    return (localStorage.getItem('clipper_music_provider') as 'spotify' | 'youtube_music') || 'spotify';
  });
  const [musicPlaylist, setMusicPlaylist] = useState<string>(() => {
    return localStorage.getItem('clipper_music_playlist') || 'default';
  });
  const [musicAutoAdd, setMusicAutoAdd] = useState<boolean>(() => {
    return localStorage.getItem('clipper_music_auto_add') !== 'false';
  });

  const [aiExtractionPrompt, setAiExtractionPrompt] = useState(
    "Extract job title, company name, salary range, application deadline, and key responsibilities into JSON."
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCategoryRuleChange = (categoryKey: string, destId: string) => {
    setCategoryRules(prev => ({
      ...prev,
      [categoryKey]: destId
    }));
  };

  const handleSaveSettings = () => {
    saveStoredPrivacyMode(isPrivacyMode);
    localStorage.setItem('clipper_confirmation_mode', confirmationMode);
    localStorage.setItem('clipper_category_rules', JSON.stringify(categoryRules));
    localStorage.setItem('clipper_music_provider', musicProvider);
    localStorage.setItem('clipper_music_playlist', musicPlaylist);
    localStorage.setItem('clipper_music_auto_add', String(musicAutoAdd));

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
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-8 animate-fadeIn font-sans text-stone-200 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-sm bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-serif font-extrabold text-white">
            Clipper Settings & System Preferences
          </h1>
        </div>
        <p className="text-xs text-stone-400 mt-1 font-sans">
          Configure universal save targets, smart per-category destinations, dedicated music playlists, and confirmation modes.
        </p>
      </div>

      {/* 1. Confirmation Modes (Auto vs Confirm vs Always Ask) */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Clipper Save Confirmation Modes</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-white/5 text-stone-400 px-2 py-0.5 rounded-sm border border-white/10">
            SPEED & PROMPT BEHAVIOR
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          Control whether Clipper saves instantly with zero clicks or prompts you with target options when clipping from web pages and social feeds.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
          {/* Auto Mode */}
          <label className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            confirmationMode === 'auto'
              ? 'bg-amber-500/10 border-amber-500 text-amber-300'
              : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
                  ⚡ Auto Mode
                </span>
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={confirmationMode === 'auto'}
                  onChange={() => setConfirmationMode('auto')}
                  className="w-4 h-4 text-amber-500 accent-amber-500"
                />
              </div>
              <p className="text-[11px] text-stone-400 font-sans leading-normal">
                Saves immediately to destination with <strong>no prompt</strong>. Instant background sync with a brief confirmation toast.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">⚡ Fastest 1-Click</span>
          </label>

          {/* Confirm Mode */}
          <label className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            confirmationMode === 'confirm'
              ? 'bg-amber-500/10 border-amber-500 text-amber-300'
              : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
                  👆 Confirm Mode
                </span>
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={confirmationMode === 'confirm'}
                  onChange={() => setConfirmationMode('confirm')}
                  className="w-4 h-4 text-amber-500 accent-amber-500"
                />
              </div>
              <p className="text-[11px] text-stone-400 font-sans leading-normal">
                Displays the pre-selected destination bar before saving, requiring a <strong>single tap</strong> to confirm.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">★ Recommended</span>
          </label>

          {/* Always Ask Mode */}
          <label className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
            confirmationMode === 'always_ask'
              ? 'bg-amber-500/10 border-amber-500 text-amber-300'
              : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
          }`}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
                  📋 Always Ask
                </span>
                <input
                  type="radio"
                  name="confirmationMode"
                  checked={confirmationMode === 'always_ask'}
                  onChange={() => setConfirmationMode('always_ask')}
                  className="w-4 h-4 text-amber-500 accent-amber-500"
                />
              </div>
              <p className="text-[11px] text-stone-400 font-sans leading-normal">
                Always pops up the <strong>full destination & sub-tab picker</strong> on every single clip action.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/80">Full Control</span>
          </label>
        </div>
      </div>

      {/* 2. Universal Global Default Destination */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
            <Radio className="w-4 h-4 text-amber-500" />
            <span>Universal Global Default Destination</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-sm">
            UNIVERSAL FALLBACK
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          The overarching fallback destination for any web clip, blog post, article, or bookmark that does not have a specialized category rule.
        </p>

        <div className="space-y-2.5 font-mono text-xs">
          {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
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

      {/* 3. Smart Category Routing Defaults */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>Smart Per-Category Destination Routing</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-white/5 text-stone-400 px-2 py-0.5 rounded-sm border border-white/10">
            AUTO-DISPATCH
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          Route specific types of content to different tools automatically. If left on <em>"Universal Global Default"</em>, clips will save into your master fallback destination.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
          {/* Articles & Blogs */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Articles & Blog Posts</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Deep-dive articles, Substack essays, Medium posts, and tech write-ups.</p>
            <select
              value={categoryRules['article'] || ''}
              onChange={(e) => handleCategoryRuleChange('article', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`art_${d.id}`} value={d.id}>{d.name} ({d.targetResourceName || d.type})</option>
              ))}
            </select>
          </div>

          {/* Jobs & Opportunities */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span>Jobs & Career Opportunities</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Role openings, ATS links, Workday listings, and salary postings.</p>
            <select
              value={categoryRules['job'] || ''}
              onChange={(e) => handleCategoryRuleChange('job', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`job_${d.id}`} value={d.id}>{d.name} (Jobs Tab)</option>
              ))}
            </select>
          </div>

          {/* Tools & GitHub Repos */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <FolderGit2 className="w-4 h-4 text-amber-400" />
              <span>Tools & GitHub Repositories</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Open-source libraries, SaaS tools, awesome-lists, and developer frameworks.</p>
            <select
              value={categoryRules['tool'] || ''}
              onChange={(e) => handleCategoryRuleChange('tool', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`tool_${d.id}`} value={d.id}>{d.name} (Tools Tab)</option>
              ))}
            </select>
          </div>

          {/* Scholarships & Academics */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Scholarships & Education</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Grants, university fellowships, student hackathons, and certifications.</p>
            <select
              value={categoryRules['scholarship'] || ''}
              onChange={(e) => handleCategoryRuleChange('scholarship', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`sch_${d.id}`} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Events & Conferences */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Events & Conferences</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Meetups, tech summits, webinars, and registration links.</p>
            <select
              value={categoryRules['event'] || ''}
              onChange={(e) => handleCategoryRuleChange('event', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`evt_${d.id}`} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Recipes & Lifestyle */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-sm">
              <Utensils className="w-4 h-4 text-amber-400" />
              <span>Recipes & Food</span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">Cooking guides, ingredient lists, prep times, and meal ideas.</p>
            <select
              value={categoryRules['recipe'] || ''}
              onChange={(e) => handleCategoryRuleChange('recipe', e.target.value)}
              className="w-full mt-1.5 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-amber-500 font-mono"
            >
              <option value="">🌐 Universal Global Default ({destinations.find(d => d.id === defaultDestId)?.name || 'Save Vault'})</option>
              {destinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music').map(d => (
                <option key={`rec_${d.id}`} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Dedicated Music & Playlist Integration Section */}
      <div className="bg-[#080808] border border-emerald-500/30 rounded-sm p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-serif">
            <Music className="w-5 h-5 text-emerald-400" />
            <span>Dedicated Music & Streaming Destination</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
            ALWAYS DEDICATED MUSIC DESTINATION
          </span>
        </div>
        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          Music tracks, Spotify embeds, SoundCloud links, and YouTube Music songs are never mixed with documents or spreadsheets. They are automatically routed into your connected music service.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Music Provider Selection */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-3">
            <span className="font-serif font-bold text-white block text-sm flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-emerald-400" />
              Music Streaming Provider
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label className={`p-3 border rounded-sm cursor-pointer transition-all flex items-center gap-2 ${
                musicProvider === 'spotify'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-[#080808] border-white/10 text-stone-400 hover:border-white/20'
              }`}>
                <input
                  type="radio"
                  name="musicProvider"
                  checked={musicProvider === 'spotify'}
                  onChange={() => setMusicProvider('spotify')}
                  className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500"
                />
                <span>Spotify</span>
              </label>

              <label className={`p-3 border rounded-sm cursor-pointer transition-all flex items-center gap-2 ${
                musicProvider === 'youtube_music'
                  ? 'bg-red-500/10 border-red-500 text-red-300 font-bold'
                  : 'bg-[#080808] border-white/10 text-stone-400 hover:border-white/20'
              }`}>
                <input
                  type="radio"
                  name="musicProvider"
                  checked={musicProvider === 'youtube_music'}
                  onChange={() => setMusicProvider('youtube_music')}
                  className="w-3.5 h-3.5 text-red-500 accent-red-500"
                />
                <span>YouTube Music</span>
              </label>
            </div>
          </div>

          {/* Default Target Playlist */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-3">
            <span className="font-serif font-bold text-white block text-sm flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              Target Playlist
            </span>
            <select
              value={musicPlaylist}
              onChange={(e) => setMusicPlaylist(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-emerald-500 font-mono"
            >
              <option value="default">🎧 Clipper Tracks (Default Playlist)</option>
              <option value="liked">❤️ Liked Songs / Favorites</option>
              <option value="focus">💻 Coding & Deep Work Focus</option>
              <option value="chill">☕ Chill Vibes & Discovery</option>
              <option value="custom">➕ Create New Playlist on Save</option>
            </select>
          </div>
        </div>

        {/* Music Options Checklist */}
        <div className="p-3.5 bg-[#050505] border border-white/10 rounded-sm space-y-2 font-mono text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-white font-semibold flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                1-Tap Instant Save to Default Playlist
              </span>
              <p className="text-[11px] text-stone-400 font-sans">
                When saving a song, immediately adds it to <code className="text-emerald-300">{musicPlaylist === 'default' ? 'Clipper Tracks' : musicPlaylist}</code> without asking for playlist choice each time.
              </p>
            </div>
            <input
              type="checkbox"
              checked={musicAutoAdd}
              onChange={(e) => setMusicAutoAdd(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 5. Local Privacy Vault Mode */}
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

      {/* 6. AI Extraction Prompt Configuration */}
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

      {/* Save Button Bar */}
      <div className="sticky bottom-4 z-40 bg-[#0c0a09]/95 backdrop-blur-md border border-amber-500/30 p-4 rounded-sm shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {savedSuccess ? (
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Settings & Preferences Saved Successfully!
            </span>
          ) : (
            <span className="text-[11px] text-stone-400 font-mono">
              Changes will apply to Web App, Chrome Extension, and Mobile.
            </span>
          )}
        </div>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs rounded-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};

