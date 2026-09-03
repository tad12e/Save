// ─── Floating Button + Selection Panel & Alt+S Global Shortcut Content Script ───

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { FloatingButton } from '../components/FloatingButton';
import { SelectionPanel } from '../components/SelectionPanel';
import { isBlockedUrl } from '../lib/constants';
import { getPanelPosition } from '../lib/position';

declare const chrome: any;

interface ToastState {
  show: boolean;
  title: string;
  subtitle: string;
  status: 'saving' | 'saved' | 'error';
}

function FloatingButtonOverlay() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelText, setPanelText] = useState('');
  const [panelPos, setPanelPos] = useState({ left: 100, top: 100 });
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    title: '',
    subtitle: '',
    status: 'saved',
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedTextRef = useRef<string>('');

  const showToast = (title: string, subtitle: string, status: 'saving' | 'saved' | 'error' = 'saved') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, title, subtitle, status });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  // ─── Quick save current page (Used by Floating Button & Alt+S) ───
  const handleSavePage = (source: string = 'floating_button') => {
    if (isSaved) return;
    setIsSaved(true);

    const pageTitle = document.title || window.location.hostname || 'Page';
    showToast('Saving to Clipper…', pageTitle, 'saving');

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url: window.location.href,
        title: document.title || window.location.href,
        source,
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, (response: any) => {
        if (chrome.runtime.lastError) {
          console.warn('[Clipper] Save failed:', chrome.runtime.lastError.message);
          showToast('Save Error', chrome.runtime.lastError.message || 'Check connection', 'error');
        } else {
          showToast('Saved to Clipper ✓', pageTitle, 'saved');
        }
      });
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  // ─── 1. Global Keyboard Shortcut Listener (Alt+S) on active webpage ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+S (or Option+S on macOS)
      if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        // Do not trigger if typing inside text inputs, textareas, or contentEditable editors
        const target = e.target as HTMLElement | null;
        const isEditable = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        );
        if (isEditable) return;

        e.preventDefault();
        e.stopPropagation();
        handleSavePage('keyboard_shortcut_direct');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // ─── 2. Listen for messages from background script (Alt+S via Chrome Commands) ───
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const messageListener = (message: any) => {
        if (message.type === 'SHOW_CLIPPER_TOAST') {
          showToast(
            message.data?.title || 'Saved to Clipper ✓',
            message.data?.subtitle || document.title || 'Page',
            message.data?.status || 'saved'
          );
        }
      };
      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  // ─── 3. Text selection listener ───
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const path = (e as any).composedPath ? (e as any).composedPath() : [];
      const isInsideClipper = path.some(
        (el: any) =>
          el?.id === 'clipper-floating-root' ||
          el?.id === 'clipper-feed-panel-root' ||
          el?.hasAttribute?.('data-clipper-panel')
      );
      if (isInsideClipper) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        if (!text) {
          dismissedTextRef.current = '';
          return;
        }

        if (text === dismissedTextRef.current) {
          return;
        }

        if (text.length > 0 && selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const pos = getPanelPosition(rect, 270, 300);
            setPanelText(text);
            setPanelPos(pos);
            setPanelOpen(true);
          }
        }
      }, 150);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleClosePanel = () => {
    dismissedTextRef.current = panelText;
    setPanelOpen(false);
    try {
      window.getSelection()?.removeAllRanges();
    } catch (_) {}
  };

  return (
    <>
      {/* Docked Edge Floating Button */}
      <FloatingButton
        onSavePage={() => handleSavePage('floating_button')}
        isSaved={isSaved}
      />

      {/* On-Screen Feedback Toast for Alt+S and Instant Saves */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 2147483647,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: toast.status === 'error' ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(167, 139, 250, 0.45)',
            borderRadius: '14px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(124, 58, 237, 0.25)',
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '360px',
            animation: 'clipperToastIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: toast.status === 'error' ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {toast.status === 'saving' ? '⏳' : toast.status === 'error' ? '⚠️' : '📌'}
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>{toast.title}</div>
            <div
              style={{
                fontSize: '11px',
                color: '#a1a1aa',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '260px',
                marginTop: '2px',
              }}
            >
              {toast.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Selection Popover Panel */}
      {panelOpen && (
        <SelectionPanel
          text={panelText}
          url={window.location.href}
          position={panelPos}
          contentType="text"
          source="text_selection"
          onClose={handleClosePanel}
        />
      )}
    </>
  );
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    if (isBlockedUrl()) return;

    if (document.getElementById('clipper-floating-root')) return;

    const host = document.createElement('div');
    host.id = 'clipper-floating-root';
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });

    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    mountPoint.style.pointerEvents = 'none';
    shadowRoot.appendChild(mountPoint);
    
    (document.body || document.documentElement).appendChild(host);

    createRoot(mountPoint).render(<FloatingButtonOverlay />);
    console.log('[Clipper] Floating button & Alt+S shortcut active on', window.location.hostname);
  },
});
