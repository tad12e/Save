export function renderSettingsSection() {
  return `
    <article class="panel settings-panel" id="settings-full">
      <div class="tabs">
        <span class="active">Profile</span>
        <span>Connections</span>
        <span>Notifications</span>
        <span>Billing</span>
        <span>API keys</span>
        <span>Team</span>
      </div>
      <div class="form-grid">
        <label>
          <span>Name</span>
          <input type="text" value="Tadiwos" readonly />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value="tad@example.com" readonly />
        </label>
      </div>
    </article>
  `;
}
