import { useAuth } from '@/contexts/AuthContext';
import { tokenStorage } from '@/lib/tokenStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            isAuthenticated
              ? "border-transparent bg-green-100 text-green-800"
              : "border-transparent bg-gray-100 text-gray-800"
          }`}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Auth Context State</h3>
            <div className="space-y-1 text-sm">
              <div>isAuthenticated: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isAuthenticated ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
              }`}>{isAuthenticated.toString()}</span></div>
              <div>isLoading: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isLoading ? "border-transparent bg-blue-100 text-blue-800" : "border-transparent bg-gray-100 text-gray-800"
              }`}>{isLoading.toString()}</span></div>
              <div>checkedAuth: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                checkedAuth ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-blue-100 text-blue-800"
              }`}>{String(checkedAuth)}</span></div>
              <div>User exists: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                !!user ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
              }`}>{!!user ? "Yes" : "No"}</span></div>
              {user && (
                <>
                  <div>Email: {user.email}</div>
                  <div>Verified: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    user.isVerified ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
                  }`}>{user.isVerified?.toString()}</span></div>
                  <div>Admin: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    user.isAdmin ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-blue-100 text-blue-800"
                  }`}>{user.isAdmin?.toString()}</span></div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Local Storage</h3>
            <div className="space-y-1 text-sm">
              <div>Token exists: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                !!token ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
              }`}>{!!token ? "Yes" : "No"}</span></div>
              <div>User data exists: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                !!storedUserStr ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
              }`}>{!!storedUserStr ? "Yes" : "No"}</span></div>
              <div>must_verify flag: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                mustVerify === '1' ? "border-transparent bg-red-100 text-red-800" : "border-transparent bg-gray-100 text-gray-800"
              }`}>{mustVerify || 'null'}</span></div>
              {storedUser && !storedUser.error && (
                <>
                  <div>Email: {storedUser.email}</div>
                  <div>Verified: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    storedUser.isVerified ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-red-100 text-red-800"
                  }`}>{storedUser.isVerified?.toString()}</span></div>
                  <div>Admin: <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    storedUser.isAdmin ? "border-transparent bg-green-100 text-green-800" : "border-transparent bg-blue-100 text-blue-800"
                  }`}>{storedUser.isAdmin?.toString()}</span></div>
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
