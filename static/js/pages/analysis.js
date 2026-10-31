/**
 * New Analysis / Pipeline Studio Page Component.
 * Orchestrates 4-Agent Google ADK execution, interactive results, full in-browser
 * live editing of tailored resume & cover letter, and Typst ATS PDF export.
 */

import { API } from '../api.js';
import { Utils } from '../utils.js';
import { Toast } from '../components.js';

export const AnalysisPage = {
  currentAnalysisResult: null,
  originalAiResult: null,
  selectedFile: null,
  isEditMode: false,
  currentBullets: [],

  render(container) {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in">
        <!-- Title & Presets Bar -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">New Application Studio</h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Paste a target job posting and upload your resume to activate the 4-agent tailoring workflow.
            </p>
          </div>

          <!-- Quick Presets -->
          <div class="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2">Presets:</span>
            <button class="preset-btn px-2.5 py-1 text-xs font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors" data-preset="general">General SWE</button>
            <button class="preset-btn px-2.5 py-1 text-xs font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors" data-preset="networking">Networking</button>
            <button class="preset-btn px-2.5 py-1 text-xs font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors" data-preset="devsecops">DevSecOps</button>
            <button class="preset-btn px-2.5 py-1 text-xs font-medium rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors" data-preset="agentic">Agentic AI</button>
          </div>
        </div>

        <!-- Input Section: Job Description & Resume -->
        <form id="pipelineForm" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Job Description Card -->
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Target Job Description
                </label>
                <button type="button" id="clearJobBtn" class="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Clear</button>
              </div>
              <textarea id="jobDescriptionInput" required rows="12" maxlength="20000" placeholder="Paste the full job posting, required qualifications, and responsibilities here... (max 20000 chars)" class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
            </div>
            <div class="text-right mt-2">
              <span id="jobCharCount" class="text-[11px] text-slate-400">0 characters</span>
            </div>
          </div>

          <!-- Resume Input Card -->
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <svg class="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  Your Candidate Resume
                </label>
                <button type="button" id="loadCvPresetBtn" class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Load Baseline CV</button>
              </div>

              <!-- Drag & Drop Zone -->
              <div id="dropZone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                <input type="file" id="resumeFileInput" accept=".pdf,.txt,.md" class="hidden">
                <div class="flex flex-col items-center">
                  <div class="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  </div>
                  <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span id="dropZoneText">Click to upload or drag & drop</span>
                  </p>
                  <p class="text-[11px] text-slate-400 mt-1">PDF, TXT, or Markdown (Max 5 MB)</p>
                </div>
              </div>

              <!-- Or Paste Text Toggle -->
              <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-slate-600 dark:text-slate-400">Or paste raw resume text:</span>
                </div>
                <textarea id="resumeTextInput" rows="4" maxlength="20000" placeholder="Optional: Paste text instead of uploading a file... (max 20000 chars)" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="startPipelineBtn" class="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>Execute 4-Agent Pipeline</span>
            </button>
            <button type="button" id="cancelPipelineBtn" class="hidden w-full mt-2 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40">Cancel Pipeline Run</button>
          </div>
        </form>

        <!-- Live 4-Agent Progress Stepper (Hidden until run) -->
        <div id="pipelineStepperCard" class="hidden glass-panel p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span class="spinner text-indigo-600 mr-1.5"></span>
              <span>Multi-Agent Coordination in Progress...</span>
            </h3>
            <span class="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">SequentialAgent ADK</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs" id="stepperGrid">
            <div id="step1" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
              <span class="step-num w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <div class="font-semibold text-slate-800 dark:text-slate-200">Job Parser</div>
                <div class="text-[10px] text-slate-400">Extracts skills & criteria</div>
              </div>
            </div>

            <div id="step2" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
              <span class="step-num w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <div class="font-semibold text-slate-800 dark:text-slate-200">Resume Analyzer</div>
                <div class="text-[10px] text-slate-400">Maps candidate profile</div>
              </div>
            </div>

            <div id="step3" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
              <span class="step-num w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <div class="font-semibold text-slate-800 dark:text-slate-200">Matcher Engine</div>
                <div class="text-[10px] text-slate-400">Calculates fit & gaps</div>
              </div>
            </div>

            <div id="step4" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
              <span class="step-num w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <div class="font-semibold text-slate-800 dark:text-slate-200">Google XYZ Writer</div>
                <div class="text-[10px] text-slate-400">Compiles FAANG resume</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Studio Section (Hidden until result ready) -->
        <div id="resultsStudioSection" class="hidden space-y-6">
          <!-- Top Results Summary Card -->
          <div class="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div class="flex flex-col lg:flex-row items-center justify-between gap-6">
              <!-- Score Ring Gauge -->
              <div class="flex items-center space-x-6">
                <div class="relative w-28 h-28 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" class="text-slate-200 dark:text-slate-800" fill="transparent"/>
                    <circle id="scoreGaugeCircle" cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" stroke-linecap="round" class="gauge-circle text-indigo-600" fill="transparent" stroke-dasharray="251.2" stroke-dashoffset="251.2"/>
                  </svg>
                  <div class="absolute flex flex-col items-center">
                    <span id="scoreValueText" class="text-2xl font-black text-slate-900 dark:text-white">0%</span>
                    <span class="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Fit Score</span>
                  </div>
                </div>

                <div>
                  <h2 id="resultJobTitle" class="text-xl font-bold text-slate-900 dark:text-white">Software Engineer</h2>
                  <p id="resultCompany" class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Target Organization</p>
                  <p id="resultMatchSummary" class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    Compatibility evaluated by multi-agent analysis.
                  </p>
                </div>
              </div>

              <!-- Top Actions: Edit Mode Toggle, Save & Download PDF -->
              <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button type="button" id="toggleEditModeBtn" class="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center space-x-1.5 shadow-sm">
                  <svg id="editModeIcon" class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  <span id="toggleEditModeText">Live Edit Mode</span>
                </button>

                <button type="button" id="saveApplicationBtn" class="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center space-x-1.5">
                  <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                  <span>Save Application</span>
                </button>

                <button type="button" id="downloadPdfBtn" class="flex-1 lg:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-102 flex items-center justify-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  <span>Download Typst ATS PDF</span>
                </button>
              </div>
            </div>

            <!-- Skills Matrix Tags -->
            <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Matched Competencies</span>
                <div id="matchingSkillsContainer" class="flex flex-wrap gap-1.5"></div>
              </div>
              <div>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Missing / Gap Competencies</span>
                <div id="missingSkillsContainer" class="flex flex-wrap gap-1.5"></div>
              </div>
            </div>
          </div>

          <!-- Studio Tabs: Resume Editor & Bullets, Cover Letter, Tips, Full CV -->
          <div class="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div class="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 gap-1 overflow-x-auto">
              <button class="studio-tab-btn active px-4 py-2 text-xs font-bold rounded-xl transition-all bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" data-tab="resume">
                Tailored Resume & Bullets
              </button>
              <button class="studio-tab-btn px-4 py-2 text-xs font-bold rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900" data-tab="cover">
                Tailored Cover Letter
              </button>
              <button class="studio-tab-btn px-4 py-2 text-xs font-bold rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900" data-tab="tips">
                Interview Prep Strategy
              </button>
              <button class="studio-tab-btn px-4 py-2 text-xs font-bold rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900" data-tab="cv">
                Raw Resume JSON
              </button>
            </div>

            <!-- Tab Content Containers -->
            <div class="p-6">
              <!-- Resume & Bullets Tab (Tab 1) -->
              <div id="tabContentResume" class="space-y-6">
                <!-- Mode Notice Banner -->
                <div id="editorModeNotice" class="hidden rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 px-4 py-2.5 flex items-center justify-between text-xs text-indigo-800 dark:text-indigo-300">
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span class="font-semibold">Live Edit Mode Active:</span>
                    <span>Modifications below will automatically sync with your Typst ATS PDF and tracker.</span>
                  </div>
                  <button type="button" id="revertAllEditsBtn" class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">Revert to AI Original</button>
                </div>

                <!-- 1. Executive / Professional Summary -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Executive / Professional Summary
                    </label>
                    <button type="button" id="copySummaryBtn" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Copy Summary</button>
                  </div>
                  <!-- Preview View -->
                  <div id="summaryPreviewBox" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans italic"></div>
                  <!-- Edit View -->
                  <div id="summaryEditBox" class="hidden">
                    <textarea id="editSummaryInput" rows="3" class="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Targeted 2-3 sentence executive summary framed for the position..."></textarea>
                  </div>
                </div>

                <!-- 2. Categorized Technical Skills -->
                <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Categorized Technical Skills
                    </label>
                  </div>
                  <!-- Preview View -->
                  <div id="skillsPreviewBox" class="space-y-2.5">
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="font-bold text-slate-500 w-24">Languages:</span>
                      <div id="previewSkillsLanguages" class="flex flex-wrap gap-1.5"></div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="font-bold text-slate-500 w-24">Frameworks:</span>
                      <div id="previewSkillsFrameworks" class="flex flex-wrap gap-1.5"></div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="font-bold text-slate-500 w-24">Tools & Cloud:</span>
                      <div id="previewSkillsTools" class="flex flex-wrap gap-1.5"></div>
                    </div>
                  </div>
                  <!-- Edit View -->
                  <div id="skillsEditBox" class="hidden grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span class="text-[11px] font-semibold text-slate-500 block mb-1">Languages (comma-separated)</span>
                      <input type="text" id="editSkillsLanguages" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500" placeholder="Python, Go, TypeScript, SQL">
                    </div>
                    <div>
                      <span class="text-[11px] font-semibold text-slate-500 block mb-1">Frameworks & Libraries</span>
                      <input type="text" id="editSkillsFrameworks" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500" placeholder="FastAPI, React, PyTorch, Docker">
                    </div>
                    <div>
                      <span class="text-[11px] font-semibold text-slate-500 block mb-1">Tools & Infrastructure</span>
                      <input type="text" id="editSkillsTools" class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500" placeholder="Git, Linux, AWS, MySQL">
                    </div>
                  </div>
                </div>

                <!-- 3. Google XYZ Bullets & Experience -->
                <div class="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div class="flex items-center justify-between">
                    <div>
                      <label class="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Tailored Projects & Google XYZ Bullets
                      </label>
                      <p class="text-[11px] text-slate-400">Accomplished [X] as measured by [Y] by doing [Z].</p>
                    </div>
                    <div class="flex items-center space-x-2">
                      <button type="button" id="copyBulletsBtn" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Copy All Bullets</button>
                    </div>
                  </div>
                  <!-- Preview View -->
                  <div id="bulletsPreviewBox" class="space-y-2.5">
                    <div id="bulletsListContainer" class="space-y-3"></div>
                  </div>
                  <!-- Edit View -->
                  <div id="bulletsEditBox" class="hidden space-y-3">
                    <div id="editableBulletsList" class="space-y-2.5"></div>
                    <button type="button" id="addBulletBtn" class="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                      <span>Add Custom Bullet Point</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Cover Letter Tab (Tab 2) -->
              <div id="tabContentCover" class="hidden space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">Personalized Cover Letter</span>
                    <p class="text-[11px] text-slate-400">Directly editable. Formatted for immediate job submission or email attachment.</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span id="coverLetterStats" class="text-[11px] font-mono text-slate-400">0 words | 0 chars</span>
                    <button type="button" id="resetCoverBtn" class="text-xs text-rose-500 hover:underline">Reset</button>
                    <button type="button" id="copyCoverBtn" class="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">Copy Letter</button>
                  </div>
                </div>
                <textarea id="coverLetterText" rows="16" class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>

              <!-- Interview Tips Tab (Tab 3) -->
              <div id="tabContentTips" class="hidden space-y-4">
                <p class="text-xs text-slate-500">Strategic talking points and technical focus areas identified during analysis.</p>
                <div id="tipsListContainer" class="space-y-2.5"></div>
              </div>

              <!-- Full CV JSON Tab (Tab 4) -->
              <div id="tabContentCv" class="hidden space-y-4">
                <div class="flex items-center justify-between">
                  <p class="text-xs text-slate-500">Live JSON structure compiled by the Typst compiler (synchronized with your edits).</p>
                  <button type="button" id="copyCvJsonBtn" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Copy JSON</button>
                </div>
                <textarea id="cvJsonText" rows="16" class="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const jobInput = document.getElementById('jobDescriptionInput');
    const jobCharCount = document.getElementById('jobCharCount');
    const resumeTextInput = document.getElementById('resumeTextInput');
    const clearJobBtn = document.getElementById('clearJobBtn');
    const loadCvPresetBtn = document.getElementById('loadCvPresetBtn');
    const dropZone = document.getElementById('dropZone');
    const resumeFileInput = document.getElementById('resumeFileInput');
    const dropZoneText = document.getElementById('dropZoneText');
    const pipelineForm = document.getElementById('pipelineForm');

    // Preset Job buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = async () => {
        const type = btn.getAttribute('data-preset');
        try {
          const res = await API.get(`/api/sample-data/${type}`);
          if (res.sample_job) {
            jobInput.value = res.sample_job;
            jobCharCount.innerText = `${jobInput.value.length} characters`;
            Toast.show(`Loaded ${type} sample job!`, 'info');
          }
        } catch (err) {
          Toast.show(Utils.formatError(err), 'error');
        }
      };
    });

    // Character counter
    jobInput.oninput = () => {
      jobCharCount.innerText = `${jobInput.value.length} characters`;
    };

    // Clear Job
    clearJobBtn.onclick = () => {
      jobInput.value = '';
      jobCharCount.innerText = '0 characters';
    };

    // Load Baseline CV
    loadCvPresetBtn.onclick = async () => {
      try {
        const res = await API.get('/api/sample-data/cv');
        if (res.sample_cv) {
          resumeTextInput.value = res.sample_cv;
          Toast.show('Loaded baseline CV profile!', 'info');
        }
      } catch (err) {
        Toast.show(Utils.formatError(err), 'error');
      }
    };

    // Drag and drop file handling
    dropZone.onclick = () => resumeFileInput.click();

    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('border-indigo-500', 'bg-indigo-50/20');
    };

    dropZone.ondragleave = () => {
      dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/20');
    };

    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-indigo-500', 'bg-indigo-50/20');
      if (e.dataTransfer.files?.length > 0) {
        const f = e.dataTransfer.files[0];
        if (f.size > 5 * 1024 * 1024) {
          Toast.show('File too large. Maximum 5 MB.', 'error');
          return;
        }
        if (!/\.(pdf|txt|md|markdown)$/i.test(f.name)) {
          Toast.show('Unsupported file type. Upload PDF, TXT, or Markdown only.', 'error');
          return;
        }
        this.selectedFile = f;
        dropZoneText.innerText = `Selected: ${this.selectedFile.name}`;
      }
    };

    resumeFileInput.onchange = () => {
      if (resumeFileInput.files?.length > 0) {
        const f = resumeFileInput.files[0];
        if (f.size > 5 * 1024 * 1024) {
          Toast.show('File too large. Maximum 5 MB.', 'error');
          resumeFileInput.value = '';
          return;
        }
        if (!/\.(pdf|txt|md|markdown)$/i.test(f.name)) {
          Toast.show('Unsupported file type. Upload PDF, TXT, or Markdown only.', 'error');
          resumeFileInput.value = '';
          return;
        }
        this.selectedFile = f;
        dropZoneText.innerText = `Selected: ${this.selectedFile.name}`;
      }
    };

    // Form submission & pipeline execution
    pipelineForm.onsubmit = async (e) => {
      e.preventDefault();
      const jobDesc = jobInput.value.trim();
      const resumeText = resumeTextInput.value.trim();

      if (!jobDesc) {
        Toast.show('Please enter a target job description.', 'warning');
        return;
      }

      if (!this.selectedFile && !resumeText) {
        Toast.show('Please upload a resume file or paste resume text.', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('job_description', jobDesc);
      if (this.selectedFile) {
        formData.append('resume_file', this.selectedFile);
      }
      if (resumeText) {
        formData.append('resume_text', resumeText);
      }

      // Show stepper
      const stepper = document.getElementById('pipelineStepperCard');
      const startBtn = document.getElementById('startPipelineBtn');
      stepper.classList.remove('hidden');
      startBtn.disabled = true;
      startBtn.innerHTML = `<span class="spinner mr-2"></span>Executing Pipeline...`;

      // Animate stepper steps
      this.animateSteps();

      let abortController = null;
      const cancelBtn = document.getElementById('cancelPipelineBtn');
      const showCancel = (show) => {
        if (!cancelBtn) return;
        cancelBtn.classList.toggle('hidden', !show);
      };
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          if (abortController) abortController.abort();
        };
      }

      try {
        abortController = new AbortController();
        showCancel(true);
        const result = await API.request('/api/analyze', { method: 'POST', body: formData, signal: abortController.signal });
        this.currentAnalysisResult = result;
        this.originalAiResult = JSON.parse(JSON.stringify(result));
        try { sessionStorage.setItem('autoapply_last_analysis', JSON.stringify(result)); } catch {}
        Toast.show('Analysis complete! Tailored resume ready.', 'success');
        this.renderResults(result);
      } catch (err) {
        if (err && (err.name === 'AbortError' || /abort/i.test(err.message || ''))) {
          Toast.show('Pipeline cancelled.', 'info');
        } else {
          Toast.show(Utils.formatError(err), 'error');
        }
      } finally {
        showCancel(false);
        abortController = null;
        startBtn.disabled = false;
        startBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>Execute 4-Agent Pipeline</span>
        `;
      }
    };

    // Studio Tabs switching
    document.querySelectorAll('.studio-tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.studio-tab-btn').forEach(b => {
          b.classList.remove('active', 'bg-white', 'dark:bg-slate-800', 'text-indigo-600', 'dark:text-indigo-400', 'shadow-sm');
          b.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        btn.classList.add('active', 'bg-white', 'dark:bg-slate-800', 'text-indigo-600', 'dark:text-indigo-400', 'shadow-sm');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');

        const tabKey = btn.getAttribute('data-tab');
        document.getElementById('tabContentResume').classList.toggle('hidden', tabKey !== 'resume');
        document.getElementById('tabContentCover').classList.toggle('hidden', tabKey !== 'cover');
        document.getElementById('tabContentTips').classList.toggle('hidden', tabKey !== 'tips');
        document.getElementById('tabContentCv').classList.toggle('hidden', tabKey !== 'cv');
      };
    });

    // Toggle Edit Mode Button
    const toggleEditBtn = document.getElementById('toggleEditModeBtn');
    if (toggleEditBtn) {
      toggleEditBtn.onclick = () => this.toggleEditMode();
    }

    // Add Bullet Point Button
    const addBulletBtn = document.getElementById('addBulletBtn');
    if (addBulletBtn) {
      addBulletBtn.onclick = () => {
        this.currentBullets.push('Accomplished [technical milestone] resulting in [quantifiable outcome] by developing [key solution].');
        this.renderEditableBullets();
        this.harvestCurrentEdits();
        // Focus the newly added bullet
        setTimeout(() => {
          const inputs = document.querySelectorAll('.editable-bullet-input');
          if (inputs.length > 0) {
            const last = inputs[inputs.length - 1];
            last.focus();
            last.select();
          }
        }, 50);
      };
    }

    // Revert All Edits Button
    const revertBtn = document.getElementById('revertAllEditsBtn');
    if (revertBtn) {
      revertBtn.onclick = () => {
        if (!this.originalAiResult) return;
        this.currentAnalysisResult = JSON.parse(JSON.stringify(this.originalAiResult));
        this.renderResults(this.currentAnalysisResult);
        Toast.show('Reverted all fields to original AI output.', 'info');
      };
    }

    // Reset Cover Letter Button
    const resetCoverBtn = document.getElementById('resetCoverBtn');
    if (resetCoverBtn) {
      resetCoverBtn.onclick = () => {
        const orig = this.originalAiResult?.tailored_content?.cover_letter || '';
        document.getElementById('coverLetterText').value = orig;
        this.updateCoverStats();
        this.harvestCurrentEdits();
        Toast.show('Cover letter reverted to AI draft.', 'info');
      };
    }

    // Copy Summary Button
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    if (copySummaryBtn) {
      copySummaryBtn.onclick = async () => {
        const text = document.getElementById('editSummaryInput')?.value || document.getElementById('summaryPreviewBox')?.innerText || '';
        if (text) {
          await Utils.copyToClipboard(text);
          Toast.show('Professional summary copied!', 'success');
        }
      };
    }

    // Copy Bullets Button
    const copyBulletsBtn = document.getElementById('copyBulletsBtn');
    if (copyBulletsBtn) {
      copyBulletsBtn.onclick = async () => {
        const bullets = this.currentBullets.length > 0 ? this.currentBullets : (this.currentAnalysisResult?.tailored_content?.tailored_bullets || []);
        const text = bullets.map(b => `• ${b}`).join('\n');
        await Utils.copyToClipboard(text);
        Toast.show('All bullets copied to clipboard!', 'success');
      };
    }

    // Copy Cover Letter Button
    const copyCoverBtn = document.getElementById('copyCoverBtn');
    if (copyCoverBtn) {
      copyCoverBtn.onclick = async () => {
        const coverText = document.getElementById('coverLetterText').value;
        await Utils.copyToClipboard(coverText);
        Toast.show('Cover letter copied to clipboard!', 'success');
      };
    }

    // Copy CV JSON Button
    const copyCvJsonBtn = document.getElementById('copyCvJsonBtn');
    if (copyCvJsonBtn) {
      copyCvJsonBtn.onclick = async () => {
        const jsonText = document.getElementById('cvJsonText').value;
        await Utils.copyToClipboard(jsonText);
        Toast.show('CV JSON copied to clipboard!', 'success');
      };
    }

    // Cover letter input live word/char count
    const coverLetterText = document.getElementById('coverLetterText');
    if (coverLetterText) {
      coverLetterText.oninput = () => {
        this.updateCoverStats();
        this.harvestCurrentEdits();
      };
    }

    // Edit Summary live harvest
    const summaryInput = document.getElementById('editSummaryInput');
    if (summaryInput) {
      summaryInput.oninput = () => this.harvestCurrentEdits();
    }

    // Edit Skills live harvest
    ['editSkillsLanguages', 'editSkillsFrameworks', 'editSkillsTools'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => this.harvestCurrentEdits();
    });

    // Save Application Button
    const saveAppBtn = document.getElementById('saveApplicationBtn');
    if (saveAppBtn) {
      saveAppBtn.onclick = async () => {
        if (!this.currentAnalysisResult) return;
        saveAppBtn.innerHTML = `<span class="spinner mr-1.5"></span>Saving...`;
        try {
          const harvested = this.harvestCurrentEdits();
          const req = {
            job_title: this.currentAnalysisResult.job_requirements?.job_title || 'Position',
            company_name: this.currentAnalysisResult.job_requirements?.company_name || 'Company',
            job_description: document.getElementById('jobDescriptionInput').value.trim(),
            match_score: this.currentAnalysisResult.match_analysis?.match_score || 0,
            status: 'Applied',
            professional_summary: harvested.professionalSummary,
            categorized_skills: harvested.categorizedSkills,
            tailored_bullets: harvested.tailoredBullets,
            cover_letter: harvested.coverLetter,
            matching_skills: this.currentAnalysisResult.match_analysis?.matching_skills,
            missing_skills: this.currentAnalysisResult.match_analysis?.missing_skills,
            gap_summary: this.currentAnalysisResult.match_analysis?.gap_summary,
            interview_tips: this.currentAnalysisResult.tailored_content?.interview_tips,
            final_tailored_cv: harvested.finalCv
          };
          await API.post('/api/applications', req);
          Toast.show('Application & edited resume saved to tracker!', 'success');
        } catch (err) {
          Toast.show(Utils.formatError(err), 'error');
        } finally {
          saveAppBtn.innerHTML = `
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <span>Save Application</span>
          `;
        }
      };
    }

    // Download Typst PDF Button
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
      downloadPdfBtn.onclick = async () => {
        if (!this.currentAnalysisResult?.final_tailored_cv) return;
        downloadPdfBtn.innerHTML = `<span class="spinner mr-1.5"></span>Compiling Typst...`;
        try {
          const harvested = this.harvestCurrentEdits();
          const blob = await API.post('/api/resume/export-pdf', { tailored_cv: harvested.finalCv });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const candidateName = (harvested.finalCv.contact_info?.name || 'Tailored').replace(/\s+/g, '_');
          a.download = `${candidateName}_Resume.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
          Toast.show('Tailored Typst ATS PDF downloaded successfully!', 'success');
        } catch (err) {
          Toast.show(Utils.formatError(err), 'error');
        } finally {
          downloadPdfBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>Download Typst ATS PDF</span>
          `;
        }
      };
    }
  },

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const btnText = document.getElementById('toggleEditModeText');
    const notice = document.getElementById('editorModeNotice');

    const sumPrev = document.getElementById('summaryPreviewBox');
    const sumEdit = document.getElementById('summaryEditBox');
    const skPrev = document.getElementById('skillsPreviewBox');
    const skEdit = document.getElementById('skillsEditBox');
    const buPrev = document.getElementById('bulletsPreviewBox');
    const buEdit = document.getElementById('bulletsEditBox');

    if (this.isEditMode) {
      if (btnText) btnText.innerText = 'Switch to Preview Mode';
      if (notice) notice.classList.remove('hidden');

      if (sumPrev) sumPrev.classList.add('hidden');
      if (sumEdit) sumEdit.classList.remove('hidden');

      if (skPrev) skPrev.classList.add('hidden');
      if (skEdit) skEdit.classList.remove('hidden');

      if (buPrev) buPrev.classList.add('hidden');
      if (buEdit) buEdit.classList.remove('hidden');

      this.renderEditableBullets();
    } else {
      if (btnText) btnText.innerText = 'Live Edit Mode';
      if (notice) notice.classList.add('hidden');

      this.syncPreviewFromInputs();

      if (sumPrev) sumPrev.classList.remove('hidden');
      if (sumEdit) sumEdit.classList.add('hidden');

      if (skPrev) skPrev.classList.remove('hidden');
      if (skEdit) skEdit.classList.add('hidden');

      if (buPrev) buPrev.classList.remove('hidden');
      if (buEdit) buEdit.classList.add('hidden');
    }
  },

  renderEditableBullets() {
    const listCont = document.getElementById('editableBulletsList');
    if (!listCont) return;

    listCont.innerHTML = this.currentBullets.map((b, idx) => `
      <div class="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" data-index="${idx}">
        <span class="text-indigo-500 font-bold text-base mt-2 shrink-0">•</span>
        <textarea rows="2" class="editable-bullet-input flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500">${Utils.sanitizeHTML(b)}</textarea>
        <button type="button" class="delete-bullet-btn mt-2 text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors" title="Delete bullet" data-index="${idx}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join('') || '<p class="text-xs text-slate-400 p-2">No bullets available. Click "Add Custom Bullet Point" to write one!</p>';

    // Attach input listeners
    listCont.querySelectorAll('.editable-bullet-input').forEach((input, i) => {
      input.oninput = () => {
        this.currentBullets[i] = input.value;
        this.harvestCurrentEdits();
      };
    });

    // Attach delete listeners
    listCont.querySelectorAll('.delete-bullet-btn').forEach(delBtn => {
      delBtn.onclick = () => {
        const i = parseInt(delBtn.getAttribute('data-index'), 10);
        if (!isNaN(i) && i >= 0 && i < this.currentBullets.length) {
          this.currentBullets.splice(i, 1);
          this.renderEditableBullets();
          this.harvestCurrentEdits();
        }
      };
    });
  },

  syncPreviewFromInputs() {
    const harvested = this.harvestCurrentEdits();
    if (!harvested) return;

    // 1. Update Preview Summary
    const sumPrev = document.getElementById('summaryPreviewBox');
    if (sumPrev) {
      sumPrev.innerText = harvested.professionalSummary || 'No summary entered.';
    }

    // 2. Update Preview Skills
    const langPrev = document.getElementById('previewSkillsLanguages');
    if (langPrev) {
      langPrev.innerHTML = harvested.categorizedSkills.Languages.map(s => `
        <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">${Utils.sanitizeHTML(s)}</span>
      `).join('') || '<span class="text-slate-400 italic">None</span>';
    }

    const fwPrev = document.getElementById('previewSkillsFrameworks');
    if (fwPrev) {
      fwPrev.innerHTML = harvested.categorizedSkills.Frameworks_and_Libraries.map(s => `
        <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">${Utils.sanitizeHTML(s)}</span>
      `).join('') || '<span class="text-slate-400 italic">None</span>';
    }

    const toolPrev = document.getElementById('previewSkillsTools');
    if (toolPrev) {
      toolPrev.innerHTML = harvested.categorizedSkills.Tools_and_Infrastructure.map(s => `
        <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">${Utils.sanitizeHTML(s)}</span>
      `).join('') || '<span class="text-slate-400 italic">None</span>';
    }

    // 3. Update Preview Bullets
    const bulletsCont = document.getElementById('bulletsListContainer');
    if (bulletsCont) {
      bulletsCont.innerHTML = harvested.tailoredBullets.map(b => `
        <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-sans flex items-start space-x-2.5">
          <span class="text-indigo-500 font-bold text-base leading-none">•</span>
          <span class="text-slate-800 dark:text-slate-200">${Utils.sanitizeHTML(b)}</span>
        </div>
      `).join('') || '<p class="text-xs text-slate-400">No bullets available.</p>';
    }
  },

  harvestCurrentEdits() {
    if (!this.currentAnalysisResult) return null;

    // Harvest Cover Letter
    const coverLetterEl = document.getElementById('coverLetterText');
    const coverLetter = coverLetterEl ? coverLetterEl.value : (this.currentAnalysisResult.tailored_content?.cover_letter || '');

    // Harvest Professional Summary
    const summaryEl = document.getElementById('editSummaryInput');
    const professionalSummary = summaryEl ? summaryEl.value.trim() : (this.currentAnalysisResult.tailored_content?.professional_summary || '');

    // Harvest Skills
    const langEl = document.getElementById('editSkillsLanguages');
    const fwEl = document.getElementById('editSkillsFrameworks');
    const toolsEl = document.getElementById('editSkillsTools');

    const categorizedSkills = {
      Languages: langEl ? langEl.value.split(',').map(s => s.trim()).filter(Boolean) : (this.currentAnalysisResult.tailored_content?.categorized_skills?.Languages || []),
      Frameworks_and_Libraries: fwEl ? fwEl.value.split(',').map(s => s.trim()).filter(Boolean) : (this.currentAnalysisResult.tailored_content?.categorized_skills?.Frameworks_and_Libraries || []),
      Tools_and_Infrastructure: toolsEl ? toolsEl.value.split(',').map(s => s.trim()).filter(Boolean) : (this.currentAnalysisResult.tailored_content?.categorized_skills?.Tools_and_Infrastructure || [])
    };

    // Harvest Bullets
    const bulletInputs = document.querySelectorAll('.editable-bullet-input');
    let tailoredBullets = [];
    if (bulletInputs.length > 0) {
      bulletInputs.forEach(input => {
        const val = input.value.trim();
        if (val) tailoredBullets.push(val);
      });
      this.currentBullets = [...tailoredBullets];
    } else if (this.currentBullets.length > 0) {
      tailoredBullets = [...this.currentBullets];
    } else {
      tailoredBullets = this.currentAnalysisResult.tailored_content?.tailored_bullets || [];
    }

    // Update tailored_content
    this.currentAnalysisResult.tailored_content = {
      ...this.currentAnalysisResult.tailored_content,
      cover_letter: coverLetter,
      professional_summary: professionalSummary,
      categorized_skills: categorizedSkills,
      tailored_bullets: tailoredBullets
    };

    // Update final_tailored_cv for Typst
    if (this.currentAnalysisResult.final_tailored_cv) {
      const cv = { ...this.currentAnalysisResult.final_tailored_cv };
      cv.professional_summary = professionalSummary;
      cv.categorized_skills = categorizedSkills;

      if (cv.tailored_projects && cv.tailored_projects.length > 0) {
        cv.tailored_projects[0].xyz_bullets = tailoredBullets;
        if (categorizedSkills.Languages.length > 0) {
          cv.tailored_projects[0].technologies = categorizedSkills.Languages.slice(0, 4);
        }
      } else {
        cv.tailored_projects = [{
          project_name: "Key Projects & Targeted Engineering Achievements",
          project_role: "Lead Contributor",
          technologies: categorizedSkills.Languages.slice(0, 4),
          xyz_bullets: tailoredBullets
        }];
      }

      this.currentAnalysisResult.final_tailored_cv = cv;

      // Sync JSON textarea
      const cvJsonEl = document.getElementById('cvJsonText');
      if (cvJsonEl) cvJsonEl.value = JSON.stringify(cv, null, 2);
    }

    return {
      coverLetter,
      professionalSummary,
      categorizedSkills,
      tailoredBullets,
      finalCv: this.currentAnalysisResult.final_tailored_cv
    };
  },

  updateCoverStats() {
    const el = document.getElementById('coverLetterText');
    const statsEl = document.getElementById('coverLetterStats');
    if (!el || !statsEl) return;
    const text = el.value.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = el.value.length;
    statsEl.innerText = `${words} words | ${chars} chars`;
  },

  animateSteps() {
    const steps = [
      document.getElementById('step1'),
      document.getElementById('step2'),
      document.getElementById('step3'),
      document.getElementById('step4')
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        s.classList.remove('bg-slate-50', 'dark:bg-slate-900');
        s.classList.add('bg-indigo-50', 'dark:bg-indigo-950/60', 'border-indigo-400', 'step-pulse');
        const num = s.querySelector('.step-num');
        if (num) {
          num.classList.remove('bg-slate-200', 'dark:bg-slate-800');
          num.classList.add('bg-indigo-600', 'text-white');
        }
      }, idx * 1200);
    });
  },

  renderResults(data) {
    const studioSection = document.getElementById('resultsStudioSection');
    studioSection.classList.remove('hidden');
    studioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const match = data.match_analysis || {};
    const job = data.job_requirements || {};
    const tailored = data.tailored_content || {};
    const finalCv = data.final_tailored_cv || {};

    this.currentBullets = [...(tailored.tailored_bullets || [])];

    // Animate score circle gauge
    const score = Math.max(0, Math.min(100, match.match_score || 0));
    const scoreText = document.getElementById('scoreValueText');
    const gauge = document.getElementById('scoreGaugeCircle');

    const offset = 251.2 - (score / 100) * 251.2;
    gauge.style.strokeDashoffset = offset;

    const scoreColors = Utils.scoreColor(score);
    gauge.style.stroke = scoreColors.hex;

    const duration = 900;
    const startTs = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      scoreText.innerText = `${Math.round(score * eased)}%`;
      if (p < 1) requestAnimationFrame(tick);
      else scoreText.innerText = `${score}%`;
    };
    requestAnimationFrame(tick);

    document.getElementById('resultJobTitle').innerText = job.job_title || 'Tailored Role';
    document.getElementById('resultCompany').innerText = job.company_name || 'Hiring Organization';
    document.getElementById('resultMatchSummary').innerText = match.gap_summary || 'Compatibility evaluated successfully.';

    // Matching Skills Tags
    const matchingCont = document.getElementById('matchingSkillsContainer');
    const matching = match.matching_skills || [];
    matchingCont.innerHTML = matching.map(s => `
      <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <svg class="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        ${Utils.sanitizeHTML(s)}
      </span>
    `).join('') || '<span class="text-xs text-slate-400">No direct overlaps detected.</span>';

    // Missing Skills Tags
    const missingCont = document.getElementById('missingSkillsContainer');
    const missing = match.missing_skills || [];
    missingCont.innerHTML = missing.map(s => `
      <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <svg class="w-3 h-3 mr-1 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        ${Utils.sanitizeHTML(s)}
      </span>
    `).join('') || '<span class="text-xs text-slate-400">No critical gaps identified!</span>';

    // Populate Summary
    const summaryText = tailored.professional_summary || finalCv.professional_summary || '';
    document.getElementById('summaryPreviewBox').innerText = summaryText || 'No summary generated.';
    document.getElementById('editSummaryInput').value = summaryText;

    // Populate Skills
    const catSkills = tailored.categorized_skills || finalCv.categorized_skills || {};
    const langs = catSkills.Languages || [];
    const fws = catSkills.Frameworks_and_Libraries || [];
    const tools = catSkills.Tools_and_Infrastructure || [];

    document.getElementById('editSkillsLanguages').value = langs.join(', ');
    document.getElementById('editSkillsFrameworks').value = fws.join(', ');
    document.getElementById('editSkillsTools').value = tools.join(', ');

    // Populate Preview Skills Tags
    document.getElementById('previewSkillsLanguages').innerHTML = langs.map(s => `
      <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">${Utils.sanitizeHTML(s)}</span>
    `).join('') || '<span class="text-slate-400 italic">None</span>';

    document.getElementById('previewSkillsFrameworks').innerHTML = fws.map(s => `
      <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">${Utils.sanitizeHTML(s)}</span>
    `).join('') || '<span class="text-slate-400 italic">None</span>';

    document.getElementById('previewSkillsTools').innerHTML = tools.map(s => `
      <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">${Utils.sanitizeHTML(s)}</span>
    `).join('') || '<span class="text-slate-400 italic">None</span>';

    // Populate Preview Bullets
    const bulletsCont = document.getElementById('bulletsListContainer');
    bulletsCont.innerHTML = this.currentBullets.map(b => `
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-sans flex items-start space-x-2.5">
        <span class="text-indigo-500 font-bold text-base leading-none">•</span>
        <span class="text-slate-800 dark:text-slate-200">${Utils.sanitizeHTML(b)}</span>
      </div>
    `).join('') || '<p class="text-xs text-slate-400">No bullets generated.</p>';

    // Render Editable Bullets
    this.renderEditableBullets();

    // Cover Letter
    const coverText = tailored.cover_letter || '';
    document.getElementById('coverLetterText').value = coverText;
    this.updateCoverStats();

    // Full CV JSON
    document.getElementById('cvJsonText').value = JSON.stringify(finalCv, null, 2);

    // Interview Tips
    const tipsCont = document.getElementById('tipsListContainer');
    const tips = tailored.interview_tips || match.recommendations || [];
    tipsCont.innerHTML = tips.map(t => `
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-start space-x-2">
        <span class="text-amber-500 font-bold">💡</span>
        <span class="text-slate-700 dark:text-slate-300">${Utils.sanitizeHTML(t)}</span>
      </div>
    `).join('') || '<p class="text-xs text-slate-400">Standard interview preparation advised.</p>';

    // Reset edit mode toggle state to preview by default
    this.isEditMode = false;
    const btnText = document.getElementById('toggleEditModeText');
    if (btnText) btnText.innerText = 'Live Edit Mode';
    document.getElementById('editorModeNotice')?.classList.add('hidden');
    document.getElementById('summaryPreviewBox')?.classList.remove('hidden');
    document.getElementById('summaryEditBox')?.classList.add('hidden');
    document.getElementById('skillsPreviewBox')?.classList.remove('hidden');
    document.getElementById('skillsEditBox')?.classList.add('hidden');
    document.getElementById('bulletsPreviewBox')?.classList.remove('hidden');
    document.getElementById('bulletsEditBox')?.classList.add('hidden');
  }
};
