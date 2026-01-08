import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import { ApiError } from './apiClient';

/**
 * Application error types
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  PAYMENT = 'PAYMENT',
  AI_API = 'AI_API',
  UNKNOWN = 'UNKNOWN'
}

/**
 * User-friendly error messages by type and context
 */
const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: {
    title: '网络连接错误',
    message: '请检查网络连接后重试',
    action: '重试'
  },
  [ErrorType.AUTHENTICATION]: {
    title: '登录已过期',
    message: '请重新登录以继续使用',
    action: '登录'
  },
  [ErrorType.AUTHORIZATION]: {
    title: '权限不足',
    message: '您没有执行此操作的权限',
    action: '了解更多'
  },
  [ErrorType.VALIDATION]: {
    title: '输入信息有误',
    message: '请检查输入的信息并重试',
    action: '修改'
  },
  [ErrorType.SERVER]: {
    title: '服务器错误',
    message: '服务器暂时不可用，请稍后重试',
    action: '重试'
  },
  [ErrorType.PAYMENT]: {
    title: '支付处理失败',
    message: '支付过程中出现问题，请重试或联系支持',
    action: '重试'
  },
  [ErrorType.AI_API]: {
    title: 'AI 生成失败',
    message: '图像生成过程中出现问题，请重试',
    action: '重试'
  },
  [ErrorType.CLIENT]: {
    title: '操作失败',
    message: '操作未能完成，请重试',
    action: '重试'
  },
  [ErrorType.UNKNOWN]: {
    title: '未知错误',
    message: '发生未知错误，请联系技术支持',
    action: '联系支持'
  }
};

/**
 * Determine error type from various error sources
 */
export const classifyError = (error: any): ErrorType => {
  // API Error with specific codes
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return ErrorType.NETWORK;
      case 'TIMEOUT':
        return ErrorType.NETWORK;
      case 'AI_API_ERROR':
        return ErrorType.AI_API;
      default:
        switch (error.status) {
          case 401:
            return ErrorType.AUTHENTICATION;
          case 403:
            return ErrorType.AUTHORIZATION;
          case 400:
            return ErrorType.VALIDATION;
          case 500:
          case 502:
          case 503:
            return ErrorType.SERVER;
          default:
            return ErrorType.CLIENT;
        }
    }
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK;
  }

  // Payment related errors
  if (error.message?.includes('payment') || error.message?.includes('paypal')) {
    return ErrorType.PAYMENT;
  }

  // Authentication related errors
  if (error.message?.includes('token') || error.message?.includes('auth')) {
    return ErrorType.AUTHENTICATION;
  }

  return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any, context?: string): {
  type: ErrorType;
  title: string;
  message: string;
  action: string;
} => {
  const errorType = classifyError(error);

  // Get base message
  let errorInfo = ERROR_MESSAGES[errorType];
  const result = { type: errorType, ...errorInfo };

  // Customize message based on context
  if (context) {
    switch (context) {
      case 'login':
        if (errorType === ErrorType.AUTHENTICATION) {
          errorInfo = {
            title: '登录失败',
            message: '用户名或密码错误',
            action: '重试'
          };
        }
        break;
      case 'register':
        if (errorType === ErrorType.VALIDATION) {
          errorInfo = {
            title: '注册失败',
            message: '请检查输入的信息是否正确',
            action: '修改'
          };
        }
        break;
      case 'payment':
        errorInfo = ERROR_MESSAGES[ErrorType.PAYMENT];
        break;
      case 'ai_generation':
        errorInfo = ERROR_MESSAGES[ErrorType.AI_API];
        break;
    }
  }

  return { type: errorType, ...errorInfo };
};

/**
 * Handle error with appropriate user feedback
 */
export const handleError = (
  error: any,
  context?: string,
  options: {
    showToast?: boolean;
    logError?: boolean;
    onRetry?: () => void;
  } = {}
): void => {
  const { showToast = true, logError = true, onRetry } = options;

  // Log error for debugging (only in development)
  if (logError && import.meta.env.DEV) {
    console.error('[ErrorHandler]', error);
  }

  // Report error to Sentry (only in production)
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      tags: {
        context: context || 'unknown',
        errorType: classifyError(error),
      },
      extra: {
        context,
        userFriendlyMessage: getErrorMessage(error, context),
      },
    });
  }

  // Get user-friendly message
  const errorInfo = getErrorMessage(error, context);

  // Show toast notification
  if (showToast) {
    toast.error(errorInfo.title, {
      description: errorInfo.message,
      action: onRetry ? {
        label: errorInfo.action,
        onClick: onRetry,
      } : undefined,
    });
  }
};

/**
 * Create error boundary friendly error
 */
export const createErrorBoundaryError = (error: any, errorInfo?: any) => {
  const errorType = classifyError(error);
  const errorMessage = getErrorMessage(error);

  return {
    type: errorType,
    title: errorMessage.title,
    message: errorMessage.message,
    originalError: error,
    errorInfo,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Retry utility with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break; // Don't retry on last attempt
      }

      // Check if error is retryable
      const errorType = classifyError(error);
      const retryableErrors = [ErrorType.NETWORK, ErrorType.SERVER];

      if (!retryableErrors.includes(errorType)) {
        break; // Don't retry non-retryable errors
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
