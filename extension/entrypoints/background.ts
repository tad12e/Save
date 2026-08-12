// ─── Background Script — handles SAVE_CLIP and OPEN_POPUP ───

import { defineBackground } from 'wxt/utils/define-background';

declare const chrome: any;

const DEFAULT_API_URL = 'http://127.0.0.1:8000';

function getApiUrl(): string {
  return (import.meta as any).env?.VITE_API_URL || DEFAULT_API_URL;
}

function showNotification(title: string, message: string): void {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon/48.png',
      title,
      message,
    });
  } catch {
    // Ignore notification errors if context unavailable
  }
}

async function handleSaveClip(data: any): Promise<any> {
  // 1. Get JWT
  const storage = await new Promise<any>((resolve) => {
    chrome.storage.local.get(
      ['jwt', 'clipper_access_token', 'clipper_api_url'],
      (res: any) => resolve(res || {})
    );
  });

  const token = storage.jwt || storage.clipper_access_token;
  const apiUrl = storage.clipper_api_url || getApiUrl();

  // 2. Build headers with token if available
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 3. POST to /api/clips/
  const bodyData = {
    url: data.url,
    selected_text: data.selectedText || data.selected_text || '',
    content_type: data.contentType || data.content_type || null,
    destination: data.destination || null,
    table_id: data.tableId || data.table_id || null,
    source: data.source || 'extension',
  };

  const response = await fetch(`${apiUrl}/api/clips/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
  });

  // 4. Handle 401
  if (response.status === 401) {
    await chrome.storage.local.remove(['jwt', 'clipper_access_token']);
    try {
      if (chrome.action?.openPopup) {
        chrome.action.openPopup();
      }
    } catch {
      // Ignore
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg =
      errorData && typeof errorData === 'object'
        ? Object.entries(errorData)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : `Server returned HTTP ${response.status}`;
    throw new Error(msg);
  }

  return await response.json();
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (!message?.type) return false;

    if (message.type === 'OPEN_POPUP') {
      try {
        if (chrome.action?.openPopup) {
          chrome.action.openPopup();
        }
      } catch {
        // Ignore
      }
      return false;
    }

    if (message.type === 'SAVE_CLIP') {
      const payload = message.data || message.payload;
      handleSaveClip(payload)
        .then((resData) => {
          showNotification('Clipper', 'Saved ✓');
          sendResponse({ ok: true, data: resData });
        })
        .catch((err: Error) => {
          showNotification('Clipper — Error', 'Could not save. Check connection.');
          sendResponse({ ok: false, error: err.message });
        });
      return true;
    }

    return false;
  });

  // ─── Setup Context Menus ───
  if (chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      if (chrome.contextMenus) {
        chrome.contextMenus.create({
          id: 'save_page',
          title: '📌 Save Page to Clipper',
          contexts: ['page'],
        });
        chrome.contextMenus.create({
          id: 'save_link',
          title: '📌 Save Link to Clipper',
          contexts: ['link'],
        });
        chrome.contextMenus.create({
          id: 'save_selection',
          title: '📌 Save Selected Text to Clipper',
          contexts: ['selection'],
        });
      }
    });
  }

  // Handle Context Menu clicks
  if (chrome.contextMenus?.onClicked) {
    chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
      let targetUrl = tab?.url || info.pageUrl || '';
      let selectedText = '';

      if (info.menuItemId === 'save_link' && info.linkUrl) {
        targetUrl = info.linkUrl;
      } else if (info.menuItemId === 'save_selection') {
        selectedText = info.selectionText || '';
      }

      if (!targetUrl) return;

      handleSaveClip({
        url: targetUrl,
        selectedText,
        source: 'context_menu',
      })
        .then(() => showNotification('Clipper', 'Saved ✓'))
        .catch((err: Error) => showNotification('Clipper — Error', err.message));
    });
  }

  // Handle Keyboard Shortcuts (Alt+S)
  if (chrome.commands?.onCommand) {
    chrome.commands.onCommand.addListener((command: string) => {
      if (command === 'save-clip-shortcut') {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
          const activeTab = tabs?.[0];
          if (activeTab?.url) {
            handleSaveClip({
              url: activeTab.url,
              title: activeTab.title || '',
              source: 'keyboard_shortcut',
            })
              .then(() => showNotification('Clipper', 'Saved ✓'))
              .catch((err: Error) => showNotification('Clipper — Error', err.message));
          }
        });
      }
    });
  }

  // Handle Address Bar (Omnibox) Keyword "save <url/text>"
  if (chrome.omnibox?.onInputEntered) {
    chrome.omnibox.onInputEntered.addListener((text: string) => {
      const cleanInput = text.trim();
      if (!cleanInput) return;

      const isUrl = cleanInput.startsWith('http://') || cleanInput.startsWith('https://');

      if (isUrl) {
        handleSaveClip({ url: cleanInput, source: 'omnibox' })
          .then(() => showNotification('Clipper', 'Saved ✓'))
          .catch((err: Error) => showNotification('Clipper — Error', err.message));
      } else {
        chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: any[]) => {
          const activeTab = tabs?.[0];
          if (activeTab?.url) {
            handleSaveClip({
              url: activeTab.url,
              selectedText: cleanInput,
              source: 'omnibox',
            })
              .then(() => showNotification('Clipper', 'Saved ✓'))
              .catch((err: Error) => showNotification('Clipper — Error', err.message));
          }
        });
      }
    });
  }
});

