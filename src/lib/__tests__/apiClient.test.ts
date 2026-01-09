/// <reference types="vitest" />
declare const vi: any;
import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../apiClient';
import { tokenStorage } from '@/lib/tokenStorage';
import { API_BASE_URL } from '../constants';

// Mock fetch API
const mockFetch = vi.fn();
(global as any).fetch = mockFetch;

vi.mock('@/contexts/AuthContext', () => ({
  tokenStorage: {
    getToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    (tokenStorage.getToken as any).mockClear();
    (tokenStorage.clearToken as any).mockClear();
  });

  it('should make a GET request with authorization header', async () => {
    (tokenStorage.getToken as any).mockReturnValue('test-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ message: 'success' }),
    });

    const response = await apiClient.get('/test');

    // Inspect actual fetch call arguments instead of strict matching for signal
    expect(mockFetch).toHaveBeenCalled();
    const [calledUrl, calledReq] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe(`${API_BASE_URL}/test`);
    expect(calledReq.method).toBe('GET');
    expect(calledReq.headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    });
    expect(response.data).toEqual({ message: 'success' });
  });

  it('should make a POST request with data and authorization header', async () => {
    (tokenStorage.getToken as any).mockReturnValue('test-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ id: 1, name: 'new item' }),
    });

    const payload = { name: 'new item' };
    const response = await apiClient.post('/items', payload);

    expect(mockFetch).toHaveBeenCalled();
    const [calledUrl2, calledReq2] = mockFetch.mock.calls[0];
    expect(calledUrl2).toBe(`${API_BASE_URL}/items`);
    expect(calledReq2.method).toBe('POST');
    expect(calledReq2.headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    });
    expect(calledReq2.body).toBe(JSON.stringify(payload));
    expect(response.data).toEqual({ id: 1, name: 'new item' });
  });

  it('should throw ApiError for non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ message: 'Resource not found', code: 'NOT_FOUND' }),
    });

    await expect(apiClient.get('/non-existent')).rejects.toMatchObject({ status: 404 });
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(apiClient.get('/network-error')).rejects.toThrow(ApiError);
  });
});


