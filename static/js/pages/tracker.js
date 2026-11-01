/**
 * Applications Tracker Page Component.
 * Search, filter, inspect details, update lifecycle statuses, and delete saved applications.
 */

import { API } from '../api.js';
import { Utils } from '../utils.js';
import { Toast, ConfirmModal } from '../components.js';

export const TrackerPage = {
  applications: [],
  filteredApplications: [],
  currentStatusFilter: 'All',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in">
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Application Tracker</h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your job search pipeline, interview stages, and tailored application packages.
            </p>
          </div>
          <a href="#/analysis" class="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:scale-102">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            New Application
          </a>
        </div>

        <!-- Search & Filter Controls -->
        <div class="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Search input -->
          <div class="relative flex-1">
            <svg class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" id="trackerSearchInput" placeholder="Search by role or company name..." class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>

          <!-- Status Filter Pills -->
          <div class="flex flex-wrap items-center gap-1.5" id="statusFilterPills">
            <button class="status-pill-btn active px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow-sm transition-all" data-status="All">All</button>
            <button class="status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" data-status="Applied">Applied</button>
            <button class="status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" data-status="Interview">Interview</button>
            <button class="status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" data-status="Offer">Offer</button>
            <button class="status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" data-status="Rejected">Rejected</button>
            <button class="status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" data-status="Saved">Saved</button>
          </div>
        </div>

        <!-- Applications Table Card -->
        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th class="px-6 py-3.5">Company & Position</th>
                  <th class="px-6 py-3.5">ATS Score</th>
                  <th class="px-6 py-3.5">Lifecycle Status</th>
                  <th class="px-6 py-3.5">Applied Date</th>
                  <th class="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="trackerTableBody" class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                    <span class="spinner text-indigo-500 mr-2"></span>Loading applications...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.loadApplications();
  },

  bindEvents() {
    const searchInput = document.getElementById('trackerSearchInput');
    // FE-8: debounce 250ms avoids re-render per keystroke.
    let t = null;
    searchInput.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        this.searchQuery = searchInput.value.trim().toLowerCase();
        this.applyFilters();
      }, 250);
    };

    document.querySelectorAll('.status-pill-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.status-pill-btn').forEach(b => {
          b.className = 'status-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors';
        });
        btn.className = 'status-pill-btn active px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow-sm transition-all';
        this.currentStatusFilter = btn.getAttribute('data-status');
        this.applyFilters();
      };
    });
  },

  async loadApplications() {
    try {
      // FE-8: request capped page; backend keeps backward-compat list shape.
      const res = await API.get('/api/applications?limit=100&offset=0');
      this.applications = Array.isArray(res) ? res : (res.items || res.applications || []);
      this.applyFilters();
    } catch (err) {
      Toast.show(Utils.formatError(err), 'error');
      document.getElementById('trackerTableBody').innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-8 text-center text-rose-500">
            Failed to load applications. Please make sure you are logged in.
          </td>
        </tr>
      `;
    }
  },

  applyFilters() {
    this.filteredApplications = this.applications.filter(app => {
      const matchesStatus = this.currentStatusFilter === 'All' || app.status.toLowerCase() === this.currentStatusFilter.toLowerCase();
      const matchesSearch = !this.searchQuery
        || (app.job_title && app.job_title.toLowerCase().includes(this.searchQuery))
        || (app.company_name && app.company_name.toLowerCase().includes(this.searchQuery));
      return matchesStatus && matchesSearch;
    });

    this.renderTable();
  },

  renderTable() {
    const tableBody = document.getElementById('trackerTableBody');
    if (this.filteredApplications.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center text-slate-400">
            No applications match your filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = this.filteredApplications.map(app => {
      const scoreStyle = Utils.scoreColor(app.match_score);
      return `
        <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group">
          <td class="px-6 py-4">
            <div class="font-bold text-slate-900 dark:text-white text-sm">${Utils.sanitizeHTML(app.job_title)}</div>
            <div class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">${Utils.sanitizeHTML(app.company_name)}</div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}">
              ${app.match_score}%
            </span>
          </td>
          <td class="px-6 py-4">
            <select class="status-select text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer" data-id="${app.id}">
              <option value="Saved" ${app.status === 'Saved' ? 'selected' : ''}>Saved</option>
              <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
              <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
              <option value="Offer" ${app.status === 'Offer' ? 'selected' : ''}>Offer</option>
              <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </td>
          <td class="px-6 py-4 text-slate-500 font-mono text-[11px]">
            ${Utils.formatDate(app.applied_date)}
          </td>
          <td class="px-6 py-4 text-right space-x-2">
            <button class="delete-app-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors" data-id="${app.id}" title="Delete Application">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind Status Change
    document.querySelectorAll('.status-select').forEach(sel => {
      sel.onchange = async () => {
        const appId = sel.getAttribute('data-id');
        const newStatus = sel.value;
        try {
          await API.patch(`/api/applications/${appId}/status`, { status: newStatus });
          Toast.show(`Updated status to ${newStatus}!`, 'success');
          const target = this.applications.find(a => a.id == appId);
          if (target) target.status = newStatus;
        } catch (err) {
          Toast.show(Utils.formatError(err), 'error');
        }
      };
    });

    // Bind Delete
    document.querySelectorAll('.delete-app-btn').forEach(btn => {
      btn.onclick = async () => {
        const appId = btn.getAttribute('data-id');
        // FE-4: styled modal replaces native confirm().
        const ok = await ConfirmModal.show({ title: 'Delete application?', body: 'This removes the saved application and its tailored content.', confirmText: 'Delete', danger: true });
        if (!ok) return;
        try {
          await API.delete(`/api/applications/${appId}`);
          Toast.show('Application deleted.', 'info');
          this.applications = this.applications.filter(a => a.id != appId);
          this.applyFilters();
        } catch (err) {
          Toast.show(Utils.formatError(err), 'error');
        }
      };
    });
  }
};
