#!/usr/bin/env node

/**
 * Cloudflare Workers 诊断脚本
 * 用于检查 Workers 部署状态和连接性
 */

import { execSync } from 'child_process';

console.log('🔍 Cloudflare Workers 诊断检查...\n');

// 1. 检查 Workers 部署状态
console.log('📋 1. 检查 Workers 部署状态:');
try {
  const result = execSync('cd api && npx wrangler deployments list --name pawdia-ai-api', { encoding: 'utf8' });
  console.log('✅ Workers 部署状态正常');
  console.log(result);
} catch (error) {
  console.log('❌ 无法获取 Workers 部署状态:', error.message);
}

console.log('\n🌐 2. 检查 Workers 配置:');
try {
  const config = execSync('cd api && cat wrangler.toml', { encoding: 'utf8' });
  console.log('Workers 配置:');
  console.log(config);
} catch (error) {
  console.log('❌ 无法读取 Workers 配置:', error.message);
}

console.log('\n📡 3. DNS 和网络检查:');
console.log('正在检查 DNS 解析...');

// 检查 DNS 解析
try {
  execSync('nslookup pawdia-ai-api.pawdia-creative.workers.dev', { encoding: 'utf8' });
  console.log('✅ DNS 解析正常');
} catch (error) {
  console.log('❌ DNS 解析失败:', error.message);
}

// 检查 IP 连接
try {
  execSync('ping -c 2 pawdia-ai-api.pawdia-creative.workers.dev', { encoding: 'utf8', timeout: 10000 });
  console.log('✅ 网络连接正常');
} catch (error) {
  console.log('❌ 网络连接失败:', error.message);
}

console.log('\n🎯 4. 建议的解决方案:');
console.log('   a) 等待 DNS 传播完成（可能需要 5-30 分钟）');
console.log('   b) 检查 Cloudflare 控制台中的 Workers 状态');
console.log('   c) 尝试重新部署 Workers');
console.log('   d) 检查是否有防火墙或网络限制');

console.log('\n📖 5. 手动测试命令:');
console.log('   curl -X GET https://pawdia-ai-api.pawdia-creative.workers.dev/api/health');
console.log('   curl -X POST https://pawdia-ai-api.pawdia-creative.workers.dev/api/auth/register \\\n');
console.log('     -H "Content-Type: application/json" \\\n');
console.log('     -d \'{"email":"test@example.com","password":"password123","name":"Test User"}\'');