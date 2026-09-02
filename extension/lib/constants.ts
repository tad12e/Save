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

// ─── Official Brand SVG Vectors (Iconify) ───
export const GOOGLE_SHEETS_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="#0F9D58"/>
  <path d="M14 2v6h6L14 2z" fill="#87CEAC"/>
  <rect x="7" y="11" width="10" height="8" rx="0.75" fill="#FFFFFF"/>
  <path d="M7 13.5h10M7 16h10M10.5 11v8" stroke="#0F9D58" stroke-width="1.1" stroke-linecap="round"/>
</svg>`;

export const NOTION_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.16 3.28c.44.38 1.1.38 1.87.38h11.94c.77 0 1.43 0 1.87-.38.46-.4.65-1.04.65-2.06H3.51c0 1.02.18 1.66.65 2.06zm-1.85 4.54v13.31c0 1 .81 1.82 1.81 1.82h15.76c1 0 1.82-.81 1.82-1.82V7.82H2.31zm6.81 3.52h2.25l3.75 5.9v-5.9h2.15v8.03h-2.25L11.26 13.47v5.9H9.12v-8.03z" fill="#FFFFFF"/>
</svg>`;

export const AIRTABLE_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11.36 2.52a.85.85 0 0 1 .78 0l9.36 4.68a.85.85 0 0 1 0 1.52l-9.36 4.68a.85.85 0 0 1-.78 0L2 8.72a.85.85 0 0 1 0-1.52l9.36-4.68z" fill="#18BFFF"/>
  <path d="M11.5 13.85v7.65a.5.5 0 0 1-.72.45L2.28 17.7a.5.5 0 0 1-.28-.45v-7.65l9.5 4.25z" fill="#F82B60"/>
  <path d="M12.5 13.85l9.5-4.25v7.65a.5.5 0 0 1-.28.45l-8.5 4.25a.5.5 0 0 1-.72-.45v-7.65z" fill="#FCB400"/>
</svg>`;

export const SPOTIFY_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="11" fill="#1DB954"/>
  <path d="M16.5 16.2c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.2-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.5-.8 6.5-.4 9 1.1.4.2.5.6.4.8zm1.2-2.7c-.2.4-.7.5-1.1.2-2.5-1.5-6.3-2-9.3-1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-1 7.6-.5 10.6 1.3.4.2.5.7.3 1zm.1-2.8c-3-1.8-8-2-10.9-1.1-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.3-1 8.8-.8 12.3 1.3.4.3.6.8.3 1.2-.2.5-.8.6-1.2.3z" fill="#000000"/>
</svg>`;

export const YOUTUBE_MUSIC_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="11" fill="#FF0000"/>
  <circle cx="12" cy="12" r="6" stroke="#FFFFFF" stroke-width="1.8"/>
  <polygon points="10.5,9.5 15,12 10.5,14.5" fill="#FFFFFF"/>
</svg>`;

export const SAVE_VAULT_SVG_16 = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#7c3aed" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const PROVIDER_SVGS: Record<string, string> = {
  google_sheets: GOOGLE_SHEETS_SVG_16,
  sheets: GOOGLE_SHEETS_SVG_16,
  notion: NOTION_SVG_16,
  airtable: AIRTABLE_SVG_16,
  spotify: SPOTIFY_SVG_16,
  youtube_music: YOUTUBE_MUSIC_SVG_16,
  custom_db: SAVE_VAULT_SVG_16,
};

// ─── Provider icons fallback map ───
export const PROVIDER_ICONS: Record<string, string> = {
  google_sheets: '📊',
  notion: '📝',
  airtable: '🗂️',
  sheets: '📊',
  custom_db: '💾',
  spotify: '🎧',
  youtube_music: '🎵',
};
