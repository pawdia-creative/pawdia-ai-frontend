import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

// Test different connection string configurations
const connectionTests = [
  {
    name: 'Current environment variable configuration',
    uri: process.env.MONGODB_URI
  },
  {
    name: 'Without database name',
    uri: process.env.MONGODB_URI?.replace(/\/[^?]*/, '')
  },
  {
    name: 'With database name',
    uri: process.env.MONGODB_URI
  }
];

async function testConnection(connectionConfig) {
  const client = new MongoClient(connectionConfig.uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });

  try {
    console.log(`\n🧪 Test: ${connectionConfig.name}`);
    console.log(`🔗 Connection string: ${connectionConfig.uri.replace(/:[^:]*@/, ':****@')}`);
    
    await client.connect();
    
    // Test connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connection successful!");
    
    // List databases
    const databases = await client.db().admin().listDatabases();
    console.log(`📁 Found ${databases.databases.length} databases`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    
    // Detailed error analysis
    console.log('   🔍 Authentication failed - Please check:');
    console.log('     1. Username and password are correct');
    console.log('     2. Database user exists');
    console.log('     3. User permissions are set correctly');
    
    console.log('   🔍 Network issue - Please check:');
    console.log('     1. Cluster address is correct');
    console.log('     2. Network connection is normal');
    console.log('     3. IP whitelist settings');
    
    console.log('   🔍 Connection timeout - Please check:');
    console.log('     1. Network firewall settings');
    console.log('     2. Proxy configuration');
    
    console.log('🔍 MongoDB Atlas Connection Diagnostic Tool');
    
    // Check environment variables
    console.log('📋 Environment variable check:');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
    
    console.log('⚠️  Warning: MONGODB_URI environment variable not set');
    
    // Run connection tests
    
    console.log('\n📊 Diagnostic results:');
    console.log(`   Successful connections: ${successCount}/${connectionTests.length}`);
    
    console.log('\n💡 Suggestions:');
    console.log('   1. Check MongoDB Atlas console');
    console.log('   2. Confirm database user and password');
    console.log('   3. Check network access settings');
    console.log('   4. Try testing connection with MongoDB Compass');
    
    return false;
  } finally {
    await client.close();
  }
}

async function runDiagnostics() {
  console.log('🔍 MongoDB Atlas Connection Diagnostic Tool');
  // MongoDB Atlas Connection Diagnostic Tool
  console.log('='.repeat(50));
  
  // Check environment variables
  // Check environment variables
  console.log('📋 Environment variable check:');
  // Environment variable check:
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  // MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}
  
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  Warning: MONGODB_URI environment variable not set');
    // Warning: MONGODB_URI environment variable not set
  }
  
  // Run connection tests
  // Run connection tests
  let successCount = 0;
  
  for (const config of connectionTests) {
    const success = await testConnection(config);
    if (success) successCount++;
  }
  
  console.log('\n📊 Diagnostic results:');
  // Diagnostic results:
  console.log(`   Successful connections: ${successCount}/${connectionTests.length}`);
  // Successful connections: ${successCount}/${connectionTests.length}
  
  if (successCount === 0) {
    console.log('\n💡 Suggestions:');
    // Suggestions:
    console.log('   1. Check MongoDB Atlas console');
    // 1. Check MongoDB Atlas console
    console.log('   2. Confirm database user and password');
    // 2. Confirm database user and password
    console.log('   3. Check network access settings');
    // 3. Check network access settings
    console.log('   4. Try testing connection with MongoDB Compass');
    // 4. Try testing connection with MongoDB Compass
  }
}

runDiagnostics().catch(console.error);