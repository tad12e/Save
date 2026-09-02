// ─── Floating Button + Selection Panel Content Script ───

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { FloatingButton } from '../components/FloatingButton';
import { SelectionPanel } from '../components/SelectionPanel';
import { isBlockedUrl } from '../lib/constants';
import { getPanelPosition } from '../lib/position';

declare const chrome: any;

function FloatingButtonOverlay() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelText, setPanelText] = useState('');
  const [panelPos, setPanelPos] = useState({ left: 100, top: 100 });
  const [isSaved, setIsSaved] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedTextRef = useRef<string>('');

  // Text selection listener with debouncing & dismissal tracking
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Ignore mouseup events originating inside the Clipper UI
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

        // If user deselected all text, clear the dismissed history
        if (!text) {
          dismissedTextRef.current = '';
          return;
        }

        // If user explicitly dismissed/closed this exact selection, do not reopen
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

  // Quick save current page in 1 click
  const handleSavePage = () => {
    if (isSaved) return;
    setIsSaved(true);

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url: window.location.href,
        title: document.title || window.location.href,
        source: 'floating_button',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData, (response: any) => {
        if (chrome.runtime.lastError) {
          console.warn('[Clipper] Save failed:', chrome.runtime.lastError.message);
        }
      });
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  // Close panel and deselect text to avoid instant re-popups
  const handleClosePanel = () => {
    dismissedTextRef.current = panelText;
    setPanelOpen(false);
    try {
      window.getSelection()?.removeAllRanges();
    } catch (_) {}
  };

  return (
    <>
      <FloatingButton
        onSavePage={handleSavePage}
        isSaved={isSaved}
      />

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
    console.log('[Clipper] Floating button script active on', window.location.hostname);
  },
});
