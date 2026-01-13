#!/usr/bin/env node

// Migration script to set credits expiry for existing subscribed users
// This sets credits_expires to 30 days from now for users who have active subscriptions and credits

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Migration: Setting credits expiry for existing subscribed users');
console.log('================================================================');

console.log('');
console.log('This script will update existing users with active subscriptions to have credits_expires set.');
console.log('Users with active subscriptions and credits > 0 will have their credits expire in 30 days.');
console.log('');

console.log('To run this migration, execute the following command:');
console.log('');
console.log("npx wrangler d1 execute pawdia-ai-db --remote --command=\"UPDATE users SET credits_expires = datetime('now', '+30 days') WHERE subscription_status = 'active' AND credits > 0 AND credits_expires IS NULL\"");
console.log('');
console.log('This will set credits_expires for all active subscribers who have credits and haven\'t had expiry set yet.');
