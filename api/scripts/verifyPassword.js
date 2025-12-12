import bcrypt from 'bcryptjs';

const verifyPassword = async () => {
  const storedHash = '$2a$12$MWuYkHR06WNfJqWygXWNbOo5IFUBNIMclx/QUgw9OfGcuLiluoTci';
  
  console.log('🔍 Verifying password hash:');
  console.log('   Stored hash:', storedHash);
  console.log('   Hash prefix:', storedHash.substring(0, 10));
  
  // Test possible passwords
  const testPasswords = [
    'admin123456',
    'admin123',
    'admin',
    'password',
    '123456',
    'admin@pawdia.ai',
    'pawdia',
    'Pawdia123',
    'Admin123456',
    'ADMIN123456'
  ];
  
  for (const password of testPasswords) {
    const result = await bcrypt.compare(password, storedHash);
    console.log(`   Password "${password}": ${result ? '✅ Correct' : '❌ Wrong'}`);
    if (result) {
      console.log('🎉 Found correct password:', password);
      return;
    }
  }
  
  console.log('❌ No matching password found');
  console.log('💡 Suggestion: Need to reset admin password');
};

verifyPassword();