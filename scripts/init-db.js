#!/usr/bin/env node

// Database initialization script for Pawdia AI
// This script sets up the D1 database with the required schema

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split the schema into individual statements
const statements = schema
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log('Database initialization script for Pawdia AI');
console.log('===========================================');
console.log('');
console.log('This script will initialize the D1 database with the required schema.');
console.log('');
console.log('To run this script, execute the following commands:');
console.log('');
console.log('1. Make sure you have wrangler installed:');
console.log('   npm install -g wrangler');
console.log('');
console.log('2. Initialize D1 database (replace YOUR_DATABASE_NAME):');
console.log('   npx wrangler d1 create YOUR_DATABASE_NAME');
console.log('');
console.log('3. Update wrangler.toml with your database ID');
console.log('');
console.log('4. Run the schema:');
statements.forEach((stmt, index) => {
  if (stmt.trim()) {
    console.log(`   npx wrangler d1 execute YOUR_DATABASE_NAME --file=database/schema.sql`);
    console.log('');
    return; // Only show once
  }
});
console.log('Alternatively, you can run individual statements:');
statements.forEach((stmt, index) => {
  if (stmt.trim()) {
    console.log(`   npx wrangler d1 execute YOUR_DATABASE_NAME --command="${stmt}"`);
  }
});
console.log('');
console.log('Schema contains the following tables:');
console.log('- users: User accounts and profiles');
console.log('- images: Generated images history');
console.log('- payments: Payment transactions');
console.log('- analytics: User behavior analytics');
console.log('');
console.log('After initialization, you may want to create some demo users:');
console.log('INSERT INTO users (id, email, name, credits, is_verified) VALUES');
console.log('(\'demo-user-1\', \'demo@pawdia.ai\', \'Demo User\', 100, true);');
