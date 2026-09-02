// ─── Universal Cross-Browser Storage Helpers (Chrome, Brave, Firefox, Edge, Safari) ───

declare const chrome: any;
declare const browser: any;

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

export interface StorageAdapter {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  onChanged?: {
    addListener(callback: (changes: any, areaName: string) => void): void;
    removeListener(callback: (changes: any, areaName: string) => void): void;
  };
}

/**
 * Universal Storage Factory:
 * 1. Firefox / WebExtensions: browser.storage.local
 * 2. Chrome / Brave / Edge / Arc / Opera: chrome.storage.local
 * 3. Web Simulator Fallback: window.localStorage
 */
export function getUniversalStorage(): StorageAdapter {
  // 1. Firefox WebExtensions
  if (typeof browser !== 'undefined' && browser?.storage?.local) {
    return {
      get: async (keys: string[]) => {
        const res = await browser.storage.local.get(keys);
        return res || {};
      },
      set: async (items: Record<string, any>) => {
        await browser.storage.local.set(items);
      },
      onChanged: browser.storage?.onChanged,
    };
  }

  // 2. Chrome, Brave, Edge, Arc, Opera, Vivaldi (Chromium)
  if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
    return {
      get: (keys: string[]) =>
        new Promise((resolve) => {
          chrome.storage.local.get(keys, (res: any) => resolve(res || {}));
        }),
      set: (items: Record<string, any>) =>
        new Promise((resolve) => {
          chrome.storage.local.set(items, () => resolve());
        }),
      onChanged: chrome.storage?.onChanged,
    };
  }

  // 3. In-Browser / Web simulator localStorage fallback
  return {
    get: async (keys: string[]) => {
      const result: Record<string, any> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        keys.forEach((key) => {
          try {
            const val = localStorage.getItem(`clipper_${key}`);
            if (val) result[key] = JSON.parse(val);
          } catch {
            // ignore JSON parse error
          }
        });
      }
      return result;
    },
    set: async (items: Record<string, any>) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.entries(items).forEach(([key, val]) => {
          try {
            localStorage.setItem(`clipper_${key}`, JSON.stringify(val));
          } catch {
            // ignore
          }
        });
      }
    },
  };
}

export async function getDefaultDestination(): Promise<Destination> {
  const storage = getUniversalStorage();
  const res = await storage.get(['default_destination']);
  return res.default_destination || DEFAULT_SHEETS_DESTINATION;
}

export async function setDefaultDestination(dest: Destination): Promise<void> {
  const storage = getUniversalStorage();
  await storage.set({ default_destination: dest });
}

export async function getCategoryDestinations(): Promise<Record<string, Destination>> {
  const storage = getUniversalStorage();
  const res = await storage.get(['category_destinations']);
  return res.category_destinations || {};
}

export async function setCategoryDestination(contentType: string, dest: Destination | null): Promise<void> {
  const current = await getCategoryDestinations();
  if (dest) {
    current[contentType] = dest;
  } else {
    delete current[contentType];
  }
  const storage = getUniversalStorage();
  await storage.set({ category_destinations: current });
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
  const storage = getUniversalStorage();
  try {
    const resp = await fetch('http://localhost:8000/api/destinations/spotify/playlists/');
    if (resp.ok) {
      const data = await resp.json();
      if (data.playlists && data.playlists.length > 0) {
        const mapped: MusicPlaylist[] = data.playlists.map((p: any) => ({
          id: p.id,
          name: p.name,
          isDefault: p.id === 'clipper_tracks_default' || p.id === 'default',
        }));
        await storage.set({ [`music_playlists_${provider}`]: mapped });
        return mapped;
      }
    }
  } catch (err) {
    // Fallback to storage or defaults
  }

  const res = await storage.get([`music_playlists_${provider}`]);
  const list = res[`music_playlists_${provider}`];
  if (Array.isArray(list) && list.length > 0) {
    return list;
  }

  return [
    { id: 'default', name: 'Clipper Tracks (Default)', isDefault: true },
    { id: 'liked', name: 'Liked Songs' },
    { id: 'focus', name: 'Coding & Focus' },
    { id: 'favorites', name: 'Favorites' },
  ];
}

export async function getConnectedDestinations(): Promise<Destination[]> {
  const storage = getUniversalStorage();
  const res = await storage.get(['connected_destinations']);
  if (Array.isArray(res.connected_destinations) && res.connected_destinations.length > 0) {
    return res.connected_destinations;
  }
  return [DEFAULT_SHEETS_DESTINATION];
}

export interface GoogleSheetResource {
  id: string;
  name: string;
  tabName?: string;
}

export async function getGoogleSheetsResources(): Promise<GoogleSheetResource[]> {
  const storage = getUniversalStorage();
  const res = await storage.get(['google_sheets_resources', 'connected_destinations']);
  if (Array.isArray(res.google_sheets_resources) && res.google_sheets_resources.length > 0) {
    return res.google_sheets_resources;
  }
  const connectedSheets = (res.connected_destinations || []).find((d: any) => d.type === 'google_sheets' || d.provider === 'google_sheets');
  const primaryName = connectedSheets?.tableName || 'My Clips';
  return [
    { id: 'primary', name: `${primaryName} (Granted)`, tabName: primaryName },
    { id: 'research', name: 'Research & Notes', tabName: 'Research & Notes' },
    { id: 'jobs', name: 'Jobs & Opportunities', tabName: 'Jobs & Opportunities' },
    { id: 'articles', name: 'Articles & Reads', tabName: 'Articles & Reads' },
  ];
}

export async function getNotionDatabases(): Promise<NotionDatabase[]> {
  const storage = getUniversalStorage();
  const res = await storage.get(['notion_databases', 'connected_destinations']);
  if (Array.isArray(res.notion_databases) && res.notion_databases.length > 0) {
    return res.notion_databases;
  }
  const connectedNotion = (res.connected_destinations || []).find((d: any) => d.type === 'notion' || d.provider === 'notion');
  const primaryName = connectedNotion?.tableName || 'Reading list database';
  return [
    { id: 'notion_primary', name: `${primaryName} (Granted)` },
    { id: 'notion_jobs', name: 'Job Applications & Leads' },
    { id: 'notion_projects', name: 'Projects & Tasks' },
  ];
}

export async function getAirtableTables(): Promise<AirtableTable[]> {
  const storage = getUniversalStorage();
  const res = await storage.get(['airtable_tables', 'connected_destinations']);
  if (Array.isArray(res.airtable_tables) && res.airtable_tables.length > 0) {
    return res.airtable_tables;
  }
  const connectedAirtable = (res.connected_destinations || []).find((d: any) => d.type === 'airtable' || d.provider === 'airtable');
  const primaryName = connectedAirtable?.tableName || 'Content tracker';
  return [
    { baseId: 'base_main', baseName: 'Main Base', tableId: 'airtable_primary', tableName: `${primaryName} (Granted)` },
    { baseId: 'base_main', baseName: 'Main Base', tableId: 'airtable_pipeline', tableName: 'Pipeline & Opportunities' },
  ];
}
