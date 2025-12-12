# Cloudflare Workers 部署指南

## 🚀 部署步骤

### 1. 安装依赖
```bash
cd api
npm install
```

### 2. 配置环境变量
```bash
# 设置 Secrets (使用 wrangler CLI)
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put PAYPAL_CLIENT_ID
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
```

### 3. 配置 D1 数据库
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages → D1
3. 创建数据库 `pawdia-ai-db`
4. 在 wrangler.toml 中更新 database_id

### 4. 本地测试
```bash
# 启动本地开发服务器
npm run dev:workers

# 测试 API
curl http://localhost:8787/api/health
```

### 5. 部署到生产环境
```bash
# 部署到 Cloudflare Workers
npm run deploy

# 或者使用 wrangler 直接部署
npx wrangler deploy
```

## 📋 环境变量配置

### 必需变量
- `JWT_SECRET`: JWT 密钥
- `RESEND_API_KEY`: 邮件服务 API 密钥
- `STRIPE_SECRET_KEY`: Stripe 支付密钥
- `PAYPAL_CLIENT_ID`: PayPal 客户端 ID
- `PAYPAL_CLIENT_SECRET`: PayPal 客户端密钥
- `CLOUDINARY_CLOUD_NAME`: Cloudinary 云名称
- `CLOUDINARY_API_KEY`: Cloudinary API 密钥
- `CLOUDINARY_API_SECRET`: Cloudinary API 密钥

### D1 数据库绑定
数据库绑定在 `wrangler.toml` 中配置：
```toml
[[d1_databases]]
binding = "DB"
database_name = "pawdia-ai-db"
database_id = "your-actual-database-id"
```

## 🔧 API 端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/auth/verify-email` - 邮箱验证
- `POST /api/auth/resend-verification` - 重新发送验证邮件

### 健康检查
- `GET /api/health` - 服务健康状态

## 📝 注意事项

1. **数据库迁移**: 首次部署需要运行数据库迁移
2. **CORS 配置**: 已配置跨域支持
3. **错误处理**: 全局错误处理已启用
4. **环境区分**: 支持开发和生产环境

## 🐛 故障排除

### 常见问题
1. **数据库连接失败**: 检查 D1 数据库 ID 是否正确
2. **环境变量缺失**: 确保所有必需的 secrets 已设置
3. **路由 404 错误**: 检查 URL 路径是否正确

### 调试命令
```bash
# 查看日志
npx wrangler tail

# 检查配置
npx wrangler config

# 验证部署
npx wrangler deploy --dry-run
```

## 🔗 相关链接
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)