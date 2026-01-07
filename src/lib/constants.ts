// API Configuration Constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

// Default API URL for fallbacks
export const DEFAULT_API_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

// Application Constants
export const APP_NAME = 'Pawdia AI';
export const APP_VERSION = '1.0.0';

// Security Constants
export const TOKEN_STORAGE_KEY = 'token';
export const USER_STORAGE_KEY = 'user';

// Feature Flags (only enable in development)
export const USE_MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === 'true';
