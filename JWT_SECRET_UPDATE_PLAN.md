# JWT_SECRET 更新计划

## 🔍 当前状态检查

### ✅ 已确认
1. **Cloudflare Workers Secrets**: JWT_SECRET 已设置（通过 `wrangler secret list` 确认）
2. **配置文件**: `wrangler.toml` 中已移除 JWT_SECRET（安全）
3. **代码**: 所有代码已更新为从环境变量读取 JWT_SECRET

### ⚠️ 安全风险
- Git 历史中发现了 `pawdia-ai-jwt-secret-2025` 这个值
- 如果这是当前生产环境使用的值，存在安全风险

---

## 🔄 更新步骤

### 步骤 1: 生成新的 JWT_SECRET

已生成新的安全 JWT_SECRET（见下方）

### 步骤 2: 更新 Cloudflare Workers Secret

```bash
cd api
npx wrangler secret put JWT_SECRET
# 输入新生成的 JWT_SECRET
```

### 步骤 3: 验证更新

```bash
# 检查 secret 是否已更新（不会显示值）
npx wrangler secret list

# 测试 Worker 是否正常工作
npx wrangler dev
```

### 步骤 4: 重新部署（如果需要）

```bash
npx wrangler deploy
```

---

## ⚠️ 重要影响

### Token 失效
- **所有现有的 JWT token 将立即失效**
- 用户需要重新登录获取新 token
- 建议提前通知用户

### 建议操作
1. 在低峰期执行更新
2. 通知用户系统维护（可选）
3. 更新后监控错误日志
4. 准备回滚方案（保存旧的 JWT_SECRET）

---

## 📝 新 JWT_SECRET

**⚠️ 请妥善保管，不要泄露！**

新生成的 JWT_SECRET 将在执行更新命令时使用。

---

## 🔄 回滚方案

如果需要回滚到旧的 JWT_SECRET：

```bash
cd api
npx wrangler secret put JWT_SECRET
# 输入旧的 JWT_SECRET 值
```

**注意**: 回滚后，使用新 token 的用户将需要重新登录。

---

*创建时间: 2025-01-27*
