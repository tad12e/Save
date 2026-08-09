// ─── Floating Button + Selection Panel Content Script ───

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { FloatingButton } from '../components/FloatingButton';
import { SelectionPanel } from '../components/SelectionPanel';
import { isBlockedUrl, isSocialFeedPage } from '../lib/constants';
import { getPanelPosition } from '../lib/position';

declare const chrome: any;

function FloatingButtonOverlay() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelText, setPanelText] = useState('');
  const [panelPos, setPanelPos] = useState({ left: 100, top: 100 });
  const [isSaved, setIsSaved] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Text selection listener with 800ms debounce
  useEffect(() => {
    const handleMouseUp = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        if (text.length > 0 && selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const pos = getPanelPosition(rect, 240, 260);
            setPanelText(text);
            setPanelPos(pos);
            setPanelOpen(true);
          }
        }
      }, 800);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Quick save current page (CASE A)
  const handleSavePage = () => {
    if (isSaved) return;
    setIsSaved(true);

    const messageData = {
      type: 'SAVE_CLIP',
      data: {
        url: window.location.href,
        title: document.title || '',
        source: 'floating_button',
      },
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(messageData);
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  // Open panel on floating button click when text is selected (CASE B)
  const handleOpenPanel = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    let pos = { left: window.innerWidth - 260, top: window.innerHeight / 2 - 130 };

    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pos = getPanelPosition(rect, 240, 260);
      }
    }

    setPanelText(text);
    setPanelPos(pos);
    setPanelOpen(true);
  };

  return (
    <>
      <FloatingButton
        onSavePage={handleSavePage}
        onOpenPanel={handleOpenPanel}
        isSaved={isSaved}
      />

      {panelOpen && (
        <SelectionPanel
          text={panelText}
          url={window.location.href}
          position={panelPos}
          onClose={() => setPanelOpen(false)}
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
    if (isSocialFeedPage()) return; // Hidden on social feed pages

    const host = document.createElement('div');
    Object.assign(host.style, {
      position: 'fixed',
      inset: '0',
      width: '0',
      height: '0',
      overflow: 'visible',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });

    const shadowRoot = host.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    document.documentElement.appendChild(host);

    createRoot(mountPoint).render(<FloatingButtonOverlay />);
  },
});
