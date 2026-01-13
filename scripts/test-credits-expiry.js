#!/usr/bin/env node

// Test script for credits expiry functionality
// This script tests the credits expiry feature

console.log('Testing Credits Expiry Functionality');
console.log('=====================================');

console.log('');
console.log('This script provides commands to test the credits expiry functionality:');
console.log('');

console.log('1. Check current credits and expiry for a user:');
console.log("   npx wrangler d1 execute pawdia-ai-db --remote --command=\"SELECT id, email, credits, credits_expires FROM users WHERE email = 'your-email@example.com'\"");
console.log('');

console.log('2. Manually expire credits for testing:');
console.log("   npx wrangler d1 execute pawdia-ai-db --remote --command=\"UPDATE users SET credits_expires = datetime('now', '-1 day') WHERE email = 'test-user@example.com'\"");
console.log('');

console.log('3. Check if expired credits are cleaned:');
console.log("   npx wrangler d1 execute pawdia-ai-db --remote --command=\"SELECT id, email, credits, credits_expires FROM users WHERE credits_expires < datetime('now')\"");
console.log('');

console.log('4. Test free subscription (permanent credits):');
console.log("   npx wrangler d1 execute pawdia-ai-db --remote --command=\"UPDATE users SET subscription_plan = 'free', credits = 3, credits_expires = NULL WHERE email = 'test-free@example.com'\"");
console.log('   - Check that credits_expires remains NULL (permanent)');
console.log('');

console.log('5. Test paid subscription adding credits with expiry:');
console.log('   - Subscribe to Basic/Premium plan via the frontend');
console.log('   - Check that credits_expires is set to 30 days from now');
console.log('');

console.log('6. Test credit package purchase with expiry:');
console.log('   - Purchase credits via credit package');
console.log('   - Check that credits_expires is set to 30 days from now');
console.log('');

console.log('7. Test automatic cleanup on /api/auth/me:');
console.log('   - Set a user\'s credits_expires to past date');
console.log('   - Call /api/auth/me for that user');
console.log('   - Check that credits are reset to 0');
console.log('');

console.log('8. Verify different user types:');
console.log("   npx wrangler d1 execute pawdia-ai-db --remote --command=\"SELECT email, subscription_plan, credits, credits_expires FROM users WHERE credits > 0 LIMIT 10\"");
console.log('   - Free users should have credits_expires = NULL');
console.log('   - Paid users should have credits_expires set to future date');
console.log('');
