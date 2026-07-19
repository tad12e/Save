export function renderPageMapSection() {
  return `
    <article class="panel map-panel" id="page-map">
      <div class="panel-label">Full page map</div>
      <div class="map-grid">
        <div class="map-card">
          <h3>Public pages</h3>
          <div class="map-item">/ — Landing page</div>
          <div class="map-item">/login</div>
          <div class="map-item">/register</div>
          <div class="map-item">/u/:username</div>
        </div>
        <div class="map-card">
          <h3>App pages</h3>
          <div class="map-item">/dashboard</div>
          <div class="map-item">/clips</div>
          <div class="map-item">/jobs</div>
          <div class="map-item">/boards</div>
          <div class="map-item">/digest</div>
          <div class="map-item">/connections</div>
          <div class="map-item">/settings</div>
        </div>
        <div class="map-card">
          <h3>Extension pages</h3>
          <div class="map-item">popup — save</div>
          <div class="map-item">new tab — dashboard</div>
          <div class="map-item">context menu</div>
          <div class="map-item">options page</div>
        </div>
      </div>
    </article>
  `;
}
