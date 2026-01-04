import { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthContextType, AuthState, User, LoginCredentials, RegisterCredentials, UpdateProfileData, LoginResult } from '@/types/auth';

// API base URL - Use environment variable or Workers API
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // Check if we're in development mode and use local API
  if (import.meta.env.DEV) {
    return 'http://localhost:8787/api';
  }

  // Default to Workers API in production
  return 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
})();

// Temporary mock mode for testing when API is unavailable
const USE_MOCK_AUTH = false;

// Secure token storage - using memory storage for better security
// Token will be lost on page refresh, requiring re-authentication
class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private token: string | null = null;

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }
}

const tokenStorage = SecureTokenStorage.getInstance();

// Debug information
if (import.meta.env.DEV) console.log('API_BASE_URL:', API_BASE_URL);
if (import.meta.env.DEV) console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL);

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
  | { type: 'CLEAR_ERROR' }
  | { type: 'SYNC_SUCCESS'; payload: User };

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
    case 'SYNC_SUCCESS':
      return {
        ...state,
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
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Helper to safely mark user as authenticated only if verified or admin.
  const safeAuthSuccess = (user: User) => {
    const isVerified = (user?.isVerified === true) || ((user as unknown as { is_verified?: number })?.is_verified === 1);
    const isAdmin = (user?.isAdmin === true) || ((user as unknown as { is_admin?: number })?.is_admin === 1);

    if (isVerified || isAdmin) {
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } else {
      // Ensure we keep token for verification flows but do not mark as authenticated.
      try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
      if (import.meta.env.DEV) console.warn('[AUTH] safeAuthSuccess blocked non-verified user', { userId: user?.id, email: user?.email });
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Check secure storage for login status
  // Periodic consistency check to ensure local data matches server state
  useEffect(() => {
    const consistencyCheck = async () => {
      const token = tokenStorage.getToken();
      const storedUserStr = localStorage.getItem('user');

      if (token && storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          // Quick server check to ensure data consistency
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000) // 5 second timeout for consistency check
          });

          if (response.ok) {
            const serverData = await response.json();
            const serverUser = serverData.user;

            // Check if local data matches server data
            const localVerified = (storedUser?.isVerified === true || storedUser?.is_verified === 1);
            const serverVerified = (serverUser?.isVerified === true || serverUser?.is_verified === 1);

            if (localVerified !== serverVerified) {
              console.warn('[AUTH] Data inconsistency detected, updating local state', {
                localVerified,
                serverVerified,
                userId: storedUser.id
              });

              // Update local storage with correct server data
              localStorage.setItem('user', JSON.stringify(serverUser));

              // Update auth state if verification status changed
              if (serverVerified) {
                safeAuthSuccess(serverUser);
              } else {
                dispatch({ type: 'AUTH_LOGOUT' });
                try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
              }
            }
          }
        } catch (error) {
          // Ignore consistency check errors to avoid disrupting user experience
          if (import.meta.env.DEV) console.debug('[AUTH] Consistency check failed:', error);
        }
      }
    };

    // Run consistency check every 2 minutes to reduce API calls and prevent loops
    const intervalId = setInterval(consistencyCheck, 120000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = tokenStorage.getToken();
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // 设置加载状态为 true，防止在验证期间重定向
        dispatch({ type: 'AUTH_START' });
        
        // 添加超时处理，防止请求一直挂起
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          if (import.meta.env.DEV) console.warn('[AUTH] Auth check timeout after 8 seconds, aborting request');
          controller.abort();
        }, 8000); // 8秒超时
        
        try {
          if (import.meta.env.DEV) console.log('[AUTH] Checking auth status with token...');
          // Mock auth check for testing when API is unavailable
        if (USE_MOCK_AUTH) {
          if (import.meta.env.DEV) console.log('[AUTH] Mock auth check - using stored user data');
          const parsedUser = JSON.parse(storedUser);
          // Even in mock mode, enforce email verification
          const isVerified = (parsedUser.isVerified === true) || (parsedUser.is_verified === 1);
          const isAdmin = (parsedUser.isAdmin === true) || (parsedUser.is_admin === 1);

          if (isVerified || isAdmin) {
            safeAuthSuccess(parsedUser);
          } else {
            if (import.meta.env.DEV) console.warn('[AUTH] Mock user not verified, marking as not authenticated');
            try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
            dispatch({ type: 'AUTH_LOGOUT' });
          }
          dispatch({ type: 'AUTH_CHECKED' });
          return;
        }

        // Verify token is valid
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        // Store token in secure storage if verification succeeds
        if (response.ok) {
          tokenStorage.setToken(token);
        }

          clearTimeout(timeoutId); // 清除超时

          if (response.ok) {
            const result = await response.json();
            if (import.meta.env.DEV) console.log('[AUTH] Token valid, received user data', result.user);
            // Normalize isVerified flag (API may return is_verified)
            const apiUser = result.user || JSON.parse(storedUser);
            const normalizedUser = {
              ...apiUser,
              isVerified: (apiUser.isVerified !== undefined) ? apiUser.isVerified : (apiUser.is_verified === 1)
            };
            // Store latest user info but only consider authenticated if verified
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            if (normalizedUser.isVerified) {
              console.log('[AUTH] User verified, allowing authentication', {
                userId: normalizedUser.id,
                userEmail: normalizedUser.email,
                isVerified: normalizedUser.isVerified
              });
              safeAuthSuccess(normalizedUser);
            } else {
              // Keep token for resend flows but do not mark as authenticated
              console.warn('[AUTH] BLOCKING AUTH: User not verified, marking as not authenticated', {
                userId: normalizedUser.id,
                userEmail: normalizedUser.email,
                isVerified: normalizedUser.isVerified,
                isAdmin: normalizedUser.isAdmin
              });
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } else if (response.status === 401) {
            // 明确的认证失败，尝试获取详细错误信息
            let errorData = null;
            try {
              errorData = await response.json();
              if (import.meta.env.DEV) console.warn('[AUTH] Token invalid or expired, error details:', errorData);
            } catch (e) {
              if (import.meta.env.DEV) console.warn('[AUTH] Token invalid or expired, could not parse error response');
            }
            
            // 清除 token 和用户数据
            if (import.meta.env.DEV) console.warn('[AUTH] Clearing auth data. Status:', response.status, 'Error:', errorData?.message || errorData?.error || 'Unknown');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'AUTH_LOGOUT' });
          } else {
            // 其他错误（如 500），可能是服务器问题，保留 token 但标记为未认证
            if (import.meta.env.DEV) console.error('[AUTH] Server error during auth check:', response.status);
            // 对于服务器错误，我们不清除 token，可能是临时问题
            // 但标记为未认证，用户需要重新登录
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          clearTimeout(timeoutId); // 清除超时
          if (import.meta.env.DEV) console.error('[AUTH] Error checking auth status:', error);
          
          // 检查是否是超时错误
          if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            if (import.meta.env.DEV) console.warn('[AUTH] Request timeout, keeping token but marking as unauthenticated');
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
        if (import.meta.env.DEV) console.log('[AUTH] No token or user found in localStorage');
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
          safeAuthSuccess(updatedUser);
        } catch (error) {
          if (import.meta.env.DEV) console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    dispatch({ type: 'AUTH_START' });

    // Mock login for testing when API is unavailable
    if (USE_MOCK_AUTH) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock successful login
      const mockUser: User = {
        id: 'mock-user-123',
        email: credentials.email,
        name: credentials.email.split('@')[0],
        createdAt: new Date().toISOString(),
        credits: 10,
        isAdmin: false,
        isVerified: true
      };

      const mockToken = 'mock-jwt-token-' + Date.now();

      // Persist verified mock session
      tokenStorage.setToken(mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      safeAuthSuccess(mockUser);

      if (import.meta.env.DEV) console.log('[AUTH] Mock login successful for:', credentials.email);
      return { ...mockUser, token: mockToken };
    }

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
        dispatch({ type: 'AUTH_FAILURE', payload: data?.message || 'Login failed' });
        throw new Error(data.message || 'Login failed');
      }

      const tempToken = data.token;
      const claimedUser = data.user || {};

      if (import.meta.env.DEV) console.log('[AUTH] Login successful, validating token and fetching user data...');

      // Persist token so verification/resend flows can work even for unverified users.
      tokenStorage.setToken(tempToken);

      // Call /auth/me immediately to obtain canonical user info and verification status
      try {
        const meResp = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${tempToken}` },
        });

        if (!meResp.ok) {
          // Token rejected — clear any stored token and fail
          if (meResp.status === 401) {
            tokenStorage.clearToken();
            localStorage.removeItem('user');
            dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid credentials or expired token' });
            throw new Error('Invalid credentials or expired token');
          }
          // For other errors, do not authenticate; keep token for possible resend flows but block access
          dispatch({ type: 'AUTH_FAILURE', payload: 'Unable to validate login' });
          try { localStorage.setItem('user', JSON.stringify(claimedUser)); } catch (e) { /* Ignore localStorage errors */ }
          try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
          dispatch({ type: 'AUTH_LOGOUT' });
          return { ...claimedUser, token: tempToken, isVerified: false, isFirstLogin: data.isFirstLogin };
        }

        const meData = await meResp.json();
        const serverUser = meData.user || claimedUser;
        const normalizedUser = {
          ...serverUser,
          isVerified: (serverUser.isVerified !== undefined) ? serverUser.isVerified : (serverUser.is_verified === 1)
        };

        // Store canonical user representation
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        const isVerified = normalizedUser.isVerified === true;
        const isAdmin = normalizedUser.isAdmin === true;

        if (isVerified || isAdmin) {
          // Persist token and mark authenticated
          tokenStorage.setToken(tempToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: normalizedUser });
          if (import.meta.env.DEV) console.log('[AUTH] User verified — authentication granted', { email: normalizedUser.email });
          return { ...normalizedUser, token: tempToken, isVerified, isAdmin, isFirstLogin: data.isFirstLogin };
        } else {
          // Keep token for resend flows but do NOT mark as authenticated
          try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
          dispatch({ type: 'AUTH_LOGOUT' });
          if (import.meta.env.DEV) console.warn('[AUTH] User not verified — blocking authentication', { email: normalizedUser.email });
          return { ...normalizedUser, token: tempToken, isVerified: false, isFirstLogin: data.isFirstLogin };
        }
      } catch (err) {
        // Network or unexpected error validating /auth/me
        if (import.meta.env.DEV) console.error('[AUTH] Error validating token after login:', err);
        // Keep token so user can resend verification, but do not authenticate
        try { localStorage.setItem('user', JSON.stringify(claimedUser)); } catch (e) { /* Ignore localStorage errors */ }
        try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
        dispatch({ type: 'AUTH_LOGOUT' });
        return { ...claimedUser, token: tempToken, isVerified: false, isFirstLogin: data.isFirstLogin };
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    dispatch({ type: 'AUTH_START' });

    // Mock registration for testing when API is unavailable
    if (USE_MOCK_AUTH) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      // Frontend password match validation
      if (credentials.password !== credentials.confirmPassword) {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Passwords do not match' });
        throw new Error('Passwords do not match');
      }

      // Mock successful registration
      if (import.meta.env.DEV) console.log('[AUTH] Mock registration successful for:', credentials.email);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'AUTH_LOGOUT' });
      return;
    }

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
      if (import.meta.env.DEV) console.log('[AUTH] Registration completed - not auto-logging in. User must verify email.');
      // Clear the loading state so UI (login/register pages) do not remain stuck showing "Signing in..."
      // Ensure any existing session data is removed so a newly registered email cannot reuse old localStorage state.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    tokenStorage.clearToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const token = tokenStorage.getToken();
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
        safeAuthSuccess(updatedUser);
      }

    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating profile:', error);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData: Partial<User>) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        safeAuthSuccess(updatedUser);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error updating user data:', error);
        // If localStorage is corrupted, clear it and logout
        localStorage.removeItem('user');
        tokenStorage.clearToken();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }
  };

  // Enhanced state synchronization with server
  const syncVerificationStatus = async (): Promise<boolean> => {
    const token = tokenStorage.getToken();
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const serverUser = data.user;

        if (serverUser) {
          // Normalize verification flags
          const normalizedServerUser = {
            ...serverUser,
            isVerified: (serverUser.isVerified === true) || (serverUser.is_verified === 1),
            isAdmin: (serverUser.isAdmin === true) || (serverUser.is_admin === 1)
          };

          // Update local storage with server data
          localStorage.setItem('user', JSON.stringify(normalizedServerUser));

          // Update context state
          safeAuthSuccess(normalizedServerUser);

          if (import.meta.env.DEV) console.log('Verification status synced with server');
          return true;
        }
      } else if (response.status === 401) {
        // Token is invalid, logout
        if (import.meta.env.DEV) console.warn('Token invalid during sync, logging out');
        logout();
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error syncing verification status:', error);
    }

    return false;
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    updateUser,
    syncVerificationStatus,
  };

  // Ensure there's a way for UI to reset a stuck loading state
  const ensureIdle = () => {
    if (state.isLoading && !state.isAuthenticated) {
      if (import.meta.env.DEV) console.warn('[AUTH] ensureIdle invoked - clearing loading state');
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Expose ensureIdle through the context value
  const extendedValue: AuthContextType & { ensureIdle: () => void } = {
    ...value,
    ensureIdle,
  };
  return <AuthContext.Provider value={extendedValue}>{children}</AuthContext.Provider>;
};

// Export secure token storage for use in other files
export { tokenStorage };

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};