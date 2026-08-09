// ─── Selection Mini-Panel Component (Mode 1 & Mode 2, Draggable & Resizable) ───

import React, { useEffect, useRef, useState } from 'react';
import {
  BACK_ARROW_SVG,
  C,
  CLIPPER_LOGO_12,
  GEAR_SVG,
  PROVIDER_ICONS,
} from '../lib/constants';
import {
  Destination,
  getAirtableTables,
  getConnectedDestinations,
  getDefaultDestination,
  getNotionDatabases,
  setDefaultDestination,
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

// Default available destination templates if none stored in Chrome storage
const DEFAULT_PROVIDER_LIST: Destination[] = [
  { type: 'google_sheets', name: 'Google Sheets', tableId: 'sheets_default', tableName: 'My Clips', icon: '📊' },
  { type: 'notion', name: 'Notion', tableId: 'notion_default', tableName: 'Reading list database', icon: '📝' },
  { type: 'airtable', name: 'Airtable', tableId: 'airtable_default', tableName: 'Content tracker', icon: '🗂️' },
];

export function SelectionPanel({
  text,
  url,
  position,
  onClose,
  contentType,
  source = 'text_selection',
}: SelectionPanelProps) {
  const [mode, setMode] = useState<'quick' | 'configure'>('quick');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Position and Size state for Drag & Resize
  const [pos, setPos] = useState({ left: position.left, top: position.top });
  const [panelWidth, setPanelWidth] = useState(240);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startLeft: number; startTop: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ edge: ResizeEdge; pointerId: number; startX: number; startY: number; startWidth: number; startLeft: number; startTop: number } | null>(null);

  // Destination state
  const [defaultDest, setDefaultDest] = useState<Destination | null>(null);
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>(DEFAULT_PROVIDER_LIST);
  const [selectedDest, setSelectedDest] = useState<Destination>(DEFAULT_PROVIDER_LIST[0]);

  // Mode 2 specific state
  const [sheetsTab, setSheetsTab] = useState('Sheet1');
  const [notionDbs, setNotionDbs] = useState<Array<{ id: string; name: string }>>([
    { id: 'notion_default', name: 'Reading list database' },
    { id: 'notion_jobs', name: 'Job Applications' },
    { id: 'notion_events', name: 'Events & Conferences' },
  ]);
  const [selectedNotionDb, setSelectedNotionDb] = useState('notion_default');
  const [airtableTables, setAirtableTables] = useState<Array<{ baseId: string; baseName: string; tableId: string; tableName: string }>>([
    { baseId: 'base1', baseName: 'Clipper Base', tableId: 'airtable_default', tableName: 'Content tracker' },
    { baseId: 'base1', baseName: 'Clipper Base', tableId: 'tbl_opportunities', tableName: 'Opportunities' },
  ]);
  const [selectedAirtableTable, setSelectedAirtableTable] = useState('airtable_default');
  const [remember, setRemember] = useState(true);

  // Save execution state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync position prop
  useEffect(() => {
    setPos({ left: position.left, top: position.top });
  }, [position.left, position.top]);

  // Detect dark mode
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Load storage state on mount
  useEffect(() => {
    getDefaultDestination().then((dest) => {
      if (dest) {
        setDefaultDest(dest);
        setSelectedDest(dest);
        if (dest.type === 'google_sheets' && dest.tableName) {
          setSheetsTab(dest.tableName);
        }
      }
    });

    getConnectedDestinations().then((storedList) => {
      if (storedList && storedList.length > 0) {
        setAvailableDestinations(storedList);
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
  }, []);

  // Handle escape key and shadow-DOM friendly click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (dragRef.current || resizeRef.current) return;
      const path = e.composedPath ? e.composedPath() : [];
      const isInside = path.some(
        (el: any) => el.getAttribute && el.getAttribute('data-clipper-panel') !== null
      );
      if (!isInside) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
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
          const nextLeft = Math.max(12, Math.min(dragRef.current.startLeft + dx, window.innerWidth - panelWidth - 12));
          const nextTop = Math.max(12, Math.min(dragRef.current.startTop + dy, window.innerHeight - 80));
          setPos({ left: nextLeft, top: nextTop });
        }
      }

      if (resizeRef.current && e.pointerId === resizeRef.current.pointerId) {
        const rs = resizeRef.current;
        const dx = e.clientX - rs.startX;
        let newWidth = rs.startWidth;
        let newLeft = rs.startLeft;

        if (rs.edge.includes('e')) {
          newWidth = Math.max(220, Math.min(450, rs.startWidth + dx));
        }
        if (rs.edge.includes('w')) {
          const proposed = Math.max(220, Math.min(450, rs.startWidth - dx));
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
    e.preventDefault();
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

  // Handle Quick Save
  const handleQuickSave = async () => {
    if (saveStatus === 'saving' || saveStatus === 'saved') return;
    setSaveStatus('saving');

    const destinationToUse = defaultDest || selectedDest || DEFAULT_PROVIDER_LIST[0];

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url,
        selectedText: text,
        contentType: contentType || null,
        destination: destinationToUse,
        source: source || 'text_selection',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, (_res: any) => {
        setSaveStatus('saved');
        setTimeout(onClose, 1200);
      });
    } else {
      setSaveStatus('saved');
      setTimeout(onClose, 1200);
    }
  };

  // Handle Configured Save
  const handleConfiguredSave = async () => {
    if (saveStatus === 'saving' || saveStatus === 'saved') return;
    setSaveStatus('saving');

    let finalTableName = selectedDest.tableName || 'Sheet1';
    let finalTableId = selectedDest.tableId || 'default';

    if (selectedDest.type === 'google_sheets') {
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

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url,
        selectedText: text,
        contentType: contentType || null,
        destination: updatedDest,
        tableId: finalTableId,
        source: 'text_selection_configured',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, () => {
        setSaveStatus('saved');
        setTimeout(onClose, 1200);
      });
    } else {
      setSaveStatus('saved');
      setTimeout(onClose, 1200);
    }
  };

  const previewText = text ? (text.length > 60 ? text.slice(0, 60) + '…' : text) : 'Current webpage';

  // Dynamic theme colors
  const bg = isDarkMode ? C.bgDark : C.white;
  const textColor = isDarkMode ? '#f8fafc' : C.textPrimary;
  const subTextColor = isDarkMode ? '#cbd5e1' : C.textSecondary;
  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.14)' : C.border;
  const surfaceBg = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : C.surfaceLight;

  // ─── Inline styles ───
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    width: `${panelWidth}px`,
    backgroundColor: bg,
    border: `0.5px solid ${borderColor}`,
    borderRadius: '10px',
    boxShadow: isDragging || isResizing ? '0 12px 32px rgba(0, 0, 0, 0.22)' : '0 4px 20px rgba(0, 0, 0, 0.12)',
    zIndex: 2147483647,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '10px',
    color: textColor,
    boxSizing: 'border-box',
    animation: isDragging ? 'none' : 'clipperFadeScale 0.15s ease-out forwards',
    pointerEvents: 'auto',
    userSelect: isDragging || isResizing ? 'none' : 'auto',
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
    fontWeight: 600,
    color: textColor,
  };

  const iconBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease',
  };

  const textPreviewStyle: React.CSSProperties = {
    fontSize: '12px',
    color: isDarkMode ? '#94a3b8' : C.textMuted,
    fontStyle: 'italic',
    backgroundColor: surfaceBg,
    borderRadius: '6px',
    padding: '6px 8px',
    marginBottom: '8px',
    wordBreak: 'break-word',
    lineHeight: '1.3',
  };

  const destRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: C.textFaint,
    marginBottom: '10px',
  };

  const saveBtnStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: saveStatus === 'saved' ? C.successBg : C.violetPrimary,
    color: saveStatus === 'saved' ? C.successGreen : C.white,
    borderRadius: '8px',
    padding: '9px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const stopPointer = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div data-clipper-panel style={panelStyle} onClick={(e) => e.stopPropagation()}>
      <style>{`
        @keyframes clipperFadeScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1.0); }
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

      {mode === 'quick' ? (
        // ─── MODE 1: Quick Save ───
        <div>
          <div style={headerStyle} onPointerDown={beginDrag}>
            <div style={titleStyle}>
              <span style={{ fontSize: '13px', color: C.textFaint }}>⋮⋮</span>
              <span dangerouslySetInnerHTML={{ __html: CLIPPER_LOGO_12 }} />
              <span>Clipper</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                style={iconBtnStyle}
                onPointerDown={stopPointer}
                onMouseDown={stopPointer}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setMode('configure');
                }}
                aria-label="Configure save destination"
                title="Configure"
                dangerouslySetInnerHTML={{ __html: GEAR_SVG }}
              />
              <button
                type="button"
                style={{ ...iconBtnStyle, fontSize: '14px', lineHeight: 1, color: C.textFaint }}
                onPointerDown={stopPointer}
                onMouseDown={stopPointer}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClose();
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div style={textPreviewStyle}>"{previewText}"</div>

          <div style={destRowStyle}>
            <span>Saving to:</span>
            <span style={{ color: subTextColor, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{PROVIDER_ICONS[selectedDest?.type || 'google_sheets'] || '📊'}</span>
              <span>{selectedDest?.tableName || selectedDest?.name || 'Google Sheets'}</span>
            </span>
          </div>

          <button type="button" style={saveBtnStyle} onClick={handleQuickSave}>
            {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving…' : 'Save now'}
          </button>
        </div>
      ) : (
        // ─── MODE 2: Configure ───
        <div>
          <div style={headerStyle} onPointerDown={beginDrag}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: C.textFaint }}>⋮⋮</span>
              <button
                type="button"
                style={{ ...iconBtnStyle, gap: '4px', fontSize: '11px', color: C.textFaint }}
                onPointerDown={stopPointer}
                onMouseDown={stopPointer}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setMode('quick');
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: BACK_ARROW_SVG }} />
                <span>back</span>
              </button>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: textColor }}>Configure save</span>
          </div>

          <div style={{ fontSize: '11px', color: C.textFaint, marginBottom: '6px' }}>Save to:</div>

          {/* Destination options list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px', maxHeight: '150px', overflowY: 'auto' }}>
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
                    padding: '8px 8px',
                    borderRadius: '6px',
                    borderLeft: isSelected ? `3px solid ${C.violetPrimary}` : '3px solid transparent',
                    backgroundColor: isSelected ? (isDarkMode ? 'rgba(124,58,237,0.2)' : C.lavenderBg) : surfaceBg,
                    cursor: 'pointer',
                    borderBottom: `0.5px solid ${borderColor}`,
                  }}
                >
                  <input
                    type="radio"
                    name="clipper_dest"
                    checked={isSelected}
                    onChange={() => setSelectedDest(d)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '16px' }}>{PROVIDER_ICONS[d.type] || d.icon || '📊'}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: C.textFaint }}>{d.tableName || 'Default target'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Table / Database Input Selector */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: C.textFaint, marginBottom: '4px' }}>Save to table / database:</div>
            {selectedDest.type === 'google_sheets' ? (
              <input
                type="text"
                value={sheetsTab}
                onChange={(e) => setSheetsTab(e.target.value)}
                onPointerDown={stopPointer}
                placeholder="Sheet1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${borderColor}`,
                  boxSizing: 'border-box',
                  backgroundColor: surfaceBg,
                  color: textColor,
                }}
              />
            ) : selectedDest.type === 'notion' ? (
              <select
                value={selectedNotionDb}
                onChange={(e) => setSelectedNotionDb(e.target.value)}
                onPointerDown={stopPointer}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: surfaceBg,
                  color: textColor,
                }}
              >
                {notionDbs.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedAirtableTable}
                onChange={(e) => setSelectedAirtableTable(e.target.value)}
                onPointerDown={stopPointer}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: surfaceBg,
                  color: textColor,
                }}
              >
                {airtableTables.map((t) => (
                  <option key={t.tableId} value={t.tableId}>
                    {t.tableName} ({t.baseName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Remember Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: subTextColor,
              marginBottom: '10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              onPointerDown={stopPointer}
              style={{ margin: 0 }}
            />
            <span>Remember this choice</span>
          </label>

          <button type="button" style={saveBtnStyle} onClick={handleConfiguredSave} onPointerDown={stopPointer}>
            {saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'saving' ? 'Saving…' : 'Save with this config'}
          </button>
        </div>
      )}
    </div>
  );
}
