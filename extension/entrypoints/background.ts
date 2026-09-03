// ─── Background Script — handles SAVE_CLIP and OPEN_POPUP ───

import { defineBackground } from 'wxt/utils/define-background';

declare const chrome: any;

const DEFAULT_API_URL = 'http://127.0.0.1:8000';

function getApiUrl(): string {
  return (import.meta as any).env?.VITE_API_URL || DEFAULT_API_URL;
}

function showNotification(title: string, message: string): void {
  try {
    const api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
    if (api?.notifications?.create) {
      const iconUrl = api.runtime?.getURL ? api.runtime.getURL('icon/48.png') : 'icon/48.png';
      api.notifications.create({
        type: 'basic',
        iconUrl,
        title,
        message,
      });
    }
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

  if (!token) {
    try {
      if (chrome.action?.openPopup) {
        chrome.action.openPopup();
      }
    } catch {
      // Ignore
    }
    throw new Error('Please sign in to save clips.');
  }

  // 2. Build headers with token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 3. POST to /api/clips/
  const bodyData = {
    url: data.url,
    selected_text: data.selectedText || data.selected_text || '',
    content_type: data.contentType || data.content_type || null,
    destination: data.destination || null,
    table_id: data.tableId || data.table_id || null,
    note: data.note || null,
    tags: data.tags || [],
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
    throw new Error('Session expired or authentication required. Please sign in.');
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

async function handleRecognizeAudio(data: any): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/clips/recognize-audio/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: data.audio,
      format: data.format || 'webm',
      title_hint: data.title_hint || '',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Recognition failed with status ${response.status}`);
  }

  return await response.json();
}

async function handleSpotifyAddTrack(data: any): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/destinations/spotify/add-track/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `Spotify add failed with status ${response.status}`);
  }

  return await response.json();
}

async function syncDestinationsFromBackend(): Promise<any> {
  try {
    const storage = await new Promise<any>((resolve) => {
      chrome.storage.local.get(['jwt', 'clipper_access_token', 'clipper_api_url'], (res: any) => resolve(res || {}));
    });
    const token = storage.jwt || storage.clipper_access_token;
    const apiUrl = storage.clipper_api_url || getApiUrl();
    if (!token) return [];

    const resp = await fetch(`${apiUrl}/api/destinations/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (resp.ok) {
      const list = await resp.json();
      if (Array.isArray(list)) {
        const activeDestinations = list
          .filter((d: any) => d.is_active === true)
          .map((d: any) => ({
            type: d.provider || d.type,
            name: d.name || d.provider,
            tableId: d.config?.table_id || d.config?.spreadsheet_id || d.config?.database_id || 'default',
            tableName: d.config?.target_resource_name || d.config?.sheet_name || d.tableName || d.name || '',
            icon: d.provider === 'google_sheets' ? '📊' : d.provider === 'notion' ? '📝' : d.provider === 'airtable' ? '🗂️' : d.provider === 'spotify' ? '🎵' : '📁',
          }));

        if (activeDestinations.length > 0) {
          await chrome.storage.local.set({ connected_destinations: activeDestinations });
          return activeDestinations;
        }
      }
    }
  } catch (err) {
    console.warn('[Clipper] Background destinations sync error:', err);
  }
  return [];
}

export default defineBackground(() => {
  // Sync active destinations on background startup
  syncDestinationsFromBackend();

  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (!message?.type) return false;

    if (message.type === 'SYNC_DESTINATIONS') {
      syncDestinationsFromBackend()
        .then((resData) => sendResponse({ ok: true, data: resData }))
        .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
      return true;
    }

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

    if (message.type === 'RECOGNIZE_AUDIO') {
      handleRecognizeAudio(message.data || message.payload || {})
        .then((resData) => sendResponse({ ok: true, data: resData }))
        .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
      return true;
    }

    if (message.type === 'SPOTIFY_ADD_TRACK') {
      handleSpotifyAddTrack(message.data || message.payload || {})
        .then((resData) => sendResponse({ ok: true, data: resData }))
        .catch((err: Error) => sendResponse({ ok: false, error: err.message }));
      return true;
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

  // Automatically sync destinations when an OAuth flow or settings page finishes loading
  if (chrome.tabs?.onUpdated) {
    chrome.tabs.onUpdated.addListener((_tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.status === 'complete' && tab?.url) {
        if (
          tab.url.includes('/api/destinations/oauth/callback') ||
          tab.url.includes('/destinations') ||
          tab.url.includes('/settings')
        ) {
          syncDestinationsFromBackend();
        }
      }
    });
  }

  // ─── Setup Context Menus ───
  if (chrome.runtime?.onInstalled) {
    chrome.runtime.onInstalled.addListener(() => {
      if (chrome.contextMenus) {
        try {
          chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
              id: 'open_clipper_panel',
              title: '✨ Save & Tag with Clipper…',
              contexts: ['page', 'selection', 'link', 'video', 'audio', 'image'],
            });
            chrome.contextMenus.create({
              id: 'quick_save_clipper',
              title: '📌 Quick Save to Default Destination',
              contexts: ['page', 'selection', 'link', 'video', 'audio', 'image'],
            });
          });
        } catch (err) {
          console.warn('[Clipper] Context menu init error:', err);
        }
      }
    });
  }

  // Handle Context Menu clicks
  if (chrome.contextMenus?.onClicked) {
    chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
      const targetUrl = info.linkUrl || info.srcUrl || tab?.url || info.pageUrl || '';
      const selectedText = info.selectionText || tab?.title || '';
      const isVideo = info.mediaType === 'video' || (targetUrl && (targetUrl.includes('youtube.com') || targetUrl.includes('tiktok.com')));
      const contentType = isVideo ? 'video' : info.mediaType === 'audio' ? 'music' : 'webpage';

      if (info.menuItemId === 'open_clipper_panel' && tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'OPEN_SELECTION_PANEL',
          data: {
            url: targetUrl,
            text: selectedText,
            contentType,
            source: 'context_menu',
          },
        }, (res: any) => {
          if (chrome.runtime.lastError) {
            // Fallback to quick save if content script is not yet injected
            handleSaveClip({
              url: targetUrl,
              title: selectedText,
              selectedText: info.selectionText || '',
              source: 'context_menu_fallback',
            })
              .then(() => showNotification('Clipper', 'Saved ✓'))
              .catch((err: Error) => showNotification('Clipper — Error', err.message));
          }
        });
        return;
      }

      if (!targetUrl) return;

      handleSaveClip({
        url: targetUrl,
        title: selectedText,
        selectedText: info.selectionText || '',
        source: 'context_menu_quick',
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
              .then(() => {
                showNotification('Clipper', 'Saved ✓');
                if (activeTab.id) {
                  chrome.tabs.sendMessage(activeTab.id, {
                    type: 'SHOW_CLIPPER_TOAST',
                    data: {
                      title: 'Saved to Clipper ✓',
                      subtitle: activeTab.title || activeTab.url,
                      status: 'saved',
                    },
                  }).catch(() => {});
                }
              })
              .catch((err: Error) => {
                showNotification('Clipper — Error', err.message);
                if (activeTab.id) {
                  chrome.tabs.sendMessage(activeTab.id, {
                    type: 'SHOW_CLIPPER_TOAST',
                    data: {
                      title: 'Save Failed',
                      subtitle: err.message,
                      status: 'error',
                    },
                  }).catch(() => {});
                }
              });
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

