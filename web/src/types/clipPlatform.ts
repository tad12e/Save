/**
 * Platform Metadata Contract (v1) — TypeScript mirror.
 *
 * Source of truth: backend/apps/clips/platform_meta.py
 * Dart mirror:     mobile/lib/models/platform_meta.dart
 *
 * Stored at clip.extra_metadata.platform_meta (served later as `platform_meta`).
 * Body text (tweet / post / caption) is NOT here — read clip.summary / selectedText.
 * All skin fields are optional; unknown skins MUST fall back to 'generic'.
 */

export const PLATFORM_META_VERSION = 1 as const;

export type PlatformSkin =
  | 'x'
  | 'youtube'
  | 'reddit'
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'spotify'
  | 'generic';

export const PLATFORM_SKINS: readonly PlatformSkin[] = [
  'x', 'youtube', 'reddit', 'github', 'linkedin', 'instagram', 'spotify', 'generic',
] as const;

export type SpotifyKind = 'track' | 'album' | 'playlist' | 'episode' | 'show' | 'artist';

interface PlatformMetaBase<S extends PlatformSkin> {
  v: typeof PLATFORM_META_VERSION;
  skin: S;
}

export interface XMeta extends PlatformMetaBase<'x'> {
  handle?: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
  verified_type?: 'blue' | 'gold' | 'business' | 'government' | string;
  media?: string[]; // <= 4
  video_duration?: string;
  posted_at?: string;
  likes?: number;
  reposts?: number;
  replies?: number;
  views?: number;
  link_preview?: {
    url?: string;
    domain?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface YouTubeMeta extends PlatformMetaBase<'youtube'> {
  video_id?: string;
  channel?: string;
  duration?: number; // seconds
  is_short?: boolean;
  views?: number;
  published_at?: string;
  channel_avatar?: string;
}

export interface RedditMeta extends PlatformMetaBase<'reddit'> {
  subreddit?: string;
  author?: string;
  upvotes?: number;
  comments?: number;
  nsfw?: boolean;
  flair?: string;
  thumb?: string;
  posted_at?: string;
}

export interface GitHubMeta extends PlatformMetaBase<'github'> {
  owner?: string;
  repo?: string;
  stars?: number;
  language?: string;
  forks?: number;
  license?: string;
  topics?: string[]; // <= 3
}

export interface LinkedInMeta extends PlatformMetaBase<'linkedin'> {
  name?: string;
  headline?: string;
  avatar?: string;
  reactions?: number;
  comments?: number;
  reposts?: number;
  posted_at?: string;
  media?: string[];
  article_preview?: {
    domain?: string;
    title?: string;
    read_min?: number;
    image?: string;
  };
}

export interface InstagramMeta extends PlatformMetaBase<'instagram'> {
  handle?: string;
  name?: string;
  is_reel?: boolean;
  media?: string[]; // <= 4
  avatar?: string;
  likes?: number;
}

export interface SpotifyMeta extends PlatformMetaBase<'spotify'> {
  kind?: SpotifyKind;
  artist?: string;
  cover?: string;
  duration?: number; // seconds
  album?: string;
}

export interface GenericMeta extends PlatformMetaBase<'generic'> {
  site?: string;
  read_min?: number;
  image?: string;
  author?: string;
  published_at?: string;
}

/** Discriminated union — switch on `meta.skin` for full type narrowing. */
export type PlatformMeta =
  | XMeta
  | YouTubeMeta
  | RedditMeta
  | GitHubMeta
  | LinkedInMeta
  | InstagramMeta
  | SpotifyMeta
  | GenericMeta;

// ---------------------------------------------------------------------------
// Skin resolution — must stay identical to resolve_skin() in Python & Dart.
// ---------------------------------------------------------------------------
const SOURCE_PLATFORM_TO_SKIN: Record<string, PlatformSkin> = {
  x_twitter: 'x',
  youtube: 'youtube',
  reddit: 'reddit',
  github: 'github',
  linkedin: 'linkedin',
  instagram: 'instagram',
  spotify: 'spotify',
};

const HOST_TO_SKIN: ReadonlyArray<[string, PlatformSkin]> = [
  ['x.com', 'x'],
  ['twitter.com', 'x'],
  ['youtube.com', 'youtube'],
  ['youtu.be', 'youtube'],
  ['reddit.com', 'reddit'],
  ['redd.it', 'reddit'],
  ['github.com', 'github'],
  ['linkedin.com', 'linkedin'],
  ['instagram.com', 'instagram'],
  ['spotify.com', 'spotify'],
];

function hostOf(url?: string | null): string {
  if (!url) return '';
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return '';
  }
}

export function resolveSkin(sourcePlatform?: string | null, url?: string | null): PlatformSkin {
  const direct = SOURCE_PLATFORM_TO_SKIN[(sourcePlatform || '').toLowerCase()];
  if (direct) return direct;
  const host = hostOf(url);
  if (host) {
    for (const [suffix, skin] of HOST_TO_SKIN) {
      if (host === suffix || host.endsWith(`.${suffix}`)) return skin;
    }
  }
  return 'generic';
}

function isSkin(value: unknown): value is PlatformSkin {
  return typeof value === 'string' && (PLATFORM_SKINS as readonly string[]).includes(value);
}

/**
 * Parse an untrusted payload into a PlatformMeta. Never throws.
 * Accepts the top-level `platform_meta` field or `extra_metadata.platform_meta`.
 */
export function parsePlatformMeta(
  raw: unknown,
  sourcePlatform?: string | null,
  url?: string | null,
): PlatformMeta {
  if (raw && typeof raw === 'object' && isSkin((raw as { skin?: unknown }).skin)) {
    return { ...(raw as object), v: PLATFORM_META_VERSION } as PlatformMeta;
  }
  return { v: PLATFORM_META_VERSION, skin: resolveSkin(sourcePlatform, url) } as PlatformMeta;
}

// ---------------------------------------------------------------------------
// Derived helpers (shared by all skins)
// ---------------------------------------------------------------------------

/** YouTube thumbnails are derived, never stored. */
export function youtubeThumbnail(videoId?: string, quality: 'mq' | 'hq' = 'hq'): string | undefined {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/${quality}default.jpg` : undefined;
}

/** 1234 -> "1.2K", 1_250_000 -> "1.3M" (matches native platform formatting). */
export function formatCompactCount(n?: number): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '';
  if (n < 1000) return String(n);
  const units: Array<[number, string]> = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const v = n / size;
      return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}${suffix}`;
    }
  }
  return String(n);
}

/** 754 -> "12:34", 3723 -> "1:02:03". */
export function formatDuration(seconds?: number): string {
  if (!seconds || seconds < 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
