/**
 * Profile & Account Page Component.
 * Profile name updates, password change, account stats, and GDPR account deletion.
 */

import { API } from '../api.js';
import { Utils } from '../utils.js';
import { Toast, ConfirmModal } from '../components.js';

export const AccountPage = {
  async render(container, currentUser) {
    if (!currentUser) {
      container.innerHTML = `
        <div class="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
          <p class="text-xs text-slate-500">Please log in to manage your account and security settings.</p>
          <button id="accountLoginPromptBtn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md">
            Log In
          </button>
        </div>
      `;
      document.getElementById('accountLoginPromptBtn').onclick = () => {
        window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }));
      };
      return;
    }

    const initials = currentUser.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
        <!-- Title -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Profile & Security</h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal credentials, display identity, and security preferences.
          </p>
        </div>

        <!-- Identity & Profile Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div class="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              ${initials}
            </div>
            <div class="flex-1 text-center sm:text-left space-y-1">
              <h2 class="text-xl font-bold text-slate-900 dark:text-white">${Utils.sanitizeHTML(currentUser.name)}</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">${Utils.sanitizeHTML(currentUser.email)}</p>
              <div class="pt-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Verified Candidate Account
                </span>
              </div>
            </div>
          </div>

          <!-- Edit Display Name Form -->
          <form id="updateProfileForm" class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h3>
            <div class="max-w-md">
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
              <div class="flex space-x-2">
                <input type="text" id="profileNameInput" value="${Utils.escapeAttr(currentUser.name)}" required class="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button type="submit" id="saveNameBtn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all">
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Account Usage Statistics Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4">Account Analytics</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="accountStatsContainer">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Member Since</span>
              <p id="memberSinceText" class="text-sm font-bold text-slate-900 dark:text-white mt-1">—</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Lifetime Analyses</span>
              <p id="lifetimeAnalysesText" class="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">—</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <span class="text-[11px] text-slate-500 font-medium">Peak Match Score</span>
              <p id="peakScoreText" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">—</p>
            </div>
          </div>
        </div>

        <!-- Change Password Card -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">Security & Password</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Ensure your account uses an 8+ character password with letters, numbers, and symbols.</p>

          <form id="changePasswordForm" class="max-w-md space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <div class="relative">
                <input type="password" id="currentPasswordInput" required placeholder="••••••••" class="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button type="button" id="toggleCurrentPassBtn" aria-label="Toggle current password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5">
                  <svg id="eyeCurIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg id="eyeCurSlashIcon" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <div class="relative">
                <input type="password" id="newPasswordInput" required placeholder="••••••••" class="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button type="button" id="toggleNewPassBtn" aria-label="Toggle new password" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5">
                  <svg id="eyeNewIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  <svg id="eyeNewSlashIcon" class="w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                </button>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Must include uppercase, lowercase, number, and special character.</p>
            </div>

            <button type="submit" id="updatePasswordBtn" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all">
              Update Password
            </button>
          </form>
        </div>

        <!-- Danger Zone (Delete Account) -->
        <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-rose-200 dark:border-rose-950/80 bg-rose-50/20 dark:bg-rose-950/10">
          <h3 class="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">Danger Zone</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Permanently delete your user profile and all saved applications. This action is irreversible.
          </p>
          <button type="button" id="deleteAccountBtn" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm">
            Delete My Account & Data
          </button>
        </div>
      </div>
    `;

    this.bindEvents(currentUser);
    await this.loadStats();
  },

  bindEvents(currentUser) {
    const profileForm = document.getElementById('updateProfileForm');
    const passwordForm = document.getElementById('changePasswordForm');
    const deleteBtn = document.getElementById('deleteAccountBtn');

    // Toggle current password
    const toggleCurBtn = document.getElementById('toggleCurrentPassBtn');
    const curPassInput = document.getElementById('currentPasswordInput');
    const eyeCurIcon = document.getElementById('eyeCurIcon');
    const eyeCurSlashIcon = document.getElementById('eyeCurSlashIcon');
    if (toggleCurBtn && curPassInput) {
      toggleCurBtn.onclick = () => {
        const isPass = curPassInput.type === 'password';
        curPassInput.type = isPass ? 'text' : 'password';
        if (eyeCurIcon && eyeCurSlashIcon) {
          eyeCurIcon.classList.toggle('hidden', isPass);
          eyeCurSlashIcon.classList.toggle('hidden', !isPass);
        }
      };
    }

    // Toggle new password
    const toggleNewBtn = document.getElementById('toggleNewPassBtn');
    const newPassInput = document.getElementById('newPasswordInput');
    const eyeNewIcon = document.getElementById('eyeNewIcon');
    const eyeNewSlashIcon = document.getElementById('eyeNewSlashIcon');
    if (toggleNewBtn && newPassInput) {
      toggleNewBtn.onclick = () => {
        const isPass = newPassInput.type === 'password';
        newPassInput.type = isPass ? 'text' : 'password';
        if (eyeNewIcon && eyeNewSlashIcon) {
          eyeNewIcon.classList.toggle('hidden', isPass);
          eyeNewSlashIcon.classList.toggle('hidden', !isPass);
        }
      };
    }

    // Update name
    profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const newName = document.getElementById('profileNameInput').value.trim();
      const saveBtn = document.getElementById('saveNameBtn');
      saveBtn.innerHTML = `<span class="spinner mr-1"></span>Saving...`;

      try {
        const updated = await API.put('/api/auth/profile', { name: newName });
        currentUser.name = updated.name;
        Toast.show('Display name updated!', 'success');
        window.dispatchEvent(new CustomEvent('auth:changed'));
      } catch (err) {
        Toast.show(Utils.formatError(err), 'error');
      } finally {
        saveBtn.innerText = 'Save';
      }
    };

    // Change password
    passwordForm.onsubmit = async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPasswordInput').value;
      const newPassword = document.getElementById('newPasswordInput').value;
      const updateBtn = document.getElementById('updatePasswordBtn');

      updateBtn.innerHTML = `<span class="spinner mr-1"></span>Updating...`;

      try {
        await API.put('/api/auth/password', {
          current_password: currentPassword,
          new_password: newPassword
        });
        Toast.show('Password changed successfully!', 'success');
        passwordForm.reset();
      } catch (err) {
        Toast.show(Utils.formatError(err), 'error');
      } finally {
        updateBtn.innerText = 'Update Password';
      }
    };

    // Delete account
    deleteBtn.onclick = async () => {
      // FE-4: styled two-step replaces native prompt("DELETE").
      const ok = await ConfirmModal.show({ title: 'Delete account?', body: 'Type DELETE below, then confirm. This wipes your account and all applications.', confirmText: 'Continue', danger: true });
      if (!ok) return;
      const typed = prompt('Type "DELETE" to permanently erase your account and all data:');
      if (typed !== 'DELETE') return;

      try {
        await API.delete('/api/auth/account');
        API.clearToken();
        Toast.show('Account deleted.', 'info');
        window.location.hash = '#/landing';
        window.dispatchEvent(new CustomEvent('auth:changed'));
      } catch (err) {
        Toast.show(Utils.formatError(err), 'error');
      }
    };
  },

  async loadStats() {
    try {
      const stats = await API.get('/api/auth/stats');
      document.getElementById('memberSinceText').innerText = stats.member_since || 'Active';
      document.getElementById('lifetimeAnalysesText').innerText = `${stats.total_applications} apps`;
      document.getElementById('peakScoreText').innerText = `${stats.highest_match_score}%`;
    } catch {
      // Ignored if user not found
    }
  }
};
