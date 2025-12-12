import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('验证令牌缺失，请检查您的邮箱链接。');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || '邮箱验证失败，请重试。');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('网络错误，请检查您的网络连接后重试。');
      }
    };

    verifyEmail();
  }, [searchParams]);

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
            邮箱验证
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          <Alert className={getStatusColor()}>
            <AlertDescription className="text-center">
              {status === 'loading' && '正在验证您的邮箱，请稍候...'}
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
              返回首页
            </Button>
            {status === 'success' && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/profile')}
              >
                查看个人资料
              </Button>
            )}
            {status === 'error' && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/login')}
              >
                重新登录
              </Button>
            )}
          </div>

          {status === 'error' && (
            <div className="text-center text-sm text-gray-600">
              <p>如果问题持续存在，请联系客服：support@pawdia-ai.com</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;