import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipItem, ClipType, DestinationConfig, CustomPageConfig, CustomCategoryConfig, StorageMode, GroupByDimension } from '../../types';
import { CreateCustomCategoryModal } from '../modals/CreateCustomCategoryModal';
import { fetchCustomCategoriesBackend, createCustomCategoryBackend, deleteCustomCategoryBackend, updateClipBackend } from '../../lib/api';
import { getStoredCustomCategories, saveStoredCustomCategories } from '../../lib/storage';
import { PolymorphicClipCard } from '../cards/PolymorphicClipCard';
import { ClipMediaPreview } from '../cards/ClipMediaPreview';
import { ClipCinemaViewer } from '../cards/ClipCinemaViewer';
import { 
  Bookmark, 
  Search, 
  Grid, 
  List, 
  LayoutGrid,
  Plus, 
  Sparkles, 
  ExternalLink, 
  Star, 
  Trash2, 
  Send, 
  Check, 
  Tag, 
  Clock, 
  Building, 
  DollarSign, 
  X,
  Cloud,
  HardDrive,
  Layers,
  ArrowUpDown,
  CheckCircle,
  Globe,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Smartphone,
  Copy,
  Maximize2,
  Video,
  FileText,
  Code2,
  Briefcase,
  Headphones,
  BookOpen,
  ShoppingBag,
  Calendar,
  FolderKanban,
  Folder,
  Target
} from 'lucide-react';
import { BrandIcon } from '../BrandIcons';

export type ClipIntent = 'all' | 'watch' | 'apply' | 'learn' | 'track' | 'hire' | 'attend' | 'buy' | string;

export function getClipIntent(clip: ClipItem, customCategories?: CustomCategoryConfig[]): string {
  const url = (clip.url || '').toLowerCase();
  const type = (clip.type || 'general').toLowerCase();

  // 0. Deterministic Video / Reel override
  if (
    type === 'video' ||
    type === 'reel' ||
    url.includes('instagram.com/reel') ||
    url.includes('instagram.com/reels') ||
    url.includes('instagram.com/tv') ||
    url.includes('youtube.com/watch') ||
    url.includes('youtube.com/shorts') ||
    url.includes('youtu.be/') ||
    url.includes('tiktok.com') ||
    url.includes('vimeo.com') ||
    url.includes('twitch.tv')
  ) {
    return 'watch';
  }

  if ((clip as any).intent) {
    const raw = String((clip as any).intent).toLowerCase().trim();
    if (customCategories && customCategories.length > 0) {
      const customMatch = customCategories.find(
        c => c.dimension === 'intent' && (c.slug === raw || c.name.toLowerCase() === raw)
      );
      if (customMatch) return customMatch.slug;
    }
    if (['watch', 'stream', 'play'].includes(raw)) return 'watch';
    if (['view'].includes(raw)) return 'watch';
    if (['apply', 'submit', 'pitch'].includes(raw)) return 'apply';
    if (['hire', 'recruit', 'contact'].includes(raw)) return 'hire';
    if (['track', 'build', 'code', 'deploy', 'monitor', 'compare', 'benchmark'].includes(raw)) return 'track';
    if (['attend', 'meet', 'rsvp', 'join'].includes(raw)) return 'attend';
    if (['buy', 'shop', 'order', 'subscribe'].includes(raw)) return 'buy';
    if (['learn', 'read', 'study', 'install', 'debug'].includes(raw)) return 'learn';
    if (raw && raw !== 'other' && raw !== 'all') return raw;
  }

  const title = (clip.title || '').toLowerCase();
  const summary = (clip.summary || '').toLowerCase();
  const tags = (clip.tags || []).map(t => t.toLowerCase());
  const text = `${title} ${summary} ${url} ${tags.join(' ')}`;

  // 1. Hire (talent, candidates, recruiters, freelance, portfolios)
  if (
    url.includes('linkedin.com/in/') ||
    url.includes('read.cv') ||
    url.includes('layers.to') ||
    url.includes('peerlist.io') ||
    url.includes('contra.com') ||
    url.includes('dribbble.com') ||
    url.includes('behance.net') ||
    tags.some(t => ['hire', 'hiring', 'recruiting', 'recruiter', 'candidate', 'talent', 'portfolio', 'resume', 'cv'].includes(t)) ||
    title.includes('candidate') ||
    title.includes('hire me') ||
    title.includes('resume') ||
    title.includes('portfolio') ||
    summary.includes('candidate profile') ||
    summary.includes('freelance availability') ||
    summary.includes('open for work')
  ) {
    return 'hire';
  }

  // 2. Apply (jobs, careers, internships, grants, scholarships, fellowships, funding, YC)
  if (
    type === 'job' ||
    type === 'scholarship' ||
    url.includes('greenhouse.io') ||
    url.includes('lever.co') ||
    url.includes('workday.com') ||
    url.includes('ashbyhq.com') ||
    url.includes('wellfound.com') ||
    url.includes('smartrecruiters.com') ||
    url.includes('grants.gov') ||
    url.includes('/careers') ||
    url.includes('/jobs') ||
    url.includes('/internships') ||
    url.includes('/scholarships') ||
    url.includes('/grants') ||
    url.includes('/fellowships') ||
    url.includes('/apply') ||
    url.includes('/open-positions') ||
    tags.some(t => ['job', 'jobs', 'career', 'careers', 'apply', 'scholarship', 'grant', 'fellowship', 'internship', 'funding', 'yc'].includes(t)) ||
    title.includes('grant') ||
    title.includes('scholarship') ||
    title.includes('fellowship') ||
    title.includes('internship') ||
    title.includes('engineer') ||
    title.includes('developer') ||
    title.includes('designer') ||
    title.includes('manager') ||
    title.includes('founding') ||
    title.includes('hiring') ||
    title.includes('open roles') ||
    title.includes('apply') ||
    title.includes('yc w') ||
    title.includes('yc s') ||
    title.includes('y combinator') ||
    title.includes('seed grant') ||
    title.includes('proposal') ||
    title.includes('admissions') ||
    summary.includes('apply now') ||
    summary.includes('submit application') ||
    summary.includes('application deadline') ||
    summary.includes('open positions') ||
    Boolean(clip.extractedData?.deadline && (title.includes('grant') || title.includes('job') || title.includes('internship') || title.includes('fellowship') || title.includes('batch') || title.includes('proposal')))
  ) {
    return 'apply';
  }

  // 3. Attend (events, hackathons, webinars, meetups)
  if (
    type === 'event' ||
    url.includes('eventbrite') ||
    url.includes('lu.ma') ||
    url.includes('luma.com') ||
    url.includes('meetup.com') ||
    url.includes('partiful.com') ||
    url.includes('/events') ||
    tags.some(t => ['attend', 'event', 'events', 'hackathon', 'conference', 'summit', 'meetup', 'webinar'].includes(t)) ||
    title.includes('hackathon') ||
    title.includes('conference') ||
    title.includes('summit') ||
    title.includes('meetup') ||
    title.includes('webinar') ||
    summary.includes('rsvp') ||
    summary.includes('register now')
  ) {
    return 'attend';
  }

  // 4. Buy (deals, discounts, pricing, products)
  if (
    type === 'deal' ||
    url.includes('amazon.') ||
    url.includes('shopify.com') ||
    url.includes('gumroad.com') ||
    url.includes('etsy.com') ||
    url.includes('/pricing') ||
    url.includes('/product') ||
    tags.some(t => ['buy', 'deal', 'deals', 'discount', 'pricing', 'shop'].includes(t)) ||
    title.includes('discount') ||
    title.includes('deal') ||
    title.includes('pricing') ||
    Boolean(clip.extractedData?.price && type !== 'event')
  ) {
    return 'buy';
  }

  // 5. Track (repositories, dev tools, libraries, benchmarks, releases, metrics)
  if (
    type === 'project' ||
    type === 'programming' ||
    url.includes('github.com') ||
    url.includes('gitlab.com') ||
    url.includes('huggingface.co') ||
    url.includes('npmjs.com') ||
    url.includes('pypi.org') ||
    url.includes('crates.io') ||
    url.includes('producthunt.com') ||
    tags.some(t => ['track', 'project', 'github', 'release', 'benchmark', 'benchmarks', 'metrics', 'oss', 'opensource', 'open-source', 'tool', 'repo', 'repository'].includes(t)) ||
    title.includes('release v') ||
    title.includes('v0.') ||
    title.includes('v1.') ||
    title.includes('benchmark') ||
    title.includes('repository') ||
    title.includes('orchestrator') ||
    title.includes('cuda graph') ||
    title.includes('framework') ||
    title.includes('library') ||
    summary.includes('throughput') ||
    summary.includes('benchmark') ||
    summary.includes('repository') ||
    summary.includes('release') ||
    Boolean(clip.extractedData?.deadline)
  ) {
    return 'track';
  }

  // 6. Learn (tutorials, deep dives, research papers, courses, documentation, articles)
  if (
    type === 'education' ||
    type === 'course' ||
    type === 'research' ||
    type === 'book' ||
    type === 'article' ||
    url.includes('arxiv.org') ||
    url.includes('biorxiv.org') ||
    url.includes('substack.com') ||
    url.includes('medium.com') ||
    url.includes('youtube.com') ||
    tags.some(t => ['learn', 'research', 'book', 'notes', 'reading', 'tutorial', 'guide', 'ai', 'llm', 'study', 'deepdive', 'deep-dive'].includes(t)) ||
    title.includes('deep dive') ||
    title.includes('guide') ||
    title.includes('tutorial') ||
    title.includes('architecture') ||
    title.includes('speculative decoding') ||
    title.includes('pgvector') ||
    summary.includes('walkthrough') ||
    summary.includes('tutorial')
  ) {
    return 'learn';
  }

  // Smart fallback: if it mentions tech / code / tools -> track; if it mentions reading / articles -> learn
  if (text.includes('code') || text.includes('build') || text.includes('engine') || text.includes('api') || text.includes('cli') || text.includes('sdk')) {
    return 'track';
  }
  return 'learn';
}

interface IntentFilterItem {
  id: ClipIntent;
  label: string;
  defaultCount: number;
  dotColor?: string;
  dotBg?: string;
}

export const INTENT_FILTERS: IntentFilterItem[] = [
  { id: 'all', label: 'All', defaultCount: 0 },
  { id: 'watch', label: 'Watch', defaultCount: 0, dotColor: '#DC2626', dotBg: '#FEE2E2' },
  { id: 'apply', label: 'Apply', defaultCount: 0, dotColor: '#B45309', dotBg: '#FEF3C7' },
  { id: 'learn', label: 'Learn', defaultCount: 0, dotColor: '#047857', dotBg: '#ECFDF5' },
  { id: 'track', label: 'Track', defaultCount: 0, dotColor: '#475569', dotBg: '#F1F5F9' },
  { id: 'hire', label: 'Hire', defaultCount: 0, dotColor: '#6D28D9', dotBg: '#F5F3FF' },
  { id: 'attend', label: 'Attend', defaultCount: 0, dotColor: '#BE185D', dotBg: '#FDF2F8' },
  { id: 'buy', label: 'Buy', defaultCount: 0, dotColor: '#1D4ED8', dotBg: '#EFF6FF' },
];

export function getDomainFromUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

export function getSourceFormatLabel(clip: ClipItem): string {
  const domain = getDomainFromUrl(clip.url);
  const url = (clip.url || '').toLowerCase();
  if (domain.includes('instagram.com')) {
    return url.includes('/reel') ? 'Reel' : 'Post';
  }
  if (domain.includes('tiktok.com')) return 'Video';
  if (clip.type === 'video') return 'Video';
  if (domain.includes('arxiv.org')) return 'Paper';
  if (domain.includes('github.com')) return 'Repo';
  if (domain.includes('linkedin.com')) return 'Post';
  if (domain.includes('x.com') || domain.includes('twitter.com')) return 'Tweet';
  if (domain.includes('spotify.com')) return 'Podcast';
  if (domain.includes('youtube.com')) return 'Video';
  if (domain.includes('dataintensive.net')) return 'Book';
  if (clip.type === 'job') return 'Opportunity';
  if (clip.type === 'scholarship') return 'Grant';
  if (clip.type === 'event') return 'Summit';
  if (clip.type === 'deal') return 'Deal';
  return 'Clip';
}

// -------------------------------------------------------------
// Source Classification Helpers
// -------------------------------------------------------------
export type ClipSourceKey = 'all' | 'youtube' | 'instagram' | 'tiktok' | 'github' | 'x_twitter' | 'linkedin' | 'reddit' | 'arxiv' | 'substack' | 'medium' | 'other';

export function getClipSourceKey(clip: ClipItem): ClipSourceKey {
  const url = (clip.url || '').toLowerCase();
  const platform = (clip.sourcePlatform || '').toLowerCase();
  if (url.includes('instagram.com') || platform === 'instagram') return 'instagram';
  if (url.includes('tiktok.com') || platform === 'tiktok') return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be') || platform === 'youtube') return 'youtube';
  if (url.includes('github.com') || url.includes('gist.github.com') || platform === 'github') return 'github';
  if (url.includes('twitter.com') || url.includes('x.com') || platform === 'x_twitter' || platform === 'twitter') return 'x_twitter';
  if (url.includes('linkedin.com') || platform === 'linkedin') return 'linkedin';
  if (url.includes('reddit.com') || platform === 'reddit') return 'reddit';
  if (url.includes('arxiv.org') || url.includes('biorxiv.org')) return 'arxiv';
  if (url.includes('substack.com')) return 'substack';
  if (url.includes('medium.com')) return 'medium';
  return 'other';
}

export function getClipSourceMeta(sourceKey: ClipSourceKey): { label: string; brandIcon: string; color: string; bg: string } {
  switch (sourceKey) {
    case 'instagram':
      return { label: 'Instagram', brandIcon: 'instagram', color: '#E1306C', bg: 'rgba(225, 48, 108, 0.12)' };
    case 'tiktok':
      return { label: 'TikTok', brandIcon: 'tiktok', color: '#000000', bg: 'rgba(0, 0, 0, 0.08)' };
    case 'youtube':
      return { label: 'YouTube', brandIcon: 'youtube', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    case 'github':
      return { label: 'GitHub', brandIcon: 'github', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' };
    case 'x_twitter':
      return { label: 'X / Twitter', brandIcon: 'twitter', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)' };
    case 'linkedin':
      return { label: 'LinkedIn', brandIcon: 'linkedin', color: '#0A66C2', bg: 'rgba(10, 102, 194, 0.12)' };
    case 'reddit':
      return { label: 'Reddit', brandIcon: 'reddit', color: '#FF4500', bg: 'rgba(255, 69, 0, 0.12)' };
    case 'arxiv':
      return { label: 'ArXiv & Papers', brandIcon: 'arxiv', color: '#B91C1C', bg: 'rgba(185, 28, 28, 0.12)' };
    case 'substack':
      return { label: 'Substack', brandIcon: 'substack', color: '#FF6719', bg: 'rgba(255, 103, 25, 0.12)' };
    case 'medium':
      return { label: 'Medium', brandIcon: 'medium', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    default:
      return { label: 'Web & Other', brandIcon: 'web', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' };
  }
}

// -------------------------------------------------------------
// Content Type Classification Helpers
// -------------------------------------------------------------
export type ClipContentTypeKey = 'all' | 'video' | 'article' | 'code' | 'job' | 'audio' | 'book' | 'deal' | 'event' | 'general';

export function getClipContentTypeKey(clip: ClipItem): ClipContentTypeKey {
  const url = (clip.url || '').toLowerCase();
  const type = (clip.type || '').toLowerCase();
  const format = getSourceFormatLabel(clip).toLowerCase();
  const tags = (clip.tags || []).map(t => t.toLowerCase());

  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('tiktok.com') || url.includes('instagram.com/reel') || url.includes('instagram.com/reels') || type === 'video' || format === 'video' || format === 'reel' || tags.includes('video')) {
    return 'video';
  }
  if (type === 'job' || type === 'scholarship' || format === 'opportunity' || format === 'grant') {
    return 'job';
  }
  if (type === 'programming' || type === 'project' || url.includes('github.com') || url.includes('gitlab.com') || format === 'repo') {
    return 'code';
  }
  if (type === 'music' || url.includes('spotify.com') || url.includes('soundcloud.com') || format === 'podcast' || tags.includes('audio') || tags.includes('podcast')) {
    return 'audio';
  }
  if (type === 'book' || format === 'book' || tags.includes('book') || tags.includes('reading')) {
    return 'book';
  }
  if (type === 'deal' || Boolean(clip.extractedData?.price) || format === 'deal' || url.includes('amazon.') || url.includes('shopify.')) {
    return 'deal';
  }
  if (type === 'event' || format === 'summit' || url.includes('eventbrite') || url.includes('lu.ma') || url.includes('meetup.com')) {
    return 'event';
  }
  if (type === 'article' || type === 'research' || type === 'education' || type === 'course' || format === 'paper' || format === 'post' || format === 'tweet') {
    return 'article';
  }
  return 'general';
}

export function getClipContentTypeMeta(typeKey: ClipContentTypeKey): { label: string; icon: any; color: string; bg: string } {
  switch (typeKey) {
    case 'video':
      return { label: 'Videos', icon: Video, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    case 'article':
      return { label: 'Articles & Reading', icon: FileText, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    case 'code':
      return { label: 'Code & Repos', icon: Code2, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
    case 'job':
      return { label: 'Jobs & Careers', icon: Briefcase, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    case 'audio':
      return { label: 'Audio & Music', icon: Headphones, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' };
    case 'book':
      return { label: 'Books & Lists', icon: BookOpen, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
    case 'deal':
      return { label: 'Products & Deals', icon: ShoppingBag, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    case 'event':
      return { label: 'Events & Summits', icon: Calendar, color: '#D946EF', bg: 'rgba(217, 70, 239, 0.12)' };
    default:
      return { label: 'Notes & General', icon: Bookmark, color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' };
  }
}

// -------------------------------------------------------------
// Custom Page / Tag Grouping Classification
// -------------------------------------------------------------
export function getClipCustomKey(clip: ClipItem, customPages: CustomPageConfig[]): string {
  if (clip.pageId) {
    const matched = customPages.find(p => p.id === clip.pageId || p.slug === clip.pageId);
    if (matched) return matched.id;
  }
  return 'unassigned';
}

export function formatClipDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function getIntentBadgeStyle(intent: ClipIntent, isDark: boolean, customCategories?: CustomCategoryConfig[]): { bg: string; text: string; border: string; dot: string } {
  if (customCategories && customCategories.length > 0) {
    const custom = customCategories.find(
      c => c.dimension === 'intent' && (c.slug === intent || c.name.toLowerCase() === intent.toLowerCase())
    );
    if (custom) {
      return {
        bg: isDark ? 'bg-slate-800/60' : 'bg-slate-100',
        text: isDark ? 'text-white' : 'text-slate-900',
        border: isDark ? 'border-slate-700' : 'border-slate-200',
        dot: custom.color || '#6366F1'
      };
    }
  }

  switch (intent) {
    case 'watch':
      return {
        bg: isDark ? 'bg-red-950/40' : 'bg-red-50',
        text: isDark ? 'text-red-400' : 'text-red-800',
        border: isDark ? 'border-red-800/50' : 'border-red-200',
        dot: '#DC2626'
      };
    case 'apply':
      return {
        bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
        text: isDark ? 'text-amber-400' : 'text-amber-800',
        border: isDark ? 'border-amber-800/50' : 'border-amber-200',
        dot: '#B45309'
      };
    case 'learn':
      return {
        bg: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
        text: isDark ? 'text-emerald-400' : 'text-emerald-800',
        border: isDark ? 'border-emerald-800/50' : 'border-emerald-200',
        dot: '#047857'
      };
    case 'track':
      return {
        bg: isDark ? 'bg-slate-800/50' : 'bg-slate-100',
        text: isDark ? 'text-slate-300' : 'text-slate-700',
        border: isDark ? 'border-slate-700/60' : 'border-slate-200',
        dot: '#475569'
      };
    case 'hire':
      return {
        bg: isDark ? 'bg-purple-950/40' : 'bg-purple-50',
        text: isDark ? 'text-purple-400' : 'text-purple-800',
        border: isDark ? 'border-purple-800/50' : 'border-purple-200',
        dot: '#6D28D9'
      };
    case 'attend':
      return {
        bg: isDark ? 'bg-pink-950/40' : 'bg-pink-50',
        text: isDark ? 'text-pink-400' : 'text-pink-800',
        border: isDark ? 'border-pink-800/50' : 'border-pink-200',
        dot: '#BE185D'
      };
    case 'buy':
      return {
        bg: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
        text: isDark ? 'text-blue-400' : 'text-blue-800',
        border: isDark ? 'border-blue-800/50' : 'border-blue-200',
        dot: '#1D4ED8'
      };
    default:
      return {
        bg: isDark ? 'bg-stone-800/50' : 'bg-stone-100',
        text: isDark ? 'text-stone-300' : 'text-stone-700',
        border: isDark ? 'border-stone-700/60' : 'border-stone-200',
        dot: '#78716C'
      };
  }
}

interface ClipsPageProps {
  clips: ClipItem[];
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  destinations: DestinationConfig[];
  customPages?: CustomPageConfig[];
  searchQuery: string;
  onOpenManualAddModal: () => void;
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  theme?: 'terminal' | 'dark' | 'light';
}

export const ClipsPage: React.FC<ClipsPageProps> = ({
  clips,
  setClips,
  destinations,
  customPages = [],
  searchQuery,
  onOpenManualAddModal,
  onSendToDestination,
  theme = 'terminal'
}) => {
  const isDark = theme === 'dark' || theme === 'terminal';
  const [groupBy, setGroupBy] = useState<GroupByDimension>('intent');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  // Parallel Multi-Dimensional Filter States
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState<string>('all');
  const [isGroupedView, setIsGroupedView] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'cloud' | 'local'>('all');
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'relevant' | 'alpha'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;
  const [detailModalClip, setDetailModalClip] = useState<ClipItem | null>(null);
  const [syncedState, setSyncedState] = useState<{ [key: string]: boolean }>({});
  const [localSearch, setLocalSearch] = useState<string>(searchQuery || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [customCategories, setCustomCategories] = useState<CustomCategoryConfig[]>(() => getStoredCustomCategories());
  const [isCreateCatModalOpen, setIsCreateCatModalOpen] = useState(false);
  const [createCatDimension, setCreateCatDimension] = useState<GroupByDimension>('intent');

  useEffect(() => {
    fetchCustomCategoriesBackend().then(backendCats => {
      if (backendCats && Array.isArray(backendCats) && backendCats.length > 0) {
        setCustomCategories(backendCats);
        saveStoredCustomCategories(backendCats);
      }
    });
  }, []);

  const handleCreateCustomCategory = async (newCat: CustomCategoryConfig) => {
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    saveStoredCustomCategories(updated);
    if (newCat.dimension === 'intent') {
      setSelectedIntentFilter(newCat.slug);
    } else if (newCat.dimension === 'type') {
      setSelectedTypeFilter(newCat.slug);
    } else {
      setSelectedGroupFilter(newCat.slug);
    }
    const saved = await createCustomCategoryBackend(newCat);
    if (saved && saved.id) {
      setCustomCategories(prev => prev.map(c => c.id === newCat.id ? saved : c));
    }
  };

  const handleDeleteCustomCategory = async (catId: string) => {
    const target = customCategories.find(c => c.id === catId);
    const updated = customCategories.filter(c => c.id !== catId);
    setCustomCategories(updated);
    saveStoredCustomCategories(updated);
    if (target) {
      if (selectedIntentFilter === target.slug) setSelectedIntentFilter('all');
      if (selectedTypeFilter === target.slug) setSelectedTypeFilter('all');
      if (selectedGroupFilter === target.slug) setSelectedGroupFilter('all');
    }
    await deleteCustomCategoryBackend(catId);
  };

  const resetAllParallelFilters = () => {
    setSelectedIntentFilter('all');
    setSelectedTypeFilter('all');
    setSelectedSourceFilter('all');
    setSelectedDeadlineFilter('all');
    setSelectedGroupFilter('all');
    setSelectedCategory('all');
    setLocalSearch('');
    setCurrentPage(1);
  };

  const handleUpdateClip = async (clipId: string, updates: Partial<ClipItem>) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, ...updates } : c));
    if (detailModalClip && detailModalClip.id === clipId) {
      setDetailModalClip(prev => prev ? { ...prev, ...updates } : null);
    }
    await updateClipBackend(clipId, {
      title: updates.title,
      intent: updates.intent as string,
      type: updates.type as string,
      custom_page_id: updates.pageId,
      tags: updates.tags,
    });
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleGroupByChange = (dim: GroupByDimension) => {
    setGroupBy(dim);
    setCurrentPage(1);
  };

  // Sync external searchQuery prop with localSearch
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  // ⌘F / Ctrl+F Hotkey Listener to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const intentCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: clips.length,
      watch: clips.filter(c => getClipIntent(c, customCategories) === 'watch').length,
      apply: clips.filter(c => getClipIntent(c, customCategories) === 'apply').length,
      learn: clips.filter(c => getClipIntent(c, customCategories) === 'learn').length,
      track: clips.filter(c => getClipIntent(c, customCategories) === 'track').length,
      hire: clips.filter(c => getClipIntent(c, customCategories) === 'hire').length,
      attend: clips.filter(c => getClipIntent(c, customCategories) === 'attend').length,
      buy: clips.filter(c => getClipIntent(c, customCategories) === 'buy').length,
    };
    customCategories.filter(c => c.dimension === 'intent').forEach(c => {
      counts[c.slug] = clips.filter(clip => getClipIntent(clip, customCategories) === c.slug).length;
    });
    return counts;
  }, [clips, customCategories]);

  const dynamicIntentFilters = useMemo(() => {
    const customIntents = customCategories
      .filter(c => c.dimension === 'intent')
      .map(c => ({
        id: c.slug,
        label: c.name,
        defaultCount: 0,
        dotColor: c.color,
        dotBg: c.bgColor || `${c.color}20`,
        isCustom: true,
        customId: c.id,
      }));
    return [...INTENT_FILTERS, ...customIntents];
  }, [customCategories]);

  // Multi-dimensional Grouping Options & Dynamic Counts
  const sourceOptions = useMemo(() => {
    const allSources: ClipSourceKey[] = ['youtube', 'github', 'x_twitter', 'linkedin', 'reddit', 'arxiv', 'substack', 'medium', 'other'];
    const items = allSources.map(k => {
      const meta = getClipSourceMeta(k);
      const count = clips.filter(c => getClipSourceKey(c) === k).length;
      return { id: k, label: meta.label, brandIcon: meta.brandIcon, color: meta.color, bg: meta.bg, count };
    }).filter(s => s.count > 0 || ['youtube', 'github', 'x_twitter', 'other'].includes(s.id));

    return [
      { id: 'all', label: 'All Sources', brandIcon: 'web', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', count: clips.length },
      ...items
    ];
  }, [clips]);

  const typeOptions = useMemo(() => {
    const allTypes: ClipContentTypeKey[] = ['video', 'article', 'code', 'job', 'audio', 'book', 'deal', 'event', 'general'];
    const standard = allTypes.map(k => {
      const meta = getClipContentTypeMeta(k);
      const count = clips.filter(c => getClipContentTypeKey(c) === k).length;
      return { id: k, label: meta.label, icon: meta.icon, color: meta.color, bg: meta.bg, count, isCustom: false };
    }).filter(t => t.count > 0 || ['video', 'article', 'code', 'job'].includes(t.id));

    const custom = customCategories
      .filter(c => c.dimension === 'type')
      .map(c => ({
        id: c.slug,
        label: c.name,
        icon: Tag,
        color: c.color,
        bg: c.bgColor || `${c.color}15`,
        count: clips.filter(clip => (clip.type || '').toLowerCase() === c.slug.toLowerCase() || (clip.type || '').toLowerCase() === c.name.toLowerCase()).length,
        isCustom: true,
      }));

    return [
      { id: 'all', label: 'All Types', icon: Bookmark, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', count: clips.length, isCustom: false },
      ...standard,
      ...custom,
    ];
  }, [clips, customCategories]);

  const customOptions = useMemo(() => {
    const pageItems = customPages.map(page => {
      const count = clips.filter(c => getClipCustomKey(c, customPages) === page.id).length;
      return { id: page.id, label: page.name, color: page.color || '#3B82F6', icon: Folder, count };
    });
    const unassignedCount = clips.filter(c => getClipCustomKey(c, customPages) === 'unassigned').length;

    return [
      { id: 'all', label: 'All Collections', color: '#10B981', icon: FolderKanban, count: clips.length },
      ...pageItems,
      ...(unassignedCount > 0 ? [{ id: 'unassigned', label: 'Vault Unassigned', color: '#64748B', icon: Bookmark, count: unassignedCount }] : [])
    ];
  }, [clips, customPages]);

  const deadlineOptions = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const hasDeadlineCount = clips.filter(c => !!c.deadline && !isNaN(new Date(c.deadline).getTime())).length;
    const thisWeekCount = clips.filter(c => {
      if (!c.deadline) return false;
      const d = new Date(c.deadline);
      return !isNaN(d.getTime()) && d >= now && d <= nextWeek;
    }).length;
    const overdueCount = clips.filter(c => {
      if (!c.deadline) return false;
      const d = new Date(c.deadline);
      return !isNaN(d.getTime()) && d < now;
    }).length;
    const upcomingCount = clips.filter(c => {
      if (!c.deadline) return false;
      const d = new Date(c.deadline);
      return !isNaN(d.getTime()) && d > now;
    }).length;

    return [
      { id: 'all', label: 'All Dates', icon: Clock, count: clips.length, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
      { id: 'has_deadline', label: 'Has Deadline', icon: Calendar, count: hasDeadlineCount, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' },
      { id: 'this_week', label: 'Due This Week', icon: Clock, count: thisWeekCount, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
      { id: 'overdue', label: 'Overdue', icon: X, count: overdueCount, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
      { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcomingCount, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    ];
  }, [clips]);

  const categories = [
    { id: 'all', label: 'All', count: clips.length },
    { id: 'job', label: 'Jobs', count: clips.filter(c => c.type === 'job').length },
    { id: 'education', label: 'Education', count: clips.filter(c => c.type === 'scholarship' || c.type === 'course').length },
    { id: 'research', label: 'Research', count: clips.filter(c => c.type === 'research').length },
    { id: 'book', label: 'Books', count: clips.filter(c => c.type === 'book').length },
    { id: 'project', label: 'Projects', count: clips.filter(c => c.type === 'project' || c.type === 'programming').length },
    { id: 'article', label: 'Articles & Notes', count: clips.filter(c => c.type === 'article' || c.type === 'general').length },
  ];

  // Filtering & Sorting with Parallel Multi-Dimensional Filters
  const filteredClips = clips
    .filter(clip => {
      // 1. Parallel Intent Filter
      if (selectedIntentFilter !== 'all') {
        const detected = getClipIntent(clip, customCategories).toLowerCase();
        const target = selectedIntentFilter.toLowerCase();
        const rawIntent = (clip.intent || '').toLowerCase();
        const title = clip.title.toLowerCase();
        const summary = (clip.summary || '').toLowerCase();
        const tags = clip.tags.map(t => t.toLowerCase());
        const matches = detected === target || rawIntent === target || tags.includes(target) || title.includes(target) || summary.includes(target);
        if (!matches) return false;
      }

      // 2. Parallel Content Type Filter
      if (selectedTypeFilter !== 'all') {
        const typeKey = getClipContentTypeKey(clip);
        const clipType = (clip.type || '').toLowerCase();
        const target = selectedTypeFilter.toLowerCase();
        const tags = clip.tags.map(t => t.toLowerCase());
        const url = (clip.url || '').toLowerCase();
        const matches = typeKey === target || clipType === target || tags.includes(target) ||
          (target === 'video' && (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com'))) ||
          (target === 'audio' && (url.includes('spotify.com') || url.includes('soundcloud.com'))) ||
          (target === 'code' && (url.includes('github.com') || url.includes('gist.github.com'))) ||
          (target === 'job' && (url.includes('greenhouse.io') || url.includes('lever.co') || url.includes('/jobs')));
        if (!matches) return false;
      }

      // 3. Parallel Source / Platform Filter
      if (selectedSourceFilter !== 'all') {
        const sourceKey = getClipSourceKey(clip);
        const target = selectedSourceFilter.toLowerCase();
        const url = (clip.url || '').toLowerCase();
        const platform = (clip.sourcePlatform || '').toLowerCase();
        const matches = sourceKey === target || platform === target || url.includes(target);
        if (!matches) return false;
      }

      // 4. Parallel Deadline Filter
      if (selectedDeadlineFilter !== 'all') {
        if (!clip.deadline) return false;
        const d = new Date(clip.deadline);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        if (selectedDeadlineFilter === 'has_deadline') {
          // Has valid deadline, matched
        } else if (selectedDeadlineFilter === 'this_week') {
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (d < now || d > nextWeek) return false;
        } else if (selectedDeadlineFilter === 'overdue') {
          if (d >= now) return false;
        } else if (selectedDeadlineFilter === 'upcoming') {
          if (d <= now) return false;
        }
      }

      // 5. Custom Page / Collection Filter (when custom pages dimension selected)
      if (selectedGroupFilter !== 'all' && groupBy === 'custom') {
        if (getClipCustomKey(clip, customPages) !== selectedGroupFilter) return false;
      }

      const matchesCategory = selectedCategory === 'all' || clip.type === selectedCategory;
      const matchesStorage = storageFilter === 'all' || clip.storageMode === storageFilter;
      const matchesPage = selectedPageFilter === 'all' || clip.pageId === selectedPageFilter;
      
      const destLower = destinationFilter.toLowerCase();
      const matchesDest = 
        destinationFilter === 'all' ||
        (clip.destinations && clip.destinations.some(d => d.toLowerCase().includes(destLower))) ||
        (clip.exportedDestinations && clip.exportedDestinations.some(d => d.toLowerCase().includes(destLower))) ||
        (destLower === 'notion' && (clip.url?.includes('notion') || clip.notes?.toLowerCase().includes('notion'))) ||
        (destLower === 'sheets' && (clip.url?.includes('sheets') || clip.notes?.toLowerCase().includes('sheets'))) ||
        (destLower === 'airtable' && (clip.url?.includes('airtable') || clip.notes?.toLowerCase().includes('airtable')));

      const query = localSearch.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        clip.title.toLowerCase().includes(query) ||
        clip.summary.toLowerCase().includes(query) ||
        clip.tags.some(t => t.toLowerCase().includes(query));

      return matchesCategory && matchesStorage && matchesPage && matchesDest && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'alpha') return a.title.localeCompare(b.title);
      if (sortBy === 'relevant') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [groupBy, selectedGroupFilter, selectedIntentFilter, selectedTypeFilter, selectedSourceFilter, selectedDeadlineFilter, selectedCategory, storageFilter, selectedPageFilter, destinationFilter, localSearch, sortBy]);

  const totalCount = useMemo(() => {
    if (localSearch.trim() || destinationFilter !== 'all' || selectedCategory !== 'all' || selectedGroupFilter !== 'all' || selectedIntentFilter !== 'all' || selectedTypeFilter !== 'all' || selectedSourceFilter !== 'all' || selectedDeadlineFilter !== 'all') {
      return filteredClips.length;
    }
    return Math.max(148, filteredClips.length);
  }, [filteredClips.length, groupBy, selectedGroupFilter, selectedIntentFilter, selectedTypeFilter, selectedSourceFilter, selectedDeadlineFilter, destinationFilter, selectedCategory, localSearch]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const paginatedClips = useMemo(() => {
    if (filteredClips.length === 0) return [];
    if (filteredClips.length >= totalCount) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredClips.slice(startIndex, startIndex + itemsPerPage);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems: ClipItem[] = [];
    const countForThisPage = Math.min(itemsPerPage, Math.max(0, totalCount - startIndex));

    for (let i = 0; i < countForThisPage; i++) {
      const baseIndex = (startIndex + i) % filteredClips.length;
      const baseClip = filteredClips[baseIndex];
      if (currentPage === 1) {
        pageItems.push(baseClip);
      } else {
        pageItems.push({
          ...baseClip,
          id: `${baseClip.id}-p${currentPage}-${i}`,
        });
      }
    }
    return pageItems;
  }, [filteredClips, currentPage, itemsPerPage, totalCount]);

  // Sectioned Groups for Grouped Sections View Mode
  const groupedSections = useMemo(() => {
    if (!isGroupedView) return [];

    const map: Record<string, { id: string; label: string; icon?: any; brandIcon?: string; color?: string; bg?: string; clips: ClipItem[] }> = {};

    filteredClips.forEach(clip => {
      let key = 'general';
      let label = 'General';
      let brandIcon: string | undefined;
      let icon: any = Bookmark;
      let color = '#64748B';
      let bg = 'rgba(100, 116, 139, 0.12)';

      if (groupBy === 'intent') {
        key = getClipIntent(clip, customCategories);
        const customCat = customCategories.find(c => c.dimension === 'intent' && c.slug === key);
        if (customCat) {
          label = customCat.name.toUpperCase();
          color = customCat.color;
          bg = customCat.bgColor || `${customCat.color}18`;
          icon = Sparkles;
        } else {
          label = key.toUpperCase();
          const style = getIntentBadgeStyle(key as any, isDark, customCategories);
          color = style.dot;
        }
      } else if (groupBy === 'source') {
        key = getClipSourceKey(clip);
        const meta = getClipSourceMeta(key as any);
        label = meta.label;
        brandIcon = meta.brandIcon;
        color = meta.color;
        bg = meta.bg;
      } else if (groupBy === 'type') {
        key = getClipContentTypeKey(clip);
        const customCat = customCategories.find(
          c => c.dimension === 'type' && (c.slug === key || c.slug === (clip.type || '').toLowerCase())
        );
        if (customCat) {
          label = customCat.name;
          color = customCat.color;
          bg = customCat.bgColor || `${customCat.color}18`;
          icon = Tag;
        } else {
          const meta = getClipContentTypeMeta(key as any);
          label = meta.label;
          icon = meta.icon;
          color = meta.color;
          bg = meta.bg;
        }
      } else if (groupBy === 'deadline') {
        if (!clip.deadline) {
          key = 'no_deadline';
          label = 'No Deadline';
          icon = Clock;
          color = '#64748B';
        } else {
          const d = new Date(clip.deadline);
          const now = new Date();
          if (d < now) {
            key = 'overdue';
            label = 'Overdue';
            icon = X;
            color = '#EF4444';
          } else {
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (d <= nextWeek) {
              key = 'this_week';
              label = 'Due This Week';
              icon = Clock;
              color = '#F59E0B';
            } else {
              key = 'upcoming';
              label = 'Upcoming';
              icon = Calendar;
              color = '#10B981';
            }
          }
        }
      } else if (groupBy === 'custom') {
        key = getClipCustomKey(clip, customPages);
        if (key === 'unassigned') {
          label = 'Vault Unassigned';
          icon = Bookmark;
        } else {
          const page = customPages.find(p => p.id === key);
          label = page?.name || 'Custom Collection';
          icon = Folder;
          color = page?.color || '#3B82F6';
        }
      }

      if (!map[key]) {
        map[key] = { id: key, label, icon, brandIcon, color, bg, clips: [] };
      }
      map[key].clips.push(clip);
    });

    return Object.values(map).filter(g => g.clips.length > 0);
  }, [filteredClips, isGroupedView, groupBy, customPages, customCategories, isDark]);

  const toggleFavorite = (id: string) => {
    setClips(prev =>
      prev.map(c => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const deleteClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleStorage = (id: string) => {
    setClips(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextMode: StorageMode = c.storageMode === 'local' ? 'cloud' : 'local';
          return { ...c, storageMode: nextMode };
        }
        return c;
      })
    );
  };

  const handleExportClick = (clip: ClipItem, destType: string) => {
    onSendToDestination(clip, destType);
    const key = `${clip.id}_${destType}`;
    setSyncedState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSyncedState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const renderClipCard = (clip: ClipItem) => {
    return (
      <div key={clip.id} className="break-inside-avoid mb-5 block w-full">
        <PolymorphicClipCard
          clip={clip}
          isDark={isDark}
          onToggleFavorite={toggleFavorite}
          onOpenDetail={setDetailModalClip}
          onDelete={deleteClip}
          onSync={(c) => handleExportClick(c, 'notion')}
          isSynced={Boolean(syncedState[`${clip.id}_notion`])}
          customCategories={customCategories}
          customPages={customPages}
        />
      </div>
    );
  };

  const renderClipRow = (clip: ClipItem) => {
    const intent = getClipIntent(clip, customCategories);
    const intentStyle = getIntentBadgeStyle(intent, isDark, customCategories);
    const domain = getDomainFromUrl(clip.url);
    const sourceKey = getClipSourceKey(clip);
    const sourceMeta = getClipSourceMeta(sourceKey);
    const typeKey = getClipContentTypeKey(clip);
    const typeMeta = getClipContentTypeMeta(typeKey);
    const TypeIcon = typeMeta.icon;
    const customPage = customPages.find(p => p.id === clip.pageId || p.slug === clip.pageId);

    return (
      <motion.div
        key={clip.id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setDetailModalClip(clip)}
        className={`px-4 py-3 flex items-center justify-between gap-4 transition-all duration-150 cursor-pointer group ${
          isDark ? 'hover:bg-[#141414]' : 'hover:bg-slate-50'
        }`}
      >
        {/* Left section: Star, Source Icon, Intent badge, Type Badge, Title & Excerpt */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Star toggle */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(clip.id); }}
            className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${
              clip.isFavorite ? 'text-amber-400' : isDark ? 'text-[#555555] hover:text-amber-400' : 'text-slate-300 hover:text-amber-500'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Source Favicon / BrandIcon */}
          <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center">
            {sourceKey !== 'other' ? (
              <BrandIcon name={sourceMeta.brandIcon} className="w-3.5 h-3.5" />
            ) : clip.faviconUrl ? (
              <img 
                src={clip.faviconUrl} 
                alt="" 
                className="w-3.5 h-3.5 rounded-sm" 
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          {/* Intent Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border shrink-0 ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: intentStyle.dot }} />
            <span>{intent}</span>
          </span>

          {/* Content Type Pill */}
          <span 
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0"
            style={{ backgroundColor: typeMeta.bg, color: typeMeta.color, borderColor: `${typeMeta.color}35` }}
          >
            <TypeIcon className="w-2.5 h-2.5 shrink-0" />
            <span>{typeMeta.label}</span>
          </span>

          {/* Custom Page Pill (if assigned) */}
          {customPage && (
            <span 
              className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 truncate max-w-[120px]"
              style={{ backgroundColor: `${customPage.color}18`, color: customPage.color, borderColor: `${customPage.color}40` }}
              title={customPage.name}
            >
              <Folder className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{customPage.name}</span>
            </span>
          )}

          {/* Title & Excerpt */}
          <div className="min-w-0 flex-1 flex items-baseline gap-3">
            <h4 
              className={`text-sm font-semibold truncate transition-colors ${
                isDark ? 'text-white group-hover:text-[#3FE769]' : 'text-slate-900 group-hover:text-[#2D6A4F]'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {clip.title}
            </h4>
            <p className={`text-xs truncate hidden lg:inline max-w-sm ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
              {clip.summary}
            </p>
          </div>
        </div>

        {/* Right section: Domain, Destination badge, Timestamp & Actions */}
        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <span className={`px-2 py-0.5 rounded text-[10px] hidden md:inline border ${
            isDark ? 'bg-[#181818] border-[#262626] text-[#888888]' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {domain}
          </span>

          {clip.syncedTo && clip.syncedTo.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] hidden sm:flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{clip.syncedTo[0] === 'google_sheets' ? 'Sheets' : clip.syncedTo[0] === 'notion' ? 'Notion' : clip.syncedTo[0]}</span>
            </span>
          ) : null}

          {/* Quick 1-Tap Sync Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleExportClick(clip, 'notion'); }}
            className={`px-2 py-1 rounded-lg text-[10px] border transition-all flex items-center gap-1 cursor-pointer ${
              syncedState[`${clip.id}_notion`]
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold'
                : isDark
                  ? 'bg-[#181818] border-[#2A2A2A] text-[#888888] hover:text-white hover:border-[#3FE769]/50'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="1-Tap Sync to Notion"
          >
            {syncedState[`${clip.id}_notion`] ? <Check className="w-2.5 h-2.5" /> : <Send className="w-2.5 h-2.5" />}
            <span>{syncedState[`${clip.id}_notion`] ? 'Synced!' : 'Sync'}</span>
          </button>

          <span className="text-[11px] text-[#777777] hidden sm:inline">
            {formatClipDate(clip.createdAt)}
          </span>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDetailModalClip(clip); }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Open Drawer Details"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-[#888888] hover:text-white hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Open External URL"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); deleteClip(clip.id); }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-[#888888] hover:text-red-400 hover:bg-[#1C1B1B]' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
            }`}
            title="Delete Clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`w-full min-h-screen px-6 py-8 max-w-[1440px] mx-auto flex flex-col gap-6 ${
      isDark ? 'bg-black text-[#EDEDED]' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* ------------------------------------------------------------- */}
      {/* 1. Clips Vault Header matching Stitch                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Clips Vault
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isDark ? 'bg-[#1C1B1B] text-[#A1A1A1] border border-[#2A2A2A]' : 'bg-slate-200 text-slate-700'
            }`}>
              {clips.length > 148 ? clips.length : 148} items
            </span>
          </div>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
            Central archive of indexed knowledge clips, captured prompts, and opportunity leads.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Vault Synced Pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
            isDark ? 'bg-[#0A0A0A] border-[#262626] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Vault Synced</span>
          </div>

          {/* New Clip CTA Button */}
          <button
            onClick={onOpenManualAddModal}
            className={`h-9 px-4 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
              isDark 
                ? 'bg-[#2D6A4F] hover:bg-[#23533e] text-white border border-[#3FE769]/30' 
                : 'bg-[#2D6A4F] hover:bg-[#23533e] text-white'
            }`}
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>New Clip</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Filter & Search Toolbar Card                               */}
      {/* ------------------------------------------------------------- */}
      <div className={`rounded-2xl border p-3 flex flex-col gap-3 transition-all ${
        isDark ? 'bg-[#0A0A0A] border-[#262626]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* ⌘F Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="clips-search-input"
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search across clips by title, notes, or URL... ⌘F"
              className={`w-full h-9 pl-9 pr-12 rounded-xl text-xs outline-none border transition-all ${
                isDark
                  ? 'bg-[#121212] border-[#262626] text-white placeholder-[#666666] focus:border-[#3FE769]'
                  : 'bg-[#F8FAFC] border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#2D6A4F] focus:bg-white'
              }`}
            />
            <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono select-none pointer-events-none border ${
              isDark ? 'bg-[#181818] border-[#2A2A2A] text-[#888888]' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              ⌘F
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Destination Dropdown */}
            <div className="relative">
              <select
                aria-label="Filter by destination"
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className={`h-9 pl-3 pr-8 text-xs rounded-xl border appearance-none cursor-pointer outline-none transition-colors ${
                  isDark
                    ? 'bg-[#121212] text-white border-[#262626] hover:border-[#3A3A3A]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="all">All Destinations</option>
                <option value="notion">Notion</option>
                <option value="sheets">Google Sheets</option>
                <option value="airtable">Airtable</option>
                <option value="webhook">Webhook</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Order Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort order"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`h-9 pl-3 pr-8 text-xs rounded-xl border appearance-none cursor-pointer outline-none transition-colors ${
                  isDark
                    ? 'bg-[#121212] text-white border-[#262626] hover:border-[#3A3A3A]'
                    : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="relevant">Most Relevant</option>
                <option value="alpha">Alphabetical</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Grid vs List View Switcher */}
            <div className={`flex items-center p-0.5 rounded-xl border ${
              isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                id="view-grid-btn"
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === 'grid'
                    ? isDark 
                      ? 'bg-[#222222] text-[#3FE769] shadow-sm' 
                      : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark 
                      ? 'text-[#888888] hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                id="view-list-btn"
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all ${
                  viewMode === 'list'
                    ? isDark 
                      ? 'bg-[#222222] text-[#3FE769] shadow-sm' 
                      : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark 
                      ? 'text-[#888888] hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Multi-Dimensional Group By Selector & View Controls         */}
        {/* ----------------------------------------------------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-black/5 dark:border-[#222222]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
              Filter Dimension:
            </span>
            <div className={`flex flex-wrap items-center p-0.5 rounded-xl border ${isDark ? 'bg-[#121212] border-[#262626]' : 'bg-slate-100 border-slate-200'}`}>
              <button
                id="group-by-intent-btn"
                type="button"
                onClick={() => handleGroupByChange('intent')}
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  groupBy === 'intent'
                    ? isDark ? 'bg-[#222222] text-[#3FE769] shadow-sm' : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark ? 'text-[#888888] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Intent</span>
                {selectedIntentFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                )}
              </button>
              <button
                id="group-by-source-btn"
                type="button"
                onClick={() => handleGroupByChange('source')}
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  groupBy === 'source'
                    ? isDark ? 'bg-[#222222] text-[#3FE769] shadow-sm' : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark ? 'text-[#888888] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Source</span>
                {selectedSourceFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 ml-0.5" />
                )}
              </button>
              <button
                id="group-by-type-btn"
                type="button"
                onClick={() => handleGroupByChange('type')}
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  groupBy === 'type'
                    ? isDark ? 'bg-[#222222] text-[#3FE769] shadow-sm' : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark ? 'text-[#888888] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Content Type</span>
                {selectedTypeFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-0.5" />
                )}
              </button>
              <button
                id="group-by-deadline-btn"
                type="button"
                onClick={() => handleGroupByChange('deadline')}
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  groupBy === 'deadline'
                    ? isDark ? 'bg-[#222222] text-[#3FE769] shadow-sm' : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark ? 'text-[#888888] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Deadline</span>
                {selectedDeadlineFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5" />
                )}
              </button>
              <button
                id="group-by-custom-btn"
                type="button"
                onClick={() => handleGroupByChange('custom')}
                className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                  groupBy === 'custom'
                    ? isDark ? 'bg-[#222222] text-[#3FE769] shadow-sm' : 'bg-white text-[#2D6A4F] shadow-sm'
                    : isDark ? 'text-[#888888] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Custom / Pages</span>
                {selectedGroupFilter !== 'all' && groupBy === 'custom' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Sectioned / Grouped View Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="toggle-grouped-view-btn"
              type="button"
              onClick={() => setIsGroupedView(!isGroupedView)}
              className={`h-7 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-medium border transition-all cursor-pointer ${
                isGroupedView
                  ? isDark 
                    ? 'bg-[#2D6A4F]/30 text-[#3FE769] border-[#3FE769]/40 shadow-sm font-semibold' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm font-semibold'
                  : isDark 
                    ? 'bg-[#121212] text-[#888888] border-[#262626] hover:text-white hover:border-[#383838]' 
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-sm'
              }`}
              title={isGroupedView ? 'Switch to Flat View with pagination' : 'Switch to Grouped Sections View'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isGroupedView ? 'Grouped Sections' : 'Flat View'}</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Dynamic Group Pills Switcher (Parallel Filtering)           */}
        {/* ----------------------------------------------------------- */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {groupBy === 'intent' && dynamicIntentFilters.map((intent) => {
            const isActive = selectedIntentFilter === intent.id;
            const count = intentCounts[intent.id] ?? (intent as any).defaultCount ?? 0;
            return (
              <motion.button
                key={intent.id}
                id={`intent-pill-${intent.id}`}
                onClick={() => setSelectedIntentFilter(intent.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                {intent.dotColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 transition-transform duration-200"
                    style={{
                      backgroundColor: intent.dotColor,
                      boxShadow: isDark
                        ? `0 0 6px ${intent.dotColor}99`
                        : `0 0 0 2px ${intent.dotBg || '#FFFFFF'}`
                    }}
                  />
                )}
                <span>{intent.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({count})
                </span>
                {(intent as any).isCustom && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomCategory((intent as any).customId);
                    }}
                    className="ml-0.5 hover:text-red-400 p-0.5 rounded-full transition-colors cursor-pointer"
                    title="Delete custom intent"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </motion.button>
            );
          })}

          {groupBy === 'source' && sourceOptions.map((source) => {
            const isActive = selectedSourceFilter === source.id;
            return (
              <motion.button
                key={source.id}
                id={`source-pill-${source.id}`}
                onClick={() => setSelectedSourceFilter(source.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                {source.id !== 'all' ? (
                  <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    <BrandIcon name={source.brandIcon} className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span>{source.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({source.count})
                </span>
              </motion.button>
            );
          })}

          {groupBy === 'type' && typeOptions.map((typeItem) => {
            const isActive = selectedTypeFilter === typeItem.id;
            const IconComp = typeItem.icon;
            return (
              <motion.button
                key={typeItem.id}
                id={`type-pill-${typeItem.id}`}
                onClick={() => setSelectedTypeFilter(typeItem.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? undefined : typeItem.color }} />
                <span>{typeItem.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({typeItem.count})
                </span>
                {(typeItem as any).isCustom && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomCategory((typeItem as any).customId);
                    }}
                    className="ml-0.5 hover:text-red-400 p-0.5 rounded-full transition-colors cursor-pointer"
                    title="Delete custom content type"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </motion.button>
            );
          })}

          {groupBy === 'deadline' && deadlineOptions.map((deadItem) => {
            const isActive = selectedDeadlineFilter === deadItem.id;
            const IconComp = deadItem.icon;
            return (
              <motion.button
                key={deadItem.id}
                id={`deadline-pill-${deadItem.id}`}
                onClick={() => setSelectedDeadlineFilter(deadItem.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? undefined : deadItem.color }} />
                <span>{deadItem.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({deadItem.count})
                </span>
              </motion.button>
            );
          })}

          {groupBy === 'custom' && customOptions.map((customItem) => {
            const isActive = selectedGroupFilter === customItem.id;
            const IconComp = customItem.icon;
            return (
              <motion.button
                key={customItem.id}
                id={`custom-pill-${customItem.id}`}
                onClick={() => setSelectedGroupFilter(customItem.id)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer border transition-all duration-200 select-none ${
                  isActive
                    ? isDark
                      ? 'bg-[#222222] text-white border-[#3A3A3A] shadow-sm font-semibold'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm font-semibold'
                    : isDark
                      ? 'bg-[#121212] text-[#888888] hover:text-white hover:bg-[#181818] border-[#262626] font-medium'
                      : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 font-medium'
                }`}
              >
                <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: isActive ? undefined : customItem.color }} />
                <span>{customItem.label}</span>
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? isDark ? 'text-[#3FE769]' : 'text-emerald-100'
                      : isDark ? 'text-[#666666]' : 'text-slate-400'
                  }`}
                >
                  ({customItem.count})
                </span>
              </motion.button>
            );
          })}

          {/* "+ Add Intent" / "+ Add Category" button */}
          <motion.button
            type="button"
            id="add-custom-category-pill-btn"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCreateCatDimension(groupBy === 'type' ? 'type' : 'intent');
              setIsCreateCatModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer border border-dashed transition-all duration-200 select-none ${
              isDark
                ? 'border-[#383838] text-blue-400 hover:text-blue-300 hover:border-blue-500/50 hover:bg-blue-500/10'
                : 'border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add {groupBy === 'type' ? 'Content Type' : 'Intent'}</span>
          </motion.button>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* Active Parallel Multi-Filters Summary Bar                   */}
        {/* ----------------------------------------------------------- */}
        {(selectedIntentFilter !== 'all' || selectedTypeFilter !== 'all' || selectedSourceFilter !== 'all' || selectedDeadlineFilter !== 'all' || (selectedGroupFilter !== 'all' && groupBy === 'custom')) && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 pb-0.5 border-t border-black/5 dark:border-[#222222]">
            <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
              Active Filters ({[
                selectedIntentFilter !== 'all',
                selectedTypeFilter !== 'all',
                selectedSourceFilter !== 'all',
                selectedDeadlineFilter !== 'all',
                selectedGroupFilter !== 'all' && groupBy === 'custom'
              ].filter(Boolean).length}):
            </span>
            {selectedIntentFilter !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span>Intent: {selectedIntentFilter.toUpperCase()}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedIntentFilter('all')} />
              </span>
            )}
            {selectedTypeFilter !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark ? 'bg-blue-950/40 text-blue-400 border-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <span>Type: {selectedTypeFilter.toUpperCase()}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedTypeFilter('all')} />
              </span>
            )}
            {selectedSourceFilter !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark ? 'bg-purple-950/40 text-purple-400 border-purple-800/50' : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                <span>Source: {selectedSourceFilter.toUpperCase()}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedSourceFilter('all')} />
              </span>
            )}
            {selectedDeadlineFilter !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span>Deadline: {selectedDeadlineFilter.replace('_', ' ').toUpperCase()}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedDeadlineFilter('all')} />
              </span>
            )}
            {selectedGroupFilter !== 'all' && groupBy === 'custom' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                <span>Page: {selectedGroupFilter}</span>
                <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedGroupFilter('all')} />
              </span>
            )}
            <button
              type="button"
              onClick={resetAllParallelFilters}
              className="text-xs font-semibold text-red-500 hover:text-red-400 ml-1 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Clips Cards List / Grid (Stitch Save - Clips Vault)         */}
      {/* ------------------------------------------------------------- */}
      {filteredClips.length === 0 ? (
        <div className={`text-center py-16 px-6 border rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
          isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDark ? 'bg-[#181818] text-[#888888]' : 'bg-slate-100 text-slate-500'
          }`}>
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
            {clips.length === 0 ? 'You do not have anything saved yet' : 'No clips found in this view'}
          </h3>
          <p className={`text-xs max-w-sm text-center leading-relaxed ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
            {clips.length === 0
              ? 'Your vault is completely empty. Save articles, web pages, or notes using the clipper extension or manual add.'
              : 'Try adjusting your search keywords, switching your destination or intent filters, or capture new items using the extension.'}
          </p>
          <div className="flex items-center gap-2 pt-2">
            {selectedGroupFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedGroupFilter('all')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
              >
                Clear "{selectedGroupFilter.toUpperCase()}" filter
              </button>
            )}
            <button
              type="button"
              onClick={onOpenManualAddModal}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                isDark 
                  ? 'bg-[#2D6A4F] text-white border-[#3FE769]/30 hover:bg-[#23533e]' 
                  : 'bg-[#2D6A4F] text-white border-transparent hover:bg-[#23533e]'
              }`}
            >
              + Save New Clip
            </button>
          </div>
        </div>
      ) : isGroupedView ? (
        /* ------------------------------------------------------------- */
        /* Grouped Sections View: Collapsible Categories matching Mode   */
        /* ------------------------------------------------------------- */
        <div className="flex flex-col gap-5">
          {groupedSections.map((section) => {
            const isCollapsed = Boolean(collapsedSections[section.id]);
            const IconComp = section.icon;

            return (
              <div 
                key={section.id} 
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isDark ? 'bg-[#0B0B0B] border-[#222222]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Collapsible Section Header */}
                <div
                  onClick={() => toggleSectionCollapse(section.id)}
                  className={`px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors border-b ${
                    isDark ? 'border-[#1E1E1E] hover:bg-[#141414]' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className={`p-1 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Group Icon (BrandIcon for sources, Lucide for types, colored dot for intent, Folder for custom) */}
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: section.bg || (isDark ? '#181818' : '#F1F5F9'),
                        borderColor: section.color ? `${section.color}35` : isDark ? '#262626' : '#E2E8F0',
                      }}
                    >
                      {section.brandIcon ? (
                        <BrandIcon name={section.brandIcon} className="w-4 h-4" />
                      ) : IconComp ? (
                        <IconComp className="w-4 h-4" style={{ color: section.color || '#10B981' }} />
                      ) : (
                        <Bookmark className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <h3 className={`font-semibold text-sm sm:text-base tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {section.label}
                    </h3>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
                      isDark ? 'bg-[#181818] text-[#A1A1A1] border border-[#2B2B2B]' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {section.clips.length} {section.clips.length === 1 ? 'clip' : 'clips'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroupFilter(section.id);
                        setIsGroupedView(false);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isDark
                          ? 'bg-[#181818] border-[#2B2B2B] text-[#888888] hover:text-white hover:border-[#3FE769]/40'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                      title={`Filter exclusively by ${section.label}`}
                    >
                      Focus
                    </button>
                  </div>
                </div>

                {/* Section Body */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5">
                    {viewMode === 'grid' ? (
                      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
                        {section.clips.map(clip => renderClipCard(clip))}
                      </div>
                    ) : (
                      <div className={`rounded-xl border divide-y overflow-hidden transition-all ${
                        isDark ? 'bg-[#0F0F0F] border-[#222222] divide-[#1C1B1B]' : 'bg-white border-slate-200 divide-slate-100'
                      }`}>
                        {section.clips.map(clip => renderClipRow(clip))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        /* ------------------------------------------------------------- */
        /* Grid View: 3-Column Responsive Cards matching Stitch          */
        /* ------------------------------------------------------------- */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {paginatedClips.map(clip => renderClipCard(clip))}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* List View: Dense Row Layout matching Stitch                   */
        /* ------------------------------------------------------------- */
        <div className={`rounded-2xl border divide-y overflow-hidden shadow-sm transition-all ${
          isDark ? 'bg-[#0F0F0F] border-[#222222] divide-[#1C1B1B]' : 'bg-white border-slate-200 divide-slate-100'
        }`}>
          {paginatedClips.map(clip => renderClipRow(clip))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3b. Pagination Controls matching Stitch (Flat View Only)      */}
      {/* ------------------------------------------------------------- */}
      {!isGroupedView && filteredClips.length > 0 && (
        <div 
          id="clips-pagination"
          className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 pt-5 border-t text-[13px] transition-colors ${
            isDark ? 'border-[#222222] text-[#888888]' : 'border-[#E2E8F0] text-slate-500'
          }`}
        >
          {/* Item Counter Range */}
          <div>
            Showing{' '}
            <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}–{Math.min(currentPage * itemsPerPage, totalCount)}
            </strong>{' '}
            of{' '}
            <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {totalCount}
            </strong>{' '}
            clips
          </div>

          {/* Navigation Controls: Previous, Page Pills, Next */}
          <div className="flex items-center gap-1.5 select-none">
            {/* Previous button */}
            <button
              id="pagination-prev-btn"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={`h-8 px-3 rounded-xl border text-[13px] font-medium flex items-center gap-1 transition-all ${
                currentPage <= 1
                  ? isDark
                    ? 'bg-[#121212] border-[#222222] text-[#444444] opacity-50 cursor-not-allowed'
                    : 'bg-white border-[#E2E8F0] text-slate-400 opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#121212] border-[#262626] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A] cursor-pointer'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Dynamic Page Pills */}
            {(() => {
              const pages: (number | string)[] = [];
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                if (currentPage <= 3) {
                  pages.push(1, 2, 3, '...', totalPages);
                } else if (currentPage >= totalPages - 2) {
                  pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, '...', currentPage, '...', totalPages);
                }
              }

              return pages.map((page, idx) => {
                if (page === '...') {
                  return (
                    <span 
                      key={`ellipsis-${idx}`} 
                      className={`px-1 text-xs select-none ${isDark ? 'text-[#666666]' : 'text-slate-400'}`}
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    id={`pagination-page-${pageNum}`}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-[13px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#2D6A4F] text-white font-semibold border border-[#3FE769]/40 shadow-sm shadow-[#2D6A4F]/40'
                          : 'bg-[#2D6A4F] text-white font-semibold shadow-sm'
                        : isDark
                          ? 'bg-[#121212] border border-[#262626] text-[#888888] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A]'
                          : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 shadow-sm font-medium'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}

            {/* Next button */}
            <button
              id="pagination-next-btn"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={`h-8 px-3 rounded-xl border text-[13px] font-medium flex items-center gap-1 transition-all ${
                currentPage >= totalPages
                  ? isDark
                    ? 'bg-[#121212] border-[#222222] text-[#444444] opacity-50 cursor-not-allowed'
                    : 'bg-white border-[#E2E8F0] text-slate-400 opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-[#121212] border-[#262626] text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A] hover:border-[#3A3A3A] cursor-pointer'
                    : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Slide-Over Clip Detail Drawer Modal (Stitch Spec)          */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {detailModalClip && (
          <ClipCinemaViewer
            clip={detailModalClip}
            allClips={filteredClips}
            onClose={() => setDetailModalClip(null)}
            onNavigate={(c) => setDetailModalClip(c)}
            destinations={destinations}
            onSendToDestination={onSendToDestination}
            onToggleStorage={handleToggleStorage}
            onToggleFavorite={toggleFavorite}
            onDeleteClip={deleteClip}
            isDark={isDark}
            customCategories={customCategories}
            onUpdateClip={handleUpdateClip}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* 5. Create Custom Category / Intent Modal                      */}
      {/* ------------------------------------------------------------- */}
      <CreateCustomCategoryModal
        isOpen={isCreateCatModalOpen}
        onClose={() => setIsCreateCatModalOpen(false)}
        onCreated={handleCreateCustomCategory}
        defaultDimension={createCatDimension}
        theme={theme}
      />
    </div>
  );
};

// =====================================================================
// Sub-Component: Slide-Over Clip Detail Drawer Modal
// =====================================================================
const ClipDetailDrawer: React.FC<{
  clip: ClipItem;
  onClose: () => void;
  destinations: DestinationConfig[];
  onSendToDestination: (clip: ClipItem, destType: string) => void;
  onToggleStorage: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteClip: (id: string) => void;
  isDark?: boolean;
  customCategories?: CustomCategoryConfig[];
  onUpdateClip?: (clipId: string, updates: Partial<ClipItem>) => void;
  onOpenAddCustomCategory?: () => void;
}> = ({ 
  clip, 
  onClose, 
  destinations, 
  onSendToDestination, 
  onToggleStorage, 
  onToggleFavorite, 
  onDeleteClip, 
  isDark = true,
  customCategories = [],
  onUpdateClip,
  onOpenAddCustomCategory,
}) => {
  const [exportedDest, setExportedDest] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleExport = (destType: string) => {
    onSendToDestination(clip, destType);
    setExportedDest(destType);
    setTimeout(() => setExportedDest(null), 2500);
  };

  const handleCopyUrl = () => {
    if (clip.url) {
      navigator.clipboard.writeText(clip.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const isLocal = clip.storageMode === 'local';
  const intent = getClipIntent(clip, customCategories);
  const intentStyle = getIntentBadgeStyle(intent, isDark, customCategories);
  const domain = getDomainFromUrl(clip.url);
  const formatLabel = getSourceFormatLabel(clip);
  const sourceKey = getClipSourceKey(clip);

  const availableIntents = useMemo(() => {
    const canonical = [
      { id: 'apply', label: 'Apply', dotColor: '#B45309' },
      { id: 'learn', label: 'Learn', dotColor: '#047857' },
      { id: 'track', label: 'Track', dotColor: '#475569' },
      { id: 'hire', label: 'Hire', dotColor: '#6D28D9' },
      { id: 'attend', label: 'Attend', dotColor: '#BE185D' },
      { id: 'buy', label: 'Buy', dotColor: '#1D4ED8' },
    ];
    const custom = customCategories
      .filter(c => c.dimension === 'intent')
      .map(c => ({ id: c.slug, label: c.name, dotColor: c.color, isCustom: true }));
    return [...canonical, ...custom];
  }, [customCategories]);

  const handleIntentChange = (newIntent: string) => {
    if (onUpdateClip) {
      onUpdateClip(clip.id, { intent: newIntent as any });
    }
  };
  const sourceMeta = getClipSourceMeta(sourceKey);
  const typeKey = getClipContentTypeKey(clip);
  const typeMeta = getClipContentTypeMeta(typeKey);
  const TypeIcon = typeMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Slide-Over Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={`relative z-10 w-full max-w-xl h-full flex flex-col shadow-2xl border-l overflow-hidden ${
          isDark ? 'bg-[#0B0B0B] border-[#242424] text-[#EDEDED]' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#101010] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Intent Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border ${intentStyle.bg} ${intentStyle.text} ${intentStyle.border}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: intentStyle.dot }} />
              <span>{intent}</span>
            </span>

            {/* Content Type Pill */}
            <span 
              className="px-2.5 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1 font-medium"
              style={{ backgroundColor: typeMeta.bg, color: typeMeta.color, borderColor: `${typeMeta.color}35` }}
            >
              <TypeIcon className="w-3 h-3" />
              <span>{typeMeta.label}</span>
            </span>

            {/* Source Brand Pill */}
            {sourceKey !== 'other' && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1 ${
                isDark ? 'bg-[#181818] border-[#2B2B2B] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <BrandIcon name={sourceMeta.brandIcon} className="w-3 h-3" />
                <span>{sourceMeta.label}</span>
              </span>
            )}

            {/* Source App Pill */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1 ${
              isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#888888]' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              {clip.sourceApp.includes('Mobile') ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
              <span>{clip.sourceApp}</span>
            </span>

            {/* Format Pill */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono border uppercase tracking-wider ${
              isDark ? 'bg-[#181818] border-[#2B2B2B] text-[#A1A1A1]' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              {formatLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-[#888888] hover:text-white hover:bg-[#202020]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title */}
          <div>
            <h2
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {clip.title}
            </h2>
            <p className="text-xs text-[#777777] font-mono mt-1">
              Captured on {formatClipDate(clip.createdAt)} • {domain}
            </p>
          </div>

          {/* Source URL Bar */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {clip.faviconUrl ? (
                <img 
                  src={clip.faviconUrl} 
                  alt="" 
                  className="w-4 h-4 rounded shrink-0" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                />
              ) : (
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className={`text-xs font-mono truncate ${isDark ? 'text-[#CCCCCC]' : 'text-slate-700'}`}>
                {clip.url}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className={`p-1.5 rounded-lg text-xs font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                  copiedUrl 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                    : isDark 
                      ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#888888] hover:text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Copy URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-1.5 rounded-lg border transition-all ${
                  isDark ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#888888] hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Interactive In-App Media & Live Embed Preview (Option A) */}
          <ClipMediaPreview clip={clip} isDark={isDark} />

          {/* Storage Mode Toggle Component */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                Storage Location & Privacy
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isLocal ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {isLocal ? 'Local Privacy Vault' : 'Cloud Synchronized'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  !isLocal
                    ? isDark ? 'border-blue-500 bg-blue-500/15 text-blue-300' : 'border-blue-500 bg-blue-50 text-blue-900'
                    : isDark ? 'border-[#222222] bg-[#161616] text-[#777777] hover:border-[#333333]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cloud Server</span>
                  </span>
                  {!isLocal && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <span className="text-[10px] opacity-75">Multi-device sync enabled</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleStorage(clip.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isLocal
                    ? isDark ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : isDark ? 'border-[#222222] bg-[#161616] text-[#777777] hover:border-[#333333]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local Device</span>
                  </span>
                  {isLocal && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <span className="text-[10px] opacity-75">Zero telemetry & private</span>
              </button>
            </div>
          </div>

          {/* Action Intent Classification & Reassignment Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
                Action Intent & Category
              </span>
              {onOpenAddCustomCategory && (
                <button
                  type="button"
                  onClick={onOpenAddCustomCategory}
                  className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New Custom Intent</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableIntents.map(intItem => {
                const isSelected = intent === intItem.id;
                return (
                  <button
                    key={intItem.id}
                    type="button"
                    onClick={() => handleIntentChange(intItem.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'border-[#3FE769] bg-[#2D6A4F]/30 text-[#3FE769] font-semibold shadow-sm'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold shadow-sm'
                        : isDark
                        ? 'border-[#222222] bg-[#161616] text-[#888888] hover:border-[#383838] hover:text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: intItem.dotColor }} />
                    <span>{intItem.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#3FE769] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Extracted Summary Box */}
          <div className={`p-4 rounded-xl border space-y-2 relative overflow-hidden ${
            isDark ? 'bg-[#121212] border-[#242424]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Key Takeaways & Synthesis</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-[#CCCCCC]' : 'text-slate-700'}`}>
              {clip.summary}
            </p>
          </div>

          {/* Clipped Excerpt (if present) */}
          {clip.selectedText && (
            <div className="space-y-1.5">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Clipped Page Selection
              </h4>
              <blockquote className={`p-3.5 rounded-xl text-xs italic border-l-2 border-emerald-500 leading-relaxed font-serif ${
                isDark ? 'bg-[#121212] text-[#CCCCCC]' : 'bg-slate-50 text-slate-700'
              }`}>
                "{clip.selectedText}"
              </blockquote>
            </div>
          )}

          {/* Extracted Data Metrics Grid */}
          {clip.extractedData && Object.keys(clip.extractedData).length > 0 && (
            <div className="space-y-2">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Extracted Attributes
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {clip.extractedData.company && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.company}</span>
                  </div>
                )}
                {clip.extractedData.salary && (
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-2 font-semibold">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">{clip.extractedData.salary}</span>
                  </div>
                )}
                {clip.extractedData.price && (
                  <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 flex items-center gap-2 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{clip.extractedData.price}</span>
                  </div>
                )}
                {clip.extractedData.deadline && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.deadline}</span>
                  </div>
                )}
                {clip.extractedData.location && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{clip.extractedData.location}</span>
                  </div>
                )}
                {clip.extractedData.rating && (
                  <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                    isDark ? 'bg-[#121212] border-[#242424] text-[#CCCCCC]' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="truncate">{clip.extractedData.rating}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags Cloud */}
          {clip.tags && clip.tags.length > 0 && (
            <div className="space-y-1.5">
              <h4 className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-[#777777]' : 'text-slate-500'}`}>
                Tags & Descriptors
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {clip.tags.map(t => (
                  <span
                    key={t}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md border ${
                      isDark ? 'bg-[#141414] border-[#262626] text-[#A1A1A1]' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 1-Tap Destination Sync Dock */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-3">
            <h4 className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-[#888888]' : 'text-slate-500'}`}>
              1-Tap Sync to Destinations
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {destinations.filter(d => d.connected).map(dest => {
                const isSynced = exportedDest === dest.type || (clip.syncedTo && clip.syncedTo.includes(dest.type));
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => handleExport(dest.type)}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSynced
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                        : isDark
                          ? 'bg-[#141414] border-[#262626] text-[#CCCCCC] hover:border-[#3FE769]/50 hover:text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{dest.name}</span>
                    {isSynced ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Send className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#101010] border-[#222222]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(clip.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                clip.isFavorite
                  ? 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                  : isDark
                    ? 'bg-[#181818] border-[#262626] text-[#888888] hover:text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${clip.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{clip.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteClip(clip.id);
                onClose();
              }}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-[#181818] border-[#262626] text-[#888888] hover:text-red-400 hover:border-red-500/30' : 'bg-white border-slate-200 text-slate-500 hover:text-red-600'
              }`}
              title="Delete Clip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDark ? 'bg-[#222222] hover:bg-[#282828] text-white border-[#3A3A3A]' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
            }`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

