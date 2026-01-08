# Cloudflare Workers 审计和清理指南

## 当前活跃 Workers

基于代码仓库分析，目前有以下 Workers 配置：

### 1. pawdia-ai-api (必需 - 活跃)
- **位置**: `api/wrangler.toml`
- **用途**: 主要的 API Worker，处理所有后端逻辑
- **状态**: ✅ 必需，当前使用中
- **数据库**: 绑定到 D1 数据库 (pawdia-ai-db)

### 2. pawdia-stripper (必需 - 活跃)
- **位置**: `worker-service/wrangler.toml`
- **用途**: 剥离 PayPal SDK 的限制性权限策略头部
- **状态**: ✅ 必需，解决 PayPal 集成问题

## 建议清理的 Workers

根据你的描述，以下 Workers 可能需要清理：

### 🚨 需要清理的 Workers
1. **pawdia-ai-api-service**
   - 可能是 `pawdia-ai-api` 的旧版本或测试版本
   - **建议**: 如果不再使用，删除此 Worker

2. **pawdia-ai-api-production**
   - 可能是生产环境的副本
   - **建议**: 如果 `pawdia-ai-api` 已经是生产版本，删除此重复 Worker

3. **pawdia-stripper-production**
   - 可能是 `pawdia-stripper` 的生产版本副本
   - **建议**: 如果功能相同，保留一个即可

## 清理步骤

### 1. 检查 Worker 使用情况
```bash
# 列出所有 Workers
npx wrangler deployments list

# 检查每个 Worker 的流量和错误
# 在 Cloudflare Dashboard 中查看:
# Workers & Pages → 选择 Worker → Real-time logs
```

### 2. 验证当前活跃 Worker
```bash
# 测试主要 API Worker
curl https://pawdia-ai-api.pawdia-creative.workers.dev/api/health

# 测试权限剥离 Worker (如果配置了路由)
curl -I https://pawdia-ai.com/
```

### 3. 删除未使用的 Workers
```bash
# 删除 Worker (替换为实际 Worker 名称)
npx wrangler delete pawdia-ai-api-service
npx wrangler delete pawdia-ai-api-production
npx wrangler delete pawdia-stripper-production
```

### 4. 更新路由配置
如果删除了某些 Workers，确保路由配置正确：

```javascript
// _routes.json 应该保持：
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

## 保留策略

### 必须保留的 Workers:
- ✅ **pawdia-ai-api**: 核心 API 功能
- ✅ **pawdia-stripper**: PayPal 兼容性修复

### 可选清理:
- 🟡 **测试/开发版本**: 删除所有 *-test, *-dev, *-staging 后缀的 Workers
- 🟡 **旧版本**: 保留最新的生产版本，删除带版本号的旧 Worker
- 🟡 **临时 Worker**: 删除所有临时创建用于调试的 Worker

## 监控建议

清理后，建议设置监控：

1. **设置 Worker 告警**: 在 Cloudflare Dashboard 中配置错误率告警
2. **监控性能**: 设置响应时间和吞吐量监控
3. **日志保留**: 配置适当的日志保留期

## 验证清理结果

清理完成后：

```bash
# 再次列出 Workers
npx wrangler deployments list

# 应该只显示：
# - pawdia-ai-api
# - pawdia-stripper
```

## 节省成本

清理未使用的 Workers 可以：
- 减少 Cloudflare 账单
- 简化部署流程
- 降低配置复杂性
- 提高安全性（减少攻击面）
