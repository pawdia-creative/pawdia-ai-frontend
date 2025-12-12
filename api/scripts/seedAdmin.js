import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pawdia-ai';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Database connection successful');
    // Database connection successful
    
    // Check if admin account already exists
    // Check if admin account already exists
    const existingAdmin = await User.findOne({ email: 'admin@pawdia.ai' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists, updating information...');
      // Admin account already exists, updating information...
      
      // Update admin account information
      // Update admin account information
      existingAdmin.name = 'System Administrator';
      existingAdmin.isAdmin = true;
      existingAdmin.credits = 1000;
      existingAdmin.isVerified = true;
      
      // If password is not admin123456, update password
      // If password is not admin123456, update password
      const isPasswordCorrect = await existingAdmin.comparePassword('admin123456');
      if (!isPasswordCorrect) {
        const salt = await bcrypt.genSalt(12);
        existingAdmin.password = await bcrypt.hash('admin123456', salt);
      }
      
      await existingAdmin.save();
      console.log('✅ Admin account information updated');
      // Admin account information updated
    } else {
      // Create new admin account
      // Create new admin account
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@pawdia.ai',
        password: hashedPassword,
        credits: 1000,
        isAdmin: true,
        isVerified: true
      });
      
      await adminUser.save();
      console.log('✅ Admin account created successfully');
      // Admin account created successfully
    }
    
    // Display admin account information
    // Display admin account information
    const admin = await User.findOne({ email: 'admin@pawdia.ai' }).select('-password');
    console.log('\n📋 Admin account information:');
    // Admin account information:
    console.log(`👤 Name: ${admin.name}`);
    // Name: ${admin.name}
    console.log(`📧 Email: ${admin.email}`);
    // Email: ${admin.email}
    console.log(`💰 Credits: ${admin.credits}`);
    // Credits: ${admin.credits}
    console.log(`👑 Admin: ${admin.isAdmin ? 'Yes' : 'No'}`);
    // Admin: ${admin.isAdmin ? 'Yes' : 'No'}
    console.log(`✅ Verified: ${admin.isVerified ? 'Yes' : 'No'}`);
    // Verified: ${admin.isVerified ? 'Yes' : 'No'}
    
    console.log('\n🎉 Admin account initialization completed!');
    // Admin account initialization completed!
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    // Initialization failed:
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Solution:');
      // Solution:
      console.log('1. Ensure MongoDB service is started: brew services start mongodb/brew/mongodb-community');
      // 1. Ensure MongoDB service is started: brew services start mongodb/brew/mongodb-community
      console.log('2. Or use: mongod --config /usr/local/etc/mongod.conf');
      // 2. Or use: mongod --config /usr/local/etc/mongod.conf
      console.log('3. Check if MongoDB is running on port 27017');
      // 3. Check if MongoDB is running on port 27017
    }
    
  } finally {
    // Close database connection
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    // Database connection closed
  }
};

// Run seed script
// Run seed script
seedAdmin();