import { renderSidebar } from './components/sidebar.js';
import { renderTopbar } from './components/topbar.js';
import { renderDashboardSection } from './components/dashboardSection.js';
import { renderConnectionsSection } from './components/connectionsSection.js';
import { renderPopupSection } from './components/popupSection.js';
import { renderSettingsSection } from './components/settingsSection.js';
import { renderPageMapSection } from './components/pageMapSection.js';

const app = document.getElementById('app');

if (!app) {
  throw new Error('App root element not found.');
}

app.innerHTML = `
  <div class="page-shell">
    ${renderSidebar()}
    <main class="main-content">
      ${renderTopbar()}
      ${renderDashboardSection()}
      ${renderConnectionsSection()}
      ${renderPopupSection()}
      ${renderSettingsSection()}
      ${renderPageMapSection()}
    </main>
  </div>
`;

const sidebarItems = document.querySelectorAll('.nav-item');

sidebarItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    sidebarItems.forEach((node) => node.classList.remove('active'));
    (event.currentTarget as HTMLElement).classList.add('active');
  });
});
