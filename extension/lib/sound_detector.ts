/**
 * Universal Client-Side Sound & Music Metadata Detector
 * Extracts native music badges, tickers, and sound tags directly from
 * YouTube Shorts, Instagram Reels, TikTok, Facebook, and Twitter/X
 * without requiring any page navigation or backend HTML downloading (0 MB RAM).
 */

export interface PageAudioHintResult {
  hint: string;
  source: 'youtube_shorts' | 'youtube_watch' | 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'title';
  isOfficialTrack: boolean;
}

export function detectPageAudioHint(): string {
  const result = detectComprehensiveAudioHint();
  return result.hint;
}

export function detectComprehensiveAudioHint(): PageAudioHintResult {
  try {
    const host = window.location.hostname.toLowerCase();
    const href = window.location.href.toLowerCase();

    // ─── 1. YouTube Shorts ───
    if (host.includes('youtube.com') && href.includes('/shorts')) {
      const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]') || document;

      // A. "Contains [Song Name]" badge (e.g., "Contains Summertime Sadness")
      const textElements = Array.from(activeShort.querySelectorAll('span, yt-formatted-string, a, div'));
      for (const el of textElements) {
        const txt = (el.textContent || '').trim();
        if (/^Contains\s+/i.test(txt) && txt.length > 9 && txt.length < 100) {
          const songTitle = txt.replace(/^Contains\s+/i, '').trim();
          return { hint: songTitle, source: 'youtube_shorts', isOfficialTrack: true };
        }
      }

      // B. YouTube Shorts Sound Metadata element / Link
      const soundModel = activeShort.querySelector<HTMLElement>(
        '.yt-shorts-sound-metadata-view-model, a[href*="/sound/"], [aria-label*="audio"], [aria-label*="sound"]'
      );
      if (soundModel && soundModel.textContent?.trim()) {
        const cleanSound = soundModel.textContent.trim().replace(/^Contains\s+/i, '').trim();
        if (cleanSound && cleanSound.length > 2) {
          return { hint: cleanSound, source: 'youtube_shorts', isOfficialTrack: true };
        }
      }
    }

    // ─── 2. YouTube Standard Watch Page (/watch?v=) ───
    if (host.includes('youtube.com') && href.includes('/watch')) {
      // Check description "Music in this video" metadata rows
      const metadataRows = Array.from(document.querySelectorAll('ytd-metadata-row-renderer'));
      let songName = '';
      let artistName = '';

      for (const row of metadataRows) {
        const label = row.querySelector('#title')?.textContent?.trim().toLowerCase() || '';
        const value = row.querySelector('#default-metadata, yt-formatted-string')?.textContent?.trim() || '';
        if (label.includes('song') || label.includes('music')) {
          songName = value;
        } else if (label.includes('artist')) {
          artistName = value;
        }
      }

      if (songName) {
        const hint = artistName ? `${songName} - ${artistName}` : songName;
        return { hint, source: 'youtube_watch', isOfficialTrack: true };
      }

      // Clean the standard YouTube video title
      const rawTitle = document.querySelector('h1.ytd-watch-metadata, #title h1')?.textContent?.trim() || document.title || '';
      const cleanTitle = cleanVideoTitle(rawTitle);
      if (cleanTitle) {
        return { hint: cleanTitle, source: 'youtube_watch', isOfficialTrack: false };
      }
    }

    // ─── 3. Instagram (Reels, Posts, Stories) ───
    if (host.includes('instagram.com')) {
      // Look for audio link / musical note icon
      const audioLink = document.querySelector<HTMLElement>(
        'a[href*="/audio/"], a[href*="/reels/audio/"], [aria-label*="Audio"], [aria-label*="audio"], [role="link"][href*="/audio/"]'
      );
      if (audioLink && audioLink.textContent?.trim()) {
        const text = audioLink.textContent.trim();
        // Format often: "Song Name · Artist" or "Original audio · username"
        const cleanAudio = text.replace(/^[•·\s]+/, '').trim();
        if (cleanAudio && !cleanAudio.toLowerCase().startsWith('original audio')) {
          return { hint: cleanAudio, source: 'instagram', isOfficialTrack: true };
        }
      }

      // Check header subtitle in Reels or Post Modal
      const reelSoundText = Array.from(document.querySelectorAll('span, div, a')).find(el => {
        const t = (el.textContent || '').trim();
        return t.includes(' · ') && (t.includes('Audio') || t.includes('audio') || el.querySelector('svg[aria-label*="Audio"]'));
      });
      if (reelSoundText && reelSoundText.textContent?.trim()) {
        const text = reelSoundText.textContent.trim().replace(/^Original audio\s*[·•]\s*/i, '');
        return { hint: text, source: 'instagram', isOfficialTrack: false };
      }
    }

    // ─── 4. TikTok (Videos & Tickers) ───
    if (host.includes('tiktok.com')) {
      // Official music anchor on TikTok
      const musicLink = document.querySelector<HTMLElement>(
        'a[href*="/music/"], [data-e2e="video-music"], [data-e2e="user-post-item-desc"] a[href*="/music/"]'
      );
      if (musicLink && musicLink.textContent?.trim()) {
        const raw = musicLink.textContent.trim();
        const clean = raw.replace(/^original sound\s*-\s*/i, '').trim();
        if (clean && clean.length > 2) {
          return { hint: clean, source: 'tiktok', isOfficialTrack: true };
        }
      }

      // Music marquee ticker
      const ticker = document.querySelector<HTMLElement>('[class*="MusicText"], [class*="StyledMusic"], [class*="MusicTitle"]');
      if (ticker && ticker.textContent?.trim()) {
        const clean = ticker.textContent.trim().replace(/^original sound\s*-\s*/i, '').trim();
        return { hint: clean, source: 'tiktok', isOfficialTrack: true };
      }
    }

    // ─── 5. Facebook Watch & Reels ───
    if (host.includes('facebook.com')) {
      const fbAudio = document.querySelector<HTMLElement>('a[href*="/audio/"], [aria-label*="audio"], [aria-label*="music"]');
      if (fbAudio && fbAudio.textContent?.trim()) {
        return { hint: fbAudio.textContent.trim(), source: 'facebook', isOfficialTrack: true };
      }
    }

    // ─── 6. Twitter / X ───
    if (host.includes('twitter.com') || host.includes('x.com')) {
      const tweetText = document.querySelector('[data-testid="tweetText"]')?.textContent?.trim();
      if (tweetText && tweetText.length > 5 && tweetText.length < 100) {
        return { hint: tweetText, source: 'twitter', isOfficialTrack: false };
      }
    }
  } catch (err) {
    console.warn('[Clipper] detectPageAudioHint error:', err);
  }

  // ─── 7. Fallback: Cleaned document.title ───
  return {
    hint: cleanVideoTitle(document.title || ''),
    source: 'title',
    isOfficialTrack: false,
  };
}

/**
 * Removes noisy social media suffixes, hashtags, emojis, and official tags
 * e.g. "Song Name (Official Music Video) [Lyrics] #shorts - YouTube" -> "Song Name"
 */
export function cleanVideoTitle(title: string): string {
  if (!title) return '';

  let cleaned = title
    // Strip website branding
    .replace(/\s*-\s*YouTube$/i, '')
    .replace(/\s*\|\s*Instagram$/i, '')
    .replace(/\s*\|\s*TikTok$/i, '')
    .replace(/\s*\|\s*X$/i, '')
    // Strip common video/audio suffixes
    .replace(/\s*[\[\(](?:official\s*(?:music\s*)?(?:video|audio|visualizer|lyric\s*video)|lyrics|full\s*song|remix|hd|4k)[\]\)]/gi, '')
    // Strip hashtags and handles
    .replace(/#[a-zA-Z0-9_]+/g, '')
    .replace(/@[a-zA-Z0-9_.]+/g, '')
    // Strip emojis
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Clean whitespace and separator trails
    .replace(/\s*[\-\|•]\s*$/, '')
    .trim();

  return cleaned || title.trim();
}
