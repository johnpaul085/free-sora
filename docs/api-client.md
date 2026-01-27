# API客户端使用文档

## 一、API客户端配置

### 1. 基础配置

**位置**: `src/lib/api/client.ts`

**功能**: 封装Axios，提供统一的请求/响应处理

**特性**:
- 自动添加Authorization token
- 统一错误处理
- 自动Toast提示
- 401自动跳转登录

### 2. 环境变量

在 `.env.local` 中配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## 二、使用方法

### 1. 基础API调用

```typescript
import { api } from '@/lib/api/client'

// GET请求
const users = await api.get('/users')

// POST请求
const newUser = await api.post('/users', {
  username: 'test',
  email: 'test@example.com',
})

// PUT请求
const updatedUser = await api.put('/users/1', {
  username: 'updated',
})

// DELETE请求
await api.delete('/users/1')
```

### 2. 认证API

**位置**: `src/lib/api/auth.ts`

```typescript
import { authApi } from '@/lib/api/auth'

// 注册
await authApi.register({
  username: 'test',
  email: 'test@example.com',
  password: '123456',
  referralCode: 'REF123',
})

// 登录（自动保存到store）
await authApi.login({
  emailOrPhone: 'test@example.com',
  password: '123456',
  rememberMe: true,
})

// 登出
await authApi.logout()

// 获取当前用户
const user = await authApi.getCurrentUser()
```

## 三、状态管理

### 1. 认证状态 (authStore)

**位置**: `src/store/authStore.ts`

```typescript
import { useAuthStore } from '@/store/authStore'

// 在组件中使用
const { user, token, isAuthenticated, login, logout } = useAuthStore()

// 检查登录状态
if (isAuthenticated) {
  console.log('已登录:', user)
}
```

**特性**:
- 自动持久化到localStorage
- 自动同步token到localStorage
- 提供login/logout方法

### 2. 应用状态 (appStore)

**位置**: `src/store/appStore.ts`

```typescript
import { useAppStore } from '@/store/appStore'

// 控制全局加载状态
const { loading, loadingText, setLoading } = useAppStore()

// 显示加载
setLoading(true, '加载中...')

// 隐藏加载
setLoading(false)
```

## 四、错误处理

API客户端会自动处理以下错误：

1. **401未授权**: 自动清除token并跳转到登录页
2. **403无权限**: 显示Toast提示
3. **404资源不存在**: 显示Toast提示
4. **500服务器错误**: 显示Toast提示
5. **网络错误**: 显示网络错误提示

## 五、请求拦截器

自动在请求头中添加：

```typescript
Authorization: Bearer <token>
```

Token从localStorage或authStore中获取。

## 六、响应拦截器

自动处理：

1. 检查响应code（0或200为成功）
2. 提取data字段
3. 错误时自动Toast提示

## 七、类型定义

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}
```

### User

```typescript
interface User {
  id: number
  username: string
  email: string
  phone?: string
  avatar?: string
  role: 'user' | 'admin'
  computingPower: number
  isVip: boolean
  vipExpiresAt?: string
}
```

## 八、最佳实践

### 1. 在组件中使用

```typescript
'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'
import { useAppStore } from '@/store/appStore'

export default function MyComponent() {
  const [data, setData] = useState(null)
  const { setLoading } = useAppStore()

  const fetchData = async () => {
    try {
      setLoading(true, '加载中...')
      const result = await api.get('/data')
      setData(result)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return <div>...</div>
}
```

### 2. 错误处理

```typescript
try {
  await api.post('/endpoint', data)
  if ((window as any).showToast) {
    ;(window as any).showToast({ message: '操作成功', type: 'success' })
  }
} catch (error) {
  // 错误已由拦截器处理，这里可以做额外处理
  console.error('操作失败:', error)
}
```

### 3. 使用Loading组件

```typescript
import Loading from '@/components/UI/Loading'
import { useAppStore } from '@/store/appStore'

const { loading, loadingText } = useAppStore()

return (
  <div>
    {loading && <Loading fullScreen text={loadingText} />}
    {/* 其他内容 */}
  </div>
)
```
