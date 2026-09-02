import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Table, 
  Zap, 
  HardDrive, 
  Database, 
  Search, 
  Compass, 
  Sparkles, 
  Filter, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Check, 
  X 
} from 'lucide-react';
import { BrandIcon } from './BrandIcons';

export type IntegrationCategory = 'spreadsheets' | 'databases' | 'crms' | 'productivity' | 'automation';

export interface CatalogItem {
  id: string;
  name: string;
  type: string;
  category: IntegrationCategory;
  description: string;
  badge: string;
  popular?: boolean;
  color: string;
  defaultResourceName: string;
  authMethod: string;
  iconType: 'sheets' | 'notion' | 'airtable' | 'webhook' | 'db' | 'crm' | 'productivity';
}

export const INTEGRATION_CATALOG: CatalogItem[] = [
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
  }
];

interface ExploreIntegrationsProps {
  connectedNames?: string[];
  onConnectItem: (item: CatalogItem) => void;
}

export const ExploreIntegrationsSection: React.FC<ExploreIntegrationsProps> = ({
  connectedNames = [],
  onConnectItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | IntegrationCategory>('all');

  const filteredCatalog = INTEGRATION_CATALOG.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const renderIcon = (type: string, className = 'w-5 h-5') => {
    return <BrandIcon name={type} className={className} />;
  };

  return (
    <div className="bg-[#080808] border border-white/10 rounded-sm p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden text-white font-sans mt-10">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
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

      {/* Search & Filters */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search integrations by name, database type, or CRM (e.g. Notion, Snowflake, HubSpot)..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#050505] text-white text-xs rounded-sm border border-white/10 focus:border-amber-500 outline-none font-sans placeholder:text-stone-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Counter */}
          <div className="text-[11px] font-mono text-stone-500 px-3 py-2 bg-[#050505] border border-white/5 rounded-sm flex items-center justify-between md:justify-start gap-2 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Showing {filteredCatalog.length} Integrations</span>
          </div>
        </div>

        {/* Category Filter Chips */}
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
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-wider shrink-0 transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black font-semibold border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-[#050505] text-stone-400 border-white/5 hover:border-white/20 hover:text-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {filteredCatalog.map(item => {
          const isConnected = connectedNames.some(
            name => name.toLowerCase() === item.name.toLowerCase()
          );

          return (
            <div
              key={item.id}
              className="bg-[#050505] border border-white/5 rounded-sm p-5 hover:border-amber-500/30 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-sm bg-[#080808] border border-white/10 flex items-center justify-center p-1.5">
                    {renderIcon(item.id || item.name || item.type, 'w-5 h-5')}
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

                <div>
                  <h3 className="font-serif text-lg text-white group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1 font-sans leading-relaxed line-clamp-2 min-h-[32px]">
                    {item.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-sm bg-[#080808] border border-white/5 text-[10px] font-mono text-stone-400 flex items-center justify-between">
                  <span className="text-stone-500 uppercase">AUTH METHOD:</span>
                  <span className="text-stone-200 font-medium">{item.authMethod}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-500 uppercase">
                  {item.badge}
                </span>

                <button
                  onClick={() => onConnectItem(item)}
                  className={`py-1.5 px-3.5 rounded-sm font-mono text-[10px] uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 ${
                    isConnected
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/10'
                  }`}
                >
                  {isConnected ? (
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

      {/* Empty State */}
      {filteredCatalog.length === 0 && (
        <div className="p-12 text-center bg-[#050505] border border-white/5 rounded-sm space-y-3">
          <Compass className="w-8 h-8 text-stone-600 mx-auto animate-pulse" />
          <p className="text-stone-300 font-serif text-base">No matching integration connector found.</p>
          <p className="text-xs text-stone-500 font-sans max-w-md mx-auto">
            Try searching with another keyword like "Sheets", "Notion", "Postgres", or "Webhook".
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="mt-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-sm font-mono text-xs uppercase tracking-wider hover:bg-amber-500/20"
          >
            Reset Search Filters
          </button>
        </div>
      )}
    </div>
  );
};
