/**
 * Settings & System Diagnostics Page Component.
 * Preferences, default resume text caching in localStorage, and live /api/health check.
 */

import { API } from '../api.js';
import { Utils } from '../utils.js';
import { Toast } from '../components.js';

export const SettingsPage = {
  DEFAULT_RESUME_KEY: 'autoapply_default_resume_text',

  async render(container) {
    const savedResume = localStorage.getItem(this.DEFAULT_RESUME_KEY) || '';
    const currentTheme = localStorage.getItem('theme') || 'system';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
        <!-- Title -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Settings & Diagnostics</h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure application defaults, appearance, and verify server connectivity.
          </p>
        </div>

        <!-- Appearance Preferences Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">Choose your preferred visual aesthetic.</p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl pt-2">
            <button id="themeLightBtn" class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all">
              <span class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                <span>Light Mode</span>
              </span>
              <span id="checkLight" class="text-indigo-600 dark:text-indigo-400 ${currentTheme === 'light' ? '' : 'hidden'}">✓</span>
            </button>

            <button id="themeDarkBtn" class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all">
              <span class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                <span>Dark Mode</span>
              </span>
              <span id="checkDark" class="text-indigo-600 dark:text-indigo-400 ${currentTheme === 'dark' ? '' : 'hidden'}">✓</span>
            </button>

            <button id="themeSystemBtn" class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all">
              <span class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>System</span>
              </span>
              <span id="checkSystem" class="text-indigo-600 dark:text-indigo-400 ${(!currentTheme || currentTheme === 'system') ? '' : 'hidden'}">✓</span>
            </button>
          </div>
        </div>

        <!-- Default Resume Storage Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Default Baseline Resume</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Save your resume text here to automatically pre-populate the Analysis Studio.</p>
            </div>
            <button id="saveDefaultResumeBtn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all">
              Save Default
            </button>
          </div>

          <textarea id="defaultResumeInput" rows="8" placeholder="Paste your default markdown or plain-text resume here..." class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none">${Utils.escapeAttr(savedResume)}</textarea>
        </div>

        <!-- Backend Health & Diagnostics Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">System Diagnostics</h3>
            <button id="refreshHealthBtn" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Run Diagnostic
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="healthGrid">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Backend API</span>
              <p id="healthStatusText" class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center">
                <span class="spinner mr-2"></span>Testing...
              </p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Database Backend</span>
              <p id="healthDbText" class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">—</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Active ADK LLM</span>
              <p id="healthModelText" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">—</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.runHealthCheck();
  },

  bindEvents() {
    const lightBtn = document.getElementById('themeLightBtn');
    const darkBtn = document.getElementById('themeDarkBtn');
    const systemBtn = document.getElementById('themeSystemBtn');
    const checkLight = document.getElementById('checkLight');
    const checkDark = document.getElementById('checkDark');
    const checkSystem = document.getElementById('checkSystem');
    const saveResumeBtn = document.getElementById('saveDefaultResumeBtn');
    const resumeInput = document.getElementById('defaultResumeInput');
    const refreshHealthBtn = document.getElementById('refreshHealthBtn');

    lightBtn.onclick = () => {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      checkLight.classList.remove('hidden');
      checkDark.classList.add('hidden');
      if (checkSystem) checkSystem.classList.add('hidden');
      Toast.show('Switched to Light Mode', 'info');
    };

    darkBtn.onclick = () => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      checkDark.classList.remove('hidden');
      checkLight.classList.add('hidden');
      if (checkSystem) checkSystem.classList.add('hidden');
      Toast.show('Switched to Dark Mode', 'info');
    };

    // FE-6: System follows OS preference + live listener.
    const applySystem = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    };
    if (systemBtn) {
      systemBtn.onclick = () => {
        localStorage.setItem('theme', 'system');
        applySystem();
        checkSystem.classList.remove('hidden');
        checkLight.classList.add('hidden');
        checkDark.classList.add('hidden');
        Toast.show('Following system theme', 'info');
      };
    }
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('theme') || 'system') === 'system') applySystem();
      });
    } catch { /* older browsers */ }

    saveResumeBtn.onclick = () => {
      const text = resumeInput.value.trim();
      localStorage.setItem(this.DEFAULT_RESUME_KEY, text);
      Toast.show('Default resume saved in local storage!', 'success');
    };

    refreshHealthBtn.onclick = () => this.runHealthCheck();
  },

  async runHealthCheck() {
    const statusText = document.getElementById('healthStatusText');
    const dbText = document.getElementById('healthDbText');
    const modelText = document.getElementById('healthModelText');

    statusText.innerHTML = `<span class="spinner mr-1.5"></span>Testing...`;

    try {
      const health = await API.get('/api/health');
      statusText.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block"></span>
        <span class="text-emerald-600 dark:text-emerald-400 font-bold">Online</span>
      `;
      dbText.innerText = health.database || 'Active';
      modelText.innerText = health.active_model || 'gemini-3.8-flash';
    } catch {
      statusText.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-rose-500 mr-2 inline-block"></span>
        <span class="text-rose-600 dark:text-rose-400 font-bold">Unreachable</span>
      `;
      dbText.innerText = 'Offline';
      modelText.innerText = 'Offline';
    }
  }
};
