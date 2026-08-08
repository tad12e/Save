type SaveClipMessage = {
  type: 'SAVE_CLIP';
  payload: {
    url: string;
    selected_text: string;
    destination_id?: string | null;
  };
};

type GetDestinationsMessage = {
  type: 'GET_DESTINATIONS';
};

type SaveClipResponse = {
  id: string;
  url: string;
  selected_text: string;
  status: string;
  duplicate: boolean;
  export_status?: string;
  destination_name?: string | null;
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

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { clipper_api_url, clipper_access_token } = await getStoredConfig();
  const apiUrl = clipper_api_url || DEFAULT_API_URL;

  if (!clipper_access_token) {
    throw new Error('Missing access token. Sign in from the extension popup first.');
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${clipper_access_token}`);

  const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });
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

  return data as T;
}

async function postClip(payload: SaveClipMessage['payload']): Promise<SaveClipResponse> {
  return apiRequest<SaveClipResponse>('/api/clips/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchDestinations() {
  return apiRequest<Array<{ id: string; name: string; provider: string; is_default: boolean }>>(
    '/api/destinations/',
  );
}

type CheckRelevanceMessage = {
  type: 'CHECK_PAGE_RELEVANCE';
  payload: {
    text: string;
  };
};

async function checkSimilarity(text: string) {
  return apiRequest<{
    relevant: boolean;
    similarity_score?: number;
    matched_clip?: { id: string; title: string; summary: string; content_type: string };
    reason?: string;
  }>('/api/clips/similar/', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message: SaveClipMessage | GetDestinationsMessage | CheckRelevanceMessage, _sender: any, sendResponse: any) => {
    if (!message?.type) {
      return false;
    }

    if (message.type === 'GET_DESTINATIONS') {
      fetchDestinations()
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message.type === 'SAVE_CLIP') {
      postClip(message.payload)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    if (message.type === 'CHECK_PAGE_RELEVANCE') {
      checkSimilarity(message.payload.text)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((error: Error) => sendResponse({ ok: false, error: error.message }));
      return true;
    }

    return false;
  });
});
