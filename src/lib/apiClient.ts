import { API_BASE_URL } from './constants';
import { tokenStorage } from '@/lib/tokenStorage';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Request configuration
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Unified API client for all backend communications
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    let data: any;
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `HTTP ${response.status}`;
      throw new ApiError(message, response.status, data?.code);
    }

    return {
      data,
      message: data?.message,
      status: response.status,
    };
  }

  /**
   * Make HTTP request with timeout and error handling
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const headers = {
      ...this.getAuthHeaders(),
      ...config.headers,
    };

    const requestConfig: RequestInit = {
      method,
      headers,
      signal: config.signal ?? null,
      // Ensure cookies are sent for cookie-based auth
      credentials: 'include' as RequestCredentials,
    };

    if (data && (method !== 'GET' && method !== 'HEAD')) {
      requestConfig.body = JSON.stringify(data);
    }

    // Add timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (config.timeout) {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), config.timeout);
      requestConfig.signal = controller.signal;
    }

    try {
      const response = await fetch(url, requestConfig);
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // If error already looks like an ApiError (has status), rethrow preserving it
      if (error && typeof error.status === 'number') {
        throw error;
      }

      // Handle ApiError instances more robustly
      if (error instanceof ApiError || error?.name === 'ApiError') {
        throw error;
      }

      // Handle network errors, timeouts, etc.
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408, 'TIMEOUT');
        }
        throw new ApiError(error.message, 0, 'NETWORK_ERROR');
      }

      throw new ApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR');
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }
}

export const apiClient = new ApiClient();

// Export singleton instance
