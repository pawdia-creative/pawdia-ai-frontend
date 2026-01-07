import { describe, it, expect, vi } from 'vitest';
import { classifyError, getErrorMessage, ApiError } from '../errorHandler';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('Error Handler', () => {
  describe('classifyError', () => {
    it('should classify API errors', () => {
      const apiError = new ApiError('Not found', 404);
      expect(classifyError(apiError)).toBe('CLIENT');
    });

    it('should classify network errors', () => {
      const networkError = new TypeError('Failed to fetch');
      expect(classifyError(networkError)).toBe('NETWORK');
    });

    it('should classify authentication errors', () => {
      const authError = new ApiError('Unauthorized', 401);
      expect(classifyError(authError)).toBe('AUTHENTICATION');
    });

    it('should return UNKNOWN for unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      expect(classifyError(unknownError)).toBe('UNKNOWN');
    });
  });

  describe('getErrorMessage', () => {
    it('should return appropriate message for network error', () => {
      const networkError = new TypeError('Failed to fetch');
      const message = getErrorMessage(networkError);

      expect(message.title).toBe('网络连接错误');
      expect(message.message).toBe('请检查网络连接后重试');
    });

    it('should customize message based on context', () => {
      const apiError = new ApiError('Not found', 404);
      const message = getErrorMessage(apiError, 'login');

      expect(message.title).toBe('登录失败');
      expect(message.message).toBe('用户名或密码错误');
    });

    it('should return default message for unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const message = getErrorMessage(unknownError);

      expect(message.title).toBe('未知错误');
      expect(message.message).toBe('发生未知错误，请联系技术支持');
    });
  });
});
