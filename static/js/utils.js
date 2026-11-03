/**
 * AutoApply Utility Functions: XSS Sanitization, Date Formatting, Clipboard.
 */

export const Utils = {
  /**
   * Sanitize string against XSS injection before insertion into DOM (SEC-4).
   */
  sanitizeHTML(str) {
    if (str === null || str === undefined) return '';
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
  },

  /**
   * Escape attributes in HTML strings.
   */
  escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /**
   * Format human-readable date.
   */
  formatDate(dateInput) {
    if (!dateInput) return '—';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return String(dateInput);
    }
  },

  /**
   * Extract user-friendly error message from API response or Error object.
   * FE-9: map raw codes to friendly copy, keep raw in console.
   */
  formatError(err) {
    if (!err) return 'An unexpected error occurred.';
    if (typeof err === 'string') return err;
    const status = err.status;
    const raw = err.detail || err.message || '';
    try { console.warn('[AutoApply API error]', status, raw); } catch { /* noop */ }
    if (status === 401) return 'Please log in again.';
    if (status === 429) return typeof raw === 'string' && raw ? raw : 'Too many tries. Please wait and retry.';
    if (status === 413) return typeof raw === 'string' && raw ? raw : 'Input too large. Shorten text or file.';
    if (status === 415) return 'Unsupported file type. Upload PDF, TXT, or Markdown only.';
    if (status >= 500) return 'Server busy. Please try again.';
    if (err.detail) {
      if (typeof err.detail === 'string') return err.detail;
      if (Array.isArray(err.detail)) {
        return err.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
      }
      return JSON.stringify(err.detail);
    }
    if (err.message) return err.message;
    return 'Operation failed. Please try again.';
  },

  /**
   * Copy text to clipboard and invoke optional callback.
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch {
      return false;
    }
  },

  /**
   * Return color class names for match scores.
   */
  scoreColor(score) {
    const s = Number(score) || 0;
    if (s >= 80) return { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', hex: '#10b981' };
    if (s >= 65) return { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', hex: '#f59e0b' };
    return { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', hex: '#ef4444' };
  },

  /**
   * Return color classes for application status pills.
   */
  statusBadge(status) {
    const st = (status || 'Saved').toLowerCase();
    switch (st) {
      case 'applied':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'interview':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'offer':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'rejected':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }
};
