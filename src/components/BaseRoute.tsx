import { useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { tokenStorage } from '@/lib/tokenStorage';
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

  // 添加调试日志 - 只在开发模式下且关键状态变化时输出
  useEffect(() => {
    if (import.meta.env.DEV && (isAuthenticated || checkedAuth || isLoading)) {
      const token = tokenStorage.getToken();
      const storedUser = localStorage.getItem('user');
      console.log('[BaseRoute] Auth state:', {
        isAuthenticated,
        isLoading,
        checkedAuth,
        hasUser: !!user,
        userVerified: user?.isVerified || (user ? (String((user as unknown as Record<string, unknown>)['is_verified'])) : undefined),
        hasToken: !!token,
        hasStoredUser: !!storedUser,
        path: location.pathname,
        publicForGuests
      });
    }
  }, [isAuthenticated, isLoading, checkedAuth, user, publicForGuests, location.pathname]); // 减少依赖项，防止过度重新渲染

  // Only redirect to login *after* we've completed the initial auth check.
  // Simplified logic to prevent infinite loops
  useEffect(() => {
    if (checkedAuth && !isLoading && !isAuthenticated && !publicForGuests) {
      const token = tokenStorage.getToken();
      const storedUser = localStorage.getItem('user');

      // Only redirect if user has no stored credentials
      if (!token || !storedUser) {
        if (import.meta.env.DEV) console.log('[BaseRoute] No credentials, redirecting to login from:', location.pathname);
        navigate(redirectPath, { state: { from: location }, replace: true });
      }
    }
  }, [checkedAuth, isLoading, isAuthenticated, publicForGuests, navigate, redirectPath, location]); // 优化依赖项

  if (isLoading) {
    if (import.meta.env.DEV) console.log('[BaseRoute] Loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle email verification requirement for authenticated users
  if (checkedAuth && isAuthenticated && requireEmailVerification && user) {
    // User is authenticated but may not be verified
    const isVerified = user.isVerified === true;
    const isAdmin = user.isAdmin === true;

    if (!isVerified && !isAdmin) {
      if (import.meta.env.DEV) console.warn('[BaseRoute] Authenticated user not verified, showing verification page');
      return <EmailVerificationRequired />;
    }
  }

  // Handle must_verify flag for users who need to verify but are not yet authenticated
  if (checkedAuth && !isAuthenticated && requireEmailVerification) {
    const mustVerifyFlag = localStorage.getItem('must_verify');

    if (mustVerifyFlag === '1') {
      if (import.meta.env.DEV) console.warn('[BaseRoute] must_verify flag active, showing verification page');
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