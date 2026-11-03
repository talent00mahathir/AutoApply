/**
 * AutoApply Main Application Bootstrapper.
 */

import { Auth } from './auth.js';
import { Router } from './router.js';
import { SearchModal } from './components.js';
import { API } from './api.js';

async function bootApp() {
  // HOTFIX: never let stale token / slow /api/auth/me block Router. Boot with timeout.
  try {
    await Promise.race([
      Auth.init(),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]);
  } catch {
    /* boot as guest, router will show landing */
  }

  // 2. Render Auth Modal structure
  Auth.renderModal();

  // FE-1: api.js dispatches auth:expired but nobody listened. Wire global handler.
  window.addEventListener('auth:expired', async () => {
    Auth.currentUser = null;
    try {
      const { Toast } = await import('./components.js');
      Toast.show('Session expired. Please log in again.', 'warning');
    } catch { /* toast optional */ }
    if (window.location.hash !== '#/landing') window.location.hash = '#/landing';
    Router.navigate();
  });

  // 3. Boot Router
  Router.init();

  // FE-6: Ctrl/Cmd+K global search over tracked applications.
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      try {
        const res = await API.get('/api/applications?limit=100&offset=0');
        const apps = Array.isArray(res) ? res : (res.items || []);
        SearchModal.open(apps);
      } catch {
        SearchModal.open([]);
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
