import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; name?: string; confirmPassword?: string }) => void;
  isLoading: boolean;
  error?: string;
  onClearError?: () => void;
}

interface FormData {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  type,
  onSubmit,
  isLoading,
  error,
  onClearError
}) => {
  const [formData, setFormData] = React.useState<FormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  // Check if API is offline
  const [apiOffline, setApiOffline] = React.useState(false);

  React.useEffect(() => {
    const checkApiStatus = () => {
      const offline = localStorage.getItem('api_offline') === 'true';
      setApiOffline(offline);
    };

    checkApiStatus();
    // Check periodically
    const interval = setInterval(checkApiStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (error && onClearError) {
      onClearError();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      return;
    }
    
    if (type === 'register') {
      if (!formData.name) {
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        return;
      }
    }
    
    onSubmit(formData);
  };

  const getTitle = () => {
    return type === 'login' ? 'Sign In' : 'Create Account';
  };

  const getDescription = () => {
    return type === 'login' 
      ? 'Enter your credentials to access your account'
      : 'Sign up to start creating AI pet portraits';
  };

  const getSubmitButtonText = () => {
    if (isLoading) {
      return type === 'login' ? 'Signing in...' : 'Creating account...';
    }
    return type === 'login' ? 'Sign In' : 'Create Account';
  };

  const getLinkText = () => {
    return type === 'login' 
      ? "Don't have an account?"
      : "Already have an account?";
  };

  const getLinkPath = () => {
    return type === 'login' ? '/register' : '/login';
  };

  const getLinkLabel = () => {
    return type === 'login' ? 'Sign up' : 'Sign in';
  };

  const getGradientClass = () => {
    return type === 'login' 
      ? 'bg-gradient-to-br from-blue-50 to-indigo-100'
      : 'bg-gradient-to-br from-green-50 to-teal-100';
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getGradientClass()}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
          <CardDescription>
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiOffline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    API 服务暂时不可用
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>服务器连接出现问题，但您仍可以使用演示模式登录体验功能。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name || ''}
                  onChange={handleInputChange('name')}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={type === 'login' ? 'Enter your password' : 'Create a password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                autoComplete={type === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            
            {type === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword || ''}
                  onChange={handleInputChange('confirmPassword')}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {getSubmitButtonText()}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            {getLinkText()}{' '}
            <Link to={getLinkPath()} className="text-blue-600 hover:underline">
              {getLinkLabel()}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;