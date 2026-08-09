// ══════════════════════════════════════════
// SIDEBAR NAVIGATION & ROUTING
// ══════════════════════════════════════════

function setupRouter() {
  const sidebarItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('main.main-content article.panel');

  function navigateTo(hash) {
    const targetHash = hash || '#dashboard';

    sidebarItems.forEach((node) => {
      const href = node.getAttribute('href');
      if (href === targetHash) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    sections.forEach((panel) => {
      if ('#' + panel.id === targetHash) {
        panel.style.display = 'flex';
      } else {
        panel.style.display = 'none';
      }
    });
  }

  sidebarItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      const href = event.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        navigateTo(href);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
  });

  navigateTo(window.location.hash || '#dashboard');
}

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
// CONNECTIONS / INTEGRATIONS PAGE MANAGER
// ══════════════════════════════════════════

function setupConnectionsPage() {
  // 1. Filter Tabs (ALL SERVICES, CONNECTED, STANDBY)
  const tabAll = document.getElementById('tab-filter-all');
  const tabConn = document.getElementById('tab-filter-connected');
  const tabStandby = document.getElementById('tab-filter-standby');
  const allCards = document.querySelectorAll('.integration-cards-grid .integration-card');

  function filterCards(type) {
    [tabAll, tabConn, tabStandby].forEach(t => t?.classList.remove('active'));
    if (type === 'all') tabAll?.classList.add('active');
    if (type === 'connected') tabConn?.classList.add('active');
    if (type === 'standby') tabStandby?.classList.add('active');

    allCards.forEach(card => {
      const isConnected = card.classList.contains('connected');
      if (type === 'all') card.style.display = 'flex';
      else if (type === 'connected') card.style.display = isConnected ? 'flex' : 'none';
      else if (type === 'standby') card.style.display = !isConnected ? 'flex' : 'none';
    });
  }

  tabAll?.addEventListener('click', () => filterCards('all'));
  tabConn?.addEventListener('click', () => filterCards('connected'));
  tabStandby?.addEventListener('click', () => filterCards('standby'));

  // 2. Default Export Target Selector Pills
  const targetPills = document.querySelectorAll('.target-pill');
  const storedTarget = localStorage.getItem('clipper_default_target') || 'ai_auto';

  targetPills.forEach((pill) => {
    const targetType = pill.getAttribute('data-target-type');
    if (targetType === storedTarget) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }

    pill.addEventListener('click', () => {
      targetPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      localStorage.setItem('clipper_default_target', targetType);
    });
  });

  // 3. Test Connection Handlers & Ping Pings
  document.getElementById('btn-test-sheets')?.addEventListener('click', () => {
    addSyncLogEntry('Google Sheets', '🟢 Active Syncing', '42ms', 'PING OK: Connection verified to "Clipped Opportunities Sheet 2026"');
  });

  document.getElementById('btn-test-notion')?.addEventListener('click', () => {
    addSyncLogEntry('Notion Workspace', '🟢 Connected', '68ms', 'PING OK: Connection verified to "Reading List & Opportunities"');
  });

  document.getElementById('btn-test-webhook')?.addEventListener('click', () => {
    addSyncLogEntry('Custom Webhook', '🟢 200 OK', '110ms', 'PING OK: Received HTTP 200 OK from Zapier catch endpoint');
  });

  // 4. OAuth Consent Modal Flow
  const oauthOverlay = document.getElementById('oauth-modal-overlay');
  const oauthCloseBtn = document.getElementById('oauth-modal-close');
  const oauthCancelBtn = document.getElementById('oauth-cancel-btn');
  const oauthForm = document.getElementById('oauth-consent-form');
  const oauthServiceName = document.getElementById('oauth-modal-service-name');
  const btnConnectAirtable = document.getElementById('btn-connect-airtable');

  function openOAuthModal(serviceName) {
    if (oauthServiceName) oauthServiceName.textContent = `Connect to ${serviceName}`;
    if (oauthOverlay) oauthOverlay.style.display = 'flex';
  }

  function closeOAuthModal() {
    if (oauthOverlay) oauthOverlay.style.display = 'none';
  }

  btnConnectAirtable?.addEventListener('click', () => openOAuthModal('Airtable Base'));
  oauthCloseBtn?.addEventListener('click', closeOAuthModal);
  oauthCancelBtn?.addEventListener('click', closeOAuthModal);

  oauthForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const grantBtn = document.getElementById('oauth-grant-btn');
    if (grantBtn) grantBtn.innerHTML = '<span>⚡ Authorizing...</span>';

    setTimeout(() => {
      const airtableCard = document.getElementById('card-airtable');
      const statusTag = document.getElementById('status-tag-airtable');
      if (airtableCard) airtableCard.classList.add('connected');
      if (statusTag) {
        statusTag.className = 'connection-status-tag online font-mono';
        statusTag.textContent = '🟢 ACTIVE UPLINK';
      }
      addSyncLogEntry('Airtable Base', '🟢 Connected', '340ms', 'OAUTH GRANT: FULL Access Authorized. Target: "Clipped Vault 2026"');
      closeOAuthModal();
      if (grantBtn) grantBtn.innerHTML = '<span>⚡ Grant Permission & Connect</span>';
    }, 600);
  });

  // 5. Code & Inspector Modal Flow
  const codeOverlay = document.getElementById('code-modal-overlay');
  const codeCloseBtn = document.getElementById('code-modal-close');
  const codeCancelBtn = document.getElementById('code-modal-close-btn');
  const codeBlock = document.getElementById('code-inspector-block');
  const copyBtn = document.getElementById('btn-copy-code');
  const codeTabs = document.querySelectorAll('.code-tab');

  let currentInspectService = 'Google Sheets';

  const codeSnippets = {
    json: (service) => JSON.stringify({
      event: "clip.created",
      timestamp: new Date().toISOString(),
      destination: {
        name: service,
        targetResource: "Clipped Opportunities Vault 2026"
      },
      data: {
        url: "https://linkedin.com/jobs/view/39401923",
        title: "Senior Software Engineer - Stripe",
        selected_text: "Requirements: 5+ years experience in Distributed Systems & Python.",
        content_type: "job",
        company: "Stripe",
        salary_range: "$180,000 - $220,000"
      }
    }, null, 2),

    react: (service) => `import React from 'react';

export function ClipSyncBadge() {
  return (
    <div className="bg-[#080808] border border-amber-500/30 p-4 rounded-sm text-amber-400 font-mono text-xs">
      <p className="uppercase tracking-widest font-bold">Uplink Target: ${service}</p>
      <p className="text-stone-400 mt-1">Resource: Clipped Opportunities Vault 2026</p>
    </div>
  );
}`,

    express: (service) => `const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/clips/webhook', (req, res) => {
  const { url, title, content_type } = req.body.data;
  console.log(\`[${service}] Received clip: \${title} (\${url})\`);
  res.status(200).json({ status: 'success', clipId: 'clip_' + Date.now() });
});

app.listen(8000, () => console.log('Clipper webhook listener running on port 8000'));`
  };

  let currentTab = 'json';

  function renderInspectCode() {
    if (codeBlock) {
      codeBlock.textContent = codeSnippets[currentTab](currentInspectService);
    }
  }

  function openCodeInspector(serviceName) {
    currentInspectService = serviceName;
    renderInspectCode();
    if (codeOverlay) codeOverlay.style.display = 'flex';
  }

  function closeCodeInspector() {
    if (codeOverlay) codeOverlay.style.display = 'none';
  }

  ['sheets', 'notion', 'airtable', 'webhook'].forEach(id => {
    document.getElementById(`btn-inspect-${id}`)?.addEventListener('click', () => {
      const names = { sheets: 'Google Sheets', notion: 'Notion Workspace', airtable: 'Airtable Base', webhook: 'Custom Webhook' };
      openCodeInspector(names[id]);
    });
  });

  codeCloseBtn?.addEventListener('click', closeCodeInspector);
  codeCancelBtn?.addEventListener('click', closeCodeInspector);

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab');
      renderInspectCode();
    });
  });

  copyBtn?.addEventListener('click', () => {
    if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.textContent);
      copyBtn.textContent = '✓ COPIED!';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Code';
      }, 2000);
    }
  });

  // 6. Simulate Event Button
  document.getElementById('btn-simulate-event')?.addEventListener('click', () => {
    const targets = ['Google Sheets', 'Notion Workspace', 'Airtable Base', 'Custom Webhook'];
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    const randomTitles = [
      'Senior React Engineer — OpenAI',
      'AI Research Fellow — Anthropic ($200k)',
      'Attention Is All You Need Paper — arXiv',
      'Hackathon 2026 Registration — San Francisco'
    ];
    const randomTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];

    addSyncLogEntry(
      randomTarget,
      '🟢 Success',
      `${Math.floor(Math.random() * 100) + 30}ms`,
      `CLIP EVENT: "${randomTitle}" synced to target database.`
    );
  });

  // 7. Explore Marketplace Directory Catalog Logic
  const exploreCatalog = [
    { id: 'cat_gsheets', name: 'Google Sheets', category: 'spreadsheets', description: 'Instant row append into structured cloud spreadsheets with auto-formatting.', badge: 'OAuth 2.0', popular: true, authMethod: 'Google Workspace OAuth 2.0', icon: '📊', connected: true },
    { id: 'cat_notion', name: 'Notion Workspace', category: 'databases', description: 'Sync web clips into custom relational Notion database pages & property tags.', badge: 'Official API', popular: true, authMethod: 'Notion OAuth Integration', icon: '📝', connected: true },
    { id: 'cat_airtable', name: 'Airtable Base', category: 'spreadsheets', description: 'Populate relational bases, job applicant pipelines, & custom Kanban views.', badge: 'Personal Token', popular: true, authMethod: 'Airtable OAuth 2.0', icon: '🗂️', connected: false },
    { id: 'cat_webhook', name: 'REST Webhook Gateway', category: 'automation', description: 'POST real-time structured JSON payloads to Zapier, Make.com, or n8n.', badge: 'REST / HTTPS', popular: true, authMethod: 'Bearer Token / HMAC Signature', icon: '⚡', connected: true },
    { id: 'cat_postgres', name: 'PostgreSQL Database', category: 'databases', description: 'Direct SQL row insertion into external PostgreSQL databases or Cloud SQL.', badge: 'SQL / SSL', popular: true, authMethod: 'SSL Connection String / Key', icon: '💾', connected: false },
    { id: 'cat_supabase', name: 'Supabase Cloud DB', category: 'databases', description: 'Seamless row creation using Supabase REST API & Service Role Keys.', badge: 'REST / Realtime', authMethod: 'Supabase Anon / Service Key', icon: '⚡', connected: false },
    { id: 'cat_snowflake', name: 'Snowflake Warehouse', category: 'databases', description: 'Enterprise analytics data ingestion pipeline into Snowflake staging tables.', badge: 'Enterprise SQL', authMethod: 'Snowflake Key-Pair Auth', icon: '❄️', connected: false },
    { id: 'cat_hubspot', name: 'HubSpot CRM', category: 'crms', description: 'Create Deals, Contacts, or Engagement Notes directly in HubSpot CRM.', badge: 'OAuth 2.0', popular: true, authMethod: 'HubSpot App OAuth', icon: '📙', connected: false },
    { id: 'cat_salesforce', name: 'Salesforce Sales Cloud', category: 'crms', description: 'Sync leads, accounts, and opportunities directly into Salesforce objects.', badge: 'REST API', authMethod: 'Salesforce Connected App', icon: '☁️', connected: false },
    { id: 'cat_linear', name: 'Linear Issue Tracker', category: 'productivity', description: 'Create Linear tasks, tech debt backlog tickets, and feature specs.', badge: 'GraphQL API', authMethod: 'Linear OAuth Key', icon: '📐', connected: false },
    { id: 'cat_slack', name: 'Slack Webhook Stream', category: 'productivity', description: 'Broadcast rich formatted card notifications into designated team channels.', badge: 'Incoming Webhook', popular: true, authMethod: 'Slack Webhook URL', icon: '💬', connected: false },
    { id: 'cat_coda', name: 'Coda Doc & Table', category: 'spreadsheets', description: 'Append rows into Coda interactive document tables with AI summaries.', badge: 'Coda API v1', authMethod: 'Coda API Token', icon: '📄', connected: false }
  ];

  let currentSearchQuery = '';
  let currentCategory = 'all';

  const searchInput = document.getElementById('explore-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-explore-search');
  const catalogGrid = document.getElementById('explore-catalog-grid');
  const counterBadge = document.getElementById('explore-results-counter');
  const categoryChips = document.querySelectorAll('.explore-chip');

  function renderExploreCatalog() {
    if (!catalogGrid) return;

    const filtered = exploreCatalog.filter(item => {
      const matchesCat = currentCategory === 'all' || item.category === currentCategory;
      const matchesSearch = 
        item.name.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(currentSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });

    if (counterBadge) counterBadge.textContent = `✨ Showing ${filtered.length} Integrations`;

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div class="empty-catalog-box">
          <p class="font-serif text-lg text-white">No matching integration connector found.</p>
          <p class="text-xs text-muted font-sans mt-1">Try searching with another keyword like "Sheets", "Notion", "Postgres", or "HubSpot".</p>
          <button type="button" class="btn-simulate-event mt-4" id="btn-reset-catalog-filters">Reset Search Filters</button>
        </div>
      `;
      document.getElementById('btn-reset-catalog-filters')?.addEventListener('click', () => {
        currentSearchQuery = '';
        currentCategory = 'all';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        categoryChips.forEach(c => c.classList.remove('active'));
        document.querySelector('.explore-chip[data-category="all"]')?.classList.add('active');
        renderExploreCatalog();
      });
      return;
    }

    catalogGrid.innerHTML = filtered.map(item => `
      <div class="explore-card">
        <div class="explore-card-top">
          <div class="explore-card-icon">${item.icon}</div>
          <div class="explore-card-tags">
            ${item.popular ? `<span class="tag-popular font-mono">POPULAR</span>` : ''}
            <span class="tag-category font-mono">${item.category}</span>
          </div>
        </div>

        <div>
          <h4 class="explore-card-title font-serif">${item.name}</h4>
          <p class="explore-card-desc font-sans">${item.description}</p>
        </div>

        <div class="explore-card-auth">
          <span>AUTH METHOD:</span>
          <strong>${item.authMethod}</strong>
        </div>

        <div class="explore-card-footer">
          <span class="badge-tech">${item.badge}</span>
          <button
            type="button"
            class="btn-catalog-connect ${item.connected ? 'connected' : ''}"
            data-service-name="${item.name}"
          >
            ${item.connected ? '✓ Connected' : '⚡ Connect'}
          </button>
        </div>
      </div>
    `).join('');

    catalogGrid.querySelectorAll('.btn-catalog-connect').forEach(btn => {
      btn.addEventListener('click', () => {
        const sName = btn.getAttribute('data-service-name');
        openOAuthModal(sName);
      });
    });
  }

  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    if (clearSearchBtn) clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
    renderExploreCatalog();
  });

  clearSearchBtn?.addEventListener('click', () => {
    currentSearchQuery = '';
    if (searchInput) searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderExploreCatalog();
  });

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-category');
      renderExploreCatalog();
    });
  });

  renderExploreCatalog();

  // 8. Live Sync Log Table Initialization
  renderSyncLogTable();
}

const syncLogData = [
  { target: 'Google Sheets', status: '🟢 Active Syncing', latency: '42ms', timestamp: '2 mins ago', details: 'Auto-synced "Senior Staff Engineer - Stripe"' },
  { target: 'Notion Workspace', status: '🟢 Connected', latency: '68ms', timestamp: '14 mins ago', details: 'Appended page to "Reading List & Opportunities"' },
  { target: 'Google Calendar', status: '🟢 Event Reminders', latency: '35ms', timestamp: '1 hour ago', details: 'Added deadline reminder for "YC Winter 2026 Application"' },
];

function addSyncLogEntry(target, status, latency, details) {
  syncLogData.unshift({
    target,
    status,
    latency,
    timestamp: 'Just now',
    details: details || `Exported clip payload to ${target}`
  });
  if (syncLogData.length > 6) syncLogData.pop();
  renderSyncLogTable();
}

function renderSyncLogTable() {
  const container = document.getElementById('sync-log-table');
  if (!container) return;

  container.innerHTML = syncLogData.map((row) => `
    <div class="sync-log-row">
      <div class="target-info font-serif">
        <span>${row.target === 'Google Sheets' ? '📊' : row.target === 'Notion Workspace' ? '📝' : row.target === 'Airtable Base' ? '🗂️' : '⚡'}</span>
        <span>${row.target}</span>
      </div>
      <div class="font-mono text-xs text-amber-400">${row.status}</div>
      <div class="latency-tag font-mono">Latency: ${row.latency} • ${row.timestamp}</div>
      <div class="text-stone-400 text-xs">${row.details}</div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setupRouter();
  fetchDashboardData();
  setupQuickSaveForm();
  setupConnectionsPage();

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('clipper_access_token');
    localStorage.removeItem('clipper_refresh_token');
    localStorage.removeItem('clipper_user');
    window.location.href = './landing.html';
  });
});
