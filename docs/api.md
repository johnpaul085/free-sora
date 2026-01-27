# API接口文档

## 基础信息

### 基础URL
```
开发环境: http://localhost:3000/api/v1
生产环境: https://api.yourdomain.com/api/v1
```

### 认证方式
使用 JWT Token 进行身份认证
```
Authorization: Bearer <token>
```

### 响应格式
所有API响应遵循统一格式：

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1706284800000
}
```

**错误响应**:
```json
{
  "code": 400,
  "message": "错误描述",
  "error": "详细错误信息",
  "timestamp": 1706284800000
}
```

### 状态码说明
- 200: 成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 429: 请求过于频繁
- 500: 服务器错误

## 用户相关接口

### 1. 用户注册
```
POST /auth/register
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "code": 201,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    },
    "token": "string"
  }
}
```

### 2. 用户登录
```
POST /auth/login
```

**请求体**:
```json
{
  "email": "string",
  "password": "string"
}
```

### 3. 获取用户信息
```
GET /user/profile
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": "string",
    "username": "string",
    "avatar": "string",
    "computePower": 50,
    "vipLevel": 0,
    "totalGenerated": 0
  }
}
```

## 图片生成接口

### 1. 文生图
```
POST /generate/text-to-image
```

**请求体**:
```json
{
  "prompt": "string",
  "negativePrompt": "string (可选)",
  "width": 1024,
  "height": 1024,
  "numImages": 1,
  "style": "string (可选)",
  "seed": "number (可选)"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "taskId": "string",
    "status": "processing",
    "estimatedTime": 30
  }
}
```

### 2. 图生图
```
POST /generate/image-to-image
```

**请求体** (multipart/form-data):
```
prompt: string
image: File
strength: number (0-1, 默认0.8)
width: number
height: number
numImages: number
```

**响应**: 同文生图

### 3. 查询生成任务状态
```
GET /generate/task/:taskId
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "taskId": "string",
    "status": "completed",
    "progress": 100,
    "result": {
      "images": [
        {
          "url": "string",
          "thumbnail": "string",
          "width": 1024,
          "height": 1024
        }
      ]
    },
    "error": "string (如果失败)"
  }
}
```

## 视频生成接口

### 1. 文生视频
```
POST /generate/text-to-video
```

**请求体**:
```json
{
  "prompt": "string",
  "model": "sora" | "veo" | "runway",
  "duration": 5,
  "resolution": "720p",
  "fps": 24,
  "style": "string (可选)"
}
```

**模型说明**:
- `sora`: OpenAI SORA模型
- `veo`: Google VEO模型
- `runway`: Runway ML模型（默认）

**响应**:
```json
{
  "code": 200,
  "data": {
    "taskId": "string",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

### 2. 图生视频
```
POST /generate/image-to-video
```

**请求体** (multipart/form-data):
```
prompt: string
image: File
model: string (sora/veo/runway, 默认runway)
duration: number
resolution: string
fps: number
```

### 3. 查询视频生成任务
```
GET /generate/video-task/:taskId
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "taskId": "string",
    "status": "completed",
    "progress": 100,
    "result": {
      "video": {
        "url": "string",
        "thumbnail": "string",
        "duration": 5,
        "resolution": "720p",
        "fileSize": 1024000
      }
    }
  }
}
```

## 作品管理接口

### 1. 获取作品列表
```
GET /works
```

**查询参数**:
- type: string (image/video/all)
- status: string (all/processing/completed/failed)
- page: number (默认1)
- pageSize: number (默认20)

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "type": "image",
        "title": "string",
        "thumbnail": "string",
        "status": "completed",
        "createdAt": "2024-01-26T00:00:00Z",
        "fileUrl": "string"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

### 2. 获取作品详情
```
GET /works/:id
```

### 3. 删除作品
```
DELETE /works/:id
```

### 4. 下载作品
```
GET /works/:id/download
```

返回文件流或下载URL

## 广场接口

### 1. 获取广场内容
```
GET /square/feeds
```

**查询参数**:
- type: string (image/video/all)
- sort: string (hot/latest)
- page: number
- pageSize: number

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "string",
        "type": "video",
        "thumbnail": "string",
        "playCount": 136700,
        "description": "string",
        "author": {
          "id": "string",
          "username": "string",
          "avatar": "string"
        },
        "createdAt": "2024-01-26T00:00:00Z"
      }
    ],
    "total": 1000
  }
}
```

### 2. 点赞作品
```
POST /square/:id/like
```

### 3. 收藏作品
```
POST /square/:id/favorite
```

## AI助手接口

### 1. 发送消息
```
POST /assistant/chat
```

**请求体**:
```json
{
  "message": "string",
  "conversationId": "string (可选，继续对话)"
}
```

**响应** (流式):
使用 Server-Sent Events (SSE) 返回流式响应

```
data: {"type": "token", "content": "你"}
data: {"type": "token", "content": "好"}
data: {"type": "done", "conversationId": "string"}
```

### 2. 获取对话历史
```
GET /assistant/conversations
```

### 3. 获取单次对话
```
GET /assistant/conversations/:id
```

## 文件上传接口

### 上传图片
```
POST /upload/image
```

**请求体** (multipart/form-data):
```
file: File
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "url": "string",
    "thumbnail": "string",
    "width": 1024,
    "height": 1024,
    "fileSize": 1024000
  }
}
```

### 上传视频
```
POST /upload/video
```

## 算力/会员接口

### 1. 获取算力信息
```
GET /user/compute-power
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "total": 50,
    "used": 10,
    "remaining": 40,
    "gifted": 0,
    "hdCount": 0
  }
}
```

### 2. 充值算力
```
POST /user/recharge
```

## 限流说明

### 免费用户
- 图片生成: 10次/天
- 视频生成: 3次/天
- API调用: 100次/小时

### VIP用户
- 图片生成: 100次/天
- 视频生成: 20次/天
- API调用: 1000次/小时

超出限制返回 429 状态码

## AI服务商配置接口

### 1. 获取可用服务商列表
```
GET /config/providers
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "image": [
      {
        "id": "stability",
        "name": "Stability AI",
        "enabled": true,
        "models": ["stable-diffusion-xl", "stable-diffusion-3"]
      },
      {
        "id": "dalle",
        "name": "DALL-E",
        "enabled": true,
        "models": ["dall-e-3"]
      }
    ],
    "video": [
      {
        "id": "sora",
        "name": "SORA (OpenAI)",
        "enabled": true,
        "models": ["sora-1.0"]
      },
      {
        "id": "veo",
        "name": "VEO (Google)",
        "enabled": true,
        "models": ["veo-2"]
      },
      {
        "id": "runway",
        "name": "Runway ML",
        "enabled": true,
        "models": ["gen-4"]
      }
    ],
    "assistant": [
      {
        "id": "openai",
        "name": "OpenAI",
        "enabled": true,
        "models": ["gpt-4", "gpt-3.5-turbo"]
      }
    ]
  }
}
```

### 2. 获取当前配置
```
GET /config/current
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "imageProvider": "stability",
    "imageModel": "stable-diffusion-xl",
    "videoProvider": "sora",
    "videoModel": "sora-1.0",
    "assistantProvider": "openai",
    "assistantModel": "gpt-4"
  }
}
```

### 3. 更新服务商配置
```
PUT /config/providers
```

**请求体**:
```json
{
  "imageProvider": "stability",
  "imageModel": "stable-diffusion-xl",
  "videoProvider": "sora",
  "videoModel": "sora-1.0",
  "assistantProvider": "openai",
  "assistantModel": "gpt-4"
}
```

**权限**: 需要管理员权限

### 4. 添加自定义服务商
```
POST /config/providers/custom
```

**请求体**:
```json
{
  "type": "image" | "video" | "assistant",
  "name": "string",
  "apiUrl": "string",
  "apiKey": "string",
  "config": {}
}
```

## WebSocket 实时更新

### 连接
```
WS /ws?token=<jwt_token>
```

### 消息类型

**任务进度更新**:
```json
{
  "type": "task_progress",
  "taskId": "string",
  "progress": 50,
  "status": "processing"
}
```

**任务完成**:
```json
{
  "type": "task_complete",
  "taskId": "string",
  "result": {}
}
```

**任务失败**:
```json
{
  "type": "task_failed",
  "taskId": "string",
  "error": "string"
}
```
