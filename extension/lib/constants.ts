// ─── Constants & Inline Assets ───

export const C = {
  violetPrimary: '#7c3aed',
  violetHover: '#6d28d9',
  violetLight: '#8b5cf6',
  lavenderBg: '#ede9fe',
  textDark: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  borderLight: '#e2e8f0',
  white: '#ffffff',
};

// ─── Inline SVG Strings (10-14px) ───

export const CLIPPER_LOGO_10 = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#c084fc" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const CLIPPER_LOGO_12 = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#7c3aed" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const CLIPPER_LOGO_14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#c084fc" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const CHECK_10 = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

export const CHECK_14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

export const GEAR_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>`;

export const BACK_ARROW_SVG = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="19" y1="12" x2="5" y2="12"></line>
  <polyline points="12 19 5 12 12 5"></polyline>
</svg>`;

// ─── Blocked domains / internal schemes ───

const BLOCKED_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'brave://',
  'view-source:',
];

export function isBlockedUrl(url = window.location.href): boolean {
  return BLOCKED_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// ─── Platform selectors for feed detector ───

export interface PlatformConfig {
  postSelector: string;
  textSelector: string;
  urlSelector?: string;
}

export const PLATFORM_SELECTORS: Record<string, PlatformConfig> = {
  'twitter.com': {
    postSelector: '[data-testid="tweet"]',
    textSelector: '[data-testid="tweetText"]',
    urlSelector: 'a[href*="/status/"]'
  },
  'x.com': {
    postSelector: '[data-testid="tweet"]',
    textSelector: '[data-testid="tweetText"]',
    urlSelector: 'a[href*="/status/"]'
  },
  'linkedin.com': {
    postSelector: '.feed-shared-update-v2, div[data-view-name="feed-full-update"], div[data-urn*="urn:li:activity"], div[data-id*="urn:li:activity"], .feed-shared-update-v2__content',
    textSelector: '.feed-shared-update-v2__description, .update-components-text, .feed-shared-inline-show-more-text, .feed-shared-text, [data-test-id="main-feed-activity-card__commentary"], span.break-words',
    urlSelector: 'a[href*="/feed/update/urn:li:activity:"], a.feed-shared-mini-update-v2__link-to-details, a[href*="/posts/"]'
  },
  'tiktok.com': {
    postSelector: '[class*="DivItemContainer"], [class*="DivVideoCardContainer"], div[data-e2e="recommend-list-item-container"], div[data-e2e="user-post-item"]',
    textSelector: '[data-e2e="browse-video-desc"], [data-e2e="user-post-item-desc"], [data-e2e="video-desc"], [class*="DivTextContainer"]',
    urlSelector: 'a[href*="/video/"]'
  },
  'instagram.com': {
    postSelector: 'article, div[role="dialog"] article, div[data-page-type="reels"] > div, div._aaoe',
    textSelector: 'h1, span._ap3a, div._a9zm, ._a9zs, span.x193iq5w',
    urlSelector: 'a[href*="/p/"], a[href*="/reel/"], a[href*="/reels/"]'
  },
  'youtube.com': {
    postSelector: 'ytd-reel-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, #shorts-player, ytd-shorts',
    textSelector: '#video-title, #title, yt-formatted-string, h2.ytd-reel-player-header-renderer',
    urlSelector: 'a#thumbnail, a[href*="/shorts/"], a[href*="/watch"]'
  },
  'reddit.com': {
    postSelector: 'shreddit-post, article, div[data-testid="post-container"], [data-click-id="body"]',
    textSelector: '[slot="text-body"], [slot="title"], [data-click-id="body"], div[data-testid="post-container"] h1, div[data-testid="post-container"] h3',
    urlSelector: 'a[slot="full-post-link"], a[data-click-id="body"], a[href*="/comments/"]'
  },
};

// ─── Provider icons (simple emoji stand-ins) ───
export const PROVIDER_ICONS: Record<string, string> = {
  google_sheets: '📊',
  notion: '📝',
  airtable: '🗂️',
  sheets: '📊',
  custom_db: '💾',
  spotify: '🎧',
  youtube_music: '🎵',
};
