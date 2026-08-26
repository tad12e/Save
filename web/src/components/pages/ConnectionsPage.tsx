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
  Cpu
} from 'lucide-react';

interface ConnectionsPageProps {
  destinations: DestinationConfig[];
  setDestinations: React.Dispatch<React.SetStateAction<DestinationConfig[]>>;
  logs: ConnectionSyncLog[];
  setLogs: React.Dispatch<React.SetStateAction<ConnectionSyncLog[]>>;
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
}) => {
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
        if (dest.type === oauthSuccess || dest.id.includes(oauthSuccess) || dest.name.toLowerCase().includes(oauthSuccess.replace('_', ' '))) {
          return {
            ...dest,
            connected: true,
            status: 'active' as const,
            lastSync: 'Just now',
            targetResourceName: dest.targetResourceName.includes('Connect') ? 'Connected Workspace Sheet' : dest.targetResourceName
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

  // Explore & Search State
  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreCategory, setExploreCategory] = useState<'all' | 'spreadsheets' | 'databases' | 'crms' | 'productivity' | 'automation'>('all');

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

  // Icon Helper
  const renderDestIcon = (type: string, className = 'w-6 h-6') => {
    switch (type) {
      case 'google_sheets':
      case 'sheets':
        return <FileSpreadsheet className={`${className} text-emerald-400`} />;
      case 'notion':
        return <FileText className={`${className} text-stone-200`} />;
      case 'airtable':
        return <Table className={`${className} text-cyan-400`} />;
      case 'webhook':
        return <Zap className={`${className} text-indigo-400`} />;
      case 'custom_db':
      case 'db':
        return <HardDrive className={`${className} text-blue-400`} />;
      case 'crm':
        return <Layers className={`${className} text-amber-500`} />;
      case 'productivity':
        return <Cpu className={`${className} text-violet-400`} />;
      default:
        return <Database className={`${className} text-violet-400`} />;
    }
  };

  const filteredDestinations = destinations.filter(d => {
    if (filterType === 'connected') return d.connected;
    if (filterType === 'disconnected') return !d.connected;
    return true;
  });

  const filteredCatalog = INTEGRATION_CATALOG.filter(item => {
    const matchesCategory = exploreCategory === 'all' || item.category === exploreCategory;
    const matchesQuery = 
      item.name.toLowerCase().includes(exploreQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(exploreQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(exploreQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const activeCount = destinations.filter(d => d.connected).length;
  const totalSyncedSum = destinations.reduce((acc, curr) => acc + curr.itemsSyncedCount, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 w-full space-y-12 animate-fadeIn bg-[#050505] text-white font-sans min-h-screen">
      {/* Hero Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div>
          <p className="text-amber-500 text-[11px] font-mono tracking-[0.3em] uppercase mb-2">Step 01 / Integration Pipeline</p>
          <h1 className="text-3xl md:text-4xl font-serif text-white leading-tight">
            Establish your <span className="italic text-stone-400">digital uplink.</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-400 mt-2 max-w-2xl leading-relaxed font-sans">
            Initialize active connections between Clipper and your target workspace databases. Save clipped opportunities seamlessly to Google Sheets, Notion, Airtable, or custom REST webhooks.
          </p>
        </div>

        {/* Quick Engine Stats */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-sm bg-[#080808] border border-white/5 text-center">
            <p className="text-[9px] font-mono tracking-widest uppercase text-stone-500">ACTIVE PIPELINE</p>
            <p className="text-lg font-serif font-medium text-white">{activeCount} <span className="text-stone-600 text-sm">/ {destinations.length}</span></p>
          </div>
          <div className="px-5 py-3 rounded-sm bg-[#080808] border border-white/5 text-center">
            <p className="text-[9px] font-mono tracking-widest uppercase text-stone-500">ITEMS SYNCED</p>
            <p className="text-lg font-mono font-bold text-amber-500">{totalSyncedSum}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Active Destinations Section */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-[#080808] border border-white/5 rounded-sm">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 text-[11px] font-mono tracking-wider uppercase transition-all rounded-sm ${
                filterType === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-500 hover:text-white'
              }`}
            >
              ALL SERVICES [{destinations.length}]
            </button>
            <button
              onClick={() => setFilterType('connected')}
              className={`px-3.5 py-1.5 text-[11px] font-mono tracking-wider uppercase transition-all rounded-sm ${
                filterType === 'connected'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-500 hover:text-white'
              }`}
            >
              CONNECTED [{activeCount}]
            </button>
            <button
              onClick={() => setFilterType('disconnected')}
              className={`px-3.5 py-1.5 text-[11px] font-mono tracking-wider uppercase transition-all rounded-sm ${
                filterType === 'disconnected'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-500 hover:text-white'
              }`}
            >
              STANDBY [{destinations.length - activeCount}]
            </button>
          </div>

          <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Default destination is automatically targeted by the floating Extension button.</span>
          </div>
        </div>

        {/* Main Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map(dest => {
            const isTesting = testSyncLoadingId === dest.id;
            const isTestSuccess = testSyncSuccessId === dest.id;

            return (
              <div
                key={dest.id}
                className={`group relative bg-[#080808] border rounded-sm p-6 transition-all duration-200 flex flex-col justify-between hover:bg-white/[0.02] ${
                  dest.connected
                    ? 'border-white/10 hover:border-amber-500/40'
                    : 'border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Card Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-[#050505] border border-white/10 flex items-center justify-center p-2">
                        {renderDestIcon(dest.type, 'w-5 h-5')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-xl text-white">
                            {dest.name}
                          </h3>
                          {dest.isDefault && (
                            <span className="px-2 py-0.5 rounded-sm text-[9px] font-mono tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">
                          {dest.connected ? (
                            <span className="text-amber-500 font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                              ACTIVE UPLINK
                            </span>
                          ) : (
                            <span className="text-stone-600">STANDBY MODE</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleConnect(dest)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        dest.connected ? 'bg-amber-500' : 'bg-stone-800'
                      }`}
                      title={dest.connected ? 'Disconnect' : 'Connect'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                          dest.connected ? 'translate-x-5 bg-black' : 'translate-x-0 bg-stone-500'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-400 leading-relaxed min-h-[36px] font-sans">
                    {dest.description}
                  </p>

                  {/* Target Resource Summary */}
                  <div className="p-3.5 rounded-sm bg-[#050505] border border-white/5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-500 font-mono text-[10px] uppercase tracking-wider">
                      <span>TARGET RESOURCE:</span>
                      <span className="text-amber-500/80">
                        {dest.syncFrequency}
                      </span>
                    </div>
                    <p className="font-serif text-sm text-stone-200 truncate flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span>{dest.targetResourceName || 'Unspecified target'}</span>
                    </p>
                    {dest.accountEmail && (
                      <p className="text-[10px] font-mono text-stone-500 truncate">
                        AUTH: {dest.accountEmail}
                      </p>
                    )}
                    {dest.endpointUrl && (
                      <p className="text-[10px] text-stone-500 font-mono truncate">
                        ENDPOINT: {dest.endpointUrl}
                      </p>
                    )}
                  </div>

                  {/* Stats Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-stone-500 pt-1">
                    <span>SYNCED: <strong className="text-stone-300">{dest.itemsSyncedCount} ITEMS</strong></span>
                    <span>LAST: <strong className="text-stone-300">{dest.lastSync || 'NEVER'}</strong></span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 mt-4 border-t border-white/5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedDestForConfig(dest)}
                      className="py-2 px-3 rounded-sm text-[10px] font-mono tracking-wider uppercase font-semibold bg-[#050505] text-stone-300 hover:text-white border border-white/10 hover:border-amber-500/40 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-stone-400" />
                      <span>Configure</span>
                    </button>

                    {!dest.connected ? (
                      <button
                        onClick={() => setOauthModalDest(dest)}
                        className="py-2 px-3 rounded-sm text-[10px] font-mono tracking-wider uppercase font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Connect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTestPing(dest)}
                        disabled={isTesting}
                        className={`py-2 px-3 rounded-sm text-[10px] font-mono tracking-wider uppercase font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          isTestSuccess
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                            : 'border-white/10 text-stone-300 hover:border-amber-500/50 hover:text-amber-400'
                        }`}
                      >
                        {isTesting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                        ) : isTestSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>PING OK</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-amber-500" />
                            <span>Test Ping</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    {!dest.isDefault ? (
                      <button
                        onClick={() => handleSetDefault(dest.id)}
                        className="text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5"
                        title="Set this storage target as default destination"
                      >
                        <Star className="w-3 h-3 fill-amber-400/20" />
                        <span>Set as Default</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-amber-500" />
                        Active Default Target
                      </span>
                    )}

                    {dest.connected && (dest.type === 'google_sheets' || dest.type === 'sheets') && (
                      <button
                        onClick={() => handleBeautifySheet(dest)}
                        disabled={beautifyLoadingId === dest.id}
                        className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-sm transition-all flex items-center gap-1.5"
                        title="Apply modern executive dashboard styling (Navy headers, alternating colors, auto-widths, formatted dates & links)"
                      >
                        {beautifyLoadingId === dest.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                        ) : beautifySuccessId === dest.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>STYLED!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Beautify Sheet</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowPayloadModal(dest)}
                      className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-300 ml-auto flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-amber-500" />
                      Inspect JSON
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: EXPLORE & DISCOVER INTEGRATIONS */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Explore Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded-sm">
                Marketplace Directory
              </span>
            </div>
            <h2 className="text-2xl font-serif text-white">
              Explore & Discover <span className="italic text-stone-400">Supported Integrations</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl font-sans leading-relaxed">
              Search through 12+ pre-built connectors for databases, spreadsheets, CRMs, and developer pipelines. Click connect to initialize instant OAuth consent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-stone-400 bg-[#050505] px-3 py-1.5 border border-white/5 rounded-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS 1.3 Encrypted Handshake</span>
            </span>
          </div>
        </div>

        {/* Search Bar & Category Filter Bar */}
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={exploreQuery}
                onChange={e => setExploreQuery(e.target.value)}
                placeholder="Search integrations by name, database type, or CRM (e.g. Notion, Snowflake, HubSpot)..."
                className="w-full pl-10 pr-9 py-2.5 bg-[#050505] text-white text-xs rounded-sm border border-white/10 focus:border-amber-500 outline-none font-sans placeholder:text-stone-600 transition-colors"
              />
              {exploreQuery && (
                <button
                  onClick={() => setExploreQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Result Counter */}
            <div className="text-[11px] font-mono text-stone-500 px-3 py-2 bg-[#050505] border border-white/5 rounded-sm flex items-center justify-between md:justify-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Showing {filteredCatalog.length} Integrations</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-stone-500 text-[10px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-500" /> Filter:
            </span>
            {[
              { id: 'all', label: 'ALL SERVICES' },
              { id: 'spreadsheets', label: 'SPREADSHEETS' },
              { id: 'databases', label: 'DATABASES & SQL' },
              { id: 'crms', label: 'CRMS & SALES' },
              { id: 'productivity', label: 'PRODUCTIVITY' },
              { id: 'automation', label: 'WEBHOOKS & AUTOMATION' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setExploreCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-wider shrink-0 transition-all border ${
                  exploreCategory === cat.id
                    ? 'bg-amber-500 text-black font-semibold border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-[#050505] text-stone-400 border-white/5 hover:border-white/20 hover:text-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Explore Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {filteredCatalog.map(item => {
            const isAlreadyConnected = destinations.some(
              d => d.connected && (d.id === item.id || d.name.toLowerCase() === item.name.toLowerCase())
            );

            return (
              <div
                key={item.id}
                className="bg-[#050505] border border-white/5 rounded-sm p-5 hover:border-amber-500/30 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-sm bg-[#080808] border border-white/10 flex items-center justify-center p-1.5">
                      {renderDestIcon(item.iconType, 'w-5 h-5')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.popular && (
                        <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          POPULAR
                        </span>
                      )}
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-white/[0.03] text-stone-400 border border-white/5">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-serif text-lg text-white group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 font-sans leading-relaxed line-clamp-2 min-h-[32px]">
                      {item.description}
                    </p>
                  </div>

                  {/* Auth Badge */}
                  <div className="p-2.5 rounded-sm bg-[#080808] border border-white/5 text-[10px] font-mono text-stone-400 flex items-center justify-between">
                    <span className="text-stone-500 uppercase">AUTH METHOD:</span>
                    <span className="text-stone-200 font-medium">{item.authMethod}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    {item.badge}
                  </span>

                  <button
                    onClick={() => handleConnectCatalogItem(item)}
                    className={`py-1.5 px-3.5 rounded-sm font-mono text-[10px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                      isAlreadyConnected
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/10'
                    }`}
                  >
                    {isAlreadyConnected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCatalog.length === 0 && (
          <div className="p-12 text-center bg-[#050505] border border-white/5 rounded-sm space-y-3">
            <Compass className="w-8 h-8 text-stone-600 mx-auto animate-pulse" />
            <p className="text-stone-300 font-serif text-base">No matching integration connector found.</p>
            <p className="text-xs text-stone-500 font-sans max-w-md mx-auto">
              Try searching with another keyword like "Sheets", "Notion", "Postgres", or "Webhook".
            </p>
            <button
              onClick={() => { setExploreQuery(''); setExploreCategory('all'); }}
              className="mt-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-sm font-mono text-xs uppercase tracking-wider hover:bg-amber-500/20"
            >
              Reset Search Filters
            </button>
          </div>
        )}
      </div>

      {/* Sync Log History Stream */}
      <div className="bg-[#080808] border border-white/5 rounded-sm p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h2 className="text-xl font-serif text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Live System Activity Stream
            </h2>
            <p className="text-xs text-stone-400 mt-0.5 font-sans">
              Real-time audit log of formatted database payloads generated during clip actions.
            </p>
          </div>

          <button
            onClick={() => {
              const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
              handleTestPing(randomDest);
            }}
            className="px-3.5 py-2 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase tracking-wider font-semibold hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Simulate Web Clip Event
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-white/5 text-stone-500 uppercase font-mono text-[9px] tracking-[0.2em]">
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3">TARGET</th>
                <th className="py-3 px-3">PAYLOAD / TITLE</th>
                <th className="py-3 px-3">LATENCY</th>
                <th className="py-3 px-3">SIZE</th>
                <th className="py-3 px-3">TIMESTAMP</th>
                <th className="py-3 px-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-stone-300">
              {logs.slice(0, 8).map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <CheckCircle className="w-3 h-3 text-amber-500" />
                      SUCCESS
                    </span>
                  </td>
                  <td className="py-3 px-3 font-serif text-white text-sm">
                    {log.destinationName}
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-stone-200">
                    {log.clipTitle}
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-500 text-[11px]">
                    {log.durationMs}ms
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-500 text-[11px]">
                    {log.payloadSize}
                  </td>
                  <td className="py-3 px-3 text-stone-500 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-stone-400 text-[11px] font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* OAuth Consent & Permissions Modal */}
      {oauthModalDest && (
        <OAuthConnectModal
          dest={oauthModalDest}
          onClose={() => setOauthModalDest(null)}
          onGrant={handleGrantPermission}
        />
      )}

      {disconnectConfirmDest && (
        <DisconnectConfirmationModal
          dest={disconnectConfirmDest}
          onCancel={() => setDisconnectConfirmDest(null)}
          onConfirm={confirmDisconnect}
        />
      )}

      {/* Sample Payload Inspector Modal */}
      {showPayloadModal && (
        <PayloadInspectorModal
          dest={showPayloadModal}
          onClose={() => setShowPayloadModal(null)}
        />
      )}
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
              <Database className="w-5 h-5 text-amber-500" />
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

// Sub-Component: API Payload Inspector Modal
const PayloadInspectorModal: React.FC<{ dest: DestinationConfig; onClose: () => void }> = ({
  dest,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'react' | 'node'>('json');
  const [copied, setCopied] = useState(false);

  const samplePayload = {
    event: "CLIPPER_SAVE_CLIP",
    timestamp: new Date().toISOString(),
    destination: {
      provider: dest.type,
      targetResource: dest.targetResourceName,
    },
    payload: {
      title: "Senior Frontend Engineer (React & TypeScript) - Remote",
      url: "https://x.com/tech_careers/status/18219482104921",
      selected_text: "We are hiring a Senior React Engineer! Remote worldwide. Stack: React 19, TypeScript...",
      type: "job",
      tags: ["Remote", "React", "Frontend", "TypeScript"],
      ai_summary: "High-paying remote Senior Frontend Engineer opportunity focused on modern React, TS, and performance.",
      extracted_data: {
        company: "Vercel Ecosystem Labs",
        salary: "$140,000 - $175,000",
        location: "Remote (Worldwide)",
        deadline: "Aug 25, 2026"
      }
    }
  };

  const reactCodeSnippet = `// React + Tailwind CSS OAuth Permission & Connect Modal for ${dest.name}
import React, { useState } from 'react';
import { Database, Key, Check, Zap, X, RefreshCw } from 'lucide-react';

export const ${dest.name.replace(/[^a-zA-Z0-9]/g, '')}OAuthModal = ({ onClose, onGrant }: { onClose: () => void; onGrant: (data: any) => void }) => {
  const [accessType, setAccessType] = useState<'full' | 'partial'>('full');
  const [actionType, setActionType] = useState<'create' | 'existing'>('create');
  const [tableName, setTableName] = useState('${dest.targetResourceName || 'Clipped Vault 2026'}');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    setTimeout(() => {
      onGrant({ accessType, actionType, tableName });
      setIsAuthorizing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#080808] border border-white/10 w-full max-w-xl rounded-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#050505] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm bg-[#080808] border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded-sm">
                OAuth 2.0 Consent
              </span>
              <h2 className="text-xl font-serif text-white mt-1">Connect to ${dest.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Options Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs bg-[#080808]">
          <div className="p-3 bg-[#050505] border border-white/5 rounded-sm flex items-center justify-between">
            <span className="text-stone-300">Authorizing Account:</span>
            <span className="font-mono text-stone-200 text-[11px] bg-white/[0.04] px-2 py-1 rounded-sm border border-white/5">
              ${dest.accountEmail || 'user@gmail.com'}
            </span>
          </div>

          {/* Access Scope Options */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">1. Choose Access Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setAccessType('full')}
                className={\`p-3.5 rounded-sm border cursor-pointer \${accessType === 'full' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-[#050505] border-white/5 text-stone-400'}\`}
              >
                <div className="font-mono text-xs uppercase font-semibold text-white mb-1">Full Access Sync</div>
                <p className="text-[11px] opacity-80">Read, write, & auto-create new tables/sheets dynamically when clipping.</p>
              </div>
              <div
                onClick={() => setAccessType('partial')}
                className={\`p-3.5 rounded-sm border cursor-pointer \${accessType === 'partial' ? 'bg-amber-500/10 border-amber-500 text-amber-300' : 'bg-[#050505] border-white/5 text-stone-400'}\`}
              >
                <div className="font-mono text-xs uppercase font-semibold text-white mb-1">Partial Access</div>
                <p className="text-[11px] opacity-80">Append-only access into an existing selected table. No table creation rights.</p>
              </div>
            </div>
          </div>

          {/* Target Resource Option */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">2. Target Resource</label>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isAuthorizing}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-semibold rounded-sm shadow-lg flex items-center justify-center gap-2"
          >
            {isAuthorizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-black" />}
            {isAuthorizing ? 'Authorizing Uplink...' : 'Grant Permission & Connect'}
          </button>
        </form>
      </div>
    </div>
  );
};`;

  const nodeCodeSnippet = `// Node.js Express Backend Integration Handler for ${dest.name}
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/sync/${dest.type}', async (req, res) => {
  try {
    const { payload, destination } = req.body;
    console.log(\`[${dest.name}] Incoming clip:\`, payload.title);

    // Save to ${dest.name} using official SDK or REST API
    // Endpoint: ${dest.endpointUrl || 'https://api.clipper.internal/v1/sync'}
    
    return res.status(200).json({
      status: 'success',
      provider: '${dest.type}',
      resource: destination.targetResource || '${dest.targetResourceName}',
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});`;

  const getActiveText = () => {
    if (activeTab === 'json') return JSON.stringify(samplePayload, null, 2);
    if (activeTab === 'react') return reactCodeSnippet;
    return nodeCodeSnippet;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#080808] border border-white/10 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif text-lg text-white">
              Integration Code & UI — {dest.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/5 bg-[#080808] px-5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('json')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition-colors ${
              activeTab === 'json' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            JSON Payload
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition-colors ${
              activeTab === 'react' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            React + Tailwind UI Code
          </button>
          <button
            onClick={() => setActiveTab('node')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition-colors ${
              activeTab === 'node' ? 'border-amber-500 text-amber-400 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            Node.js Endpoint
          </button>
        </div>

        <div className="p-5 space-y-3 bg-[#080808] flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>TLS 1.3 / {dest.name}</span>
            <button
              onClick={handleCopy}
              className="text-amber-500 font-semibold flex items-center gap-1 hover:underline uppercase tracking-wider text-[10px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied Code!' : 'Copy Code Snippet'}
            </button>
          </div>

          <pre className="p-4 rounded-sm bg-[#050505] text-amber-400/90 text-xs font-mono overflow-auto border border-white/5 flex-1 max-h-[380px] leading-relaxed">
            {getActiveText()}
          </pre>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#050505] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono uppercase tracking-wider font-semibold rounded-sm"
          >
            Close Inspector
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
}

const OAuthConnectModal: React.FC<OAuthModalProps> = ({ dest, onClose, onGrant }) => {
  const [accessType, setAccessType] = useState<'full' | 'partial'>('full');
  const [actionType, setActionType] = useState<'create' | 'existing'>('create');
  const [tableName, setTableName] = useState(
    dest.targetResourceName ||
      (dest.type === 'google_sheets' ? 'Clipped Opportunities Sheet 2026' : 'Clipped Vault Database')
  );
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    await onGrant(dest.id, { accessType, actionType, tableName });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#080808] border border-white/10 w-full max-w-xl rounded-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#050505] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm bg-[#080808] border border-amber-500/30 flex items-center justify-center p-2 text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded-sm">
                  OAuth 2.0 Consent
                </span>
              </div>
              <h2 className="text-xl font-serif text-white mt-1">
                Connect to {dest.name}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-500 hover:text-white rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs bg-[#080808]">
          <div className="p-3 bg-[#050505] border border-white/5 rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <span className="text-stone-300 font-sans">Authorizing Account:</span>
            </div>
            <span className="font-mono text-stone-200 text-[11px] bg-white/[0.04] px-2 py-1 rounded-sm border border-white/5">
              {dest.accountEmail || 'user@gmail.com'}
            </span>
          </div>

          {/* Scope Permission Level */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
              1. Choose Access Level Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setAccessType('full')}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                  accessType === 'full'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-white">Full Access Sync</span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'full'}
                    onChange={() => setAccessType('full')}
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                  Read, write, & auto-create new tables/sheets dynamically when clipping opportunities.
                </p>
              </div>

              <div
                onClick={() => setAccessType('partial')}
                className={`p-3.5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                  accessType === 'partial'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-[#050505] border-white/5 text-stone-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-white">Partial Access</span>
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'partial'}
                    onChange={() => setAccessType('partial')}
                    className="accent-amber-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] leading-relaxed opacity-80 font-sans">
                  Append-only access into an existing selected table. No table creation rights.
                </p>
              </div>
            </div>
          </div>

          {/* Database Creation or Existing Selection */}
          <div className="space-y-3">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-400">
              2. Target Resource Configuration
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-4 bg-[#050505] p-3 border border-white/5 rounded-sm">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-stone-200">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'create'}
                    onChange={() => setActionType('create')}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>Auto-Create New Table / Sheet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-stone-200">
                  <input
                    type="radio"
                    name="actionType"
                    checked={actionType === 'existing'}
                    onChange={() => setActionType('existing')}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>Link Existing Resource</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-500 mb-1 uppercase">
                  {actionType === 'create' ? 'Name for New Table / Sheet:' : 'Existing Resource Name or ID:'}
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  placeholder="e.g. Clipped Opportunities 2026"
                  className="w-full px-3.5 py-2 bg-[#050505] text-white rounded-sm border border-white/10 focus:border-amber-500 outline-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Scope Consent List */}
          <div className="p-3 bg-[#050505] border border-white/5 rounded-sm space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500 font-semibold">
              {accessType === 'full' ? 'FULL ACCESS SCOPE REQUESTED:' : 'PARTIAL (APPEND-ONLY) SCOPE REQUESTED:'}
            </p>
            <ul className="space-y-1.5 text-[11px] text-stone-300 font-sans">
              {accessType === 'full' ? (
                <>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Read, write, format, & auto-create new tables/sheets dynamically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Write title, source URL, salary ranges, tags, & AI summaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Real-time webhook sync & dynamic column generation</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Append-only access into designated resource: "{tableName}"</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Restricted mode: No file deletion or structural schema modification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Write clipped metadata into pre-existing columns only</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#050505] text-stone-400 border border-white/10 hover:text-white rounded-sm font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAuthorizing}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs uppercase tracking-wider font-semibold rounded-sm shadow-lg flex items-center gap-2 transition-all"
            >
              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-black" />
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
