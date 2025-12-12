#!/bin/bash

# Cloudflare Pages 部署助手
# 这个脚本帮助你找到正确的项目名称并部署到 Pages

echo "🚀 Cloudflare Pages 部署助手"
echo "=================================="

# 检查是否已经登录
echo "🔑 检查 Wrangler 登录状态..."
npx wrangler whoami

if [ $? -ne 0 ]; then
    echo "❌ 请先登录 Wrangler:"
    echo "运行: npx wrangler login"
    exit 1
fi

echo "✅ 已登录到 Cloudflare"
echo ""

# 列出所有 Pages 项目
echo "📋 你的 Pages 项目列表:"
echo "=================================="
npx wrangler pages project list

echo ""
echo "🔍 请从上面的列表中选择你的项目名称"
echo "如果没有看到项目，请先在 Cloudflare 控制台创建 Pages 项目"
echo ""

# 交互式输入项目名称
echo "请输入你的 Pages 项目名称（例如: pawdia-ai-frontend）:"
read PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
    echo "❌ 项目名称不能为空"
    exit 1
fi

echo ""
echo "📦 开始构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo ""
echo "☁️ 部署到 Cloudflare Pages..."
echo "项目名称: $PROJECT_NAME"
echo "部署目录: frontend-separation/dist"
echo ""

# 执行部署
npx wrangler pages deploy frontend-separation/dist --project-name="$PROJECT_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo "🌐 你的网站应该可以在 Pages 项目页面查看"
else
    echo ""
    echo "❌ 部署失败，请检查错误信息"
    echo "💡 提示: 确保项目名称正确，并且你有权限部署到该项目"
fi