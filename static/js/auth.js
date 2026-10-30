/**
 * Authentication Module: User session state, password validation, and modal handlers.
 */

import { API } from './api.js';
import { Utils } from './utils.js';
import { Toast } from './components.js';

export const Auth = {
  currentUser: null,

  async init() {
    if (API.isAuthenticated()) {
      try {
        this.currentUser = await API.get('/api/auth/me');
      } catch {
        API.clearToken();
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
    return this.currentUser;
  },

  getCurrentUser() {
    return this.currentUser;
  },

  renderModal() {
    const modalContainer = document.getElementById('auth-modal-root');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="authModalBackdrop" class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 hidden animate-in fade-in">
        <div class="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 relative border border-slate-200 dark:border-slate-800">
          <!-- Close button -->
          <button id="closeAuthModalBtn" class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <!-- Modal Title -->
          <div class="text-center mb-6">
            <h3 id="authModalTitle" class="text-xl font-bold text-slate-900 dark:text-white">Welcome to AutoApply</h3>
            <p id="authModalSubtitle" class="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in to track your applications and access the multi-agent studio.</p>
          </div>

          <!-- Auth Mode Switcher -->
          <div class="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 mb-5">
            <button id="tabLogin" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm">
              Log In
            </button>
            <button id="tabRegister" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-600 dark:text-slate-400">
              Create Account
            </button>
          </div>

          <!-- Auth Form -->
          <form id="authForm" class="space-y-4">
            <!-- Name Field (Register only) -->
            <div id="authNameField" class="hidden">
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input type="text" id="authNameInput" autocomplete="name" placeholder="Mohammad" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Email Field -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" id="authEmailInput" required autocomplete="email" placeholder="you@domain.com" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Password Field -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div class="relative">
                <input type="password" id="authPasswordInput" required autocomplete="current-password" minlength="8" placeholder="••••••••" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button type="button" id="toggleAuthPasswordBtn" aria-label="Toggle password visibility" aria-pressed="false" class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5">
                  <svg id="authEyeIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg id="authEyeSlashIcon" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
              <!-- Password Requirements Helper (for Register) -->
              <div id="passwordHelper" class="hidden mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                <p>Must be 8+ chars with uppercase, lowercase, digit, & symbol.</p>
              </div>
            </div>

            <button type="submit" id="authSubmitBtn" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] flex items-center justify-center">
              <span id="authSubmitText">Log In</span>
            </button>
          </form>
        </div>
      </div>
    `;

    this.bindModalEvents();
  },

  bindModalEvents() {
    const backdrop = document.getElementById('authModalBackdrop');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const nameField = document.getElementById('authNameField');
    const nameInput = document.getElementById('authNameInput');
    const passwordHelper = document.getElementById('passwordHelper');
    const title = document.getElementById('authModalTitle');
    const subtitle = document.getElementById('authModalSubtitle');
    const submitText = document.getElementById('authSubmitText');
    const form = document.getElementById('authForm');

    let currentMode = 'login';

    const setMode = (mode) => {
      currentMode = mode;
      if (mode === 'login') {
        tabLogin.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm';
        tabRegister.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-600 dark:text-slate-400';
        nameField.classList.add('hidden');
        passwordHelper.classList.add('hidden');
        title.innerText = 'Welcome Back';
        subtitle.innerText = 'Log in to continue managing your applications.';
        submitText.innerText = 'Log In';
        nameInput.removeAttribute('required');
      } else {
        tabRegister.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm';
        tabLogin.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-slate-600 dark:text-slate-400';
        nameField.classList.remove('hidden');
        passwordHelper.classList.remove('hidden');
        title.innerText = 'Create an Account';
        subtitle.innerText = 'Start creating ATS-tailored resumes in seconds.';
        submitText.innerText = 'Register';
        nameInput.setAttribute('required', 'true');
      }
    };

    tabLogin.onclick = () => setMode('login');
    tabRegister.onclick = () => setMode('register');
    // FE-7: ESC + backdrop click close, focus first input, aria-pressed toggle.
    const closeModal = () => backdrop.classList.add('hidden');
    closeBtn.onclick = closeModal;
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !backdrop.classList.contains('hidden')) closeModal();
    });

    // Password visibility toggle
    const togglePassBtn = document.getElementById('toggleAuthPasswordBtn');
    const passInput = document.getElementById('authPasswordInput');
    const eyeIcon = document.getElementById('authEyeIcon');
    const eyeSlashIcon = document.getElementById('authEyeSlashIcon');

    if (togglePassBtn && passInput) {
      togglePassBtn.onclick = () => {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        togglePassBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
        if (eyeIcon && eyeSlashIcon) {
          eyeIcon.classList.toggle('hidden', isPassword);
          eyeSlashIcon.classList.toggle('hidden', !isPassword);
        }
      };
    }

    window.addEventListener('auth:open', (e) => {
      backdrop.classList.remove('hidden');
      setMode(e.detail?.mode || 'login');
      // FE-7: focus first visible input for keyboard users.
      setTimeout(() => {
        const emailEl = document.getElementById('authEmailInput');
        if (emailEl) emailEl.focus();
      }, 50);
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmailInput').value.trim();
      const password = document.getElementById('authPasswordInput').value;
      const name = nameInput.value.trim();

      submitText.innerHTML = `<span class="spinner mr-2"></span>Processing...`;

      try {
        let res;
        if (currentMode === 'login') {
          res = await API.post('/api/auth/login', { email, password });
          Toast.show(`Welcome back, ${res.user.name}!`, 'success');
        } else {
          res = await API.post('/api/auth/register', { name, email, password });
          Toast.show('Account created successfully!', 'success');
        }

        API.setToken(res.access_token);
        this.currentUser = res.user;
        backdrop.classList.add('hidden');
        form.reset();

        window.dispatchEvent(new CustomEvent('auth:changed'));
        if (window.location.hash === '#/landing' || !window.location.hash) {
          window.location.hash = '#/dashboard';
        }
      } catch (err) {
        Toast.show(Utils.formatError(err), 'error');
      } finally {
        submitText.innerText = currentMode === 'login' ? 'Log In' : 'Register';
      }
    };
  }
};
