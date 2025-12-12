import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const resetAdminPassword = async () => {
  try {
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
      console.log('❌ Admin account does not exist, creating new admin account');
      
      // Create new admin account
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      const newAdmin = new User({
        name: 'System Administrator',
        email: 'admin@pawdia.ai',
        password: hashedPassword,
        credits: 1000,
        isAdmin: true,
        isVerified: true
      });
      
      await newAdmin.save();
      console.log('✅ New admin account created successfully');
      console.log(`   Password: admin123456`);
      console.log(`   Email: admin@pawdia.ai`);
      
    } else {
      console.log('📋 Found existing admin account:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Current password hash: ${adminUser.password}`);
      
      // Reset password
      console.log('\n🔄 Resetting admin password...');
      const newPassword = 'admin123456';
      const salt = await bcrypt.genSalt(12);
      const newHashedPassword = await bcrypt.hash(newPassword, salt);
      
      adminUser.password = newHashedPassword;
      adminUser.isVerified = true;
      await adminUser.save();
      
      console.log('✅ Admin password reset successfully');
      console.log(`   New password: ${newPassword}`);
      console.log(`   New password hash: ${newHashedPassword}`);
      
      // Verify new password
      console.log('\n🔍 Verifying new password...');
      const isCorrect = await bcrypt.compare(newPassword, newHashedPassword);
      console.log(`   Password verification: ${isCorrect ? '✅ Correct' : '❌ Wrong'}`);
      
      // Verify using User model's comparePassword method
      const userModelCheck = await adminUser.comparePassword(newPassword);
      console.log(`   Model verification: ${userModelCheck ? '✅ Correct' : '❌ Wrong'}`);
    }
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run reset
resetAdminPassword();