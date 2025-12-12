import dotenv from 'dotenv';
import User from '../models/D1User.js';
import connectDB from '../config/d1-database.js';

dotenv.config();

const checkAdminUser = async () => {
  try {
    // Connect to database
    await connectDB.connect();
    console.log('✅ Database connection successful');
    
    // Find admin account
    const adminUser = await User.findByEmail('admin@pawdia.ai');
    
    if (!adminUser) {
      console.log('❌ Admin account does not exist');
      return;
    }
    
    console.log('📋 Admin account details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Credits: ${adminUser.credits}`);
    console.log(`   Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
    console.log(`   Verified: ${adminUser.isVerified ? 'Yes' : 'No'}`);
    
    // Test password verification
    console.log('\n🔍 Testing password verification...');
    const isPasswordCorrect = await adminUser.comparePassword('admin123');
    console.log(`   Password verification result: ${isPasswordCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
};

// Run check
checkAdminUser();