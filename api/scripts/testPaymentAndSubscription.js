import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPaymentAndSubscription() {
  console.log('🔧 Testing payment and subscription functionality...');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection successful');
    
    // First login to get token
    console.log('\n🔐 Login to get access token...');
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
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, cannot continue testing');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token obtained');
    
    // Test subscription plans API
    console.log('\n📡 Testing subscription plans API...');
    const plansResponse = await fetch('http://localhost:3001/api/subscriptions/plans', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('   Status code:', plansResponse.status);
    if (plansResponse.ok) {
      const plansData = await plansResponse.json();
      console.log('✅ Subscription plans API working');
      console.log('   Number of plans:', Object.keys(plansData).length);
      console.log('   Plans:', Object.keys(plansData).join(', '));
      
      // Display plan details
      for (const planKey in plansData) {
        const plan = plansData[planKey];
        console.log(`   ${plan.name}: $${plan.price} - ${plan.credits} credits`);
      }
    } else {
      console.log('❌ Subscription plans API failed');
    }
    
    // Test user subscription info API
    console.log('\n📡 Testing user subscription info API...');
    const profileResponse = await fetch('http://localhost:3001/api/subscriptions/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('   Status code:', profileResponse.status);
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      console.log('✅ User subscription info API working');
      console.log('   Current credits:', profileData.credits);
      console.log('   Subscription status:', profileData.subscription);
    } else {
      console.log('❌ User subscription info API failed');
    }
    
    // Test free subscription
    console.log('\n📡 Testing free subscription...');
    const freeSubscribeResponse = await fetch('http://localhost:3001/api/subscriptions/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: 'free' }),
    });
    
    console.log('   Status code:', freeSubscribeResponse.status);
    if (freeSubscribeResponse.ok) {
      const subscribeData = await freeSubscribeResponse.json();
      console.log('✅ Free subscription successful');
      console.log('   New credits:', subscribeData.credits);
      console.log('   Subscription info:', subscribeData.subscription);
    } else {
      console.log('❌ Free subscription failed');
    }
    
    // Test credits recharge API
    console.log('\n📡 Testing credits recharge API...');
    const addCreditsResponse = await fetch('http://localhost:3001/api/subscriptions/credits/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 10 }),
    });
    
    console.log('   Status code:', addCreditsResponse.status);
    if (addCreditsResponse.ok) {
      const creditsData = await addCreditsResponse.json();
      console.log('✅ Credits recharge successful');
      console.log('   New credits:', creditsData.credits);
    } else {
      console.log('❌ Credits recharge failed');
    }
    
    // Test credits consumption API
    console.log('\n📡 Testing credits consumption API...');
    const useCreditsResponse = await fetch('http://localhost:3001/api/subscriptions/credits/use', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 1 }),
    });
    
    console.log('   Status code:', useCreditsResponse.status);
    if (useCreditsResponse.ok) {
      const useData = await useCreditsResponse.json();
      console.log('✅ Credits consumption successful');
      console.log('   Remaining credits:', useData.credits);
    } else {
      console.log('❌ Credits consumption failed');
    }
    
    // Test payment API (create order)
    console.log('\n📡 Testing payment API (create order)...');
    const createOrderResponse = await fetch('http://localhost:3001/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: '10.00',
        currency: 'USD',
        description: 'Test payment order'
      }),
    });
    
    console.log('   Status code:', createOrderResponse.status);
    if (createOrderResponse.ok) {
      const orderData = await createOrderResponse.json();
      console.log('✅ Create order successful');
      console.log('   Order ID:', orderData.id);
      console.log('   Status:', orderData.status);
      
      // Test get order details
      console.log('\n📡 Testing get order details...');
      const orderDetailsResponse = await fetch(`http://localhost:3001/api/payments/order/${orderData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('   Status code:', orderDetailsResponse.status);
      if (orderDetailsResponse.ok) {
        console.log('✅ Get order details successful');
      } else {
        console.log('❌ Get order details failed');
      }
    } else {
      console.log('❌ Create order failed');
      
      // Try to get error message
      try {
        const errorData = await createOrderResponse.json();
        console.log('   Error message:', errorData.message);
      } catch (e) {
        console.log('   Unable to parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Error occurred during testing:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run test
testPaymentAndSubscription();