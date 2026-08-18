// ─── Storage helpers for Clipper chrome.storage.local ───

declare const chrome: any;

export interface Destination {
  type: 'google_sheets' | 'notion' | 'airtable' | string;
  name: string;
  tableId: string;
  tableName: string;
  icon?: string;
}

export interface NotionDatabase {
  id: string;
  name: string;
}

export interface AirtableTable {
  baseId: string;
  baseName: string;
  tableId: string;
  tableName: string;
}

export const DEFAULT_SHEETS_DESTINATION: Destination = {
  type: 'google_sheets',
  name: 'Google Sheets',
  tableId: 'default_sheet',
  tableName: 'My Clips',
  icon: '📊',
};

export const DEFAULT_SPOTIFY_DESTINATION: Destination = {
  type: 'spotify',
  name: 'Spotify',
  tableId: 'default_playlist',
  tableName: 'Clipper Tracks (Default)',
  icon: '🎵',
};

export const DEFAULT_YOUTUBE_MUSIC_DESTINATION: Destination = {
  type: 'youtube_music',
  name: 'YouTube Music',
  tableId: 'default_playlist',
  tableName: 'Clipper Tracks (Default)',
  icon: '▶️',
};

export interface MusicPlaylist {
  id: string;
  name: string;
  isDefault?: boolean;
}

export async function getDefaultDestination(): Promise<Destination> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(DEFAULT_SHEETS_DESTINATION);
      return;
    }
    chrome.storage.local.get(['default_destination'], (res: any) => {
      resolve(res.default_destination || DEFAULT_SHEETS_DESTINATION);
    });
  });
}

export async function setDefaultDestination(dest: Destination): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.set({ default_destination: dest }, resolve);
  });
}

export async function getCategoryDestinations(): Promise<Record<string, Destination>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve({});
      return;
    }
    chrome.storage.local.get(['category_destinations'], (res: any) => {
      resolve(res.category_destinations || {});
    });
  });
}

export async function setCategoryDestination(contentType: string, dest: Destination | null): Promise<void> {
  const current = await getCategoryDestinations();
  if (dest) {
    current[contentType] = dest;
  } else {
    delete current[contentType];
  }
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.set({ category_destinations: current }, resolve);
  });
}

export async function getCategoryDestination(contentType: string): Promise<Destination | null> {
  const all = await getCategoryDestinations();
  return all[contentType] || null;
}

/**
 * Resolves destination using the 3-tier hierarchy:
 * 1. Special rule for music: ALWAYS Spotify or YouTube Music.
 * 2. Category-specific default if configured by the user (e.g. 'article', 'job', 'tool').
 * 3. Universal Global Default Destination for anything without a rule.
 */
export async function getDestinationForContentType(contentType?: string | null): Promise<Destination> {
  const normType = (contentType || 'webpage').toLowerCase();

  // 1. Music rule: ALWAYS Spotify or YouTube Music
  if (normType === 'music' || normType === 'track' || normType === 'song') {
    const musicDest = await getCategoryDestination('music');
    if (musicDest) return musicDest;
    return DEFAULT_SPOTIFY_DESTINATION;
  }

  // 2. Check if user configured a default for this specific category (e.g. 'job', 'article', 'tool')
  if (normType && normType !== 'webpage') {
    const categoryDest = await getCategoryDestination(normType);
    if (categoryDest) return categoryDest;
  }

  // 3. Fallback: Universal Global Default Destination
  return getDefaultDestination();
}

export async function getMusicPlaylists(provider: string = 'spotify'): Promise<MusicPlaylist[]> {
  try {
    const resp = await fetch('http://localhost:8000/api/destinations/spotify/playlists/');
    if (resp.ok) {
      const data = await resp.json();
      if (data.playlists && data.playlists.length > 0) {
        const mapped: MusicPlaylist[] = data.playlists.map((p: any) => ({
          id: p.id,
          name: p.name,
          isDefault: p.id === 'clipper_tracks_default' || p.id === 'default'
        }));
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [`music_playlists_${provider}`]: mapped });
        }
        return mapped;
      }
    }
  } catch (err) {
    // Fallback to storage or defaults
  }

  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([
        { id: 'default', name: 'Clipper Tracks (Default)', isDefault: true },
        { id: 'liked', name: 'Liked Songs' },
        { id: 'focus', name: 'Coding & Focus' },
        { id: 'favorites', name: 'Favorites' },
      ]);
      return;
    }
    chrome.storage.local.get([`music_playlists_${provider}`], (res: any) => {
      const list = res[`music_playlists_${provider}`];
      if (list && list.length > 0) {
        resolve(list);
      } else {
        resolve([
          { id: 'default', name: 'Clipper Tracks (Default)', isDefault: true },
          { id: 'liked', name: 'Liked Songs' },
          { id: 'focus', name: 'Coding & Focus' },
          { id: 'favorites', name: 'Favorites' },
        ]);
      }
    });
  });
}

export async function getConnectedDestinations(): Promise<Destination[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([DEFAULT_SHEETS_DESTINATION, DEFAULT_SPOTIFY_DESTINATION]);
      return;
    }
    chrome.storage.local.get(['connected_destinations'], (res: any) => {
      const list = res.connected_destinations || [];
      if (list.length === 0) {
        resolve([DEFAULT_SHEETS_DESTINATION, DEFAULT_SPOTIFY_DESTINATION]);
      } else {
        resolve(list);
      }
    });
  });
}

export async function getNotionDatabases(): Promise<NotionDatabase[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([]);
      return;
    }
    chrome.storage.local.get(['notion_databases'], (res: any) => {
      resolve(res.notion_databases || []);
    });
  });
}

export async function getAirtableTables(): Promise<AirtableTable[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([]);
      return;
    }
    chrome.storage.local.get(['airtable_tables'], (res: any) => {
      resolve(res.airtable_tables || []);
    });
  });
}

