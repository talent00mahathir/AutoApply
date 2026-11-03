/**
 * Dashboard Page Component: Metric cards, status analytics, recent applications.
 */

import { API } from '../api.js';
import { Utils } from '../utils.js';
import { Toast } from '../components.js';

export const DashboardPage = {
  async render(container, currentUser) {
    // FE-2 Option A: guest demo allowed, show banner + sign-in CTA.
    const guestBanner = currentUser ? '' : `
        <div class="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
          <p class="text-xs text-amber-800 dark:text-amber-200">Guest demo — metrics are empty until you sign in. Saving requires an account.</p>
          <button id="guestSignInBtn" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">Sign in to save</button>
        </div>`;
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
        ${guestBanner}
        <!-- Top Welcome Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Welcome back${currentUser?.name ? `, ${Utils.sanitizeHTML(currentUser.name.split(' ')[0])}` : ''}
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Here is your active job application pipeline and readiness metrics.
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <a href="#/analysis" class="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all hover:scale-102">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              New Analysis
            </a>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboardMetricCards">
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tracked</span>
            <div class="flex items-baseline space-x-2 mt-2">
              <span id="metricTotalApps" class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">—</span>
            </div>
          </div>
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Avg ATS Match</span>
            <div class="flex items-baseline space-x-2 mt-2">
              <span id="metricAvgScore" class="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">—</span>
            </div>
          </div>
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Interviews</span>
            <div class="flex items-baseline space-x-2 mt-2">
              <span id="metricInterviews" class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">—</span>
            </div>
          </div>
          <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Offers</span>
            <div class="flex items-baseline space-x-2 mt-2">
              <span id="metricOffers" class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">—</span>
            </div>
          </div>
        </div>

        <!-- Analytics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Status Distribution -->
          <div class="glass-panel p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">Status Overview</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown of applications by current interview stage.</p>
              <div id="statusBreakdownContainer" class="space-y-3">
                <div class="animate-pulse space-y-2">
                  <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Score Distribution Buckets -->
          <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">ATS Match Distribution</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">Compatibility score clusters across all submitted positions.</p>
            <div id="scoreDistributionContainer" class="space-y-4">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Recent Applications Table -->
        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div class="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Recent Applications</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Your most recently tailored roles.</p>
            </div>
            <a href="#/tracker" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
              <span>View All Tracker</span>
              <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </a>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th class="px-6 py-3">Role & Company</th>
                  <th class="px-6 py-3">Match Score</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Applied Date</th>
                </tr>
              </thead>
              <tbody id="recentAppsTableBody" class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td colspan="4" class="px-6 py-8 text-center text-slate-400">
                    <span class="spinner text-indigo-500 mr-2"></span>Loading dashboard insights...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const gBtn = document.getElementById('guestSignInBtn');
    if (gBtn) gBtn.onclick = () => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'login' } }));

    await this.loadStats();
  },

  async loadStats() {
    try {
      const stats = await API.get('/api/dashboard/stats');

      // Populate metric counts
      document.getElementById('metricTotalApps').innerText = stats.total_applications;
      document.getElementById('metricAvgScore').innerText = `${stats.average_match_score}%`;
      document.getElementById('metricInterviews').innerText = stats.status_counts?.Interview || 0;
      document.getElementById('metricOffers').innerText = stats.status_counts?.Offer || 0;

      // Render status breakdown pills
      const statusContainer = document.getElementById('statusBreakdownContainer');
      const total = stats.total_applications || 1;
      const statusEntries = Object.entries(stats.status_counts || {});

      statusContainer.innerHTML = statusEntries.map(([statusName, count]) => {
        const pct = Math.round((count / total) * 100);
        const badgeClass = Utils.statusBadge(statusName);
        return `
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-medium text-slate-700 dark:text-slate-300">${statusName}</span>
              <span class="text-slate-500">${count} (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div class="bg-indigo-600 h-2 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      // Render Score Distribution Buckets
      const scoreDist = stats.score_distribution || {};
      const scoreContainer = document.getElementById('scoreDistributionContainer');
      const scoreLabels = [
        { label: '90 - 100% (High Alignment)', key: '90-100', color: 'bg-emerald-500' },
        { label: '75 - 89% (Strong Fit)', key: '75-89', color: 'bg-indigo-500' },
        { label: '50 - 74% (Moderate Match)', key: '50-74', color: 'bg-amber-500' },
        { label: '< 50% (Significant Gaps)', key: '<50', color: 'bg-rose-500' }
      ];

      scoreContainer.innerHTML = scoreLabels.map(b => {
        const count = scoreDist[b.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="font-medium text-slate-700 dark:text-slate-300">${b.label}</span>
              <span class="text-slate-500 font-mono">${count} roles (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div class="${b.color} h-2.5 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');

      // Render Recent Applications Table
      const tableBody = document.getElementById('recentAppsTableBody');
      const recent = stats.recent_applications || [];

      if (recent.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" class="px-6 py-8 text-center text-slate-400">
              No applications recorded yet. Run your first tailored analysis to get started!
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = recent.map(app => {
        const badgeClass = Utils.statusBadge(app.status);
        const scoreStyle = Utils.scoreColor(app.match_score);
        return `
          <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <td class="px-6 py-3.5">
              <div class="font-semibold text-slate-900 dark:text-white">${Utils.sanitizeHTML(app.job_title)}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">${Utils.sanitizeHTML(app.company_name)}</div>
            </td>
            <td class="px-6 py-3.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border}">
                ${app.match_score}%
              </span>
            </td>
            <td class="px-6 py-3.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}">
                ${Utils.sanitizeHTML(app.status)}
              </span>
            </td>
            <td class="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
              ${Utils.formatDate(app.applied_date)}
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      Toast.show(Utils.formatError(err), 'error');
    }
  }
};
