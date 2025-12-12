import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking database connection status...');
    
    // Check MongoDB connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawdia-ai';
    console.log(`📡 MongoDB URI: ${mongoUri}`);
    
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ MongoDB connection successful');
      
      // Test query
      const userCount = await User.countDocuments();
      console.log(`📊 Number of users in database: ${userCount}`);
      
      // Check admin account
      const adminUser = await User.findOne({ email: 'admin@pawdia.ai' });
      if (adminUser) {
        console.log('✅ Admin account exists in MongoDB');
        console.log(`   Name: ${adminUser.name}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ Admin account does not exist in MongoDB');
      }
      
    } catch (mongoError) {
      console.log('❌ MongoDB connection failed:', mongoError.message);
      console.log('💡 System may be using in-memory database');
    }
    
    // Check environment variables
    console.log('\n🔍 Checking environment variables:');
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI || 'Not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run check
checkDatabaseStatus();