import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testAdminFix() {
  console.log('🔍 Testing admin permission fix...\n');

  try {
    // 1. Test admin login
    console.log('1. Testing admin login...');
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

    // 2. Decode JWT token to check if it contains isAdmin field
    console.log('\n2. Checking JWT Token content...');
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('   Token payload:', JSON.stringify(payload, null, 2));
      
      if (payload.isAdmin !== undefined) {
        console.log(`✅ Token contains isAdmin field: ${payload.isAdmin}`);
      } else {
        console.log('❌ Token does not contain isAdmin field');
      }
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

    // 4. Test registration function (fix frontend form validation issue)
    console.log('\n4. Testing registration function (including confirmPassword field)...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'test123456',
        confirmPassword: 'test123456'  // Add confirmPassword field
      }),
    });

    const registerData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerData.message);
      console.log('   Error details:', registerData.errors || 'Unknown error');
    } else {
      console.log('✅ Registration successful');
      console.log('   New user:', {
        id: registerData.user.id,
        email: registerData.user.email,
        name: registerData.user.name,
        isAdmin: registerData.user.isAdmin
      });
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.log('❌ Error occurred during testing:', error.message);
  }
}

testAdminFix();