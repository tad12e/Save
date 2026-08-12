export type DestinationType = 'google_sheets' | 'notion' | 'airtable' | 'webhook' | 'custom_db';

export type ClipType = 'job' | 'education' | 'research' | 'book' | 'project' | 'programming' | 'course' | 'event' | 'scholarship' | 'music' | 'deal' | 'article' | 'general';

export type StorageMode = 'cloud' | 'local';

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
  };
  isFavorite?: boolean;
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
