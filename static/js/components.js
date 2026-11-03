/**
 * Reusable UI Components: Navbar, Toast Notifications, and Auth Modal.
 */

import { API } from './api.js';
import { Utils } from './utils.js';

export const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'success', duration = 3500) {
    this.init();

    // FE-12: cap stack to 3 + dedupe identical messages.
    const key = `${type}::${message}`;
    const now = Date.now();
    this._last = this._last || { key: '', ts: 0 };
    if (this._last.key === key && now - this._last.ts < 1500) return;
    this._last = { key, ts: now };
    while (this.container.children.length >= 3) {
      this.container.firstChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center px-4 py-3 rounded-xl shadow-lg border text-sm font-medium toast-slide-in transition-all duration-300 max-w-md ${
      type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
        : type === 'error'
        ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        : type === 'warning'
        ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
        : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
    }`;

    const icon = type === 'success'
      ? `<svg class="w-5 h-5 mr-2.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
      : type === 'error'
      ? `<svg class="w-5 h-5 mr-2.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
      : `<svg class="w-5 h-5 mr-2.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    toast.innerHTML = `${icon}<span>${Utils.sanitizeHTML(message)}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
export const ConfirmModal = {
  show({ title, body, confirmText, danger } = {}) {
    return new Promise((resolve) => {
      let host = document.getElementById('confirm-modal-root');
      if (!host) {
        host = document.createElement('div');
        host.id = 'confirm-modal-root';
        document.body.appendChild(host);
      }
      const t = title || 'Are you sure?';
      const b = body || 'This action cannot be undone.';
      const c = confirmText || 'Confirm';
      const btnCls = danger
        ? 'bg-rose-600 hover:bg-rose-700'
        : 'bg-indigo-600 hover:bg-indigo-700';
      host.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" class="w-full max-w-sm rounded-2xl glass-panel p-6 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">${Utils.sanitizeHTML(t)}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">${Utils.sanitizeHTML(b)}</p>
          <div class="flex justify-end space-x-2 pt-2">
            <button id="cfCancel" class="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700">Cancel</button>
            <button id="cfOk" class="px-4 py-2 rounded-xl text-xs font-bold text-white ${btnCls}">${Utils.sanitizeHTML(c)}</button>
          </div>
        </div>
      </div>`;
      const done = (v) => { host.innerHTML = ''; resolve(v); };
      document.getElementById('cfCancel').onclick = () => done(false);
      document.getElementById('cfOk').onclick = () => done(true);
    });
  }
};

export const SearchModal = {
  open(apps = []) {
    let host = document.getElementById('search-modal-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'search-modal-root';
      document.body.appendChild(host);
    }
    host.innerHTML = `
    <div class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4" id="smBack">
      <div role="dialog" aria-modal="true" aria-label="Search applications" class="w-full max-w-lg rounded-2xl glass-panel p-4">
        <input id="smInput" placeholder="Search role or company... (Esc to close)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <div id="smList" class="mt-2 max-h-64 overflow-auto divide-y divide-slate-100 dark:divide-slate-800"></div>
      </div>
    </div>`;
    const input = document.getElementById('smInput');
    const list = document.getElementById('smList');
    const back = document.getElementById('smBack');
    const close = () => { host.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
    const draw = (q) => {
      const query = (q || '').toLowerCase();
      const hits = (apps || []).filter(a =>
        !query ||
        (a.job_title && a.job_title.toLowerCase().includes(query)) ||
        (a.company_name && a.company_name.toLowerCase().includes(query))
      ).slice(0, 8);
      list.innerHTML = hits.map(a => `
        <button data-id="${a.id}" class="sm-hit w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
          <div class="text-xs font-bold">${Utils.sanitizeHTML(a.job_title)} <span class="text-slate-400 font-medium">· ${Utils.sanitizeHTML(a.company_name)}</span></div>
          <div class="text-[11px] text-slate-400">${Utils.sanitizeHTML(a.status || '')} · ${a.match_score || 0}%</div>
        </button>`).join('') || '<div class="p-3 text-xs text-slate-400">No matches.</div>';
      list.querySelectorAll('.sm-hit').forEach(b => {
        b.onclick = () => { close(); window.location.hash = '#/tracker'; };
      });
    };
    input.oninput = () => draw(input.value);
    draw('');
    setTimeout(() => input.focus(), 50);
  }
};


export const Navbar = {
  render(activeRoute = 'dashboard', currentUser = null) {
    const navEl = document.getElementById('main-navbar');
    if (!navEl) return;

    const isLoggedIn = Boolean(currentUser);
    const userInitials = currentUser?.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    navEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center space-x-8">
            <a href="#/dashboard" class="flex items-center space-x-2.5 group">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <span class="text-base font-bold tracking-tight text-slate-900 dark:text-white">AutoApply</span>
                <span class="ml-1 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">ADK</span>
              </div>
            </a>

            <!-- Nav Tabs -->
            <nav class="hidden md:flex space-x-1">
              <a href="#/dashboard" class="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeRoute === 'dashboard'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }">
                Dashboard
              </a>
              <a href="#/analysis" class="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeRoute === 'analysis'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }">
                New Analysis
              </a>
              <a href="#/tracker" class="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeRoute === 'tracker'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }">
                Applications
              </a>
            </nav>
          </div>

          <!-- Right Controls -->
          <div class="flex items-center space-x-3">
            <!-- Theme Toggle Button -->
            <button id="themeToggleBtn" aria-label="Toggle Theme" class="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <svg id="themeIconSun" class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <svg id="themeIconMoon" class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>

            ${isLoggedIn ? `
              <!-- User Profile Menu -->
              <div class="relative" id="userMenuContainer">
                <button id="userMenuBtn" class="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow">
                    ${userInitials}
                  </div>
                  <span class="text-xs font-medium text-slate-700 dark:text-slate-200 hidden sm:inline-block max-w-[120px] truncate">
                    ${Utils.sanitizeHTML(currentUser.name)}
                  </span>
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>

                <!-- Dropdown Card -->
                <div id="userDropdown" class="hidden absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-xl py-2 z-50 border border-slate-200 dark:border-slate-800 animate-in fade-in">
                  <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <p class="text-xs font-semibold text-slate-900 dark:text-white truncate">${Utils.sanitizeHTML(currentUser.name)}</p>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${Utils.sanitizeHTML(currentUser.email)}</p>
                  </div>
                  <a href="#/account" class="flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <svg class="w-4 h-4 mr-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Profile & Account
                  </a>
                  <a href="#/settings" class="flex items-center px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <svg class="w-4 h-4 mr-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Settings & System
                  </a>
                  <div class="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>
                  <button id="logoutBtn" class="w-full text-left flex items-center px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                    <svg class="w-4 h-4 mr-2.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            ` : `
              <!-- Logged out CTA buttons -->
              <button id="navLoginBtn" class="text-xs font-semibold px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Log In
              </button>
              <button id="navRegisterBtn" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-102">
                Sign Up Free
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // Attach theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      };
    }

    // Attach dropdown toggle
    const userBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userBtn && userDropdown) {
      userBtn.onclick = (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      };
      document.addEventListener('click', () => userDropdown.classList.add('hidden'));
    }

    // Attach logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        API.clearToken();
        Toast.show('Signed out successfully.', 'info');
        window.location.hash = '#/landing';
        window.dispatchEvent(new CustomEvent('auth:changed'));
      };
    }

    // Attach auth modal triggers
    const navLoginBtn = document.getElementById('navLoginBtn');
    if (navLoginBtn) {
      navLoginBtn.onclick = () => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }));
    }
    const navRegisterBtn = document.getElementById('navRegisterBtn');
    if (navRegisterBtn) {
      navRegisterBtn.onclick = () => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'register' } }));
    }
  }
};
