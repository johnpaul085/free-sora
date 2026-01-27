# 后端 Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 生产环境镜像
FROM node:20-alpine

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# 创建必要的目录
RUN mkdir -p uploads/images uploads/videos data

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]
