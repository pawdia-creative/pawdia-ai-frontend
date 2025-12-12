# Cloudflare Pages 部署配置指南

## 🚨 重要：项目类型设置

**当前问题**：Cloudflare 仍然将项目识别为 Workers 而不是 Pages，导致使用 `npx wrangler deploy` 命令失败。

## 📋 Dashboard 配置步骤

### 1. 删除现有项目
1. 进入 Cloudflare Dashboard
2. 找到当前的 Workers/Pages 项目
3. **完全删除**现有项目（不要只是重新配置）

### 2. 创建新的 Pages 项目
1. 点击 **"Create a project"**
2. 选择 **"Pages"**（不是 Workers & Pages）
3. 连接到你的 GitHub 仓库

### 3. 构建配置
在 Pages 项目设置中，确保：

| 配置项 | 正确值 |
|--------|--------|
| **Framework preset** | **Vite** 或 **Static** |
| **Build command** | `npm run build` |
| **Build output directory** | `frontend-separation/dist` |
| **Install command** | `npm install` |

### 4. 环境变量
```
NODE_VERSION=18
```

## 🔧 项目文件说明

### 当前项目结构
```
pawdia-ai.com/
├── frontend-separation/     # ✅ 前端代码（Vite + React）
│   ├── dist/               # ✅ 构建输出目录
│   ├── src/
│   └── package.json
├── api/                    # ✅ 后端代码（独立部署）
├── static.json            # ✅ Pages 配置文件
├── pages.json             # ✅ Pages 配置（备用）
├── _routes.json           # ✅ SPA 路由配置
└── package.json           # ✅ 根目录构建脚本
```

### 关键配置文件

**static.json** - 主要 Pages 配置
```json
{
  "build": {
    "command": "cd frontend-separation && npm install && npm run build",
    "output": "frontend-separation/dist"
  }
}
```

**package.json** - 构建脚本
```json
{
  "scripts": {
    "build": "cd frontend-separation && npm install && npm run build"
  }
}
```

## ⚠️ 常见错误

### ❌ 错误：使用 wrangler deploy
```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Missing entry-point to Worker script
```

**原因**：项目被配置为 Workers 而不是 Pages

### ✅ 正确：Pages 自动部署
```
Success: Build command completed
✓ Build completed successfully
```

## 🎯 成功标准

部署成功后，你应该看到：
- ✅ 构建成功（没有 wrangler 错误）
- ✅ 部署到 Pages 域名
- ✅ 前端页面正常加载
- ✅ API 调用指向正确地址

## 📞 如果仍然失败

1. **完全删除** Cloudflare 项目
2. **重新创建** Pages 项目（不是 Workers）
3. **检查** GitHub 连接
4. **验证** 构建配置
5. **重新部署**