import { DestinationConfig, ClipItem, JobCard, ConnectionSyncLog, SharedBoard, CustomPageConfig } from '../types';
import { INITIAL_DESTINATIONS, INITIAL_CLIPS, INITIAL_JOBS, INITIAL_SYNC_LOGS, INITIAL_SHARED_BOARDS, INITIAL_CUSTOM_PAGES } from '../data/mockData';

const DESTINATIONS_KEY = 'clipper_destinations_v1';
const CLIPS_KEY = 'clipper_clips_v1';
const JOBS_KEY = 'clipper_jobs_v1';
const LOGS_KEY = 'clipper_logs_v1';
const BOARDS_KEY = 'clipper_boards_v1';
const PAGES_KEY = 'clipper_pages_v1';

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
    return item ? JSON.parse(item) : INITIAL_DESTINATIONS;
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
    return item ? JSON.parse(item) : INITIAL_CLIPS;
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
    return item ? JSON.parse(item) : INITIAL_JOBS;
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
    return item ? JSON.parse(item) : INITIAL_SYNC_LOGS;
  } catch (e) {
    console.error('Error loading sync logs', e);
    return INITIAL_SYNC_LOGS;
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
