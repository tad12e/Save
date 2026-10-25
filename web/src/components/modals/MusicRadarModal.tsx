import React, { useState, useRef, useEffect } from 'react';
import { Music, Radio, Check, Loader2, Volume2, VolumeX, Plus, Play, Pause, ExternalLink, X, AlertCircle } from 'lucide-react';
import { fetchSpotifyPlaylists, addTrackToSpotifyPlaylist, SpotifyPlaylist } from '../../lib/api';

interface MusicRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IdentifiedSong {
  title: string;
  artist: string;
  album?: string;
  release_date?: string;
  spotify_id?: string;
  spotify_uri?: string;
  spotify_url?: string;
  artwork_url?: string;
  preview_url?: string;
  apple_music_url?: string;
}

export const MusicRadarModal: React.FC<MusicRadarModalProps> = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [identifiedSong, setIdentifiedSong] = useState<IdentifiedSong | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('clipper_tracks_default');
  const [addingTrack, setAddingTrack] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSpotifyPlaylists().then(lists => {
        if (lists && lists.length > 0) setPlaylists(lists);
      });
    } else {
      stopListening();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      }
    }
  }, [isOpen]);

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = async () => {
    setIsListening(true);
    setErrorMsg(null);
    setIdentifiedSong(null);
    setAddedSuccess(false);

    let currentCountdown = 6;
    setCountdown(currentCountdown);
    const interval = setInterval(() => {
      currentCountdown -= 1;
      setCountdown(currentCountdown);
      if (currentCountdown <= 0) clearInterval(interval);
    }, 1000);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        clearInterval(interval);
        stopListening();

        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string) || '';
          await identifyAudio(base64Data);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(1000);
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      }, 6000);

    } catch (err: any) {
      clearInterval(interval);
      setIsListening(false);
      // Fallback for simulation / denied permission
      console.warn('Microphone access denied or error:', err);
      await identifyAudio('SIMULATED_AUDIO_PAYLOAD');
    }
  };

  const identifyAudio = async (base64Audio: string) => {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL as string) || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://yaze.azurewebsites.net');
      const resp = await fetch(`${apiUrl}/api/clips/recognize-audio/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, format: 'webm' }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setIdentifiedSong({
          title: data.title,
          artist: data.artist,
          album: data.album,
          release_date: data.release_date,
          spotify_id: data.spotify_id,
          spotify_uri: data.spotify_uri,
          spotify_url: data.spotify_url,
          artwork_url: data.artwork_url,
          preview_url: data.preview_url,
          apple_music_url: data.apple_music_url,
        });
      } else {
        setErrorMsg('No match found for this audio snippet. Please try closer to the speaker.');
      }
    } catch (err) {
      setErrorMsg('Failed to reach recognition backend service.');
    }
  };

  const handleAddTrack = async () => {
    if (!identifiedSong) return;
    setAddingTrack(true);
    const res = await addTrackToSpotifyPlaylist({
      playlist_id: selectedPlaylist,
      track_id: identifiedSong.spotify_id,
      track_uri: identifiedSong.spotify_uri,
    });
    setAddingTrack(false);
    if (res) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 3000);
    }
  };

  const togglePreview = () => {
    if (!identifiedSong?.preview_url) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(identifiedSong.preview_url);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0c0c0e] border border-white/15 rounded-sm shadow-2xl p-6 space-y-6 font-mono text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">Music Radar & Song Identifier</h2>
              <span className="text-[11px] text-stone-400">Audio fingerprinting powered by AudD.io</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-sm hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Initial / Idle State */}
        {!isListening && !identifiedSong && (
          <div className="text-center py-8 space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Music className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-white">Tap to Identify Music</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto font-sans">
                Hold your device near music playing around you or play audio from any browser tab to identify and save it.
              </p>
            </div>
            <button
              onClick={startListening}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs rounded-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto cursor-pointer transition-all active:scale-95"
            >
              <Radio className="w-4 h-4" />
              <span>Start Listening (6s)</span>
            </button>
          </div>
        )}

        {/* Listening / Waveform State */}
        {isListening && (
          <div className="text-center py-10 space-y-6">
            {/* Animated Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-16">
              {[40, 75, 90, 60, 100, 85, 45, 95, 70, 50, 80, 65].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
            <div className="space-y-1">
              <span className="text-emerald-400 font-bold text-base">Listening... ({countdown}s)</span>
              <p className="text-xs text-stone-400 font-sans">Capturing audio fingerprint...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMsg && !isListening && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-sm text-xs text-red-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1">
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={startListening}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-sm font-bold text-[11px] cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Identified Song Card */}
        {identifiedSong && !isListening && (
          <div className="bg-[#050505] border border-white/10 rounded-sm p-4 space-y-4 animate-in fade-in">
            <div className="flex items-start gap-4">
              <img
                src={identifiedSong.artwork_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300'}
                alt={identifiedSong.title}
                className="w-20 h-20 rounded-sm object-cover border border-white/10 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  SONG IDENTIFIED
                </span>
                <h3 className="font-serif text-base font-bold text-white truncate">
                  {identifiedSong.title}
                </h3>
                <p className="text-xs text-stone-400 truncate">
                  {identifiedSong.artist}
                </p>
                {identifiedSong.album && (
                  <p className="text-[11px] text-stone-500 truncate">
                    Album: {identifiedSong.album} ({identifiedSong.release_date?.substring(0, 4)})
                  </p>
                )}
              </div>
            </div>

            {/* Audio Preview Player */}
            {identifiedSong.preview_url && (
              <div className="p-2.5 bg-[#0e0e11] border border-white/10 rounded-sm flex items-center justify-between">
                <button
                  type="button"
                  onClick={togglePreview}
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer font-bold"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingPreview ? 'Pause 30s Preview' : 'Play 30s Audio Preview'}</span>
                </button>
                <span className="text-[10px] text-stone-500">Audio Preview</span>
              </div>
            )}

            {/* Target Playlist Selector & Add Action */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="space-y-1">
                <label className="text-[11px] text-stone-400 block font-mono">
                  Target Spotify Playlist:
                </label>
                <select
                  value={selectedPlaylist}
                  onChange={e => setSelectedPlaylist(e.target.value)}
                  className="w-full p-2.5 bg-[#09090b] text-white border border-white/15 rounded-sm text-xs font-mono focus:border-emerald-500 outline-none"
                >
                  <option value="clipper_tracks_default">🎧 Clipper Tracks (Default Playlist)</option>
                  <option value="liked">❤️ Liked Songs Library</option>
                  {playlists.filter(p => p.id !== 'clipper_tracks_default' && p.id !== 'liked').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddTrack}
                  disabled={addingTrack || addedSuccess}
                  className={`flex-1 py-2.5 font-bold uppercase tracking-wider text-xs rounded-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                    addedSuccess
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  }`}
                >
                  {addingTrack ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Spotify!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>+ Add to Spotify Playlist</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={startListening}
                  className="px-3.5 py-2.5 bg-[#141414] hover:bg-[#202020] text-stone-300 border border-white/10 rounded-sm text-xs cursor-pointer"
                  title="Listen again"
                >
                  <Radio className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
