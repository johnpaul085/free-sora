# 后端API接口文档

## 基础信息

- **Base URL**: `http://localhost:3001/api/v1`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: 
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## 认证接口

### 用户注册
- **POST** `/api/v1/auth/register`
- **请求体**:
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "phone": "13800138000",
  "referral_code": "ABC12345" // 可选
}
```

### 用户登录
- **POST** `/api/v1/auth/login`
- **请求体**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```
- **响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "computing_power": 100,
      "referral_code": "XYZ12345"
    }
  }
}
```

### 获取当前用户信息
- **GET** `/api/v1/auth/me`
- **Headers**: `Authorization: Bearer {token}`

## 用户接口

### 获取用户信息
- **GET** `/api/v1/users/profile`
- **Headers**: `Authorization: Bearer {token}`

### 更新用户信息
- **PUT** `/api/v1/users/profile`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "nickname": "新昵称",
  "email": "newemail@example.com",
  "phone": "13900139000"
}
```

### 修改密码
- **POST** `/api/v1/users/change-password`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### 上传头像
- **POST** `/api/v1/users/upload-avatar`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "avatar_url": "https://example.com/avatar.jpg"
}
```

## 作品接口

### 获取作品列表
- **GET** `/api/v1/works?page=1&pageSize=20&status=completed&work_type=image`
- **Headers**: `Authorization: Bearer {token}`

### 获取作品详情
- **GET** `/api/v1/works/:id`
- **Headers**: `Authorization: Bearer {token}`

### 删除作品
- **DELETE** `/api/v1/works/:id`
- **Headers**: `Authorization: Bearer {token}`

### 更新作品
- **PUT** `/api/v1/works/:id`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "is_public": true,
  "title": "新标题"
}
```

## 角色接口

### 获取角色列表
- **GET** `/api/v1/characters?type=sora`
- **Headers**: `Authorization: Bearer {token}`

### 获取角色详情
- **GET** `/api/v1/characters/:id`
- **Headers**: `Authorization: Bearer {token}`

### 创建角色
- **POST** `/api/v1/characters`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "name": "角色名称",
  "avatar_url": "https://example.com/avatar.jpg",
  "type": "sora"
}
```

### 更新角色
- **PUT** `/api/v1/characters/:id`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "name": "新名称",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### 删除角色
- **DELETE** `/api/v1/characters/:id`
- **Headers**: `Authorization: Bearer {token}`

## 生成接口

### 文生图
- **POST** `/api/v1/generate/text-to-image`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "task_type": "text2img",
  "model_provider": "stability",
  "model_name": "stable-diffusion-xl",
  "prompt": "a beautiful landscape",
  "negative_prompt": "blurry, low quality",
  "parameters": {
    "width": 1024,
    "height": 1024
  }
}
```

### 图生图
- **POST** `/api/v1/generate/image-to-image`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "task_type": "img2img",
  "model_provider": "stability",
  "model_name": "stable-diffusion-xl",
  "prompt": "transform this image",
  "source_image_url": "https://example.com/image.jpg",
  "parameters": {
    "strength": 0.7
  }
}
```

### 文生视频
- **POST** `/api/v1/generate/text-to-video`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "task_type": "text2video",
  "model_provider": "openai",
  "model_name": "sora",
  "prompt": "a cat playing with a ball",
  "parameters": {
    "duration": 5,
    "resolution": "1080p"
  }
}
```

### 图生视频
- **POST** `/api/v1/generate/image-to-video`
- **Headers**: `Authorization: Bearer {token}`
- **请求体**:
```json
{
  "task_type": "img2video",
  "model_provider": "openai",
  "model_name": "sora",
  "prompt": "animate this image",
  "source_image_url": "https://example.com/image.jpg",
  "parameters": {
    "duration": 5
  }
}
```

### 获取任务状态
- **GET** `/api/v1/generate/tasks/:id`
- **Headers**: `Authorization: Bearer {token}`

### 取消任务
- **POST** `/api/v1/generate/tasks/:id/cancel`
- **Headers**: `Authorization: Bearer {token}`

## 错误码

- `0`: 成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器错误

## 测试

### 使用curl测试

```bash
# 注册
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 登录
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取用户信息（需要token）
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
