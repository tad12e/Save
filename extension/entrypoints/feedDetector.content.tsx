// ─── Social Media Feed Detector & Per-Post Micro Icon Content Script ───

import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { MicroIcon } from '../components/MicroIcon';
import { SelectionPanel } from '../components/SelectionPanel';
import { PLATFORM_SELECTORS, PlatformConfig } from '../lib/constants';
import { detectOpportunity } from '../lib/detector';
import { getPanelPosition } from '../lib/position';

const processedPosts = new WeakSet<Element>();
const injectedPosts = new WeakSet<Element>();

function getPlatformConfig(): PlatformConfig | null {
  const host = window.location.hostname.toLowerCase();
  for (const [domain, config] of Object.entries(PLATFORM_SELECTORS)) {
    if (host === domain || host.endsWith(`.${domain}`)) {
      return config;
    }
  }
  return null;
}

function extractPostText(post: Element, config: PlatformConfig): string {
  const textEl = post.querySelector(config.textSelector);
  return textEl?.textContent?.trim() || '';
}

function extractPostUrl(post: Element, config: PlatformConfig): string {
  if (config.urlSelector) {
    const linkEl = post.querySelector(config.urlSelector) as HTMLAnchorElement;
    if (linkEl?.href) return linkEl.href;
  }
  return window.location.href;
}

// Container for managing panel overlay inside page
let panelHostDiv: HTMLDivElement | null = null;
let panelRoot: ReturnType<typeof createRoot> | null = null;

function renderPanelOverlay(
  text: string,
  url: string,
  position: { left: number; top: number },
  contentType: string | null
) {
  if (!panelHostDiv) {
    panelHostDiv = document.createElement('div');
    panelHostDiv.id = 'clipper-feed-panel-root';
    Object.assign(panelHostDiv.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    const shadow = panelHostDiv.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    mountPoint.style.pointerEvents = 'none';
    shadow.appendChild(mountPoint);
    (document.body || document.documentElement).appendChild(panelHostDiv);
    panelRoot = createRoot(mountPoint);
  }

  const handleClose = () => {
    if (panelRoot) {
      panelRoot.render(null);
    }
  };

  if (panelRoot) {
    panelRoot.render(
      <SelectionPanel
        text={text}
        url={url}
        position={position}
        contentType={contentType}
        source="feed_post"
        onClose={handleClose}
      />
    );
  }
}

function processPost(post: Element, config: PlatformConfig) {
  if (injectedPosts.has(post)) return;
  if (post.hasAttribute('data-clipper-injected')) return;
  if (post.querySelector(':scope > .clipper-tweet-save-btn')) return;

  // Prevent duplicate injection if this post is nested inside another post container
  const parentPost = post.parentElement?.closest(`${config.postSelector}, [data-clipper-injected]`);
  if (parentPost && parentPost !== post) {
    return;
  }

  injectedPosts.add(post);
  post.setAttribute('data-clipper-injected', 'true');

  const text = extractPostText(post, config) || post.textContent?.trim() || '';
  const result = detectOpportunity(text);
  const detectedType = (result && result.detected && result.type) ? result.type : 'tweet';

  const postEl = post as HTMLElement;
  const compPos = window.getComputedStyle(postEl).position;
  if (compPos === 'static' || compPos === '') {
    postEl.style.position = 'relative';
  }

  const iconContainer = document.createElement('div');
  iconContainer.className = 'clipper-tweet-save-btn';
  Object.assign(iconContainer.style, {
    position: 'absolute',
    top: '12px',
    right: '72px',
    width: '20px',
    height: '20px',
    zIndex: '50',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  });

  postEl.appendChild(iconContainer);

  const root = createRoot(iconContainer);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const postUrl = extractPostUrl(post, config);
    const rect = iconContainer.getBoundingClientRect();
    const pos = getPanelPosition(rect, 240, 260);

    renderPanelOverlay(text, postUrl, pos, detectedType);
  };

  root.render(<MicroIcon detectedType={detectedType} onClick={handleClick} />);
}

function scanPosts(config: PlatformConfig) {
  const isLinkedIn = window.location.hostname.includes('linkedin.com');
  const selector = isLinkedIn
    ? '.feed-shared-update-v2, div[data-urn*="urn:li:activity"]'
    : `${config.postSelector}, article[data-testid="tweet"], article[role="article"]`;

  const posts = document.querySelectorAll(selector);
  posts.forEach((post) => {
    // Only inject on top-level cards, not nested reposts
    const parentPost = post.parentElement?.closest(selector);
    if (!parentPost && !injectedPosts.has(post) && !post.hasAttribute('data-clipper-injected')) {
      processPost(post, config);
    }
  });
}

export default defineContentScript({
  matches: [
    '*://*.twitter.com/*',
    '*://*.x.com/*',
    '*://*.linkedin.com/*',
    '*://*.tiktok.com/*',
    '*://*.instagram.com/*',
    '*://*.reddit.com/*',
  ],
  runAt: 'document_idle',

  main() {
    const config = getPlatformConfig();
    if (!config) return;
    console.log('[Clipper] Social feed detector active on', window.location.hostname);

    // Scan immediately
    scanPosts(config);

    // Observe dynamic infinite scrolling DOM mutations
    const mutationObserver = new MutationObserver(() => {
      scanPosts(config);
    });

    mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Periodic scan fallback
    setInterval(() => {
      scanPosts(config);
    }, 1500);
  },
});
