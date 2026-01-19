// API Configuration Constants
// Determine API base URL. Prefer explicit VITE_API_URL; when not provided in production
// use a same-origin relative path (`/api`) so authentication cookies are set on the site's domain.
const rawConfiguredUrl = (import.meta.env.VITE_API_URL || '').trim();

// Normalize configured URL:
// - If empty -> default to same-origin '/api'
// - If starts with http(s) and already ends with '/api', use as-is (no double '/api')
// - If starts with http(s) and DOES NOT end with '/api', append '/api'
// - If provided as a relative path (doesn't start with http), use it as-is
function computeApiBase(raw: string) {
  if (!raw) return '/api';
  const cleaned = raw.replace(/\/+$/, ''); // remove trailing slashes
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }
  // relative path (e.g. '/api' or '/worker')
  return cleaned;
}

export const API_BASE_URL = computeApiBase(rawConfiguredUrl);

// Keep a DEFAULT_API_URL alias for any absolute-url fallbacks (uses VITE_API_URL when set, otherwise /api)
export const DEFAULT_API_URL = API_BASE_URL;

// Application Constants
export const APP_NAME = 'Pawdia AI';
export const APP_VERSION = '1.0.0';

// Security Constants
export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'user';

// Feature Flags (only enable in development)
export const USE_MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';
