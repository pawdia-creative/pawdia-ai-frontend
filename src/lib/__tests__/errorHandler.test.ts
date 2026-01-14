import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classifyError, getErrorMessage, handleError, ErrorType } from '../errorHandler';
import { ApiError } from '../apiClient';
import { toast } from '@/lib/toast';

// Mock the toast module directly
vi.mock('@/lib/toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('errorHandler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any; // Vitest spy types are complex to type precisely

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Silence console.error during tests to avoid noisy stderr output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
  });

  it('should classify ApiError with NETWORK_ERROR code as NETWORK', () => {
    const err = new ApiError('Network issue', 0, 'NETWORK_ERROR');
    expect(classifyError(err)).toBe(ErrorType.NETWORK);
  });

  it('getErrorMessage returns proper title for AUTHENTICATION', () => {
    const err = new ApiError('Token expired', 401, 'AUTH_EXPIRED');
    const info = getErrorMessage(err);
    expect(info.type).toBe(ErrorType.AUTHENTICATION);
    expect(info.title).toMatch(/登录/);
  });

  it('handleError calls toast.error by default', () => {
    const e = new Error('Test');
    handleError(e);
    expect(toast.error).toHaveBeenCalled();
  });
});


