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

## Cloudflare Pages 部署配置

### Pages 项目设置

在 Cloudflare Dashboard 中创建 Pages 项目时，请确保：

1. **项目类型**：选择 **Pages** 而不是 Workers
2. **框架预设**：选择 **Vite** 或 **Static**
3. **构建命令**：`npm run build`
4. **输出目录**：`frontend-separation/dist`

### 重要配置

- ✅ 这是一个 **纯静态 Pages 项目**
- ✅ 没有 Workers 代码或 functions 目录
- ✅ 前端代码完全分离在 `frontend-separation/` 目录
- ✅ 构建输出到 `frontend-separation/dist`

### 部署步骤

1. 在 Cloudflare Dashboard 中创建新的 Pages 项目
2. 连接到你的 GitHub 仓库
3. 设置构建配置：
   - **构建命令**：`npm run build`
   - **输出目录**：`frontend-separation/dist`
4. 部署项目

### 后端 API 配置

前端通过环境变量配置 API 地址：
- 开发环境：`http://localhost:3001`
- 生产环境：你的后端服务地址

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