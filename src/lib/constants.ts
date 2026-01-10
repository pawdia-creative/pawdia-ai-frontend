// API Configuration Constants
// Default to production worker API if VITE_API_URL is not set during build
const configuredUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev';

// Ensure API_BASE_URL includes /api suffix for direct fetch calls
export const API_BASE_URL = configuredUrl.startsWith('http') ? `${configuredUrl}/api` : configuredUrl;

// Default API URL for fallbacks (used only when absolute URL required)
export const DEFAULT_API_URL = configuredUrl.startsWith('http') ? `${configuredUrl}/api` : configuredUrl;

// Application Constants
export const APP_NAME = 'Pawdia AI';
export const APP_VERSION = '1.0.0';

// Security Constants
export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'user';

// Feature Flags (only enable in development)
export const USE_MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';
