/**
 * Landing Page Component (Logged-Out Guests)
 */

import { Utils } from '../utils.js';

export const LandingPage = {
  render(container) {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <!-- Hero Section -->
        <div class="text-center max-w-3xl mx-auto space-y-6">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <span class="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Google ADK Multi-Agent AI + Typst ATS Engine</span>
          </div>

          <h1 class="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Tailor Your Job Applications with <span class="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">Agentic AI</span>
          </h1>

          <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Stop sending generic resumes. AutoApply deploys a specialized 4-agent team to parse requirements, pinpoint skill gaps, draft Google XYZ achievements, and generate mathematically typeset FAANG-grade resumes in 50 milliseconds.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button id="heroGetStartedBtn" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-105">
              Get Started Free
            </button>
            <a href="#/analysis" class="w-full sm:w-auto px-6 py-3 rounded-xl glass-panel text-slate-800 dark:text-slate-200 font-semibold text-sm hover:border-indigo-500 transition-all flex items-center justify-center space-x-2">
              <span>Try Live Demo</span>
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
          </div>
        </div>

        <!-- 3 Feature Highlight Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/60 transition-all">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">4-Agent Google ADK Pipeline</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sequential workflow: Job Parser extracts core competencies, Resume Analyzer identifies your strengths, Matcher calculates ATS fit, and Writer produces Google XYZ bullets.
            </p>
          </div>

          <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/60 transition-all">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">50ms Typst PDF Engine</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No bloated LaTeX or distorted web converters. Typst produces publication-grade Jake's FAANG-style PDFs with precision kerning and 100% ATS score readability.
            </p>
          </div>

          <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/60 transition-all">
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">Full Lifecycle Tracking</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Save every analyzed application with custom interview preparation strategies, match metrics, and cover letters in your secure personal dashboard.
            </p>
          </div>
        </div>
      </div>
    `;

    const getStartedBtn = document.getElementById('heroGetStartedBtn');
    if (getStartedBtn) {
      getStartedBtn.onclick = () => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'register' } }));
    }
  }
};
