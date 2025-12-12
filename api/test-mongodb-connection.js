import { MongoClient, ServerApiVersion } from 'mongodb';

// Get connection string from environment variables
const uri = process.env.MONGODB_URI || "mongodb+srv://pawdia-ai-user:<db_password>@cluster0.ils2gjj.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('📊 Connection string:', uri.replace(/:[^:]*@/, ':****@')); // Hide password
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    
    // List all databases
    const databases = await client.db().admin().listDatabases();
    console.log('📁 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide detailed error diagnosis
    if (error.message.includes('bad auth')) {
      console.log('💡 Authentication failed - possible reasons:');
      console.log('   1. Incorrect password');
      console.log('   2. Database user does not exist');
      console.log('   3. Insufficient user permissions');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network connection issue - possible reasons:');
      console.log('   1. Incorrect cluster address');
      console.log('   2. Network access restricted');
      console.log('   3. IP address not added to whitelist');
    }
    
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('🔌 Connection closed');
  }
}

run().catch(console.dir);