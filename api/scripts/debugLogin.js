import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from '../config/d1-database.js';
import User from '../models/D1User.js';

dotenv.config();

const debugLogin = async () => {
  try {
    console.log('🔍 Debugging login issues...');
    
    // Connect to database
    await connectDB.connect();
    
    console.log('✅ Database connection successful');
    
    // Find admin account
    const adminUser = await User.findByEmail('admin@pawdia.ai');
    
    if (!adminUser) {
      console.log('❌ Admin account does not exist');
      return;
    }
    
    console.log('📋 Admin account information:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password hash: ${adminUser.password}`);
    console.log(`   Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
    console.log(`   Verified: ${adminUser.isVerified ? 'Yes' : 'No'}`);
    
    // Test password verification
    console.log('\n🔍 Testing password verification...');
    const isPasswordCorrect = await adminUser.comparePassword('admin123456');
    console.log(`   Password verification result: ${isPasswordCorrect ? '✅ Correct' : '❌ Wrong'}`);
    
    // Manual test bcrypt verification
    console.log('\n🔍 Manual testing bcrypt verification...');
    try {
      const manualCheck = await bcrypt.compare('admin123456', adminUser.password);
      console.log(`   Manual bcrypt verification: ${manualCheck ? '✅ Correct' : '❌ Wrong'}`);
    } catch (bcryptError) {
      console.log(`   Bcrypt verification error: ${bcryptError.message}`);
    }
    
    // Test User.find() query
    console.log('\n🔍 Testing User.find() query...');
    try {
      const users = await User.find();
      console.log(`   Query result: ${users.length > 0 ? '✅ Success' : '❌ Failed'}`);
      if (users.length > 0) {
        console.log(`   Found ${users.length} users`);
        console.log(`   First user: ${users[0].email}`);
      }
    } catch (queryError) {
      console.log(`   Query error: ${queryError.message}`);
    }
    
    // Test specific user query
    console.log('\n🔍 Testing specific user query...');
    try {
      const specificUser = await User.findByEmail('admin@pawdia.ai');
      console.log(`   Specific query result: ${specificUser ? '✅ Success' : '❌ Failed'}`);
      if (specificUser) {
        console.log(`   Found admin: ${specificUser.email}`);
        
        // Test password comparison
        const passwordMatch = await specificUser.comparePassword('admin123456');
        console.log(`   Password comparison result: ${passwordMatch ? '✅ Match' : '❌ No match'}`);
      }
    } catch (specificError) {
      console.log(`   Specific query error: ${specificError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debugging failed:', error.message);
  }
};

// Run debug
debugLogin();