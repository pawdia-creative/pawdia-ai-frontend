import dotenv from 'dotenv';
import connectDB from '../config/d1-database.js';
import User from '../models/D1User.js';

dotenv.config();

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking database connection status...');
    
    // Check D1 database connection
    console.log(`📡 Checking D1 database connection...`);
    
    try {
      await connectDB.connect();
      
      console.log('✅ D1 database connection successful');
      
      // Test query
      const users = await User.find();
      const userCount = users.length;
      console.log(`📊 Number of users in database: ${userCount}`);
      
      // Check admin account
      const adminUser = await User.findByEmail('admin@pawdia.ai');
      if (adminUser) {
        console.log('✅ Admin account exists in D1 database');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ Admin account does not exist in D1 database');
      }
      
    } catch (dbError) {
      console.log('❌ D1 database connection failed:', dbError.message);
      console.log('💡 Please check your database configuration');
    }
    
    // Check environment variables
    console.log('\n🔍 Checking environment variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
};

// Run check
checkDatabaseStatus();