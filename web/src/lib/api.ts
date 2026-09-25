import type {
  CustomPageConfig,
  CustomCategoryConfig,
  ClipItem,
  ClipType,
  ConnectionSyncLog,
  BulkImportUploadParams,
  BulkImportJobResponse,
  BulkImportJobStatus,
} from '../types';

export interface AuthorizeParams {
  provider: string;
  name: string;
  accessType: 'full' | 'partial';
  actionType: 'create' | 'existing';
  targetResourceName: string;
  accountEmail?: string;
}

export interface AuthorizeResponse {
  status: string;
  provider: string;
  access_type: 'full' | 'partial';
  granted_scopes: string[];
  target_resource_name: string;
  auth_url?: string | null;
  is_real_oauth?: boolean;
  destination: any;
}

const BASE_URL = 'http://localhost:8000';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('clipper_access_token') : null;
  const headers: Record<string, string> = { ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function authorizeDestinationBackend(params: AuthorizeParams): Promise<AuthorizeResponse> {
  const response = await fetch(`${BASE_URL}/api/destinations/authorize/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      provider: params.provider,
      name: params.name,
      access_type: params.accessType,
      action_type: params.actionType,
      target_resource_name: params.targetResourceName,
      account_email: params.accountEmail,
    }),
  });
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const errorMsg = errJson.error || errJson.detail || `Server returned ${response.status} (${response.statusText})`;
    throw new Error(`Could not connect: ${errorMsg}`);
  }
  return await response.json();
}

export async function createClipBackend(clipData: {
  url: string;
  selected_text?: string;
  destination_id?: string;
  is_privacy_mode?: boolean;
  custom_page_id?: string;
}) {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'X-Privacy-Mode': clipData.is_privacy_mode ? 'true' : 'false',
      }),
      body: JSON.stringify({
        url: clipData.url,
        selected_text: clipData.selected_text || '',
        destination_id: clipData.destination_id,
        privacy_mode: clipData.is_privacy_mode || false,
        custom_page_id: clipData.custom_page_id,
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not post clip to backend:', error);
    return null;
  }
}

export function convertBackendClipToItem(b: any): ClipItem {
  const normType = (b.content_type || b.intent || 'general').toLowerCase();
  const validTypes: ClipType[] = [
    'job', 'education', 'research', 'book', 'project',
    'programming', 'course', 'event', 'scholarship', 'music', 'deal', 'article', 'general'
  ];
  const clipType: ClipType = validTypes.includes(normType as any) ? (normType as ClipType) : 'article';

  return {
    id: String(b.id),
    title: b.title || b.url || 'Untitled Clip',
    url: b.url,
    selectedText: b.selected_text || '',
    summary: b.summary || '',
    type: clipType,
    tags: Array.isArray(b.tags) ? b.tags : [],
    createdAt: b.created_at || new Date().toISOString(),
    sourceApp: (b.source_platform && b.source_platform !== 'web') ? b.source_platform : 'Web App',
    syncedTo: b.destination_provider ? [b.destination_provider] : [],
    storageMode: 'cloud',
    pageId: b.custom_page_id || undefined,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url || '')}&sz=32`,
    extractedData: {
      deadline: b.deadline_date,
      ...(b.extra_metadata || {})
    },
    isFavorite: false,
    sourcePlatform: b.source_platform || 'web',
    sourceAuthor: b.source_author || undefined,
    sourcePostUrl: b.source_post_url || undefined,
    parentClipId: b.parent_clip_id || undefined,
    parentClipTitle: b.parent_clip_title || undefined,
    childClipsCount: b.child_clips_count || 0,
    isResourceHub: b.is_resource_hub || false,
    extractedResourceUrl: b.extracted_resource_url || undefined,
    ...(b.intent ? { intent: b.intent } : {}),
  } as ClipItem;
}

export async function fetchClipsBackend(params?: { intent?: string; pageId?: string; source?: string; type?: string; groupBy?: string }): Promise<ClipItem[] | null> {
  try {
    const query = new URLSearchParams();
    if (params?.intent && params.intent !== 'all') query.set('intent', params.intent);
    if (params?.pageId && params.pageId !== 'all') query.set('page_id', params.pageId);
    if (params?.source && params.source !== 'all') query.set('source', params.source);
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.groupBy && params.groupBy !== 'all') query.set('group_by', params.groupBy);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${BASE_URL}/api/clips/${qs}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map(convertBackendClipToItem);
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch clips from backend:', error);
    return null;
  }
}

export interface BackendDashboardData {
  user?: {
    name: string;
    email: string;
  };
  stats?: {
    total_clips: number;
    saved_this_week: number;
    jobs_saved: number;
    music_saved: number;
    articles_saved: number;
    active_destinations: number;
    upcoming_deadlines_count: number;
  };
  upcoming_deadlines?: any[];
  destinations_status?: Array<{
    id: string;
    provider: string;
    name: string;
    connected: boolean;
    status: string;
    items_synced: number;
  }>;
  intent_distribution?: Array<{
    name: string;
    intent: string;
    count: number;
    pct: number;
    color: string;
  }>;
  intent_counts?: Record<string, number>;
  ai_digest_highlight?: {
    title: string;
    summary: string;
    action_needed_count: number;
  };
  recent_clips?: any[];
}

export async function fetchClipsDashboardBackend(): Promise<BackendDashboardData | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/dashboard/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch clips dashboard from backend:', error);
    return null;
  }
}

export async function fetchDashboardCardsBackend() {
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/cards/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch dashboard cards from backend:', error);
    return null;
  }
}


export interface DestinationsResponse {
  data: any[] | null;
  error: string | null;
  status: number;
}

export async function fetchDestinationsBackend(): Promise<DestinationsResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error || errData.detail || (response.status === 401 ? 'Authentication required. Please sign in.' : `Error (${response.status})`);
      return { data: null, error: `Could not connect: ${msg}`, status: response.status };
    }
    const data = await response.json();
    return { data: Array.isArray(data) ? data : [], error: null, status: response.status };
  } catch (error: any) {
    return { data: null, error: 'Could not connect to backend server. Make sure the server is running.', status: 0 };
  }
}

export async function setDefaultDestinationBackend(destinationId: string) {
  const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/set-default/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.detail || `Could not set default (status ${response.status})`);
  }
  return await response.json();
}

export async function testDestinationBackend(destinationId: string) {
  const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/test/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `Could not connect: Test failed (${response.status})`);
  }
  return await response.json();
}

export async function beautifySheetBackend(destinationId: string) {
  const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/beautify/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.error || `Beautify failed (${response.status})`);
  }
  return await response.json();
}

export async function updateDestinationBackend(destinationId: string, data: any) {
  const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.detail || `Update failed (${response.status})`);
  }
  return await response.json();
}

export async function createDestinationBackend(payload: {
  provider: string;
  name: string;
  config?: Record<string, any>;
  is_default?: boolean;
  is_active?: boolean;
}): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/destinations/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || errData.detail || (response.status === 401 ? 'Authentication required. Please sign in.' : `Create failed (${response.status})`);
    throw new Error(msg);
  }
  return await response.json();
}

export async function deleteDestinationBackend(destinationId: string, hard = false) {
  const url = `${BASE_URL}/api/destinations/${destinationId}/${hard ? '?hard=true' : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || errData.detail || `Delete failed (${response.status})`);
  }
  return true;
}

// Destination Sync Logs API (Persistent PostgreSQL Backend)
export interface DestinationLogsResponse {
  data: ConnectionSyncLog[] | null;
  error: string | null;
  status: number;
}

export async function fetchDestinationLogsBackend(params?: {
  destinationId?: string;
  status?: string;
  limit?: number;
}): Promise<DestinationLogsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.destinationId) searchParams.append('destinationId', params.destinationId);
    if (params?.status && params.status.toLowerCase() !== 'all') searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    const url = `${BASE_URL}/api/destinations/logs/${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error || errData.detail || (response.status === 401 ? 'Authentication required. Please sign in.' : `Error (${response.status})`);
      return { data: null, error: `Could not connect: ${msg}`, status: response.status };
    }

    const data = await response.json();
    return { data: Array.isArray(data) ? data : [], error: null, status: response.status };
  } catch (error: any) {
    return { data: null, error: 'Could not connect to backend server. Make sure the server is running.', status: 0 };
  }
}

export const fetchLogsBackend = fetchDestinationLogsBackend;

export async function createDestinationLogBackend(logData: {
  destinationId?: string;
  destinationName?: string;
  clipId?: string;
  clipTitle: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  durationMs?: number;
  payloadSize?: string;
  details?: string;
  errorMessage?: string;
}): Promise<ConnectionSyncLog> {
  const response = await fetch(`${BASE_URL}/api/destinations/logs/`, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(logData),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || errData.detail || (response.status === 401 ? 'Authentication required. Please sign in.' : `Record log failed (${response.status})`);
    throw new Error(msg);
  }

  return await response.json();
}

export const createLogBackend = createDestinationLogBackend;

export async function clearDestinationLogsBackend(destinationId?: string): Promise<boolean> {
  const url = `${BASE_URL}/api/destinations/logs/${destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : ''}`;
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || errData.detail || (response.status === 401 ? 'Authentication required. Please sign in.' : `Clear logs failed (${response.status})`);
    throw new Error(msg);
  }

  return true;
}

// User Authentication Backend APIs (Calls exact same Django views as Extension)
async function parseJsonResponse(response: Response, defaultErrMsg: string) {
  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(`Server Error (${response.status}: ${response.statusText}). Check backend status.`);
    }
  }

  if (!response.ok) {
    const msg = typeof data === 'object' && data !== null
      ? Object.values(data).flat().join(', ')
      : defaultErrMsg;
    throw new Error(msg || defaultErrMsg);
  }
  return data;
}

export async function signupBackend(data: { email: string; password: string; name: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/signup/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'Signup failed');
}

export async function signinBackend(data: { email: string; password: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/signin/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'Invalid credentials');
}

export async function verifyOTPBackend(data: { email: string; otp: string }) {
  const response = await fetch(`${BASE_URL}/api/auth/verify-otp/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return await parseJsonResponse(response, 'OTP verification failed');
}

export async function resendOTPBackend(email: string) {
  const response = await fetch(`${BASE_URL}/api/auth/resend-otp/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return await parseJsonResponse(response, 'Resend OTP failed');
}

export async function googleAuthBackend(idToken: string) {
  const response = await fetch(`${BASE_URL}/api/auth/social/google/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  return await parseJsonResponse(response, 'Google Auth failed');
}

export async function logoutBackend(refreshToken?: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ refresh_token: refreshToken || '' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Spotify Web API Integration
// ---------------------------------------------------------------------------

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  total_tracks: number;
  image_url: string;
  uri: string;
  external_url: string;
}

export interface SpotifyTrack {
  id: string;
  title?: string;
  name?: string;
  artist?: string;
  artists?: string;
  album: string;
  album_art?: string;
  uri?: string;
  external_url?: string;
  spotify_url?: string;
  preview_url?: string;
  duration_ms?: number;
  isrc?: string;
}

export async function fetchSpotifyPlaylistsBackend(): Promise<SpotifyPlaylist[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/spotify/playlists/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.playlists || [];
  } catch (error) {
    console.warn('Could not fetch Spotify playlists:', error);
    return [];
  }
}

export const fetchSpotifyPlaylists = fetchSpotifyPlaylistsBackend;

export async function createSpotifyPlaylistBackend(name: string, description: string = '', isPublic: boolean = false): Promise<SpotifyPlaylist | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/spotify/playlists/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, description, is_public: isPublic }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.playlist || data || null;
  } catch (error) {
    console.warn('Could not create Spotify playlist:', error);
    return null;
  }
}

export const createSpotifyPlaylist = createSpotifyPlaylistBackend;

export async function searchSpotifyTracks(query: string, limit: number = 5): Promise<SpotifyTrack[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/spotify/search/?q=${encodeURIComponent(query)}&limit=${limit}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.warn('Could not search Spotify tracks:', error);
    return [];
  }
}

export async function addTrackToSpotifyPlaylist(params: {
  playlist_id?: string;
  track_uri?: string;
  track_id?: string;
  query?: string;
}) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/spotify/add-track/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not add track to Spotify:', error);
    return null;
  }
}

export async function saveSpotifyTrackBackend(
  track: SpotifyTrack,
  playlistId: string = 'default'
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/spotify/save-track/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        track_id: track.id,
        track_title: track.title || track.name,
        track_artist: track.artist || track.artists,
        track_album: track.album,
        spotify_url: track.spotify_url || track.external_url || '',
        playlist_id: playlistId,
      }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || (response.ok ? 'Track saved to Spotify ✓' : 'Failed to save track to Spotify'),
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error saving to Spotify' };
  }
}

export async function setMusicProviderBackend(provider: 'spotify' | 'youtube_music') {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/set-music-provider/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ provider }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update default music provider on backend:', error);
    return null;
  }
}

export async function fetchCategoryRoutingRules(): Promise<Record<string, string> | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/category-rules/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.rules || null;
  } catch (error) {
    console.warn('Could not fetch category routing rules from backend:', error);
    return null;
  }
}

export async function saveCategoryRoutingRules(rules: Record<string, string>) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/category-rules/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ rules }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not save category routing rules to backend:', error);
    return null;
  }
}

export interface UserSettingsData {
  id?: string;
  confirmation_mode?: 'auto' | 'confirm' | 'always_ask';
  music_provider?: 'spotify' | 'youtube_music';
  music_target_playlist_id?: string;
  music_auto_add?: boolean;
  spotify_client_id?: string;
  spotify_client_secret?: string;
  privacy_mode?: boolean;
  ai_extraction_prompt?: string;
  theme?: string;
  extra_preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export async function fetchUserSettingsBackend(): Promise<UserSettingsData | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/users/settings/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch user settings from backend:', error);
    return null;
  }
}

export async function updateUserSettingsBackend(payload: Partial<UserSettingsData>): Promise<UserSettingsData | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/users/settings/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update user settings on backend:', error);
    return null;
  }
}

export async function fetchClipClustersBackend(params?: { threshold?: number; minSize?: number; refresh?: boolean }) {
  try {
    const query = new URLSearchParams();
    if (params?.threshold) query.set('threshold', String(params.threshold));
    if (params?.minSize) query.set('min_size', String(params.minSize));
    if (params?.refresh) query.set('refresh', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${BASE_URL}/api/clips/clusters/${qs}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch clip clusters from backend:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Custom Pages & Workspaces Backend APIs
// ---------------------------------------------------------------------------

export async function fetchCustomPagesBackend() {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/pages/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch custom pages from backend:', error);
    return null;
  }
}

export async function createCustomPageBackend(pageData: {
  name: string;
  slug?: string;
  icon_name?: string;
  color?: string;
  bg_color?: string;
  description?: string;
  content_types?: string[];
  ai_goal_prompt?: string;
  is_system_default?: boolean;
}) {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/pages/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(pageData),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not create custom page on backend:', error);
    return null;
  }
}

export async function updateCustomPageBackend(pageId: string, data: any) {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/pages/${pageId}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update custom page on backend:', error);
    return null;
  }
}

export async function deleteCustomPageBackend(pageId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/pages/${pageId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn('Could not delete custom page on backend:', error);
    return false;
  }
}

export function convertBackendPageToConfig(p: any): CustomPageConfig {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    iconName: p.icon_name || 'FolderGit2',
    color: p.color || '#8B5CF6',
    bgColor: p.bg_color || 'rgba(139, 92, 246, 0.15)',
    description: p.description || '',
    contentTypes: p.content_types || ['general', 'article'],
    aiGoalPrompt: p.ai_goal_prompt || '',
    createdAt: p.created_at || new Date().toISOString(),
    isSystemDefault: Boolean(p.is_system_default),
  };
}

export async function fetchCustomCategoriesBackend(dimension?: string): Promise<CustomCategoryConfig[]> {
  try {
    const url = dimension && dimension !== 'all'
      ? `${BASE_URL}/api/clips/custom-categories/?dimension=${dimension}`
      : `${BASE_URL}/api/clips/custom-categories/`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((c: any) => ({
      id: c.id,
      dimension: c.dimension,
      name: c.name,
      slug: c.slug,
      color: c.color,
      bgColor: c.bg_color,
      iconName: c.icon_name,
      description: c.description,
      keywords: c.keywords,
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.warn('Could not fetch custom categories:', error);
    return [];
  }
}

export async function createCustomCategoryBackend(data: Partial<CustomCategoryConfig>): Promise<CustomCategoryConfig | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/custom-categories/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name: data.name,
        slug: data.slug,
        dimension: data.dimension || 'intent',
        color: data.color,
        bg_color: data.bgColor,
        icon_name: data.iconName,
        description: data.description,
        keywords: data.keywords,
      }),
    });
    if (!response.ok) return null;
    const c = await response.json();
    return {
      id: c.id,
      dimension: c.dimension,
      name: c.name,
      slug: c.slug,
      color: c.color,
      bgColor: c.bg_color,
      iconName: c.icon_name,
      description: c.description,
      keywords: c.keywords,
      createdAt: c.created_at,
    };
  } catch (error) {
    console.warn('Could not create custom category:', error);
    return null;
  }
}

export async function deleteCustomCategoryBackend(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/custom-categories/${id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn('Could not delete custom category:', error);
    return false;
  }
}

export async function updateClipBackend(clipId: string, data: {
  title?: string;
  intent?: string;
  type?: string;
  content_type?: string;
  custom_page_id?: string | null;
  tags?: string[];
  note?: string;
}): Promise<any> {
  try {
    const payload: any = { ...data };
    if (data.type && !data.content_type) {
      payload.content_type = data.type;
    }
    const response = await fetch(`${BASE_URL}/api/clips/${clipId}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update clip on backend:', error);
    return null;
  }
}

export async function uploadBulkImportBackend(params: BulkImportUploadParams): Promise<BulkImportJobResponse> {
  const formData = new FormData();
  if (params.file) {
    formData.append('file', params.file);
  }
  if (params.raw_data) {
    formData.append('raw_data', params.raw_data);
  }
  if (params.source_platform) {
    formData.append('source_platform', params.source_platform);
  }

  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL}/api/clips/import/upload/`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.error || err.detail || `Upload failed (HTTP ${response.status}: ${response.statusText})`;
    throw new Error(message);
  }

  return await response.json();
}

export async function fetchBulkImportStatusBackend(jobId: string): Promise<BulkImportJobStatus> {
  const response = await fetch(`${BASE_URL}/api/clips/import/${jobId}/`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.error || err.detail || `Status check failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return await response.json();
}

export async function fetchBulkImportHistoryBackend(): Promise<BulkImportJobStatus[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/clips/import/history/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Could not fetch bulk import history:', error);
    return [];
  }
}
