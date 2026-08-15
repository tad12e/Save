// ─── Shared constants for Clipper content scripts ───

declare const chrome: any;

// ─── Colour tokens ───

export const C = {
  // Core
  bgDark: '#1a1a2e',
  violetPrimary: '#7c3aed',
  violetDark: '#6d28d9',
  lavenderAccent: '#a78bfa',
  lavenderBg: '#f5f3ff',
  lavenderBorder: '#ede9fe',

  // Light surfaces
  white: '#ffffff',
  surfaceLight: '#f9fafb',
  surfaceMid: '#f3f4f6',
  border: '#e5e7eb',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#374151',
  textMuted: '#64748b',
  textFaint: '#9ca3af',

  // Success
  successGreen: '#6ee7b7',
  successBg: '#065f46',
} as const;

// ─── SVG markup ───

export const CLIPPER_LOGO_14 = `<svg width="14" height="14" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8h12M7 13h8M7 18h10" stroke="${C.lavenderAccent}" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="18" r="4" fill="${C.violetPrimary}"/><path d="M18.5 18l1 1 2-2" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const CLIPPER_LOGO_12 = `<svg width="12" height="12" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8h12M7 13h8M7 18h10" stroke="${C.lavenderAccent}" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="18" r="4" fill="${C.violetPrimary}"/><path d="M18.5 18l1 1 2-2" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const CLIPPER_LOGO_10 = `<svg width="10" height="10" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 8h12M7 13h8M7 18h10" stroke="${C.lavenderAccent}" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="18" r="4" fill="${C.violetPrimary}"/><path d="M18.5 18l1 1 2-2" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const CHECK_14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="${C.successGreen}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const CHECK_10 = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="${C.successGreen}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// Gear icon for configure button
export const GEAR_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.textFaint}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

// Back arrow icon
export const BACK_ARROW_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${C.textFaint}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`;

// ─── Blocked URL check ───

export function isBlockedUrl(): boolean {
  const { protocol, hostname } = window.location;
  if (protocol !== 'http:' && protocol !== 'https:') return true;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) return true;
  return false;
}

// ─── Social media feed domains ───

export const SOCIAL_FEED_DOMAINS = [
  'twitter.com', 'x.com', 'linkedin.com',
  'tiktok.com', 'instagram.com', 'reddit.com',
] as const;

export function isSocialFeedPage(): boolean {
  const host = window.location.hostname.toLowerCase();
  return SOCIAL_FEED_DOMAINS.some(d => host === d || host.endsWith(`.${d}`));
}

// ─── Platform selectors for feed detector ───

export interface PlatformConfig {
  postSelector: string;
  textSelector: string;
  urlSelector?: string;
}

export const PLATFORM_SELECTORS: Record<string, PlatformConfig> = {
  'twitter.com': { postSelector: '[data-testid="tweet"]', textSelector: '[data-testid="tweetText"]', urlSelector: 'a[href*="/status/"]' },
  'x.com':       { postSelector: '[data-testid="tweet"]', textSelector: '[data-testid="tweetText"]', urlSelector: 'a[href*="/status/"]' },
  'linkedin.com': { postSelector: '.feed-shared-update-v2, div[data-urn*="urn:li:activity"]', textSelector: '.feed-shared-update-v2__description, .update-components-text, .feed-shared-inline-show-more-text, .feed-shared-text, [data-test-id="main-feed-activity-card__commentary"]', urlSelector: 'a[href*="/feed/update/urn:li:activity:"], a.feed-shared-mini-update-v2__link-to-details, a[href*="/posts/"]' },
  'tiktok.com':  { postSelector: '[class*="DivItemContainer"], [class*="DivVideoCardContainer"], div[data-e2e="recommend-list-item-container"], div[data-e2e="user-post-item"]', textSelector: '[data-e2e="browse-video-desc"], [data-e2e="user-post-item-desc"], [data-e2e="video-desc"], [class*="DivTextContainer"]', urlSelector: 'a[href*="/video/"]' },
  'instagram.com': { postSelector: 'article, div[role="dialog"] article, main article', textSelector: 'h1, span._ap3a, div._a9zm, ._a9zs, span.x193iq5w', urlSelector: 'a[href*="/p/"], a[href*="/reel/"]' },
  'reddit.com':  { postSelector: 'shreddit-post, article, div[data-testid="post-container"], [data-click-id="body"]', textSelector: '[slot="text-body"], [slot="title"], [data-click-id="body"], div[data-testid="post-container"] h1, div[data-testid="post-container"] h3', urlSelector: 'a[slot="full-post-link"], a[data-click-id="body"], a[href*="/comments/"]' },
};

// ─── Provider icons (simple emoji stand-ins) ───
export const PROVIDER_ICONS: Record<string, string> = {
  google_sheets: '📊',
  notion: '📝',
  airtable: '🗂️',
  sheets: '📊',
};
