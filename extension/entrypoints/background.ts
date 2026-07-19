type SaveClipMessage = {
  type: 'SAVE_CLIP';
  payload: {
    url: string;
    selected_text: string;
  };
};

type SaveClipResponse = {
  id: string;
  url: string;
  selected_text: string;
  status: string;
  duplicate: boolean;
};

type StoredConfig = {
  clipper_api_url?: string;
  clipper_access_token?: string;
};

declare const chrome: any;

const DEFAULT_API_URL = 'http://127.0.0.1:8000';

async function getStoredConfig(): Promise<StoredConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clipper_api_url', 'clipper_access_token'], (items: StoredConfig) => {
      resolve(items as StoredConfig);
    });
  });
}

async function postClip(payload: SaveClipMessage['payload']): Promise<SaveClipResponse> {
  const { clipper_api_url, clipper_access_token } = await getStoredConfig();
  const apiUrl = clipper_api_url || DEFAULT_API_URL;

  if (!clipper_access_token) {
    throw new Error('Missing access token. Sign in from the extension popup first.');
  }

  const response = await fetch(`${apiUrl}/api/clips/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clipper_access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === 'object'
        ? Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as SaveClipResponse;
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: SaveClipMessage, _sender: any, sendResponse: any) => {
    if (!message || message.type !== 'SAVE_CLIP') {
      return false;
    }

    postClip(message.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: Error) => sendResponse({ ok: false, error: error.message }))
      .catch(() => undefined);

    return true;
  });
});
