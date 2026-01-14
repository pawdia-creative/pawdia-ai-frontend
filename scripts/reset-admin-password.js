#!/usr/bin/env node

// Script to reset admin password
// Usage: node reset-admin-password.js <new-password>

import crypto from 'crypto';

// PBKDF2 password hashing function matching the Worker implementation
async function hashPassword(password) {
  // Generate a random salt for each password
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  // PBKDF2 parameters
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(salt.length + derivedBits.byteLength);
  hashArray.set(salt);
  hashArray.set(new Uint8Array(derivedBits), salt.length);

  // Return format: $pbkdf2-sha256$iterations$salt$hash
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

  return `$pbkdf2-sha256$100000$${saltBase64}$${hashBase64}`;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const newPassword = args[0] || 'admin123456';

  console.log(`Generating password hash for: ${newPassword}`);

  try {
    const hash = await hashPassword(newPassword);
    console.log(`Password hash: ${hash}`);

    // Output wrangler command to update the database
    console.log('\nTo update admin password in database, run:');
    console.log(`npx wrangler d1 execute pawdia-ai-db --remote --command="UPDATE users SET password = '${hash.replace(/'/g, "''")}' WHERE email = 'admin@pawdia.ai'"`);

  } catch (error) {
    console.error('Error generating password hash:', error);
  }
}

main();
