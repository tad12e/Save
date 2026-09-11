import React, { useState, useEffect, useRef } from 'react';
import { DestinationConfig } from '../../types';
import { BrandIcon } from '../BrandIcons';
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
  Bookmark,
  Play,
  X,
  ChevronDown,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

interface SettingsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
  theme?: 'terminal' | 'dark' | 'light';
}

export type ConfirmationMode = 'auto' | 'confirm' | 'always_ask';

const defaultDemoTracks: SpotifyTrack[] = [
  {
    id: 'demo_track_1',
    name: 'Silhouettes (I, II & III)',
    artists: 'Floating Points',
    album: 'Elaenia (2015) • 10:42',
    album_art: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJXDtxz4yI1D7S4yz41XsEvoiK6Hz0hVYfuIdOPR_LIfFAYPCOUSEBShAFGpH4uyqxNxz_XUU5NLveJjYRLwkHgEidMTJxXTWe63yuu7FBkuOhUAkUfKxj5uAK9b_ksT56dq-kDvF4uzyaa1u_40tGxCNmnGxp3yJQpzqXGfySLARhnGpQqAECZZqUcAIl4O9xdBEVhKjd5yHONcU4gGNgMAqWFfjt4gYqPIPGhWXDZszkSWK4xxAgCw',
    uri: 'spotify:track:demo_track_1',
    duration_ms: 642000,
    external_url: 'https://open.spotify.com'
  },
  {
    id: 'demo_track_2',
    name: 'Nespole',
    artists: 'Floating Points',
    album: 'Elaenia (2015) • 5:08',
    album_art: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApmwDx2LFsoTGe5g950OTYHaycS_LqfmyLlEfcfqzQ-LCPj0dz4yYX6jQeB7WPqQRf8wv9XlPC9u066Q1GNH0I79X-llqddtftO0q3_dEsI3KugfaHu2X4xGr-tGR_aSwa01wk_Nqx2lt2Tc_KL7cP35hnEC8u0JEkEvoQmBwHmi0b9hkpSg431Evsu7M2a16LxdB3yrZSRMXi6pcqPu1-sAKm6wHzeacz-qHO5EmXXzo79JZVpdJXfw',
    uri: 'spotify:track:demo_track_2',
    duration_ms: 308000,
    external_url: 'https://open.spotify.com'
  }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ destinations, setDestinations, theme = 'dark' }) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [activeSection, setActiveSection] = useState<'general' | 'destinations' | 'routing' | 'music' | 'privacy' | 'ai'>('general');

  const scrollToSection = (sectionId: 'general' | 'destinations' | 'routing' | 'music' | 'privacy' | 'ai') => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const sectionIds: ('general' | 'destinations' | 'routing' | 'music' | 'privacy' | 'ai')[] = [
      'general', 'destinations', 'routing', 'music', 'privacy', 'ai'
    ];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [defaultDestId, setDefaultDestId] = useState<string>(
    destinations.find(d => d.isDefault)?.id || destinations[0]?.id || ''
  );
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => getStoredPrivacyMode());
  const [confirmationMode, setConfirmationMode] = useState<ConfirmationMode>(() => {
    return (localStorage.getItem('clipper_confirmation_mode') as ConfirmationMode) || 'confirm';
  });
  const [simulatedClipToast, setSimulatedClipToast] = useState<string | null>(null);

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

  const defaultExtractionPrompt = 'Extract core metadata strictly as valid JSON: {"title": "{page_title}", "company_or_author": "string", "published_date": "ISO8601", "summary_bullet_points": ["max 3 items"], "category": "auto-classified"}. Discard marketing cookies and affiliate query tags.';
  const [aiExtractionPrompt, setAiExtractionPrompt] = useState<string>(() => {
    return localStorage.getItem('clipper_ai_extraction_prompt') || defaultExtractionPrompt;
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [discardToast, setDiscardToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (variableName: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart ?? aiExtractionPrompt.length;
      const end = textarea.selectionEnd ?? aiExtractionPrompt.length;
      const current = aiExtractionPrompt;
      const updated = current.substring(0, start) + variableName + current.substring(end);
      setAiExtractionPrompt(updated);
      localStorage.setItem('clipper_ai_extraction_prompt', updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableName.length, start + variableName.length);
      }, 0);
    } else {
      const updated = aiExtractionPrompt ? `${aiExtractionPrompt} ${variableName}` : variableName;
      setAiExtractionPrompt(updated);
      localStorage.setItem('clipper_ai_extraction_prompt', updated);
    }
  };

  // Spotify Live State & Playlists
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

  // Spotify Test Search Widget State
  const [songSearchQuery, setSongSearchQuery] = useState('Floating Points - Elaenia');
  const [songSearchResults, setSongSearchResults] = useState<SpotifyTrack[]>([]);
  const [searchingSong, setSearchingSong] = useState(false);
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null);
  const [trackActionFeedback, setTrackActionFeedback] = useState<string | null>(null);

  // Spotify API Key Config Toggle
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [spotifyClientIdInput, setSpotifyClientIdInput] = useState(() => localStorage.getItem('clipper_spotify_client_id') || '');
  const [spotifyClientSecretInput, setSpotifyClientSecretInput] = useState(() => localStorage.getItem('clipper_spotify_client_secret') || '');
  const [showSecretPassword, setShowSecretPassword] = useState(false);

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

  const handleDiscardChanges = () => {
    setIsPrivacyMode(getStoredPrivacyMode());
    const storedConf = (localStorage.getItem('clipper_confirmation_mode') as ConfirmationMode) || 'confirm';
    setConfirmationMode(storedConf);

    try {
      const storedRules = localStorage.getItem('clipper_category_rules');
      if (storedRules) setCategoryRules(JSON.parse(storedRules));
    } catch {
      // ignore
    }

    setMusicProvider((localStorage.getItem('clipper_music_provider') as 'spotify' | 'youtube_music') || 'spotify');
    setMusicPlaylist(localStorage.getItem('clipper_music_playlist') || 'default');
    setMusicAutoAdd(localStorage.getItem('clipper_music_auto_add') !== 'false');

    const defaultPrompt = 'Extract core metadata strictly as valid JSON: {"title": "{page_title}", "company_or_author": "string", "published_date": "ISO8601", "summary_bullet_points": ["max 3 items"], "category": "auto-classified"}. Discard marketing cookies and affiliate query tags.';
    setAiExtractionPrompt(localStorage.getItem('clipper_ai_extraction_prompt') || defaultPrompt);

    const defaultDest = destinations.find(d => d.isDefault);
    if (defaultDest) setDefaultDestId(defaultDest.id);

    setDiscardToast('Unsaved changes discarded. Reverted to active synced preferences.');
    setTimeout(() => setDiscardToast(null), 3500);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);

    saveStoredPrivacyMode(isPrivacyMode);
    localStorage.setItem('clipper_confirmation_mode', confirmationMode);
    localStorage.setItem('clipper_category_rules', JSON.stringify(categoryRules));
    localStorage.setItem('clipper_music_provider', musicProvider);
    localStorage.setItem('clipper_music_playlist', musicPlaylist);
    localStorage.setItem('clipper_music_auto_add', String(musicAutoAdd));
    localStorage.setItem('clipper_ai_extraction_prompt', aiExtractionPrompt);

    // Save category rules to backend database
    await saveCategoryRoutingRules(categoryRules);

    setDestinations(prev =>
      prev.map(d => ({
        ...d,
        isDefault: d.id === defaultDestId
      }))
    );

    setTimeout(() => {
      setIsSavingSettings(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 450);
  };

  return (
    <div className={`w-full min-h-screen transition-colors duration-200 ${isDark ? 'bg-[#000000] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <main className="flex-1 w-full pb-[120px]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
          {/* Top Header: Title & Synced Badge */}
          <section className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-[#1F1F1F]' : 'border-[#E2E8F0]'}`}>
            <div className="flex flex-col gap-1">
              <h1
                className={`text-[22px] md:text-[24px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Clipper Settings &amp; System Preferences
              </h1>
              <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
                Configure browser extension latency, automated destination routing, music sinks, and AI extraction heuristics.
              </p>
            </div>
            <div className={`self-start sm:self-center flex items-center gap-2 px-3 py-1.5 rounded-full border flex-shrink-0 transition-colors ${
              isDark 
                ? 'bg-[#0E0E0E] border-[#262626] text-stone-300' 
                : 'bg-white border-[#E2E8F0] text-slate-600 shadow-xs'
            }`}>
              <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
              <span className="text-xs font-medium">Settings Synced • v2.4</span>
            </div>
          </section>

          {/* Sticky Jump Nav Bar */}
          <div className={`sticky top-0 sm:top-2 z-30 backdrop-blur-md border rounded-xl px-4 py-2.5 transition-all flex items-center justify-between gap-4 ${
            isDark 
              ? 'bg-[#0A0A0A]/95 border-[#262626] shadow-md shadow-black/40' 
              : 'bg-white/95 border-[#E2E8F0] shadow-sm'
          }`}>
            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" id="settings-nav">
              {[
                { id: 'general' as const, label: 'General' },
                { id: 'destinations' as const, label: 'Destinations' },
                { id: 'routing' as const, label: 'Routing' },
                { id: 'music' as const, label: 'Music' },
                { id: 'privacy' as const, label: 'Privacy' },
                { id: 'ai' as const, label: 'AI' }
              ].map(tab => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => scrollToSection(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#142318] text-[#3FE769] border border-[#214328] font-semibold shadow-xs'
                          : 'bg-[#DCFCE7] text-[#2D6A4F] font-semibold shadow-xs'
                        : isDark
                          ? 'text-[#878787] hover:text-white hover:bg-[#181818] font-medium'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${
                isDark
                  ? 'bg-[#142318] text-[#3FE769] border-[#214328]'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769] animate-pulse' : 'bg-emerald-600'}`} />
                EXTENSION V2.4 ACTIVE
              </span>
            </div>
          </div>

      {/* 1. Save Confirmation Modes (Stitch Section 1: #general) */}
      <article
        id="general"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 transition-all duration-200 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}
      >
        {/* Section Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Save Confirmation Modes
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-medium text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-[#181818] text-[#A1A1A1] border border-[#262626]'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                SPEED
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              Controls browser extension popup latency, keyboard shortcuts, and review prompts.
            </p>
          </div>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-[#181818] text-[#3FE769]' : 'bg-emerald-50 text-[#2D6A4F]'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* 3-Col Radio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Auto Mode */}
          <div
            onClick={() => {
              setConfirmationMode('auto');
              localStorage.setItem('clipper_confirmation_mode', 'auto');
            }}
            className={`group relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all ${
              confirmationMode === 'auto'
                ? isDark
                  ? 'border-2 border-[#3FE769] bg-[#142318]/40 shadow-sm'
                  : 'border-2 border-[#2D6A4F] bg-emerald-50/20 shadow-sm'
                : isDark
                  ? 'border border-[#262626] bg-[#121212] hover:border-[#383838]'
                  : 'border border-slate-200 bg-white hover:border-[#2D6A4F]/50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    confirmationMode === 'auto'
                      ? isDark
                        ? 'border-[#3FE769] bg-[#3FE769] text-black'
                        : 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                      : isDark
                        ? 'border-[#383838] bg-[#1A1A1A]'
                        : 'border-slate-300 bg-white'
                  }`}
                >
                  {confirmationMode === 'auto' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isDark
                      ? 'bg-[#181818] text-stone-300 border border-[#262626]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Fastest 1-Click
                </span>
              </div>
              <h3
                className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Auto Mode
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
                Saves immediately with zero prompts. Fastest frictionless bookmarking for speed readers.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center gap-1.5 text-xs font-medium ${
                isDark ? 'border-[#1F1F1F] text-[#878787]' : 'border-slate-100 text-slate-500'
              }`}
            >
              <span>⏱</span>
              <span>0ms pop delay</span>
            </div>
          </div>

          {/* Card 2: Confirm Mode (Recommended) */}
          <div
            onClick={() => {
              setConfirmationMode('confirm');
              localStorage.setItem('clipper_confirmation_mode', 'confirm');
            }}
            className={`group relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all ${
              confirmationMode === 'confirm'
                ? isDark
                  ? 'border-2 border-[#3FE769] bg-[#142318]/40 shadow-sm'
                  : 'border-2 border-[#2D6A4F] bg-emerald-50/20 shadow-sm'
                : isDark
                  ? 'border border-[#262626] bg-[#121212] hover:border-[#383838]'
                  : 'border border-slate-200 bg-white hover:border-[#2D6A4F]/50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    confirmationMode === 'confirm'
                      ? isDark
                        ? 'border-[#3FE769] bg-[#3FE769] text-black'
                        : 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                      : isDark
                        ? 'border-[#383838] bg-[#1A1A1A]'
                        : 'border-slate-300 bg-white'
                  }`}
                >
                  {confirmationMode === 'confirm' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isDark
                      ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                      : 'bg-[#DCFCE7] text-[#2D6A4F]'
                  }`}
                >
                  ★ Recommended
                </span>
              </div>
              <h3
                className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Confirm Mode
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
                Shows a minimal pre-selected destination toast bar with a single tap to confirm or re-route.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center gap-1.5 text-xs font-semibold ${
                isDark ? 'border-[#1F1F1F] text-[#3FE769]' : 'border-emerald-200/60 text-[#2D6A4F]'
              }`}
            >
              <span>⌘</span>
              <span>Cmd+S shortcut ready</span>
            </div>
          </div>

          {/* Card 3: Always Ask */}
          <div
            onClick={() => {
              setConfirmationMode('always_ask');
              localStorage.setItem('clipper_confirmation_mode', 'always_ask');
            }}
            className={`group relative flex flex-col justify-between p-4 rounded-xl cursor-pointer transition-all ${
              confirmationMode === 'always_ask'
                ? isDark
                  ? 'border-2 border-[#3FE769] bg-[#142318]/40 shadow-sm'
                  : 'border-2 border-[#2D6A4F] bg-emerald-50/20 shadow-sm'
                : isDark
                  ? 'border border-[#262626] bg-[#121212] hover:border-[#383838]'
                  : 'border border-slate-200 bg-white hover:border-[#2D6A4F]/50 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    confirmationMode === 'always_ask'
                      ? isDark
                        ? 'border-[#3FE769] bg-[#3FE769] text-black'
                        : 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                      : isDark
                        ? 'border-[#383838] bg-[#1A1A1A]'
                        : 'border-slate-300 bg-white'
                  }`}
                >
                  {confirmationMode === 'always_ask' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    isDark
                      ? 'bg-[#181818] text-stone-300 border border-[#262626]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Full Control
                </span>
              </div>
              <h3
                className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Always Ask
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
                Always pops full destination picker with folder, nested tag, and custom intent categorizer.
              </p>
            </div>
            <div
              className={`mt-4 pt-3 border-t flex items-center gap-1.5 text-xs font-medium ${
                isDark ? 'border-[#1F1F1F] text-[#878787]' : 'border-slate-100 text-slate-500'
              }`}
            >
              <span>⌥</span>
              <span>Manual triage</span>
            </div>
          </div>
        </div>

        {/* Live Extension Preview Box */}
        <div
          className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            isDark ? 'border-[#262626] bg-[#121212]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bookmark className="w-4 h-4 fill-white text-white" />
            </div>
            <div className={`text-xs leading-normal truncate ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Live Extension Preview:{' '}
                {confirmationMode === 'auto'
                  ? 'Auto Mode Active'
                  : confirmationMode === 'confirm'
                  ? 'Confirm Mode Active'
                  : 'Always Ask Active'}
              </span>
              <span className="text-slate-400 mx-1.5">—</span>
              <span>Target: </span>
              <strong className={isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'}>
                {destinations.find(d => d.id === defaultDestId)?.name || 'Default Vault'}
              </strong>
              <span className={`inline-flex items-center ml-1 text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                isDark ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50' : 'text-amber-700 bg-amber-50 border border-amber-200/60'
              }`}>
                ★ Default
              </span>
              <span className="hidden sm:inline"> • Press </span>
              <kbd
                className={`hidden sm:inline px-1.5 py-0.5 rounded font-mono text-[11px] border ${
                  isDark ? 'bg-[#1E1E1E] border-[#333] text-stone-200' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                ⌘S
              </kbd>
              <span className="hidden sm:inline"> anywhere on web to test</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultName = destinations.find(d => d.id === defaultDestId)?.name || 'Default Vault';
              if (confirmationMode === 'auto') {
                setSimulatedClipToast(`⚡ Auto Mode: Web clip saved instantly to "${defaultName}" with 0ms delay!`);
              } else if (confirmationMode === 'confirm') {
                setSimulatedClipToast(`👆 Confirm Mode: Destination bar popped — "Save to ${defaultName}?" [Confirmed]`);
              } else {
                setSimulatedClipToast(`📋 Always Ask: Full destination triage modal opened for "${defaultName}"!`);
              }
              setTimeout(() => setSimulatedClipToast(null), 3800);
            }}
            className={`border px-3.5 py-2 rounded-lg text-xs font-medium shadow-xs flex-shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'border-[#333] bg-[#1C1C1C] text-stone-200 hover:bg-[#252525] hover:text-white'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isDark ? 'fill-[#3FE769] text-[#3FE769]' : 'fill-[#2D6A4F] text-[#2D6A4F]'}`} />
            <span>Simulate Clip</span>
          </button>
        </div>

        {/* Live Simulation Feedback Banner */}
        {simulatedClipToast && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{simulatedClipToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedClipToast(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </article>

      {/* 2. Universal Global Default Destination (Stitch Section 2: #destinations) */}
      <article
        id="destinations"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 transition-all duration-200 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Universal Global Default Destination
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-medium text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-[#181818] text-[#A1A1A1] border border-[#262626]'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                FALLBACK
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              Catch-all repository used whenever a saved item does not match any smart category routing rule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#connections';
            }}
            className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center ${
              isDark
                ? 'text-[#3FE769] hover:text-[#52F77D]'
                : 'text-[#2D6A4F] hover:text-[#1f4d38] hover:underline'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Connect Integration</span>
          </button>
        </div>

        {/* 56px Interactive Destination Rows */}
        <div className="flex flex-col gap-2.5">
          {destinations
            .filter(d => d.type !== 'spotify' && d.type !== 'youtube_music')
            .map(d => {
              const isSelected = defaultDestId === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setDefaultDestId(d.id);
                    setDestinations(prev =>
                      prev.map(item => ({
                        ...item,
                        isDefault: item.id === d.id
                      }))
                    );
                  }}
                  className={`h-14 px-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? isDark
                        ? 'border-2 border-[#3FE769] bg-[#142318]/40 shadow-sm'
                        : 'border-2 border-[#2D6A4F] bg-emerald-50/20 shadow-sm'
                      : isDark
                        ? 'border border-[#262626] bg-[#121212] hover:bg-[#181818] hover:border-[#383838]'
                        : 'border border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Radio Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? isDark
                            ? 'border-[#3FE769] bg-[#3FE769] text-black'
                            : 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                          : isDark
                            ? 'border-[#383838] bg-[#1A1A1A]'
                            : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Brand Icon (32x32) */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs p-1.5 ${
                        isDark
                          ? 'bg-[#181818] border border-[#262626]'
                          : 'bg-white border border-slate-200'
                      }`}
                    >
                      <BrandIcon name={d.name || d.type} className="w-4 h-4" />
                    </div>

                    {/* Name & Target Details */}
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {d.name}
                      </span>
                      <span className={`text-xs truncate ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                        {d.targetResourceName || 'Configured Storage'}
                      </span>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          isDark
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        ★ Default
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.connected
                          ? isDark
                            ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                            : 'bg-[#DCFCE7] text-[#2D6A4F]'
                          : isDark
                            ? 'bg-[#181818] text-[#878787] border border-[#262626]'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.connected
                            ? isDark
                              ? 'bg-[#3FE769]'
                              : 'bg-[#2D6A4F]'
                            : isDark
                              ? 'bg-[#555]'
                              : 'bg-slate-300'
                        }`}
                      />
                      {d.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </article>

      {/* 3. Smart Per-Category Routing (Stitch Section 3: #routing) */}
      <article
        id="routing"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 transition-all duration-200 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}
      >
        {/* Section Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Smart Per-Category Routing
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-medium text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                    : 'bg-[#DCFCE7] text-[#2D6A4F]'
                }`}
              >
                AUTO
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              The Save AI engine automatically detects incoming content semantics and dispatches items to dedicated destinations.
            </p>
          </div>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-[#181818] text-[#3FE769]' : 'bg-emerald-50 text-[#2D6A4F]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* 2-Col Responsive Grid featuring 6 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: 'article',
              title: 'Articles & Newsletters',
              desc: 'Long-reads, deep-dives, Substacks, essays',
              icon: BookOpen
            },
            {
              key: 'job',
              title: 'Jobs & Opportunities',
              desc: 'Career portals, Greenhouse, Lever listings',
              icon: Briefcase
            },
            {
              key: 'tool',
              title: 'Tools & GitHub Repos',
              desc: 'Open-source repos, npm packages, developer SaaS',
              icon: FolderGit2
            },
            {
              key: 'scholarship',
              title: 'Scholarships & Grants',
              desc: 'NSF, SBIR, fellowships, academic grants',
              icon: GraduationCap
            },
            {
              key: 'event',
              title: 'Events & Conferences',
              desc: 'Luma invites, meetups, technical summits',
              icon: Calendar
            },
            {
              key: 'recipe',
              title: 'Culinary & Recipes',
              desc: 'NYT Cooking, culinary blogs, nutrition cards',
              icon: Utensils
            }
          ].map((cat) => {
            const IconComp = cat.icon;
            const currentDestId = categoryRules[cat.key] || '';
            const isCustom = Boolean(currentDestId);
            const defaultDest = destinations.find(d => d.id === defaultDestId);
            const defaultDestName = defaultDest?.name || 'Default Vault';

            return (
              <div
                key={cat.key}
                className={`p-4 border rounded-xl flex flex-col justify-between gap-3.5 transition-all ${
                  isDark
                    ? isCustom
                      ? 'border-[#333] bg-[#121212] hover:border-[#444]'
                      : 'border-[#262626] bg-[#121212] hover:border-[#333]'
                    : isCustom
                      ? 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs ${
                      isDark
                        ? 'bg-[#181818] border border-[#262626] text-[#3FE769]'
                        : 'bg-white border border-slate-200 text-[#2D6A4F]'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {cat.title}
                    </span>
                    <span className={`text-xs truncate mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                      {cat.desc}
                    </span>
                  </div>
                </div>

                <div className="relative w-full">
                  <select
                    value={currentDestId}
                    onChange={(e) => handleCategoryRuleChange(cat.key, e.target.value)}
                    className={`w-full h-9 pl-3 pr-8 rounded-lg text-xs appearance-none cursor-pointer focus:outline-none transition-colors truncate ${
                      isDark
                        ? 'bg-[#181818] border border-[#2C2C2C] text-stone-200 focus:border-[#3FE769]'
                        : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                    }`}
                  >
                    <option value="">
                      Universal Global Default ({defaultDestName})
                    </option>
                    {destinations
                      .filter(d => d.type !== 'spotify' && d.type !== 'youtube_music')
                      .map((d) => (
                        <option key={`${cat.key}_${d.id}`} value={d.id}>
                          {d.name} ({d.targetResourceName || d.type})
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none ${
                      isDark ? 'text-stone-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* 4. Dedicated Music Destination (Stitch Section 4: #music) */}
      <article
        id="music"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 transition-all duration-200 ${
          isDark
            ? 'bg-[#0B130E] border-[#1A3322]'
            : 'bg-emerald-50/20 border-emerald-200 shadow-sm'
        }`}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Dedicated Music Destination
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                    : 'bg-[#DCFCE7] text-[#2D6A4F]'
                }`}
              >
                LIVE AUDIO
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              Automatically routes audio bookmarks, track links, and podcast clips into streaming playlists instead of note vaults.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPlaylists}
            disabled={loadingPlaylists}
            className={`text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 self-start sm:self-center ${
              isDark ? 'text-[#3FE769] hover:text-[#52F77D]' : 'text-[#2D6A4F] hover:text-[#1f4d38]'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPlaylists ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {trackActionFeedback && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{trackActionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setTrackActionFeedback(null)}
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Provider Selector (2 tabs/cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Spotify Premium */}
          <div
            onClick={() => {
              if (musicProvider !== 'spotify') {
                handleRequestProviderChange('spotify');
              }
            }}
            className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              musicProvider === 'spotify'
                ? isDark
                  ? 'border-2 border-[#3FE769] bg-[#142318]/50 shadow-sm'
                  : 'border-2 border-[#2D6A4F] bg-white shadow-xs'
                : isDark
                  ? 'border border-[#262626] bg-[#121212] hover:bg-[#181818] hover:border-[#383838]'
                  : 'border border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#1DB954] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <BrandIcon name="spotify" className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span
                  className={`text-sm font-semibold truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Spotify Premium
                </span>
                <span
                  className={`text-xs truncate font-medium mt-0.5 ${
                    musicProvider === 'spotify'
                      ? isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                      : isDark ? 'text-stone-400' : 'text-slate-400'
                  }`}
                >
                  {musicProvider === 'spotify' ? 'Connected as @alex_arch' : 'Ready to connect'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {musicProvider === 'spotify' ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectSpotifyOAuth();
                    }}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-all cursor-pointer ${
                      isDark
                        ? 'text-[#3FE769] hover:bg-[#1C3A24]'
                        : 'text-[#2D6A4F] hover:bg-emerald-50'
                    }`}
                    title="Authenticate with Spotify OAuth"
                  >
                    OAuth Sync
                  </button>
                  <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestProviderChange('spotify');
                  }}
                  className={`text-xs font-semibold hover:underline cursor-pointer ${
                    isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                  }`}
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Card 2: YouTube Music */}
          <div
            onClick={() => {
              if (musicProvider !== 'youtube_music') {
                handleRequestProviderChange('youtube_music');
              }
            }}
            className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
              musicProvider === 'youtube_music'
                ? isDark
                  ? 'border-2 border-red-500 bg-red-950/25 shadow-sm'
                  : 'border-2 border-red-600 bg-white shadow-xs'
                : isDark
                  ? 'border border-[#262626] bg-[#121212] hover:bg-[#181818] hover:border-[#383838]'
                  : 'border border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <BrandIcon name="youtube_music" className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span
                  className={`text-sm font-semibold truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  YouTube Music
                </span>
                <span
                  className={`text-xs truncate font-medium mt-0.5 ${
                    musicProvider === 'youtube_music'
                      ? isDark ? 'text-red-400' : 'text-red-600'
                      : isDark ? 'text-stone-400' : 'text-slate-400'
                  }`}
                >
                  {musicProvider === 'youtube_music' ? 'Connected • Primary Sink' : 'Ready to connect'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {musicProvider === 'youtube_music' ? (
                <CheckCircle2 className="w-5 h-5 text-red-500" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestProviderChange('youtube_music');
                  }}
                  className={`text-xs font-semibold hover:underline cursor-pointer ${
                    isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
                  }`}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Developer Credentials Panel */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className={`text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-stone-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Key className={`w-3.5 h-3.5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
              <span>{showApiKeys ? 'Hide Developer Credentials' : 'Configure Developer Credentials (API Keys)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showApiKeys ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleConnectSpotifyOAuth}
              className={`text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'text-[#3FE769] hover:text-[#52F77D]' : 'text-[#2D6A4F] hover:text-[#1f4d38]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>OAuth Connect</span>
            </button>
          </div>

          {showApiKeys && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 mt-2 border-t border-dashed border-slate-200 dark:border-stone-800 animate-in fade-in">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                  SPOTIFY_CLIENT_ID
                </label>
                <input
                  type="text"
                  value={spotifyClientIdInput}
                  onChange={(e) => {
                    setSpotifyClientIdInput(e.target.value);
                    localStorage.setItem('clipper_spotify_client_id', e.target.value);
                  }}
                  placeholder="sp_live_9941a8fd204eb"
                  className={`h-9 px-3 rounded-lg font-mono text-xs focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#181818] border border-[#2B2B2B] text-white focus:border-[#3FE769]'
                      : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                  SPOTIFY_CLIENT_SECRET
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showSecretPassword ? 'text' : 'password'}
                    value={spotifyClientSecretInput}
                    onChange={(e) => {
                      setSpotifyClientSecretInput(e.target.value);
                      localStorage.setItem('clipper_spotify_client_secret', e.target.value);
                    }}
                    placeholder="secret_live_masked_token_key"
                    className={`w-full h-9 px-3 pr-9 rounded-lg font-mono text-xs focus:outline-none transition-colors ${
                      isDark
                        ? 'bg-[#181818] border border-[#2B2B2B] text-white focus:border-[#3FE769]'
                        : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretPassword(!showSecretPassword)}
                    className={`absolute right-2.5 cursor-pointer transition-colors ${
                      isDark ? 'text-stone-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={showSecretPassword ? 'Hide Secret' : 'Show Secret'}
                  >
                    {showSecretPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Target Live Playlist Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
              Target Live Playlist
            </label>
            <div className="relative w-full">
              <select
                value={musicPlaylist}
                onChange={(e) => {
                  setMusicPlaylist(e.target.value);
                  localStorage.setItem('clipper_music_playlist', e.target.value);
                }}
                className={`w-full h-9 pl-3 pr-8 rounded-lg text-xs appearance-none cursor-pointer focus:outline-none transition-colors truncate ${
                  isDark
                    ? 'bg-[#181818] border border-[#2B2B2B] text-white focus:border-[#3FE769]'
                    : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                }`}
              >
                <option value="default">Clipper Tracks (Default) • 142 tracks</option>
                <option value="liked">❤️ Liked Songs / Favorites</option>
                {spotifyPlaylists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} • {pl.total_tracks} tracks
                  </option>
                ))}
              </select>
              <ChevronDown className={`w-4 h-4 absolute right-2.5 top-2.5 pointer-events-none ${isDark ? 'text-stone-400' : 'text-slate-400'}`} />
            </div>
          </div>
          <div className="sm:self-end flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateModal(!showCreateModal)}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#181818] hover:bg-[#222] border border-[#2B2B2B] text-stone-200'
                  : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <Plus className="w-4 h-4 text-[#2D6A4F] dark:text-[#3FE769]" />
              <span>+ New Playlist</span>
            </button>
          </div>
        </div>

        {/* Inline Create Playlist Form */}
        {showCreateModal && (
          <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
            isDark ? 'bg-[#141414] border-[#2B2B2B]' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Create New Playlist on Spotify
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g. Midnight Beats & Synthwave"
                className={`h-9 px-3 rounded-lg text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1C1C1C] border border-[#333] text-white focus:border-[#3FE769]'
                    : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                }`}
              />
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Description (optional)"
                className={`h-9 px-3 rounded-lg text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-[#1C1C1C] border border-[#333] text-white focus:border-[#3FE769]'
                    : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                }`}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isDark ? 'text-stone-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePlaylist}
                disabled={creatingPlaylist || !newPlaylistName.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'bg-[#3FE769] hover:bg-[#52F77D] text-black font-semibold'
                    : 'bg-[#2D6A4F] hover:bg-[#1f4d38] text-white'
                }`}
              >
                {creatingPlaylist && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Playlist</span>
              </button>
            </div>
          </div>
        )}

        {/* Test Resolver & Song Matcher */}
        <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
          isDark
            ? 'bg-[#121212]/90 border-[#223828]'
            : 'bg-white/80 border-emerald-200/80 shadow-xs'
        }`}>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
              Test Instant Resolver &amp; Song Matcher
            </label>
            <form onSubmit={handleSearchSong} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                  isDark ? 'text-stone-400' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search any song, artist, or album (e.g. Floating Points - Elaenia)..."
                  className={`w-full h-9 pl-9 pr-3 rounded-lg text-xs focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#181818] border border-[#2B2B2B] text-white focus:border-[#3FE769]'
                      : 'bg-white border border-slate-300 text-slate-800 focus:border-[#2D6A4F]'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={searchingSong || !songSearchQuery.trim()}
                className={`h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer flex-shrink-0 ${
                  isDark
                    ? 'bg-[#3FE769] hover:bg-[#52F77D] text-black font-semibold'
                    : 'bg-[#2D6A4F] hover:bg-[#1f4d38] text-white'
                }`}
              >
                {searchingSong && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Song Result Rows (Live API results or Stitch Demo preview) */}
          <div className="flex flex-col gap-2 pt-1">
            {(songSearchResults.length > 0 ? songSearchResults : defaultDemoTracks).map((track) => (
              <div
                key={track.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isDark
                    ? 'bg-[#181818] border-[#262626] hover:border-[#363636]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {track.album_art ? (
                    <img
                      src={track.album_art}
                      alt={track.name}
                      className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-slate-100 dark:bg-stone-800"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-[#142318] text-[#3FE769]' : 'bg-emerald-50 text-[#2D6A4F]'
                    }`}>
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {track.name}
                    </span>
                    <span className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                      {track.artists} {track.album ? `• ${track.album}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {track.external_url && (
                    <a
                      href={track.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-stone-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Open in Spotify"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleQuickAddSong(track)}
                    disabled={addingTrackId === track.id}
                    className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                      isDark
                        ? 'bg-[#142318] text-[#3FE769] hover:bg-[#1E3825] border border-[#214328]'
                        : 'bg-[#DCFCE7] text-[#2D6A4F] hover:bg-emerald-200'
                    }`}
                  >
                    {addingTrackId === track.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Toggle */}
        <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-stone-800/80">
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              1-Tap Instant Save to Default Playlist
            </span>
            <span className={`text-xs mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
              Skip dialog confirm for verified Bandcamp, Spotify, and SoundCloud track URLs.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={musicAutoAdd}
              onChange={(e) => {
                setMusicAutoAdd(e.target.checked);
                localStorage.setItem('clipper_music_auto_add', String(e.target.checked));
              }}
              className="sr-only peer"
            />
            <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
              isDark
                ? 'bg-[#2A2A2A] peer-checked:bg-[#3FE769]'
                : 'bg-slate-300 peer-checked:bg-[#2D6A4F]'
            }`} />
          </label>
        </div>
      </article>

      {/* 5. Local Privacy Vault Mode (Stitch Section 5: #privacy) */}
      <article
        id="privacy"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 relative overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-[#0F0D09] border-amber-900/30'
            : 'bg-amber-50/20 border-amber-200 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Local Privacy Vault Mode
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                100% PRIVATE &amp; OFFLINE
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              All clipped items, raw payloads, and contextual metadata are stored exclusively within client-side IndexedDB and local sandboxed browser storage. Cloud relay sync is paused.
            </p>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Toggle Row Card */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            isDark
              ? 'bg-[#14120C] border-amber-900/40 hover:border-amber-700/50'
              : 'bg-white border-amber-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <div className="flex flex-col leading-tight min-w-0">
              <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Enable On-Device Local Privacy Storage
              </span>
              <span className={`text-xs truncate mt-0.5 ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                Zero telemetry, local vector indexing via WebAssembly.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={isPrivacyMode}
              onChange={(e) => {
                setIsPrivacyMode(e.target.checked);
                saveStoredPrivacyMode(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div
              className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${
                isDark
                  ? 'bg-[#2A2A2A] peer-checked:bg-[#3FE769]'
                  : 'bg-slate-300 peer-checked:bg-[#2D6A4F]'
              }`}
            />
          </label>
        </div>
      </article>

      {/* 6. AI Extraction Prompt Rules (Stitch Section 6: #ai) */}
      <article
        id="ai"
        className={`scroll-mt-28 rounded-2xl border p-6 shadow-sm mb-6 flex flex-col gap-5 transition-all duration-200 ${
          isDark
            ? 'bg-[#0E0E0E] border-[#262626]'
            : 'bg-white border-[#E2E8F0] shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h2
                className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                AI Extraction Prompt Rules
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full font-medium text-[10px] tracking-wider uppercase ${
                  isDark
                    ? 'bg-[#181818] text-stone-300 border border-[#2B2B2B]'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                PARSER ENGINE
              </span>
            </div>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-600'}`}>
              Custom instructions passed to the extraction model when parsing web pages, text fragments, and clipped attachments.
            </p>
          </div>
          <span className={`text-xs font-mono font-medium flex-shrink-0 self-start sm:self-center ${isDark ? 'text-stone-400' : 'text-slate-400'}`}>
            Max 500 tokens
          </span>
        </div>

        {/* Textarea Instruction Area */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
              System Extraction Directive (JSON Schema Output)
            </label>
            <span className={`text-[11px] font-mono ${aiExtractionPrompt.length > 1800 ? 'text-amber-500 font-semibold' : isDark ? 'text-stone-400' : 'text-slate-400'}`}>
              {aiExtractionPrompt.length} / 2000 chars (~{Math.round(aiExtractionPrompt.length / 4)} tokens)
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={aiExtractionPrompt}
            onChange={(e) => {
              setAiExtractionPrompt(e.target.value);
              localStorage.setItem('clipper_ai_extraction_prompt', e.target.value);
            }}
            rows={3}
            maxLength={2000}
            className={`w-full p-3.5 rounded-xl font-mono text-xs leading-relaxed focus:outline-none transition-all resize-none shadow-inner ${
              isDark
                ? 'bg-[#141414] border border-[#2B2B2B] text-white focus:border-[#3FE769] focus:bg-[#181818]'
                : 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-[#2D6A4F] focus:bg-white'
            }`}
          />
        </div>

        {/* Clickable Runtime Variable Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={`text-xs font-medium ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
            Supported runtime variables:
          </span>
          {[
            '{page_title}',
            '{meta_desc}',
            '{dom_tree}',
            '{selection_text}'
          ].map((variable) => (
            <button
              key={variable}
              type="button"
              onClick={() => handleInsertVariable(variable)}
              title={`Click to insert ${variable} into extraction directive`}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
                isDark
                  ? 'border-[#2B2B2B] bg-[#181818] text-stone-200 hover:border-[#3FE769] hover:text-[#3FE769] hover:bg-[#142318]'
                  : 'border-slate-200 bg-slate-100 text-slate-800 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-emerald-50'
              }`}
            >
              <span>+</span>
              <span>{variable}</span>
            </button>
          ))}
        </div>
      </article>

      {/* Sticky Bottom Save Bar (Stitch Fixed Footer) */}
      <aside
        className={`fixed bottom-0 left-0 md:left-64 right-0 py-3.5 px-4 sm:px-8 flex items-center justify-between z-40 backdrop-blur-md border-t transition-all shadow-lg ${
          isDark
            ? 'bg-[#0A0A0A]/95 border-[#262626] text-stone-300'
            : 'bg-white/95 border-[#E2E8F0] text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              savedSuccess
                ? isDark ? 'bg-[#3FE769]' : 'bg-[#2D6A4F]'
                : isDark ? 'bg-[#3FE769] animate-pulse' : 'bg-[#2D6A4F]'
            }`}
          />
          {savedSuccess ? (
            <span
              className={`font-semibold flex items-center gap-1.5 truncate ${
                isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Settings &amp; Preferences Saved Successfully!</span>
            </span>
          ) : discardToast ? (
            <span className="font-mono text-amber-500 font-medium truncate">
              {discardToast}
            </span>
          ) : (
            <>
              <span className="hidden md:inline truncate">
                Changes apply automatically across Web App, Chrome Extension, and Mobile App • All sync caches warm
              </span>
              <span className="md:hidden truncate">Changes ready to sync</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={isSavingSettings}
            className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-[#181818]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Discard Changes
          </button>
          <button
            type="button"
            id="btn-save-settings"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
              isDark
                ? 'bg-[#3FE769] hover:bg-[#52F77D] text-black font-semibold'
                : 'bg-[#2D6A4F] hover:bg-[#1f4d38] text-white'
            }`}
          >
            {isSavingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </aside>
      </div>
      </main>
      {/* Provider Switch Confirmation Modal */}
      {pendingProviderSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-md rounded-2xl p-6 space-y-5 transition-all shadow-2xl ${
            isDark ? 'bg-[#121212] border border-[#2B2B2B] text-white' : 'bg-white border border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                  pendingProviderSwitch === 'youtube_music'
                    ? isDark ? 'bg-red-950/40 text-red-400 border border-red-800/40' : 'bg-red-50 text-red-600 border border-red-200'
                    : isDark ? 'bg-[#142318] text-[#3FE769] border border-[#214328]' : 'bg-emerald-50 text-[#2D6A4F] border border-emerald-200'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    Switch Music Provider?
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                    Routing change confirmation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingProviderSwitch(null)}
                className={`transition-colors cursor-pointer p-1 rounded-lg ${
                  isDark ? 'text-stone-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 text-xs leading-relaxed ${
              isDark ? 'bg-[#181818] border-[#262626] text-stone-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <p>
                Are you sure you want to change your primary music destination from{' '}
                <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {musicProvider === 'spotify' ? 'Spotify' : 'YouTube Music'}
                </strong>{' '}
                to{' '}
                <strong className={`font-semibold ${pendingProviderSwitch === 'youtube_music' ? 'text-red-500' : isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`}>
                  {pendingProviderSwitch === 'youtube_music' ? 'YouTube Music' : 'Spotify'}
                </strong>?
              </p>
              <p className={`text-[11px] ${isDark ? 'text-stone-400' : 'text-slate-500'}`}>
                • Future clipped songs, music links, and audio tracks will automatically sync into{' '}
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {pendingProviderSwitch === 'youtube_music' ? 'YouTube Music' : 'Spotify'}
                </span>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPendingProviderSwitch(null)}
                disabled={switchingProviderLoading}
                className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#333] bg-[#1C1C1C] hover:bg-[#252525] text-stone-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmProviderSwitch}
                disabled={switchingProviderLoading}
                className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                  pendingProviderSwitch === 'youtube_music'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : isDark
                      ? 'bg-[#3FE769] hover:bg-[#52F77D] text-black'
                      : 'bg-[#2D6A4F] hover:bg-[#1f4d38] text-white'
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

