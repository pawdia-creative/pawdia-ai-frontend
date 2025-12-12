import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('Testing admin login function...');
    
    // First login to admin account
    const loginData = {
      email: 'admin@pawdia.ai',
      password: 'admin123' // Please use correct admin password
    };
    
    console.log('Attempting to login to admin account...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('Login failed:', errorData.message);
      return;
    }
    
    const loginResult = await loginResponse.json();
    console.log('Login successful!');
    console.log('User info:', JSON.stringify(loginResult.user, null, 2));
    
    const token = loginResult.token;
    
    // Test admin API access
    console.log('\nTesting admin user list API...');
    const usersResponse = await fetch('http://localhost:3001/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    console.log('User list response status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('Successfully retrieved user list!');
      console.log('Number of users:', usersData.users.length);
    } else {
      const errorData = await usersResponse.json();
      console.log('Failed to get user list:', errorData.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAdminLogin();