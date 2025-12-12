# 🎯 Cloudflare Pages 完整设置流程

## 🚨 当前状态
你遇到错误：`Project not found` - 这意味着需要在 Cloudflare 控制台先创建 Pages 项目。

## 📋 完整解决步骤

### 步骤 1：创建 Cloudflare Pages 项目

1. **登录 Cloudflare 控制台**
   - 访问 https://dash.cloudflare.com
   - 使用你的账户登录

2. **创建新的 Pages 项目**
   - 点击左侧菜单 "Workers & Pages"
   - 点击 "Create" 或 "Create project" 按钮
   - **重要**：选择 "Pages"（不是 Workers！）
   - 选择 "Connect to Git"

3. **连接 GitHub 仓库**
   - 选择你的 pawdia-ai 仓库
   - 选择 main 分支
   - 点击 "Begin setup"

### 步骤 2：配置构建设置

在 Cloudflare 控制台中设置：

**构建配置：**
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `frontend-separation/dist`
- **Install command**: `npm install`
- **Deploy command**: `npx wrangler pages deploy frontend-separation/dist`

**环境变量：**
```
NODE_VERSION=18
VITE_API_URL=https://your-api-domain.com
VITE_AI_API_KEY=your-ai-api-key
```

### 步骤 3：完成创建

1. 点击 "Save and Deploy"
2. 等待初始部署完成
3. 获取你的 Pages 项目 URL

### 步骤 4：后续部署选项

创建项目后，你有几种部署方式：

#### 选项 A：自动部署（推荐）
每次推送代码到 main 分支时自动部署：
```bash
git push origin main
```

#### 选项 B：手动部署
使用我们的部署脚本：
```bash
./deploy-helper.sh
```

#### 选项 C：直接命令部署
```bash
npm run build
npx wrangler pages deploy frontend-separation/dist
```

## 🔧 立即操作

### 1. 先创建 Pages 项目
**现在就去 Cloudflare 控制台创建 Pages 项目！**

### 2. 使用部署助手（项目创建后）
项目创建完成后，运行：
```bash
./deploy-helper.sh
```

这个脚本会：
- ✅ 检查登录状态
- ✅ 列出你的所有 Pages 项目
- ✅ 交互式选择项目名称
- ✅ 自动构建和部署

### 3. 或者手动部署
```bash
# 构建
npm run build

# 部署（使用你的实际项目名称）
npx wrangler pages deploy frontend-separation/dist --project-name=你的项目名称
```

## 📊 验证成功

部署成功时你应该看到：
```
✅ Build completed successfully
✅ Pages deployment completed
✅ Website is live at: https://your-project.pages.dev
```

## ⚠️ 重要提醒

- **必须创建 Pages 项目，不是 Workers 项目**
- **项目名称可以自定义**
- **Deploy command 现在支持使用 wrangler pages deploy**
- **创建后可以设置自动部署**

## 🆘 遇到问题？

1. **检查项目类型**：确保是 Pages 不是 Workers
2. **验证登录状态**：`npx wrangler whoami`
3. **查看项目列表**：`npx wrangler pages project list`
4. **联系支持**：提供具体错误信息

## 🎯 下一步

1. **立即**：登录 Cloudflare 控制台创建 Pages 项目
2. **然后**：使用 `./deploy-helper.sh` 进行交互式部署
3. **最后**：验证网站是否正常访问

**快去创建 Pages 项目吧！创建完成后我们的部署脚本会自动处理剩余工作。**