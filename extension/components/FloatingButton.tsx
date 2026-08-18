// ─── Draggable Floating Save Button & Dual-Action Music Radar Popover ───

import React, { useEffect, useRef, useState } from 'react';
import { CHECK_14, CLIPPER_LOGO_14 } from '../lib/constants';
import { captureMediaElementAudio } from '../lib/audio_capture';
import { getMusicPlaylists } from '../lib/storage';

export interface FloatingButtonProps {
  onSavePage: () => void;
  onOpenPanel: () => void;
  isSaved?: boolean;
}

interface IdentifiedTrack {
  title: string;
  artist: string;
  album?: string;
  spotify_id?: string;
  spotify_uri?: string;
  spotify_url?: string;
  artwork_url?: string;
  preview_url?: string;
}

export function FloatingButton({ onSavePage, onOpenPanel, isSaved }: FloatingButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Popover State
  const [menuOpen, setMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningCountdown, setListeningCountdown] = useState(5);
  const [identifiedTrack, setIdentifiedTrack] = useState<IdentifiedTrack | null>(null);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('clipper_tracks_default');
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const isSocialMedia = /tiktok\.com|instagram\.com|youtube\.com|x\.com|twitter\.com|soundcloud\.com/i.test(window.location.hostname);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    moved: boolean;
  } | null>(null);

  // Initialize position docked at right edge (or top-right on Reels)
  useEffect(() => {
    const updatePosition = () => {
      const isReels = /instagram\.com/i.test(window.location.hostname) && /reel/i.test(window.location.pathname);
      const savedX = localStorage.getItem('clipper_btn_x');
      const savedY = localStorage.getItem('clipper_btn_y');

      if (savedX && savedY) {
        const x = Math.min(Math.max(10, parseInt(savedX, 10)), window.innerWidth - 44);
        const y = Math.min(Math.max(10, parseInt(savedY, 10)), window.innerHeight - 44);
        setPos({ left: x, top: y });
        return;
      }

      // Default: top-right corner on Reels, right-side dock on other pages
      setPos({
        left: isReels ? Math.max(10, window.innerWidth - 56) : Math.max(10, window.innerWidth - 44),
        top: isReels ? 25 : Math.round(window.innerHeight * 0.45),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    // Load playlists for music menu
    getMusicPlaylists().then(list => {
      if (list && list.length > 0) {
        setPlaylists(list.map(p => ({ id: p.id, name: p.name })));
      }
    });

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  // Global pointer move & up for ultra-smooth, buttery drag anywhere on the screen
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      e.stopPropagation();
      e.preventDefault();

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (!dragRef.current.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        dragRef.current.moved = true;
        setIsDragging(true);
      }

      if (dragRef.current.moved) {
        const nextLeft = Math.min(Math.max(6, dragRef.current.startLeft + dx), window.innerWidth - 38);
        const nextTop = Math.min(Math.max(6, dragRef.current.startTop + dy), window.innerHeight - 38);
        setPos({ left: nextLeft, top: nextTop });
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (!dragRef.current) return;
      e.stopPropagation();
      e.preventDefault();

      const wasMoved = dragRef.current.moved;
      dragRef.current = null;
      setIsDragging(false);

      if (wasMoved) {
        setPos((currentPos) => {
          if (currentPos) {
            localStorage.setItem('clipper_btn_x', String(currentPos.left));
            localStorage.setItem('clipper_btn_y', String(currentPos.top));
          }
          return currentPos;
        });
      } else {
        // Open the full SelectionPanel (Save Clipper & Music Radar)
        onOpenPanel();
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { capture: true, passive: false });
    window.addEventListener('pointerup', handleGlobalPointerUp, { capture: true, passive: false });
    window.addEventListener('pointercancel', handleGlobalPointerUp, { capture: true, passive: false });

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove, { capture: true });
      window.removeEventListener('pointerup', handleGlobalPointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleGlobalPointerUp, { capture: true });
    };
  }, [onOpenPanel]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.button !== 0) return;
    const currentLeft = pos?.left ?? (window.innerWidth - 54);
    const currentTop = pos?.top ?? (window.innerHeight * 0.45);

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      moved: false,
    };
  };

  // Trigger 5-second Audio Recognition
  const handleIdentifyMusic = async () => {
    setIsListening(true);
    setRecognizeError(null);
    setIdentifiedTrack(null);
    setAddedSuccess(false);

    let countdown = 5;
    setListeningCountdown(countdown);
    const interval = setInterval(() => {
      countdown -= 1;
      setListeningCountdown(countdown);
      if (countdown <= 0) clearInterval(interval);
    }, 1000);

    try {
      const audioResult = await captureMediaElementAudio(5);
      clearInterval(interval);

      // Submit to backend
      const resp = await fetch('http://localhost:8000/api/clips/recognize-audio/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioResult.base64,
          format: audioResult.format,
          title_hint: document.title || '',
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        setIdentifiedTrack({
          title: data.title,
          artist: data.artist,
          album: data.album,
          spotify_id: data.spotify_id,
          spotify_uri: data.spotify_uri,
          spotify_url: data.spotify_url,
          artwork_url: data.artwork_url,
          preview_url: data.preview_url,
        });
      } else {
        setRecognizeError('No matching song recognized in this snippet.');
      }
    } catch (err) {
      console.warn('Audio recognition error:', err);
      setRecognizeError('Recognition failed. Please verify backend is running.');
    } finally {
      setIsListening(false);
    }
  };

  // Add identified song to Spotify playlist
  const handleAddTrackToSpotify = async () => {
    if (!identifiedTrack) return;
    setAddingToPlaylist(true);
    try {
      const resp = await fetch('http://localhost:8000/api/destinations/spotify/add-track/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlist_id: selectedPlaylist,
          track_id: identifiedTrack.spotify_id,
          track_uri: identifiedTrack.spotify_uri,
        }),
      });
      if (resp.ok) {
        setAddedSuccess(true);
        setTimeout(() => {
          setMenuOpen(false);
          setIdentifiedTrack(null);
          setAddedSuccess(false);
        }, 2200);
      }
    } catch (err) {
      console.warn('Could not add track:', err);
    } finally {
      setAddingToPlaylist(false);
    }
  };

  // Toggle 30s Audio Preview
  const handleTogglePreview = () => {
    if (!identifiedTrack?.preview_url) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(identifiedTrack.preview_url);
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

  if (!pos) return null;

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: '28px',
    height: '28px',
    borderRadius: '14px',
    background: isSaved
      ? '#065f46'
      : menuOpen
      ? 'rgba(124, 58, 237, 0.95)'
      : isDragging
      ? 'rgba(124, 58, 237, 0.95)'
      : hovered
      ? 'rgba(30, 41, 59, 0.95)'
      : 'rgba(15, 23, 42, 0.92)',
    border: isSaved
      ? '1px solid #10b981'
      : menuOpen || isDragging
      ? '1.5px solid #c084fc'
      : hovered
      ? '1px solid rgba(167, 139, 250, 0.7)'
      : '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: isDragging
      ? '0 6px 20px rgba(124, 58, 237, 0.8), 0 0 12px rgba(168, 85, 247, 0.5)'
      : menuOpen
      ? '0 0 16px rgba(168, 85, 247, 0.75)'
      : hovered
      ? '0 3px 12px rgba(124, 58, 237, 0.45)'
      : '0 2px 8px rgba(0, 0, 0, 0.5)',
    cursor: isDragging ? 'grabbing' : 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2147483647,
    transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease',
    transform: hovered && !isDragging ? 'scale(1.15)' : 'scale(1.0)',
    outline: 'none',
    padding: 0,
    margin: 0,
    userSelect: 'none',
    touchAction: 'none',
    pointerEvents: 'auto',
    backdropFilter: 'blur(8px)',
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      title={isSaved ? 'Saved to Clipper!' : 'Click for Music Radar & Save Clip (Drag to move anywhere)'}
      aria-label="Save with Clipper"
      dangerouslySetInnerHTML={{
        __html: isSaved ? CHECK_14 : CLIPPER_LOGO_14,
      }}
    />
  );
}
