import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion } from 'mongodb';

dotenv.config();

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
    if (error.message.includes('bad auth')) {
      console.log('   🔍 Authentication failed - Please check:');
      console.log('     1. Username and password are correct');
      console.log('     2. Database user exists');
      console.log('     3. User permissions are set correctly');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('   🔍 Network issue - Please check:');
      console.log('     1. Database address is correct');
      console.log('     2. Network connection is normal');
      console.log('     3. Firewall or network configuration');
    } else if (error.message.includes('timeout')) {
      console.log('   🔍 Connection timeout - Please check:');
      console.log('     1. Network firewall settings');
      console.log('     2. Proxy configuration');
      console.log('     3. Database server performance');
    }
    
    return false;
  } finally {
    await client.close();
  }
}

async function runDiagnostics() {
  console.log('🔍 Database Connection Diagnostic Tool');
  console.log('='.repeat(50));
  
  // Check environment variables
  console.log('📋 Environment variable check:');
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
  
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  Warning: MONGODB_URI environment variable not set');
    console.log('💡 Please configure your database connection before running diagnostics.');
    return;
  }
  
  // Test different connection string configurations
  const connectionTests = [
    {
      name: 'Current environment variable configuration',
      uri: process.env.MONGODB_URI
    }
  ];
  
  // Run connection tests
  let successCount = 0;
  
  for (const config of connectionTests) {
    const success = await testConnection(config);
    if (success) successCount++;
  }
  
  console.log('\n📊 Diagnostic results:');
  console.log(`   Successful connections: ${successCount}/${connectionTests.length}`);
  
  if (successCount === 0) {
    console.log('\n💡 Suggestions:');
    console.log('   1. Check your database console');
    console.log('   2. Confirm database user and password');
    console.log('   3. Check network access settings');
    console.log('   4. Try testing connection with database client tools');
  }
}

runDiagnostics().catch(console.error);