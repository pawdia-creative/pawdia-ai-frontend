import { useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EmailVerificationRequired from '@/pages/EmailVerificationRequired';

export interface BaseRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  redirectPath?: string;
  accessDeniedMessage?: string;
  requireEmailVerification?: boolean;
}

const BaseRoute = ({
  children,
  adminOnly = false,
  redirectPath = '/login',
  accessDeniedMessage = 'Access Denied',
  requireEmailVerification = true,
}: BaseRouteProps) => {
  const { isAuthenticated, isLoading, user, checkedAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 添加调试日志
  useEffect(() => {
    if (import.meta.env.DEV) console.log('[BaseRoute] Auth state:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userId: user?.id,
      path: location.pathname
    });
  }, [isAuthenticated, isLoading, user, location.pathname]);

  // Only redirect to login *after* we've completed the initial auth check.
  useEffect(() => {
    if (!isLoading && checkedAuth && !isAuthenticated) {
      if (import.meta.env.DEV) console.log('[BaseRoute] Not authenticated, navigating to login from:', location.pathname);
      navigate(redirectPath, { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, checkedAuth, navigate, redirectPath, location]);

  if (isLoading) {
    if (import.meta.env.DEV) console.log('[BaseRoute] Loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && (!checkedAuth || isLoading)) {
    // Still checking auth status, show spinner
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if email verification is required
  // Only allow access when `isVerified` is explicitly true (or is_verified === 1).
  // If `isVerified` is false or undefined, enforce verification UI to prevent bypass.
  if (requireEmailVerification && user && !(user.isVerified === true || user.is_verified === 1)) {
    return <EmailVerificationRequired />;
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