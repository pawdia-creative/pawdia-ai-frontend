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