import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (import.meta.env.DEV) console.log('[VERIFY FRONTEND] Token received:', token ? `${token.substring(0, 10)}...` : 'missing');
      setHasToken(!!token);

      // If there's no token in the URL, this page is being used as a "check your email" landing.
      // Show a friendly message instructing the user to check their inbox instead of an error.
      if (!token) {
        setStatus('success');
        setMessage('Verification email sent. Please check your inbox and follow the link to verify your email.');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
        const verifyUrl = `${apiUrl}/auth/verify-email?token=${token}`;
        if (import.meta.env.DEV) console.log('[VERIFY FRONTEND] Calling API:', verifyUrl);
        
        const response = await fetch(verifyUrl);
        const data = await response.json();
        if (import.meta.env.DEV) console.log('[VERIFY FRONTEND] Response status:', response.status, 'data:', data);

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          
          // 更新用户状态
          if (data.user && updateUser) {
            if (import.meta.env.DEV) console.log('[VERIFY FRONTEND] Updating user status to verified');
            updateUser({ isVerified: true });
          }
          
          // 如果用户已登录，刷新用户信息
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const meResponse = await fetch(`${apiUrl}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (meResponse.ok) {
                const meData = await meResponse.json();
                if (meData.user && updateUser) {
                  if (import.meta.env.DEV) console.log('[VERIFY FRONTEND] Refreshed user data from /auth/me');
                  updateUser(meData.user);
                }
              }
            } catch (refreshError) {
              if (import.meta.env.DEV) console.error('[VERIFY FRONTEND] Error refreshing user data:', refreshError);
            }
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Email verification failed. Please try again.');
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('[VERIFY FRONTEND] Email verification error:', error);
        setStatus('error');
        setMessage('Network error. Please check your internet connection and try again.');
      }
    };

    verifyEmail();
  }, [searchParams, updateUser]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          <Alert className={getStatusColor()}>
            <AlertDescription className="text-center">
              {status === 'loading' && 'Verifying your email, please wait...'}
              {status === 'success' && message}
              {status === 'error' && message}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            {status === 'success' && hasToken && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            )}
            {status === 'success' && !hasToken && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/login', { state: { preResend: true } })}
              >
                Log in
              </Button>
            )}
            {status === 'error' && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            )}
          </div>

          {status === 'error' && (
            <div className="text-center text-sm text-gray-600">
              <p>If the problem persists, please contact support: support@pawdia-ai.com</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;