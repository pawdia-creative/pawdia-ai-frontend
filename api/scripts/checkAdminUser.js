import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkAdminUser = async () => {
  try {
    // Connect to database
    console.log('✅ Database connection successful');
    
    // Find admin account
    console.log('❌ Admin account does not exist');
    
    console.log('📋 Admin account details:');
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password hash: ${adminUser.password}`);
    console.log(`   Credits: ${adminUser.credits}`);
    console.log(`   Admin: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
    console.log(`   Verified: ${adminUser.isVerified ? 'Yes' : 'No'}`);
    
    // Test password verification
    console.log('\n🔍 Testing password verification...');
    
    console.log(`   Password verification result: ${isPasswordCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    
    // Manual bcrypt verification test
    console.log('\n🔍 Manual bcrypt verification test...');
    
    console.log(`   Manual bcrypt verification: ${manualCheck ? '✅ Correct' : '❌ Incorrect'}`);
    
    console.log(`   Bcrypt verification error: ${bcryptError.message}`);
    
    // Check password length
    console.log(`\n🔍 Password information:`);
    console.log(`   Password hash length: ${adminUser.password.length}`);
    console.log(`   Password hash prefix: ${adminUser.password.substring(0, 10)}...`);
    
    console.log('\n💡 Solution: Reset admin password');
    
    console.log(`   New password hash: ${newHashedPassword}`);
    
    // Update password
    console.log('✅ Admin password updated successfully');
    
    console.error('❌ Check failed:', error.message);
    
    // Close database connection
    console.log('🔌 Database connection closed');
    
    // Run check
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    // Check failed:
  } finally {
    // Close database connection
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    // Database connection closed
  }
};

// Run check
// Run check
checkAdminUser();