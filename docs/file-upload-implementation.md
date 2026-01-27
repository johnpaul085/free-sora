# 文件上传功能实现文档

## 一、后端实现

### 1. 文件上传中间件 (`backend/src/middleware/upload.ts`)

**功能特性**：
- 使用 `multer` 处理文件上传
- 自动创建上传目录（avatars、images、videos）
- 文件类型验证（图片和视频）
- 文件大小限制（默认10MB）
- UUID生成唯一文件名
- 根据文件类型自动分类存储

**支持的文件类型**：
- 图片：JPEG, JPG, PNG, WEBP, GIF
- 视频：MP4, WEBM, QuickTime

**目录结构**：
```
uploads/
├── avatars/    # 头像文件
├── images/     # 图片文件
└── videos/     # 视频文件
```

### 2. 文件上传控制器 (`backend/src/controllers/uploadController.ts`)

**接口列表**：
- `uploadAvatar` - 上传头像
- `uploadImage` - 上传图片
- `uploadVideo` - 上传视频
- `deleteFile` - 删除文件

**返回格式**：
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "http://localhost:3001/uploads/images/uuid.jpg",
    "filename": "uuid.jpg",
    "size": 123456,
    "mimetype": "image/jpeg"
  }
}
```

### 3. 文件上传路由 (`backend/src/routes/uploadRoutes.ts`)

**路由列表**：
- `POST /api/v1/upload/avatar` - 上传头像
- `POST /api/v1/upload/image` - 上传图片
- `POST /api/v1/upload/video` - 上传视频
- `DELETE /api/v1/upload/file` - 删除文件

**认证要求**：所有接口都需要JWT认证

### 4. 静态文件服务

在 `app.ts` 中配置了静态文件服务：
```typescript
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.dir)))
```

访问上传的文件：
```
http://localhost:3001/uploads/images/filename.jpg
```

## 二、前端实现

### 1. 文件上传API (`frontend/src/lib/api/upload.ts`)

**API方法**：
- `uploadAvatar(file: File)` - 上传头像
- `uploadImage(file: File)` - 上传图片
- `uploadVideo(file: File)` - 上传视频
- `deleteFile(filename, type)` - 删除文件

### 2. ImageUploader组件更新

**新增功能**：
- 支持自动上传模式（`autoUpload` 属性）
- 上传状态显示
- 错误处理
- 上传进度提示

**使用示例**：
```tsx
<ImageUploader
  value={avatarUrl}
  onChange={(file, preview) => {
    // 处理文件
  }}
  maxSize={2}
  autoUpload={true} // 自动上传
/>
```

### 3. 页面集成

**已集成的页面**：
- `/settings` - 用户设置（头像上传）
- `/generate/image-to-image` - 图生图（参考图片上传）
- `/generate/image-to-video` - 图生视频（参考图片上传）

## 三、配置说明

### 环境变量

在 `.env` 文件中配置：

```env
# 文件上传配置
UPLOAD_DIR=./uploads          # 上传目录
MAX_FILE_SIZE=10485760        # 最大文件大小（字节，默认10MB）
BASE_URL=http://localhost:3001 # 服务器基础URL（用于生成文件URL）
```

### 文件大小限制

- 默认：10MB (10485760 字节)
- 可在环境变量中配置 `MAX_FILE_SIZE`

## 四、使用示例

### 后端使用

```typescript
import { uploadImage } from '../middleware/upload'
import { uploadImage as uploadImageController } from '../controllers/uploadController'

router.post('/upload', uploadImage, uploadImageController)
```

### 前端使用

```typescript
import { uploadApi } from '@/lib/api/upload'

// 上传图片
const file = event.target.files[0]
const result = await uploadApi.uploadImage(file)
const imageUrl = result.url || result.data?.url
```

## 五、安全考虑

1. **文件类型验证**：只允许指定的图片和视频格式
2. **文件大小限制**：防止上传过大文件
3. **认证要求**：所有上传接口都需要JWT认证
4. **唯一文件名**：使用UUID防止文件名冲突
5. **目录隔离**：不同类型文件存储在不同目录

## 六、待优化功能

1. **云存储支持**：集成AWS S3、阿里云OSS等
2. **图片压缩**：自动压缩大图片
3. **视频转码**：视频格式转换和压缩
4. **CDN集成**：使用CDN加速文件访问
5. **文件清理**：定期清理未使用的文件

## 七、注意事项

1. **生产环境**：需要配置 `BASE_URL` 为实际服务器地址
2. **文件存储**：生产环境建议使用云存储，不要存储在服务器本地
3. **权限控制**：确保上传目录有正确的读写权限
4. **备份策略**：重要文件需要定期备份
