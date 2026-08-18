// ─── Social Media Feed Detector & Per-Post Micro Icon Content Script ───

import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { MicroIcon } from '../components/MicroIcon';
import { SelectionPanel } from '../components/SelectionPanel';
import { PLATFORM_SELECTORS, PlatformConfig } from '../lib/constants';
import { detectOpportunity } from '../lib/detector';
import { getPanelPosition } from '../lib/position';

const injectedPosts = new WeakSet<Element>();

function getPlatformConfig(): PlatformConfig | null {
  try {
    const host = window.location.hostname.toLowerCase();
    for (const [domain, config] of Object.entries(PLATFORM_SELECTORS)) {
      if (host === domain || host.endsWith(`.${domain}`)) {
        return config;
      }
    }
  } catch (err) {
    console.warn('[Clipper] getPlatformConfig error:', err);
  }
  return null;
}

function extractPostText(post: Element, config: PlatformConfig): string {
  try {
    const textEl = post.querySelector(config.textSelector);
    return textEl?.textContent?.trim() || '';
  } catch {
    return '';
  }
}

function extractPostUrl(post: Element, config: PlatformConfig): string {
  try {
    if (config.urlSelector) {
      const linkEl = post.querySelector(config.urlSelector) as HTMLAnchorElement;
      if (linkEl?.href) return linkEl.href;
    }
  } catch {}
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
  try {
    let host = document.getElementById('clipper-feed-panel-root') as HTMLDivElement | null;
    if (!host) {
      host = document.createElement('div');
      host.id = 'clipper-feed-panel-root';
      Object.assign(host.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2147483647',
        pointerEvents: 'none',
      });
      const shadow = host.attachShadow({ mode: 'open' });
      const mountPoint = document.createElement('div');
      mountPoint.id = 'clipper-mount-point';
      mountPoint.style.pointerEvents = 'none';
      mountPoint.style.width = '100%';
      mountPoint.style.height = '100%';
      shadow.appendChild(mountPoint);
      (document.body || document.documentElement).appendChild(host);
      panelHostDiv = host;
      panelRoot = createRoot(mountPoint);
    } else {
      if (!document.body.contains(host)) {
        (document.body || document.documentElement).appendChild(host);
      }
      if (!panelRoot && host.shadowRoot) {
        const mount = host.shadowRoot.getElementById('clipper-mount-point') || (host.shadowRoot.firstElementChild as HTMLElement);
        if (mount) panelRoot = createRoot(mount);
      }
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
          contentType={contentType || 'music'}
          source="feed_post"
          onClose={handleClose}
        />
      );
    }
  } catch (err) {
    console.warn('[Clipper] renderPanelOverlay error:', err);
  }
}

function processPost(post: Element, config: PlatformConfig) {
  try {
    if (injectedPosts.has(post)) return;
    if (post.hasAttribute('data-clipper-injected')) return;
    if (post.querySelector('.clipper-tweet-save-btn')) return;

    injectedPosts.add(post);
    post.setAttribute('data-clipper-injected', 'true');

    const text = extractPostText(post, config) || post.textContent?.trim() || '';
    const result = detectOpportunity(text);
    const isInstagram = window.location.hostname.includes('instagram.com');
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const isTikTok = window.location.hostname.includes('tiktok.com');
    const detectedType = (isInstagram || isTikTok) ? 'music' : (result && result.detected && result.type) ? result.type : 'tweet';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'clipper-tweet-save-btn';

    const postEl = post as HTMLElement;

    if (isInstagram) {
      // Find options (3-dots) button or header safely
      const optionsBtn = post.querySelector('svg[aria-label="Options"], svg[aria-label="More options"], button[aria-label="More options"]');
      const header = (optionsBtn ? (optionsBtn.closest('header, div[class*="_aaho"], div[role="presentation"]') as HTMLElement) : null) ||
                     (post.querySelector('header, div[class*="_aaho"]') as HTMLElement | null);

      if (header) {
        if (header.querySelector('.clipper-tweet-save-btn')) return;
        const comp = window.getComputedStyle(header).position;
        if (comp === 'static' || comp === '') header.style.position = 'relative';

        Object.assign(iconContainer.style, {
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          right: '58px', // Positioned nicely next to 3-dots
          width: '22px',
          height: '22px',
          zIndex: '50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });

        if (optionsBtn && optionsBtn.parentElement && optionsBtn.parentElement !== header) {
          optionsBtn.parentElement.parentElement?.insertBefore(iconContainer, optionsBtn.parentElement);
        } else {
          header.appendChild(iconContainer);
        }
      } else {
        const compPos = window.getComputedStyle(postEl).position;
        if (compPos === 'static' || compPos === '') postEl.style.position = 'relative';

        Object.assign(iconContainer.style, {
          position: 'absolute',
          top: '12px',
          right: '58px',
          width: '22px',
          height: '22px',
          zIndex: '50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });
        postEl.appendChild(iconContainer);
      }
    } else if (isLinkedIn) {
      // Target LinkedIn post header / control menu (where ... and X buttons are)
      const controlMenu = post.querySelector('.feed-shared-control-menu, .feed-shared-update-v2__control-menu, button[aria-label*="Control menu"], button[aria-label*="More actions"], button[aria-label*="Dismiss"]') as HTMLElement | null;
      if (controlMenu) {
        const targetParent = controlMenu.parentElement || controlMenu;
        if (targetParent.querySelector('.clipper-tweet-save-btn')) return;
        Object.assign(iconContainer.style, {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          marginRight: '8px',
          verticalAlign: 'middle',
          pointerEvents: 'auto',
          zIndex: '50',
        });
        targetParent.insertBefore(iconContainer, controlMenu);
      } else {
        // Place in top-right of LinkedIn post card
        const compPos = window.getComputedStyle(postEl).position;
        if (compPos === 'static' || compPos === '') postEl.style.position = 'relative';

        Object.assign(iconContainer.style, {
          position: 'absolute',
          top: '16px',
          right: '60px',
          width: '22px',
          height: '22px',
          zIndex: '50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });
        postEl.appendChild(iconContainer);
      }
    } else {
      // Twitter / X / TikTok / Reddit / YouTube
      const compPos = window.getComputedStyle(postEl).position;
      if (compPos === 'static' || compPos === '') {
        postEl.style.position = 'relative';
      }
      Object.assign(iconContainer.style, {
        position: 'absolute',
        top: '12px',
        right: '64px',
        width: '20px',
        height: '20px',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      });
      postEl.appendChild(iconContainer);
    }

    const root = createRoot(iconContainer);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const postUrl = extractPostUrl(post, config);
      const rect = iconContainer.getBoundingClientRect();
      const pos = getPanelPosition(rect, 270, 320);

      renderPanelOverlay(text, postUrl, pos, detectedType);
    };

    root.render(<MicroIcon detectedType={detectedType} onClick={handleClick} />);
  } catch (err) {
    console.warn('[Clipper] processPost error:', err);
  }
}

function scanPosts(config: PlatformConfig) {
  try {
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const selector = isLinkedIn
      ? 'div.feed-shared-update-v2, div[data-view-name="feed-full-update"] > div, div.artdeco-card, div[data-urn*="urn:li:activity"]'
      : `${config.postSelector}, article[data-testid="tweet"], article[role="article"]`;

    const posts = document.querySelectorAll(selector);
    posts.forEach((post) => {
      // Only inject on top-level cards, not nested reposts
      const parentPost = post.parentElement?.closest('article, div.feed-shared-update-v2');
      if (!parentPost && !injectedPosts.has(post) && !post.hasAttribute('data-clipper-injected')) {
        processPost(post, config);
      }
    });
  } catch (err) {
    console.warn('[Clipper] scanPosts error:', err);
  }
}

export default defineContentScript({
  matches: [
    '*://*.twitter.com/*',
    '*://*.x.com/*',
    '*://*.linkedin.com/*',
    '*://*.tiktok.com/*',
    '*://*.instagram.com/*',
    '*://*.youtube.com/*',
    '*://*.reddit.com/*',
  ],
  runAt: 'document_idle',

  main() {
    try {
      const config = getPlatformConfig();
      if (!config) return;
      console.log('[Clipper] Social feed detector active on', window.location.hostname);

      // Scan immediately
      scanPosts(config);

      // Observe dynamic infinite scrolling DOM mutations
      const targetNode = document.body || document.documentElement;
      if (targetNode) {
        const mutationObserver = new MutationObserver(() => {
          scanPosts(config);
        });

        mutationObserver.observe(targetNode, {
          childList: true,
          subtree: true,
        });
      }

      // Periodic scan fallback for SPAs & dynamic navigation
      setInterval(() => {
        scanPosts(config);
      }, 1500);
    } catch (err) {
      console.warn('[Clipper] feedDetector main error:', err);
    }
  },
});
