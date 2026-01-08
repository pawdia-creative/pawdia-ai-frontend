import React from 'react';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AuthStatusDebug: React.FC = () => {
  const { isAuthenticated, isLoading, user, checkedAuth } = useAuth();

  const token = tokenStorage.getToken();
  const storedUserStr = localStorage.getItem('user');
  const mustVerify = localStorage.getItem('must_verify');

  let storedUser = null;
  try {
    storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  } catch (e) {
    storedUser = { error: 'Parse error' };
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Authentication Status Debug
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Auth Context State</h3>
            <div className="space-y-1 text-sm">
              <div>isAuthenticated: <Badge variant={isAuthenticated ? "default" : "destructive"}>{isAuthenticated.toString()}</Badge></div>
              <div>isLoading: <Badge variant={isLoading ? "secondary" : "outline"}>{isLoading.toString()}</Badge></div>
              <div>checkedAuth: <Badge variant={checkedAuth ? "default" : "secondary"}>{checkedAuth.toString()}</Badge></div>
              <div>User exists: <Badge variant={!!user ? "default" : "destructive"}>{!!user ? "Yes" : "No"}</Badge></div>
              {user && (
                <>
                  <div>Email: {user.email}</div>
                  <div>Verified: <Badge variant={user.isVerified ? "default" : "destructive"}>{user.isVerified?.toString()}</Badge></div>
                  <div>Admin: <Badge variant={user.isAdmin ? "default" : "secondary"}>{user.isAdmin?.toString()}</Badge></div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Local Storage</h3>
            <div className="space-y-1 text-sm">
              <div>Token exists: <Badge variant={!!token ? "default" : "destructive"}>{!!token ? "Yes" : "No"}</Badge></div>
              <div>User data exists: <Badge variant={!!storedUserStr ? "default" : "destructive"}>{!!storedUserStr ? "Yes" : "No"}</Badge></div>
              <div>must_verify flag: <Badge variant={mustVerify === '1' ? "destructive" : "outline"}>{mustVerify || 'null'}</Badge></div>
              {storedUser && !storedUser.error && (
                <>
                  <div>Email: {storedUser.email}</div>
                  <div>Verified: <Badge variant={storedUser.isVerified ? "default" : "destructive"}>{storedUser.isVerified?.toString()}</Badge></div>
                  <div>Admin: <Badge variant={storedUser.isAdmin ? "default" : "secondary"}>{storedUser.isAdmin?.toString()}</Badge></div>
                </>
              )}
              {storedUser?.error && (
                <div className="text-red-500">Parse error: {storedUser.error}</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Analysis</h3>
          <div className="text-sm space-y-1">
            {isAuthenticated && user?.isVerified && (
              <div className="text-green-600">✅ User is authenticated and verified - should have full access</div>
            )}
            {isAuthenticated && !user?.isVerified && (
              <div className="text-orange-600">⚠️ User is authenticated but not verified - should see verification page on protected routes</div>
            )}
            {!isAuthenticated && token && storedUser && (
              <div className="text-blue-600">ℹ️ User has credentials but not authenticated - may need verification</div>
            )}
            {!isAuthenticated && (!token || !storedUser) && (
              <div className="text-gray-600">ℹ️ User is not logged in - should see login page</div>
            )}
            {mustVerify === '1' && (
              <div className="text-red-600">🚨 Must verify flag is set - user will be redirected to verification page</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthStatusDebug;
