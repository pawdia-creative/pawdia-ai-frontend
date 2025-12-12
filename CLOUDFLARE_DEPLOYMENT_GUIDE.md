# Cloudflare 部署指南

## 概述
本指南将帮助您将 Pawdia AI 项目部署到 Cloudflare 平台：
- 前端：Cloudflare Pages (React/Vite 应用)
- 后端：Cloudflare Workers (Node.js API)

## 前置要求
1. Cloudflare 账号：Pawdia.creative@gmail.com
2. GitHub 仓库：
   - 前端：`pawdia-creative/pawdia-ai-frontend`
   - 后端：`pawdia-creative/pawdia-ai-backend`

## 1. Cloudflare Pages 前端部署

### 1.1 创建 Pages 项目
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** 页面
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 连接您的 GitHub 账号
6. 选择仓库 `pawdia-creative/pawdia-ai-frontend`

### 1.2 配置构建设置
```
Build command: npm run build
Build output directory: dist
Root directory: (留空)
Node.js version: 18
```

### 1.3 环境变量配置
在 Pages 项目设置中添加以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_API_URL` | `https://your-workers-domain.workers.dev` | Production |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `your_stripe_publishable_key` | Production |
| `VITE_API_URL` | `https://your-workers-domain.workers.dev` | Preview |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `your_stripe_publishable_key` | Preview |

### 1.4 自定义域名配置
1. 在 Pages 项目中点击 **Custom domains**
2. 添加自定义域名 `pawdia-ai.com`
3. 配置 DNS 记录指向 Cloudflare

## 2. Cloudflare Workers 后端部署

### 2.1 创建 Workers 项目
1. 在 Cloudflare Dashboard 中进入 **Workers & Pages**
2. 点击 **Create a Worker**
3. 选择 **Create application**
4. 选择 **Import from GitHub**
5. 连接仓库 `pawdia-creative/pawdia-ai-backend`

### 2.2 配置环境变量
在 Workers 项目设置中添加以下环境变量：

| 变量名 | 描述 | 环境 |
|--------|------|------|
| `JWT_SECRET` | JWT 密钥 | Production |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | Production |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 云名称 | Production |
| `CLOUDINARY_API_KEY` | Cloudinary API 密钥 | Production |
| `CLOUDINARY_API_SECRET` | Cloudinary API 密钥 | Production |
| `RESEND_API_KEY` | Resend API 密钥 | Production |
| `PAYPAL_CLIENT_ID` | PayPal 客户端 ID | Production |
| `PAYPAL_CLIENT_SECRET` | PayPal 客户端密钥 | Production |

### 2.3 D1 数据库配置
1. 创建 D1 数据库：
   ```bash
   wrangler d1 create pawdia-ai-db
   ```

2. 执行数据库迁移：
   ```bash
   wrangler d1 execute pawdia-ai-db --file=./schema.sql
   ```

### 2.4 R2 存储配置
1. 创建 R2 存储桶：
   ```bash
   wrangler r2 bucket create pawdia-ai-storage
   ```

## 3. 部署步骤

### 3.1 前端部署
```bash
# 1. 克隆前端仓库
git clone https://github.com/pawdia-creative/pawdia-ai-frontend.git
cd pawdia-ai-frontend

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 部署到 Cloudflare Pages（通过 Git 集成）
# 在 Cloudflare Dashboard 中自动部署
```

### 3.2 后端部署
```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 克隆后端仓库
git clone https://github.com/pawdia-creative/pawdia-ai-backend.git
cd pawdia-ai-backend

# 4. 安装依赖
npm install

# 5. 配置环境变量
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
# ... 其他环境变量

# 6. 部署 Workers
wrangler deploy
```

## 4. 域名配置

### 4.1 DNS 设置
在 Cloudflare DNS 中添加以下记录：

| 类型 | 名称 | 目标 | 代理状态 |
|------|------|------|----------|
| CNAME | api | your-workers-domain.workers.dev | 已代理 |
| CNAME | www | your-pages-domain.pages.dev | 已代理 |
| CNAME | @ | your-pages-domain.pages.dev | 已代理 |

### 4.2 SSL/TLS 配置
1. 进入 **SSL/TLS** 页面
2. 设置加密模式为 **Full (strict)**
3. 启用 **Always Use HTTPS**
4. 配置 **HSTS**（可选）

## 5. 监控和日志

### 5.1 Workers 监控
- 在 Cloudflare Dashboard 中查看 Workers 性能指标
- 配置告警通知

### 5.2 Pages 监控
- 查看部署历史和状态
- 监控构建日志

## 6. 性能优化

### 6.1 前端优化
- 启用 Cloudflare 自动压缩
- 配置适当的缓存头
- 使用 Cloudflare 的图片优化

### 6.2 后端优化
- 启用 Workers KV 缓存
- 配置适当的超时设置
- 监控 CPU 使用情况

## 7. 安全配置

### 7.1 访问控制
- 配置 CORS 策略
- 设置 API 速率限制
- 启用安全头

### 7.2 数据保护
- 加密敏感数据
- 配置安全的会话管理
- 定期轮换 API 密钥

## 故障排除

### 常见问题
1. **构建失败**：检查 Node.js 版本和依赖
2. **部署错误**：验证环境变量配置
3. **连接问题**：检查 API URL 和 CORS 配置

### 调试工具
- Cloudflare Workers Logs
- Pages Build Logs
- 浏览器开发者工具

## 支持
如需帮助，请联系：
- 邮箱：Pawdia.creative@gmail.com
- 文档：[Cloudflare 官方文档](https://developers.cloudflare.com/)