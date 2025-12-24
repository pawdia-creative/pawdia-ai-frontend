import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthContextType, AuthState, User, LoginCredentials, RegisterCredentials, UpdateProfileData } from '@/types/auth';

// API base URL - Use environment variable or Workers API
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  // Default to Workers API in production
  return 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
})();

// Debug information
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL);

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  checkedAuth: false,
};

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CHECKED' }
  | { type: 'CLEAR_ERROR' };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
        checkedAuth: true,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'AUTH_CHECKED':
      return { ...state, isLoading: false, checkedAuth: true };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: any }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check local storage for login status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // 设置加载状态为 true，防止在验证期间重定向
        dispatch({ type: 'AUTH_START' });
        
        // 添加超时处理，防止请求一直挂起
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('[AUTH] Auth check timeout after 8 seconds, aborting request');
          controller.abort();
        }, 8000); // 8秒超时
        
        try {
          console.log('[AUTH] Checking auth status with token...');
          // Verify token is valid
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId); // 清除超时

          if (response.ok) {
            const result = await response.json();
            console.log('[AUTH] Token valid, user authenticated');
            // Use latest user information from API, not old stored information
            // This ensures isVerified status is always up-to-date
            const updatedUser = result.user || JSON.parse(storedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
          } else if (response.status === 401) {
            // 明确的认证失败，尝试获取详细错误信息
            let errorData = null;
            try {
              errorData = await response.json();
              console.warn('[AUTH] Token invalid or expired, error details:', errorData);
            } catch (e) {
              console.warn('[AUTH] Token invalid or expired, could not parse error response');
            }
            
            // 清除 token 和用户数据
            console.warn('[AUTH] Clearing auth data. Status:', response.status, 'Error:', errorData?.message || errorData?.error || 'Unknown');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'AUTH_LOGOUT' });
          } else {
            // 其他错误（如 500），可能是服务器问题，保留 token 但标记为未认证
            console.error('[AUTH] Server error during auth check:', response.status);
            // 对于服务器错误，我们不清除 token，可能是临时问题
            // 但标记为未认证，用户需要重新登录
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          clearTimeout(timeoutId); // 清除超时
          console.error('[AUTH] Error checking auth status:', error);
          
          // 检查是否是超时错误
          if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            console.warn('[AUTH] Request timeout, keeping token but marking as unauthenticated');
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }
          
          // 网络错误时，不要清除 token，可能是临时网络问题
          // 只有在明确知道 token 无效时才清除
          if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          // 网络错误时，保留 token，但标记为未认证
          // 这样用户在网络恢复后可以重试
          dispatch({ type: 'AUTH_LOGOUT' });
        } finally {
          // Mark that we've finished the initial auth check (success or failure)
          dispatch({ type: 'AUTH_CHECKED' });
        }
      } else {
        // 没有 token 或 user，直接设置为未认证状态
        console.log('[AUTH] No token or user found in localStorage');
        dispatch({ type: 'AUTH_LOGOUT' });
        dispatch({ type: 'AUTH_CHECKED' });
      }
    };

    checkAuthStatus();

    // Listen for storage events to update user data when changed from other tabs/windows
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user' && event.newValue) {
        try {
          const updatedUser = JSON.parse(event.newValue);
          dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and basic user information from login
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Immediately refresh user data from /auth/me to ensure credits/subscription are up-to-date
      try {
        const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
          },
        });

        if (meResponse.ok) {
          const meData = await meResponse.json();
          if (meData.user) {
            localStorage.setItem('user', JSON.stringify(meData.user));
            dispatch({ type: 'AUTH_SUCCESS', payload: meData.user });
            return meData.user;
          }
        }
      } catch (meError) {
        console.warn('[AUTH] Failed to refresh user data after login, using login payload:', meError);
      }

      // Fallback to login payload if /auth/me fails
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      return data.user;
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      // Frontend password match validation
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          confirmPassword: credentials.confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Do NOT auto-login the user after registration.
      // Registration should require email verification first.
      // Keep the token returned by the API for possible verification flows, but do not store it as an active session.
      console.log('[AUTH] Registration completed - not auto-logging in. User must verify email.');
      // Clear the loading state so UI (login/register pages) do not remain stuck showing "Signing in..."
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update local storage user information
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData: Partial<User>) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    updateUser,
  };

  // Ensure there's a way for UI to reset a stuck loading state
  const ensureIdle = () => {
    if (state.isLoading && !state.isAuthenticated) {
      console.warn('[AUTH] ensureIdle invoked - clearing loading state');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Expose ensureIdle through the context value
  const extendedValue: AuthContextType & { ensureIdle?: () => void } = {
    ...value,
    ensureIdle,
  };
  return <AuthContext.Provider value={extendedValue as any}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};