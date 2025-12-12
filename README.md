# Pawdia AI - 前后端分离项目

## 项目结构

本项目采用前后端分离架构：

### 前端 (Frontend)
- **位置**: `frontend-separation/` 目录
- **技术栈**: React + TypeScript + Vite + Tailwind CSS
- **部署**: Cloudflare Pages (静态网站)
- **构建输出**: `dist/` 目录

### 后端 (Backend) 
- **位置**: `api/` 目录
- **技术栈**: Node.js + Express + Cloudflare D1
- **部署**: Cloudflare Workers 或独立服务器
- **API端点**: 需配置环境变量

## 部署指南

### 前端部署 (Cloudflare Pages)
1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 连接到 GitHub 仓库的 `main` 分支
3. 构建命令: `cd frontend-separation && npm install && npm run build`
4. 输出目录: `frontend-separation/dist`
5. 根目录: `frontend-separation`

### 后端部署
后端代码位于 `api/` 目录，可部署到：
- Cloudflare Workers
- 独立服务器
- 其他 Node.js 托管服务

## 重要说明

⚠️ **Cloudflare 部署注意事项**:
- 确保项目被识别为 Pages 项目而非 Workers 项目
- 不要创建 `functions/` 目录
- 前端代码必须完全分离到独立目录
- 使用 `static.json` 明确指定静态网站配置

## 开发

### 前端开发
```bash
cd frontend-separation
npm install
npm run dev
```

### 后端开发
```bash
cd api
npm install
npm run dev
```

## 配置文件

- `static.json`: Cloudflare Pages 静态网站配置
- `_redirects`: SPA 路由重定向规则
- `_headers`: HTTP 头配置