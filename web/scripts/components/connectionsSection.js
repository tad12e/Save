export function renderConnectionsSection() {
  return `
    <article class="panel connections-panel" id="connections">
      <div class="panel-title-row">
        <div>
          <p class="section-title">Connections</p>
          <p class="section-copy">Where users link Google Sheets, Notion, Airtable, and more.</p>
        </div>
      </div>

      <div class="integration-grid">
        <div class="integration-card connected">
          <div class="integration-top">
            <strong>Google Sheets</strong>
            <span>Connected</span>
          </div>
          <p>Syncing to "My Clips" spreadsheet</p>
          <a href="#">Disconnect</a>
        </div>
        <div class="integration-card">
          <div class="integration-top">
            <strong>Notion</strong>
            <span>Not connected</span>
          </div>
          <p>Save clips as Notion database pages</p>
          <a href="#">Connect Notion</a>
        </div>
        <div class="integration-card">
          <div class="integration-top">
            <strong>Airtable</strong>
            <span>Not connected</span>
          </div>
          <p>Save clips as Airtable records</p>
          <a href="#">Connect Airtable</a>
        </div>
        <div class="integration-card">
          <div class="integration-top">
            <strong>Google Calendar</strong>
            <span>Not connected</span>
          </div>
          <p>Auto-add saved events to calendar</p>
          <a href="#">Connect Calendar</a>
        </div>
        <div class="integration-card">
          <div class="integration-top">
            <strong>Zapier</strong>
            <span>Not connected</span>
          </div>
          <p>Trigger automations when you clip</p>
          <a href="#">Connect Zapier</a>
        </div>
        <div class="integration-card active">
          <div class="integration-top">
            <strong>Email digest</strong>
            <span>Active</span>
          </div>
          <p>Weekly AI summary to your inbox</p>
          <a href="#">Disable</a>
        </div>
      </div>
    </article>
  `;
}
