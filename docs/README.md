# AI内容生成平台 - 完整文档

## 文档索引

### 1. [界面开发总结](./ui-summary.md)
总结已完成的界面开发内容，包括所有页面的设计特点和功能。

### 2. [数据库设计](./database.md)
完整的数据库表结构设计，支持SQLite和MySQL两种数据库。

### 3. [实现方案](./implementation.md)
详细的功能实现方案，包括API设计、业务流程、技术架构。

### 4. [部署文档](./deployment.md)
一键部署方案，支持Docker Compose和传统部署方式。

### 5. [API文档](./api.md)
完整的API接口文档。

### 6. [设计规范](./design.md)
UI/UX设计规范和组件库。

### 7. [开发规范](./development.md)
代码规范和开发流程。

### 8. [页面完成总结](./pages-summary.md)
页面开发完成情况和链接配置。

### 9. [通用组件文档](./components.md)
Toast、Loading、Modal等通用组件的使用说明。

### 10. [API客户端文档](./api-client.md)
API客户端封装、状态管理和使用方法。

### 11. [Hooks和工具函数文档](./hooks-utils.md)
自定义Hooks、工具函数和API模块使用说明。

## 快速开始

### 开发环境
```bash
# 前端
cd frontend
npm install
npm run dev

# 后端
cd backend
npm install
npm run dev
```

### 生产部署
```bash
# Docker Compose部署
docker-compose up -d

# 轻量级部署（SQLite）
./deploy-lite.sh
```

## 核心功能

1. **内容生成**: 文生图、图生图、文生视频、图生视频
2. **作品管理**: 作品列表、详情、下载、分享
3. **分销系统**: 多级分销、佣金计算、团队管理、提现
4. **用户系统**: 注册登录、算力管理、会员系统
5. **AI助手**: 智能对话、创作建议

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Node.js 18, Express.js/Fastify
- **数据库**: SQLite (轻量级) / MySQL (生产)
- **缓存**: Redis (可选)

## 项目结构

```
ai/
├── frontend/          # 前端项目
├── backend/           # 后端项目
├── shared/            # 共享代码
├── docs/              # 文档目录
└── README.md
```
