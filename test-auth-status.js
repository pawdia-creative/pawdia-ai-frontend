// Test script to check authentication status
const API_BASE_URL = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function checkAuthStatus() {
  console.log('🔍 Checking authentication status...\n');

  // Check localStorage
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user');
  const mustVerify = localStorage.getItem('must_verify');

  console.log('📱 Local Storage:');
  console.log('  - Token exists:', !!token);
  console.log('  - User data exists:', !!userStr);
  console.log('  - Must verify flag:', mustVerify);

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('  - User email:', user.email);
      console.log('  - User verified:', user.isVerified);
      console.log('  - User admin:', user.isAdmin);
    } catch (e) {
      console.log('  - User data corrupted');
    }
  }

  console.log('\n🌐 Server Status:');

  // Check /auth/me endpoint
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    console.log('  - /auth/me status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('  - Server user:', data.user ? 'exists' : 'null');
      if (data.user) {
        console.log('  - Server email:', data.user.email);
        console.log('  - Server verified:', data.user.isVerified || data.user.is_verified);
        console.log('  - Server admin:', data.user.isAdmin || data.user.is_admin);
      }
    } else {
      const error = await response.text();
      console.log('  - Error:', error);
    }
  } catch (error) {
    console.log('  - Network error:', error.message);
  }

  console.log('\n🔄 Analysis:');

  if (mustVerify === '1') {
    console.log('  ⚠️  Must verify flag is set - user will see verification page');
  }

  if (!token && !userStr) {
    console.log('  ℹ️  No authentication data found - user is not logged in');
  } else if (token && userStr) {
    console.log('  ✅ User appears to be logged in');
  } else {
    console.log('  ⚠️  Inconsistent auth state - token/user mismatch');
  }
}

// Run the check
checkAuthStatus().catch(console.error);
