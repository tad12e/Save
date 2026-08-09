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
    Object.assign(panelHostDiv.style, {
      position: 'fixed',
      inset: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    const shadow = panelHostDiv.attachShadow({ mode: 'open' });
    const mountPoint = document.createElement('div');
    shadow.appendChild(mountPoint);
    document.documentElement.appendChild(panelHostDiv);
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
  if (processedPosts.has(post)) return;
  processedPosts.add(post);

  const text = extractPostText(post, config);
  if (!text) return;

  const result = detectOpportunity(text);
  if (!result.detected || !result.type) return;

  if (injectedPosts.has(post)) return;
  injectedPosts.add(post);

  const postEl = post as HTMLElement;
  const compPos = window.getComputedStyle(postEl).position;
  if (compPos === 'static' || compPos === '') {
    postEl.style.position = 'relative';
  }

  const iconContainer = document.createElement('div');
  iconContainer.style.position = 'absolute';
  iconContainer.style.bottom = '8px';
  iconContainer.style.right = '8px';
  iconContainer.style.width = '20px';
  iconContainer.style.height = '20px';
  iconContainer.style.zIndex = '999';
  postEl.appendChild(iconContainer);

  const root = createRoot(iconContainer);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const postUrl = extractPostUrl(post, config);
    const rect = iconContainer.getBoundingClientRect();
    const pos = getPanelPosition(rect, 240, 260);

    renderPanelOverlay(text, postUrl, pos, result.type);
  };

  root.render(<MicroIcon detectedType={result.type} onClick={handleClick} />);
}

function scanPosts(config: PlatformConfig, observer: IntersectionObserver) {
  const posts = document.querySelectorAll(config.postSelector);
  posts.forEach((post) => {
    if (!processedPosts.has(post)) {
      observer.observe(post);
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

    // IntersectionObserver with threshold 0.6 and rootMargin "-20% 0px -20% 0px"
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            processPost(entry.target, config);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.6,
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    scanPosts(config, observer);

    // MutationObserver for infinite scrolling
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        scanPosts(config, observer);
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});
