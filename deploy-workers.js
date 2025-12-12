#!/usr/bin/env node

/**
 * Cloudflare Workers 部署脚本
 * 这个脚本用于在 Cloudflare 构建环境中正确部署 Workers API
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 开始部署 Cloudflare Workers API...');

try {
  // 检查是否在 Cloudflare 构建环境中
  const isCloudflareBuild = process.env.CF_PAGES === '1' || process.env.CLOUDFLARE_BUILD === '1';
  
  if (isCloudflareBuild) {
    console.log('📍 检测到 Cloudflare 构建环境');
  }

  // 进入 API 目录
  const apiDir = join(process.cwd(), 'api');
  
  if (!existsSync(apiDir)) {
    throw new Error('API 目录不存在');
  }

  console.log('📁 进入 API 目录:', apiDir);
  
  // 安装依赖
  console.log('📦 安装 API 依赖...');
  execSync('cd api && npm install', { stdio: 'inherit' });
  
  // 部署 Workers
  console.log('🌐 部署 Workers API...');
  execSync('cd api && npx wrangler deploy --config wrangler.toml', { stdio: 'inherit' });
  
  console.log('✅ Workers API 部署成功！');
  
} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}