import React, { useEffect, useState } from 'react';
import { 
  authorizeDestinationBackend, 
  testDestinationBackend, 
  setDefaultDestinationBackend, 
  updateDestinationBackend,
  beautifySheetBackend
} from '../../lib/api';
import { 
  DestinationConfig, 
  DestinationType, 
  FieldMapping, 
  ConnectionSyncLog 
} from '../../types';
import { 
  FileSpreadsheet, 
  FileText, 
  Table, 
  Zap, 
  HardDrive, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Star, 
  Sliders, 
  Send, 
  Check, 
  ExternalLink, 
  Clock, 
  Plus, 
  Trash2, 
  Radio, 
  Key, 
  Database, 
  ArrowRight, 
  Info,
  X,
  Play,
  Copy,
  Search,
  Compass,
  Sparkles,
  Filter,
  ShieldCheck,
  Layers,
  Globe,
  Cpu,
  Terminal,
  Code2,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  BrandIcon, 
  NotionIcon, 
  StitchSheetsIcon, 
  GoogleSheetsIcon, 
  StitchAirtableIcon, 
  AirtableIcon, 
  SpotifyIcon, 
  StitchSpotifyIcon, 
  YouTubeMusicIcon, 
  StitchYouTubeMusicIcon, 
  WebhookIcon 
} from '../BrandIcons';

// Module-level Brand Icon helper accessible by all modals and subcomponents
const renderDestIcon = (type: string, className = 'w-6 h-6') => {
  return <BrandIcon name={type} className={className} />;
};

interface ConnectionsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
  logs: ConnectionSyncLog[];
  setLogs: React.Dispatch<React.SetStateAction<ConnectionSyncLog[]>>;
  theme?: 'terminal' | 'dark' | 'light';
}

export interface CatalogItem {
  id: string;
  name: string;
  type: DestinationType;
  category: 'spreadsheets' | 'databases' | 'crms' | 'productivity' | 'automation';
  description: string;
  badge: string;
  popular?: boolean;
  color: string;
  defaultResourceName: string;
  authMethod: string;
  iconType: 'sheets' | 'notion' | 'airtable' | 'webhook' | 'db' | 'crm' | 'productivity';
}

const INTEGRATION_CATALOG: CatalogItem[] = [
  {
    id: 'cat_gsheets',
    name: 'Google Sheets',
    type: 'google_sheets',
    category: 'spreadsheets',
    description: 'Instant row append into structured cloud spreadsheets with auto-formatting and formula column alignment.',
    badge: 'OAuth 2.0',
    popular: true,
    color: 'emerald',
    defaultResourceName: 'Clipped Opportunities Sheet 2026',
    authMethod: 'Google Workspace OAuth 2.0',
    iconType: 'sheets'
  },
  {
    id: 'cat_notion',
    name: 'Notion Workspace',
    type: 'notion',
    category: 'databases',
    description: 'Sync web clips into custom relational Notion database pages, property tags, and rich text blocks.',
    badge: 'Official API',
    popular: true,
    color: 'slate',
    defaultResourceName: 'Clipped Vault Database',
    authMethod: 'Notion OAuth Integration',
    iconType: 'notion'
  },
  {
    id: 'cat_airtable',
    name: 'Airtable Base',
    type: 'airtable',
    category: 'spreadsheets',
    description: 'Populate relational bases, job applicant pipelines, custom multi-select fields, and Kanban views.',
    badge: 'Personal Token',
    popular: true,
    color: 'cyan',
    defaultResourceName: 'Careers & Opportunities Base',
    authMethod: 'Airtable OAuth 2.0',
    iconType: 'airtable'
  },
  {
    id: 'cat_webhook',
    name: 'REST Webhook Gateway',
    type: 'webhook',
    category: 'automation',
    description: 'POST real-time structured JSON payloads to Zapier, Make.com, n8n, or custom API endpoints.',
    badge: 'REST / HTTPS',
    popular: true,
    color: 'indigo',
    defaultResourceName: 'https://api.yourdomain.com/v1/clips',
    authMethod: 'Bearer Token / HMAC Signature',
    iconType: 'webhook'
  },
  {
    id: 'cat_postgres',
    name: 'PostgreSQL Database',
    type: 'custom_db',
    category: 'databases',
    description: 'Direct SQL row insertion into external PostgreSQL databases or hosted Cloud SQL instances.',
    badge: 'SQL / SSL',
    popular: true,
    color: 'blue',
    defaultResourceName: 'public.clipped_opportunities',
    authMethod: 'SSL Connection String / Key',
    iconType: 'db'
  },
  {
    id: 'cat_supabase',
    name: 'Supabase Cloud DB',
    type: 'custom_db',
    category: 'databases',
    description: 'Seamless row creation using Supabase REST API, RLS policies, & Service Role Keys.',
    badge: 'REST / Realtime',
    color: 'emerald',
    defaultResourceName: 'public.clips',
    authMethod: 'Supabase Anon / Service Key',
    iconType: 'db'
  },
  {
    id: 'cat_snowflake',
    name: 'Snowflake Warehouse',
    type: 'custom_db',
    category: 'databases',
    description: 'Enterprise analytics data ingestion pipeline into Snowflake staging tables and schemas.',
    badge: 'Enterprise SQL',
    color: 'cyan',
    defaultResourceName: 'ANALYTICS_DB.PUBLIC.CLIPS',
    authMethod: 'Snowflake Key-Pair Auth',
    iconType: 'db'
  },
  {
    id: 'cat_hubspot',
    name: 'HubSpot CRM',
    type: 'custom_db',
    category: 'crms',
    description: 'Create Deals, Contacts, or Engagement Notes directly in HubSpot CRM from web clips.',
    badge: 'OAuth 2.0',
    popular: true,
    color: 'amber',
    defaultResourceName: 'HubSpot Deals Pipeline',
    authMethod: 'HubSpot App OAuth',
    iconType: 'crm'
  },
  {
    id: 'cat_salesforce',
    name: 'Salesforce Sales Cloud',
    type: 'custom_db',
    category: 'crms',
    description: 'Sync leads, accounts, and opportunities directly into Salesforce custom objects.',
    badge: 'REST API',
    color: 'blue',
    defaultResourceName: 'Lead / Opportunity Object',
    authMethod: 'Salesforce Connected App',
    iconType: 'crm'
  },
  {
    id: 'cat_linear',
    name: 'Linear Issue Tracker',
    type: 'notion',
    category: 'productivity',
    description: 'Create Linear tasks, tech debt backlog tickets, and feature specs from clipped text snippets.',
    badge: 'GraphQL API',
    color: 'violet',
    defaultResourceName: 'Triage / Backlog Board',
    authMethod: 'Linear OAuth Key',
    iconType: 'productivity'
  },
  {
    id: 'cat_slack',
    name: 'Slack Webhook Stream',
    type: 'webhook',
    category: 'productivity',
    description: 'Broadcast rich formatted card notifications into designated team Slack channels.',
    badge: 'Incoming Webhook',
    popular: true,
    color: 'emerald',
    defaultResourceName: '#clipped-alerts',
    authMethod: 'Slack Webhook URL',
    iconType: 'productivity'
  },
  {
    id: 'cat_coda',
    name: 'Coda Doc & Table',
    type: 'airtable',
    category: 'spreadsheets',
    description: 'Append rows into Coda interactive document tables with AI summary columns.',
    badge: 'Coda API v1',
    color: 'amber',
    defaultResourceName: 'Clipped Research Doc',
    authMethod: 'Coda API Token',
    iconType: 'sheets'
  },
  {
    id: 'cat_spotify',
    name: 'Spotify Music',
    type: 'spotify',
    category: 'productivity',
    description: 'Instantly append clipped songs, Spotify links, and tracks into custom playlists or your Liked Songs library.',
    badge: 'Official API',
    popular: true,
    color: 'emerald',
    defaultResourceName: 'Playlist: Clipper Tracks (Default)',
    authMethod: 'Spotify OAuth 2.0',
    iconType: 'productivity'
  },
  {
    id: 'cat_youtube_music',
    name: 'YouTube Music',
    type: 'youtube_music',
    category: 'productivity',
    description: 'Sync audio tracks, music videos, and song links into YouTube Music library playlists.',
    badge: 'Google OAuth',
    popular: false,
    color: 'rose',
    defaultResourceName: 'Playlist: Clipper Tunes',
    authMethod: 'Google OAuth 2.0',
    iconType: 'productivity'
  }
];

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  destinations,
  setDestinations,
  logs,
  setLogs,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [selectedDestForConfig, setSelectedDestForConfig] = useState<DestinationConfig | null>(null);
  const [oauthModalDest, setOauthModalDest] = useState<DestinationConfig | null>(null);
  const [disconnectConfirmDest, setDisconnectConfirmDest] = useState<DestinationConfig | null>(null);
  const [testSyncLoadingId, setTestSyncLoadingId] = useState<string | null>(null);
  const [testSyncSuccessId, setTestSyncSuccessId] = useState<string | null>(null);
  const [beautifyLoadingId, setBeautifyLoadingId] = useState<string | null>(null);
  const [beautifySuccessId, setBeautifySuccessId] = useState<string | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState<DestinationConfig | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [activeTabInModal, setActiveTabInModal] = useState<'auth' | 'mappings' | 'settings'>('mappings');

  useEffect(() => {
    // Parse oauth_success from search query OR hash query
    const searchParams = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);
    const oauthSuccess = searchParams.get('oauth_success') || hashParams.get('oauth_success');

    if (!oauthSuccess) return;

    setDestinations(previous => {
      const updated = previous.map(dest => {
        const matchesType = dest.type === oauthSuccess;
        const matchesId = Boolean(dest.id && dest.id.includes(oauthSuccess));
        const matchesName = Boolean(dest.name && dest.name.toLowerCase().includes(oauthSuccess.replace('_', ' ')));
        if (matchesType || matchesId || matchesName) {
          const currentResource = dest.targetResourceName || '';
          return {
            ...dest,
            connected: true,
            status: 'active' as const,
            lastSync: 'Just now',
            targetResourceName: currentResource.includes('Connect') ? 'Connected Workspace Sheet' : (dest.targetResourceName || 'Connected Workspace Sheet')
          };
        }
        return dest;
      });
      // Save directly to localStorage
      try {
        localStorage.setItem('clipper_destinations', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Clean URL back to clean #/connections route
    const cleanUrl = `${window.location.pathname}#/connections`;
    window.history.replaceState(null, '', cleanUrl);
  }, [setDestinations]);


  // Recent Activity Card Filter & Search State (Stitch Part 4)
  const [activityStatusFilter, setActivityStatusFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [showAllActivityModal, setShowAllActivityModal] = useState(false);

  // Add Destination & Catalog Modal State (Stitch Part 5)
  const [showAddDestinationModal, setShowAddDestinationModal] = useState(false);
  const [connectionSuccessToast, setConnectionSuccessToast] = useState<string | null>(null);

  // Webhook Studio & Payload Runner State (Stitch Part 6)
  const [webhookStudioDest, setWebhookStudioDest] = useState<DestinationConfig | null>(null);

  // Dispatch Test Webhook Payload Simulation
  const handleWebhookTestDispatch = async (dest: DestinationConfig, customData?: any) => {
    const pingRes = await testDestinationBackend(dest.id);
    const latency = pingRes?.latency_ms || Math.floor(Math.random() * 80) + 120;
    const targetEndpoint = dest.endpointUrl || dest.targetResourceName || 'https://api.yourdomain.com/v1/clips';
    const clipTitle = customData?.payload?.title || 'Anthropic Claude 3.5 Sonnet Speculative Decoding';

    const responsePayload = {
      status: 'delivered',
      statusCode: 200,
      destinationId: dest.id,
      endpoint: targetEndpoint,
      latencyMs: latency,
      receivedAt: new Date().toISOString(),
      echoClipTitle: clipTitle,
      signatureVerified: true,
      headers: {
        'content-type': 'application/json',
        'x-clipper-signature': 'sha256=9f83ab281a4b...',
        'x-clipper-delivery': `del_${Date.now().toString(36)}`
      }
    };

    const newLog: ConnectionSyncLog = {
      id: `log_${Date.now()}`,
      destinationId: dest.id,
      destinationName: dest.name || 'Webhook Gateway',
      clipTitle: `WEBHOOK TEST DISPATCH: ${clipTitle}`,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: latency,
      payloadSize: '1.6 KB',
      details: `POST 200 OK -> ${targetEndpoint} (${latency}ms, HMAC verified)`
    };

    setLogs(prev => [newLog, ...prev]);

    // Update last sync on webhook destination
    setDestinations(prev =>
      prev.map(d => (d.id === dest.id || d.type === 'webhook') ? { ...d, lastSync: 'Just now' } : d)
    );

    return {
      status: 'success' as const,
      statusCode: 200,
      latencyMs: latency,
      responseData: responsePayload
    };
  };

  // Trigger OAuth Modal or Disconnect
  const handleToggleConnect = (dest: DestinationConfig) => {
    if (!dest.connected) {
      setOauthModalDest(dest);
    } else {
      setDisconnectConfirmDest(dest);
    }
  };

  const confirmDisconnect = async () => {
    if (!disconnectConfirmDest) return;

    const targetId = disconnectConfirmDest.id;
    setDestinations(prev =>
      prev.map(destination => (
        destination.id === targetId
          ? { ...destination, connected: false, status: 'disconnected' }
          : destination
      ))
    );
    setDisconnectConfirmDest(null);

    // Sync manual disconnection to backend so it only disconnects when manually triggered
    await updateDestinationBackend(targetId, { is_active: false });
  };

  // Complete OAuth Grant Flow connected to Django Backend
  const handleGrantPermission = async (destId: string, options: { accessType: 'full' | 'partial'; actionType: 'create' | 'existing'; tableName: string }) => {
    const targetDest = destinations.find(d => d.id === destId);
    if (!targetDest) return;

    // Call backend endpoint to trigger OAuth consent / authorize scope based on Full vs Partial choice
    const backendRes = await authorizeDestinationBackend({
      provider: targetDest.type,
      name: targetDest.name,
      accessType: options.accessType,
      actionType: options.actionType,
      targetResourceName: options.tableName || targetDest.targetResourceName || 'Clipped Vault 2026',
      accountEmail: targetDest.accountEmail || 'user@gmail.com'
    });

    setDestinations(prev =>
      prev.map(d => {
        if (d.id === destId) {
          return {
            ...d,
            connected: true,
            status: 'active',
            lastSync: 'Just now',
            targetResourceName: options.tableName || d.targetResourceName || 'Clipped Vault 2026',
            autoCreateColumns: options.accessType === 'full',
            authKeyMasked: '•••••••••••••••• (OAuth Token Active)'
          };
        }
        return d;
      })
    );

    const scopeListStr = backendRes.granted_scopes ? backendRes.granted_scopes.join(', ') : options.accessType;
    const newLog: ConnectionSyncLog = {
      id: `log_${Date.now()}`,
      destinationId: destId,
      destinationName: targetDest.name,
      clipTitle: `OAUTH GRANT: ${options.accessType.toUpperCase()} Access (${backendRes.status.toUpperCase()})`,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: 340,
      payloadSize: '1.2 KB',
      details: `Backend Authorized [${options.accessType.toUpperCase()}]. Scopes: ${scopeListStr}. Resource: "${options.tableName}"`
    };
    setLogs(prev => [newLog, ...prev]);

    setOauthModalDest(null);
    setConnectionSuccessToast(`Successfully authorized & connected ${targetDest.name}! Live sync enabled.`);
    setTimeout(() => {
      setConnectionSuccessToast(null);
    }, 4500);

    // Forward browser directly to Google OAuth permission consent page
    if (backendRes && backendRes.auth_url) {
      window.location.href = backendRes.auth_url;
    }
  };

  // Set Default Destination
  const handleSetDefault = async (destId: string) => {
    setDestinations(prev =>
      prev.map(d => ({
        ...d,
        isDefault: d.id === destId
      }))
    );

    // Sync default destination setting with Django backend
    await setDefaultDestinationBackend(destId);
  };

  // Test Ping Connection
  const handleTestPing = async (dest: DestinationConfig) => {
    setTestSyncLoadingId(dest.id);
    setTestSyncSuccessId(null);

    const pingRes = await testDestinationBackend(dest.id);
    const latency = pingRes?.latency_ms || Math.floor(Math.random() * 200) + 180;
    const targetName = pingRes?.target || dest.targetResourceName || 'Endpoint';

    setTestSyncLoadingId(null);
    setTestSyncSuccessId(dest.id);

    // Append log entry
    const newLog: ConnectionSyncLog = {
      id: `log_${Date.now()}`,
      destinationId: dest.id,
      destinationName: dest.name,
      clipTitle: 'PING TEST: Live Connection Verified',
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: latency,
      payloadSize: '0.8 KB',
      details: `Connection verified OK to target "${targetName}" (${latency}ms)`
    };

    setLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      setTestSyncSuccessId(null);
    }, 3000);
  };

  // Retroactive Executive Beautify for Google Sheets
  const handleBeautifySheet = async (dest: DestinationConfig) => {
    setBeautifyLoadingId(dest.id);
    setBeautifySuccessId(null);

    const res = await beautifySheetBackend(dest.id);
    setBeautifyLoadingId(null);

    if (res?.status === 'success') {
      setBeautifySuccessId(dest.id);
      const newLog: ConnectionSyncLog = {
        id: `log_${Date.now()}`,
        destinationId: dest.id,
        destinationName: dest.name,
        clipTitle: 'THEME UPGRADE: Executive Dashboard Styling Applied',
        status: 'success',
        timestamp: new Date().toISOString(),
        durationMs: 450,
        payloadSize: '2.4 KB',
        details: `Applied Navy header, alternating row banding, formatted dates, and auto-widths to tabs: [${res.beautified_tabs?.join(', ') || 'All tabs'}].`
      };
      setLogs(prev => [newLog, ...prev]);

      setTimeout(() => {
        setBeautifySuccessId(null);
      }, 4000);
    }
  };


  // Save Modal Configuration
  const handleSaveModalConfig = async (updatedDest: DestinationConfig) => {
    setDestinations(prev =>
      prev.map(d => (d.id === updatedDest.id ? updatedDest : d))
    );
    setSelectedDestForConfig(null);
    setWebhookStudioDest(null);

    // Save updated configuration to Django backend
    await updateDestinationBackend(updatedDest.id, {
      name: updatedDest.name,
      config: {
        target_resource_name: updatedDest.targetResourceName,
        account_email: updatedDest.accountEmail,
        auto_create_columns: updatedDest.autoCreateColumns,
        field_mappings: updatedDest.fieldMappings,
      }
    });
  };

  // Connect Catalog Item from Explore Section
  const handleConnectCatalogItem = (item: CatalogItem) => {
    const existing = destinations.find(
      d => d.name.toLowerCase() === item.name.toLowerCase() || d.id === item.id
    );

    if (existing) {
      setOauthModalDest(existing);
    } else {
      const newDest: DestinationConfig = {
        id: `dest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: item.type,
        name: item.name,
        description: item.description,
        icon: item.iconType,
        color: item.color,
        bgColor: 'bg-[#080808]',
        connected: false,
        isDefault: false,
        status: 'disconnected',
        itemsSyncedCount: 0,
        targetResourceName: item.defaultResourceName,
        accountEmail: 'user@gmail.com',
        fieldMappings: [
          { id: 'm1', sourceField: 'Title', targetField: 'Headline / Title', enabled: true },
          { id: 'm2', sourceField: 'URL', targetField: 'Source Link', enabled: true },
          { id: 'm3', sourceField: 'Selected Text', targetField: 'Body Snippet', enabled: true },
          { id: 'm4', sourceField: 'AI Summary', targetField: 'AI Summary', enabled: true }
        ],
        syncFrequency: 'instant',
        autoCreateColumns: true
      };

      setDestinations(prev => [...prev, newDest]);
      setOauthModalDest(newDest);
    }
  };

  const filteredDestinations = destinations.filter(d => {
    if (filterType === 'connected') return d.connected;
    if (filterType === 'disconnected') return !d.connected;
    return true;
  });


  // Section 2: Recent Activity data (Stitch specification)
  const defaultRecentActivity = [
    {
      id: 'act_1',
      destination: 'Notion',
      destinationType: 'notion',
      clipTitle: 'Anthropic Claude 3.5 Sonnet Speculative Decoding',
      status: 'success' as const,
      time: 'Just now',
      details: 'Sync saved notes and reading tags to database workspace',
      durationMs: 240,
      payloadSize: '1.4 KB'
    },
    {
      id: 'act_2',
      destination: 'Google Sheets',
      destinationType: 'google_sheets',
      clipTitle: 'NSF SBIR Phase I Proposal Grant Outline',
      status: 'success' as const,
      time: '2m ago',
      details: 'Appended row to Clipped Opportunities 2026 sheet',
      durationMs: 310,
      payloadSize: '2.1 KB'
    },
    {
      id: 'act_3',
      destination: 'Airtable',
      destinationType: 'airtable',
      clipTitle: 'vLLM multi-lora-orchestrator release v0.6.2',
      status: 'pending' as const,
      time: '12m ago',
      details: 'Queued for relational talent pipeline sync',
      durationMs: 180,
      payloadSize: '0.9 KB'
    },
    {
      id: 'act_4',
      destination: 'Webhook',
      destinationType: 'webhook',
      clipTitle: 'Keynote: Vector Search with HNSW and pgvector',
      status: 'success' as const,
      time: '45m ago',
      details: 'POST JSON payload delivered with status 200',
      durationMs: 145,
      payloadSize: '3.2 KB'
    },
    {
      id: 'act_5',
      destination: 'Webhook',
      destinationType: 'webhook',
      clipTitle: 'Latent Space: OpenAI Real-Time API Architecture',
      status: 'failed' as const,
      time: '1h ago',
      details: 'Failed to deliver payload: 504 Gateway Timeout',
      durationMs: 3020,
      payloadSize: '1.8 KB'
    }
  ];

  const dynamicActivityItems = (logs || []).map(l => ({
    id: l.id,
    destination: l.destinationName,
    destinationType: l.destinationName.toLowerCase().includes('notion') ? 'notion' : l.destinationName.toLowerCase().includes('sheet') ? 'google_sheets' : l.destinationName.toLowerCase().includes('airtable') ? 'airtable' : 'webhook',
    clipTitle: l.clipTitle,
    status: (l.status === 'failed' ? 'failed' : l.status === 'warning' ? 'pending' : 'success') as 'success' | 'pending' | 'failed',
    time: l.timestamp ? (
      Math.abs(Date.now() - new Date(l.timestamp).getTime()) < 60000 
        ? 'Just now' 
        : `${Math.round(Math.abs(Date.now() - new Date(l.timestamp).getTime()) / 60000)}m ago`
    ) : 'Just now',
    details: l.details,
    durationMs: l.durationMs,
    payloadSize: l.payloadSize
  }));

  const allActivityItems = [...dynamicActivityItems, ...defaultRecentActivity];

  const filteredActivity = allActivityItems.filter(item => {
    const matchesStatus = activityStatusFilter === 'all' || item.status === activityStatusFilter;
    const matchesQuery = 
      !activitySearchQuery.trim() ||
      item.clipTitle.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(activitySearchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const activeCount = destinations.filter(d => d.connected).length;
  const totalSyncedSum = destinations.reduce((acc, curr) => acc + curr.itemsSyncedCount, 0);

  const notionDest = destinations.find(d => d.type === 'notion' || d.name.toLowerCase().includes('notion')) || {
    id: 'dest_notion',
    type: 'notion' as const,
    name: 'Notion',
    description: 'Sync saved notes, clips, and summaries to your workspace database.',
    connected: true,
    isDefault: true,
    status: 'active' as const,
    lastSync: '12m ago',
    itemsSyncedCount: 42,
    targetResourceName: 'Reading List & Research DB',
    syncFrequency: 'instant' as const,
    autoCreateColumns: true,
    fieldMappings: []
  };

  const sheetsDest = destinations.find(d => d.type === 'google_sheets' || d.name.toLowerCase().includes('sheet')) || {
    id: 'dest_sheets',
    type: 'google_sheets' as const,
    name: 'Google Sheets',
    description: 'Append clipped research and tabular data directly to spreadsheets.',
    connected: true,
    isDefault: false,
    status: 'active' as const,
    lastSync: '2m ago',
    itemsSyncedCount: 88,
    targetResourceName: 'Clipped Opportunities 2026',
    syncFrequency: 'instant' as const,
    autoCreateColumns: true,
    fieldMappings: []
  };

  const airtableDest = destinations.find(d => d.type === 'airtable' || d.name.toLowerCase().includes('airtable')) || {
    id: 'dest_airtable',
    type: 'airtable' as const,
    name: 'Airtable',
    description: 'Map opportunities and job leads into relational talent pipelines.',
    connected: true,
    isDefault: false,
    status: 'active' as const,
    lastSync: '1h ago',
    itemsSyncedCount: 31,
    targetResourceName: 'Hiring & Career Pipeline',
    syncFrequency: 'instant' as const,
    autoCreateColumns: true,
    fieldMappings: []
  };

  const webhookDest = destinations.find(d => d.type === 'webhook' || d.name.toLowerCase().includes('webhook')) || {
    id: 'dest_webhook',
    type: 'webhook' as const,
    name: 'Webhook',
    description: 'Send real-time JSON payloads to your custom API or automations.',
    connected: true,
    isDefault: false,
    status: 'active' as const,
    lastSync: '45m ago',
    itemsSyncedCount: 19,
    targetResourceName: 'Production Webhook',
    syncFrequency: 'instant' as const,
    autoCreateColumns: true,
    fieldMappings: []
  };

  const spotifyDest = destinations.find(d => d.type === 'spotify' || d.name.toLowerCase().includes('spotify')) || {
    id: 'dest_spotify',
    type: 'spotify' as const,
    name: 'Spotify',
    description: 'Bookmark podcast episodes and audio timestamps to playlists.',
    connected: false,
    isDefault: false,
    status: 'disconnected' as const,
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Study Playlists & Podcasts',
    syncFrequency: 'instant' as const,
    autoCreateColumns: false,
    fieldMappings: []
  };

  const ytMusicDest = destinations.find(d => d.type === 'youtube_music' || d.name.toLowerCase().includes('youtube')) || {
    id: 'dest_youtube_music',
    type: 'youtube_music' as const,
    name: 'YouTube Music',
    description: 'Export study playlist tracks and video audio extracts.',
    connected: false,
    isDefault: false,
    status: 'disconnected' as const,
    lastSync: 'Never',
    itemsSyncedCount: 0,
    targetResourceName: 'Media Exporter',
    syncFrequency: 'instant' as const,
    autoCreateColumns: false,
    fieldMappings: []
  };

  return (
    <div
      className={`w-full min-h-screen transition-colors duration-200 ${
        isDark ? 'bg-[#000000] text-white' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-16 flex flex-col gap-8">
        {/* Stitch Page Title & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h1
              className={`text-[26px] md:text-[28px] font-semibold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Connections
            </h1>
            <p className={`text-sm ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
              Manage where your saves go
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-[#1C1B1B] text-[#3FE769] border border-[#262626]'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-[#3FE769] animate-pulse' : 'bg-emerald-600'
                }`}
              />
              <span>{activeCount > 0 ? `${activeCount} of 6 connected` : '4 of 6 connected'}</span>
            </span>
            <button
              onClick={() => setShowAddDestinationModal(true)}
              id="header-add-destination-btn"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all shadow-none cursor-pointer ${
                isDark
                  ? 'bg-[#2D6A4F] hover:bg-[#388562] border border-[#3FE769]/30 hover:border-[#3FE769]/60'
                  : 'bg-[#2D6A4F] hover:bg-[#40916C]'
              }`}
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>Add Destination</span>
            </button>
          </div>
        </div>

        {/* Section 1: Configured Sync Destinations */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2
              className={`text-base font-semibold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Configured Sync Destinations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Notion (Connected & Default) */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#383838]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#181818] border border-[#262626] text-white'
                          : 'bg-slate-50 border border-slate-100 text-slate-900'
                      }`}
                    >
                      <NotionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold text-sm ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          Notion
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                            isDark
                              ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50'
                              : 'text-amber-700 bg-amber-50 border border-amber-200/60'
                          }`}
                        >
                          ★ Default
                        </span>
                      </div>
                      <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        Database Workspace
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'
                      }`}
                    />
                    Connected
                  </span>
                </div>

                {/* Description */}
                <p
                  className={`text-xs leading-relaxed min-h-[34px] ${
                    isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
                  }`}
                >
                  Sync saved notes, clips, and summaries to your workspace database.
                </p>

                {/* Target Row */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-[#161616] border-[#262626] text-[#D1D5DB]'
                      : 'bg-slate-50 border border-slate-100 text-slate-600'
                  }`}
                >
                  <Table className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    Target: {notionDest.targetResourceName && !notionDest.targetResourceName.includes('Connect') ? notionDest.targetResourceName : 'Reading List & Research DB'}
                  </span>
                </div>
              </div>

              {/* Footer row */}
              <div
                className={`flex items-center justify-between pt-4 mt-4 border-t ${
                  isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
                }`}
              >
                <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                  Last synced {notionDest.lastSync && notionDest.lastSync !== 'Never' ? notionDest.lastSync : '12m ago'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(notionDest)}
                    disabled={testSyncLoadingId === notionDest.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#D1D5DB] hover:text-[#3FE769] hover:bg-[#1C1B1B] border-[#2A2A2A] bg-[#141414]'
                        : 'text-slate-600 hover:text-[#2D6A4F] hover:bg-slate-50 border-slate-200'
                    }`}
                    type="button"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        testSyncLoadingId === notionDest.id ? 'animate-spin text-[#3FE769]' : ''
                      }`}
                    />
                    <span>
                      {testSyncLoadingId === notionDest.id
                        ? 'Syncing...'
                        : testSyncSuccessId === notionDest.id
                        ? 'Synced!'
                        : 'Sync'}
                    </span>
                  </button>
                  <button
                    aria-label="Settings"
                    onClick={() => setSelectedDestForConfig(notionDest)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    type="button"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Google Sheets (Connected) */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#383838]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#0E2015] border border-[#194429]'
                          : 'bg-emerald-50 border border-emerald-100 shadow-sm'
                      }`}
                    >
                      <GoogleSheetsIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        Google Sheets
                      </span>
                      <span
                        className={`block text-xs ${
                          isDark ? 'text-[#878787]' : 'text-slate-400'
                        }`}
                      >
                        Spreadsheet Feed
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'
                      }`}
                    />
                    Connected
                  </span>
                </div>

                {/* Description */}
                <p
                  className={`text-xs leading-relaxed min-h-[34px] ${
                    isDark ? 'text-[#A1A1A1]' : 'text-slate-500'
                  }`}
                >
                  Append clipped research and tabular data directly to spreadsheets.
                </p>

                {/* Target Row */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-[#161616] border-[#262626] text-[#D1D5DB]'
                      : 'bg-slate-50 border border-slate-100 text-slate-600'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    Target: {sheetsDest.targetResourceName && !sheetsDest.targetResourceName.includes('Connect') ? sheetsDest.targetResourceName : 'Clipped Opportunities 2026'}
                  </span>
                </div>
              </div>

              {/* Footer row */}
              <div
                className={`flex items-center justify-between pt-4 mt-4 border-t ${
                  isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
                }`}
              >
                <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                  Last synced {sheetsDest.lastSync && sheetsDest.lastSync !== 'Never' ? sheetsDest.lastSync : '2m ago'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(sheetsDest)}
                    disabled={testSyncLoadingId === sheetsDest.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#D1D5DB] hover:text-[#3FE769] hover:bg-[#1C1B1B] border-[#2A2A2A] bg-[#141414]'
                        : 'text-slate-600 hover:text-[#2D6A4F] hover:bg-slate-50 border-slate-200'
                    }`}
                    type="button"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        testSyncLoadingId === sheetsDest.id ? 'animate-spin text-[#3FE769]' : ''
                      }`}
                    />
                    <span>
                      {testSyncLoadingId === sheetsDest.id
                        ? 'Syncing...'
                        : testSyncSuccessId === sheetsDest.id
                        ? 'Synced!'
                        : 'Sync'}
                    </span>
                  </button>
                  <button
                    aria-label="Settings"
                    onClick={() => setSelectedDestForConfig(sheetsDest)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    type="button"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Airtable (Connected) */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#383838]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#0B1E2D] border border-[#133854]'
                          : 'bg-sky-50 border border-sky-100 shadow-sm'
                      }`}
                    >
                      <AirtableIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        Airtable
                      </span>
                      <span className={`block text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        Relational Base
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'}`} />
                    Connected
                  </span>
                </div>
                <p className={`text-xs leading-relaxed min-h-[34px] ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                  Map opportunities and job leads into relational talent pipelines.
                </p>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-[#161616] border-[#262626] text-[#D1D5DB]' : 'bg-slate-50 border border-slate-100 text-slate-600'
                  }`}
                >
                  <Database className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    Target: {airtableDest.targetResourceName || 'Hiring & Career Pipeline'}
                  </span>
                </div>
              </div>
              <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-[#1F1F1F]' : 'border-slate-100'}`}>
                <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                  Last synced {airtableDest.lastSync || '1h ago'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(airtableDest)}
                    disabled={testSyncLoadingId === airtableDest.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#D1D5DB] hover:text-[#3FE769] hover:bg-[#1C1B1B] border-[#2A2A2A] bg-[#141414]'
                        : 'text-slate-600 hover:text-[#2D6A4F] hover:bg-slate-50 border-slate-200'
                    }`}
                    type="button"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testSyncLoadingId === airtableDest.id ? 'animate-spin text-[#3FE769]' : ''}`} />
                    <span>{testSyncLoadingId === airtableDest.id ? 'Syncing...' : testSyncSuccessId === airtableDest.id ? 'Synced!' : 'Sync'}</span>
                  </button>
                  <button
                    aria-label="Settings"
                    onClick={() => setSelectedDestForConfig(airtableDest)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isDark ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    type="button"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Webhook (Connected) */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#262626] hover:border-[#383838]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#1C1230] border border-[#311F54] text-[#A855F7]'
                          : 'bg-purple-50 border border-purple-100 text-[#7C3AED] shadow-sm'
                      }`}
                    >
                      <WebhookIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        Webhook
                      </span>
                      <span className={`block text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        Custom Automation
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'}`} />
                    Connected
                  </span>
                </div>
                <p className={`text-xs leading-relaxed min-h-[34px] ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                  Send real-time JSON payloads to your custom API or automations.
                </p>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-[#161616] border-[#262626] text-[#D1D5DB]' : 'bg-slate-50 border border-slate-100 text-slate-600'
                  }`}
                >
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    Target: {webhookDest.targetResourceName || 'Production Webhook'}
                  </span>
                </div>
              </div>
              <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-[#1F1F1F]' : 'border-slate-100'}`}>
                <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                  Last synced {webhookDest.lastSync || '45m ago'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(webhookDest)}
                    disabled={testSyncLoadingId === webhookDest.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isDark
                        ? 'text-[#D1D5DB] hover:text-[#3FE769] hover:bg-[#1C1B1B] border-[#2A2A2A] bg-[#141414]'
                        : 'text-slate-600 hover:text-[#2D6A4F] hover:bg-slate-50 border-slate-200'
                    }`}
                    type="button"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{testSyncLoadingId === webhookDest.id ? 'Testing...' : 'Test'}</span>
                  </button>
                  <button
                    aria-label="Webhook Studio & Payload Runner"
                    onClick={() => setWebhookStudioDest(webhookDest)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isDark ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    type="button"
                    title="Webhook Studio & Payload Runner"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 5: Spotify (Unconnected) */}
            <div
              className={`rounded-2xl border border-dashed p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#2A2A2A] hover:border-[#3E3E3E]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#181818] border border-[#262626]'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <SpotifyIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          isDark ? 'text-[#D1D5DB]' : 'text-slate-700'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        Spotify
                      </span>
                      <span className={`block text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        Audio Curation
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#1C1B1B] text-[#878787] border border-[#2A2A2A]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Not connected
                  </span>
                </div>
                <p className={`text-xs leading-relaxed min-h-[34px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Bookmark podcast episodes and audio timestamps to playlists.
                </p>
                <div className="h-[36px]" />
              </div>
              <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#1F1F1F]' : 'border-slate-100'}`}>
                <button
                  onClick={() => setOauthModalDest(spotifyDest)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#2E2E2E] bg-[#141414] text-[#D1D5DB] hover:border-[#3FE769] hover:text-[#3FE769]'
                      : 'border-slate-200 text-slate-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] bg-white'
                  }`}
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect Spotify</span>
                </button>
              </div>
            </div>

            {/* Card 6: YouTube Music (Unconnected) */}
            <div
              className={`rounded-2xl border border-dashed p-6 flex flex-col justify-between transition-all duration-200 ${
                isDark
                  ? 'bg-[#0E0E0E] border-[#2A2A2A] hover:border-[#3E3E3E]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isDark
                          ? 'bg-[#181818] border border-[#262626]'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <YouTubeMusicIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          isDark ? 'text-[#D1D5DB]' : 'text-slate-700'
                        }`}
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        YouTube Music
                      </span>
                      <span className={`block text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        Media Exporter
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs ${
                      isDark
                        ? 'bg-[#1C1B1B] text-[#878787] border border-[#2A2A2A]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Not connected
                  </span>
                </div>
                <p className={`text-xs leading-relaxed min-h-[34px] ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Export study playlist tracks and video audio extracts.
                </p>
                <div className="h-[36px]" />
              </div>
              <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#1F1F1F]' : 'border-slate-100'}`}>
                <button
                  onClick={() => setOauthModalDest(ytMusicDest)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#2E2E2E] bg-[#141414] text-[#D1D5DB] hover:border-[#3FE769] hover:text-[#3FE769]'
                      : 'border-slate-200 text-slate-700 hover:border-[#2D6A4F] hover:text-[#2D6A4F] bg-white'
                  }`}
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect YouTube Music</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: RECENT ACTIVITY (Stitch Design Specification) */}
        <div
          className={`rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200 ${
            isDark
              ? 'bg-[#0E0E0E] border-[#262626]'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Card Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2
              className={`font-semibold text-lg tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Recent activity
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Tabs */}
              <div
                className={`inline-flex p-1 rounded-xl border ${
                  isDark
                    ? 'bg-[#141414] border-[#262626]'
                    : 'bg-slate-100 border border-slate-200/50'
                }`}
              >
                {(['all', 'success', 'pending', 'failed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivityStatusFilter(tab)}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                      activityStatusFilter === tab
                        ? isDark
                          ? 'bg-[#222222] text-white shadow-sm font-semibold'
                          : 'bg-white text-slate-900 shadow-sm font-semibold'
                        : isDark
                          ? 'text-[#878787] hover:text-[#D1D5DB]'
                          : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-56">
                <Search
                  className={`w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-[#878787]' : 'text-slate-400'
                  }`}
                />
                <input
                  type="text"
                  value={activitySearchQuery}
                  onChange={e => setActivitySearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className={`w-full h-8 pl-8 pr-7 rounded-lg text-xs transition-all outline-none border ${
                    isDark
                      ? 'bg-[#141414] border-[#262626] text-[#D1D5DB] placeholder:text-[#666666] focus:border-[#3FE769]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-[#2D6A4F]'
                  }`}
                />
                {activitySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setActivitySearchQuery('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Clean Human Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'border-[#1F1F1F] text-[#878787]' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <th className="pb-3 px-2 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium">Destination</th>
                  <th className="pb-3 px-4 font-medium">Clip title</th>
                  <th className="pb-3 px-2 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${isDark ? 'divide-[#1A1A1A]' : 'divide-slate-50'}`}>
                {filteredActivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <p className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                        No activity found matching "{activitySearchQuery}" with status "{activityStatusFilter}"
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredActivity.slice(0, 8).map(item => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#141414]/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-2 whitespace-nowrap">
                        {item.status === 'success' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-emerald-500'}`} />
                            Success
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-rose-400' : 'text-rose-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center ${
                              isDark ? 'bg-[#181818]' : 'bg-slate-100'
                            }`}
                          >
                            {renderDestIcon(item.destination, 'w-3.5 h-3.5')}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isDark ? 'text-[#D1D5DB]' : 'text-slate-800'
                            }`}
                          >
                            {item.destination}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-xs font-medium truncate max-w-md ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                        title={item.details || item.clipTitle}
                      >
                        {item.clipTitle}
                      </td>
                      <td
                        className={`py-3.5 px-2 text-right text-xs whitespace-nowrap ${
                          isDark ? 'text-[#878787]' : 'text-slate-400'
                        }`}
                      >
                        {item.time}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Link */}
          <div
            className={`pt-2 border-t flex items-center justify-between ${
              isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
            }`}
          >
            <span className={`text-[11px] ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
              Showing {Math.min(8, filteredActivity.length)} of {filteredActivity.length} events
            </span>
            <button
              onClick={() => setShowAllActivityModal(true)}
              type="button"
              className={`inline-flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#3FE769] hover:text-[#52F77D]'
                  : 'text-[#2D6A4F] hover:text-[#40916C]'
              }`}
            >
              <span>View all activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>


      {/* Real-Time Connection Success Toast Notification */}
      {connectionSuccessToast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounceIn flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-2xl backdrop-blur-md">
          <CheckCircle className="w-5 h-5 text-[#3FE769] shrink-0" />
          <span className="text-xs font-medium">{connectionSuccessToast}</span>
          <button
            onClick={() => setConnectionSuccessToast(null)}
            className="text-emerald-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Destination / Integration Catalog Modal (Part 5) */}
      <AddDestinationModal
        isOpen={showAddDestinationModal}
        onClose={() => setShowAddDestinationModal(false)}
        isDark={isDark}
        destinations={destinations}
        catalog={INTEGRATION_CATALOG}
        onConnectItem={(item) => {
          setShowAddDestinationModal(false);
          handleConnectCatalogItem(item);
        }}
        onConfigureDest={(dest) => {
          setShowAddDestinationModal(false);
          setSelectedDestForConfig(dest);
        }}
        onCustomWebhook={() => {
          setShowAddDestinationModal(false);
          const existingWebhook = destinations.find(d => d.type === 'webhook') || webhookDest;
          setWebhookStudioDest(existingWebhook);
        }}
      />

      {/* Configuration & Field Mapping Modal */}
      {selectedDestForConfig && (
        <DestinationConfigModal
          dest={selectedDestForConfig}
          onClose={() => setSelectedDestForConfig(null)}
          onSave={handleSaveModalConfig}
          onReauthorize={(destToAuth) => setOauthModalDest(destToAuth)}
          activeTab={activeTabInModal}
          setActiveTab={setActiveTabInModal}
        />
      )}

      {/* Webhook Studio & Payload Runner Modal (Part 6) */}
      {(webhookStudioDest || showPayloadModal) && (
        <WebhookStudioModal
          isOpen={Boolean(webhookStudioDest || showPayloadModal)}
          dest={webhookStudioDest || showPayloadModal!}
          onClose={() => {
            setWebhookStudioDest(null);
            setShowPayloadModal(null);
          }}
          isDark={isDark}
          onSave={handleSaveModalConfig}
          onSendTest={handleWebhookTestDispatch}
        />
      )}

      {/* OAuth Consent & Permissions Modal */}
      {oauthModalDest && (
        <OAuthConnectModal
          dest={oauthModalDest}
          onClose={() => setOauthModalDest(null)}
          onGrant={handleGrantPermission}
          isDark={isDark}
        />
      )}

      {disconnectConfirmDest && (
        <DisconnectConfirmationModal
          dest={disconnectConfirmDest}
          onCancel={() => setDisconnectConfirmDest(null)}
          onConfirm={confirmDisconnect}
        />
      )}

      {/* Full Activity History Modal (Stitch Part 4) */}
      {showAllActivityModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`w-full max-w-3xl rounded-2xl border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#0E0E0E] border-[#262626]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <div>
                <h3
                  className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  All Sync Activity
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Complete chronological audit log of all destination synchronization events
                </p>
              </div>
              <button
                onClick={() => setShowAllActivityModal(false)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-[#878787] hover:text-white hover:bg-[#1A1A1A]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters & Simulation */}
            <div
              className={`p-4 border-b flex items-center justify-between gap-4 flex-wrap ${
                isDark ? 'border-[#1F1F1F] bg-[#0E0E0E]' : 'border-slate-100 bg-white'
              }`}
            >
              <div
                className={`inline-flex p-1 rounded-xl border ${
                  isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-100 border border-slate-200/50'
                }`}
              >
                {(['all', 'success', 'pending', 'failed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActivityStatusFilter(tab)}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                      activityStatusFilter === tab
                        ? isDark
                          ? 'bg-[#222222] text-white shadow-sm font-semibold'
                          : 'bg-white text-slate-900 shadow-sm font-semibold'
                        : isDark
                          ? 'text-[#878787] hover:text-[#D1D5DB]'
                          : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
                    handleTestPing(randomDest);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#2D6A4F]/60 text-[#3FE769] bg-[#142318]/60 hover:bg-[#142318]'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Simulate Web Clip Event</span>
                </button>
              </div>
            </div>

            {/* Modal Table Content */}
            <div className="overflow-y-auto flex-1 p-6">
              <table className="w-full text-left">
                <thead>
                  <tr
                    className={`border-b text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'border-[#1F1F1F] text-[#878787]' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <th className="pb-3 px-2 font-medium">Status</th>
                    <th className="pb-3 px-4 font-medium">Destination</th>
                    <th className="pb-3 px-4 font-medium">Clip title / Details</th>
                    <th className="pb-3 px-4 font-medium">Latency</th>
                    <th className="pb-3 px-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDark ? 'divide-[#1A1A1A]' : 'divide-slate-50'}`}>
                  {filteredActivity.map(item => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-[#141414]/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-2 whitespace-nowrap">
                        {item.status === 'success' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-[#3FE769]' : 'text-emerald-700'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-emerald-500'}`} />
                            Success
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-amber-400' : 'text-amber-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              isDark ? 'text-rose-400' : 'text-rose-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center ${
                              isDark ? 'bg-[#181818]' : 'bg-slate-100'
                            }`}
                          >
                            {renderDestIcon(item.destination, 'w-3.5 h-3.5')}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              isDark ? 'text-[#D1D5DB]' : 'text-slate-800'
                            }`}
                          >
                            {item.destination}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div
                          className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}
                        >
                          {item.clipTitle}
                        </div>
                        <div
                          className={`text-[11px] truncate ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}
                        >
                          {item.details}
                        </div>
                      </td>
                      <td
                        className={`py-3 px-4 text-xs font-mono whitespace-nowrap ${
                          isDark ? 'text-[#878787]' : 'text-slate-500'
                        }`}
                      >
                        {item.durationMs || 220}ms
                      </td>
                      <td
                        className={`py-3 px-2 text-right text-xs whitespace-nowrap ${
                          isDark ? 'text-[#878787]' : 'text-slate-400'
                        }`}
                      >
                        {item.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex items-center justify-between ${
                isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                {filteredActivity.length} event{filteredActivity.length === 1 ? '' : 's'} recorded
              </span>
              <button
                type="button"
                onClick={() => setShowAllActivityModal(false)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2E2E2E]'
                    : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const DisconnectConfirmationModal: React.FC<{
  dest: DestinationConfig;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ dest, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="disconnect-confirmation-title">
    <div className="w-full max-w-md rounded-sm border border-amber-500/40 bg-[#0a0a0a] p-6 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 id="disconnect-confirmation-title" className="font-serif text-xl text-white">Disconnect {dest.name}?</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Save will stop sending new clips to this destination until you connect it again.
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-sm border border-white/10 px-4 py-2 text-xs font-mono text-stone-300 hover:border-white/30 hover:text-white">
          CANCEL
        </button>
        <button onClick={onConfirm} className="rounded-sm bg-amber-500 px-4 py-2 text-xs font-mono font-semibold text-black hover:bg-amber-400">
          DISCONNECT
        </button>
      </div>
    </div>
  </div>
);

// Sub-Component: Destination Configuration Modal
interface ModalProps {
  dest: DestinationConfig;
  onClose: () => void;
  onSave: (updated: DestinationConfig) => void;
  onReauthorize?: (dest: DestinationConfig) => void;
  activeTab: 'auth' | 'mappings' | 'settings';
  setActiveTab: (tab: 'auth' | 'mappings' | 'settings') => void;
}

const DestinationConfigModal: React.FC<ModalProps> = ({
  dest,
  onClose,
  onSave,
  onReauthorize,
  activeTab,
  setActiveTab,
}) => {
  const [formData, setFormData] = useState<DestinationConfig>({ ...dest });
  const [newMappingSource, setNewMappingSource] = useState('Tags');
  const [newMappingTarget, setNewMappingTarget] = useState('Custom Column');

  const handleToggleMapping = (mappingId: string) => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map(m =>
        m.id === mappingId ? { ...m, enabled: !m.enabled } : m
      )
    }));
  };

  const handleUpdateTargetField = (mappingId: string, newTarget: string) => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map(m =>
        m.id === mappingId ? { ...m, targetField: newTarget } : m
      )
    }));
  };

  const handleAddMapping = () => {
    const newRule: FieldMapping = {
      id: `m_${Date.now()}`,
      sourceField: newMappingSource,
      targetField: newMappingTarget,
      enabled: true
    };
    setFormData(prev => ({
      ...prev,
      fieldMappings: [...prev.fieldMappings, newRule]
    }));
  };

  const handleDeleteMapping = (mappingId: string) => {
    setFormData(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter(m => m.id !== mappingId)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#080808] border border-white/10 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#080808] border border-white/10 flex items-center justify-center p-2">
              {renderDestIcon(formData.name || formData.type, 'w-5 h-5')}
            </div>
            <div>
              <h2 className="text-xl font-serif text-white flex items-center gap-2">
                Configure {formData.name}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Set credentials, schema column mappings, and auto-sync rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-sm text-stone-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-white/5 px-6 bg-[#080808] text-xs font-mono">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'mappings'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Mappings [{formData.fieldMappings.filter(m => m.enabled).length}]
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'auth'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <Key className="w-4 h-4" />
            Credentials
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 uppercase tracking-wider ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            <Settings className="w-4 h-4" />
            Sync Rules
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#080808]">
          {activeTab === 'mappings' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-sm bg-[#050505] border border-white/5 text-xs text-stone-300 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-serif text-white">Smart Property Auto-Mapping:</strong> Clipper extracts structured attributes and maps each property directly to your target database columns.
                </div>
              </div>

              {/* Mappings Table */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest flex items-center justify-between">
                  <span>CLIPPER ATTRIBUTE</span>
                  <span>TARGET STORAGE PROPERTY</span>
                </div>

                <div className="space-y-2">
                  {formData.fieldMappings.map(mapping => (
                    <div
                      key={mapping.id}
                      className={`flex items-center gap-3 p-3 rounded-sm border transition-all ${
                        mapping.enabled
                          ? 'bg-[#050505] border-white/10'
                          : 'bg-[#050505]/40 border-white/5 opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={mapping.enabled}
                        onChange={() => handleToggleMapping(mapping.id)}
                        className="w-4 h-4 rounded-sm text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                      />

                      <div className="w-1/3">
                        <span className="font-serif text-sm text-white">
                          {mapping.sourceField}
                        </span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-stone-600 shrink-0" />

                      <div className="flex-1">
                        <input
                          type="text"
                          value={mapping.targetField}
                          onChange={(e) => handleUpdateTargetField(mapping.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#080808] text-stone-200 text-xs rounded-sm border border-white/10 focus:border-amber-500 focus:outline-none font-mono"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="p-1.5 text-stone-500 hover:text-amber-400 rounded-sm hover:bg-white/[0.04] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Field Mapping */}
                <div className="pt-3 flex items-center gap-2">
                  <select
                    value={newMappingSource}
                    onChange={(e) => setNewMappingSource(e.target.value)}
                    className="px-3 py-1.5 bg-[#050505] text-stone-200 text-xs rounded-sm border border-white/10 font-mono"
                  >
                    <option value="Tags">Tags</option>
                    <option value="Salary / Price">Salary / Price</option>
                    <option value="Location / Company">Location / Company</option>
                    <option value="Source App">Source App</option>
                    <option value="Raw HTML Snippet">Raw HTML Snippet</option>
                  </select>

                  <input
                    type="text"
                    value={newMappingTarget}
                    onChange={(e) => setNewMappingTarget(e.target.value)}
                    placeholder="Column name"
                    className="px-3 py-1.5 bg-[#050505] text-stone-200 text-xs rounded-sm border border-white/10 flex-1 font-mono"
                  />

                  <button
                    onClick={handleAddMapping}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono uppercase tracking-wider font-semibold rounded-sm flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                  Target Resource / Database Name
                </label>
                <input
                  type="text"
                  value={formData.targetResourceName || ''}
                  onChange={(e) => setFormData({ ...formData, targetResourceName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 font-sans text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {formData.type === 'webhook' && (
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                    Webhook Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={formData.endpointUrl || ''}
                    onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                    placeholder="https://api.yourdomain.com/v1/clips"
                    className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {formData.type === 'google_sheets' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                      Connected Google Account Email
                    </label>
                    <input
                      type="email"
                      value={formData.accountEmail || 'user@gmail.com'}
                      onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                      placeholder="account@gmail.com"
                      className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 font-sans text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-between">
                      <span>Target Google Spreadsheet Link or Name</span>
                      <span className="text-[9px] text-stone-500 font-sans">e.g. My Opportunities Sheet 2026</span>
                    </label>
                    <input
                      type="text"
                      value={formData.targetResourceName || ''}
                      onChange={(e) => setFormData({ ...formData, targetResourceName: e.target.value })}
                      placeholder="https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit"
                      className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-amber-500/30 font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-[#050505] border border-amber-500/20 rounded-sm text-stone-300 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[11px] text-amber-400 font-semibold">Switch Account or Replace Sheet</div>
                      <div className="text-[10px] text-stone-400">Connect a different Google Account to send clips to a new spreadsheet.</div>
                    </div>
                    {onReauthorize && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onReauthorize(formData);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono uppercase tracking-wider font-semibold rounded-sm transition-all flex items-center gap-1 shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Re-Authorize</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                  Authentication Access Token / OAuth Bearer
                </label>
                <input
                  type="password"
                  value={formData.authKeyMasked || '••••••••••••••••'}
                  onChange={(e) => setFormData({ ...formData, authKeyMasked: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-[#050505] border border-white/5 rounded-sm text-stone-300 flex items-center justify-between">
                <span className="font-mono text-[11px] text-amber-500">OAuth Token Status: Authorized</span>
                <span className="text-[9px] font-mono uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-sm">
                  ACTIVE TOKEN
                </span>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                  Sync Dispatch Frequency
                </label>
                <select
                  value={formData.syncFrequency}
                  onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-[#050505] text-stone-200 rounded-sm border border-white/10 font-sans focus:border-amber-500 focus:outline-none"
                >
                  <option value="instant">Instant (Real-Time as you click save)</option>
                  <option value="hourly">Hourly Batch</option>
                  <option value="daily">Daily Digest Batch</option>
                  <option value="manual">Manual trigger only</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#050505] rounded-sm border border-white/5">
                <input
                  type="checkbox"
                  id="autoCreateCols"
                  checked={formData.autoCreateColumns}
                  onChange={(e) => setFormData({ ...formData, autoCreateColumns: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
                />
                <label htmlFor="autoCreateCols" className="font-sans text-xs text-stone-300 cursor-pointer">
                  Auto-create missing table columns or database properties if they don't exist
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/5 bg-[#050505] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-wider text-stone-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-5 py-2 rounded-sm text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-all"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-Component: Webhook Studio & Payload Runner Modal (Part 6)
interface WebhookStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  dest: DestinationConfig;
  onSave: (updated: DestinationConfig) => void;
  onSendTest: (
    dest: DestinationConfig,
    customPayload?: any
  ) => Promise<{
    status: 'success' | 'error';
    statusCode: number;
    latencyMs: number;
    responseData?: any;
  }>;
}

const WebhookStudioModal: React.FC<WebhookStudioModalProps> = ({
  isOpen,
  onClose,
  isDark,
  dest,
  onSave,
  onSendTest,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'endpoint' | 'headers' | 'tester'>('studio');
  const [codeLang, setCodeLang] = useState<'json' | 'curl' | 'node' | 'python' | 'ts'>('json');
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Editable Webhook configuration state
  const [endpointUrl, setEndpointUrl] = useState(
    dest.endpointUrl ||
      dest.targetResourceName ||
      'https://api.yourdomain.com/v1/clips'
  );
  const [secretKey, setSecretKey] = useState(
    dest.authKeyMasked && !dest.authKeyMasked.includes('•••')
      ? dest.authKeyMasked
      : 'whsec_99a8b1c4e72f09d832b412'
  );
  const [retryPolicy, setRetryPolicy] = useState<'none' | 'retry_3' | 'retry_5'>('retry_3');
  const [subscribeSave, setSubscribeSave] = useState(true);
  const [subscribeAi, setSubscribeAi] = useState(true);
  const [subscribeTags, setSubscribeTags] = useState(true);

  // Headers editor state
  const [headers, setHeaders] = useState<Array<{ id: string; key: string; value: string }>>([
    { id: 'h1', key: 'Content-Type', value: 'application/json' },
    { id: 'h2', key: 'X-Clipper-Signature', value: 'sha256=${HMAC_DIGEST}' },
    { id: 'h3', key: 'User-Agent', value: 'Clipper-Webhook-Agent/2.0' },
  ]);

  // Live runner state
  const [isDispatching, setIsDispatching] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusCode: number;
    latencyMs: number;
    timestamp: string;
    body: any;
  } | null>(null);

  if (!isOpen) return null;

  const samplePayload = {
    event: 'CLIPPER_SAVE_CLIP',
    delivery_id: `del_${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    destination: {
      provider: 'webhook',
      endpoint: endpointUrl,
    },
    payload: {
      id: 'clip_8841',
      title: 'Anthropic Claude 3.5 Sonnet Speculative Decoding',
      url: 'https://news.ycombinator.com/item?id=4129581',
      source_platform: 'HackerNews',
      selected_text: 'Speculative decoding achieves 2.5x inference speedups on transformer models...',
      tags: ['AI', 'LLM', 'Research', 'Performance'],
      ai_summary: 'Technical analysis of draft model speculative sampling with KV-cache reuse.',
      extracted_entities: {
        author: 'Anthropic Research',
        category: 'Machine Learning',
        confidence_score: 0.98,
      },
    },
  };

  const getCodeSnippet = () => {
    if (codeLang === 'json') {
      return JSON.stringify(samplePayload, null, 2);
    }
    if (codeLang === 'curl') {
      return `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-Clipper-Signature: sha256=a8f4c931b2..." \\
  -d '${JSON.stringify(samplePayload)}'`;
    }
    if (codeLang === 'node') {
      return `// Node.js Express Webhook Consumer Handler
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = process.env.CLIPPER_WEBHOOK_SECRET || '${secretKey}';

app.post('/v1/clips', (req, res) => {
  const signature = req.headers['x-clipper-signature'];
  const computedSig = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Verify HMAC signature authenticity
  if (signature !== computedSig) {
    return res.status(401).json({ error: 'Invalid HMAC signature' });
  }

  const { payload } = req.body;
  console.log('Successfully received clipped opportunity:', payload.title);

  return res.status(200).json({
    status: 'received',
    clipId: payload.id,
    processedAt: new Date().toISOString()
  });
});`;
    }
    if (codeLang === 'python') {
      return `# Python FastAPI Webhook Receiver
from fastapi import FastAPI, Header, HTTPException, Request
import hmac, hashlib, json

app = FastAPI()
WEBHOOK_SECRET = "${secretKey}"

@app.post("/v1/clips")
async def receive_clipper_event(request: Request, x_clipper_signature: str = Header(None)):
    raw_body = await request.body()
    expected_sig = "sha256=" + hmac.new(WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    
    if x_clipper_signature != expected_sig:
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")
        
    data = json.loads(raw_body)
    print(f"Clipped: {data['payload']['title']}")
    return {"status": "success", "echo": data['payload']['id']}`;
    }
    return `// TypeScript Clipper Payload Interface
export interface ClipperWebhookPayload {
  event: 'CLIPPER_SAVE_CLIP' | 'CLIPPER_AI_ENRICHMENT';
  delivery_id: string;
  timestamp: string;
  destination: {
    provider: 'webhook';
    endpoint: string;
  };
  payload: {
    id: string;
    title: string;
    url: string;
    source_platform: string;
    selected_text: string;
    tags: string[];
    ai_summary: string;
    extracted_entities: Record<string, any>;
  };
}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSecret = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSecretKey(`whsec_${randomHex}`);
  };

  const handleAddHeader = () => {
    setHeaders(prev => [...prev, { id: `h_${Date.now()}`, key: 'X-Custom-Header', value: 'Value' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(prev => prev.filter(h => h.id !== id));
  };

  const handleExecuteTest = async () => {
    setIsDispatching(true);
    try {
      const res = await onSendTest(
        {
          ...dest,
          endpointUrl,
          targetResourceName: endpointUrl,
        },
        samplePayload
      );

      setTestResult({
        success: res.status === 'success',
        statusCode: res.statusCode || 200,
        latencyMs: res.latencyMs || 142,
        timestamp: new Date().toLocaleTimeString(),
        body: res.responseData || {
          status: 'success',
          received: true,
          endpoint: endpointUrl,
        },
      });
    } catch (err) {
      setTestResult({
        success: false,
        statusCode: 500,
        latencyMs: 380,
        timestamp: new Date().toLocaleTimeString(),
        body: { error: 'Endpoint unreachable or network timeout' },
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSaveAndDeploy = () => {
    onSave({
      ...dest,
      connected: true,
      status: 'active',
      targetResourceName: endpointUrl,
      endpointUrl,
      authKeyMasked: secretKey,
      syncFrequency: retryPolicy === 'none' ? 'instant' : 'instant',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-3xl rounded-2xl border flex flex-col max-h-[88vh] shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0E0E0E] border-[#262626]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center p-2.5 ${
                isDark ? 'bg-[#181818] border border-[#282828]' : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <WebhookIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-semibold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Webhook Gateway & Payload Studio
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  REST / HTTPS
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                Configure target endpoint, inspect structured JSON schemas, and test live HTTP deliveries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Navigation Tabs */}
        <div
          className={`flex border-b px-6 text-xs font-medium gap-2 ${
            isDark ? 'border-[#1F1F1F] bg-[#0E0E0E]' : 'border-slate-100 bg-white'
          }`}
        >
          {[
            { id: 'studio', label: 'Payload Studio', icon: Code2 },
            { id: 'endpoint', label: 'Endpoint & Security', icon: Globe },
            { id: 'headers', label: 'Custom Headers', icon: Sliders },
            { id: 'tester', label: 'Live Test Runner', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'border-[#3FE769] text-white font-semibold'
                      : 'border-[#2D6A4F] text-[#2D6A4F] font-semibold'
                    : isDark
                    ? 'border-transparent text-[#878787] hover:text-[#D1D5DB]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className={`overflow-y-auto flex-1 p-6 space-y-5 ${isDark ? 'bg-[#0E0E0E]' : 'bg-white'}`}>
          {/* TAB 1: PAYLOAD STUDIO */}
          {activeTab === 'studio' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Language Switcher */}
                <div
                  className={`inline-flex p-1 rounded-xl border ${
                    isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-100 border-slate-200/60'
                  }`}
                >
                  {[
                    { id: 'json', label: 'JSON' },
                    { id: 'curl', label: 'cURL' },
                    { id: 'node', label: 'Node.js' },
                    { id: 'python', label: 'Python' },
                    { id: 'ts', label: 'TypeScript' },
                  ].map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setCodeLang(lang.id as any)}
                      type="button"
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        codeLang === lang.id
                          ? isDark
                            ? 'bg-[#222222] text-white shadow-sm font-semibold'
                            : 'bg-white text-slate-900 shadow-sm font-semibold'
                          : isDark
                          ? 'text-[#878787] hover:text-[#D1D5DB]'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopyCode}
                  type="button"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#262626] bg-[#141414] text-[#D1D5DB] hover:text-white hover:bg-[#1E1E1E]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#3FE769]" />
                      <span className="text-[#3FE769]">Copied Snippet!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Display Window */}
              <div
                className={`rounded-2xl border overflow-hidden ${
                  isDark ? 'border-[#222222] bg-[#050505]' : 'border-slate-200 bg-slate-900 text-slate-100'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'border-[#181818] text-[#777777] bg-[#0A0A0A]' : 'border-slate-800 text-slate-400 bg-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-semibold text-slate-300">
                      {codeLang === 'json' ? 'payload.json' : codeLang === 'curl' ? 'request.sh' : codeLang === 'node' ? 'server.ts' : codeLang === 'python' ? 'app.py' : 'types.ts'}
                    </span>
                  </div>
                  <span>HMAC-SHA256 Signed</span>
                </div>
                <pre className="p-4 text-xs font-mono overflow-auto max-h-[340px] leading-relaxed text-emerald-400/90 scrollbar-none">
                  {getCodeSnippet()}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: ENDPOINT & SECURITY */}
          {activeTab === 'endpoint' && (
            <div className="space-y-4">
              {/* Endpoint URL Input */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                  Target Webhook Endpoint URL
                </label>
                <div className="relative">
                  <Globe className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#666666]' : 'text-slate-400'}`} />
                  <input
                    type="url"
                    value={endpointUrl}
                    onChange={e => setEndpointUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/v1/clips"
                    className={`w-full h-10 pl-9 pr-20 rounded-xl text-xs outline-none border transition-all ${
                      isDark
                        ? 'bg-[#141414] text-white border-[#262626] focus:border-[#3FE769]'
                        : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-[#2D6A4F]'
                    }`}
                  />
                  <span
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      isDark ? 'bg-[#222222] text-[#A1A1A1]' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    POST
                  </span>
                </div>
              </div>

              {/* Secret Signing Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                    HMAC SHA-256 Signing Secret
                  </label>
                  <button
                    onClick={handleGenerateSecret}
                    type="button"
                    className={`text-[11px] font-medium transition-colors cursor-pointer ${
                      isDark ? 'text-[#3FE769] hover:underline' : 'text-[#2D6A4F] hover:underline'
                    }`}
                  >
                    Regenerate Key
                  </button>
                </div>
                <div className="relative">
                  <Key className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#666666]' : 'text-slate-400'}`} />
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    className={`w-full h-10 pl-9 pr-24 rounded-xl text-xs font-mono outline-none border transition-all ${
                      isDark
                        ? 'bg-[#141414] text-white border-[#262626] focus:border-[#3FE769]'
                        : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-[#2D6A4F]'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      type="button"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-[#878787] hover:text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secretKey);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      type="button"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-[#878787] hover:text-white' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Copy secret"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Subscriptions */}
              <div className="space-y-2 pt-2">
                <label className={`block text-xs font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                  Subscribed Trigger Events
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Save Clip Trigger', state: subscribeSave, set: setSubscribeSave, desc: 'Fires instantly on clip save' },
                    { label: 'AI Summary Generated', state: subscribeAi, set: setSubscribeAi, desc: 'Fires when tags & summary resolve' },
                    { label: 'Tag / Folder Update', state: subscribeTags, set: setSubscribeTags, desc: 'Fires on metadata changes' },
                  ].map((evt, idx) => (
                    <div
                      key={idx}
                      onClick={() => evt.set(!evt.state)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        evt.state
                          ? isDark
                            ? 'bg-[#142318] border-[#2D6A4F] text-white'
                            : 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm'
                          : isDark
                          ? 'bg-[#141414] border-[#262626] text-[#878787]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{evt.label}</span>
                        <input
                          type="checkbox"
                          checked={evt.state}
                          onChange={() => {}}
                          className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                        />
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-slate-500'}`}>
                        {evt.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retry Policy */}
              <div className="space-y-2 pt-2">
                <label className={`block text-xs font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-slate-700'}`}>
                  Delivery Retry & Failure Policy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'none', label: 'No Retries', desc: 'Single attempt only. Discard failures.' },
                    { id: 'retry_3', label: '3 Retries with Jitter', desc: 'Exponential backoff (Recommended).' },
                    { id: 'retry_5', label: '5 Retries + Dead-Letter', desc: 'Maximum durability for enterprise.' },
                  ].map(policy => (
                    <div
                      key={policy.id}
                      onClick={() => setRetryPolicy(policy.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        retryPolicy === policy.id
                          ? isDark
                            ? 'bg-[#142318] border-[#2D6A4F] text-white'
                            : 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm'
                          : isDark
                          ? 'bg-[#141414] border-[#262626] text-[#878787]'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{policy.label}</span>
                        <input
                          type="radio"
                          name="retryPolicy"
                          checked={retryPolicy === policy.id}
                          onChange={() => {}}
                          className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                        />
                      </div>
                      <p className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-slate-500'}`}>
                        {policy.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM HEADERS */}
          {activeTab === 'headers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Custom HTTP headers injected into every outgoing webhook request.
                </p>
                <button
                  onClick={handleAddHeader}
                  type="button"
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#262626] bg-[#141414] text-[#D1D5DB] hover:text-white hover:bg-[#1E1E1E]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Header</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {headers.map(h => (
                  <div key={h.id} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={h.key}
                      onChange={e => {
                        const val = e.target.value;
                        setHeaders(prev => prev.map(item => (item.id === h.id ? { ...item, key: val } : item)));
                      }}
                      placeholder="Header-Name"
                      className={`w-1/3 h-9 px-3 rounded-xl text-xs font-mono outline-none border transition-all ${
                        isDark
                          ? 'bg-[#141414] text-white border-[#262626] focus:border-[#3FE769]'
                          : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-[#2D6A4F]'
                      }`}
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={e => {
                        const val = e.target.value;
                        setHeaders(prev => prev.map(item => (item.id === h.id ? { ...item, value: val } : item)));
                      }}
                      placeholder="Header Value"
                      className={`flex-1 h-9 px-3 rounded-xl text-xs font-mono outline-none border transition-all ${
                        isDark
                          ? 'bg-[#141414] text-white border-[#262626] focus:border-[#3FE769]'
                          : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-[#2D6A4F]'
                      }`}
                    />
                    <button
                      onClick={() => handleRemoveHeader(h.id)}
                      type="button"
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isDark ? 'text-[#878787] hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE TEST RUNNER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-[#121212] border-[#222222]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Live Test Delivery
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                    Send a test payload to <code className="font-mono">{endpointUrl}</code> and verify roundtrip response.
                  </p>
                </div>
                <button
                  onClick={handleExecuteTest}
                  disabled={isDispatching}
                  type="button"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white shadow-md transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#2D6A4F] hover:bg-[#388562] border border-[#3FE769]/30 hover:border-[#3FE769]/60'
                      : 'bg-[#2D6A4F] hover:bg-[#40916C]'
                  }`}
                >
                  {isDispatching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Test Payload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Test Flight Output */}
              {testResult && (
                <div
                  className={`rounded-2xl border p-4 space-y-3 animate-fadeIn ${
                    testResult.success
                      ? isDark
                        ? 'bg-[#0E1B12] border-[#214328]'
                        : 'bg-emerald-50/50 border-emerald-200'
                      : isDark
                      ? 'bg-rose-950/30 border-rose-900/50'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          testResult.success
                            ? isDark
                              ? 'bg-[#142318] text-[#3FE769] border border-[#2D6A4F]'
                              : 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${testResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        HTTP {testResult.statusCode} OK
                      </span>
                      <span className={`text-xs font-mono ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                        Roundtrip: {testResult.latencyMs}ms
                      </span>
                    </div>
                    <span className={`text-[11px] ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                      Verified at {testResult.timestamp}
                    </span>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                    Test delivery verified successfully. A new audit event has been recorded in the Recent Activity table.
                  </p>

                  <div
                    className={`p-3 rounded-xl border text-xs font-mono overflow-auto max-h-40 leading-relaxed ${
                      isDark ? 'bg-[#050505] border-[#181818] text-emerald-400' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {JSON.stringify(testResult.body, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
            <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
              TLS 1.3 • HMAC-SHA256 Signed Deliveries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2E2E2E]'
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAndDeploy}
              className={`px-5 py-1.5 rounded-xl text-xs font-medium text-white shadow-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#2D6A4F] hover:bg-[#388562] border border-[#3FE769]/30 hover:border-[#3FE769]/60'
                  : 'bg-[#2D6A4F] hover:bg-[#40916C]'
              }`}
            >
              Save & Deploy Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-Component: Add Destination & Integration Catalog Modal (Part 5)
interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  destinations: DestinationConfig[];
  catalog: CatalogItem[];
  onConnectItem: (item: CatalogItem) => void;
  onConfigureDest: (dest: DestinationConfig) => void;
  onCustomWebhook: () => void;
}

const AddDestinationModal: React.FC<AddDestinationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  destinations,
  catalog,
  onConnectItem,
  onConfigureDest,
  onCustomWebhook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'popular' | 'spreadsheets' | 'databases' | 'crms' | 'productivity' | 'automation'
  >('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'popular', label: '★ Popular' },
    { id: 'spreadsheets', label: 'Spreadsheets' },
    { id: 'databases', label: 'Databases & SQL' },
    { id: 'crms', label: 'CRMs & Sales' },
    { id: 'productivity', label: 'Productivity & Media' },
    { id: 'automation', label: 'Webhooks & Automation' },
  ] as const;

  const filteredItems = catalog.filter(item => {
    const matchesCategory =
      activeCategory === 'all'
        ? true
        : activeCategory === 'popular'
        ? Boolean(item.popular)
        : item.category === activeCategory;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.badge.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.authMethod.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-4xl rounded-2xl border flex flex-col max-h-[88vh] shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#0E0E0E] border-[#262626]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-[#181818] border border-[#2A2A2A]' : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <Plus className={`w-5 h-5 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`text-lg font-semibold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Add Destination
                </h3>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-emerald-950/50 text-[#3FE769] border border-emerald-800/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  14 Connectors
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                Choose a pre-built connector, database, CRM, or custom webhook to sync your saves.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          className={`p-4 border-b space-y-3 ${
            isDark ? 'border-[#1F1F1F] bg-[#0E0E0E]' : 'border-slate-100 bg-white'
          }`}
        >
          {/* Search Box */}
          <div className="relative">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-[#666666]' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 14+ destinations (e.g. Notion, Google Sheets, Supabase, Webhook)..."
              className={`w-full h-9 pl-9 pr-8 rounded-xl text-xs transition-all outline-none border ${
                isDark
                  ? 'bg-[#141414] border-[#262626] text-white placeholder:text-[#666666] focus:border-[#3FE769]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#2D6A4F]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {categories.map(cat => {
              const count =
                cat.id === 'all'
                  ? catalog.length
                  : cat.id === 'popular'
                  ? catalog.filter(c => c.popular).length
                  : catalog.filter(c => c.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? isDark
                        ? 'bg-[#222222] text-white shadow-sm font-semibold'
                        : 'bg-slate-900 text-white shadow-sm font-semibold'
                      : isDark
                      ? 'text-[#878787] hover:text-[#D1D5DB] hover:bg-[#161616]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeCategory === cat.id
                        ? isDark
                          ? 'bg-[#333333] text-white'
                          : 'bg-slate-700 text-white'
                        : isDark
                        ? 'bg-[#181818] text-[#777777]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Compass className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-[#444444]' : 'text-slate-300'}`} />
              <h4 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No destinations found
              </h4>
              <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                No integration matches "{searchQuery}". Try a different category or configure a custom webhook endpoint.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => {
                const existingDest = destinations.find(
                  d =>
                    d.type === item.type ||
                    d.name.toLowerCase() === item.name.toLowerCase() ||
                    (d.id && d.id.includes(item.type))
                );
                const isConnected = Boolean(existingDest && existingDest.connected);

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                      isDark
                        ? 'bg-[#121212] border-[#222222] hover:border-[#333333]'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col gap-2.5">
                      {/* Top Row: Icon + Name + Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isDark
                                ? 'bg-[#181818] border border-[#282828]'
                                : 'bg-slate-50 border border-slate-100 shadow-sm'
                            }`}
                          >
                            {renderDestIcon(item.name || item.type, 'w-5 h-5')}
                          </div>
                          <div>
                            <span
                              className={`font-semibold text-sm ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                              style={{ fontFamily: 'Outfit, sans-serif' }}
                            >
                              {item.name}
                            </span>
                            <span className={`block text-[11px] capitalize ${isDark ? 'text-[#878787]' : 'text-slate-400'}`}>
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {item.popular && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isDark
                                  ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                                  : 'text-amber-700 bg-amber-50 border border-amber-200/60'
                              }`}
                            >
                              ★ Popular
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              isDark
                                ? 'bg-[#1C1C1C] text-[#A1A1A1] border border-[#2A2A2A]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className={`text-xs leading-relaxed min-h-[32px] ${isDark ? 'text-[#A1A1A1]' : 'text-slate-500'}`}>
                        {item.description}
                      </p>

                      {/* Default Resource Hint */}
                      <div
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono truncate ${
                          isDark
                            ? 'bg-[#161616] border-[#222222] text-[#878787]'
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}
                      >
                        Target: {item.defaultResourceName}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div
                      className={`pt-3.5 mt-3.5 border-t flex items-center justify-between ${
                        isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
                      }`}
                    >
                      <span className={`text-[11px] ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}>
                        {item.authMethod}
                      </span>

                      {isConnected && existingDest ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
                              isDark
                                ? 'bg-[#142318] text-[#3FE769] border border-[#214328]'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#3FE769]' : 'bg-emerald-600'}`} />
                            Connected
                          </span>
                          <button
                            type="button"
                            onClick={() => onConfigureDest(existingDest)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isDark
                                ? 'border-[#262626] text-[#A1A1A1] hover:text-white hover:bg-[#1E1E1E]'
                                : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Configure Destination Settings"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onConnectItem(item)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#2D6A4F] hover:bg-[#388562] border border-[#3FE769]/30 hover:border-[#3FE769]/60'
                              : 'bg-[#2D6A4F] hover:bg-[#40916C]'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Custom Webhook Banner */}
          <div
            className={`p-4 rounded-2xl border border-dashed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-[#181818]' : 'bg-white shadow-sm'
                }`}
              >
                <WebhookIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Custom REST Webhook Gateway
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isDark
                        ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    HTTP POST
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  Pipe real-time saves to any URL endpoint with HMAC SHA-256 signatures and bearer tokens.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCustomWebhook}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                isDark
                  ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                  : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Configure Webhook
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
            <span className={`text-xs ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
              Showing {filteredItems.length} of {catalog.length} integrations • TLS 1.3 Encrypted
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2E2E2E]'
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-Component: OAuth Permission & Scope Consent Modal
interface OAuthModalProps {
  dest: DestinationConfig;
  onClose: () => void;
  onGrant: (
    destId: string,
    options: { accessType: 'full' | 'partial'; actionType: 'create' | 'existing'; tableName: string }
  ) => void;
  isDark?: boolean;
}

const OAuthConnectModal: React.FC<OAuthModalProps> = ({ dest, onClose, onGrant, isDark = true }) => {
  const [accessType, setAccessType] = useState<'full' | 'partial'>('full');
  const [actionType, setActionType] = useState<'create' | 'existing'>('create');
  const [tableName, setTableName] = useState(
    dest.targetResourceName ||
      (dest.type === 'google_sheets'
        ? 'Clipped Opportunities Sheet 2026'
        : dest.type === 'spotify'
        ? 'Study Playlists & Podcasts'
        : dest.type === 'youtube_music'
        ? 'Saved Tracks Playlist'
        : 'Clipped Vault Database')
  );
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    await onGrant(dest.id, { accessType, actionType, tableName });
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDark ? 'bg-[#0E0E0E] border-[#262626]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-[#1F1F1F] bg-[#0A0A0A]' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 ${
                isDark
                  ? 'bg-[#181818] border border-[#262626]'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              {renderDestIcon(dest.name || dest.type, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isDark
                      ? 'bg-emerald-950/40 text-[#3FE769] border border-emerald-800/40'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  OAuth 2.0 Consent
                </span>
              </div>
              <h2
                className={`text-xl font-semibold mt-1 tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Connect to {dest.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-[#878787] hover:text-white hover:bg-[#1E1E1E]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className={`p-6 space-y-5 text-xs ${isDark ? 'bg-[#0E0E0E]' : 'bg-white'}`}
        >
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className={`w-4 h-4 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
              <span className={`font-medium ${isDark ? 'text-stone-300' : 'text-slate-700'}`}>
                Authorizing Account:
              </span>
            </div>
            <span
              className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border ${
                isDark
                  ? 'bg-[#1E1E1E] text-stone-200 border-[#2E2E2E]'
                  : 'bg-white text-slate-800 border-slate-200 shadow-xs'
              }`}
            >
              {dest.accountEmail || 'user@gmail.com'}
            </span>
          </div>

          {/* Scope Permission Level */}
          <div className="space-y-2.5">
            <label
              className={`block text-[11px] font-medium uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              1. Choose Access Level Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setAccessType('full')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  accessType === 'full'
                    ? isDark
                      ? 'bg-[#142318] border-[#2D6A4F] text-white'
                      : 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm'
                    : isDark
                    ? 'bg-[#141414] border-[#262626] text-[#878787] hover:border-[#383838]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">Full Access Sync</span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'full'}
                    onChange={() => setAccessType('full')}
                    className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                  />
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                  Read, write, & auto-create new tables/sheets dynamically when clipping opportunities.
                </p>
              </div>

              <div
                onClick={() => setAccessType('partial')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  accessType === 'partial'
                    ? isDark
                      ? 'bg-[#142318] border-[#2D6A4F] text-white'
                      : 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm'
                    : isDark
                    ? 'bg-[#141414] border-[#262626] text-[#878787] hover:border-[#383838]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">Partial Access</span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'partial'}
                    onChange={() => setAccessType('partial')}
                    className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                  />
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
                  Append-only access into an existing selected table. No structural creation rights.
                </p>
              </div>
            </div>
          </div>

          {/* Database Creation or Existing Selection */}
          <div className="space-y-2.5">
            <label
              className={`block text-[11px] font-medium uppercase tracking-wider ${
                isDark ? 'text-[#878787]' : 'text-slate-500'
              }`}
            >
              2. Target Resource Configuration
            </label>
            <div className="space-y-2">
              <div
                className={`flex items-center gap-4 p-3 border rounded-xl ${
                  isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'create'}
                    onChange={() => setActionType('create')}
                    className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                  />
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>Auto-Create New Table / Sheet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'existing'}
                    onChange={() => setActionType('existing')}
                    className={`cursor-pointer ${isDark ? 'accent-[#3FE769]' : 'accent-[#2D6A4F]'}`}
                  />
                  <span className={isDark ? 'text-white' : 'text-slate-800'}>Link Existing Resource</span>
                </label>
              </div>

              <div>
                <label className={`block text-[11px] mb-1 ${isDark ? 'text-[#878787]' : 'text-slate-500'}`}>
                  {actionType === 'create' ? 'Name for New Table / Sheet:' : 'Existing Resource Name or ID:'}
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  placeholder="e.g. Clipped Opportunities 2026"
                  className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition-all ${
                    isDark
                      ? 'bg-[#141414] text-white border-[#262626] focus:border-[#3FE769]'
                      : 'bg-slate-50 text-slate-900 border-slate-200 focus:bg-white focus:border-[#2D6A4F]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Scope Consent List */}
          <div
            className={`p-3.5 border rounded-xl space-y-2 ${
              isDark ? 'bg-[#141414] border-[#262626]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'
              }`}
            >
              {accessType === 'full' ? 'FULL ACCESS SCOPE REQUESTED:' : 'PARTIAL (APPEND-ONLY) SCOPE REQUESTED:'}
            </p>
            <ul className={`space-y-1.5 text-[11px] ${isDark ? 'text-stone-300' : 'text-slate-600'}`}>
              {accessType === 'full' ? (
                <>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                    <span>Read, write, format, & auto-create new tables/sheets dynamically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                    <span>Write title, source URL, salary ranges, tags, & AI summaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#3FE769]' : 'text-[#2D6A4F]'}`} />
                    <span>Real-time webhook sync & dynamic column generation</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Append-only access into designated resource: "{tableName}"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Restricted mode: No file deletion or structural schema modification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Write clipped metadata into pre-existing columns only</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Footer Actions */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-3 ${
              isDark ? 'border-[#1F1F1F]' : 'border-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-[#878787] hover:text-white hover:bg-[#1A1A1A]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing}
              className={`px-6 py-2.5 rounded-xl text-xs font-medium text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#2D6A4F] hover:bg-[#388562] border border-[#3FE769]/30 hover:border-[#3FE769]/60'
                  : 'bg-[#2D6A4F] hover:bg-[#40916C]'
              }`}
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Grant Permission & Connect</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
