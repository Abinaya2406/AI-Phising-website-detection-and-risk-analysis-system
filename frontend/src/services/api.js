// PhishGuard AI API Client Configuration
// Supports dynamic base URL configuration and graceful Demo Mode fallback.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const DEMO_MODE_DEFAULT = import.meta.env.VITE_ENABLE_DEMO_MODE !== 'false';

// Simple in-memory flag that user can also toggle via UI
let isDemoModeActive = DEMO_MODE_DEFAULT;

export const setDemoMode = (enabled) => {
  isDemoModeActive = Boolean(enabled);
  localStorage.setItem('phishguard_demo_mode', isDemoModeActive ? 'true' : 'false');
};

export const getDemoMode = () => {
  const saved = localStorage.getItem('phishguard_demo_mode');
  if (saved !== null) {
    return saved === 'true';
  }
  return isDemoModeActive;
};

export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Robust API request wrapper with timeout and standard error envelope
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const timeoutMs = options.timeout || 12000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (_) {
        errorMessage = await response.text().catch(() => errorMessage);
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const err = new Error(`Connection timed out after ${timeoutMs / 1000} seconds`);
      err.isTimeout = true;
      throw err;
    }
    throw error;
  }
}

