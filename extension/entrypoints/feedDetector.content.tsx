// ─── Universal Social Media Feed Detector, Per-Post Micro Buttons & Native Share Hooks ───

import React from 'react';
import { createRoot } from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { MicroIcon } from '../components/MicroIcon';
import { SelectionPanel } from '../components/SelectionPanel';
import { PLATFORM_SELECTORS, PlatformConfig } from '../lib/constants';
import { detectOpportunity } from '../lib/detector';
import { getPanelPosition } from '../lib/position';
import { getFeedButtonSettings, PlatformFeedSettings, DEFAULT_FEED_SETTINGS } from '../lib/storage';

declare const chrome: any;

const injectedPosts = new WeakSet<Element>();
let activeSettings: PlatformFeedSettings = DEFAULT_FEED_SETTINGS;

function getPlatformKey(): keyof PlatformFeedSettings['platforms'] | null {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('youtube.com')) return 'youtube';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('twitter.com') || host.includes('x.com')) return 'x_twitter';
  if (host.includes('reddit.com')) return 'reddit';
  return null;
}

function isCurrentPlatformEnabled(): boolean {
  if (!activeSettings.enabled) return false;
  const key = getPlatformKey();
  if (!key) return true;
  return activeSettings.platforms[key] ?? true;
}

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
          text={text || document.title || 'Clip'}
          url={url || window.location.href}
          position={position}
          contentType={contentType || 'video'}
          source="feed_post"
          onClose={handleClose}
        />
      );
    }
  } catch (err) {
    console.warn('[Clipper] renderPanelOverlay error:', err);
  }
}

// ─── Feed Posts & Thumbnail Card Injection ───

function processPost(post: Element, config: PlatformConfig) {
  try {
    if (injectedPosts.has(post)) return;
    if (post.hasAttribute('data-clipper-injected')) return;
    if (post.querySelector('.clipper-tweet-save-btn')) return;

    const isYouTube = window.location.hostname.includes('youtube.com');
    const isWatchPage = isYouTube && window.location.pathname.includes('/watch');
    const isShorts = isYouTube && window.location.pathname.includes('/shorts');

    // Skip video player wrappers on watch page and shorts (handled by dedicated injectors)
    if (isWatchPage && (post.id === 'movie_player' || post.classList.contains('html5-video-player') || post.closest('#player, #player-container, #movie_player'))) {
      return;
    }
    if (isShorts && (post.tagName.toLowerCase() === 'ytd-reel-video-renderer' || post.closest('ytd-reel-video-renderer, #shorts-player'))) {
      return;
    }

    injectedPosts.add(post);
    post.setAttribute('data-clipper-injected', 'true');

    const text = extractPostText(post, config) || post.textContent?.trim() || '';
    const result = detectOpportunity(text);
    const isInstagram = window.location.hostname.includes('instagram.com');
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const isTikTok = window.location.hostname.includes('tiktok.com');
    const detectedType = (isInstagram || isTikTok || isYouTube) ? 'video' : (result && result.detected && result.type) ? result.type : 'tweet';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'clipper-tweet-save-btn';

    if (!isCurrentPlatformEnabled()) {
      iconContainer.style.display = 'none';
    }

    const postEl = post as HTMLElement;

    if (isInstagram) {
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
          right: '58px',
          width: '22px',
          height: '22px',
          zIndex: '50',
          display: isCurrentPlatformEnabled() ? 'flex' : 'none',
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
          display: isCurrentPlatformEnabled() ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });
        postEl.appendChild(iconContainer);
      }
    } else if (isLinkedIn) {
      const controlMenu = post.querySelector('.feed-shared-control-menu, .feed-shared-update-v2__control-menu, button[aria-label*="Control menu"], button[aria-label*="More actions"], button[aria-label*="Dismiss"]') as HTMLElement | null;
      if (controlMenu) {
        const targetParent = controlMenu.parentElement || controlMenu;
        if (targetParent.querySelector('.clipper-tweet-save-btn')) return;
        Object.assign(iconContainer.style, {
          display: isCurrentPlatformEnabled() ? 'inline-flex' : 'none',
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
        const compPos = window.getComputedStyle(postEl).position;
        if (compPos === 'static' || compPos === '') postEl.style.position = 'relative';

        Object.assign(iconContainer.style, {
          position: 'absolute',
          top: '16px',
          right: '60px',
          width: '22px',
          height: '22px',
          zIndex: '50',
          display: isCurrentPlatformEnabled() ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        });
        postEl.appendChild(iconContainer);
      }
    } else {
      // YouTube Video Thumbnail Cards (Homepage, Search, Sidebar) / X / TikTok / Reddit
      const compPos = window.getComputedStyle(postEl).position;
      if (compPos === 'static' || compPos === '') {
        postEl.style.position = 'relative';
      }
      Object.assign(iconContainer.style, {
        position: 'absolute',
        top: '10px',
        right: isYouTube ? '10px' : '64px',
        width: '24px',
        height: '24px',
        zIndex: '50',
        display: isCurrentPlatformEnabled() ? 'flex' : 'none',
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

      renderPanelOverlay(text || document.title, postUrl, pos, detectedType);
    };

    root.render(<MicroIcon detectedType={detectedType} onClick={handleClick} />);
  } catch (err) {
    console.warn('[Clipper] processPost error:', err);
  }
}

// ─── Dedicated YouTube Watch Page & Shorts Injectors ───

function injectYouTubeShortsButtons() {
  try {
    if (!window.location.hostname.includes('youtube.com') || !window.location.pathname.includes('/shorts')) {
      return;
    }

    const isEnabled = isCurrentPlatformEnabled();
    const reels = document.querySelectorAll('ytd-reel-video-renderer[is-active], ytd-reel-video-renderer');

    reels.forEach((reel) => {
      // 1. Right Action Column Button (Like, Comment, Share column)
      const actionsCol = reel.querySelector('#actions.ytd-reel-player-overlay-renderer, div#actions');
      if (actionsCol && !actionsCol.querySelector('.clipper-shorts-action-btn')) {
        const actionBtn = document.createElement('div');
        actionBtn.className = 'clipper-shorts-action-btn';
        actionBtn.setAttribute('data-clipper-injected', 'true');
        actionBtn.setAttribute('data-clipper-panel', 'true');
        Object.assign(actionBtn.style, {
          display: isEnabled ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: '16px',
          userSelect: 'none',
        });

        actionBtn.innerHTML = `
          <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); border: 2px solid rgba(255, 255, 255, 0.2); transition: transform 0.16s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#ffffff"/>
            </svg>
          </div>
          <span style="font-size: 11px; font-weight: 600; color: #f4f4f5; margin-top: 4px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">Save</span>
        `;

        actionBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        actionBtn.addEventListener('mousedown', (e) => e.stopPropagation());
        actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const rect = actionBtn.getBoundingClientRect();
          const pos = getPanelPosition(rect, 280, 360);
          renderPanelOverlay(document.title, window.location.href, pos, 'video');
        });

        // Insert near the Share / Remix buttons in the vertical column
        const shareBtn = actionsCol.querySelector('#share-button, ytd-button-renderer#share-button') || actionsCol.firstChild;
        actionsCol.insertBefore(actionBtn, shareBtn);
      }

      // Clean up any legacy overlay buttons if present
      const oldTopBtn = reel.querySelector('.clipper-shorts-top-btn');
      if (oldTopBtn) oldTopBtn.remove();
    });

    // Ensure the sleek 28px floating button is placed right outside the active video frame
    ensureShortsTopButton();
  } catch (err) {
    // Ignore shorts injection errors
  }
}

// ─── Sleek 28px YouTube Shorts Floating Save Button (Body-anchored) ───
let shortsTopBtn: HTMLDivElement | null = null;

function updateShortsTopBtnPosition() {
  if (!shortsTopBtn) return;
  if (!window.location.hostname.includes('youtube.com') || !window.location.pathname.includes('/shorts')) {
    shortsTopBtn.style.display = 'none';
    return;
  }

  if (!isCurrentPlatformEnabled()) {
    shortsTopBtn.style.display = 'none';
    return;
  }

  const activeReel = document.querySelector('ytd-reel-video-renderer[is-active]') || document.querySelector('ytd-reel-video-renderer');
  if (!activeReel) {
    shortsTopBtn.style.display = 'none';
    return;
  }

  // Find the exact video player element
  const video = activeReel.querySelector('video') || activeReel.querySelector('#player-container') || activeReel.querySelector('.html5-video-player');
  if (video) {
    const vRect = video.getBoundingClientRect();
    if (vRect.width > 0 && vRect.right > 0) {
      const topPos = Math.max(16, Math.round(vRect.top + 16));
      // Snug: Placed literally 6px outside the right edge of the video frame
      const leftPos = Math.round(vRect.right + 6);
      shortsTopBtn.style.top = `${topPos}px`;
      shortsTopBtn.style.left = `${leftPos}px`;
      shortsTopBtn.style.right = 'auto';
      shortsTopBtn.style.display = 'flex';
      return;
    }
  }

  shortsTopBtn.style.display = 'none';
}

function ensureShortsTopButton() {
  if (!window.location.hostname.includes('youtube.com') || !window.location.pathname.includes('/shorts')) {
    if (shortsTopBtn) shortsTopBtn.style.display = 'none';
    return;
  }

  if (!shortsTopBtn) {
    shortsTopBtn = document.createElement('div');
    shortsTopBtn.id = 'clipper-shorts-top-btn';
    shortsTopBtn.className = 'clipper-shorts-top-btn';
    shortsTopBtn.setAttribute('data-clipper-injected', 'true');
    shortsTopBtn.setAttribute('data-clipper-panel', 'true');
    shortsTopBtn.title = 'Save Short to Clipper';
    Object.assign(shortsTopBtn.style, {
      position: 'fixed',
      width: '28px',
      height: '28px',
      borderRadius: '14px',
      background: 'rgba(15, 23, 42, 0.94)',
      border: '1.5px solid rgba(167, 139, 250, 0.75)',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6), 0 0 10px rgba(124, 58, 237, 0.35)',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '2147483640',
      backdropFilter: 'blur(8px)',
      transition: 'transform 0.15s ease, border-color 0.15s ease',
      pointerEvents: 'auto',
      userSelect: 'none',
    });

    shortsTopBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#a855f7" stroke="#c084fc" stroke-width="1.5"/>
      </svg>
    `;

    shortsTopBtn.onmouseover = () => {
      if (shortsTopBtn) {
        shortsTopBtn.style.transform = 'scale(1.1)';
        shortsTopBtn.style.borderColor = '#c084fc';
      }
    };
    shortsTopBtn.onmouseout = () => {
      if (shortsTopBtn) {
        shortsTopBtn.style.transform = 'scale(1)';
        shortsTopBtn.style.borderColor = 'rgba(167, 139, 250, 0.75)';
      }
    };

    shortsTopBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    shortsTopBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    shortsTopBtn.addEventListener('mouseup', (e) => e.stopPropagation());
    shortsTopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = shortsTopBtn!.getBoundingClientRect();
      const pos = getPanelPosition(rect, 280, 360);
      renderPanelOverlay(document.title, window.location.href, pos, 'video');
    });

    (document.body || document.documentElement).appendChild(shortsTopBtn);

    window.addEventListener('resize', updateShortsTopBtnPosition);
    document.addEventListener('scroll', updateShortsTopBtnPosition, true);
  }

  updateShortsTopBtnPosition();
}

function injectYouTubeWatchPageButton() {
  try {
    if (!window.location.hostname.includes('youtube.com') || !window.location.pathname.includes('/watch')) {
      return;
    }

    const isEnabled = isCurrentPlatformEnabled();
    // Target YouTube action buttons container under the main video: #top-level-buttons-computed, #actions.ytd-watch-metadata
    const topButtons = document.querySelector('#top-level-buttons-computed.ytd-watch-metadata, #actions.ytd-watch-metadata #top-level-buttons-computed, #menu #top-level-buttons-computed');

    if (topButtons && !topButtons.querySelector('.clipper-watch-action-btn')) {
      const btn = document.createElement('button');
      btn.className = 'clipper-watch-action-btn';
      btn.type = 'button';
      Object.assign(btn.style, {
        display: isEnabled ? 'inline-flex' : 'none',
        alignItems: 'center',
        gap: '6px',
        height: '36px',
        padding: '0 14px',
        backgroundColor: 'rgba(124, 58, 237, 0.16)',
        border: '1px solid rgba(167, 139, 250, 0.4)',
        borderRadius: '18px',
        color: '#f4f4f5',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        marginRight: '8px',
        transition: 'all 0.16s ease',
      });

      btn.innerHTML = `
        <span style="font-size: 15px;">📌</span>
        <span>Save to Clipper</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = btn.getBoundingClientRect();
        const pos = getPanelPosition(rect, 270, 320);
        renderPanelOverlay(document.title, window.location.href, pos, 'video');
      });

      topButtons.insertBefore(btn, topButtons.firstChild);
    }
  } catch (err) {
    // Ignore watch page injection errors
  }
}

function updateButtonsVisibility() {
  const enabled = isCurrentPlatformEnabled();
  const buttons = document.querySelectorAll('.clipper-tweet-save-btn, .clipper-shorts-action-btn, .clipper-shorts-top-btn, .clipper-watch-action-btn');
  buttons.forEach((btn) => {
    (btn as HTMLElement).style.display = enabled ? 'flex' : 'none';
  });
}

function scanPosts(config: PlatformConfig) {
  try {
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const isWatchPage = window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch');

    const selector = isWatchPage
      ? 'ytd-compact-video-renderer, ytd-rich-item-renderer'
      : isLinkedIn
      ? 'div.feed-shared-update-v2, div[data-view-name="feed-full-update"] > div, div.artdeco-card, div[data-urn*="urn:li:activity"]'
      : `${config.postSelector}, article[data-testid="tweet"], article[role="article"]`;

    const posts = document.querySelectorAll(selector);
    posts.forEach((post) => {
      const parentPost = post.parentElement?.closest('article, div.feed-shared-update-v2');
      if (!parentPost && !injectedPosts.has(post) && !post.hasAttribute('data-clipper-injected')) {
        processPost(post, config);
      }
    });

    // Run specialized YouTube injectors
    injectYouTubeShortsButtons();
    injectYouTubeWatchPageButton();
  } catch (err) {
    console.warn('[Clipper] scanPosts error:', err);
  }
}

// ─── Universal Native Share Dialog Integration (YouTube, TikTok, Instagram, X, LinkedIn, Reddit) ───

function setupUniversalShareIntegration() {
  try {
    const observer = new MutationObserver(() => {
      injectIntoYouTubeShareModal();
      injectIntoGenericSocialShareModal();
      injectYouTubeShortsButtons();
      injectYouTubeWatchPageButton();
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const shareBtn = target.closest(
        'button[aria-label*="Share"], button[title*="Share"], #share-button button, ytd-button-renderer#share-button, div[aria-label*="Share"], [data-e2e="share-icon"], svg[aria-label="Share Post"], svg[aria-label="Share"], [data-testid="share"]'
      );

      if (shareBtn) {
        setTimeout(injectIntoYouTubeShareModal, 100);
        setTimeout(injectIntoYouTubeShareModal, 300);
        setTimeout(injectIntoYouTubeShareModal, 600);
        setTimeout(injectIntoGenericSocialShareModal, 150);
        setTimeout(injectIntoGenericSocialShareModal, 400);
      }
    }, true);
  } catch (err) {
    console.warn('[Clipper] setupUniversalShareIntegration error:', err);
  }
}

function injectIntoYouTubeShareModal() {
  try {
    const targetsList = document.querySelector(
      'ytd-unified-share-panel-renderer #targets, #contents.ytd-unified-share-panel-renderer #targets, #targets.yt-third-party-share-target-section-renderer, tp-yt-paper-dialog #targets, #share-targets'
    );

    if (targetsList && !targetsList.querySelector('.clipper-share-circular-target')) {
      const clipperTarget = document.createElement('div');
      clipperTarget.className = 'clipper-share-circular-target';
      Object.assign(clipperTarget.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '64px',
        cursor: 'pointer',
        flexShrink: '0',
        marginRight: '12px',
        userSelect: 'none',
      });

      clipperTarget.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a855f7); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45); border: 2px solid rgba(255, 255, 255, 0.25); transition: transform 0.16s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#ffffff" stroke="#ffffff" stroke-width="0.5"/>
          </svg>
        </div>
        <span style="font-size: 11px; font-weight: 600; color: #f4f4f5; margin-top: 6px; text-align: center; white-space: nowrap;">Clipper</span>
      `;

      clipperTarget.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();

        const shareInput = document.querySelector('input#share-url, input.style-scope.yt-copy-link-renderer') as HTMLInputElement | null;
        const videoUrl = shareInput?.value?.trim() || window.location.href;

        const closeBtn = document.querySelector(
          'ytd-unified-share-panel-renderer #close-button, tp-yt-paper-dialog button[aria-label*="Close"], ytd-unified-share-panel-renderer yt-icon-button#close-button'
        ) as HTMLElement | null;
        if (closeBtn) closeBtn.click();

        const centerPos = {
          left: Math.max(20, window.innerWidth / 2 - 135),
          top: Math.max(20, window.innerHeight / 2 - 160),
        };
        renderPanelOverlay(document.title, videoUrl, centerPos, 'video');
      });

      targetsList.insertBefore(clipperTarget, targetsList.firstChild);
    }
  } catch (err) {
    // Ignore share injection errors
  }
}

function injectIntoGenericSocialShareModal() {
  try {
    const isTikTok = window.location.hostname.includes('tiktok.com');
    const isInstagram = window.location.hostname.includes('instagram.com');
    const isTwitter = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');

    // ─── TikTok Share Modal ───
    if (isTikTok) {
      const tiktokShareRow = document.querySelector('[data-e2e="share-group"], div[class*="ShareGroup"], div.tiktok-share-popup');
      if (tiktokShareRow && !tiktokShareRow.querySelector('.clipper-share-circular-target')) {
        const clipperTarget = document.createElement('div');
        clipperTarget.className = 'clipper-share-circular-target';
        Object.assign(clipperTarget.style, {
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          marginRight: '12px',
        });
        clipperTarget.innerHTML = `
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #7c3aed; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#fff"/></svg>
          </div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Clipper</span>
        `;
        clipperTarget.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const centerPos = { left: Math.max(20, window.innerWidth / 2 - 135), top: Math.max(20, window.innerHeight / 2 - 160) };
          renderPanelOverlay(document.title, window.location.href, centerPos, 'video');
        });
        tiktokShareRow.insertBefore(clipperTarget, tiktokShareRow.firstChild);
      }
    }

    // ─── Instagram Share Modal ───
    if (isInstagram) {
      const igShareDialog = document.querySelector('div[role="dialog"] div[aria-label*="Share"], div[role="dialog"] div._ab8w._ab94');
      if (igShareDialog && !igShareDialog.querySelector('.clipper-share-banner-target')) {
        const banner = document.createElement('div');
        banner.className = 'clipper-share-banner-target';
        Object.assign(banner.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          margin: '10px 16px',
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          border: '1px solid rgba(167, 139, 250, 0.4)',
          borderRadius: '10px',
          cursor: 'pointer',
        });
        banner.innerHTML = `
          <div style="width: 28px; height: 28px; border-radius: 6px; background: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px;">📌</div>
          <div style="font-size: 13px; font-weight: 600; color: #f4f4f5;">Save to Clipper Vault</div>
        `;
        banner.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const centerPos = { left: Math.max(20, window.innerWidth / 2 - 135), top: Math.max(20, window.innerHeight / 2 - 160) };
          renderPanelOverlay(document.title, window.location.href, centerPos, 'video');
        });
        igShareDialog.insertBefore(banner, igShareDialog.firstChild);
      }
    }

    // ─── Twitter / X Dropdown Menu ───
    if (isTwitter) {
      const twitterMenu = document.querySelector('div[data-testid="Dropdown"], div[role="menu"]');
      if (twitterMenu && !twitterMenu.querySelector('.clipper-twitter-menu-item')) {
        const item = document.createElement('div');
        item.className = 'clipper-twitter-menu-item';
        Object.assign(item.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
          color: '#f4f4f5',
          fontSize: '14px',
          fontWeight: '500',
        });
        item.innerHTML = `<span>📌</span> <span>Save with Clipper</span>`;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const centerPos = { left: Math.max(20, window.innerWidth / 2 - 135), top: Math.max(20, window.innerHeight / 2 - 160) };
          renderPanelOverlay(document.title, window.location.href, centerPos, 'tweet');
        });
        twitterMenu.insertBefore(item, twitterMenu.firstChild);
      }
    }
  } catch (err) {
    // Ignore generic share errors
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

  async main() {
    try {
      const config = getPlatformConfig();
      if (!config) return;

      activeSettings = await getFeedButtonSettings();

      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener((changes: any) => {
          if (changes.feed_button_settings) {
            activeSettings = changes.feed_button_settings.newValue || DEFAULT_FEED_SETTINGS;
            updateButtonsVisibility();
          }
        });
      }

      if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
          if (message.type === 'OPEN_SELECTION_PANEL') {
            const text = message.data?.text || document.title || '';
            const url = message.data?.url || window.location.href;
            const contentType = message.data?.contentType || 'video';
            const pos = message.data?.position || {
              left: Math.max(20, window.innerWidth / 2 - 135),
              top: Math.max(20, window.innerHeight / 2 - 160),
            };
            renderPanelOverlay(text, url, pos, contentType);
            sendResponse({ ok: true });
            return true;
          }
          return false;
        });
      }

      setupUniversalShareIntegration();

      scanPosts(config);

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

      setInterval(() => {
        scanPosts(config);
      }, 1200);
    } catch (err) {
      console.warn('[Clipper] feedDetector main error:', err);
    }
  },
});
