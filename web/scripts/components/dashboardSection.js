export function renderDashboardSection() {
  return `
    <section class="content-grid">
      <article class="panel stats-panel" id="dashboard">
        <div class="panel-label">Page: dashboard</div>
        <div class="stats-row">
          <div class="stat-card">
            <strong>47</strong>
            <span>Total clips</span>
          </div>
          <div class="stat-card">
            <strong>12</strong>
            <span>This week</span>
          </div>
          <div class="stat-card">
            <strong>5</strong>
            <span>Jobs saved</span>
          </div>
          <div class="stat-card">
            <strong>3</strong>
            <span>Boards</span>
          </div>
        </div>
        <div class="digest-card" id="digest">
          <h2>Weekly AI digest</h2>
          <p>
            You saved 12 items this week. Top trend: remote engineering jobs. 3 items need action.
          </p>
        </div>
      </article>

      <article class="panel clips-panel" id="clips">
        <div class="panel-header">
          <div>
            <div class="panel-label">Page: all clips · filters + search + grid</div>
            <div class="filter-pills">
              <span>Jobs</span>
              <span>Articles</span>
              <span>Products</span>
              <span>Events</span>
              <span class="selected">All</span>
            </div>
          </div>
          <div class="muted">Sort: newest</div>
        </div>
        <div class="clips-helper">Clip cards grid · pagination · bulk select · tag filter · full-text search</div>
      </article>

      <article class="panel board-panel" id="jobs">
        <div class="panel-label">Page: jobs tracker · kanban board</div>
        <div class="kanban">
          <div class="kanban-col">
            <h3>Saved</h3>
            <div class="kanban-card card-tint-1"></div>
            <div class="kanban-card card-tint-1"></div>
          </div>
          <div class="kanban-col">
            <h3>Applied</h3>
            <div class="kanban-card card-tint-2"></div>
          </div>
          <div class="kanban-col">
            <h3>Interview</h3>
            <div class="kanban-card card-tint-3"></div>
          </div>
          <div class="kanban-col empty" id="boards">
            <h3>Offer</h3>
            <div class="empty-state">Empty</div>
          </div>
        </div>
      </article>
    </section>
  `;
}
