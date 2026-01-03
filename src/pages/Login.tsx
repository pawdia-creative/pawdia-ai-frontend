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
      if (import.meta.env.DEV) console.log('[Login] Starting login process...');

      // Step 1: Attempt login and get initial user data
      const result = await login({ email: data.email, password: data.password });
      const isFirstLogin = result?.isFirstLogin === true;

      if (import.meta.env.DEV) console.log('[Login] Login successful, now checking verification status...');

      // Step 2: 每次登录都强制检测邮箱验证情况
      const apiUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const token = tokenStorage.getToken();

      if (!token) {
        if (import.meta.env.DEV) console.warn('[Login] No token after login, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      // 强制调用 /auth/me 来检测邮箱验证状态
      const meResp = await fetch(`${apiUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!meResp.ok) {
        if (import.meta.env.DEV) console.warn('[Login] /auth/me failed, token may be invalid');
        // Token invalid, redirect to login
        tokenStorage.clearToken();
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
        return;
      }

      const meData = await meResp.json();
      const meUser = meData.user || {};
      const isVerified = meUser.isVerified === true || meUser.is_verified === 1;
      const isAdmin = meUser.isAdmin === true || meUser.is_admin === 1;

      // 更新本地用户数据
      localStorage.setItem('user', JSON.stringify(meUser));

      if (import.meta.env.DEV) console.log('[Login] Verification check result:', {
        isVerified,
        isAdmin,
        email: meUser.email,
        isFirstLogin
      });

      // Step 3: 根据验证状态决定跳转行为
      if (!isVerified && !isAdmin) {
        toast.success('登录成功！请先验证邮箱。');

        // 未验证用户：清除认证状态，设置验证标志，跳转到验证页面
        try { localStorage.setItem('must_verify', '1'); } catch (e) {}

        if (isFirstLogin) {
          // 首次登录，显示验证邮件已发送页面
          navigate('/verify-email', { replace: true });
        } else {
          // 非首次登录，显示重新发送验证邮件页面
          navigate('/verify-required', { replace: true });
        }
        return;
      }

      // Step 4: 已验证用户或管理员，跳转到首页
      toast.success('登录成功！');
      if (import.meta.env.DEV) console.log('[Login] User verified, redirecting to home:', from);
      navigate(from, { replace: true });

    } catch (error) {
      if (import.meta.env.DEV) console.error('[Login] Login process failed:', error);
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