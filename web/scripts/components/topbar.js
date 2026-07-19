export function renderTopbar() {
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Website skeleton</p>
        <h1>Dashboard layout for the Save web app</h1>
        <p class="topbar-copy">
          This is the first-pass shell: left navigation, stats, saved content areas, integrations,
          settings, and the page map. The details can be filled in later.
        </p>
      </div>
      <button class="menu-button" type="button" aria-label="Open menu">···</button>
    </header>
  `;
}
