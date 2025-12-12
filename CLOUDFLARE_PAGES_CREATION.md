# Cloudflare Pages 项目创建和部署指南

## 🚨 当前问题

错误信息：`Project not found. The specified project name does not match any of your existing projects.`

这意味着你需要先在 Cloudflare 控制台中创建 Pages 项目。

## 📋 解决方案步骤

### 选项 1：在 Cloudflare 控制台创建 Pages 项目

1. **登录 Cloudflare 控制台**
   - 访问 https://dash.cloudflare.com
   - 登录你的账户

2. **创建新的 Pages 项目**
   - 点击左侧菜单 "Workers & Pages"
   - 点击 "Create" 按钮
   - 选择 "Pages"（不是 Workers！）
   - 选择 "Connect to Git"

3. **配置项目**
   - 项目名称：`pawdia-ai-frontend`（或你喜欢的名称）
   - 连接你的 GitHub 仓库
   - 设置构建配置（见下文）

### 选项 2：使用现有项目

如果你已经有 Pages 项目，请使用正确的项目名称：

```bash
# 查看你的现有项目
npx wrangler pages project list

# 使用正确的项目名称部署
npx wrangler pages deploy frontend-separation/dist --project-name=你的实际项目名称
```

## ⚙️ 构建配置设置

### 在 Cloudflare 控制台中设置：

**构建和部署设置：**
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `frontend-separation/dist`
- **Install command**: `npm install`
- **Deploy command**: `npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend`

**环境变量：**
```
NODE_VERSION=18
VITE_API_URL=https://your-api-domain.com
VITE_AI_API_KEY=your-ai-api-key
```

## 🎯 更新项目配置

让我更新配置文件使用正确的设置：

### 1. 更新 package.json
使用动态项目名称：

```json
{
  "scripts": {
    "deploy": "npx wrangler pages deploy frontend-separation/dist",
    "deploy:create": "npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend"
  }
}
```

### 2. 创建部署脚本
创建简单的部署脚本：

```bash
#!/bin/bash
# deploy-pages.sh

echo "🚀 开始部署到 Cloudflare Pages..."

# 构建项目
echo "📦 构建前端项目..."
npm run build

# 部署到 Pages
echo "☁️ 部署到 Cloudflare Pages..."
npx wrangler pages deploy frontend-separation/dist

echo "✅ 部署完成！"
```

## 🔧 立即操作

### 步骤 1：创建 Pages 项目
1. 登录 Cloudflare 控制台
2. 创建 Pages 项目（不是 Workers！）
3. 连接你的 GitHub 仓库
4. 使用上述构建配置

### 步骤 2：获取项目名称
创建项目后，使用以下命令查看项目列表：
```bash
npx wrangler pages project list
```

### 步骤 3：部署
使用正确的项目名称：
```bash
npx wrangler pages deploy frontend-separation/dist --project-name=你的项目名称
```

## 📱 或者使用 Git 集成部署

最简单的方法是让 Cloudflare 自动部署：

1. 在 Cloudflare 控制台创建 Pages 项目
2. 连接 GitHub 仓库
3. 设置自动部署（每次推送代码时自动部署）
4. 推送代码到 main 分支

## ⚠️ 重要提醒

- **确保创建的是 Pages 项目，不是 Workers 项目**
- **项目名称可以自定义，不一定必须是 pawdia-ai-frontend**
- **部署命令中的项目名称必须与你的实际项目匹配**

## 🆘 如果仍然有问题

1. **检查 Wrangler 认证**：
   ```bash
   npx wrangler login
   ```

2. **验证账户权限**：
   ```bash
   npx wrangler whoami
   ```

3. **联系 Cloudflare 支持**：提供项目创建过程中的具体错误信息