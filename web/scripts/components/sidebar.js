export function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="brand-row">
        <div class="brand-mark">◔</div>
        <div>
          <div class="brand-name">Clipper</div>
          <div class="brand-subtitle">Save anything, anywhere</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a class="nav-item active" href="#dashboard">Dashboard</a>
        <a class="nav-item" href="#clips">All clips</a>
        <a class="nav-item" href="#jobs">Jobs tracker</a>
        <a class="nav-item" href="#boards">Shared boards</a>
        <a class="nav-item" href="#digest">Digest</a>
        <div class="nav-divider"></div>
        <a class="nav-item" href="#connections">Connections</a>
        <a class="nav-item" href="#settings-full">Settings</a>
      </nav>

      <div class="usage-card">
        <div class="usage-label">Free plan</div>
        <div class="usage-value">47 / 100 clips</div>
      </div>
    </aside>
  `;
}
