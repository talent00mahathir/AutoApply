/**
 * Hash-based Single Page Application (SPA) Router for AutoApply.
 */

import { Auth } from './auth.js';
import { Navbar } from './components.js';
import { LandingPage } from './pages/landing.js';
import { DashboardPage } from './pages/dashboard.js';
import { AnalysisPage } from './pages/analysis.js';
import { TrackerPage } from './pages/tracker.js';
import { AccountPage } from './pages/account.js';
import { SettingsPage } from './pages/settings.js';

export const Router = {
  routes: {
    'landing': LandingPage,
    'dashboard': DashboardPage,
    'analysis': AnalysisPage,
    'tracker': TrackerPage,
    'account': AccountPage,
    'settings': SettingsPage
  },

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    window.addEventListener('auth:changed', async () => {
      await Auth.init();
      this.navigate();
    });
    this.navigate();
  },

  async navigate() {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    const currentUser = Auth.getCurrentUser();

    // Default route logic: if logged in -> dashboard; if guest -> landing
    let route = rawHash || (currentUser ? 'dashboard' : 'landing');

    // Protect private routes if unauthenticated
    if (!currentUser && (route === 'tracker' || route === 'account')) {
      window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }));
      route = 'landing';
    }

    const PageHandler = this.routes[route];

    // FE-10: unknown hash shows inline 404 instead of silent redirect.
    if (!this.routes[route]) {
      const appRoot404 = document.getElementById('app-root');
      Navbar.render(route, currentUser);
      if (appRoot404) {
        appRoot404.innerHTML = `<div class="max-w-md mx-auto px-4 py-16 text-center space-y-3">
          <h1 class="text-3xl font-black">404</h1>
          <p class="text-xs text-slate-500">Unknown route #/${route}. <a href="#/dashboard" class="text-indigo-600 underline">Go to Dashboard</a></p>
        </div>`;
      }
      return;
    }

    // Update Navbar active tab
    Navbar.render(route, currentUser);

    // Render Page
    const appRoot = document.getElementById('app-root');
    if (appRoot && PageHandler) {
      window.scrollTo(0, 0);
      await PageHandler.render(appRoot, currentUser);
    }
  }
};
