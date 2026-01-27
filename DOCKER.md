# Docker 部署指南

## 快速开始

### 1. 准备环境变量

复制环境变量示例文件：
```bash
cp .env.docker.example .env
```

编辑 `.env` 文件，修改必要的配置（特别是 `JWT_SECRET`）。

### 2. 构建并启动服务

```bash
# 构建并启动所有服务（使用SQLite）
docker-compose up -d

# 如果需要使用MySQL，启动MySQL服务
docker-compose --profile mysql up -d
```

### 3. 访问服务

- 前端：http://localhost:3000
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/health

## 常用命令

### 启动服务
```bash
docker-compose up -d
```

### 停止服务
```bash
docker-compose down
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 重启服务
```bash
docker-compose restart
```

### 重新构建
```bash
# 重新构建并启动
docker-compose up -d --build

# 只构建不启动
docker-compose build
```

### 进入容器
```bash
# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh
```

## 数据持久化

### SQLite数据库
数据存储在Docker volume `backend-data` 中，即使删除容器数据也会保留。

### 上传文件
上传的图片和视频存储在Docker volume `backend-uploads` 中。

### MySQL数据库
如果使用MySQL，数据存储在Docker volume `mysql-data` 中。

## 环境变量说明

### 后端环境变量
- `PORT`: 后端服务端口（默认3001）
- `DB_TYPE`: 数据库类型（sqlite 或 mysql）
- `SQLITE_PATH`: SQLite数据库文件路径
- `JWT_SECRET`: JWT密钥（生产环境必须修改）
- `CORS_ORIGIN`: 允许的CORS来源

### 前端环境变量
- `NEXT_PUBLIC_API_BASE_URL`: 后端API地址
- `NEXT_PUBLIC_APP_NAME`: 应用名称

## 使用MySQL

1. 修改 `.env` 文件：
```env
DB_TYPE=mysql
MYSQL_HOST=mysql
MYSQL_USER=ai_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=ai_platform
MYSQL_ROOT_PASSWORD=root_password
```

2. 启动MySQL服务：
```bash
docker-compose --profile mysql up -d
```

3. 等待MySQL启动后，重启后端服务：
```bash
docker-compose restart backend
```

## 生产环境建议

1. **修改JWT_SECRET**：使用强随机字符串
2. **修改数据库密码**：使用强密码
3. **配置HTTPS**：使用Nginx反向代理
4. **限制资源**：在docker-compose.yml中添加资源限制
5. **定期备份**：备份Docker volumes中的数据

## 故障排查

### 后端无法启动
1. 检查端口是否被占用
2. 查看日志：`docker-compose logs backend`
3. 检查环境变量配置

### 前端无法连接后端
1. 检查 `NEXT_PUBLIC_API_BASE_URL` 配置
2. 确认后端服务已启动：`docker-compose ps`
3. 检查网络连接：`docker-compose exec frontend ping backend`

### 数据库连接失败
1. 检查数据库服务是否启动
2. 验证环境变量中的数据库配置
3. 查看数据库日志：`docker-compose logs mysql`

## 备份和恢复

### 备份数据
```bash
# 备份SQLite数据库
docker-compose exec backend cp /app/data/database.sqlite /app/data/database.sqlite.backup

# 备份上传文件
docker run --rm -v ai_backend-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data
```

### 恢复数据
```bash
# 恢复上传文件
docker run --rm -v ai_backend-uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /
```
