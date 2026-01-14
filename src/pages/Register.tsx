import { useEffect } from 'react';
import * as RR from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { toast } from '@/lib/toast';
import AuthForm from '@/components/AuthForm';

// Type-safe react-router hooks (workaround for type resolution issues)
type NavigateFunction = (to: string | number, options?: { replace?: boolean; state?: unknown }) => void;

const Register: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuth();
  const navigate = RR.useNavigate as unknown as NavigateFunction;

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (data: { email: string; password: string; name?: string; confirmPassword?: string }) => {
    try {
      const result = await register({
        name: data.name || '', 
        email: data.email, 
        password: data.password, 
        confirmPassword: data.confirmPassword || '' 
      });

      if (result && !result.emailSent) {
        // Email sending failed, show warning but still allow user to proceed
        toast('Registration successful, but verification email could not be sent. Please try logging in and resending the verification email.');
      } else {
        toast('Registration successful! Please check your email to verify your account.');
      }

      // Always redirect to verification-required page to simplify flow
      try { localStorage.setItem('must_verify', '1'); } catch (e) { /* Ignore localStorage errors */ }
      navigate('/verify-required');
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