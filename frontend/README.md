# AI内容生成平台 - 前端项目

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios

## 项目结构

```
frontend/
├── src/
│   ├── app/              # Next.js App Router 页面
│   │   ├── home/         # 首页
│   │   ├── works/        # 作品
│   │   ├── square/       # 广场
│   │   ├── assistant/    # AI助手
│   │   └── profile/       # 我的
│   ├── components/       # 组件
│   │   └── Layout/       # 布局组件
│   └── types/            # 类型定义
├── public/               # 静态资源
└── package.json
```

## 开发命令

```bash
# 安装依赖
npm install
# 或
pnpm install

# 开发模式
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## 功能说明

### 已实现
- ✅ 基础项目结构
- ✅ 5个主要页面框架
- ✅ 底部导航栏
- ✅ 响应式布局
- ✅ 深色主题样式

### 待实现
- ⏳ 文生图/图生图界面
- ⏳ 文生视频/图生视频界面（支持SORA/VEO模型选择）
- ⏳ AI服务商配置界面
- ⏳ 作品管理功能
- ⏳ API集成
- ⏳ 状态管理
