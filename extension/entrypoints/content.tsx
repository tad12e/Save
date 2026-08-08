import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

declare const chrome: any;

type SaveState = 'collapsed' | 'expanded' | 'saving' | 'done';

type SaveClipResponse = {
  id: string;
  url: string;
  selected_text: string;
  status: string;
  duplicate: boolean;
};

type SaveClipMessage = {
  type: 'SAVE_CLIP';
  payload: {
    url: string;
    selected_text: string;
    destination_id?: string | null;
  };
};

type DestinationOption = {
  id: string;
  name: string;
  provider: string;
  is_default: boolean;
};

type OpportunitySource = 'none' | 'known-site' | 'content-signals';

type SelectionAnchor = {
  top: number;
  left: number;
};

type WidgetPosition = {
  left: number;
  top: number;
};

type WidgetSize = {
  width: number;
  height: number;
};

type DragMode = 'dock' | 'panel' | 'selection';

type DragState = {
  mode: DragMode;
  pointerId: number;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  moved: boolean;
};

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
type ResizeTarget = 'panel' | 'selection';

type ResizeState = {
  target: ResizeTarget;
  edge: ResizeEdge;
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
};

const ALWAYS_SHOW_SITES = [
  'linkedin.com',
  'greenhouse.io',
  'lever.co',
  'jobs.ashbyhq.com',
  'wellfound.com',
  'indeed.com',
  'glassdoor.com',
  'workatastartup.com',
  'remote.co',
  'weworkremotely.com',
  'upwork.com',
  'fiverr.com',
  'toptal.com',
  'contra.com',
  'opportunitydesk.org',
  'scholarshipportal.com',
  'eventbrite.com',
  'luma.com',
  'meetup.com',
  'devpost.com',
  'ycombinator.com',
  'producthunt.com',
  'techcrunch.com',
  'arxiv.org',
  'scholar.google.com',
  'coursera.org',
  'udemy.com',
];

const NEVER_SHOW_HOSTS = [
  'localhost',
  '127.0.0.1',
  'youtube.com',
  'netflix.com',
];

const NEVER_SHOW_PATH_PREFIXES = [
  ['google.com', '/search'],
  ['amazon.com', '/'],
];

const CONTENT_SIGNALS = [
  'apply now',
  'job description',
  'we are hiring',
  'open positions',
  'deadline',
  'salary',
  'compensation',
  'register now',
  'limited spots',
  'scholarship',
  'grant',
  'funding',
  'call for applications',
  'early bird',
  'accepting applications',
];

function isBlockedPage(): boolean {
  if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
    return true;
  }

  const host = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return true;
  }

  if (NEVER_SHOW_HOSTS.some((blockedHost) => host === blockedHost || host.endsWith(`.${blockedHost}`))) {
    return true;
  }

  if (NEVER_SHOW_PATH_PREFIXES.some(([blockedHost, blockedPath]) => host.includes(blockedHost) && pathname.startsWith(blockedPath))) {
    return true;
  }

  return false;
}

function isKnownOpportunitySite(): boolean {
  const host = window.location.hostname.toLowerCase();
  return ALWAYS_SHOW_SITES.some((site) => host === site || host.endsWith(`.${site}`) || host.includes(site));
}

function bodyTextContainsSignals(): boolean {
  const bodyText = (document.body?.innerText || document.documentElement?.innerText || '').toLowerCase();
  const matches = CONTENT_SIGNALS.filter((signal) => bodyText.includes(signal));
  return matches.length >= 2;
}

function getSelectionAnchor(): SelectionAnchor | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    return null;
  }

  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  };
}

const hostStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: 'auto',
  zIndex: 2147483647,
  pointerEvents: 'none',
};

const WIDGET_POSITION_KEY = 'clipper_widget_position';
const SELECTION_POSITION_KEY = 'clipper_selection_widget_position';
const PANEL_SIZE_KEY = 'clipper_panel_size';
const SELECTION_SIZE_KEY = 'clipper_selection_size';
const WIDGET_DEFAULT_POSITION: WidgetPosition = {
  left: 24,
  top: 24,
};
const SELECTION_DEFAULT_POSITION: WidgetPosition = {
  left: 12,
  top: 12,
};

const PANEL_DEFAULT_SIZE: WidgetSize = { width: 300, height: 0 }; // height 0 = auto
const SELECTION_DEFAULT_SIZE: WidgetSize = { width: 270, height: 0 };

const PANEL_MIN_SIZE: WidgetSize = { width: 220, height: 160 };
const PANEL_MAX_SIZE: WidgetSize = { width: 500, height: 700 };
const SELECTION_MIN_SIZE: WidgetSize = { width: 180, height: 44 };
const SELECTION_MAX_SIZE: WidgetSize = { width: 500, height: 350 };

const RESIZE_HANDLE_SIZE = 8;

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

function ResizeHandles({ onResizeStart }: { onResizeStart: (event: React.PointerEvent<HTMLDivElement>, edge: ResizeEdge) => void }) {
  const edges: { edge: ResizeEdge; style: React.CSSProperties }[] = [
    // Sides
    { edge: 'n',  style: { top: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE } },
    { edge: 's',  style: { bottom: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE } },
    { edge: 'e',  style: { right: -RESIZE_HANDLE_SIZE / 2, top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, width: RESIZE_HANDLE_SIZE } },
    { edge: 'w',  style: { left: -RESIZE_HANDLE_SIZE / 2, top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, width: RESIZE_HANDLE_SIZE } },
    // Corners
    { edge: 'nw', style: { top: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2 } },
    { edge: 'ne', style: { top: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2 } },
    { edge: 'sw', style: { bottom: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2 } },
    { edge: 'se', style: { bottom: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE * 2, height: RESIZE_HANDLE_SIZE * 2 } },
  ];

  return (
    <>
      {edges.map(({ edge, style }) => (
        <div
          key={edge}
          onPointerDown={(event) => onResizeStart(event, edge)}
          style={{
            position: 'absolute',
            ...style,
            cursor: EDGE_CURSORS[edge],
            zIndex: 10,
            pointerEvents: 'auto',
            touchAction: 'none',
            // Subtle visible indicator on hover
            background: 'transparent',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(139, 92, 246, 0.15)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        />
      ))}
    </>
  );
}

function panelOuterStyle(state: SaveState, size?: WidgetSize): React.CSSProperties {
  return {
    width: size && size.width > 0 ? `${size.width}px` : '300px',
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'min(520px, 85vh)',
    overflow: 'visible',
    opacity: state === 'collapsed' ? 0 : 1,
    transform: state === 'collapsed' ? 'translateX(16px) scale(0.96)' : 'translateX(0) scale(1)',
    transition: 'transform 220ms ease, opacity 220ms ease',
    pointerEvents: 'auto',
  };
}

function panelInnerStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    maxHeight: 'min(520px, 85vh)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(17,24,39,0.94) 100%)',
    color: '#e5e7eb',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.40)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
}

function pillStyle(state: SaveState): React.CSSProperties {
  return {
    width: '72px',
    minHeight: '68px',
    borderRadius: '999px 0 0 999px',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRight: 'none',
    background:
      state === 'done'
        ? 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)'
        : state === 'saving'
          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
          : 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    color: '#f8fafc',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.28)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    userSelect: 'none',
    padding: '0 12px 0 14px',
    transition: 'transform 180ms ease, box-shadow 180ms ease, filter 180ms ease',
    pointerEvents: 'auto',
  };
}

function statusLineStyle(borderColor?: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '9px 11px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.62)',
    border: `1px solid ${borderColor || 'rgba(148,163,184,0.12)'}`,
  };
}

function selectionBubbleBaseStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    overflow: 'visible',
    pointerEvents: 'auto',
    touchAction: 'none',
    transition: 'box-shadow 180ms ease',
  };
}

function selectionBubbleInnerStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(15,23,42,0.96) 100%)',
    color: '#f8fafc',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    overflow: 'hidden',
    padding: '9px 11px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };
}

function SaveWidget() {
  const [state, setState] = useState<SaveState>('collapsed');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaveClipResponse | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionAnchor, setSelectionAnchor] = useState<SelectionAnchor | null>(null);
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [opportunitySource, setOpportunitySource] = useState<OpportunitySource>('none');
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>(WIDGET_DEFAULT_POSITION);
  const [selectionWidgetPosition, setSelectionWidgetPosition] = useState<WidgetPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [panelSize, setPanelSize] = useState<WidgetSize>(PANEL_DEFAULT_SIZE);
  const [selectionSize, setSelectionSize] = useState<WidgetSize>(SELECTION_DEFAULT_SIZE);

  const currentUrl = useMemo(() => window.location.href, []);
  const pageTitle = useMemo(() => document.title || 'This page', []);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);

  useEffect(() => {
    if (isBlockedPage()) {
      return;
    }

    try {
      const storedPosition = window.localStorage.getItem(WIDGET_POSITION_KEY);
      if (storedPosition) {
        const parsed = JSON.parse(storedPosition) as Partial<WidgetPosition>;
        if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
          setWidgetPosition({ left: parsed.left, top: parsed.top });
        }
      }

      const storedSelectionPosition = window.localStorage.getItem(SELECTION_POSITION_KEY);
      if (storedSelectionPosition) {
        const parsedSelection = JSON.parse(storedSelectionPosition) as Partial<WidgetPosition>;
        if (typeof parsedSelection.left === 'number' && typeof parsedSelection.top === 'number') {
          setSelectionWidgetPosition({ left: parsedSelection.left, top: parsedSelection.top });
        }
      }
      const storedPanelSize = window.localStorage.getItem(PANEL_SIZE_KEY);
      if (storedPanelSize) {
        const parsedSize = JSON.parse(storedPanelSize) as Partial<WidgetSize>;
        if (typeof parsedSize.width === 'number') {
          setPanelSize({ width: parsedSize.width, height: parsedSize.height || 0 });
        }
      }

      const storedSelectionSize = window.localStorage.getItem(SELECTION_SIZE_KEY);
      if (storedSelectionSize) {
        const parsedSize = JSON.parse(storedSelectionSize) as Partial<WidgetSize>;
        if (typeof parsedSize.width === 'number') {
          setSelectionSize({ width: parsedSize.width, height: parsedSize.height || 0 });
        }
      }
    } catch {
      // Ignore invalid stored positions and use default.
    }

    // Semantic vector embedding check via backend with fallback to site signals
    const pageSnippet = `${document.title} ${(document.body?.innerText || '').slice(0, 1000)}`;

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'CHECK_PAGE_RELEVANCE',
          payload: { text: pageSnippet },
        },
        (response: any) => {
          if (response?.ok && response.data?.relevant) {
            setOpportunitySource('known-site');
            return;
          }

          if (isKnownOpportunitySite()) {
            setOpportunitySource('known-site');
            return;
          }

          if (bodyTextContainsSignals()) {
            setOpportunitySource('content-signals');
          }
        }
      );
    } else {
      if (isKnownOpportunitySite()) {
        setOpportunitySource('known-site');
        return;
      }

      const timer = window.setTimeout(() => {
        if (bodyTextContainsSignals()) {
          setOpportunitySource('content-signals');
        }
      }, 1500);

      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let selectionTimer: number | undefined;

    const updateSelection = () => {
      if (selectionTimer) {
        window.clearTimeout(selectionTimer);
      }

      const text = window.getSelection()?.toString().trim() || '';

      if (!text) {
        setSelectedText('');
        setSelectionAnchor(null);
        setSelectionVisible(false);
        return;
      }

      const anchor = getSelectionAnchor();

      if (!anchor) {
        setSelectedText(text);
        setSelectionAnchor(null);
        setSelectionVisible(false);
        return;
      }

      selectionTimer = window.setTimeout(() => {
        setSelectedText(text);
        setSelectionAnchor(anchor);
        setSelectionVisible(true);
      }, 600);
    };

    updateSelection();
    document.addEventListener('selectionchange', updateSelection);

    return () => {
      if (selectionTimer) {
        window.clearTimeout(selectionTimer);
      }
      document.removeEventListener('selectionchange', updateSelection);
    };
  }, []);

  useEffect(() => {
    if (state === 'collapsed') return;

    chrome.runtime.sendMessage({ type: 'GET_DESTINATIONS' }, (response: any) => {
      if (!response?.ok || !Array.isArray(response.data)) return;

      setDestinations(response.data);
      const storedId = window.localStorage.getItem('clipper_last_destination_id');
      const storedMatch = response.data.find((item: DestinationOption) => item.id === storedId);
      const defaultDestination = response.data.find((item: DestinationOption) => item.is_default);
      setSelectedDestinationId(storedMatch?.id || defaultDestination?.id || response.data[0]?.id || '');
    });
  }, [state]);

  useEffect(() => {
    if (state !== 'done') return;

    const timer = window.setTimeout(() => {
      setState('collapsed');
      setError(null);
      setResult(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isDragging || isResizing) return;
      if (state === 'collapsed') return;
      const target = event.target as Node | null;
      if (!target) return;

      if (widgetHostRef.current && !widgetHostRef.current.contains(target)) {
        setState('collapsed');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setState('collapsed');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [state, isDragging, isResizing]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDGET_POSITION_KEY, JSON.stringify(widgetPosition));
    } catch {
      // Ignore storage failures.
    }
  }, [widgetPosition]);

  useEffect(() => {
    if (!selectionWidgetPosition) return;

    try {
      window.localStorage.setItem(SELECTION_POSITION_KEY, JSON.stringify(selectionWidgetPosition));
    } catch {
      // Ignore storage failures.
    }
  }, [selectionWidgetPosition]);

  // Persist panel size
  useEffect(() => {
    try {
      window.localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(panelSize));
    } catch {
      // Ignore storage failures.
    }
  }, [panelSize]);

  // Persist selection size
  useEffect(() => {
    try {
      window.localStorage.setItem(SELECTION_SIZE_KEY, JSON.stringify(selectionSize));
    } catch {
      // Ignore storage failures.
    }
  }, [selectionSize]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) return;

      const dragState = dragStateRef.current;
      if (event.pointerId !== dragState.pointerId) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      const movedEnough = Math.hypot(deltaX, deltaY) > 6;

      if (!dragState.moved && !movedEnough) {
        return;
      }

      if (!dragState.moved) {
        dragState.moved = true;
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Use element-specific dimensions for clamping
      const isSelection = dragState.mode === 'selection';
      const widgetWidth = isSelection ? 320 : 340;
      const widgetHeight = isSelection ? 80 : 220;

      const nextLeft = dragState.startLeft + deltaX;
      const nextTop = dragState.startTop + deltaY;

      const clampedLeft = Math.max(12, Math.min(nextLeft, viewportWidth - widgetWidth - 12));
      const clampedTop = Math.max(12, Math.min(nextTop, viewportHeight - widgetHeight - 12));

      if (dragState.mode === 'selection') {
        setSelectionWidgetPosition({ left: clampedLeft, top: clampedTop });
      } else {
        setWidgetPosition({ left: clampedLeft, top: clampedTop });
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragStateRef.current) return;

      const dragState = dragStateRef.current;
      if (event.pointerId !== dragState.pointerId) return;

      dragStateRef.current = null;
      const wasDragging = dragState.moved;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (!wasDragging && dragState.mode === 'dock') {
        toggleExpanded();
      } else if (!wasDragging && dragState.mode === 'selection') {
        saveClip();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // ── Resize pointer handlers ──
  useEffect(() => {
    const handleResizeMove = (event: PointerEvent) => {
      if (!resizeStateRef.current) return;
      const rs = resizeStateRef.current;
      if (event.pointerId !== rs.pointerId) return;

      const deltaX = event.clientX - rs.startX;
      const deltaY = event.clientY - rs.startY;

      const minSize = rs.target === 'panel' ? PANEL_MIN_SIZE : SELECTION_MIN_SIZE;
      const maxSize = rs.target === 'panel' ? PANEL_MAX_SIZE : SELECTION_MAX_SIZE;

      let newWidth = rs.startWidth;
      let newHeight = rs.startHeight;
      let newLeft = rs.startLeft;
      let newTop = rs.startTop;
      const edge = rs.edge;

      // East edges expand width
      if (edge.includes('e')) {
        newWidth = Math.max(minSize.width, Math.min(maxSize.width, rs.startWidth + deltaX));
      }
      // West edges expand width and shift left
      if (edge.includes('w')) {
        const proposedWidth = Math.max(minSize.width, Math.min(maxSize.width, rs.startWidth - deltaX));
        newLeft = rs.startLeft + (rs.startWidth - proposedWidth);
        newWidth = proposedWidth;
      }
      // South edges expand height
      if (edge === 's' || edge === 'se' || edge === 'sw') {
        newHeight = Math.max(minSize.height, Math.min(maxSize.height, rs.startHeight + deltaY));
      }
      // North edges expand height and shift top
      if (edge === 'n' || edge === 'ne' || edge === 'nw') {
        const proposedHeight = Math.max(minSize.height, Math.min(maxSize.height, rs.startHeight - deltaY));
        newTop = rs.startTop + (rs.startHeight - proposedHeight);
        newHeight = proposedHeight;
      }

      // Clamp to viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      newLeft = Math.max(0, Math.min(newLeft, viewportWidth - newWidth));
      newTop = Math.max(0, Math.min(newTop, viewportHeight - 60));

      if (!isResizing) {
        setIsResizing(true);
        document.body.style.userSelect = 'none';
      }

      if (rs.target === 'panel') {
        setPanelSize({ width: newWidth, height: newHeight });
        setWidgetPosition({ left: newLeft, top: newTop });
      } else {
        setSelectionSize({ width: newWidth, height: newHeight });
        setSelectionWidgetPosition({ left: newLeft, top: newTop });
      }
    };

    const handleResizeUp = (event: PointerEvent) => {
      if (!resizeStateRef.current) return;
      if (event.pointerId !== resizeStateRef.current.pointerId) return;
      resizeStateRef.current = null;
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeUp);

    return () => {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeUp);
    };
  }, [isResizing]);

  const beginResize = (event: React.PointerEvent<HTMLElement>, edge: ResizeEdge, target: ResizeTarget) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();

    const el = event.currentTarget as HTMLElement;
    // Walk up to find the resizable container
    const container = el.closest('[data-resizable]') as HTMLElement | null;
    const rect = container?.getBoundingClientRect();

    const currentSize = target === 'panel' ? panelSize : selectionSize;
    const currentPos = target === 'panel'
      ? widgetPosition
      : selectionWidgetPosition || {
          left: Math.min(Math.max(selectionAnchor?.left || SELECTION_DEFAULT_POSITION.left, 12), Math.max(12, window.innerWidth - 320 - 12)),
          top: Math.max(12, (selectionAnchor?.top || SELECTION_DEFAULT_POSITION.top) - 64),
        };

    resizeStateRef.current = {
      target,
      edge,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect?.width || currentSize.width,
      startHeight: rect?.height || currentSize.height || 200,
      startLeft: currentPos.left,
      startTop: currentPos.top,
    };

    el.setPointerCapture(event.pointerId);
    document.body.style.cursor = EDGE_CURSORS[edge];
  };

  const beginDrag = (event: React.PointerEvent<HTMLElement>, mode: DragMode) => {
    if (event.button !== 0) return;
    const target = event.currentTarget as HTMLElement;

    const basePosition =
      mode === 'selection'
        ? selectionWidgetPosition || {
            left: Math.min(
              Math.max(selectionAnchor?.left || SELECTION_DEFAULT_POSITION.left, 12),
              Math.max(12, window.innerWidth - 320 - 12),
            ),
            top: Math.max(12, (selectionAnchor?.top || SELECTION_DEFAULT_POSITION.top) - 64),
          }
        : widgetPosition;

    dragStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: basePosition.left,
      startTop: basePosition.top,
      moved: false,
    };

    target.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const resetWidgetPosition = () => {
    setWidgetPosition(WIDGET_DEFAULT_POSITION);
    setPanelSize(PANEL_DEFAULT_SIZE);
    setSelectionWidgetPosition(null);
    setSelectionSize(SELECTION_DEFAULT_SIZE);
  };

  const toggleExpanded = () => {
    setError(null);
    setResult(null);
    setState((current) => (current === 'collapsed' ? 'expanded' : 'collapsed'));
  };

  const saveClip = async () => {
    setState('saving');
    setError(null);

    const payload: SaveClipMessage = {
      type: 'SAVE_CLIP',
      payload: {
        url: window.location.href,
        selected_text: selectedText,
        destination_id: selectedDestinationId || null,
      },
    };

    if (selectedDestinationId) {
      window.localStorage.setItem('clipper_last_destination_id', selectedDestinationId);
    }

    try {
      const response = await chrome.runtime.sendMessage(payload);
      if (!response?.ok) {
        throw new Error(response?.error || 'Unable to save this page.');
      }

      setResult(response.data as SaveClipResponse);
      setState('done');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to save this page.';
      setError(message);
      setState('expanded');
    }
  };

  const summary = selectedText
    ? selectedText.length > 90
      ? `${selectedText.slice(0, 90)}...`
      : selectedText
    : 'No text selected. The full page URL will be saved.';
  const hasSelection = selectionVisible && selectedText.length > 0;
  const shouldShowDock = opportunitySource !== 'none' || hasSelection || state !== 'collapsed';
  const primaryLabel = hasSelection
    ? 'Save to Clipper'
    : opportunitySource === 'known-site'
      ? 'Save this job'
      : opportunitySource === 'content-signals'
        ? 'Save this page'
        : 'Clipper';

  // Use the dragged position if available, otherwise compute from selection anchor
  const selectionPosition: WidgetPosition = selectionWidgetPosition
    ? selectionWidgetPosition
    : {
        left: Math.min(
          Math.max(selectionAnchor?.left || SELECTION_DEFAULT_POSITION.left, 12),
          Math.max(12, window.innerWidth - 320 - 12),
        ),
        top: Math.max(12, (selectionAnchor?.top || SELECTION_DEFAULT_POSITION.top) - 64),
      };

  return (
    <>
      {hasSelection ? (
        <div
          data-resizable
          style={{
            ...selectionBubbleBaseStyle(),
            left: `${selectionPosition.left}px`,
            top: `${selectionPosition.top}px`,
            width: `${selectionSize.width}px`,
            height: selectionSize.height > 0 ? `${selectionSize.height}px` : 'auto',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: isDragging || isResizing
              ? '0 28px 60px rgba(15, 23, 42, 0.48)'
              : '0 20px 48px rgba(15, 23, 42, 0.36)',
          }}
          onPointerDown={(event) => beginDrag(event, 'selection')}
        >
          <ResizeHandles onResizeStart={(event, edge) => beginResize(event, edge, 'selection')} />
          <div style={selectionBubbleInnerStyle()}>
            <div style={{ width: '36px', height: '36px', borderRadius: '999px', background: 'rgba(168,85,247,0.18)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, flexShrink: 0, pointerEvents: 'none', letterSpacing: '-0.12em' }}>⋮⋮</div>
            <div style={{ minWidth: 0, flex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600, letterSpacing: '0.02em' }}>Text selected</div>
              <div style={{ fontSize: '13px', color: '#f8fafc', lineHeight: 1.35, marginTop: '2px', wordBreak: 'break-word', overflow: 'hidden' }}>
                {summary}
              </div>
            </div>
            <button
              type="button"
              onClick={saveClip}
              onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
              style={{ border: 'none', borderRadius: '14px', padding: '10px 12px', background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', color: '#fff', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', pointerEvents: 'auto', flexShrink: 0 }}
            >
              Save to Clipper
            </button>
          </div>
        </div>
      ) : null}

      {shouldShowDock && state === 'collapsed' && !hasSelection ? (
        <div
          style={{
            position: 'fixed',
            left: `${widgetPosition.left}px`,
            top: `${widgetPosition.top}px`,
            pointerEvents: 'auto',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onPointerDown={(event) => beginDrag(event, 'dock')}
            aria-label={opportunitySource === 'none' ? 'Open save panel' : primaryLabel}
            style={{
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: '999px',
              padding: '12px 16px',
              background: opportunitySource === 'known-site'
                ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
                : opportunitySource === 'content-signals'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                  : 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              color: '#f8fafc',
              boxShadow: isDragging ? '0 24px 50px rgba(15, 23, 42, 0.36)' : '0 18px 40px rgba(15, 23, 42, 0.28)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily:
                'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              touchAction: 'none',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1, letterSpacing: '-0.12em' }}>⋮⋮</span>
            <span>{primaryLabel}</span>
          </button>
          <button
            type="button"
            onClick={resetWidgetPosition}
            aria-label="Reset widget position"
            title="Reset position"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(15, 23, 42, 0.82)',
              color: '#e2e8f0',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.22)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              pointerEvents: 'auto',
            }}
          >
            ↺
          </button>
        </div>
      ) : null}

      {state !== 'collapsed' ? (
      <div
        data-resizable
        style={{
          ...panelOuterStyle(state, panelSize),
          position: 'fixed',
          left: `${widgetPosition.left}px`,
          top: `${widgetPosition.top}px`,
          zIndex: 2147483647,
          height: panelSize.height > 0 ? `${panelSize.height}px` : 'auto',
        }}
      >
        <ResizeHandles onResizeStart={(event, edge) => beginResize(event, edge, 'panel')} />
        <div style={panelInnerStyle()}>
          <div
            onPointerDown={(event) => beginDrag(event, 'panel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '12px 14px 8px 14px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              flexShrink: 0,
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', lineHeight: 1.1, fontWeight: 750, letterSpacing: '-0.02em' }}>Save page</h2>
              <p style={{ margin: '2px 0 0 0', color: 'rgba(226,232,240,0.72)', fontSize: '11px', lineHeight: 1.35 }}>
                {hasSelection
                  ? 'Selected text will be saved with this clip.'
                  : opportunitySource === 'known-site'
                    ? 'This page looks like an opportunity.'
                    : opportunitySource === 'content-signals'
                      ? 'This page contains opportunity signals.'
                      : 'Store this page in your Clipper feed.'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleExpanded}
              aria-label="Collapse save panel"
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                border: '1px solid rgba(148,163,184,0.18)',
                borderRadius: '10px',
                padding: '6px 9px',
                background: 'rgba(15, 23, 42, 0.55)',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '32px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '0 14px 14px 14px', display: 'grid', gap: '9px', overflow: 'hidden auto', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '8px 12px', background: 'rgba(148,163,184,0.12)', color: '#e2e8f0', fontSize: '12px', lineHeight: 1.35, border: '1px solid rgba(148,163,184,0.14)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pageTitle}>
              <span style={{ color: '#f59e0b', fontWeight: 800 }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{pageTitle}</span>
            </div>

            <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '7px 10px', background: state === 'done' ? 'rgba(16,185,129,0.16)' : 'rgba(124,58,237,0.16)', color: state === 'done' ? '#a7f3d0' : '#d8b4fe', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)' }}>
              <span>{state === 'done' ? 'Saved' : 'Clipper ready'}</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{hasSelection ? 'Selection' : 'Page'}</span>
            </div>

            <div style={statusLineStyle()}>
              <div style={{ fontSize: '12px', color: '#94a3b8', minWidth: '56px' }}>URL</div>
              <div style={{ fontSize: '13px', color: '#f8fafc', wordBreak: 'break-word' }}>{currentUrl}</div>
            </div>

            <div style={statusLineStyle()}>
              <div style={{ fontSize: '12px', color: '#94a3b8', minWidth: '56px' }}>Text</div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.45 }}>{summary}</div>
            </div>

            {destinations.length > 0 ? (
              <div style={statusLineStyle()}>
                <div style={{ fontSize: '12px', color: '#94a3b8', minWidth: '56px' }}>Send to</div>
                <select
                  value={selectedDestinationId}
                  onChange={(event) => setSelectedDestinationId(event.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: '1px solid rgba(148,163,184,0.18)',
                    background: 'rgba(15, 23, 42, 0.55)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    fontSize: '13px',
                  }}
                >
                  <option value="">✨ AI Auto-Route (Recommended)</option>
                  {destinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name} ({destination.provider === 'notion' ? 'Notion' : 'Google Sheets'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={statusLineStyle()}>
                <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  No destination configured yet. Add Notion or Google Sheets in the extension popup settings.
                </div>
              </div>
            )}

            {error ? (
              <div style={statusLineStyle('rgba(248,113,113,0.24)')}>
                <div style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</div>
              </div>
            ) : null}

            {state === 'done' && result ? (
              <div style={statusLineStyle('rgba(45,212,191,0.3)')}>
                <div style={{ color: '#99f6e4', fontSize: '13px', fontWeight: 700 }}>
                  Saved {result.duplicate ? 'as a duplicate' : 'successfully'}. Summarizing and exporting in the background.
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={saveClip}
                disabled={state === 'saving'}
                onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  background:
                    state === 'saving'
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.55) 0%, rgba(37,99,235,0.55) 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  color: '#fff7ed',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: state === 'saving' ? 'wait' : 'pointer',
                  boxShadow: '0 12px 24px rgba(249, 115, 22, 0.22)',
                }}
              >
                {state === 'saving' ? 'Saving…' : primaryLabel}
              </button>
              <button
                type="button"
                onClick={() => setState('collapsed')}
                onPointerDown={(event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation()}
                style={{
                  border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </>
  );
}

const widgetHostRef: { current: HTMLDivElement | null } = { current: null };

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    if (widgetHostRef.current) return;

    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');

    Object.assign(host.style, hostStyle);
    shadowRoot.appendChild(mountPoint);
    document.documentElement.appendChild(host);

    widgetHostRef.current = host;
    (window as typeof window & { __saveWidgetHostRef?: HTMLDivElement }).__saveWidgetHostRef = host;

    createRoot(mountPoint).render(<SaveWidget />);
  },
});