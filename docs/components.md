# 通用组件文档

## 一、UI组件

### 1. Toast 提示组件

**位置**: `src/components/UI/Toast.tsx`

**功能**: 全局Toast提示，支持成功、错误、警告、信息四种类型

**使用方法**:
```typescript
// 在任何客户端组件中
if ((window as any).showToast) {
  (window as any).showToast({
    message: '操作成功',
    type: 'success', // 'success' | 'error' | 'warning' | 'info'
    duration: 3000, // 可选，默认3000ms
  })
}
```

**特性**:
- 自动消失（可配置时长）
- 支持手动关闭
- 多个Toast可同时显示
- 平滑的进入/退出动画
- 响应式设计

### 2. Loading 加载组件

**位置**: `src/components/UI/Loading.tsx`

**功能**: 加载状态指示器

**使用方法**:
```tsx
import Loading from '@/components/UI/Loading'

// 全屏加载
<Loading fullScreen text="加载中..." />

// 局部加载
<Loading size="md" text="处理中..." />
```

**Props**:
- `size`: 'sm' | 'md' | 'lg' (默认: 'md')
- `text`: 可选，加载文字提示
- `fullScreen`: boolean (默认: false)，是否全屏显示

### 3. Modal 模态对话框

**位置**: `src/components/UI/Modal.tsx`

**功能**: 通用模态对话框组件

### 4. ConfirmDialog 确认对话框

**位置**: `src/components/UI/ConfirmDialog.tsx`

**功能**: 基于Modal的确认对话框组件

**使用方法**:
```tsx
import ConfirmDialog from '@/components/UI/ConfirmDialog'
import { useState } from 'react'

const [showConfirm, setShowConfirm] = useState(false)

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={() => {
    // 确认操作
    console.log('确认')
  }}
  message="确定要删除这个项目吗？"
  type="danger" // 'danger' | 'warning' | 'info'
  confirmText="删除"
  cancelText="取消"
/>
```

**Props**:
- `isOpen`: boolean，是否显示
- `onClose`: () => void，关闭回调
- `onConfirm`: () => void，确认回调
- `message`: string，确认消息
- `title`: string，可选，标题
- `confirmText`: string，确认按钮文字（默认: '确认'）
- `cancelText`: string，取消按钮文字（默认: '取消'）
- `type`: 'danger' | 'warning' | 'info' (默认: 'info')

### 5. ImageUploader 图片上传组件

**位置**: `src/components/UI/ImageUploader.tsx`

**功能**: 图片上传组件，支持拖拽上传和预览

**使用方法**:
```tsx
import ImageUploader from '@/components/UI/ImageUploader'
import { useState } from 'react'

const [imageFile, setImageFile] = useState<File | null>(null)
const [imagePreview, setImagePreview] = useState<string | null>(null)

<ImageUploader
  value={imagePreview || undefined}
  onChange={(file, preview) => {
    setImageFile(file)
    setImagePreview(preview)
  }}
  maxSize={5} // MB
  accept={['image/jpeg', 'image/png', 'image/webp']}
/>
```

**Props**:
- `value`: string，可选，预览图片URL
- `onChange`: (file: File | null, preview: string | null) => void，文件变化回调
- `maxSize`: number，最大文件大小（MB，默认: 5）
- `accept`: string[]，接受的文件类型（默认: ['image/jpeg', 'image/png', 'image/webp']）
- `className`: string，可选，自定义样式

**使用方法**:
```tsx
import Modal from '@/components/UI/Modal'
import { useState } from 'react'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="对话框标题"
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
>
  <div>对话框内容</div>
</Modal>
```

**Props**:
- `isOpen`: boolean，是否显示
- `onClose`: () => void，关闭回调
- `title`: string，可选，标题
- `size`: 'sm' | 'md' | 'lg' | 'xl' (默认: 'md')
- `children`: ReactNode，对话框内容

**特性**:
- 点击背景关闭
- 自动处理body滚动锁定
- 响应式尺寸
- 平滑动画

## 二、布局组件

### 1. MainLayout

**位置**: `src/components/Layout/MainLayout.tsx`

**功能**: 主布局容器，提供统一的padding和背景

### 2. BottomNavigation

**位置**: `src/components/Layout/BottomNavigation.tsx`

**功能**: 底部导航栏，5个主要菜单项

## 三、第三方库集成

### 1. qrcode

**用途**: 生成二维码（分享海报页面）

**安装**: `npm install qrcode @types/qrcode`

**使用示例**:
```typescript
import QRCode from 'qrcode'

const url = await QRCode.toDataURL('https://example.com', {
  width: 200,
  margin: 2,
})
```

### 2. recharts

**用途**: 图表展示（数据统计页面）

**安装**: `npm install recharts`

**使用示例**:
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#6366f1" />
  </LineChart>
</ResponsiveContainer>
```

### 3. html2canvas

**用途**: 将DOM元素转换为Canvas/图片（分享海报保存）

**安装**: `npm install html2canvas`

**使用示例**:
```typescript
import html2canvas from 'html2canvas'

const canvas = await html2canvas(element, {
  backgroundColor: null,
  scale: 2,
})

canvas.toBlob((blob) => {
  // 下载图片
})
```

## 四、组件使用最佳实践

### 1. Toast使用
- 操作成功时使用 `type: 'success'`
- 操作失败时使用 `type: 'error'`
- 需要提醒时使用 `type: 'warning'`
- 信息提示时使用 `type: 'info'`

### 2. Loading使用
- 页面级加载使用 `fullScreen={true}`
- 局部加载使用 `fullScreen={false}`
- 提供有意义的 `text` 提示

### 3. Modal使用
- 确认操作使用Modal
- 表单弹窗使用Modal
- 详情展示使用Modal
- 根据内容选择合适的 `size`

## 五、扩展建议

### 1. 可扩展组件
- [x] **ConfirmDialog**: 基于Modal的确认对话框 ✅
- [x] **ImageUploader**: 图片上传组件（带预览） ✅
- [ ] **FormModal**: 基于Modal的表单弹窗
- [ ] **VideoPlayer**: 视频播放器组件

### 2. 状态管理
- [x] 使用Zustand管理认证状态（authStore） ✅
- [x] 使用Zustand管理应用状态（appStore） ✅
- [ ] 考虑使用Zustand管理Toast状态
- [ ] 考虑使用Zustand管理Modal状态

### 3. 类型定义
- [x] 为全局方法添加TypeScript类型定义 ✅
- [x] 创建 `types/global.d.ts` 扩展Window接口 ✅
- [x] 表单验证工具函数 ✅
- [x] API客户端封装 ✅
