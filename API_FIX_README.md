# 🔧 Pawdia AI API 修复指南

## 🚨 问题诊断

pawdia-ai.com 登录失败的根本原因是：**API Worker 缺少关键环境变量**，特别是 `JWT_SECRET`。

### 错误现象
- 前端显示：`net::ERR_CONNECTION_TIMED_OUT`
- 控制台显示：`AbortError: signal is aborted without reason`
- API 服务看似部署但认证功能完全失效

## ✅ 解决方案

### 方法1：自动修复脚本（推荐）

```bash
# 运行修复脚本
chmod +x fix-api-env.sh
./fix-api-env.sh
```

### 方法2：手动设置

#### 1. 设置 JWT_SECRET（必需）
```bash
cd api
echo "mRhMX7dVSRpGKSvi0SYQLY4/OvQPWMt8irQB10TFWoM=" | npx wrangler secret put JWT_SECRET
```

#### 2. 设置邮件服务（推荐）
```bash
# Resend (主要)
echo "your-resend-api-key" | npx wrangler secret put RESEND_API_KEY

# SendGrid (备用)
echo "your-sendgrid-api-key" | npx wrangler secret put SENDGRID_API_KEY
```

#### 3. 设置支付服务（可选）
```bash
echo "your-paypal-client-id" | npx wrangler secret put PAYPAL_CLIENT_ID
echo "your-paypal-client-secret" | npx wrangler secret put PAYPAL_CLIENT_SECRET
```

#### 4. 重新部署 Worker
```bash
cd api
npx wrangler deploy
```

### 方法3：Cloudflare 控制台设置

1. 访问 [Cloudflare Workers](https://dash.cloudflare.com/)
2. 选择你的账户和工作区
3. 找到 `pawdia-ai-api` Worker
4. 进入 **Settings** → **Variables**
5. 添加以下环境变量：

| Variable | Value | Type |
|----------|-------|------|
| `JWT_SECRET` | `mRhMX7dVSRpGKSvi0SYQLY4/OvQPWMt8irQB10TFWoM=` | Secret |
| `RESEND_API_KEY` | 你的 Resend API 密钥 | Secret |
| `PAYPAL_CLIENT_ID` | 你的 PayPal Client ID | Secret |
| `PAYPAL_CLIENT_SECRET` | 你的 PayPal Client Secret | Secret |

6. **保存** 并 **重新部署**

## 🧪 验证修复

### 运行测试脚本
```bash
node test-api-debug.js
```

### 预期输出
```json
{
  "jwtSecretExists": true,
  "dbConnection": true,
  "dbTestResult": { "test": 1 },
  "timestamp": "2026-01-07T..."
}
```

### 手动测试
```bash
# 测试健康检查
curl https://pawdia-ai-api.pawdia-creative.workers.dev/api/health

# 测试认证（需要有效的JWT token）
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://pawdia-ai-api.pawdia-creative.workers.dev/api/auth/me
```

## 📊 修复后的预期状态

| 组件 | 修复前 | 修复后 |
|------|--------|--------|
| 认证功能 | ❌ 完全失效 | ✅ 正常工作 |
| 用户登录 | ❌ 连接超时 | ✅ 正常登录 |
| API响应 | ❌ 500错误/超时 | ✅ 正常响应 |
| 数据库连接 | ✅ 正常 | ✅ 正常 |

## 🔍 技术细节

### 为什么 JWT_SECRET 如此重要？

1. **认证核心**: 所有用户认证都依赖JWT token验证
2. **Worker崩溃**: 缺少JWT_SECRET时，Worker抛出异常
3. **连锁反应**: 认证失败导致前端超时错误

### 环境变量层级

```
Cloudflare Secrets (最高优先级)
    ↓
Worker Environment Variables
    ↓
wrangler.toml 中的默认值 (最低优先级)
```

## 🚀 下一步

1. 设置环境变量
2. 重新部署 Worker
3. 测试API功能
4. 部署修复后的前端代码
5. 验证完整功能

## 📞 支持

如果遇到问题，请检查：
- Cloudflare 账户权限
- API 密钥有效性
- Worker 部署状态
- 网络连接性</contents>
</xai:function_call">Write contents to API_FIX_README.md
