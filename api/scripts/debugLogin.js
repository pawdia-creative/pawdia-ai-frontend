import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const debugLogin = async () => {
  try {
    console.log('🔍 Debugging login issues...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawdia-ai';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Database connection successful');
    
    // Find admin account
    const adminUser = await User.findOne({ email: 'admin@pawdia.ai' });
    
    if (!adminUser) {
      console.log('❌ Admin account does not exist');
      return;
    }
    
    console.log('📋 Admin account information:');
    console.log(`   ID: ${adminUser._id}`);
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
    
    // Check MongoDB connection status in auth routes
    console.log('\n🔍 Checking MongoDB connection status...');
    const mongooseConnection = await import('mongoose');
    console.log(`   Mongoose connection status: ${mongooseConnection.connection.readyState}`);
    console.log(`   Connection host: ${mongooseConnection.connection.host}`);
    console.log(`   Database name: ${mongooseConnection.connection.name}`);
    
    // Test User.findOne() query
    console.log('\n🔍 Testing User.findOne() query...');
    try {
      const testUser = await User.findOne().limit(1);
      console.log(`   Query result: ${testUser ? '✅ Success' : '❌ Failed'}`);
      if (testUser) {
        console.log(`   Found user: ${testUser.email}`);
      }
    } catch (queryError) {
      console.log(`   Query error: ${queryError.message}`);
    }
    
    // Test specific user query
    console.log('\n🔍 Testing specific user query...');
    try {
      const specificUser = await User.findOne({ email: 'admin@pawdia.ai' });
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
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run debug
debugLogin();