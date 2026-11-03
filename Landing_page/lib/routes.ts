/**
 * Global URL and Authentication Routes for Yazem Landing Page.
 * Configured with clean paths (no hashtags) routing seamlessly into the live Web Vault.
 */

export const WEB_APP_URL =
  process.env.NEXT_PUBLIC_WEB_APP_URL || '/app';

export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export const APP_ROUTES = {
  signIn: `${WEB_APP_URL}/login`,
  signUp: `${WEB_APP_URL}/signup`,
  upgradePro: `${WEB_APP_URL}/signup?plan=pro`,
  vault: `${WEB_APP_URL}/dashboard`,
  feed: `${WEB_APP_URL}/feed`,
  connections: `${WEB_APP_URL}/connections`,
  extensionDownload: '#extension-guide',
};
