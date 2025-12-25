import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';

const Register: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: { email: string; password: string; name?: string; confirmPassword?: string }) => {
    try {
      await register({ 
        name: data.name || '', 
        email: data.email, 
        password: data.password, 
        confirmPassword: data.confirmPassword || '' 
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      // Redirect to email verification info page instead of auto-login
      navigate('/verify-email');
    } catch (error) {
      // Error is handled by the context and useEffect
    }
  };

  return (
    <AuthForm
      type="register"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
    />
  );
};

export default Register;