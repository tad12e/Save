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
  try {
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
      return {
        status: 'authorized',
        provider: params.provider,
        access_type: params.accessType,
        granted_scopes: ['read', 'write'],
        target_resource_name: params.targetResourceName,
        is_real_oauth: false,
        destination: null,
      };
    }
    return await response.json();
  } catch (error) {
    console.warn('Could not authorize destination on backend:', error);
    return {
      status: 'authorized',
      provider: params.provider,
      access_type: params.accessType,
      granted_scopes: ['read', 'write'],
      target_resource_name: params.targetResourceName,
      is_real_oauth: false,
      destination: null,
    };
  }
}

export async function createClipBackend(clipData: { url: string; selected_text?: string; destination_id?: string; is_privacy_mode?: boolean }) {
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
      }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not post clip to backend:', error);
    return null;
  }
}

export async function fetchDestinationsBackend() {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch destinations from backend:', error);
    return null;
  }
}

export async function setDefaultDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/set-default/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not set default destination on backend:', error);
    return null;
  }
}

export async function testDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/test/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not test destination on backend:', error);
    return null;
  }
}

export async function beautifySheetBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/beautify/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not beautify sheet on backend:', error);
    return null;
  }
}

export async function updateDestinationBackend(destinationId: string, data: any) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not update destination on backend:', error);
    return null;
  }
}

export async function deleteDestinationBackend(destinationId: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/destinations/${destinationId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.warn('Could not delete destination on backend:', error);
    return false;
  }
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

