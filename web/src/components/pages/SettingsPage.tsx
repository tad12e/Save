import React, { useState, useEffect } from 'react';
import { DestinationConfig } from '../../types';
import { getStoredPrivacyMode, saveStoredPrivacyMode } from '../../lib/storage';
import { 
  fetchSpotifyPlaylists, 
  createSpotifyPlaylist, 
  searchSpotifyTracks, 
  addTrackToSpotifyPlaylist, 
  authorizeDestinationBackend, 
  setMusicProviderBackend,
  fetchCategoryRoutingRules,
  saveCategoryRoutingRules,
  SpotifyPlaylist, 
  SpotifyTrack 
} from '../../lib/api';
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
  HelpCircle,
  Plus,
  Search,
  ExternalLink,
  Key,
  RefreshCw,
  Music2,
  Loader2,
  AlertTriangle,
  X
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

  // Spotify Live State & Playlists
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Spotify Test Search Widget State
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songSearchResults, setSongSearchResults] = useState<SpotifyTrack[]>([]);
  const [searchingSong, setSearchingSong] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [trackActionFeedback, setTrackActionFeedback] = useState<string | null>(null);

  // Spotify API Key Config Toggle
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [spotifyClientIdInput, setSpotifyClientIdInput] = useState(() => localStorage.getItem('clipper_spotify_client_id') || '');
  const [spotifyClientSecretInput, setSpotifyClientSecretInput] = useState(() => localStorage.getItem('clipper_spotify_client_secret') || '');

  // Load playlists on mount or when provider is spotify
  const loadPlaylists = async () => {
    setLoadingPlaylists(true);
    const lists = await fetchSpotifyPlaylists();
    setSpotifyPlaylists(lists);
    setLoadingPlaylists(false);
  };

  useEffect(() => {
    if (musicProvider === 'spotify') {
      loadPlaylists();
    }
  }, [musicProvider]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    const created = await createSpotifyPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setCreatingPlaylist(false);
    if (created) {
      setSpotifyPlaylists(prev => [created, ...prev]);
      setMusicPlaylist(created.id);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateModal(false);
      setTrackActionFeedback(`Created playlist "${created.name}" on Spotify!`);
      setTimeout(() => setTrackActionFeedback(null), 4000);
    }
  };

  const handleSearchSong = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!songSearchQuery.trim()) return;
    setSearchingSong(true);
    const results = await searchSpotifyTracks(songSearchQuery.trim());
    setSongSearchResults(results);
    setSearchingSong(false);
  };

  const handleQuickAddSong = async (track: SpotifyTrack) => {
    setAddingTrackId(track.id);
    const target = musicPlaylist || 'default';
    const res = await addTrackToSpotifyPlaylist({
      playlist_id: target,
      track_uri: track.uri,
      track_id: track.id,
    });
    setAddingTrackId(null);
    if (res) {
      setTrackActionFeedback(`Added "${track.name}" by ${track.artists} to playlist!`);
      setTimeout(() => setTrackActionFeedback(null), 4000);
    }
  };

  const [pendingProviderSwitch, setPendingProviderSwitch] = useState<'spotify' | 'youtube_music' | null>(null);
  const [switchingProviderLoading, setSwitchingProviderLoading] = useState(false);

  const handleRequestProviderChange = (target: 'spotify' | 'youtube_music') => {
    if (target === musicProvider) return;
    setPendingProviderSwitch(target);
  };

  const handleConfirmProviderSwitch = async () => {
    if (!pendingProviderSwitch) return;
    const target = pendingProviderSwitch;
    setSwitchingProviderLoading(true);
    setMusicProvider(target);
    localStorage.setItem('clipper_music_provider', target);

    // Sync default music provider with Django backend
    await setMusicProviderBackend(target);
    setSwitchingProviderLoading(false);
    setPendingProviderSwitch(null);

    const targetName = target === 'youtube_music' ? 'YouTube Music' : 'Spotify';
    setTrackActionFeedback(`Primary music destination successfully switched to ${targetName}!`);
    if (target === 'spotify') {
      loadPlaylists();
    }
    setTimeout(() => setTrackActionFeedback(null), 4000);
  };

  const handleConnectSpotifyOAuth = async () => {
    const res = await authorizeDestinationBackend({
      provider: 'spotify',
      name: 'Spotify Music',
      accessType: 'full',
      actionType: 'create',
      targetResourceName: 'Playlist: Clipper Tracks (Default)'
    });
    if (res && res.auth_url) {
      window.location.href = res.auth_url;
    } else {
      setTrackActionFeedback('Spotify connected in Local Development / Demo Mode!');
      loadPlaylists();
      setTimeout(() => setTrackActionFeedback(null), 4000);
    }
  };

  useEffect(() => {
    fetchCategoryRoutingRules().then(rules => {
      if (rules) {
        setCategoryRules(prev => ({ ...prev, ...rules }));
        localStorage.setItem('clipper_category_rules', JSON.stringify(rules));
      }
    });
  }, []);

  const handleCategoryRuleChange = (categoryKey: string, destId: string) => {
    const updated = {
      ...categoryRules,
      [categoryKey]: destId
    };
    setCategoryRules(updated);
    localStorage.setItem('clipper_category_rules', JSON.stringify(updated));
    saveCategoryRoutingRules(updated);
  };

  const handleSaveSettings = () => {
    saveStoredPrivacyMode(isPrivacyMode);
    localStorage.setItem('clipper_confirmation_mode', confirmationMode);
    localStorage.setItem('clipper_category_rules', JSON.stringify(categoryRules));
    localStorage.setItem('clipper_music_provider', musicProvider);
    localStorage.setItem('clipper_music_playlist', musicPlaylist);
    localStorage.setItem('clipper_music_auto_add', String(musicAutoAdd));

    // Save category rules to backend database
    saveCategoryRoutingRules(categoryRules);

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
          <div className="flex items-center gap-2">
            <button
              onClick={loadPlaylists}
              disabled={loadingPlaylists}
              className="text-[10px] font-mono text-stone-400 hover:text-emerald-400 flex items-center gap-1 bg-[#111] px-2 py-1 border border-white/10 rounded-sm transition-all"
              title="Refresh Spotify Playlists"
            >
              <RefreshCw className={`w-3 h-3 ${loadingPlaylists ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
              LIVE SPOTIFY WEB API
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-400 font-sans leading-relaxed">
          Music tracks, Spotify embeds, SoundCloud links, and YouTube Music songs are never mixed with documents or spreadsheets. They are automatically routed into your connected music service.
        </p>

        {/* Feedback Alert */}
        {trackActionFeedback && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-sm text-xs font-mono text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{trackActionFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Music Provider Selection */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-3">
            <span className="font-serif font-bold text-white block text-sm flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-emerald-400" />
              Music Streaming Provider
            </span>
            <div className="grid grid-cols-2 gap-2">
              <label
                onClick={(e) => { e.preventDefault(); handleRequestProviderChange('spotify'); }}
                className={`p-3 border rounded-sm cursor-pointer transition-all flex items-center gap-2 ${
                  musicProvider === 'spotify'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#080808] border-white/10 text-stone-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="musicProvider"
                  checked={musicProvider === 'spotify'}
                  readOnly
                  className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-emerald-400" />
                  Spotify
                </span>
              </label>

              <label
                onClick={(e) => { e.preventDefault(); handleRequestProviderChange('youtube_music'); }}
                className={`p-3 border rounded-sm cursor-pointer transition-all flex items-center gap-2 ${
                  musicProvider === 'youtube_music'
                    ? 'bg-red-500/10 border-red-500 text-red-300 font-bold'
                    : 'bg-[#080808] border-white/10 text-stone-400 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="musicProvider"
                  checked={musicProvider === 'youtube_music'}
                  readOnly
                  className="w-3.5 h-3.5 text-red-500 accent-red-500 cursor-pointer"
                />
                <span>YouTube Music</span>
              </label>
            </div>

            {/* Spotify Connect / Status Bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">Account Connection:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnectSpotifyOAuth}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-sm text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Zap className="w-3 h-3 text-emerald-400" />
                  <span>Connect Spotify</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="px-2 py-1 bg-[#111] hover:bg-[#1a1a1a] text-stone-400 border border-white/10 rounded-sm text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  title="Configure Developer API Keys"
                >
                  <Key className="w-3 h-3" />
                  <span>{showApiKeys ? 'Hide Keys' : 'API Keys'}</span>
                </button>
              </div>
            </div>

            {/* Manual API Keys Expandable Panel */}
            {showApiKeys && (
              <div className="p-3 bg-[#0a0a0a] border border-white/10 rounded-sm space-y-2.5 mt-2">
                <span className="text-[11px] font-bold text-stone-300 block">Spotify Developer Credentials:</span>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">SPOTIFY_CLIENT_ID:</label>
                  <input
                    type="text"
                    value={spotifyClientIdInput}
                    onChange={(e) => {
                      setSpotifyClientIdInput(e.target.value);
                      localStorage.setItem('clipper_spotify_client_id', e.target.value);
                    }}
                    placeholder="Enter Spotify Client ID..."
                    className="w-full p-2 bg-[#050505] border border-white/20 rounded-sm text-stone-200 text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">SPOTIFY_CLIENT_SECRET:</label>
                  <input
                    type="password"
                    value={spotifyClientSecretInput}
                    onChange={(e) => {
                      setSpotifyClientSecretInput(e.target.value);
                      localStorage.setItem('clipper_spotify_client_secret', e.target.value);
                    }}
                    placeholder="Enter Spotify Client Secret..."
                    className="w-full p-2 bg-[#050505] border border-white/20 rounded-sm text-stone-200 text-[11px] font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Target Playlist */}
          <div className="p-4 bg-[#050505] border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-white block text-sm flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-emerald-400" />
                Target Playlist
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(!showCreateModal)}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-sm cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Playlist</span>
              </button>
            </div>

            <select
              value={musicPlaylist}
              onChange={(e) => setMusicPlaylist(e.target.value)}
              className="w-full p-2.5 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs outline-none focus:border-emerald-500 font-mono"
            >
              <option value="default">🎧 Clipper Tracks (Default Playlist)</option>
              <option value="liked">❤️ Liked Songs / Favorites</option>
              {spotifyPlaylists.map(pl => (
                <option key={pl.id} value={pl.id}>
                  🎵 {pl.name} ({pl.total_tracks} tracks)
                </option>
              ))}
            </select>

            {/* Inline Create Playlist Form */}
            {showCreateModal && (
              <div className="p-3 bg-[#0a0a0a] border border-emerald-500/30 rounded-sm space-y-2 mt-2">
                <span className="text-[11px] font-bold text-emerald-300 block">Create Playlist on Spotify:</span>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Midnight Synthwave & Coding"
                  className="w-full p-2 bg-[#050505] border border-white/20 rounded-sm text-stone-200 text-xs font-mono"
                />
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={e => setNewPlaylistDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full p-1.5 bg-[#050505] border border-white/10 rounded-sm text-stone-400 text-[11px] font-mono"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-2.5 py-1 text-[11px] text-stone-400 hover:text-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePlaylist}
                    disabled={creatingPlaylist || !newPlaylistName.trim()}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[11px] rounded-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    {creatingPlaylist && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Create on Spotify</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Spotify Song Search & Quick-Test Box */}
        <div className="p-4 bg-[#050505] border border-emerald-500/20 rounded-sm space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-white flex items-center gap-2 text-xs">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              Test Search & Add Song to Spotify
            </span>
            <span className="text-[10px] text-stone-500">Live API catalog search</span>
          </div>

          <form onSubmit={handleSearchSong} className="flex gap-2">
            <input
              type="text"
              value={songSearchQuery}
              onChange={e => setSongSearchQuery(e.target.value)}
              placeholder="Search any song, artist, or album (e.g. Starboy, Bohemian Rhapsody, Interstellar)..."
              className="flex-1 p-2 bg-[#0a0a0a] border border-white/20 rounded-sm text-stone-200 text-xs font-mono outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={searchingSong || !songSearchQuery.trim()}
              className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-sm font-mono text-xs flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              {searchingSong ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </form>

          {/* Search Results List */}
          {songSearchResults.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-[11px] text-stone-400">Found {songSearchResults.length} matches:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {songSearchResults.map(track => (
                  <div
                    key={track.id}
                    className="p-2.5 bg-[#0a0a0a] border border-white/10 hover:border-emerald-500/40 rounded-sm flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {track.album_art ? (
                        <img src={track.album_art} alt={track.album} className="w-10 h-10 object-cover rounded-sm border border-white/10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-950/40 border border-emerald-500/20 rounded-sm flex items-center justify-center shrink-0">
                          <Music className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="text-white font-semibold text-xs block truncate" title={track.name}>{track.name}</span>
                        <span className="text-[11px] text-stone-400 block truncate" title={track.artists}>{track.artists}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {track.external_url && (
                        <a
                          href={track.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-stone-500 hover:text-emerald-400 transition-all"
                          title="Open in Spotify"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuickAddSong(track)}
                        disabled={addingTrackId === track.id}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-black font-bold text-[10px] rounded-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {addingTrackId === track.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                When saving a song, immediately adds it to <code className="text-emerald-300">{musicPlaylist === 'default' ? 'Clipper Tracks' : (spotifyPlaylists.find(p => p.id === musicPlaylist)?.name || musicPlaylist)}</code> without asking for playlist choice each time.
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
      {/* Provider Switch Confirmation Modal */}
      {pendingProviderSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/20 rounded-sm shadow-2xl p-6 space-y-5 font-mono">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-sm ${pendingProviderSwitch === 'youtube_music' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white">Switch Music Provider?</h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Routing change confirmation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingProviderSwitch(null)}
                className="text-stone-500 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#050505] border border-white/10 rounded-sm space-y-2 text-xs font-sans text-stone-300 leading-relaxed">
              <p>
                Are you sure you want to change your primary music destination from{' '}
                <strong className="text-white font-mono uppercase">{musicProvider === 'spotify' ? 'Spotify' : 'YouTube Music'}</strong>{' '}
                to{' '}
                <strong className={`font-mono uppercase ${pendingProviderSwitch === 'youtube_music' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {pendingProviderSwitch === 'youtube_music' ? 'YouTube Music' : 'Spotify'}
                </strong>?
              </p>
              <p className="text-[11px] text-stone-400">
                • Future clipped songs, music links, and audio tracks will automatically sync into{' '}
                <span className="text-white font-semibold">{pendingProviderSwitch === 'youtube_music' ? 'YouTube Music' : 'Spotify'}</span>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingProviderSwitch(null)}
                disabled={switchingProviderLoading}
                className="px-4 py-2 bg-[#141414] hover:bg-[#202020] text-stone-300 text-xs font-mono rounded-sm border border-white/10 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProviderSwitch}
                disabled={switchingProviderLoading}
                className={`px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-md ${
                  pendingProviderSwitch === 'youtube_music'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                }`}
              >
                {switchingProviderLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

