# Hooks和工具函数文档

## 一、自定义Hooks

### 1. useDebounce - 防抖Hook

**位置**: `src/hooks/useDebounce.ts`

**功能**: 对值进行防抖处理，常用于搜索输入

**使用方法**:
```typescript
import { useDebounce } from '@/hooks/useDebounce'
import { useState } from 'react'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 500)

useEffect(() => {
  // 当debouncedSearchTerm变化时执行搜索
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm)
  }
}, [debouncedSearchTerm])
```

### 2. useLocalStorage - LocalStorage Hook

**位置**: `src/hooks/useLocalStorage.ts`

**功能**: 管理localStorage的Hook，自动同步

**使用方法**:
```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage'

const [theme, setTheme] = useLocalStorage('theme', 'dark')

// 使用
setTheme('light')
```

### 3. useCopyToClipboard - 复制到剪贴板Hook

**位置**: `src/hooks/useCopyToClipboard.ts`

**功能**: 复制文本到剪贴板，返回复制状态

**使用方法**:
```typescript
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

const [copied, copyToClipboard] = useCopyToClipboard()

const handleCopy = async () => {
  try {
    await copyToClipboard('要复制的文本')
    if ((window as any).showToast) {
      ;(window as any).showToast({ message: '复制成功', type: 'success' })
    }
  } catch (error) {
    if ((window as any).showToast) {
      ;(window as any).showToast({ message: '复制失败', type: 'error' })
    }
  }
}
```

## 二、工具函数

### 1. 格式化函数 (`src/utils/format.ts`)

#### formatNumber - 格式化数字
```typescript
formatNumber(1234.56) // "1,234.56"
```

#### formatCurrency - 格式化金额
```typescript
formatCurrency(1234.56) // "¥1234.56"
formatCurrency(1234.56, '$') // "$1234.56"
```

#### formatDate - 格式化日期
```typescript
formatDate(new Date(), 'YYYY-MM-DD') // "2024-01-26"
formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss') // "2024-01-26 14:30:00"
```

#### formatRelativeTime - 相对时间
```typescript
formatRelativeTime(new Date(Date.now() - 3600000)) // "1小时前"
formatRelativeTime(new Date(Date.now() - 86400000)) // "1天前"
```

#### formatFileSize - 文件大小
```typescript
formatFileSize(1024) // "1.00 KB"
formatFileSize(1048576) // "1.00 MB"
```

#### formatDuration - 时长格式化
```typescript
formatDuration(3661) // "1:01:01"
formatDuration(125) // "2:05"
```

#### truncateText - 截断文本
```typescript
truncateText('这是一段很长的文本', 5) // "这是一段很..."
```

#### maskPhone - 手机号脱敏
```typescript
maskPhone('13812345678') // "138****5678"
```

#### maskEmail - 邮箱脱敏
```typescript
maskEmail('test@example.com') // "te***@example.com"
```

### 2. 验证函数 (`src/utils/validation.ts`)

详见 [通用组件文档](./components.md#表单验证)

## 三、API模块

### 1. 认证API (`src/lib/api/auth.ts`)
- register - 注册
- login - 登录
- logout - 登出
- sendResetCode - 发送重置密码验证码
- resetPassword - 重置密码
- getCurrentUser - 获取当前用户

### 2. 作品API (`src/lib/api/works.ts`)
- getWorks - 获取作品列表
- getWork - 获取作品详情
- deleteWork - 删除作品
- updateWork - 更新作品
- downloadWork - 下载作品
- shareWork - 分享作品

### 3. 生成API (`src/lib/api/generation.ts`)
- textToImage - 文生图
- imageToImage - 图生图
- textToVideo - 文生视频
- imageToVideo - 图生视频
- getTaskStatus - 获取任务状态
- cancelTask - 取消任务

### 4. 分销API (`src/lib/api/distribution.ts`)
- getDistributionData - 获取分销中心数据
- getCommissions - 获取佣金明细
- getTeam - 获取我的团队
- getOrders - 获取分销订单
- applyWithdraw - 申请提现
- getWithdrawals - 获取提现记录
- getReferralCode - 获取推荐码

### 5. 用户API (`src/lib/api/user.ts`)
- getUserInfo - 获取用户信息
- updateUserInfo - 更新用户信息
- changePassword - 修改密码
- uploadAvatar - 上传头像
- getComputingPowerLogs - 获取算力记录
- redeemCode - 卡密兑换

### 6. AI助手API (`src/lib/api/assistant.ts`)
- sendMessage - 发送消息
- getConversations - 获取对话列表
- getMessages - 获取对话消息
- deleteConversation - 删除对话
- clearConversations - 清空对话历史

### 7. 角色API (`src/lib/api/characters.ts`)
- getCharacters - 获取角色列表
- getCharacter - 获取角色详情
- createCharacter - 创建角色
- updateCharacter - 更新角色
- deleteCharacter - 删除角色

## 四、组件

### AuthGuard - 路由保护组件

**位置**: `src/components/Auth/AuthGuard.tsx`

**功能**: 保护需要登录或管理员权限的路由

**使用方法**:
```tsx
import AuthGuard from '@/components/Auth/AuthGuard'

// 需要登录
<AuthGuard requireAuth>
  <ProtectedPage />
</AuthGuard>

// 需要管理员权限
<AuthGuard requireAuth requireAdmin>
  <AdminPage />
</AuthGuard>

// 自定义重定向
<AuthGuard requireAuth redirectTo="/custom-login">
  <ProtectedPage />
</AuthGuard>
```

## 五、环境变量

### .env.example

创建 `.env.local` 文件并配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=AI内容生成平台
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
```

## 六、最佳实践

### 1. 使用防抖优化搜索
```typescript
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 500)

useEffect(() => {
  if (debouncedSearchTerm) {
    searchApi.search(debouncedSearchTerm)
  }
}, [debouncedSearchTerm])
```

### 2. 使用格式化函数
```typescript
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format'

<div>{formatCurrency(amount)}</div>
<div>{formatDate(createdAt)}</div>
<div>{formatRelativeTime(updatedAt)}</div>
```

### 3. 路由保护
```tsx
// 在需要保护的页面中使用
export default function ProtectedPage() {
  return (
    <AuthGuard requireAuth>
      <div>受保护的内容</div>
    </AuthGuard>
  )
}
```
