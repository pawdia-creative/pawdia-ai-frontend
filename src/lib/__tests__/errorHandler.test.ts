import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classifyError, getErrorMessage, handleError, ErrorType } from '../errorHandler';
import { ApiError } from '../apiClient';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    (toast.error as unknown as ReturnType<typeof vi.fn>).mockClear();
    (toast.success as unknown as ReturnType<typeof vi.fn>).mockClear();
  });
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;
  beforeEach(() => {
    // Silence console.error during tests to avoid noisy stderr output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    if (consoleErrorSpy) (consoleErrorSpy as { mockRestore?: () => void }).mockRestore?.();
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


