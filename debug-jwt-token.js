import jwt from 'jsonwebtoken';

// Simulate getting token from login response
const testToken = async () => {
  console.log('🔍 Debugging JWT Token content...\n');

  try {
    // 1. First get a valid admin token
    const API_BASE_URL = 'http://localhost:3001/api';
    
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
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Admin token obtained');
    console.log('   Token length:', token.length);
    console.log('   Token prefix:', token.substring(0, 20) + '...');

    // 2. Decode token to view content
    console.log('\n🔍 Decoding JWT Token...');
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      console.log('❌ Token decoding failed');
      return;
    }

    console.log('✅ Token decoding successful');
    console.log('   Token content:', JSON.stringify(decoded, null, 2));

    // 3. Check if contains isAdmin field
    console.log('\n🔍 Checking user information in token...');
    if (decoded.isAdmin !== undefined) {
      console.log(`✅ Token contains isAdmin field: ${decoded.isAdmin}`);
    } else {
      console.log('❌ Token does not contain isAdmin field');
    }

    if (decoded.userId) {
      console.log(`✅ Token contains userId: ${decoded.userId}`);
    } else {
      console.log('❌ Token does not contain userId');
    }

    if (decoded.email) {
      console.log(`✅ Token contains email: ${decoded.email}`);
    } else {
      console.log('❌ Token does not contain email');
    }

    // 4. Verify token signature
    console.log('\n🔍 Verifying token signature...');
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token signature verification successful');
    } catch (verifyError) {
      console.log('❌ Token signature verification failed:', verifyError.message);
    }

    // 5. Check backend JWT_SECRET environment variable
    console.log('\n🔍 Checking JWT_SECRET environment variable...');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      console.log('✅ JWT_SECRET is set');
      console.log('   Length:', jwtSecret.length);
      console.log('   Prefix:', jwtSecret.substring(0, 5) + '...');
    } else {
      console.log('❌ JWT_SECRET not set, using default value');
    }

  } catch (error) {
    console.log('❌ Error occurred during debugging:', error.message);
  }
};

testToken();