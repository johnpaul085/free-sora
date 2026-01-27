# AI内容生成平台 - 后端服务

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: SQLite (开发) / MySQL (生产)
- **认证**: JWT Token

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run db:init
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 项目结构

```
backend/
├── src/
│   ├── index.ts           # 入口文件
│   ├── app.ts             # Express应用配置
│   ├── config/            # 配置文件
│   ├── db/                # 数据库相关
│   ├── models/            # 数据模型
│   ├── routes/            # 路由
│   ├── controllers/       # 控制器
│   ├── middleware/        # 中间件
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── data/                  # SQLite数据库文件
├── uploads/               # 上传文件目录
└── package.json
```

## API接口

所有API接口前缀：`/api/v1`

### 认证接口
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户信息

### 用户接口
- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息
- `POST /api/v1/users/change-password` - 修改密码
- `POST /api/v1/users/upload-avatar` - 上传头像

### 作品接口
- `GET /api/v1/works` - 获取作品列表
- `GET /api/v1/works/:id` - 获取作品详情
- `DELETE /api/v1/works/:id` - 删除作品

### 生成接口
- `POST /api/v1/generate/text-to-image` - 文生图
- `POST /api/v1/generate/image-to-image` - 图生图
- `POST /api/v1/generate/text-to-video` - 文生视频
- `POST /api/v1/generate/image-to-video` - 图生视频
- `GET /api/v1/generate/tasks/:id` - 获取任务状态

## 数据库

支持两种数据库：

1. **SQLite** (开发/轻量级部署)
   - 配置 `DB_TYPE=sqlite`
   - 数据库文件位于 `data/database.sqlite`

2. **MySQL** (生产环境)
   - 配置 `DB_TYPE=mysql`
   - 需要配置MySQL连接信息

## 环境变量说明

- `PORT`: 服务器端口（默认3001）
- `DB_TYPE`: 数据库类型（sqlite/mysql）
- `JWT_SECRET`: JWT密钥（生产环境必须修改）
- `JWT_EXPIRES_IN`: Token过期时间（默认7d）
- `UPLOAD_DIR`: 文件上传目录
- `CORS_ORIGIN`: CORS允许的源
