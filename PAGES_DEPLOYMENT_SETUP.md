# Cloudflare Pages 部署设置指南

## 🎯 目标
将项目正确配置为 Cloudflare Pages 项目，避免 Workers 部署错误。

## 📋 当前配置

### 1. 项目文件配置
我们已经创建了以下配置文件：

#### wrangler.jsonc（Pages 配置）
```json
{
  "name": "pawdia-ai-frontend",
  "compatibility_date": "2025-12-12",
  "pages_build_output_dir": "./frontend-separation/dist",
  "assets": {
    "directory": "./frontend-separation/dist",
    "binding": "ASSETS"
  },
  "no_worker": true
}
```

#### package.json（部署命令）
```json
{
  "scripts": {
    "deploy": "npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend"
  }
}
```

## ⚙️ Cloudflare 控制台设置

### 构建配置设置
在 Cloudflare 控制台中，设置以下值：

1. **Framework preset**: `Vite`
2. **Build command**: `npm run build`
3. **Build output directory**: `frontend-separation/dist`
4. **Install command**: `npm install`
5. **Deploy command**: `npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend`

### 环境变量
添加以下环境变量：
```
NODE_VERSION=18
VITE_API_URL=https://your-api-domain.com
VITE_AI_API_KEY=your-ai-api-key
```

## 🚀 部署步骤

### 1. 构建项目
```bash
npm run build
```

### 2. 部署到 Pages
```bash
npm run deploy
```

### 3. 验证部署
检查部署日志中是否包含：
```
✅ Pages deployment successful
✅ Static assets deployed
```

## 🔧 如果仍然失败

### 选项 1：使用直接 Pages 部署
```bash
# 直接部署构建好的文件
npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend --branch=main
```

### 选项 2：重新创建 Pages 项目
1. 删除现有的 Workers/Pages 项目
2. 创建新的 **Pages** 项目（确保选择 Pages，不是 Workers）
3. 连接 GitHub 仓库
4. 使用上述配置设置

### 选项 3：手动上传部署
```bash
# 构建前端
npm run build

# 直接上传到 Pages
npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend
```

## 📁 文件结构验证

确保你的项目结构如下：
```
pawdia-ai.com/
├── frontend-separation/dist/     # 构建输出目录
│   ├── index.html
│   └── assets/
├── wrangler.jsonc               # Pages 配置
├── package.json                 # 部署脚本
└── ...其他文件
```

## ✅ 成功指标

部署成功时你应该看到：
```
✅ Build completed successfully
✅ Pages deployment completed
✅ Website is live at: https://your-project.pages.dev
```

## 🆘 常见问题和解决

### 问题 1：仍然显示 Workers 错误
**解决**：确认在 Cloudflare 控制台中创建的是 **Pages** 项目，不是 Workers 项目

### 问题 2：部署命令不生效
**解决**：使用直接部署命令：
```bash
npx wrangler pages deploy frontend-separation/dist --project-name=pawdia-ai-frontend
```

### 问题 3：构建失败
**解决**：检查环境变量是否正确设置，特别是 `NODE_VERSION=18`

## 📞 支持

如果问题持续存在：
1. 检查 Cloudflare Pages 文档
2. 联系 Cloudflare 支持，说明项目类型转换需求
3. 提供项目 ID 和详细错误日志