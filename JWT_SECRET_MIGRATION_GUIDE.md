# JWT_SECRET 迁移到环境变量指南

## ✅ 已完成的更改

### 1. 代码更新
- ✅ 所有 JWT_SECRET 使用已更新为从环境变量读取
- ✅ 移除了所有硬编码的 fallback 值（如 'default-secret', 'fallback-secret'）
- ✅ 添加了错误处理，如果 JWT_SECRET 未设置会报错

### 2. 配置文件
- ✅ `wrangler.toml` 中已移除 JWT_SECRET（不再在配置文件中）
- ✅ 创建了 `.env.example` 文件作为模板

---

## 📋 设置步骤

### 本地开发环境

1. **创建 .env 文件**
   ```bash
   cd api
   cp .env.example .env
   ```

2. **生成安全的 JWT_SECRET**
   ```bash
   # 使用 OpenSSL 生成随机字符串
   openssl rand -base64 32
   
   # 或使用 Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **编辑 .env 文件**
   ```env
   JWT_SECRET=你生成的随机字符串
   ```

4. **验证设置**
   ```bash
   npm run dev
   ```

---

### Cloudflare Workers 生产环境

#### 方法 1: 使用 Wrangler Secrets (推荐)

1. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **设置 JWT_SECRET**
   ```bash
   cd api
   npx wrangler secret put JWT_SECRET
   ```
   然后输入你的 JWT_SECRET 值

3. **验证设置**
   ```bash
   # 查看 secrets（不会显示值）
   npx wrangler secret list
   ```

#### 方法 2: 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages → 你的 Worker → Settings → Variables
3. 在 "Secrets" 部分添加：
   - **Name**: `JWT_SECRET`
   - **Value**: 你的 JWT_SECRET 值

---

## ⚠️ 重要注意事项

### 1. 如果当前 JWT_SECRET 已泄露

如果之前的 `pawdia-ai-jwt-secret-2025` 在生产环境使用：

1. **立即更换 JWT_SECRET**
   - 生成新的 JWT_SECRET
   - 更新 Cloudflare Workers Secrets

2. **通知用户重新登录**
   - 所有现有的 JWT token 将失效
   - 用户需要重新登录获取新 token

3. **清理 Git 历史（可选）**
   - 如果 JWT_SECRET 在 Git 历史中，考虑清理历史记录

### 2. 安全最佳实践

- ✅ **永远不要**将 JWT_SECRET 提交到 Git
- ✅ **永远不要**在配置文件中硬编码 JWT_SECRET
- ✅ 使用强随机字符串（至少 32 字符）
- ✅ 定期轮换 JWT_SECRET（建议每 6-12 个月）
- ✅ 不同环境使用不同的 JWT_SECRET

### 3. 验证配置

检查 JWT_SECRET 是否正确设置：

```bash
# 本地开发
cd api
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set')"

# Cloudflare Workers
npx wrangler secret list
```

---

## 🔧 故障排除

### 问题: "JWT_SECRET environment variable is not set"

**解决方案**:
1. 检查 `.env` 文件是否存在
2. 确认 `.env` 文件中有 `JWT_SECRET=...`
3. 确认 `dotenv.config()` 在代码中正确调用
4. 重启开发服务器

### 问题: Cloudflare Workers 中 JWT_SECRET 未设置

**解决方案**:
1. 确认已使用 `wrangler secret put JWT_SECRET` 设置
2. 检查 Worker 的环境变量设置
3. 重新部署 Worker

### 问题: Token 验证失败

**可能原因**:
1. JWT_SECRET 已更改，但旧 token 仍在使用
2. 不同环境使用了不同的 JWT_SECRET

**解决方案**:
1. 清除所有现有 token
2. 确保所有环境使用相同的 JWT_SECRET（或接受 token 失效）

---

## 📝 更新的文件列表

1. `api/middleware/auth.js` - 添加了 JWT_SECRET 验证
2. `api/routes/auth.js` - 添加了 JWT_SECRET 验证
3. `api/routes/auth-workers.js` - 添加了 JWT_SECRET 验证
4. `api/routes/admin-workers.js` - 添加了 JWT_SECRET 验证
5. `api/routes/admin-workers-simple.js` - 添加了 JWT_SECRET 验证
6. `api/worker.js` - 移除了 fallback 值
7. `api/worker-simple.js` - 移除了 fallback 值
8. `api/.env.example` - 新建环境变量模板
9. `api/wrangler.toml` - 已确认 JWT_SECRET 不在配置文件中

---

## ✅ 检查清单

- [ ] 创建 `.env` 文件（本地开发）
- [ ] 生成安全的 JWT_SECRET
- [ ] 设置 Cloudflare Workers Secrets（生产环境）
- [ ] 测试本地开发环境
- [ ] 测试生产环境
- [ ] 如果更换了 JWT_SECRET，通知用户重新登录
- [ ] 确认 `.env` 在 `.gitignore` 中

---

*最后更新: 2025-01-27*
