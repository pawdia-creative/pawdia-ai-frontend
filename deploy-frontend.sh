#!/bin/bash

# Cloudflare Pages 前端部署脚本
# 使用方法: ./deploy-frontend.sh

set -e

echo "🚀 开始部署前端到 Cloudflare Pages..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查环境变量
if [ -z "$VITE_API_URL" ]; then
    echo "⚠️  警告: VITE_API_URL 环境变量未设置"
    echo "请设置 VITE_API_URL，例如:"
    echo "export VITE_API_URL='https://your-api-domain.workers.dev'"
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 运行构建
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成!"

# 部署到 Cloudflare Pages（通过 GitHub 集成）
echo "🌐 部署到 Cloudflare Pages..."
echo "请确保:"
echo "1. 已将代码推送到 GitHub 仓库: pawdia-creative/pawdia-ai-frontend"
echo "2. 在 Cloudflare Dashboard 中配置了 Pages 项目"
echo "3. 已连接 GitHub 仓库和 Cloudflare Pages"
echo ""
echo "Cloudflare 将自动检测到 GitHub 的推送并开始构建部署"

echo ""
echo "🎉 前端部署准备完成!"
echo "📋 下一步:"
echo "1. 检查 Cloudflare Pages 构建状态"
echo "2. 验证部署的网站功能"
echo "3. 配置自定义域名（可选）"