import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from '../apiClient';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('API Client', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    // Reset tokenStorage mock
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pawdia-ai-api.pawdia-creative.workers.dev/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.data).toBe('test');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.get('/not-found')).rejects.toThrow(ApiError);
    });
  });

  describe('POST requests', () => {
    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1 }),
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await apiClient.post('/items', { name: 'test item' });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://pawdia-ai-api.pawdia-creative.workers.dev/api/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test item' }),
        })
      );

      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => new Promise(resolve => setTimeout(() => resolve({}), 100)),
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        apiClient.get('/test', { timeout: 50 })
      ).rejects.toThrow('Request timeout');
    });
  });
});
