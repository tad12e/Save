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

  // Text selection listener with fast 150ms response
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
      }, 150);
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

  // Open panel on floating button click
  const handleOpenPanel = () => {
    const isSocialMedia = /instagram\.com|tiktok\.com|youtube\.com|linkedin\.com|twitter\.com|x\.com/i.test(window.location.hostname);
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    let pos = {
      left: Math.max(20, Math.min(window.innerWidth - 300, window.innerWidth - 320)),
      top: Math.max(20, Math.min(window.innerHeight - 380, 70)),
    };

    if (selection && selection.rangeCount > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pos = getPanelPosition(rect, 270, 320);
      }
    }

    setPanelText(text || document.title || 'Web Clip');
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
          contentType="music"
          source="floating_button"
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
