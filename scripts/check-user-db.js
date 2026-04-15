#!/usr/bin/env node

// Inspect a user record in the D1 database to debug login issues.
// Usage:
//   node scripts/check-user-db.js <email> [database-name]
// Example:
//   node scripts/check-user-db.js admin@pawdia.ai pawdia-ai-db

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeForShell(value) {
  return String(value).replace(/'/g, "'\\''");
}

function main() {
  const email = process.argv[2];
  const dbName = process.argv[3] || 'pawdia-ai-db';

  if (!email) {
    console.error('Usage: node scripts/check-user-db.js <email> [database-name]');
    process.exit(1);
  }

  const sanitizedEmail = String(email).trim().toLowerCase();
  const query = `SELECT id, email, name, password, password_hash, is_admin, is_verified, last_login, created_at, updated_at, subscription_plan, subscription_status, subscription_expires, subscription_expires_at, credits, free_granted FROM users WHERE email = '${escapeForShell(sanitizedEmail)}'`;

  console.log(`Inspecting user: ${sanitizedEmail}`);
  console.log(`Database: ${dbName}`);
  console.log('---');
  console.log('Running query:');
  console.log(query);
  console.log('---');

  try {
    const cmd = `npx wrangler d1 execute ${escapeForShell(dbName)} --remote --command="${query.replace(/"/g, '\\"')}"`;
    const result = execSync(cmd, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      encoding: 'utf8',
    });
    console.log(result);
  } catch (error) {
    const stdout = error?.stdout ? String(error.stdout) : '';
    const stderr = error?.stderr ? String(error.stderr) : '';
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.error('Failed to inspect the user record.');
    process.exit(error?.status || 1);
  }
}

main();
