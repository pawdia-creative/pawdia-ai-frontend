import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

const testAdminLogin = async () => {
  try {
    console.log('🔍 Testing admin login functionality...');
    console.log(`📡 API address: ${API_BASE_URL}`);
    
    // Test admin login
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
    
    if (loginResponse.ok) {
      console.log('✅ Admin login successful!');
      console.log('📋 Login response information:');
      console.log(`   Token: ${loginData.token ? '✓ Obtained' : '✗ Not obtained'}`);
      console.log(`   User ID: ${loginData.user?.id || 'Unknown'}`);
      console.log(`   Name: ${loginData.user?.name || 'Unknown'}`);
      console.log(`   Email: ${loginData.user?.email || 'Unknown'}`);
      console.log(`   Credits: ${loginData.user?.credits || 0}`);
      console.log(`   Admin: ${loginData.user?.isAdmin ? 'Yes' : 'No'}`);
      
      // Test getting user information
      if (loginData.token) {
        console.log('\n🔍 Testing getting user information...');
        
        const userResponse = await fetch(`${API_BASE_URL}/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('✅ User information obtained successfully!');
          console.log(`   Name: ${userData.user?.name || 'Unknown'}`);
          console.log(`   Email: ${userData.user?.email || 'Unknown'}`);
          console.log(`   Admin: ${userData.user?.isAdmin ? 'Yes' : 'No'}`);
        } else {
          console.log('❌ User information retrieval failed:', await userResponse.text());
        }
      }
      
    } else {
      console.log('❌ Admin login failed:');
      console.log(`   Status code: ${loginResponse.status}`);
      console.log(`   Error message: ${loginData.message}`);
      
      // Check if account doesn't exist
      if (loginResponse.status === 401) {
        console.log('💡 Possible reasons:');
        console.log('   1. Admin account does not exist');
        console.log('   2. Wrong password');
        console.log('   3. Account not verified');
      }
    }
    
  } catch (error) {
    console.error('❌ Error occurred during testing:', error.message);
    console.log('💡 Please check:');
    console.log('   1. Backend server is running on port 3001');
    console.log('   2. Network connection is normal');
    console.log('   3. API address configuration is correct');
  }
};

// Run test
testAdminLogin();