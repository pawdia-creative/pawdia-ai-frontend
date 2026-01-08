import { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthContextType, AuthState, User, LoginCredentials, RegisterCredentials, UpdateProfileData, LoginResult } from '@/types/auth';
import { API_BASE_URL, USE_MOCK_AUTH } from '@/lib/constants';
import { normalizeUser, isUserVerified, isUserAdmin } from '@/lib/dataTransformers';
import { apiClient } from '@/lib/apiClient';

// Secure token storage - using localStorage for persistence
// Token persists across page refreshes for better user experience
class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private readonly TOKEN_KEY = 'auth_token';

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store token in localStorage:', error);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear token from localStorage:', error);
    }
  }
}

const tokenStorage = SecureTokenStorage.getInstance();

// Debug information (development only)
if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('USE_MOCK_AUTH:', USE_MOCK_AUTH);
}

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
    const isVerified = isUserVerified(user);
    const isAdmin = isUserAdmin(user);

    if (isVerified || isAdmin) {
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } else {
      // Ensure we keep token for verification flows but do not mark as authenticated.
      try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
      if (import.meta.env.DEV) console.warn('[AUTH] safeAuthSuccess blocked non-verified user', { userId: user?.id, email: user?.email });
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Periodic consistency check to ensure local data matches server state (uses cookie-based auth via apiClient)
  useEffect(() => {
    const consistencyCheck = async () => {
      const storedUserStr = localStorage.getItem('user');
      if (!storedUserStr) return;
      let storedUser: any = null;
      try {
        storedUser = JSON.parse(storedUserStr);
      } catch (e) {
        if (import.meta.env.DEV) console.debug('[AUTH] Failed to parse stored user for consistency check', e);
        return;
      }

      try {
        const resp = await apiClient.get<{ user: any }>('/auth/me', { timeout: 5000 });
        const serverUser = resp.data?.user;
        if (!serverUser) return;

        const localVerified = isUserVerified(storedUser);
        const serverVerified = isUserVerified(serverUser);

        if (localVerified !== serverVerified) {
          if (import.meta.env.DEV) console.warn('[AUTH] Data inconsistency detected, updating local state', {
            localVerified,
            serverVerified,
            userId: storedUser?.id
          });
          const normalizedUser = normalizeUser(serverUser);
          if (normalizedUser) {
            localStorage.setItem('user', JSON.stringify(normalizedUser));
          }
          if (serverVerified) {
            safeAuthSuccess(serverUser);
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
            try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) console.debug('[AUTH] Consistency check fetch failed:', error);
      }
    };

    const intervalId = setInterval(consistencyCheck, 120000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Attempt to validate session using cookie-based auth via apiClient
      dispatch({ type: 'AUTH_START' });
      try {
        const resp = await apiClient.get<{ user: any }>('/auth/me', { timeout: 15000 });
        const data = resp.data as { user?: any } | undefined;
        const serverUser = data?.user ?? null;
        if (serverUser) {
          const normalized = normalizeUser(serverUser) || { ...serverUser, isVerified: isUserVerified(serverUser), isAdmin: isUserAdmin(serverUser) };
          if (normalized) {
            localStorage.setItem('user', JSON.stringify(normalized));
            safeAuthSuccess(normalized);
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // No user in response - ensure logged out state
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error: any) {
        if ((error && (error.status === 401)) || (error instanceof Error && (error as any).status === 401)) {
          if (import.meta.env.DEV) console.warn('[AUTH] No valid session (401), logging out');
          tokenStorage.clearToken();
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_LOGOUT' });
        } else {
          if (import.meta.env.DEV) console.error('[AUTH] Error checking auth status:', error);
          // On network/server errors, mark unauthenticated but keep local data
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } finally {
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

      // After login the server sets an HttpOnly cookie; use /auth/me via apiClient to retrieve canonical user info
      try {
        const meResp = await apiClient.get<{ user: any }>('/auth/me', { timeout: 15000 });
        const meData = meResp.data as { user?: any } | undefined;
        const serverUser = meData?.user || claimedUser;
        // Prefer normalizeUser to handle varied backend representations (numbers/strings)
        const normalizedUser = normalizeUser(serverUser) || { ...serverUser, isVerified: isUserVerified(serverUser), isAdmin: isUserAdmin(serverUser) };

        // Store canonical user representation
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        const isVerified = isUserVerified(normalizedUser);
        const isAdmin = isUserAdmin(normalizedUser);

        if (isVerified || isAdmin) {
          // Mark authenticated (session via cookie)
          dispatch({ type: 'AUTH_SUCCESS', payload: normalizedUser });
          if (import.meta.env.DEV) console.log('[AUTH] User verified — authentication granted', { email: normalizedUser.email });
          return { ...normalizedUser, token: tempToken, isVerified, isAdmin, isFirstLogin: data.isFirstLogin };
        } else {
          // Keep flow for resend but do NOT mark as authenticated
          try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore */ }
          dispatch({ type: 'AUTH_LOGOUT' });
          if (import.meta.env.DEV) console.warn('[AUTH] User not verified — blocking authentication', { email: normalizedUser.email });
          return { ...normalizedUser, token: tempToken, isVerified: false, isFirstLogin: data.isFirstLogin };
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[AUTH] Error validating token after login:', err);
        try { localStorage.setItem('user', JSON.stringify(claimedUser)); } catch (e) { /* Ignore */ }
        try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore */ }
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

      tokenStorage.clearToken();
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
      tokenStorage.clearToken();
      localStorage.removeItem('user');
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend to clear HttpOnly cookie
      await apiClient.post('/auth/logout');
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[AUTH] Logout request failed:', e);
    }
    // Clear client-side state
    localStorage.removeItem('user');
    tokenStorage.clearToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const response = await apiClient.put('/users/profile', data);

      const result = response.data as any;
      if (response.status !== 200) {
        throw new Error(result?.message || 'Failed to update profile');
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
    try {
      const resp = await apiClient.get<{ user: any }>('/auth/me');
      const data = resp.data as { user?: any } | undefined;
      const serverUser = data?.user;
      if (serverUser) {
        const normalized = normalizeUser(serverUser) || { ...serverUser, isVerified: isUserVerified(serverUser), isAdmin: isUserAdmin(serverUser) };
        localStorage.setItem('user', JSON.stringify(normalized));
        safeAuthSuccess(normalized);
        if (import.meta.env.DEV) console.log('Verification status synced with server');
        return true;
      }
    } catch (error: any) {
      if ((error && (error.status === 401)) || (error instanceof Error && (error as any).status === 401)) {
        if (import.meta.env.DEV) console.warn('Token invalid during sync, logging out');
        await logout();
        return false;
      }
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