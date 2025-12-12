import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function debugFrontendAdmin() {
  console.log('🔍 Debug frontend admin API issues...\n');

  try {
    // 1. Simulate admin login
    console.log('1. Simulate admin login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pawdia.ai',
        password: 'admin123456'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Admin login failed:', loginData.message);
      return;
    }

    console.log('✅ Admin login successful');
    console.log('   User info:', {
      id: loginData.user.id,
      email: loginData.user.email,
      name: loginData.user.name,
      isAdmin: loginData.user.isAdmin
    });

    const token = loginData.token;

    // 2. Simulate frontend saving token to localStorage
    console.log('\n2. Simulate frontend saving token to localStorage...');
    console.log('   Token length:', token.length);
    console.log('   Token prefix:', token.substring(0, 20) + '...');

    // 3. Simulate frontend admin API request (exactly same as frontend code)
    console.log('\n3. Simulate frontend admin API request...');
    console.log('   Request URL:', `${API_BASE_URL}/admin/users?search=`);
    console.log('   Request headers:', {
      'Authorization': `Bearer ${token}`
    });

    const adminResponse = await fetch(`${API_BASE_URL}/admin/users?search=`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('   Response status:', adminResponse.status, adminResponse.statusText);
    console.log('   Response headers:', Object.fromEntries(adminResponse.headers.entries()));

    if (!adminResponse.ok) {
      const errorData = await adminResponse.json();
      console.log('❌ Admin API access failed');
      console.log('   Error message:', errorData.message || 'Unknown error');
      console.log('   Full error response:', JSON.stringify(errorData, null, 2));
    } else {
      const adminData = await adminResponse.json();
      console.log('✅ Admin API access successful');
      console.log('   User list:', adminData.users?.length || 0, 'users');
      console.log('   Pagination info:', adminData.pagination);
    }

    // 4. Test different search parameters
    console.log('\n4. Test different search parameters...');
    
    // Test empty search
    console.log('   a) Empty search parameter:');
    const emptySearchResponse = await fetch(`${API_BASE_URL}/admin/users?search=`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('      Status:', emptySearchResponse.status);

    // Test with search term
    console.log('   b) With search term "test":');
    const testSearchResponse = await fetch(`${API_BASE_URL}/admin/users?search=test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('      Status:', testSearchResponse.status);

    // Test with special characters
    console.log('   c) With special characters "admin":');
    const adminSearchResponse = await fetch(`${API_BASE_URL}/admin/users?search=admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log('      Status:', adminSearchResponse.status);

  } catch (error) {
    console.log('❌ Error during debugging:', error.message);
    console.log('   Error stack:', error.stack);
  }
}

debugFrontendAdmin();