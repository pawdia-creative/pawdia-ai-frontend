// API Configuration Constants
// Determine API base URL. Prefer explicit VITE_API_URL; when not provided in production
// use a same-origin relative path (`/api`) so authentication cookies are set on the site's domain.
const rawConfiguredUrl = import.meta.env.VITE_API_URL || '';

// If a fully-qualified URL is provided (starts with http), use that and append /api.
// Otherwise default to same-origin path '/api' which ensures cookies are scoped to the site domain.
export const API_BASE_URL = rawConfiguredUrl
  ? (rawConfiguredUrl.startsWith('http') ? `${rawConfiguredUrl.replace(/\/+$/, '')}/api` : rawConfiguredUrl)
  : '/api';

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
