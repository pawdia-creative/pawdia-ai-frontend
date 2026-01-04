import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  return 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
})();

const EmailVerificationRequired: React.FC = () => {
  const { user, logout, syncVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [redirectAttempts] = useState(0);

  // Debug info
  const storedUserStr = localStorage.getItem('user');
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const hasToken = !!tokenStorage.getToken();

  console.log('[EmailVerificationRequired] Debug info:', {
    authUser: user,
    storedUser,
    hasToken,
    mustVerifyFlag: localStorage.getItem('must_verify'),
    redirectAttempts
  });


  const handleResendEmail = async () => {
    // Prevent multiple simultaneous requests
    if (isResending) return;

    setIsResending(true);
    try {
      const token = tokenStorage.getToken();
      if (!token) {
        toast.error('请先登录才能重新发送验证邮件');
        logout(); // Clear any stale state
        navigate('/login');
        return;
      }

      // Validate token before making request
      try {
        const meCheck = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!meCheck.ok) {
          console.warn('[EmailVerificationRequired] Token invalid, redirecting to login');
          logout();
          navigate('/login');
          return;
        }
      } catch (tokenError) {
        console.error('[EmailVerificationRequired] Token validation failed:', tokenError);
        logout();
        navigate('/login');
        return;
      }

      // Some backends expect the email in the POST body; include it when available.
      const storedUserStr = localStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const bodyPayload: any = {};
      if (storedUser && storedUser.email) bodyPayload.email = storedUser.email;

      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      // Parse response body if available and present helpful message
      let responseBody: any = {};
      try { responseBody = await response.json(); } catch (e) { responseBody = {}; }

      // Check the actual response message to determine success/failure
      const responseMessage = responseBody?.message || '';

      if (responseMessage.includes('Verification email sent')) {
        // Success case
        setEmailSent(true);
        toast.success('验证邮件已重新发送，请检查您的邮箱');
      } else if (responseMessage.includes('Unable to send')) {
        // Email service failure
        if (import.meta.env.DEV) console.error('[EmailVerificationRequired] Email service failed:', responseMessage);
        throw new Error('邮件服务暂时不可用，请稍后再试');
      } else if (responseMessage.includes('If that account exists')) {
        // User not found or token issues
        if (import.meta.env.DEV) console.error('[EmailVerificationRequired] User lookup failed:', responseMessage);
        throw new Error('用户验证失败，请重新登录后再试');
      } else if (!response.ok) {
        // HTTP error
        const msg = responseBody?.message || responseBody?.error || '发送失败';
        if (import.meta.env.DEV) console.error('[EmailVerificationRequired] HTTP error:', response.status, responseBody);
        throw new Error(msg);
      } else {
        // Unknown response
        if (import.meta.env.DEV) console.warn('[EmailVerificationRequired] Unknown response:', responseMessage);
        setEmailSent(true);
        toast.success('邮件发送请求已提交，请检查邮箱');
      }

      // Reset email sent state after 5 seconds
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error: any) {
      console.error('Resend email error:', error);
      toast.error(error.message || '重新发送验证邮件失败，请稍后重试');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-16 w-16 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Email verification required
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Please verify your email to continue using Pawdia AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-gray-700">
              <p className="mb-2">
                We have sent a verification email to <strong>{user?.email}</strong>.
              </p>
              <p>
                Please check your inbox (including spam folder) and click the verification link in the email to complete verification.
              </p>
            </AlertDescription>
          </Alert>

          {emailSent && (
            <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Verification email resent — please check your inbox
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || emailSent}
              className="w-full"
              variant="default"
            >
                {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>

            <Button
              onClick={async () => {
                try {
                  const synced = await syncVerificationStatus();
                  if (synced) {
                    // Check if user is now verified
                    const token = tokenStorage.getToken();
                    if (token) {
                      try {
                      const meResp = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (meResp.ok) {
                          const meData = await meResp.json().catch(() => ({}));
                          const meUser = meData?.user;
                          const isVerified = meUser && (meUser.isVerified === true || meUser.is_verified === 1);
                          if (isVerified) {
                          toast.success('验证成功，跳转到首页');
                            navigate('/', { replace: true });
                          return;
                          }
                        } else {
                          // If /auth/me returned an error, show a helpful message
                          const errBody = await meResp.json().catch(() => ({}));
                          if (import.meta.env.DEV) console.error('[EmailVerificationRequired] /auth/me after sync returned non-OK:', meResp.status, errBody);
                        }
                      } catch (meErr) {
                        if (import.meta.env.DEV) console.error('[EmailVerificationRequired] Error fetching /auth/me after sync:', meErr);
                      }
                    }
                    toast.error('验证状态已同步，但尚未完成验证');
                  } else {
                    toast.error('无法同步验证状态，请重新登录');
                    logout();
                    navigate('/login');
                  }
                } catch (err) {
                  if (import.meta.env.DEV) console.error('Sync verification error:', err);
                  toast.error('网络错误，请稍后重试');
                }
              }}
              variant="outline"
              className="w-full"
            >
              I have verified — refresh page
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full"
            >
              Log out
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Didn't receive the email?</p>
            <ul className="list-disc list-inside mt-2 text-left space-y-1">
              <li>Check your spam folder</li>
              <li>Confirm your email address is correct</li>
              <li>Wait a few minutes and try again</li>
            </ul>
            <p className="mt-3">
              If you still don't receive the email, contact support at{' '}
              <a className="text-blue-600 underline" href="mailto:pawdia.creative@gmail.com">pawdia.creative@gmail.com</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationRequired;

