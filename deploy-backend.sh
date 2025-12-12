#!/bin/bash

# Cloudflare Workers 后端部署脚本
# 使用方法: ./deploy-backend.sh

set -e

echo "🚀 开始部署后端到 Cloudflare Workers..."

# 检查 Wrangler CLI
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 Wrangler CLI..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI 检查通过: $(wrangler --version)"

# 检查是否已登录
echo "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare，请先登录:"
    echo "wrangler login"
    exit 1
fi

echo "✅ Cloudflare 登录状态正常"

# 验证必要的环境变量
REQUIRED_VARS=("JWT_SECRET" "STRIPE_SECRET_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  缺少必要的环境变量:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "请设置环境变量，例如:"
    echo "export JWT_SECRET='your-jwt-secret'"
    echo "export STRIPE_SECRET_KEY='your-stripe-secret-key'"
    echo ""
    echo "或者使用 Wrangler 设置:"
    for var in "${MISSING_VARS[@]}"; do
        echo "wrangler secret put $var"
    done
fi

# 检查依赖
echo "📦 检查依赖..."
if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json，请在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "✅ 依赖检查完成"

# 验证服务器文件
if [ ! -f "server.js" ]; then
    echo "❌ 未找到 server.js 文件"
    exit 1
fi

echo "✅ 服务器文件检查完成"

# 设置环境变量（交互式）
echo ""
echo "🔑 配置环境变量..."
read -p "是否现在设置环境变量? (y/N): " setup_vars
if [[ $setup_vars =~ ^[Yy]$ ]]; then
    echo "设置环境变量:"
    wrangler secret put JWT_SECRET
    wrangler secret put STRIPE_SECRET_KEY
    wrangler secret put CLOUDINARY_CLOUD_NAME
    wrangler secret put CLOUDINARY_API_KEY
    wrangler secret put CLOUDINARY_API_SECRET
    wrangler secret put RESEND_API_KEY
    wrangler secret put PAYPAL_CLIENT_ID
    wrangler secret put PAYPAL_CLIENT_SECRET
fi

# D1 数据库设置
echo ""
echo "🗄️  D1 数据库配置..."
read -p "是否创建/配置 D1 数据库? (y/N): " setup_db
if [[ $setup_db =~ ^[Yy]$ ]]; then
    echo "创建 D1 数据库..."
    wrangler d1 create pawdia-ai-db
    
    echo "请在 wrangler.toml 中配置 database_id，然后运行:"
    echo "wrangler d1 execute pawdia-ai-db --file=./schema.sql"
fi

# R2 存储设置
echo ""
echo "💾 R2 存储配置..."
read -p "是否创建 R2 存储桶? (y/N): " setup_storage
if [[ $setup_storage =~ ^[Yy]$ ]]; then
    echo "创建 R2 存储桶..."
    wrangler r2 bucket create pawdia-ai-storage
fi

# 部署 Workers
echo ""
echo "🌐 部署 Workers..."
echo "部署命令: wrangler deploy"
echo ""

# 部署前的最终检查
echo "🔍 部署前检查..."
echo "项目名称: $(grep 'name = ' wrangler.toml | cut -d'"' -f2)"
echo "主文件: $(grep 'main = ' wrangler.toml | cut -d'"' -f2)"
echo "兼容日期: $(grep 'compatibility_date = ' wrangler.toml | cut -d'"' -f2)"

read -p "是否继续部署? (y/N): " deploy_confirm
if [[ $deploy_confirm =~ ^[Yy]$ ]]; then
    echo "🚀 开始部署..."
    wrangler deploy
    
    echo ""
    echo "🎉 后端部署完成!"
    echo "📋 部署后步骤:"
    echo "1. 检查 Workers 运行状态"
    echo "2. 测试 API 端点"
    echo "3. 配置自定义域名（可选）"
    echo "4. 设置监控和告警"
else
    echo "❌ 部署已取消"
    exit 1
fi