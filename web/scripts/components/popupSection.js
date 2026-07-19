export function renderPopupSection() {
  return `
    <article class="panel popup-panel" id="popup-states">
      <div class="panel-label">Extension popup · quick-save states</div>
      <div class="popup-row">
        <div class="popup-card">
          <div class="popup-top">
            <strong>Clipper</strong>
            <span>Idle</span>
          </div>
          <div class="mini-preview">
            <div class="mini-title">linkedin.com/jobs/view/394</div>
            <div class="mini-main">Senior Engineer at Stripe</div>
          </div>
          <button class="primary-btn" type="button">Save this page</button>
          <div class="mini-actions">
            <button type="button">Sheets</button>
            <button type="button">Notion</button>
          </div>
        </div>
        <div class="popup-card done">
          <div class="popup-top">
            <strong>Clipper</strong>
            <span>Done</span>
          </div>
          <div class="saved-row">
            <span class="saved-pill">Saved</span>
            <span class="saved-type">Job</span>
          </div>
          <div class="saved-title">Senior Engineer at Stripe</div>
          <div class="saved-copy">Full-stack role, fully remote. $180k–$220k equity included.</div>
          <div class="tag-row">
            <span>python</span>
            <span>remote</span>
            <span>fintech</span>
          </div>
          <button class="secondary-btn" type="button">Saved to Google Sheets</button>
        </div>
        <div class="popup-card menu-card">
          <div class="popup-top">
            <strong>Context menu</strong>
            <span>Right-click</span>
          </div>
          <div class="menu-item active-item">Save to Clipper</div>
          <div class="menu-item">Save to Sheets</div>
          <div class="menu-item">Save to Notion</div>
          <div class="menu-item">Save to Airtable</div>
          <div class="menu-divider"></div>
          <div class="menu-item muted-item">Share to board</div>
        </div>
      </div>
    </article>
  `;
}
