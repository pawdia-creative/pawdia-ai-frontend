import dotenv from 'dotenv';
import connectDB from '../config/d1-database.js';

// Load environment variables
dotenv.config();

async function testFreeSubscriptionLimit() {
  console.log('🔧 Testing free subscription limit functionality...');
  
  try {
    // Connect to database
    await connectDB.connect();
    console.log('✅ Database connection successful');
    
    // First login to get token
    console.log('\n🔐 Logging in to get access token...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@pawdia.ai',
        password: 'admin123456'
      }),
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, cannot continue testing');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token obtained');
    console.log('   Current credits:', loginData.user.credits);
    console.log('   Current subscription:', loginData.user.subscription);
    
    // First attempt to subscribe to free plan
    console.log('\n📡 First attempt to subscribe to free plan...');
    const firstSubscribeResponse = await fetch('http://localhost:3001/api/subscriptions/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'free' }),
    });
    
    console.log('   Status code:', firstSubscribeResponse.status);
    if (firstSubscribeResponse.ok) {
      const firstData = await firstSubscribeResponse.json();
      console.log('✅ First subscription successful');
      console.log('   New credits:', firstData.credits);
      console.log('   Subscription info:', firstData.subscription);
    } else {
      const errorData = await firstSubscribeResponse.json();
      console.log('❌ First subscription failed:', errorData.message);
    }
    
    // Second attempt to subscribe to free plan (should fail)
    console.log('\n📡 Second attempt to subscribe to free plan...');
    const secondSubscribeResponse = await fetch('http://localhost:3001/api/subscriptions/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'free' }),
    });
    
    console.log('   Status code:', secondSubscribeResponse.status);
    if (secondSubscribeResponse.ok) {
      const secondData = await secondSubscribeResponse.json();
      console.log('❌ BUG: Second subscription successful (should not happen)');
      console.log('   New credits:', secondData.credits);
      console.log('   Subscription info:', secondData.subscription);
    } else {
      const errorData = await secondSubscribeResponse.json();
      console.log('✅ Second subscription failed (correct behavior)');
      console.log('   Error message:', errorData.message);
    }
    
    // Test paid plan (should be able to purchase multiple times)
    console.log('\n📡 Testing paid plan subscription...');
    const paidSubscribeResponse = await fetch('http://localhost:3001/api/subscriptions/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'basic' }),
    });
    
    console.log('   Status code:', paidSubscribeResponse.status);
    if (paidSubscribeResponse.ok) {
      const paidData = await paidSubscribeResponse.json();
      console.log('✅ Paid plan subscription successful');
      console.log('   New credits:', paidData.credits);
      console.log('   Subscription info:', paidData.subscription);
    } else {
      const errorData = await paidSubscribeResponse.json();
      console.log('❌ Paid plan subscription failed:', errorData.message);
    }
    
  } catch (error) {
    console.error('❌ Error occurred during testing:', error.message);
  }
}

// Run test
testFreeSubscriptionLimit();