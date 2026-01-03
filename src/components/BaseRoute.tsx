import { useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import EmailVerificationRequired from '@/pages/EmailVerificationRequired';

export interface BaseRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  redirectPath?: string;
  accessDeniedMessage?: string;
  requireEmailVerification?: boolean;
  publicForGuests?: boolean; // Allow access for completely unauthenticated users (no token)
}

const BaseRoute = ({
  children,
  adminOnly = false,
  redirectPath = '/login',
  accessDeniedMessage = 'Access Denied',
  requireEmailVerification = true,
  publicForGuests = false,
}: BaseRouteProps) => {
  const { isAuthenticated, isLoading, user, checkedAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 添加调试日志
  useEffect(() => {
    if (import.meta.env.DEV) {
      const token = tokenStorage.getToken();
      const storedUser = localStorage.getItem('user');
      if (import.meta.env.DEV) {
        console.log('[BaseRoute] Auth state:', {
          isAuthenticated,
          isLoading,
          checkedAuth,
          hasUser: !!user,
          userVerified: user?.isVerified || user?.is_verified,
          hasToken: !!token,
          hasStoredUser: !!storedUser,
          path: location.pathname,
          publicForGuests
        });
      }
    }
  }, [isAuthenticated, isLoading, checkedAuth, user, location.pathname, publicForGuests]);

  // Only redirect to login *after* we've completed the initial auth check.
  // But allow access to verification flow even if not authenticated (for email verification)
  // And allow public access for guests if publicForGuests is true
  useEffect(() => {
    if (!isLoading && checkedAuth && !isAuthenticated) {
      // Check if user has a token (might be in verification flow)
      const token = tokenStorage.getToken();
      const storedUser = localStorage.getItem('user');
      const hasStoredCredentials = !!(token && storedUser);

      if (hasStoredCredentials) {
        // User has token but not authenticated - might be in verification flow
        // Don't redirect to login, let the verification check below handle it
        if (import.meta.env.DEV) console.log('[BaseRoute] User has token but not authenticated - checking verification status');
        return;
      }

      // No stored credentials - check if public access is allowed
      if (publicForGuests) {
        if (import.meta.env.DEV) console.log('[BaseRoute] Public access allowed for guests, not redirecting');
        return;
      }

      if (import.meta.env.DEV) console.log('[BaseRoute] Not authenticated and no token, navigating to login from:', location.pathname);
      navigate(redirectPath, { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, checkedAuth, navigate, redirectPath, location, publicForGuests]);

  if (isLoading) {
    if (import.meta.env.DEV) console.log('[BaseRoute] Loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If auth check is complete but still not authenticated, check if we should show verification
  if (checkedAuth && !isAuthenticated) {
    const token = tokenStorage.getToken();
    const storedUserStr = localStorage.getItem('user');
    if (token && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        const isVerified = (storedUser?.isVerified === true || storedUser?.is_verified === 1);
        const isAdmin = (storedUser?.isAdmin === true || storedUser?.is_admin === 1);

        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) {
            console.log('[BaseRoute] Auth check complete, user has token but not authenticated:', {
              isVerified,
              isAdmin,
              requireEmailVerification,
              willShowVerification: (requireEmailVerification && !isVerified && !isAdmin)
            });
          }
        }

        if (requireEmailVerification && !isVerified && !isAdmin) {
          return <EmailVerificationRequired />;
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('[BaseRoute] Error parsing stored user for verification check:', error);
      }
    }
  }

  // Special handling for users with tokens but not authenticated (verification flow)
  const hasStoredCredentials = !!tokenStorage.getToken() && !!localStorage.getItem('user');

  if (!isAuthenticated && (!checkedAuth || isLoading) && !hasStoredCredentials) {
    // Still checking auth status and no stored credentials, show spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // GLOBAL SECURITY CHECK: Always verify user status before allowing access
  // This prevents any bypass of email verification
  const token = tokenStorage.getToken();
  const storedUserStr = localStorage.getItem('user');
  const mustVerifyFlag = localStorage.getItem('must_verify');

  if (token && storedUserStr) {
    try {
      const storedUser = JSON.parse(storedUserStr);
      const isAdmin = (storedUser?.isAdmin === true) || (storedUser?.is_admin === 1);
      const isVerified = (storedUser?.isVerified === true || storedUser?.is_verified === 1);

      // CRITICAL: If must_verify flag is set, force verification regardless of stored data
      if (mustVerifyFlag === '1') {
        console.warn('[BaseRoute] GLOBAL BLOCK: must_verify flag active, forcing verification');
        return <EmailVerificationRequired />;
      }

      // If user has token but is not verified and not admin, block access
      if (!isVerified && !isAdmin) {
        console.warn('[BaseRoute] GLOBAL BLOCK: User has token but not verified, forcing verification', {
          userId: storedUser.id,
          userEmail: storedUser.email,
          isVerified,
          isAdmin,
          hasToken: !!token,
          storedUserData: storedUser
        });
        return <EmailVerificationRequired />;
      }
    } catch (error) {
      console.error('[BaseRoute] Error parsing stored user for global check:', error);
      // If we can't parse stored user data, clear it to prevent issues
      try {
        localStorage.removeItem('user');
        tokenStorage.clearToken();
      } catch (clearError) {
        console.error('[BaseRoute] Error clearing corrupted data:', clearError);
      }
    }
  }

  // PRIORITY: Check if email verification is required BEFORE any other logic
  // This ensures that even if user is "authenticated", we still enforce verification
  if (requireEmailVerification) {
    // Get user info - either from auth context or localStorage (for verification flow)
    let currentUser = user;
    if (!currentUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch (error) {
          if (import.meta.env.DEV) console.error('[BaseRoute] Error parsing stored user:', error);
        }
      }
    }

    const isAdmin = (currentUser?.isAdmin === true) || (currentUser?.is_admin === 1);
    const isVerified = (currentUser?.isVerified === true || currentUser?.is_verified === 1);

    if (import.meta.env.DEV) {
      console.log('[BaseRoute] PRIORITY verification check:', {
        requireEmailVerification,
        hasCurrentUser: !!currentUser,
        isVerified,
        isAdmin,
        currentUserId: currentUser?.id,
        currentUserEmail: currentUser?.email,
        isAuthenticated,
        willShowVerificationRequired: (currentUser && !isVerified && !isAdmin)
      });
    }

    // FORCE verification check: if user exists but is not verified and not admin, show verification page
    if (currentUser && !isVerified && !isAdmin) {
      console.warn('[BaseRoute] BLOCKING ACCESS: User not verified, showing EmailVerificationRequired', {
        userId: currentUser.id,
        userEmail: currentUser.email,
        isVerified,
        isAdmin,
        userData: currentUser
      });
      return <EmailVerificationRequired />;
    }

    // If a MUST_VERIFY flag is present (explicit requirement), force verification UI regardless
    const mustVerifyFlag = localStorage.getItem('must_verify');
    if (mustVerifyFlag === '1') {
      console.warn('[BaseRoute] BLOCKING ACCESS: must_verify flag present, forcing EmailVerificationRequired');
      return <EmailVerificationRequired />;
    }
  }

  // Check if admin access is required
  if (adminOnly && !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{accessDeniedMessage}</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BaseRoute;