import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';

const Login = () => {
  const { login, isLoading, error, clearError, isAuthenticated, ensureIdle } = useAuth() as any;
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // 如果已经登录，重定向到首页或来源页面
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Login] User already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
    // If loading is stuck for some reason (navigated from verification page), reset it.
    if (ensureIdle) {
      ensureIdle();
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const user = await login({ email: data.email, password: data.password });
      toast.success('Login successful!');

      // 如果邮箱未验证：不要直接进入应用，触发后端重发验证邮件并跳转到邮箱验证提示页面
      if (user && !user.isVerified) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
          const token = localStorage.getItem('token');
          if (token) {
            // 请求后端重发验证邮件（silent）
            await fetch(`${apiUrl}/auth/resend-verification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({}),
            });
          }
        } catch (resendErr) {
          console.warn('[Login] resend verification failed:', resendErr);
        }

        // 跳转到邮箱验证提示页（不会把用户标记为已登录）
        navigate('/verify-email', { replace: true });
        return;
      }

      navigate(from, { replace: true });
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