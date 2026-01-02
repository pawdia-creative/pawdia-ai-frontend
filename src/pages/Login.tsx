import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';

const Login = () => {
  const { login, isLoading, error, clearError, isAuthenticated, ensureIdle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // 如果已经登录且邮箱已验证，重定向到首页或来源页面
  useEffect(() => {
    if (isAuthenticated) {
      try {
        // Prefer context user, fall back to localStorage user
        const localUserStr = localStorage.getItem('user');
        const localUser = localUserStr ? JSON.parse(localUserStr) : null;
        const isVerified =
          (user && (user.isVerified === true || user.is_verified === 1)) ||
          (localUser && (localUser.isVerified === true || localUser.is_verified === 1));

        // If a must_verify flag is present, force the verification-required UI
        const mustVerify = localStorage.getItem('must_verify') === '1';
        if (mustVerify) {
          if (import.meta.env.DEV) console.log('[Login] must_verify present, redirecting to verification required page');
          navigate('/verify-required', { replace: true });
          return;
        }

        if (isVerified) {
          if (import.meta.env.DEV) console.log('[Login] User authenticated and verified, redirecting to:', from);
          navigate(from, { replace: true });
        } else {
          if (import.meta.env.DEV) console.log('[Login] User authenticated but not verified — staying on login to enforce verify flow');
        }
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[Login] Error while checking verification state before redirect:', e);
      }
    }
    // If loading is stuck for some reason (navigated from verification page), reset it.
    if (ensureIdle) {
      ensureIdle();
    }
  }, [isAuthenticated, navigate, from, ensureIdle, user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const result = await login({ email: data.email, password: data.password });
      const isFirstLogin = result?.isFirstLogin === true;
      toast.success('Login successful!');

      // After login, explicitly confirm verification status from the server.
      // Use the newly-stored token to fetch /auth/me and decide redirect behavior.
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
        const token = tokenStorage.getToken();
        let isVerified = false;
        if (token) {
          const meResp = await fetch(`${apiUrl}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (meResp.ok) {
            const meData = await meResp.json();
            const meUser = meData.user || {};
            isVerified = meUser.isVerified === true || meUser.is_verified === 1;
            // update local user copy
            localStorage.setItem('user', JSON.stringify(meUser));
          } else {
            // treat non-OK as not verified or session problem
            isVerified = false;
          }
        }

        if (!isVerified) {
          // If this is the first login after registration, show the "verification email sent" page
          if (isFirstLogin) {
            navigate('/verify-email', { replace: true });
            return;
          }

          // Otherwise, go to the resend/verification required UI
          navigate('/verify-required', { replace: true });
          return;
        }

        // Verified -> proceed to requested page
        navigate(from, { replace: true });
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Login] post-login verification check failed:', err);
        // Fallback to previous behavior
        navigate(from, { replace: true });
      }
    } catch (error) {
      // Error is handled by the context and useEffect
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