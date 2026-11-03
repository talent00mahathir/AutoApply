/**
 * Centralized API Client for AutoApply.
 * Injects JWT Bearer token, CSRF headers, and manages error responses.
 */

import { Utils } from './utils.js';

export const API = {
  TOKEN_KEY: 'autoapply_jwt_token',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  },

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};

    // Standard security header
    headers['X-Requested-With'] = 'XMLHttpRequest';

    // Inject Bearer token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default JSON Content-Type unless FormData is sent
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);

      // Handle session expiration
      if (response.status === 401 && endpoint !== '/api/auth/login') {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      // Check if response is binary (e.g. PDF download)
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/pdf')) {
        if (!response.ok) {
          throw new Error('PDF generation failed on server.');
        }
        return await response.blob();
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(Utils.formatError(data));
        error.status = response.status;
        error.detail = data.detail;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw new Error(err.message || 'Network connection error. Is the backend server running?');
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
