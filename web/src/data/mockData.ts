import { DestinationConfig, ClipItem, JobCard, ConnectionSyncLog, SharedBoard, WeeklyDigestStats, CustomPageConfig } from '../types';

export const INITIAL_CUSTOM_PAGES: CustomPageConfig[] = [
  {
    id: 'page_job',
    name: 'Job Opportunities',
    slug: 'job',
    iconName: 'Briefcase',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Track job listings, application status, salary metrics, and interview timelines.',
    contentTypes: ['job', 'general'],
    aiGoalPrompt: 'Extract company name, salary range, location, requirements, and calculate candidate fit score.',
    createdAt: '2026-08-01T00:00:00Z',
    isSystemDefault: true
  },
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
  },
  {
    id: 'page_research',
    name: 'AI & Tech Research',
    slug: 'research',
    iconName: 'Cpu',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    description: 'Deep learning papers, LLM architecture benchmarks, and technical whitepapers.',
    contentTypes: ['research', 'article'],
    aiGoalPrompt: 'Summarize key innovations, abstract methodology, code repository links, and benchmark performance.',
    createdAt: '2026-08-02T10:00:00Z',
    isSystemDefault: false
  },
  {
    id: 'page_books',
    name: 'Books & Reading List',
    slug: 'books',
    iconName: 'BookOpen',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    description: 'Non-fiction books, technical guides, chapter highlights, and personal reading notes.',
    contentTypes: ['book', 'article'],
    aiGoalPrompt: 'Extract author, main thesis, key chapter takeaways, and actionable mental models.',
    createdAt: '2026-08-03T12:00:00Z',
    isSystemDefault: false
  },
  {
    id: 'page_projects',
    name: 'Projects & Ideas',
    slug: 'projects',
    iconName: 'FolderGit2',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Open source repositories, side project ideas, tech stack blueprints, and architecture drafts.',
    contentTypes: ['project', 'programming'],
    aiGoalPrompt: 'Extract repository stats, technology stack, setup commands, and potential integration use-cases.',
    createdAt: '2026-08-04T14:00:00Z',
    isSystemDefault: false
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

export const INITIAL_CLIPS: ClipItem[] = [
  {
    id: 'clip_1',
    title: 'Senior Frontend Engineer (React & TypeScript) - Remote',
    url: 'https://x.com/tech_careers/status/18219482104921',
    selectedText: 'We are hiring a Senior React Engineer! Remote worldwide. Stack: React 19, TypeScript, Tailwind CSS, Vite. Salary: $140,000 - $175,000 + equity. DM or apply via link!',
    summary: 'High-paying remote Senior Frontend Engineer opportunity focused on modern React, TS, and performance.',
    type: 'job',
    tags: ['Remote', 'React', 'Frontend', 'TypeScript', '$140k-$175k'],
    createdAt: '2026-08-09T04:12:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['google_sheets', 'notion'],
    storageMode: 'cloud',
    pageId: 'page_job',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=x.com&sz=64',
    extractedData: {
      company: 'Vercel Ecosystem Labs',
      salary: '$140,000 - $175,000',
      location: 'Remote (Worldwide)',
      deadline: 'Aug 25, 2026'
    },
    isFavorite: true
  },
  {
    id: 'clip_2',
    title: 'Global AI Founders Hackathon 2026 ($50,000 Cash Prizes)',
    url: 'https://linkedin.com/posts/ai-founders-hub-2026',
    selectedText: 'Announcing the 2026 AI Innovation Hackathon! Build using Gemini 2.0 & Claude APIs. $50k total prize pool + YC fast-track interviews. Registration open until Aug 20.',
    summary: 'Virtual hackathon with $50,000 cash prizes and investor fast-track opportunities for AI builders.',
    type: 'event',
    tags: ['Hackathon', 'AI', 'Prizes', 'YC', 'Virtual'],
    createdAt: '2026-08-08T18:30:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['google_sheets'],
    storageMode: 'cloud',
    pageId: 'page_job',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64',
    extractedData: {
      price: 'Free Entry ($50k Prizes)',
      deadline: 'Aug 20, 2026',
      location: 'Online'
    },
    isFavorite: true
  },
  {
    id: 'clip_3',
    title: 'OpenAI Developer Fellowship 2026 - Fully Funded Grant',
    url: 'https://openai.com/careers/fellowship-2026',
    selectedText: 'Applications now open for the 6-month Developer Fellowship. Provides $10,000/month stipend, API credits, and direct mentorship from research engineers.',
    summary: '6-month research fellowship with $10k/month stipend and compute allocation.',
    type: 'scholarship',
    tags: ['Fellowship', 'Stipend', 'Research', '$10k/mo'],
    createdAt: '2026-08-08T11:15:00Z',
    sourceApp: 'Mobile Share Sheet',
    syncedTo: ['notion', 'google_sheets'],
    storageMode: 'local',
    pageId: 'page_education',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64',
    extractedData: {
      company: 'OpenAI',
      salary: '$10,000 / month stipend',
      location: 'San Francisco / Remote',
      deadline: 'Sept 1, 2026'
    }
  },
  {
    id: 'clip_4',
    title: 'Attention Is All You Need 2.0: Scaling Transformer Contexts to 10M Tokens',
    url: 'https://arxiv.org/abs/2608.01928',
    selectedText: 'We introduce a novel sparse linear attention mechanism enabling sub-quadratic complexity for 10M+ token context windows with zero loss in recall accuracy.',
    summary: 'Sub-quadratic attention architecture supporting 10,000,000 token context windows without accuracy degradation.',
    type: 'research',
    tags: ['AI Research', 'Transformers', 'LLM', 'ArXiv', 'Sub-Quadratic'],
    createdAt: '2026-08-08T09:10:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['notion'],
    storageMode: 'local',
    pageId: 'page_research',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=arxiv.org&sz=64',
    extractedData: {
      author: 'Vaswani et al. (2026)',
      company: 'Google DeepMind & Stanford',
      rating: '9.8/10 Impact Score'
    },
    isFavorite: true
  },
  {
    id: 'clip_5',
    title: 'Designing Data-Intensive Applications (2nd Edition) - System Architecture Notes',
    url: 'https://dataintensive.net/chapter-4-encoding-evolution',
    selectedText: 'Key takeaway: Schema evolution in distributed datastores requires backward and forward compatibility guarantees across RPC interfaces.',
    summary: 'Chapter 4 analysis on backward/forward binary serialization and zero-downtime database schema migrations.',
    type: 'book',
    tags: ['System Design', 'Books', 'Distributed Systems', 'Architecture'],
    createdAt: '2026-08-07T14:20:00Z',
    sourceApp: 'Web App',
    syncedTo: [],
    storageMode: 'local',
    pageId: 'page_books',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=dataintensive.net&sz=64',
    extractedData: {
      author: 'Martin Kleppmann',
      duration: '45 min reading note'
    }
  },
  {
    id: 'clip_6',
    title: 'Fast-Inference Local Agent Server (Rust & WebGPU)',
    url: 'https://github.com/rust-ai/agent-server',
    selectedText: 'Ultra-fast local AI agent runner written in Rust with WebGPU acceleration. Sub-10ms token generation for edge devices.',
    summary: 'Open-source Rust crate for running local LLM agents on device via WebGPU bindings.',
    type: 'project',
    tags: ['Rust', 'WebGPU', 'OpenSource', 'GitHub', 'Local AI'],
    createdAt: '2026-08-06T18:00:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['google_sheets'],
    storageMode: 'cloud',
    pageId: 'page_projects',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
    extractedData: {
      author: 'rust-ai-org',
      rating: '⭐ 4.8k Stars'
    }
  },
  {
    id: 'clip_7',
    title: 'Staff ML Infrastructure Engineer — Candidate Portfolio & Recommendations',
    url: 'https://linkedin.com/in/marcus-chen-ml-infra',
    selectedText: 'Marcus Chen: Ex-Stripe Staff Platform Lead. Specialized in large-scale model inference, Kubernetes GPU scheduling, and high-throughput vector store architectures.',
    summary: 'Candidate profile for Staff/Principal Infrastructure role. Strong open-source track record in distributed inference.',
    type: 'job',
    tags: ['Hire', 'Candidate', 'ML Infra', 'Staff Engineer', 'Kubernetes'],
    createdAt: '2026-08-05T16:45:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['notion', 'airtable'],
    storageMode: 'cloud',
    pageId: 'page_job',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64',
    extractedData: {
      company: 'Marcus Chen (Staff Candidate)',
      salary: '$220,000 - $260,000',
      location: 'San Francisco, CA / Remote',
      rating: 'Top 1% Candidate Match'
    },
    isFavorite: true
  },
  {
    id: 'clip_8',
    title: 'H100 SXM5 GPU Cloud Cluster Deal — 40% Off Annual Reserved Instances',
    url: 'https://lambdalabs.com/service/gpu-cloud/pricing-deal',
    selectedText: 'Special allocation: 8x H100 SXM5 80GB clusters with 3.2Tbps Quantum-2 InfiniBand. Annual committed contract locked at $1.99/GPU/hr (40% discount).',
    summary: 'Reserved GPU cloud capacity pricing contract for production LLM training & fine-tuning pipelines.',
    type: 'deal',
    tags: ['Buy', 'Deal', 'GPU', 'Infrastructure', 'H100', 'Discount'],
    createdAt: '2026-08-04T10:15:00Z',
    sourceApp: 'Chrome Extension',
    syncedTo: ['google_sheets', 'notion'],
    storageMode: 'cloud',
    pageId: 'page_projects',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=lambdalabs.com&sz=64',
    extractedData: {
      price: '$1.99 / GPU / hr (40% Off)',
      deadline: 'Limited availability (Q3/Q4 2026)',
      company: 'Lambda Labs & CoreWeave'
    },
    isFavorite: false
  }
];

export const INITIAL_JOBS: JobCard[] = [
  {
    id: 'job_1',
    clipId: 'clip_1',
    title: 'Senior Frontend Engineer',
    company: 'Vercel Ecosystem Labs',
    location: 'Remote Worldwide',
    salary: '$140,000 - $175,000',
    status: 'interviewing',
    fitScore: 94,
    url: 'https://x.com/tech_careers/status/18219482104921',
    dateAdded: '2026-08-09',
    notes: 'Technical interview scheduled for Tuesday with Engineering Lead.',
    nextActionDate: '2026-08-11',
    nextActionLabel: 'Technical Round 1'
  },
  {
    id: 'job_2',
    title: 'Full Stack AI Developer',
    company: 'Anthropic Partner Studio',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$160,000 - $190,000',
    status: 'applied',
    fitScore: 88,
    url: 'https://linkedin.com/jobs/view/9928101',
    dateAdded: '2026-08-07',
    notes: 'Submitted customized resume highlighting Gemini API & React 19 experience.',
    nextActionDate: '2026-08-14',
    nextActionLabel: 'Follow up with recruiter'
  },
  {
    id: 'job_3',
    title: 'Product Engineer (TypeScript & UI)',
    company: 'Linear Labs',
    location: 'Remote (US/EU)',
    salary: '$150,000 - $180,000',
    status: 'saved',
    fitScore: 91,
    url: 'https://linear.app/careers/product-engineer',
    dateAdded: '2026-08-08',
    notes: 'Need to prepare portfolio video of recent UI design projects.',
    nextActionDate: '2026-08-10',
    nextActionLabel: 'Submit application'
  },
  {
    id: 'job_4',
    title: 'Lead UI Architect',
    company: 'Supabase Inc',
    location: 'Remote',
    salary: '$170,000 - $210,000',
    status: 'offer',
    fitScore: 96,
    url: 'https://supabase.com/careers/ui-architect',
    dateAdded: '2026-07-28',
    notes: 'Offer letter received! Reviewing equity package.',
    nextActionDate: '2026-08-12',
    nextActionLabel: 'Decide on offer'
  }
];

export const INITIAL_SYNC_LOGS: ConnectionSyncLog[] = [];

export const INITIAL_SHARED_BOARDS: SharedBoard[] = [
  {
    id: 'board_1',
    title: '🚀 Top Remote React & AI Opportunities',
    description: 'Curated list of high-tier developer roles, grants, and technical hackathons updated daily.',
    itemCount: 42,
    membersCount: 8,
    tags: ['Jobs', 'AI', 'Remote', 'Tech'],
    isPublic: true,
    updatedAt: '10 minutes ago',
    coverGradient: 'from-purple-600 to-indigo-600',
    members: [
      { name: 'Rediet G.', avatar: 'RG', role: 'owner' },
      { name: 'Sarah Chen', avatar: 'SC', role: 'editor' },
      { name: 'Alex Rivera', avatar: 'AR', role: 'viewer' }
    ]
  },
  {
    id: 'board_2',
    title: '💡 Y Combinator & Startup Grants 2026',
    description: 'All pitch competitions, accelerator deadlines, and founder micro-grants.',
    itemCount: 19,
    membersCount: 5,
    tags: ['Grants', 'Startups', 'YC', 'Funding'],
    isPublic: false,
    updatedAt: '2 hours ago',
    coverGradient: 'from-emerald-600 to-teal-600',
    members: [
      { name: 'Rediet G.', avatar: 'RG', role: 'owner' },
      { name: 'David K.', avatar: 'DK', role: 'editor' }
    ]
  },
  {
    id: 'board_3',
    title: '📚 Must-Read Tech Articles & Courses',
    description: 'Key papers on AI architecture, system design benchmarks, and free cohorts.',
    itemCount: 31,
    membersCount: 12,
    tags: ['Articles', 'Courses', 'Learning'],
    isPublic: true,
    updatedAt: '1 day ago',
    coverGradient: 'from-amber-500 to-rose-600',
    members: [
      { name: 'Rediet G.', avatar: 'RG', role: 'owner' },
      { name: 'Elena Rostova', avatar: 'ER', role: 'editor' }
    ]
  }
];

export const INITIAL_DIGEST: WeeklyDigestStats = {
  totalClips: 24,
  topCategory: 'job',
  categoryBreakdown: [
    { type: 'job', count: 12, percentage: 50 },
    { type: 'event', count: 5, percentage: 21 },
    { type: 'scholarship', count: 3, percentage: 12 },
    { type: 'deal', count: 2, percentage: 8 },
    { type: 'course', count: 2, percentage: 8 }
  ],
  opportunitiesSaved: 17,
  topMatches: [
    { title: 'Senior Frontend Engineer', company: 'Vercel Ecosystem Labs', score: 94, url: 'https://x.com/tech_careers/status/18219482104921' },
    { title: 'Lead UI Architect', company: 'Supabase Inc', score: 96, url: 'https://supabase.com/careers/ui-architect' },
    { title: 'Product Engineer', company: 'Linear Labs', score: 91, url: 'https://linear.app/careers/product-engineer' }
  ],
  aiInsightText: "You saved 12 job opportunities this week with an average fit score of 92%. Your top high-value matches are concentrated in Remote React 19 / TypeScript roles. Recommended action: 3 applications have deadlines within 5 days."
};
