import React, { useEffect, useMemo, useState } from 'react';
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
  };
};

type OpportunitySource = 'none' | 'known-site' | 'content-signals';

type SelectionAnchor = {
  top: number;
  left: number;
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
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'netflix.com',
  'gmail.com',
  'mail.google.com',
  'reddit.com',
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
  right: '16px',
  bottom: '24px',
  width: 'auto',
  zIndex: 2147483647,
  pointerEvents: 'none',
};

function panelStyle(state: SaveState): React.CSSProperties {
  return {
    width: '340px',
    borderRadius: '24px 0 0 24px',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRight: 'none',
    background: 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(17,24,39,0.94) 100%)',
    color: '#e5e7eb',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: 'hidden',
    opacity: state === 'collapsed' ? 0 : 1,
    transform: state === 'collapsed' ? 'translateX(16px) scale(0.96)' : 'translateX(0) scale(1)',
    transition: 'transform 220ms ease, opacity 220ms ease',
    pointerEvents: 'auto',
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
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'rgba(15, 23, 42, 0.62)',
    border: `1px solid ${borderColor || 'rgba(148,163,184,0.12)'}`,
  };
}

function selectionBubbleStyle(anchor: SelectionAnchor | null): React.CSSProperties {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const bubbleWidth = 320;
  const left = anchor ? Math.min(Math.max(anchor.left, 12), Math.max(12, viewportWidth - bubbleWidth - 12)) : 12;
  const top = anchor ? Math.max(12, anchor.top - 64) : 12;

  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    maxWidth: `${bubbleWidth}px`,
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(15,23,42,0.96) 100%)',
    color: '#f8fafc',
    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.36)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    pointerEvents: 'auto',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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

  const currentUrl = useMemo(() => window.location.href, []);
  const pageTitle = useMemo(() => document.title || 'This page', []);

  useEffect(() => {
    if (isBlockedPage()) {
      return;
    }

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
  }, [state]);

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
      },
    };

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
    ? selectedText.length > 140
      ? `${selectedText.slice(0, 140)}...`
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

  return (
    <>
      {hasSelection ? (
        <button
          type="button"
          onClick={saveClip}
          style={selectionBubbleStyle(selectionAnchor)}
          aria-label="Save to Clipper"
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '999px', background: 'rgba(168,85,247,0.18)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>＋</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600, letterSpacing: '0.02em' }}>Text selected</div>
            <div style={{ fontSize: '13px', color: '#f8fafc', lineHeight: 1.35, marginTop: '2px', wordBreak: 'break-word' }}>
              {summary}
            </div>
          </div>
          <div style={{ border: 'none', borderRadius: '14px', padding: '10px 12px', background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', color: '#fff', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Save to Clipper
          </div>
        </button>
      ) : null}

      {shouldShowDock && state === 'collapsed' && !hasSelection ? (
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={opportunitySource === 'none' ? 'Open save panel' : primaryLabel}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '24px',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: '999px',
            padding: '12px 16px',
            background: opportunitySource === 'known-site'
              ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
              : opportunitySource === 'content-signals'
                ? 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                : 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            color: '#f8fafc',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.28)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.03em',
            pointerEvents: 'auto',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>＋</span>
          <span>{primaryLabel}</span>
        </button>
      ) : null}

      {state !== 'collapsed' ? (
      <div style={panelStyle(state)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 16px 10px 18px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', lineHeight: 1.1, fontWeight: 750, letterSpacing: '-0.03em' }}>Save page</h2>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.72)', fontSize: '12px', lineHeight: 1.45 }}>
              {hasSelection
                ? 'Selected text will be saved with this clip.'
                : opportunitySource === 'known-site'
                  ? 'This page looks like a job or opportunity.'
                  : opportunitySource === 'content-signals'
                    ? 'This page contains opportunity signals.'
                    : 'Store the current page in your Django clip feed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleExpanded}
            aria-label="Collapse save panel"
            style={{
              border: '1px solid rgba(148,163,184,0.18)',
              borderRadius: '14px',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.55)',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '40px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '0 16px 16px 18px', display: 'grid', gap: '12px' }}>
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

          {error ? (
            <div style={statusLineStyle('rgba(248,113,113,0.24)')}>
              <div style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</div>
            </div>
          ) : null}

          {state === 'done' && result ? (
            <div style={statusLineStyle('rgba(45,212,191,0.3)')}>
              <div style={{ color: '#99f6e4', fontSize: '13px', fontWeight: 700 }}>
                Saved {result.duplicate ? 'as a duplicate' : 'successfully'}.
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={saveClip}
              disabled={state === 'saving'}
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