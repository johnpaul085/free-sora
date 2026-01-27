# 开发规范文档

## 代码规范

### TypeScript 规范

#### 命名规范
- **变量/函数**: 驼峰命名 (camelCase)
  ```typescript
  const userName = 'admin';
  function getUserInfo() {}
  ```

- **类/接口/类型**: 帕斯卡命名 (PascalCase)
  ```typescript
  interface UserProfile {}
  class ImageGenerator {}
  type TaskStatus = 'processing' | 'completed' | 'failed';
  ```

- **常量**: 全大写下划线分隔 (UPPER_SNAKE_CASE)
  ```typescript
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const API_BASE_URL = 'https://api.example.com';
  ```

- **组件文件**: 帕斯卡命名
  ```
  ImageGenerator.tsx
  UserProfile.tsx
  ```

#### 类型定义
- 优先使用 `interface` 定义对象类型
- 使用 `type` 定义联合类型、工具类型
- 避免使用 `any`，使用 `unknown` 替代
- 导出类型定义到 `shared/types` 目录

```typescript
// ✅ 好的做法
interface GenerateRequest {
  prompt: string;
  width: number;
  height: number;
}

type TaskStatus = 'processing' | 'completed' | 'failed';

// ❌ 避免
function processData(data: any) {}
```

#### 函数规范
- 函数参数不超过 5 个，超过使用对象参数
- 函数职责单一，避免过长函数（建议 < 50 行）
- 使用 async/await 处理异步，避免回调地狱

```typescript
// ✅ 好的做法
async function generateImage(params: GenerateImageParams): Promise<ImageResult> {
  const response = await api.post('/generate/text-to-image', params);
  return response.data;
}

// ❌ 避免
function generateImage(prompt, width, height, style, seed, numImages, ...) {}
```

### React 组件规范

#### 组件结构
```typescript
// 1. 导入
import React, { useState, useEffect } from 'react';
import { Button } from '@/components';

// 2. 类型定义
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

// 3. 组件定义
export const ComponentName: React.FC<Props> = ({ title, onSubmit }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. 副作用
  useEffect(() => {
    // ...
  }, []);
  
  // 6. 事件处理
  const handleClick = () => {
    // ...
  };
  
  // 7. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

#### Hooks 使用规范
- 自定义 Hook 以 `use` 开头
- 提取复杂逻辑到自定义 Hook
- 避免在循环、条件语句中使用 Hooks

```typescript
// ✅ 自定义 Hook
function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const generate = async (prompt: string) => {
    setLoading(true);
    try {
      const data = await api.generateImage({ prompt });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };
  
  return { generate, loading, result };
}
```

#### 性能优化
- 使用 `React.memo` 优化组件重渲染
- 使用 `useMemo` 和 `useCallback` 优化计算和函数
- 大列表使用虚拟滚动

```typescript
// ✅ 优化示例
const MemoizedComponent = React.memo(Component, (prev, next) => {
  return prev.id === next.id;
});

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

### 文件组织规范

#### 目录结构
```
src/
├── components/          # 公共组件
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Layout/
├── pages/              # 页面组件
│   ├── home/
│   │   ├── index.tsx
│   │   └── components/
├── hooks/              # 自定义 Hooks
├── store/              # 状态管理
├── api/                # API 调用
│   ├── client.ts
│   ├── image.ts
│   └── video.ts
├── utils/              # 工具函数
└── types/              # 类型定义
```

#### 导入顺序
1. React 相关
2. 第三方库
3. 内部组件
4. 工具函数/类型
5. 样式文件

```typescript
import React, { useState } from 'react';
import { Button } from 'antd';
import { ImageGenerator } from '@/components';
import { formatDate } from '@/utils';
import type { User } from '@/types';
import './styles.css';
```

### API 调用规范

#### API Client 封装
```typescript
// api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// 请求拦截器
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 401) {
      // 跳转登录
    }
    return Promise.reject(error);
  }
);

export default client;
```

#### API 函数定义
```typescript
// api/image.ts
import client from './client';
import type { GenerateRequest, GenerateResponse } from '@/types';

export const imageApi = {
  // 文生图
  textToImage: (params: GenerateRequest): Promise<GenerateResponse> => {
    return client.post('/generate/text-to-image', params);
  },
  
  // 图生图
  imageToImage: (formData: FormData): Promise<GenerateResponse> => {
    return client.post('/generate/image-to-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // 查询任务
  getTask: (taskId: string): Promise<TaskStatus> => {
    return client.get(`/generate/task/${taskId}`);
  },
};
```

### 错误处理规范

#### 错误类型定义
```typescript
class ApiError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

#### 统一错误处理
```typescript
// utils/errorHandler.ts
export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 401:
        // 未授权，跳转登录
        break;
      case 429:
        // 限流，显示提示
        break;
      default:
        // 显示错误消息
        showError(error.message);
    }
  } else {
    // 未知错误
    showError('发生未知错误，请稍后重试');
  }
}
```

### 测试规范

#### 单元测试
- 使用 Jest + React Testing Library
- 测试文件命名: `*.test.tsx` 或 `*.spec.tsx`
- 覆盖率目标: > 80%

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Git 提交规范

#### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

#### 示例
```
feat(image): 添加文生图功能

- 集成 Stability AI API
- 添加图片预览组件
- 实现下载功能

Closes #123
```

### 环境变量规范

#### 环境变量文件
```
.env.local          # 本地开发（不提交）
.env.development    # 开发环境
.env.production     # 生产环境
```

#### 命名规范
- 使用 `NEXT_PUBLIC_` 前缀表示客户端可访问
- 使用大写字母和下划线
- 敏感信息不提交到仓库

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.example.com

# 服务端环境变量（不暴露给客户端）
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AI_API_KEY=sk-...
```

### 性能优化规范

#### 图片优化
- 使用 WebP 格式
- 实现懒加载
- 提供多尺寸缩略图

```typescript
// 图片组件
<img
  src={imageUrl}
  loading="lazy"
  alt={alt}
  srcSet={`${imageUrl}?w=400 400w, ${imageUrl}?w=800 800w`}
/>
```

#### 代码分割
- 路由级别代码分割（Next.js 自动）
- 组件级别懒加载

```typescript
// 懒加载组件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

#### 缓存策略
- API 响应缓存（使用 SWR 或 React Query）
- 静态资源缓存（CDN + 浏览器缓存）

```typescript
// 使用 SWR
import useSWR from 'swr';

function useWorks(type: string) {
  const { data, error } = useSWR(
    `/works?type=${type}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { works: data, loading: !error && !data, error };
}
```

## 开发流程

### 1. 创建功能分支
```bash
git checkout -b feat/image-generator
```

### 2. 开发功能
- 编写代码
- 编写测试
- 更新文档

### 3. 提交代码
```bash
git add .
git commit -m "feat(image): 添加文生图功能"
```

### 4. 代码审查
- 创建 Pull Request
- 等待审查
- 根据反馈修改

### 5. 合并到主分支
- 通过审查后合并
- 删除功能分支

## 代码审查清单

- [ ] 代码符合规范
- [ ] 有适当的注释
- [ ] 错误处理完善
- [ ] 有单元测试
- [ ] 类型定义完整
- [ ] 性能考虑（懒加载、缓存等）
- [ ] 移动端适配
- [ ] 无障碍性考虑
