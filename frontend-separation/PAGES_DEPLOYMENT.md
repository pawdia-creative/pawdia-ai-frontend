# Cloudflare Pages 部署指南 - 前端项目

## 🎯 项目配置

### 1. 配置文件
项目已创建以下配置文件：

#### `wrangler.jsonc`
```json
{
  "name": "pawdia-ai-frontend",
  "compatibility_date": "2025-12-12",
  "pages_build_output_dir": "./dist",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  },
  "no_worker": true
}
```

#### `_worker.js`
空的 Worker 文件，满足 Cloudflare Pages 要求

#### `_routes.json`
路由配置，排除 API 路径

### 2. 部署脚本
在 `package.json` 中添加了：
```json
"deploy": "npm run build && npx wrangler pages deploy dist --project-name=pawdia-ai-frontend"
```

## ⚙️ Cloudflare 控制台设置

### 构建配置
1. **Framework preset**: `Vite`
2. **Build command**: `npm run build`
3. **Build output directory**: `dist`
4. **Install command**: `npm install`
5. **Deploy command**: `npm run deploy`

### 环境变量
```
NODE_VERSION=18
VITE_API_URL=https://your-api-domain.com
VITE_AI_API_KEY=your-ai-api-key
```

## 🚀 部署步骤

### 1. 本地构建测试
```bash
npm run build
```

### 2. 本地部署测试
```bash
npm run deploy
```

### 3. 推送到 GitHub
```bash
git add .
git commit -m "Add Pages deployment configuration"
git push origin main
```

## 📁 构建输出结构

构建成功后，`dist/` 目录应该包含：
```
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   ├── index-*.css
│   └── other-asset-files
├── examples/
├── favicon.ico
└── ...其他静态文件
```

## ✅ 成功验证

部署成功时，你应该看到：
```
✅ Build completed successfully
✅ Pages deployment completed
✅ Website is live at: https://pawdia-ai-frontend.pages.dev
```

## 🆘 常见问题解决

### 问题 1: "build output directory not found"
**解决**: 确保构建命令正确执行，dist 目录已创建

### 问题 2: "Missing entry-point to Worker script"
**解决**: 确认 `_worker.js` 文件存在

### 问题 3: 构建失败
**解决**: 检查环境变量是否正确设置

## 📞 支持

如果部署遇到问题：
1. 检查构建日志中的具体错误
2. 确认所有配置文件存在且格式正确
3. 验证 Node.js 版本（需要 18+）