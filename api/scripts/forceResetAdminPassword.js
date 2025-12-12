import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/D1User.js';

dotenv.config();

const forceResetAdminPassword = async () => {
  try {
    // Connect to database
    await connectDB.connect();
    
    console.log('✅ Database connection successful');
    
    // Find admin account
    const adminUser = await User.findByEmail('admin@pawdia.ai');
    
    if (!adminUser) {
      console.log('❌ Admin account does not exist, creating new admin account');
      
      // Create new admin account
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'admin@pawdia.ai',
        password: hashedPassword,
        credits: 1000,
        isAdmin: true,
        isVerified: true
      });
      
      console.log('✅ New admin account created successfully');
      console.log(`   Password: admin123456`);
      console.log(`   Email: admin@pawdia.ai`);
      
    } else {
      console.log('📋 Found existing admin account:');
      console.log(`   Name: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Current password hash: ${adminUser.password}`);
      
      // Force reset password
      console.log('\n🔄 Force resetting admin password...');
      const newPassword = 'admin123456';
      
      // Hash the password first since D1User doesn't have pre-save hooks
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      await User.update(adminUser.id, {
        password: hashedPassword,
        isVerified: true
      });
      
      console.log('✅ Admin password reset successfully');
      console.log(`   New password: ${newPassword}`);
      
      // Re-query user to get new hash value
      const updatedUser = await User.findByEmail('admin@pawdia.ai');
      console.log(`   New password hash: ${updatedUser.password}`);
      
      // Verify new password
      console.log('\n🔍 Verifying new password...');
      const isCorrect = await bcrypt.compare(newPassword, updatedUser.password);
      console.log(`   bcrypt verification: ${isCorrect ? '✅ Correct' : '❌ Wrong'}`);
      
      // Verify using User model's comparePassword method
      const userModelCheck = await User.comparePassword(newPassword, updatedUser.password);
      console.log(`   Model verification: ${userModelCheck ? '✅ Correct' : '❌ Wrong'}`);
    }
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
    console.error('Error details:', error);
  }
};

// Run reset
forceResetAdminPassword();