import type { PlatformMeta } from './types/clipPlatform';

export type DestinationType = 'google_sheets' | 'notion' | 'airtable' | 'webhook' | 'custom_db' | 'spotify' | 'youtube_music';

export type ClipType = 'job' | 'education' | 'research' | 'book' | 'project' | 'programming' | 'course' | 'event' | 'scholarship' | 'music' | 'deal' | 'video' | 'vault' | 'article' | 'general';

export type StorageMode = 'cloud' | 'local';

export type GroupByDimension = 'intent' | 'source' | 'type' | 'deadline' | 'custom';

export interface CustomPageConfig {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  color: string;
  bgColor?: string;
  description: string;
  contentTypes: ClipType[];
  aiGoalPrompt: string;
  createdAt: string;
  isSystemDefault?: boolean;
  parentId?: string | null;
}

export interface CustomCategoryConfig {
  id: string;
  dimension: GroupByDimension;
  name: string;
  slug: string;
  color: string;
  bgColor?: string;
  iconName?: string;
  description?: string;
  keywords?: string[];
  createdAt?: string;
}

export interface FieldMapping {
  id: string;
  sourceField: string; // e.g. "URL", "Title", "Selected Text", "AI Summary", "Salary/Price", "Category", "Tags", "Date Saved"
  targetField: string; // e.g. "Col A (Url)", "Properties.Title", "Fields.Notes"
  enabled: boolean;
}

export interface DestinationConfig {
  id: string;
  type: DestinationType;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  isDefault: boolean;
  status: 'active' | 'syncing' | 'error' | 'disconnected';
  lastSync?: string;
  itemsSyncedCount: number;
  
  // Specific settings
  targetResourceName?: string; // e.g., "2026 Tech Job Pipeline.xlsx" or "Reading List DB"
  targetResourceId?: string;
  accountEmail?: string;
  authKeyMasked?: string;
  endpointUrl?: string; // for webhooks
  webhookSecret?: string;
  
  fieldMappings: FieldMapping[];
  syncFrequency: 'instant' | 'hourly' | 'daily' | 'manual';
  autoCreateColumns: boolean;
  is_active?: boolean;
  provider?: string;
  config?: any;
  [key: string]: any;
}

export interface ClipItem {
  id: string;
  title: string;
  url: string;
  selectedText?: string;
  summary: string;
  type: ClipType;
  tags: string[];
  createdAt: string;
  sourceApp: string; // 'Chrome Extension' | 'Mobile Share Sheet' | 'Web App'
  syncedTo: DestinationType[];
  storageMode: StorageMode; // 'cloud' (Server Storage) | 'local' (Local/Offline Storage)
  pageId?: string; // Assigned custom page ID
  faviconUrl?: string;
  extractedData?: {
    company?: string;
    salary?: string;
    location?: string;
    price?: string;
    deadline?: string;
    author?: string;
    rating?: string;
    duration?: string;
    [key: string]: any;
  };
  isFavorite?: boolean;
  sourcePlatform?: 'web' | 'x_twitter' | 'linkedin' | 'reddit' | 'youtube' | 'github' | 'instagram' | 'tiktok' | 'spotify';
  sourceAuthor?: string;
  sourcePostUrl?: string;
  parentClipId?: string;
  parentClipTitle?: string;
  childClipsCount?: number;
  isResourceHub?: boolean;
  extractedResourceUrl?: string;
  /** Native bookmark skin payload (see types/clipPlatform.ts). Always present after convertBackendClipToItem. */
  platformMeta?: PlatformMeta;
  intent?: string;
  created_at?: string;
  is_favorite?: boolean;
  status?: string;
  content_type?: string;
  category?: string;
  deadline_date?: string;
  destination?: any;
  extra_metadata?: any;
  author?: string;
  source_platform?: string;
  selected_text?: string;
  music_embed_url?: string;
  extracted_resource_url?: string;
  export_url?: string;
  [key: string]: any;
}

export interface JobCard {
  id: string;
  clipId?: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  fitScore: number; // 1-100
  url: string;
  dateAdded: string;
  notes?: string;
  nextActionDate?: string;
  nextActionLabel?: string;
}

export interface ConnectionSyncLog {
  id: string;
  destinationId: string;
  destinationName: string;
  clipTitle: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  timestamp: string;
  durationMs: number;
  payloadSize: string;
  details?: string;
}

export interface SharedBoard {
  id: string;
  title: string;
  description: string;
  itemCount: number;
  membersCount: number;
  tags: string[];
  isPublic: boolean;
  updatedAt: string;
  coverGradient: string;
  members: { name: string; avatar: string; role: 'owner' | 'editor' | 'viewer' }[];
}

export interface WeeklyDigestStats {
  totalClips: number;
  topCategory: ClipType;
  categoryBreakdown: { type: ClipType; count: number; percentage: number }[];
  opportunitiesSaved: number;
  topMatches: { title: string; company?: string; score: number; url: string }[];
  aiInsightText: string;
}

export interface BulkImportUploadParams {
  file?: File;
  raw_data?: string;
  source_platform?: string;
}

export interface BulkImportJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  source_platform: string;
  total_items: number;
  created_items: number;
  skipped_duplicates: number;
  message: string;
}

export interface BulkImportJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  source_platform: string;
  file_name: string;
  total_items: number;
  created_items: number;
  skipped_duplicates: number;
  processed_items: number;
  failed_items: number;
  error_log?: string;
  created_at: string;
  completed_at?: string | null;
}

