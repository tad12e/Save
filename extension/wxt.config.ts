import { defineConfig } from 'wxt';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile(resolve(process.cwd(), '../.env'));
loadEnvFile(resolve(process.cwd(), '.env'));

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.WXT_GOOGLE_CLIENT_ID || '';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    host_permissions: ['<all_urls>'],
    permissions: ['storage', 'activeTab', 'scripting', 'identity', 'notifications', 'contextMenus'],
    commands: {
      'save-clip-shortcut': {
        suggested_key: {
          default: 'Alt+S',
          mac: 'Alt+S',
        },
        description: 'Quickly save current page to Clipper',
      },
    },
    omnibox: {
      keyword: 'save',
    },
    ...(googleClientId
      ? {
          oauth2: {
            client_id: googleClientId,
            scopes: ['openid', 'email', 'profile'],
          },
        }
      : {}),
  },
});
