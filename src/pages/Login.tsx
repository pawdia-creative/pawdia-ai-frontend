import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';

const Login = () => {
  const { login, isLoading, error, clearError, isAuthenticated, ensureIdle, user, syncVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // 如果已经登录且邮箱已验证，重定向到首页或来源页面
  useEffect(() => {
    if (isAuthenticated) {
      const checkAndRedirect = async () => {
        try {
          // Prefer context user, fall back to localStorage user
          const localUserStr = localStorage.getItem('user');
          const localUser = localUserStr ? JSON.parse(localUserStr) : null;
          const isVerifiedLocal =
            (user && (user.isVerified === true || (user as any).is_verified === 1)) ||
            (localUser && (localUser.isVerified === true || localUser.is_verified === 1));

          // If a must_verify flag is present, force the verification-required UI
          const mustVerify = localStorage.getItem('must_verify') === '1';
          if (mustVerify) {
            if (import.meta.env.DEV) console.log('[Login] must_verify present, redirecting to verification required page');
            navigate('/verify-required', { replace: true });
            return;
          }

          if (isVerifiedLocal) {
            if (import.meta.env.DEV) console.log('[Login] User authenticated and verified, redirecting to:', from);
            navigate(from, { replace: true });
            return;
          }

          // If not verified locally, attempt to sync with server
          if (syncVerificationStatus) {
            const synced = await syncVerificationStatus();
            if (synced) {
              // syncVerificationStatus will update context; effect will re-run
              return;
            } else {
              // If sync failed or user still not verified, force verification flow
              if (import.meta.env.DEV) console.log('[Login] Verification sync failed or user unverified, redirecting to verify-required');
              navigate('/verify-required', { replace: true });
              return;
            }
          } else {
            // No sync function available, default to forcing verification UI
            navigate('/verify-required', { replace: true });
            return;
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[Login] Error while checking verification state before redirect:', e);
          navigate('/verify-required', { replace: true });
        }
      };

      checkAndRedirect();
    }
    // If loading is stuck for some reason (navigated from verification page), reset it.
    if (ensureIdle) {
      ensureIdle();
    }
  }, [isAuthenticated, navigate, from, ensureIdle, user, syncVerificationStatus]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      if (import.meta.env.DEV) console.log('[Login] Starting login process (centralized verification)...');

      // Delegated login: AuthContext.login now performs token + verification check
      const result = await login({ email: data.email, password: data.password });
      const isVerified = result?.isVerified === true;
      const isAdmin = result?.isAdmin === true;
      const isFirstLogin = result?.isFirstLogin === true;

      if (import.meta.env.DEV) console.log('[Login] login() completed, result:', { isVerified, isAdmin, isFirstLogin });

        if (!isVerified && !isAdmin) {
          // AuthContext.login is responsible for setting must_verify and token storage.
          toast.success('登录成功！请先验证邮箱。');
          // Always route unverified users to the centralized verification-required page.
          navigate('/verify-required', { replace: true });
          return;
        }

      // Verified users allowed through
        toast.success('登录成功！');
      if (import.meta.env.DEV) console.log('[Login] User verified, redirecting to:', from);
        navigate(from, { replace: true });
    } catch (error) {
      if (import.meta.env.DEV) console.error('[Login] Login process failed:', error);
      // Context handles and surfaces errors via state; also show generic message
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <AuthForm
      type="login"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
    />
  );
};

export default Login;