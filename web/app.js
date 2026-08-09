// ══════════════════════════════════════════
// SIDEBAR NAVIGATION & ROUTING
// ══════════════════════════════════════════

const sidebarItems = document.querySelectorAll('.nav-item');

sidebarItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    sidebarItems.forEach((node) => node.classList.remove('active'));
    event.currentTarget.classList.add('active');
  });
});

// ══════════════════════════════════════════
// ANIMATED NUMBER COUNTER
// ══════════════════════════════════════════

function animateCounter(element, target, duration = 800) {
  if (!element) return;
  let start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ══════════════════════════════════════════
// BACKEND DASHBOARD API INTEGRATION
// ══════════════════════════════════════════

const API_BASE = 'http://127.0.0.1:8000/api';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('clipper_access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getStoredUser() {
  const raw = localStorage.getItem('clipper_user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderUserProfile() {
  const user = getStoredUser();
  const card = document.getElementById('user-profile-card');
  const greetingEl = document.getElementById('user-greeting');

  if (user) {
    if (greetingEl) greetingEl.textContent = `Welcome back, ${user.name} 👋`;
    if (card) {
      card.style.display = 'flex';
      const nameEl = document.getElementById('sidebar-user-name');
      const emailEl = document.getElementById('sidebar-user-email');
      const avatarEl = document.getElementById('user-avatar-initials');

      if (nameEl) nameEl.textContent = user.name || 'User Account';
      if (emailEl) emailEl.textContent = user.email || '';
      if (avatarEl) {
        avatarEl.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
      }
    }
  } else if (card) {
    card.style.display = 'none';
  }
}

async function fetchDashboardData() {
  renderUserProfile();
  try {
    const res = await fetch(`${API_BASE}/clips/dashboard/`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    console.warn('Backend API unavailable, using local state:', err);
    const user = getStoredUser() || { name: 'Tadiwos', email: 'tadiwos@save.app' };
    renderDashboard({
      user: user,
      stats: { total_clips: 47, saved_this_week: 12, jobs_saved: 5, active_destinations: 2 },
      ai_digest_highlight: {
        title: 'Weekly AI Digest & Priority Highlights',
        summary: 'You saved 12 items this week. Gemini AI detected high-priority opportunities including 2 remote software engineering roles and 1 research article.',
        action_needed_count: 3
      },
      recent_clips: [
        { id: '1', title: 'Senior Software Engineer - Stripe', url: 'https://linkedin.com/jobs/view/394', content_type: 'job', status: 'done', export_status: 'done', created_at: new Date().toISOString() },
        { id: '2', title: 'Attention Is All You Need Paper', url: 'https://arxiv.org/abs/1706.03762', content_type: 'article', status: 'done', export_status: 'done', created_at: new Date().toISOString() },
        { id: '3', title: 'Y Combinator Winter 2026 Batch', url: 'https://ycombinator.com/apply', content_type: 'event', status: 'processing', export_status: 'processing', created_at: new Date().toISOString() }
      ],
      destinations_status: [
        { provider: 'google_sheets', name: 'Google Sheets', connected: true, status: 'active' },
        { provider: 'notion', name: 'Notion Workspace', connected: true, status: 'active' },
        { provider: 'airtable', name: 'Airtable Base', connected: false, status: 'not_configured' }
      ]
    });
  }
}

function renderDashboard(data) {
  // 1. User Greeting
  const greetingEl = document.getElementById('user-greeting');
  const storedUser = getStoredUser();
  const activeUser = storedUser || data.user;
  if (greetingEl && activeUser) {
    greetingEl.textContent = `Welcome back, ${activeUser.name} 👋`;
  }

  // 2. Stats Counters
  if (data.stats) {
    animateCounter(document.getElementById('stat-total-clips'), data.stats.total_clips);
    animateCounter(document.getElementById('stat-saved-week'), data.stats.saved_this_week);
    animateCounter(document.getElementById('stat-jobs-saved'), data.stats.jobs_saved);
    animateCounter(document.getElementById('stat-active-destinations'), data.stats.active_destinations);

    const navUsageText = document.getElementById('nav-usage-text');
    if (navUsageText) {
      navUsageText.textContent = `${data.stats.total_clips} / 100 clips`;
    }
  }

  // 3. AI Digest Highlight Card
  if (data.ai_digest_highlight) {
    const titleEl = document.getElementById('ai-digest-title');
    const summaryEl = document.getElementById('ai-digest-summary');
    const actionBadge = document.getElementById('ai-action-count');

    if (titleEl) titleEl.textContent = data.ai_digest_highlight.title;
    if (summaryEl) summaryEl.textContent = data.ai_digest_highlight.summary;
    if (actionBadge) {
      actionBadge.textContent = `${data.ai_digest_highlight.action_needed_count} items need action`;
    }
  }

  // 4. Recent Activity Feed List
  const recentListEl = document.getElementById('recent-clips-list');
  if (recentListEl && data.recent_clips) {
    if (data.recent_clips.length === 0) {
      recentListEl.innerHTML = `
        <div class="empty-state" style="padding: 20px; text-align: center; color: var(--muted);">
          No clips saved yet. Paste a link above to get started!
        </div>
      `;
    } else {
      recentListEl.innerHTML = data.recent_clips.map(clip => {
        const domain = getDomain(clip.url);
        const icon = clip.content_type === 'job' ? '💼' : clip.content_type === 'article' ? '📄' : '🔗';
        const dateStr = clip.created_at ? new Date(clip.created_at).toLocaleDateString() : '';
        const badgeClass = clip.export_status === 'done' ? 'done' : clip.status === 'processing' ? 'processing' : clip.status === 'failed' ? 'failed' : 'done';

        return `
          <div class="activity-item">
            <div class="activity-icon">${icon}</div>
            <div class="activity-details">
              <a href="${clip.url}" target="_blank" rel="noopener" class="activity-title">${escapeHtml(clip.title || clip.url)}</a>
              <div class="activity-meta">Saved from <strong>${domain}</strong> • ${dateStr}</div>
            </div>
            <span class="status-badge ${badgeClass}">${clip.export_status || clip.status}</span>
          </div>
        `;
      }).join('');
    }
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ══════════════════════════════════════════
// QUICK URL SAVE FORM SUBMISSION
// ══════════════════════════════════════════

function setupQuickSaveForm() {
  const form = document.getElementById('quick-save-form');
  const input = document.getElementById('quick-save-url');
  const btn = document.getElementById('quick-save-btn');
  const feedback = document.getElementById('quick-save-feedback');

  if (!form || !input) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;

    btn.disabled = true;
    btn.innerHTML = '<span>Processing...</span>';
    feedback.className = 'quick-save-feedback';
    feedback.textContent = 'Saving link and triggering Gemini AI summarizer...';

    try {
      const res = await fetch(`${API_BASE}/clips/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url })
      });

      if (!res.ok) throw new Error('Failed to save link');
      const savedClip = await res.json();

      feedback.className = 'quick-save-feedback success';
      feedback.textContent = `✓ Successfully saved "${savedClip.title || url}"! Queued background worker.`;
      input.value = '';

      // Refresh dashboard live metrics
      setTimeout(fetchDashboardData, 1000);
    } catch (err) {
      console.error(err);
      feedback.className = 'quick-save-feedback error';
      feedback.textContent = 'Failed to save clip. Please verify backend is running on http://127.0.0.1:8000';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Save to Clipper</span>';
    }
  });
}

// ══════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  fetchDashboardData();
  setupQuickSaveForm();

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    localStorage.removeItem('clipper_user');
    window.location.href = './landing.html';
  });
});
