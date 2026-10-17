import { DestinationConfig, ClipItem, JobCard, ConnectionSyncLog, SharedBoard, WeeklyDigestStats, CustomPageConfig } from '../types';

export const INITIAL_CUSTOM_PAGES: CustomPageConfig[] = [
  {
    id: 'page_education',
    name: 'Education & Academics',
    slug: 'education',
    iconName: 'GraduationCap',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Scholarships, academic fellowships, degree programs, and university research opportunities.',
    contentTypes: ['scholarship', 'course', 'education'],
    aiGoalPrompt: 'Extract grant amounts, application deadlines, prerequisite criteria, and university ranking.',
    createdAt: '2026-08-01T00:00:00Z',
    isSystemDefault: true
  }
];

export const INITIAL_DESTINATIONS: DestinationConfig[] = [
  {
    id: 'dest_save_vault',
    type: 'custom_db',
    name: 'Save Vault (Internal Database)',
    description: 'Default internal repository storing all clipped web links, notes, bookmarks, and categorized opportunities.',
    icon: 'HardDrive',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    connected: true,
    isDefault: true,
    status: 'active',
    lastSync: 'Just now',
    itemsSyncedCount: 0,
    targetResourceName: 'Save Clips Vault',
    syncFrequency: 'instant',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'sv1', sourceField: 'Title', targetField: 'title', enabled: true },
      { id: 'sv2', sourceField: 'URL', targetField: 'url', enabled: true },
      { id: 'sv3', sourceField: 'Selected Text', targetField: 'notes', enabled: true },
      { id: 'sv4', sourceField: 'Category', targetField: 'category', enabled: true }
    ]
  },
  {
    id: 'dest_sheets',
    type: 'google_sheets',
    name: 'Google Sheets',
    description: 'Auto-write clipped opportunities into custom spreadsheet rows with formatted columns.',
    icon: 'FileSpreadsheet',
    color: '#107C41',
    bgColor: '#E6F4EA',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Connect a Google Sheet...',
    syncFrequency: 'instant',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'm1', sourceField: 'URL', targetField: 'Column A (Link)', enabled: true },
      { id: 'm2', sourceField: 'Title', targetField: 'Column B (Page Title)', enabled: true },
      { id: 'm3', sourceField: 'Selected Text', targetField: 'Column C (Excerpt)', enabled: true },
      { id: 'm4', sourceField: 'Category', targetField: 'Column D (Tag Type)', enabled: true },
      { id: 'm5', sourceField: 'Salary / Price', targetField: 'Column E (Compensation)', enabled: true },
      { id: 'm6', sourceField: 'AI Summary', targetField: 'Column F (Key Takeaways)', enabled: true },
      { id: 'm7', sourceField: 'Date Saved', targetField: 'Column G (Timestamp)', enabled: true }
    ]
  },
  {
    id: 'dest_notion',
    type: 'notion',
    name: 'Notion Database',
    description: 'Create rich database pages with auto-extracted tags, properties, and markdown content.',
    icon: 'FileText',
    color: '#000000',
    bgColor: '#F3F4F6',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Connect a Notion Database...',
    targetResourceId: 'a1b2c3d4-notion-db',
    accountEmail: 'Workspace: Product Lab',
    authKeyMasked: 'secret_notion_••••••••9120',
    syncFrequency: 'instant',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'nm1', sourceField: 'Title', targetField: 'Name (Title)', enabled: true },
      { id: 'nm2', sourceField: 'URL', targetField: 'Source URL (URL)', enabled: true },
      { id: 'nm3', sourceField: 'Category', targetField: 'Type (Select)', enabled: true },
      { id: 'nm4', sourceField: 'Tags', targetField: 'Tags (Multi-select)', enabled: true },
      { id: 'nm5', sourceField: 'Selected Text', targetField: 'Key Content (Text)', enabled: true },
      { id: 'nm6', sourceField: 'AI Summary', targetField: 'AI Summary (Text)', enabled: true }
    ]
  },
  {
    id: 'dest_airtable',
    type: 'airtable',
    name: 'Airtable',
    description: 'Sync relational records into custom Airtable bases, view filters, and team tables.',
    icon: 'Table',
    color: '#18BFFF',
    bgColor: '#E6F7FF',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    itemsSyncedCount: 0,
    targetResourceName: 'Select an Airtable Base...',
    authKeyMasked: '',
    syncFrequency: 'instant',
    autoCreateColumns: false,
    fieldMappings: [
      { id: 'am1', sourceField: 'Title', targetField: 'Name', enabled: true },
      { id: 'am2', sourceField: 'URL', targetField: 'Link', enabled: true },
      { id: 'am3', sourceField: 'Category', targetField: 'Category', enabled: true },
      { id: 'am4', sourceField: 'AI Summary', targetField: 'Summary', enabled: true }
    ]
  },
  {
    id: 'dest_webhook',
    type: 'webhook',
    name: 'Custom Webhook / REST API',
    description: 'Send standardized JSON payloads to Zapier, Make.com, or your custom server endpoints.',
    icon: 'Zap',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    lastSync: 'Never',
    itemsSyncedCount: 0,
    endpointUrl: 'https://api.mycompany.com/v1/clipper-ingest',
    webhookSecret: 'whsec_clipper_9821a7c',
    syncFrequency: 'instant',
    autoCreateColumns: false,
    fieldMappings: [
      { id: 'wm1', sourceField: 'Full Clip Object', targetField: 'payload.data', enabled: true },
      { id: 'wm2', sourceField: 'User Metadata', targetField: 'payload.user', enabled: true }
    ]
  },
  {
    id: 'dest_custom_db',
    type: 'custom_db',
    name: 'PostgreSQL / Custom DB',
    description: 'Direct SQL insert into your database instance with schema migration support.',
    icon: 'HardDrive',
    color: '#336791',
    bgColor: '#EDF4FB',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    itemsSyncedCount: 0,
    endpointUrl: 'postgresql://admin:***@db.internal:5432/clipper_vault',
    syncFrequency: 'hourly',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'cm1', sourceField: 'Title', targetField: 'title (varchar)', enabled: true },
      { id: 'cm2', sourceField: 'URL', targetField: 'url (text)', enabled: true },
      { id: 'cm3', sourceField: 'Selected Text', targetField: 'content (text)', enabled: true },
      { id: 'cm4', sourceField: 'Category', targetField: 'category (varchar)', enabled: true }
    ]
  },
  {
    id: 'dest_spotify',
    type: 'spotify',
    name: 'Spotify',
    description: 'Directly append songs, albums, and tracks detected across web pages and social feeds into your playlists.',
    icon: 'Music',
    color: '#1DB954',
    bgColor: 'rgba(29, 185, 84, 0.1)',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Playlist: Clipper Tracks (Default)',
    targetResourceId: 'spotify_default_playlist',
    syncFrequency: 'instant',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'sp1', sourceField: 'Track Title', targetField: 'Item Name', enabled: true },
      { id: 'sp2', sourceField: 'Artist', targetField: 'Artist Name', enabled: true },
      { id: 'sp3', sourceField: 'Spotify URL', targetField: 'Track URI', enabled: true }
    ]
  },
  {
    id: 'dest_youtube_music',
    type: 'youtube_music',
    name: 'YouTube Music',
    description: 'Sync audio tracks, music videos, and song links into YouTube Music library playlists.',
    icon: 'PlayCircle',
    color: '#FF0000',
    bgColor: 'rgba(255, 0, 0, 0.1)',
    connected: false,
    isDefault: false,
    status: 'disconnected',
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Playlist: Clipper Tunes',
    targetResourceId: 'ytm_default_playlist',
    syncFrequency: 'instant',
    autoCreateColumns: true,
    fieldMappings: [
      { id: 'yt1', sourceField: 'Video/Audio Title', targetField: 'Track Title', enabled: true },
      { id: 'yt2', sourceField: 'Channel/Artist', targetField: 'Artist', enabled: true }
    ]
  }
];

export const INITIAL_CLIPS: ClipItem[] = [];

export const INITIAL_JOBS: JobCard[] = [];

export const INITIAL_SYNC_LOGS: ConnectionSyncLog[] = [];

export const INITIAL_SHARED_BOARDS: SharedBoard[] = [
  {
    id: 'board_1',
    title: '🚀 Top Remote React & AI Opportunities',
    description: 'Curated list of high-tier developer roles, grants, and technical hackathons updated daily.',
    itemCount: 0,
    membersCount: 1,
    tags: ['Jobs', 'AI', 'Remote', 'Tech'],
    isPublic: true,
    updatedAt: 'Just now',
    coverGradient: 'from-purple-600 to-indigo-600',
    members: [
      { name: 'Vault Member', avatar: 'VM', role: 'owner' }
    ]
  }
];

export const INITIAL_DIGEST: WeeklyDigestStats = {
  totalClips: 0,
  topCategory: 'vault',
  categoryBreakdown: [],
  opportunitiesSaved: 0,
  topMatches: [],
  aiInsightText: "You do not have anything saved yet. Clip articles, job postings, or research papers to generate your automated weekly digest."
};

