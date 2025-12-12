import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function debugAdminIssues() {
  console.log('🔍 Debugging admin permission issues...\n');

  // 1. Test admin login
  console.log('1. Testing admin login...');
  try {
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
      name: loginData.user.name,
      email: loginData.user.email,
      isAdmin: loginData.user.isAdmin,
      credits: loginData.user.credits
    });

    const token = loginData.token;

    // 2. Test getting user info
    console.log('\n2. Testing getting user info...');
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const meData = await meResponse.json();
    
    if (!meResponse.ok) {
      console.log('❌ Failed to get user info:', meData.message);
    } else {
      console.log('✅ User info retrieved successfully');
      console.log('   User info:', {
        id: userData.user.id,
        name: userData.user.name,
        email: userData.user.email,
        isAdmin: userData.user.isAdmin,
        credits: userData.user.credits
      });
    }

    // 3. Test admin API access
    console.log('\n3. Testing admin API access...');
    const adminResponse = await fetch(`${API_BASE_URL}/admin/users?search=`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!adminResponse.ok) {
      console.log('❌ Admin API access failed:', adminResponse.status, adminResponse.statusText);
      const errorData = await adminResponse.json();
      console.log('   Error message:', errorData.message || 'Unknown error');
    } else {
      const adminData = await adminResponse.json();
      console.log('✅ Admin API access successful');
      console.log('   User list:', adminData.users?.length || 0, 'users');
    }

    // 4. Test registration function
    console.log('\n4. Testing registration function...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'test123456'
      }),
    });

    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerData.message);
      console.log('   Possible reasons:', registerData.errors || 'Unknown error');
    } else {
      console.log('✅ Registration successful');
      console.log('   New user:', {
        id: registerData.user.id,
        name: registerData.user.name,
        email: registerData.user.email,
        isAdmin: registerData.user.isAdmin,
        credits: registerData.user.credits
      });
    }

  } catch (error) {
    console.log('❌ Error occurred during debugging:', error.message);
  }
}

debugAdminIssues();