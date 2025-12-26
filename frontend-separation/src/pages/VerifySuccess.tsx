import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VerifySuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stale auth tokens to avoid auto sign-in loops in restrictive webviews
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('[VerifySuccess] Cleared local auth tokens to avoid auto sign-in issues');
    } catch (e) {
      console.warn('[VerifySuccess] Failed to clear localStorage:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Email Verified</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-700">Your email has been successfully verified. Please sign in to continue.</p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifySuccess;


