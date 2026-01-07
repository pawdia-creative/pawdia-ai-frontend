// Test script to check API status
const API_BASE = 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';

async function testAPI() {
  console.log('🔍 Testing Pawdia AI API...');
  console.log('API Base URL:', API_BASE);

  try {
    // Test debug endpoint first (most important - checks JWT_SECRET)
    console.log('\n1. Testing debug endpoint (checks JWT_SECRET)...');
    const debugResponse = await fetch(`${API_BASE}/debug`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Debug response status:', debugResponse.status);

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug check result:', debugData);

      if (debugData.jwtSecretExists) {
        console.log('🎉 JWT_SECRET is properly configured!');
      } else {
        console.log('❌ JWT_SECRET is NOT set!');
      }

      if (debugData.dbConnection) {
        console.log('✅ Database connection OK');
      } else {
        console.log('❌ Database connection failed');
      }
    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status, debugResponse.statusText);
      const errorText = await debugResponse.text();
      console.log('Error details:', errorText);
    }

    // Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    if (error.message.includes('fetch')) {
      console.log('This indicates the API server is not reachable');
    }
  }
}

testAPI();
