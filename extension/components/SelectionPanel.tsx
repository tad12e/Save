// ─── Selection Mini-Panel & Music Radar Component (Draggable & Resizable) ───

import React, { useEffect, useRef, useState } from 'react';
import {
  BACK_ARROW_SVG,
  C,
  CLIPPER_LOGO_12,
  GEAR_SVG,
  PROVIDER_ICONS,
  PROVIDER_SVGS,
} from '../lib/constants';
import { captureMediaElementAudio } from '../lib/audio_capture';
import {
  Destination,
  getAirtableTables,
  getConnectedDestinations,
  getDefaultDestination,
  getDestinationForContentType,
  getGoogleSheetsResources,
  GoogleSheetResource,
  getMusicPlaylists,
  getNotionDatabases,
  MusicPlaylist,
  setDefaultDestination,
  getUniversalStorage,
} from '../lib/storage';

declare const chrome: any;

export interface SelectionPanelProps {
  text: string;
  url: string;
  position: { left: number; top: number };
  onClose: () => void;
  contentType?: string | null;
  source?: string;
}

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const EDGE_CURSORS: Record<ResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

const DEFAULT_PROVIDER_LIST: Destination[] = [
  { type: 'google_sheets', name: 'Google Sheets', tableId: 'sheets_default', tableName: 'My Clips', icon: '📊' },
];

interface IdentifiedTrack {
  title: string;
  artist: string;
  album?: string;
  spotify_id?: string;
  spotify_uri?: string;
  spotify_url?: string;
  youtube_music_url?: string;
  youtube_url?: string;
  is_youtube?: boolean;
  artwork_url?: string;
  preview_url?: string;
  is_simulated?: boolean;
}

interface DropdownOption {
  id: string;
  value: string;
  label: string;
  iconSvg?: string;
  isCustom?: boolean;
}

const CustomDropdown: React.FC<{
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  defaultIconSvg?: string;
  placeholder?: string;
}> = ({ value, options, onChange, defaultIconSvg, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOpt = options.find((o) => o.value === value) || options[0];
  const activeIcon = selectedOpt?.iconSvg || defaultIconSvg;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#18181b',
          color: '#f4f4f5',
          border: isOpen ? '1px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '5px',
          padding: '5px 7px',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeIcon && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: activeIcon }}
            />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {selectedOpt?.label || placeholder}
          </span>
        </div>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            right: 0,
            backgroundColor: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            zIndex: 99999,
            maxHeight: '160px',
            overflowY: 'auto',
            padding: '3px',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const itemIcon = opt.iconSvg || defaultIconSvg;
            return (
              <div
                key={opt.id || opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 7px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
                  color: isSelected ? '#c084fc' : opt.isCustom ? '#a855f7' : '#e4e4e7',
                  fontSize: '11px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {itemIcon && !opt.isCustom && (
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', flexShrink: 0 }}
                    dangerouslySetInnerHTML={{ __html: itemIcon }}
                  />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function SelectionPanel({
  text,
  url,
  position,
  onClose,
  contentType,
  source = 'text_selection',
}: SelectionPanelProps) {
  // Mode & Tab state (Default to 'clip' text save, 'music' when explicitly requested)
  const [activeTab, setActiveTab] = useState<'music' | 'clip'>(contentType === 'music' ? 'music' : 'clip');
  const [mode, setMode] = useState<'quick' | 'configure'>('quick');

  // Position and Size state for Drag & Resize
  const [pos, setPos] = useState({ left: position.left, top: position.top });
  const [panelWidth, setPanelWidth] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startLeft: number; startTop: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ edge: ResizeEdge; pointerId: number; startX: number; startY: number; startWidth: number; startLeft: number; startTop: number } | null>(null);

  // Destination state
  const [defaultDest, setDefaultDest] = useState<Destination | null>(null);
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>(DEFAULT_PROVIDER_LIST);
  const [selectedDest, setSelectedDest] = useState<Destination>(DEFAULT_PROVIDER_LIST[0]);

  // Enhanced Configure Mode State: Custom Note & Tags & Deadline
  const [customNote, setCustomNote] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');

  // Music & Playlists state
  const [musicPlaylists, setMusicPlaylists] = useState<MusicPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('clipper_tracks_default');
  const [isListening, setIsListening] = useState(false);
  const [listeningCountdown, setListeningCountdown] = useState(5);
  const [identifiedTrack, setIdentifiedTrack] = useState<IdentifiedTrack | null>(null);
  const [recognizeError, setRecognizeError] = useState<string | null>(null);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Sub-destination configuration state
  const [sheetsTab, setSheetsTab] = useState('My Clips');
  const [googleSheetsList, setGoogleSheetsList] = useState<GoogleSheetResource[]>([
    { id: 'primary', name: 'My Clips (Granted)', tabName: 'My Clips' },
    { id: 'research', name: 'Research & Notes', tabName: 'Research & Notes' },
    { id: 'jobs', name: 'Jobs & Opportunities', tabName: 'Jobs & Opportunities' },
    { id: 'articles', name: 'Articles & Reads', tabName: 'Articles & Reads' },
  ]);
  const [isCustomTab, setIsCustomTab] = useState(false);
  const [notionDbs, setNotionDbs] = useState<Array<{ id: string; name: string }>>([
    { id: 'notion_default', name: 'Reading list database (Granted)' },
    { id: 'notion_jobs', name: 'Job Applications & Leads' },
    { id: 'notion_projects', name: 'Projects & Tasks' },
  ]);
  const [selectedNotionDb, setSelectedNotionDb] = useState('notion_default');
  const [airtableTables, setAirtableTables] = useState<Array<{ baseId: string; baseName: string; tableId: string; tableName: string }>>([
    { baseId: 'base1', baseName: 'Clipper Base', tableId: 'airtable_default', tableName: 'Content tracker (Granted)' },
  ]);
  const [selectedAirtableTable, setSelectedAirtableTable] = useState('airtable_default');
  const [remember, setRemember] = useState(true);

  // Save execution state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Sync position prop
  useEffect(() => {
    const safeLeft = Math.max(10, Math.min(position.left, window.innerWidth - panelWidth - 20));
    const safeTop = Math.max(10, Math.min(position.top, window.innerHeight - 380));
    setPos({ left: safeLeft, top: safeTop });
  }, [position.left, position.top, panelWidth]);

  // Load storage state on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['jwt', 'clipper_access_token'], (res: any) => {
        setIsAuthenticated(Boolean(res?.jwt || res?.clipper_access_token));
      });
    }

    getDestinationForContentType(contentType).then((dest) => {
      if (dest) {
        setSelectedDest(dest);
        if (dest.type === 'google_sheets' && dest.tableName) {
          setSheetsTab(dest.tableName);
        }
      }
    });

    getDefaultDestination().then((dest) => {
      if (dest) {
        setDefaultDest(dest);
        setSelectedDest(dest);
        if (dest.tableName) setSheetsTab(dest.tableName);
      }
    });

    getConnectedDestinations().then((storedList) => {
      if (storedList && storedList.length > 0) {
        setAvailableDestinations(storedList);
        setSelectedDest((prev) => {
          const match = storedList.find((d) => d.type === prev?.type);
          return match || storedList[0];
        });
      }
    });

    getGoogleSheetsResources().then((sheets) => {
      if (sheets && sheets.length > 0) {
        setGoogleSheetsList(sheets);
        setSheetsTab(sheets[0].tabName || sheets[0].name);
      }
    });

    getMusicPlaylists('spotify').then((playlists) => {
      if (playlists && playlists.length > 0) {
        setMusicPlaylists(playlists);
        const def = playlists.find((p) => p.isDefault) || playlists[0];
        setSelectedPlaylist(def.id);
      }
    });

    getNotionDatabases().then((dbs) => {
      if (dbs && dbs.length > 0) {
        setNotionDbs(dbs);
        setSelectedNotionDb(dbs[0].id);
      }
    });

    getAirtableTables().then((tables) => {
      if (tables && tables.length > 0) {
        setAirtableTables(tables);
        setSelectedAirtableTable(tables[0].tableId);
      }
    });

    const storage = getUniversalStorage();
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.connected_destinations) {
        const newList = changes.connected_destinations.newValue;
        if (Array.isArray(newList) && newList.length > 0) {
          setAvailableDestinations(newList);
          setSelectedDest((prev) => {
            const match = newList.find((d: any) => d.type === prev?.type);
            return match || newList[0];
          });
        }
      }
    };

    if (storage.onChanged) {
      storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (storage.onChanged) {
        storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [contentType]);

  // Handle escape key and click outside
  useEffect(() => {
    let timer: any = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (dragRef.current || resizeRef.current) return;
      const path = e.composedPath ? e.composedPath() : [];
      const isInside = path.some(
        (el: any) =>
          (el.getAttribute && (el.getAttribute('data-clipper-panel') !== null || el.getAttribute('data-clipper-injected') !== null)) ||
          (el.className && typeof el.className === 'string' && (el.className.includes('clipper-tweet-save-btn') || el.className.includes('clipper-reel-btn') || el.className.includes('clipper-feed-panel')))
      );
      if (!isInside) {
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
        }
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent immediate close from the click event that opened this panel
    timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 150);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, [onClose]);

  // Pointer move & up for Dragging & Resizing
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        if (!dragRef.current.moved && Math.hypot(dx, dy) > 4) {
          dragRef.current.moved = true;
          setIsDragging(true);
        }

        if (dragRef.current.moved) {
          const nextLeft = Math.max(10, Math.min(dragRef.current.startLeft + dx, window.innerWidth - panelWidth - 10));
          const nextTop = Math.max(10, Math.min(dragRef.current.startTop + dy, window.innerHeight - 80));
          setPos({ left: nextLeft, top: nextTop });
        }
      }

      if (resizeRef.current && e.pointerId === resizeRef.current.pointerId) {
        const rs = resizeRef.current;
        const dx = e.clientX - rs.startX;
        let newWidth = rs.startWidth;
        let newLeft = rs.startLeft;

        if (rs.edge.includes('e')) {
          newWidth = Math.max(250, Math.min(480, rs.startWidth + dx));
        }
        if (rs.edge.includes('w')) {
          const proposed = Math.max(250, Math.min(480, rs.startWidth - dx));
          newLeft = rs.startLeft + (rs.startWidth - proposed);
          newWidth = proposed;
        }

        setIsResizing(true);
        setPanelWidth(newWidth);
        setPos((prev) => ({ ...prev, left: newLeft }));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
        dragRef.current = null;
        setIsDragging(false);
      }
      if (resizeRef.current && e.pointerId === resizeRef.current.pointerId) {
        resizeRef.current = null;
        setIsResizing(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [panelWidth]);

  // Start Header Drag
  const beginDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop: pos.top,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Start Handle Resize
  const beginResize = (e: React.PointerEvent, edge: ResizeEdge) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    resizeRef.current = {
      edge,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panelWidth,
      startLeft: pos.left,
      startTop: pos.top,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // ─── Music Recognition ───
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
          youtube_music_url: data.youtube_music_url,
          youtube_url: data.youtube_url,
          is_youtube: data.is_youtube,
          artwork_url: data.artwork_url,
          preview_url: data.preview_url,
          is_simulated: data.is_simulated,
        });
      } else {
        setRecognizeError('No song recognized in this audio snippet.');
      }
    } catch (err) {
      console.warn('Audio recognition error:', err);
      setRecognizeError('Recognition failed. Ensure backend server is running.');
    } finally {
      setIsListening(false);
    }
  };

  // ─── Add Track to Spotify ───
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
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.warn('Could not add track:', err);
    } finally {
      setAddingToPlaylist(false);
    }
  };

  // ─── Toggle 30s Audio Preview ───
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
      audioPreviewRef.current.play().catch(e => console.warn('Preview error:', e));
      setIsPlayingPreview(true);
    }
  };

  // ─── Handle 1-Tap Quick Save ───
  const handleQuickSave = async () => {
    if (saveStatus === 'saving' || saveStatus === 'saved') return;
    setSaveStatus('saving');
    setErrorMessage('');

    const destinationToUse = selectedDest || defaultDest || DEFAULT_PROVIDER_LIST[0];

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url,
        selectedText: text,
        contentType: contentType || 'text',
        destination: destinationToUse,
        source: source || 'text_selection',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, (resData: any) => {
        if (resData && resData.ok === false) {
          setSaveStatus('error');
          setErrorMessage(resData.error || 'Please sign in');
        } else {
          setSaveStatus('saved');
          setTimeout(onClose, 800);
        }
      });
    } else {
      setSaveStatus('saved');
      setTimeout(onClose, 800);
    }
  };

  // ─── Handle Configured Save ───
  const handleConfiguredSave = async () => {
    if (saveStatus === 'saving' || saveStatus === 'saved') return;
    setSaveStatus('saving');
    setErrorMessage('');

    let finalTableName = selectedDest.tableName || 'Sheet1';
    let finalTableId = selectedDest.tableId || 'default';

    if (selectedDest.type === 'spotify' || selectedDest.type === 'youtube_music') {
      const match = musicPlaylists.find((p) => p.id === selectedPlaylist);
      if (match) {
        finalTableName = match.name;
        finalTableId = match.id;
      }
    } else if (selectedDest.type === 'google_sheets') {
      finalTableName = sheetsTab || 'Sheet1';
    } else if (selectedDest.type === 'notion') {
      const match = notionDbs.find((d) => d.id === selectedNotionDb);
      if (match) {
        finalTableName = match.name;
        finalTableId = match.id;
      }
    } else if (selectedDest.type === 'airtable') {
      const match = airtableTables.find((t) => t.tableId === selectedAirtableTable);
      if (match) {
        finalTableName = match.tableName;
        finalTableId = match.tableId;
      }
    }

    const updatedDest: Destination = {
      ...selectedDest,
      tableName: finalTableName,
      tableId: finalTableId,
    };

    if (remember) {
      await setDefaultDestination(updatedDest);
      setDefaultDest(updatedDest);
    }

    const tagsArray = customTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url,
        selectedText: text,
        contentType: contentType || 'text',
        destination: updatedDest,
        tableId: finalTableId,
        note: customNote.trim() || undefined,
        tags: tagsArray,
        deadline: customDeadline || undefined,
        source: 'text_selection_configured',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, (resData: any) => {
        if (resData && resData.ok === false) {
          setSaveStatus('error');
          setErrorMessage(resData.error || 'Please sign in');
        } else {
          setSaveStatus('saved');
          setTimeout(onClose, 800);
        }
      });
    } else {
      setSaveStatus('saved');
      setTimeout(onClose, 800);
    }
  };

  const previewText = text ? (text.length > 55 ? text.slice(0, 55) + '…' : text) : 'Web Clip';

  // Dynamic theme colors
  const bg = '#0d0d11';
  const textColor = '#f4f4f5';
  const subTextColor = '#a1a1aa';
  const borderColor = 'rgba(255, 255, 255, 0.16)';
  const surfaceBg = 'rgba(255, 255, 255, 0.06)';

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: `${panelWidth}px`,
    backgroundColor: bg,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    boxShadow: isDragging || isResizing ? '0 16px 36px rgba(0, 0, 0, 0.8)' : '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(124, 58, 237, 0.25)',
    zIndex: 2147483647,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '10px 12px',
    color: textColor,
    boxSizing: 'border-box',
    animation: isDragging ? 'none' : 'clipperFadeScale 0.15s ease-out forwards',
    pointerEvents: 'auto',
    userSelect: isDragging || isResizing ? 'none' : 'auto',
    backdropFilter: 'blur(16px)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 700,
    color: textColor,
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a1a1aa',
    transition: 'all 0.15s ease',
  };

  const stopPointer = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  // Filter text destinations for quick save dropdown (Google Sheets, Notion, Airtable)
  const textDestinations = availableDestinations.filter(d => d.type !== 'spotify' && d.type !== 'youtube_music');
  const allDestinationsList = textDestinations.length > 0 ? textDestinations : DEFAULT_PROVIDER_LIST;

  return (
    <div data-clipper-panel style={panelStyle} onClick={(e) => e.stopPropagation()}>
      <style>{`
        @keyframes clipperFadeScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1.0); }
        }
        @keyframes clipperPulseBar {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
      `}</style>

      {/* Resize handles (East & West) */}
      <div
        onPointerDown={(e) => beginResize(e, 'e')}
        style={{ position: 'absolute', right: -4, top: 4, bottom: 4, width: 8, cursor: EDGE_CURSORS.e, zIndex: 10, touchAction: 'none' }}
      />
      <div
        onPointerDown={(e) => beginResize(e, 'w')}
        style={{ position: 'absolute', left: -4, top: 4, bottom: 4, width: 8, cursor: EDGE_CURSORS.w, zIndex: 10, touchAction: 'none' }}
      />

      {/* Header */}
      <div style={headerStyle} onPointerDown={beginDrag}>
        <div style={titleStyle}>
          <span style={{ fontSize: '13px', color: '#71717a' }}>⋮⋮</span>
          <span dangerouslySetInnerHTML={{ __html: CLIPPER_LOGO_12 }} />
          <span>Save Clipper</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {/* Permanent Music Radar button accessible on ALL pages */}
          <button
            type="button"
            style={{
              ...iconBtnStyle,
              color: activeTab === 'music' ? '#c084fc' : '#a1a1aa',
              backgroundColor: activeTab === 'music' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
              border: activeTab === 'music' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
            }}
            onPointerDown={stopPointer}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab(prev => (prev === 'music' ? 'clip' : 'music'));
            }}
            title="Music Radar: Listen & identify music"
            aria-label="Music Radar"
          >
            <span style={{ fontSize: '12px' }}>🎧</span>
          </button>

          {/* Configure Mode Button */}
          <button
            type="button"
            style={{
              ...iconBtnStyle,
              color: mode === 'configure' && activeTab === 'clip' ? '#c084fc' : '#a1a1aa',
              backgroundColor: mode === 'configure' && activeTab === 'clip' ? 'rgba(124, 58, 237, 0.25)' : 'transparent',
              border: mode === 'configure' && activeTab === 'clip' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
            }}
            onPointerDown={stopPointer}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('clip');
              setMode(prev => (prev === 'configure' ? 'quick' : 'configure'));
            }}
            title={mode === 'configure' ? 'Back to quick save' : 'Configure destination & tags'}
            dangerouslySetInnerHTML={{ __html: GEAR_SVG }}
          />

          {/* Close Button */}
          <button
            type="button"
            style={{ ...iconBtnStyle, fontSize: '14px', lineHeight: 1 }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            title="Close (Esc)"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* ─── MODE 1: QUICK SAVE MODE (Default on Text Selection) ─── */}
      {activeTab === 'clip' && mode === 'quick' && (
        <div>
          {/* Text preview snippet */}
          <div style={{
            fontSize: '11px',
            color: '#cbd5e1',
            fontStyle: 'italic',
            backgroundColor: surfaceBg,
            borderRadius: '6px',
            padding: '7px 9px',
            marginBottom: '8px',
            wordBreak: 'break-word',
            lineHeight: '1.35',
            maxHeight: '68px',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            "{previewText}"
          </div>

          {/* Interactive Destination Dropdown Selector with Official SVG */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#a1a1aa',
            marginBottom: '10px',
            padding: '2px 0',
          }}>
            <span>Saving to:</span>
            <div style={{ width: '180px' }}>
              <CustomDropdown
                value={selectedDest?.type || 'google_sheets'}
                options={allDestinationsList.map((d) => ({
                  id: d.type,
                  value: d.type,
                  label: d.name + (d.tableName ? ` (${d.tableName})` : ''),
                  iconSvg: PROVIDER_SVGS[d.type] || PROVIDER_SVGS.google_sheets,
                }))}
                onChange={(val) => {
                  const found = allDestinationsList.find((d) => d.type === val);
                  if (found) {
                    setSelectedDest(found);
                    setDefaultDest(found);
                    setDefaultDestination(found);
                  }
                }}
              />
            </div>
          </div>

          {/* 1-Tap Save Button */}
          <button
            type="button"
            style={{
              width: '100%',
              backgroundColor: saveStatus === 'saved' ? '#065f46' : saveStatus === 'error' ? '#dc2626' : C.violetPrimary,
              color: saveStatus === 'saved' ? '#6ee7b7' : '#fff',
              borderRadius: '8px',
              padding: '9px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              transition: 'background-color 0.2s ease',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
            }}
            onClick={handleQuickSave}
            onPointerDown={stopPointer}
          >
            {saveStatus === 'saved'
              ? 'Saved ✓'
              : saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
              ? (errorMessage ? `${errorMessage}` : 'Sign In Required')
              : 'Save now'}
          </button>
        </div>
      )}

      {/* ─── MODE 2: ENHANCED CONFIGURE MODE ─── */}
      {activeTab === 'clip' && mode === 'configure' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#e4e4e7' }}>Choose Destination:</span>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '11px', cursor: 'pointer', padding: 0 }}
              onClick={() => setMode('quick')}
              onPointerDown={stopPointer}
            >
              ← Back to Quick Save
            </button>
          </div>

          {/* Provider Platform Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', maxHeight: '110px', overflowY: 'auto' }}>
            {availableDestinations.map((d, index) => {
              const isSelected = selectedDest?.type === d.type;
              return (
                <div
                  key={`${d.type}-${index}`}
                  onPointerDown={stopPointer}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDest(d);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    borderLeft: isSelected ? `3px solid ${C.violetPrimary}` : '3px solid transparent',
                    backgroundColor: isSelected ? 'rgba(124,58,237,0.2)' : surfaceBg,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', flexShrink: 0 }}
                    dangerouslySetInnerHTML={{ __html: PROVIDER_SVGS[d.type] || PROVIDER_SVGS.google_sheets }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: textColor }}>{d.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Specific Table / Database Selector */}
          {selectedDest?.type === 'google_sheets' && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px' }}>Target Sheet / Tab:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <CustomDropdown
                  value={isCustomTab ? '__custom__' : sheetsTab}
                  defaultIconSvg={PROVIDER_SVGS.google_sheets}
                  options={[
                    ...googleSheetsList.map((s) => ({
                      id: s.id,
                      value: s.tabName || s.name,
                      label: s.name,
                      iconSvg: PROVIDER_SVGS.google_sheets,
                    })),
                    {
                      id: '__custom__',
                      value: '__custom__',
                      label: '+ Custom Tab Name...',
                      isCustom: true,
                    },
                  ]}
                  onChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomTab(true);
                    } else {
                      setIsCustomTab(false);
                      setSheetsTab(val);
                    }
                  }}
                />
                {isCustomTab && (
                  <input
                    type="text"
                    value={sheetsTab}
                    onChange={(e) => setSheetsTab(e.target.value)}
                    onPointerDown={stopPointer}
                    placeholder="Type custom tab name..."
                    autoFocus
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#18181b',
                      color: '#f4f4f5',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      borderRadius: '5px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {selectedDest?.type === 'notion' && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px' }}>Notion Database:</div>
              <CustomDropdown
                value={selectedNotionDb}
                defaultIconSvg={PROVIDER_SVGS.notion}
                options={notionDbs.map((d) => ({
                  id: d.id,
                  value: d.id,
                  label: d.name,
                  iconSvg: PROVIDER_SVGS.notion,
                }))}
                onChange={(val) => setSelectedNotionDb(val)}
              />
            </div>
          )}

          {selectedDest?.type === 'airtable' && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px' }}>Airtable Table:</div>
              <CustomDropdown
                value={selectedAirtableTable}
                defaultIconSvg={PROVIDER_SVGS.airtable}
                options={airtableTables.map((t) => ({
                  id: t.tableId,
                  value: t.tableId,
                  label: `${t.tableName} (${t.baseName})`,
                  iconSvg: PROVIDER_SVGS.airtable,
                }))}
                onChange={(val) => setSelectedAirtableTable(val)}
              />
            </div>
          )}

          {/* Quick Note & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px' }}>Note (optional):</div>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                onPointerDown={stopPointer}
                placeholder="Add note..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#18181b',
                  color: '#f4f4f5',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '5px',
                  padding: '4px 6px',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px' }}>Tags (optional):</div>
              <input
                type="text"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                onPointerDown={stopPointer}
                placeholder="#ideas, #read"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#18181b',
                  color: '#f4f4f5',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '5px',
                  padding: '4px 6px',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Deadline / Reminder Input */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Deadline / Reminder (optional):</span>
              {customDeadline && (
                <button
                  type="button"
                  onClick={() => setCustomDeadline('')}
                  onPointerDown={stopPointer}
                  style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '9px', cursor: 'pointer', padding: 0 }}
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="date"
              value={customDeadline}
              onChange={(e) => setCustomDeadline(e.target.value)}
              onPointerDown={stopPointer}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '5px',
                padding: '4px 6px',
                fontSize: '11px',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Remember Default Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#a1a1aa', marginBottom: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              onPointerDown={stopPointer}
              style={{ accentColor: C.violetPrimary }}
            />
            <span>Remember as default destination</span>
          </label>

          {/* Configured Save Button */}
          <button
            type="button"
            style={{
              width: '100%',
              backgroundColor: saveStatus === 'saved' ? '#065f46' : saveStatus === 'error' ? '#dc2626' : C.violetPrimary,
              color: saveStatus === 'saved' ? '#6ee7b7' : '#fff',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onClick={handleConfiguredSave}
            onPointerDown={stopPointer}
          >
            {saveStatus === 'saved'
              ? 'Saved ✓'
              : saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
              ? (errorMessage ? `${errorMessage}` : 'Sign In Required')
              : `Save to ${selectedDest.name}`}
          </button>
        </div>
      )}

      {/* ─── TAB: MUSIC RADAR (Accessible on ALL pages) ─── */}
      {activeTab === 'music' && (
        <div>
          {/* Listening State */}
          {isListening && (
            <div style={{ padding: '14px 8px', textAlign: 'center', backgroundColor: 'rgba(124, 58, 237, 0.08)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '22px', marginBottom: '8px' }}>
                <span style={{ width: '3px', backgroundColor: '#a855f7', borderRadius: '2px', animation: 'clipperPulseBar 0.6s ease-in-out infinite' }} />
                <span style={{ width: '3px', backgroundColor: '#c084fc', borderRadius: '2px', animation: 'clipperPulseBar 0.6s ease-in-out infinite 0.15s' }} />
                <span style={{ width: '3px', backgroundColor: '#e879f9', borderRadius: '2px', animation: 'clipperPulseBar 0.6s ease-in-out infinite 0.3s' }} />
                <span style={{ width: '3px', backgroundColor: '#a855f7', borderRadius: '2px', animation: 'clipperPulseBar 0.6s ease-in-out infinite 0.45s' }} />
                <span style={{ width: '3px', backgroundColor: '#c084fc', borderRadius: '2px', animation: 'clipperPulseBar 0.6s ease-in-out infinite 0.2s' }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>Listening to Tab Audio...</div>
              <div style={{ fontSize: '10px', color: '#c084fc', marginTop: '2px' }}>Sampling {listeningCountdown}s snippet for fingerprinting</div>
            </div>
          )}

          {/* Identified Track Card */}
          {!isListening && identifiedTrack && (
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <img
                  src={identifiedTrack.artwork_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                  alt={identifiedTrack.title}
                  style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {identifiedTrack.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {identifiedTrack.artist}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                    {identifiedTrack.youtube_music_url ? (
                      <a
                        href={identifiedTrack.youtube_music_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '9px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        ▶ YouTube Music ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: '9px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                        Spotify Matched
                      </span>
                    )}
                    {identifiedTrack.spotify_url && (
                      <a href={identifiedTrack.spotify_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#10b981', textDecoration: 'none' }}>
                        Spotify ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 30s Audio Preview Button */}
              {identifiedTrack.preview_url && (
                <button
                  type="button"
                  onClick={handleTogglePreview}
                  onPointerDown={stopPointer}
                  style={{
                    width: '100%',
                    padding: '5px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: isPlayingPreview ? 'rgba(239, 68, 68, 0.15)' : 'rgba(124, 58, 237, 0.15)',
                    color: isPlayingPreview ? '#f87171' : '#c084fc',
                    border: isPlayingPreview ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {isPlayingPreview ? '⏸ Pause 30s Preview' : '▶ Play 30s Preview'}
                </button>
              )}

              {/* Select Target Playlist */}
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', color: '#a1a1aa', marginBottom: '3px' }}>Target Spotify Playlist:</div>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  onPointerDown={stopPointer}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '5px 6px',
                    fontSize: '11px',
                    outline: 'none',
                  }}
                >
                  <option value="clipper_tracks_default">🎧 Clipper Tracks (Default)</option>
                  <option value="liked">❤️ Liked Songs Library</option>
                  {musicPlaylists.filter(p => p.id !== 'clipper_tracks_default' && p.id !== 'liked').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Add to Playlist Action Button */}
              <button
                type="button"
                disabled={addingToPlaylist || addedSuccess}
                onClick={handleAddTrackToSpotify}
                onPointerDown={stopPointer}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: addedSuccess ? '#065f46' : '#10b981',
                  color: addedSuccess ? '#6ee7b7' : '#042f2e',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: addingToPlaylist ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {addingToPlaylist ? 'Adding to Spotify...' : addedSuccess ? '✓ Added to Spotify Playlist!' : '+ Add to Spotify Playlist'}
              </button>

              <button
                type="button"
                onClick={() => { setIdentifiedTrack(null); handleIdentifyMusic(); }}
                onPointerDown={stopPointer}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '10px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center',
                  marginTop: '6px',
                }}
              >
                🔄 Listen again
              </button>
            </div>
          )}

          {/* Idle / Error State */}
          {!isListening && !identifiedTrack && (
            <div>
              {recognizeError && (
                <div style={{ fontSize: '11px', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px 8px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  ⚠️ {recognizeError}
                </div>
              )}

              <button
                type="button"
                onClick={handleIdentifyMusic}
                onPointerDown={stopPointer}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  color: '#34d399',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🎧</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#6ee7b7' }}>Listen & Identify Song</div>
                  <div style={{ fontSize: '10px', color: '#a7f3d0' }}>Samples 5s tab audio & finds Spotify track</div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
