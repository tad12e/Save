import { DestinationConfig, ClipItem, JobCard, ConnectionSyncLog, SharedBoard, CustomPageConfig, CustomCategoryConfig } from '../types';
import { INITIAL_DESTINATIONS, INITIAL_CLIPS, INITIAL_JOBS, INITIAL_SYNC_LOGS, INITIAL_SHARED_BOARDS, INITIAL_CUSTOM_PAGES } from '../data/mockData';

const DESTINATIONS_KEY = 'clipper_destinations_v1';
const CLIPS_KEY = 'clipper_clips_v1';
const JOBS_KEY = 'clipper_jobs_v1';
const LOGS_KEY = 'clipper_logs_v1';
const BOARDS_KEY = 'clipper_boards_v1';
const PAGES_KEY = 'clipper_pages_v1';
const PRIVACY_MODE_KEY = 'clipper_privacy_mode_v1';

export const getStoredPrivacyMode = (): boolean => {
  try {
    const item = localStorage.getItem(PRIVACY_MODE_KEY);
    return item !== null ? JSON.parse(item) : true; // Default: Local Privacy Mode ON
  } catch (e) {
    return true;
  }
};

export const saveStoredPrivacyMode = (enabled: boolean): void => {
  try {
    localStorage.setItem(PRIVACY_MODE_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Error saving privacy mode', e);
  }
};

export const getStoredCustomPages = (): CustomPageConfig[] => {
  try {
    const item = localStorage.getItem(PAGES_KEY);
    return item ? JSON.parse(item) : INITIAL_CUSTOM_PAGES;
  } catch (e) {
    console.error('Error loading stored custom pages', e);
    return INITIAL_CUSTOM_PAGES;
  }
};

export const saveStoredCustomPages = (pages: CustomPageConfig[]): void => {
  try {
    localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
  } catch (e) {
    console.error('Error saving custom pages', e);
  }
};

export const getStoredDestinations = (): DestinationConfig[] => {
  try {
    const item = localStorage.getItem(DESTINATIONS_KEY);
    if (!item) return INITIAL_DESTINATIONS;
    const parsed: DestinationConfig[] = JSON.parse(item);
    
    // Enforce strictly one default destination
    let foundDefault = false;
    const normalized = parsed.map(d => {
      if (d.isDefault) {
        if (!foundDefault) {
          foundDefault = true;
          return d;
        }
        return { ...d, isDefault: false };
      }
      return d;
    });

    const sanitized = normalized.map(d => {
      if (d.itemsSyncedCount === 142 || d.itemsSyncedCount === 48) {
        return { ...d, itemsSyncedCount: 0 };
      }
      return d;
    });

    return sanitized;
  } catch (e) {
    console.error('Error loading stored destinations', e);
    return INITIAL_DESTINATIONS;
  }
};

export const saveStoredDestinations = (destinations: DestinationConfig[]): void => {
  try {
    localStorage.setItem(DESTINATIONS_KEY, JSON.stringify(destinations));
  } catch (e) {
    console.error('Error saving destinations', e);
  }
};

export const getStoredClips = (): ClipItem[] => {
  try {
    const item = localStorage.getItem(CLIPS_KEY);
    if (!item) return INITIAL_CLIPS;
    const parsed: ClipItem[] = JSON.parse(item);
    if (parsed.some(c => c.id === 'clip_1' || c.id === 'clip_2' || c.id === 'clip_3')) {
      localStorage.removeItem(CLIPS_KEY);
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Error loading stored clips', e);
    return INITIAL_CLIPS;
  }
};

export const saveStoredClips = (clips: ClipItem[]): void => {
  try {
    localStorage.setItem(CLIPS_KEY, JSON.stringify(clips));
  } catch (e) {
    console.error('Error saving clips', e);
  }
};

export const getStoredJobs = (): JobCard[] => {
  try {
    const item = localStorage.getItem(JOBS_KEY);
    if (!item) return INITIAL_JOBS;
    const parsed: JobCard[] = JSON.parse(item);
    if (parsed.some(j => j.id === 'job_1' || j.id === 'job_2')) {
      localStorage.removeItem(JOBS_KEY);
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Error loading stored jobs', e);
    return INITIAL_JOBS;
  }
};

export const saveStoredJobs = (jobs: JobCard[]): void => {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Error saving jobs', e);
  }
};

export const getStoredLogs = (): ConnectionSyncLog[] => {
  try {
    const item = localStorage.getItem(LOGS_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error('Error loading sync logs', e);
    return [];
  }
};

export const saveStoredLogs = (logs: ConnectionSyncLog[]): void => {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving sync logs', e);
  }
};

export const getStoredBoards = (): SharedBoard[] => {
  try {
    const item = localStorage.getItem(BOARDS_KEY);
    return item ? JSON.parse(item) : INITIAL_SHARED_BOARDS;
  } catch (e) {
    console.error('Error loading boards', e);
    return INITIAL_SHARED_BOARDS;
  }
};

export const saveStoredBoards = (boards: SharedBoard[]): void => {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
  } catch (e) {
    console.error('Error saving boards', e);
  }
};

const CUSTOM_CATEGORIES_KEY = 'clipper_custom_categories_v1';

export const getStoredCustomCategories = (): CustomCategoryConfig[] => {
  try {
    const item = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error('Error loading custom categories', e);
    return [];
  }
};

export const saveStoredCustomCategories = (cats: CustomCategoryConfig[]): void => {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving custom categories', e);
  }
};
