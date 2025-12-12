import dotenv from 'dotenv';
import User from '../models/D1User.js';
import connectDB from '../config/d1-database.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB.connect();
    console.log('✅ Database connection successful');
    
    // Check if admin account already exists
    const existingAdmin = await User.findByEmail('admin@pawdia.ai');
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists, updating information...');
      
      // Update admin account information
      existingAdmin.name = 'System Administrator';
      existingAdmin.isAdmin = true;
      existingAdmin.credits = 1000;
      existingAdmin.isVerified = true;
      
      // If password is not admin123456, update password
      const isPasswordCorrect = await existingAdmin.comparePassword('admin123456');
      if (!isPasswordCorrect) {
        existingAdmin.password = 'admin123456';
      }
      
      await existingAdmin.save();
      console.log('✅ Admin account information updated');
    } else {
      // Create new admin account
      const adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@pawdia.ai',
        password: 'admin123456',
        credits: 1000,
        isAdmin: true,
        isVerified: true
      });
      
      console.log('✅ Admin account created successfully');
    }
    
    // Display admin account information
    const admin = await User.findByEmail('admin@pawdia.ai');
    console.log('\n📋 Admin account information:');
    console.log(`👤 Name: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`💰 Credits: ${admin.credits}`);
    console.log(`👑 Admin: ${admin.isAdmin ? 'Yes' : 'No'}`);
    console.log(`✅ Verified: ${admin.isVerified ? 'Yes' : 'No'}`);
    
    console.log('\n🎉 Admin account initialization completed!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Solution:');
      console.log('1. Check if D1 database is properly configured');
      console.log('2. Verify database connection settings');
    }
  }
};

// Run seed script
// Run seed script
seedAdmin();