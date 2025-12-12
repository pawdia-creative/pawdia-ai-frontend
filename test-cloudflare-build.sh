#!/bin/bash

# Cloudflare Pages 构建测试脚本
# 用于验证前端项目是否能成功构建

set -e

echo "🧪 开始测试 Cloudflare Pages 构建..."

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js版本
echo "📋 检查Node.js版本..."
NODE_VERSION=$(node --version)
echo "Node.js版本: $NODE_VERSION"

# 检查npm版本
echo "📋 检查npm版本..."
NPM_VERSION=$(npm --version)
echo "npm版本: $NPM_VERSION"

# 进入前端目录
cd frontend-separation

echo "📦 清理之前的构建..."
rm -rf dist
rm -rf node_modules/.vite

echo "🔄 重新安装依赖（使用npm）..."
npm install --package-lock-only

echo "🏗️  开始构建..."
if npm run build; then
    echo -e "${GREEN}✅ 构建成功！${NC}"
    
    # 检查构建输出
    echo "📁 检查构建输出..."
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ dist/index.html 存在${NC}"
        ls -la dist/
        echo "📊 构建文件统计："
        echo "HTML文件大小: $(ls -lh dist/index.html | awk '{print $5}')"
        echo "CSS文件大小: $(ls -lh dist/assets/*.css 2>/dev/null | awk '{print $5}' | head -1 || echo '未找到CSS文件')"
        echo "JS文件大小: $(ls -lh dist/assets/*.js 2>/dev/null | awk '{print $5}' | head -1 || echo '未找到JS文件')"
    else
        echo -e "${RED}❌ dist/index.html 不存在${NC}"
        exit 1
    fi
    
    # 检查锁定文件
    echo "📋 检查依赖锁定文件..."
    if [ -f "package-lock.json" ]; then
        echo -e "${GREEN}✅ package-lock.json 存在${NC}"
    else
        echo -e "${RED}❌ package-lock.json 不存在${NC}"
        exit 1
    fi
    
    # 检查是否有bun相关文件
    if [ -f "bun.lockb" ]; then
        echo -e "${YELLOW}⚠️  发现 bun.lockb 文件，建议删除${NC}"
    else
        echo -e "${GREEN}✅ 没有发现 bun.lockb 文件${NC}"
    fi
    
    echo -e "${GREEN}🎉 构建测试完成！项目已准备好部署到 Cloudflare Pages${NC}"
    
else
    echo -e "${RED}❌ 构建失败！${NC}"
    echo "请检查错误信息并修复问题。"
    exit 1
fi