# 部署文档

## 一、部署方式

### 1.1 Docker Compose部署（推荐）

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

#### 部署步骤

1. **克隆项目**
```bash
git clone <repository>
cd ai
```

2. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# 前端
cd frontend
cp .env.example .env.local
# 编辑 .env.local

# 后端
cd ../backend
cp .env.example .env
# 编辑 .env
```

3. **启动服务**
```bash
# 在项目根目录
docker-compose up -d
```

4. **初始化数据库**
```bash
# MySQL版本
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed

# SQLite版本（自动创建）
docker-compose exec backend npm run db:init:lite
```

5. **访问应用**
- 前端: http://localhost:3000
- 后端API: http://localhost:3001

### 1.2 轻量级部署（SQLite）

适合小型部署、开发环境、个人使用。

#### 前置要求
- Node.js 18+
- npm/pnpm

#### 部署步骤

1. **安装依赖**
```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
npm install
```

2. **配置环境变量**
```bash
# 后端 .env
DATABASE_TYPE=sqlite
DATABASE_URL=./data/database.sqlite
# 其他配置...
```

3. **初始化数据库**
```bash
cd backend
npm run db:init:lite
```

4. **构建前端**
```bash
cd frontend
npm run build
```

5. **启动服务**
```bash
# 启动后端（开发模式）
cd backend
npm run dev

# 启动前端（生产模式）
cd frontend
npm start
```

### 1.3 传统部署（MySQL）

适合生产环境、企业部署。

#### 前置要求
- Node.js 18+
- MySQL 8.0+
- Redis（可选）

#### 部署步骤

1. **准备数据库**
```sql
CREATE DATABASE ai_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **配置环境变量**
```bash
# 后端 .env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://user:password@localhost:3306/ai_platform
REDIS_URL=redis://localhost:6379
# 其他配置...
```

3. **初始化数据库**
```bash
cd backend
npm run db:migrate
npm run db:seed
```

4. **构建和启动**
```bash
# 构建前端
cd frontend
npm run build

# 启动服务（使用PM2）
pm2 start ecosystem.config.js
```

## 二、一键部署脚本

### 2.1 Docker Compose一键部署

创建 `deploy.sh`:
```bash
#!/bin/bash

echo "开始部署AI内容生成平台..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "错误: 未安装Docker"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未安装Docker Compose"
    exit 1
fi

# 创建环境变量文件
if [ ! -f .env ]; then
    cp .env.example .env
    echo "请编辑 .env 文件配置环境变量"
    exit 1
fi

# 启动服务
docker-compose up -d

# 等待服务启动
sleep 10

# 初始化数据库
docker-compose exec -T backend npm run db:migrate
docker-compose exec -T backend npm run db:seed

echo "部署完成！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
```

### 2.2 轻量级一键部署

创建 `deploy-lite.sh`:
```bash
#!/bin/bash

echo "开始轻量级部署（SQLite）..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装Node.js"
    exit 1
fi

# 安装依赖
echo "安装前端依赖..."
cd frontend
npm install

echo "安装后端依赖..."
cd ../backend
npm install

# 初始化数据库
echo "初始化数据库..."
npm run db:init:lite

# 构建前端
echo "构建前端..."
cd ../frontend
npm run build

# 启动服务
echo "启动服务..."
cd ../backend
npm run start:prod &

cd ../frontend
npm start &

echo "部署完成！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
```

### 2.3 Windows一键部署

创建 `deploy.bat`:
```batch
@echo off
echo 开始部署AI内容生成平台...

REM 检查Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 错误: 未安装Node.js
    exit /b 1
)

REM 安装依赖
echo 安装前端依赖...
cd frontend
call npm install

echo 安装后端依赖...
cd ..\backend
call npm install

REM 初始化数据库
echo 初始化数据库...
call npm run db:init:lite

REM 构建前端
echo 构建前端...
cd ..\frontend
call npm run build

echo 部署完成！
echo 请分别启动前端和后端服务
pause
```

## 三、环境变量配置

### 3.1 前端环境变量 (.env.local)

```env
# API地址
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# CDN地址
NEXT_PUBLIC_CDN_URL=https://cdn.example.com

# 其他配置
NEXT_PUBLIC_APP_NAME=AI内容生成平台
```

### 3.2 后端环境变量 (.env)

```env
# 服务配置
NODE_ENV=production
PORT=3001

# 数据库配置
DATABASE_TYPE=mysql  # 或 sqlite
DATABASE_URL=mysql://user:password@localhost:3306/ai_platform
# SQLite: DATABASE_URL=./data/database.sqlite

# Redis配置（可选）
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# 文件存储
STORAGE_TYPE=local  # 或 s3, oss, cos
STORAGE_PATH=./uploads
MAX_FILE_SIZE=104857600  # 100MB

# 云存储配置（如果使用）
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# AI服务配置
OPENAI_API_KEY=
STABILITY_API_KEY=
# ... 其他服务商配置

# 分销配置
COMMISSION_RATE_LEVEL1=0.10
COMMISSION_RATE_LEVEL2=0.05
MIN_WITHDRAWAL_AMOUNT=10.00
WITHDRAWAL_FEE_RATE=0.01

# 算力配置
COMPUTING_POWER_TEXT2IMG=10
COMPUTING_POWER_IMG2IMG=15
COMPUTING_POWER_TEXT2VIDEO=50
COMPUTING_POWER_IMG2VIDEO=60
```

## 四、Docker Compose配置

创建 `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:${MYSQL_ROOT_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
      - REDIS_URL=redis://redis:6379
    env_file:
      - ./backend/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    volumes:
      - ./backend/uploads:/app/uploads

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpass}
      - MYSQL_DATABASE=${MYSQL_DATABASE:-ai_platform}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```

## 五、轻量级部署配置

### 5.1 SQLite数据库配置

后端自动检测 `DATABASE_TYPE=sqlite`，使用SQLite数据库。

**优点**:
- 无需安装MySQL
- 单文件数据库，易于备份
- 适合小型部署

**缺点**:
- 并发性能较低
- 不适合大规模部署

### 5.2 轻量级部署结构

```
ai/
├── frontend/
│   ├── .next/          # 构建输出
│   └── public/
├── backend/
│   ├── data/
│   │   └── database.sqlite  # SQLite数据库
│   └── uploads/        # 上传文件
└── .env                # 环境变量
```

## 六、生产环境优化

### 6.1 使用PM2管理进程

创建 `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'ai-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ai-backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

启动:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6.2 Nginx反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.3 SSL证书配置

使用Let's Encrypt:
```bash
certbot --nginx -d yourdomain.com
```

## 七、备份和恢复

### 7.1 数据库备份

#### MySQL备份
```bash
# 备份
mysqldump -u user -p ai_platform > backup.sql

# 恢复
mysql -u user -p ai_platform < backup.sql
```

#### SQLite备份
```bash
# 备份
cp data/database.sqlite backup/database_$(date +%Y%m%d).sqlite

# 恢复
cp backup/database_20250126.sqlite data/database.sqlite
```

### 7.2 文件备份

```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

## 八、监控和日志

### 8.1 日志配置

- 前端日志: Next.js 自动记录
- 后端日志: 使用 winston 或 pino
- 错误日志: 记录到文件或日志服务

### 8.2 健康检查

```bash
# 前端健康检查
curl http://localhost:3000/api/health

# 后端健康检查
curl http://localhost:3001/api/health
```

## 九、常见问题

### 9.1 数据库连接失败
- 检查数据库服务是否启动
- 检查连接字符串是否正确
- 检查防火墙设置

### 9.2 文件上传失败
- 检查存储路径权限
- 检查文件大小限制
- 检查磁盘空间

### 9.3 性能问题
- 启用Redis缓存
- 优化数据库查询
- 使用CDN加速静态资源
