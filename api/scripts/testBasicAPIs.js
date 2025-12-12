import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBasicAPIs() {
  console.log('🔧 Testing basic API functionality...');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection successful');
    
    // Test health check endpoint
    console.log('\n📡 Testing health check endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      console.log('✅ Health check API working');
    } else {
      console.log('❌ Health check API failed:', healthResponse.status);
    }
    
    // Test authentication endpoints (without authentication)
    console.log('\n📡 Testing authentication endpoints...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pawdia.ai',
        password: 'admin123'
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login API working');
      console.log('   User:', loginData.user.name);
      console.log('   Admin:', loginData.user.isAdmin);
      
      // Use obtained token to test authenticated APIs
      const token = loginData.token;
      
      // Test user profile endpoint
      console.log('\n📡 Testing user profile endpoint...');
      const profileResponse = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ User profile API working');
        console.log('   Credits:', profileData.credits);
      } else {
        console.log('❌ User profile API failed:', profileResponse.status);
      }
      
      // Test subscription plans endpoint
      console.log('\n📡 Testing subscription plans endpoint...');
      const plansResponse = await fetch('http://localhost:3001/api/subscriptions/plans', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        console.log('✅ Subscription plans API working');
        console.log('   Number of plans:', Object.keys(plansData).length);
        console.log('   Plans:', Object.keys(plansData).join(', '));
      } else {
        console.log('❌ Subscription plans API failed:', plansResponse.status);
      }
      
    } else {
      console.log('❌ Login API failed:', loginResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Error occurred during testing:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run test
testBasicAPIs();