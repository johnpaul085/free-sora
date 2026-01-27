# 实现方案文档

## 一、项目概述

AI内容生成平台，支持文生图、图生图、文生视频、图生视频，具备完整的分销系统、用户管理、作品管理等功能。

## 二、技术架构

### 2.1 前端架构
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **UI组件**: 自定义组件库

### 2.2 后端架构
- **运行时**: Node.js 18+
- **框架**: Express.js / Fastify
- **数据库**: 
  - 开发/轻量级: SQLite
  - 生产: MySQL 8.0+
- **缓存**: Redis (可选)
- **文件存储**: 
  - 本地存储（开发）
  - 云存储（生产）：AWS S3 / 阿里云OSS / 腾讯云COS

### 2.3 AI服务集成
- **图片生成**: Stability AI, DALL-E, Midjourney API
- **视频生成**: SORA, VEO, Runway ML
- **AI助手**: OpenAI GPT, Claude API
- **配置化**: 支持多服务商切换

## 三、功能模块实现

### 3.1 用户系统

#### 3.1.1 用户注册/登录
- **注册方式**: 手机号/邮箱注册
- **登录方式**: 手机号/邮箱 + 密码
- **推荐码**: 注册时可选填推荐码，建立分销关系
- **JWT认证**: Token + Refresh Token

#### 3.1.2 用户信息管理
- 个人信息编辑
- 头像上传
- 密码修改
- 推荐码查看

#### 3.1.3 算力系统
- 算力充值（购买）
- 算力消耗（生成作品）
- 算力赠送（活动/推广）
- 算力记录查询

### 3.2 内容生成功能

#### 3.2.1 文生图 (Text-to-Image)
**功能流程**:
1. 用户输入提示词
2. 选择模型（Stability AI / DALL-E等）
3. 设置参数（尺寸、风格等）
4. 扣除算力
5. 提交生成任务
6. 轮询任务状态
7. 生成完成后保存作品

**API接口**:
```
POST /api/v1/generate/text-to-image
{
  "prompt": "string",
  "negative_prompt": "string",
  "width": 1024,
  "height": 1024,
  "model": "stable-diffusion-xl",
  "num_images": 1
}
```

#### 3.2.2 图生图 (Image-to-Image)
**功能流程**:
1. 用户上传参考图片
2. 输入提示词
3. 设置相似度参数
4. 扣除算力
5. 提交生成任务
6. 轮询任务状态
7. 生成完成后保存作品

#### 3.2.3 文生视频 (Text-to-Video)
**功能流程**:
1. 用户输入提示词
2. 选择模型（SORA / VEO）
3. 设置参数（时长、分辨率等）
4. 扣除算力（视频消耗更多）
5. 提交生成任务
6. 轮询任务状态（视频生成时间较长）
7. 生成完成后保存作品

**API接口**:
```
POST /api/v1/generate/text-to-video
{
  "prompt": "string",
  "model": "sora" | "veo",
  "duration": 5,
  "resolution": "1080p"
}
```

#### 3.2.4 图生视频 (Image-to-Video)
**功能流程**:
1. 用户上传参考图片
2. 输入提示词
3. 选择模型（SORA / VEO）
4. 设置参数
5. 扣除算力
6. 提交生成任务
7. 轮询任务状态
8. 生成完成后保存作品

### 3.3 作品管理

#### 3.3.1 作品列表
- 按类型筛选（常规视频、短剧作品、生图作品）
- 按状态筛选（全部、生成中、已完成、失败）
- 分页加载
- 作品卡片展示

#### 3.3.2 作品操作
- 查看详情
- 下载作品
- 删除作品
- 分享到广场
- 设置公开/私有

#### 3.3.3 作品详情
- 作品预览
- 生成参数展示
- 生成时间
- 消耗算力
- 操作按钮

### 3.4 广场功能

#### 3.4.1 作品展示
- 公开作品列表
- 2列网格布局
- 视频播放
- 播放量统计
- 点赞功能（可选）

#### 3.4.2 筛选排序
- 按类型筛选
- 按时间排序
- 按热度排序

### 3.5 AI助手

#### 3.5.1 对话功能
- 多轮对话
- 上下文记忆
- 流式响应
- 对话历史保存

#### 3.5.2 功能支持
- 创作建议
- 使用教程
- 常见问题解答
- 提示词优化建议

**API接口**:
```
POST /api/v1/assistant/chat
{
  "message": "string",
  "session_id": "string"
}
```

### 3.6 分销系统

#### 3.6.1 分销关系
- 用户注册时填写推荐码，建立一级关系
- 一级用户推荐的新用户，建立二级关系
- 关系链最多2级

#### 3.6.2 佣金计算
- **一级佣金**: 直接推荐用户订单金额 × 一级佣金比例（默认10%）
- **二级佣金**: 间接推荐用户订单金额 × 二级佣金比例（默认5%）
- **佣金类型**: 
  - 充值订单佣金
  - 会员购买佣金
  - 算力购买佣金

#### 3.6.3 佣金管理
- 可提现佣金查询
- 累计佣金统计
- 佣金明细列表
- 提现申请
- 提现记录

#### 3.6.4 团队管理
- 我的团队统计
  - 团队总数
  - 一级团队人数
  - 二级团队人数
- 团队列表查看
- 团队成员详情

#### 3.6.5 分销订单
- 分销订单列表
- 订单金额统计
- 订单详情

### 3.7 会员系统

#### 3.7.1 会员等级
- 普通用户
- VIP会员
- SVIP会员

#### 3.7.2 会员权益
- 算力赠送
- 高清次数
- 生成速度优先
- 专属客服

#### 3.7.3 会员购买
- 会员套餐选择
- 支付流程
- 自动续费（可选）

## 四、API接口设计

### 4.1 认证接口
```
POST /api/v1/auth/register - 用户注册
POST /api/v1/auth/login - 用户登录
POST /api/v1/auth/refresh - 刷新Token
POST /api/v1/auth/logout - 用户登出
```

### 4.2 用户接口
```
GET /api/v1/user/profile - 获取用户信息
PUT /api/v1/user/profile - 更新用户信息
GET /api/v1/user/computing-power - 获取算力信息
GET /api/v1/user/computing-power-logs - 算力记录
```

### 4.3 生成接口
```
POST /api/v1/generate/text-to-image - 文生图
POST /api/v1/generate/img-to-image - 图生图
POST /api/v1/generate/text-to-video - 文生视频
POST /api/v1/generate/img-to-video - 图生视频
GET /api/v1/generate/task/:id - 查询任务状态
```

### 4.4 作品接口
```
GET /api/v1/works - 作品列表
GET /api/v1/works/:id - 作品详情
DELETE /api/v1/works/:id - 删除作品
PUT /api/v1/works/:id - 更新作品
POST /api/v1/works/:id/share - 分享到广场
```

### 4.5 广场接口
```
GET /api/v1/square/works - 广场作品列表
GET /api/v1/square/works/:id - 作品详情
POST /api/v1/square/works/:id/like - 点赞
```

### 4.6 AI助手接口
```
POST /api/v1/assistant/chat - 发送消息
GET /api/v1/assistant/history - 对话历史
DELETE /api/v1/assistant/session/:id - 删除会话
```

### 4.7 分销接口
```
GET /api/v1/distribution/overview - 分销概览
GET /api/v1/distribution/commissions - 佣金列表
GET /api/v1/distribution/commissions/:id - 佣金详情
GET /api/v1/distribution/team - 我的团队
GET /api/v1/distribution/team/:level - 团队列表（level=1/2）
GET /api/v1/distribution/orders - 分销订单
POST /api/v1/distribution/withdraw - 申请提现
GET /api/v1/distribution/withdrawals - 提现记录
GET /api/v1/distribution/rules - 分佣规则
```

## 五、数据库设计

详见 `database.md` 文档。

## 六、部署方案

### 6.1 一键部署脚本

#### Docker Compose部署（推荐）
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api/v1
    depends_on:
      - backend
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/ai_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis
  
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpass
      - MYSQL_DATABASE=ai_platform
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
volumes:
  mysql_data:
```

#### 轻量级部署（SQLite）
```bash
# 使用SQLite，无需MySQL
# 适合小型部署、开发环境
npm run deploy:lite
```

### 6.2 环境变量配置

#### 前端环境变量 (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

#### 后端环境变量 (.env)
```env
# 数据库配置
DATABASE_TYPE=mysql  # 或 sqlite
DATABASE_URL=mysql://user:password@localhost:3306/ai_platform
# SQLite: DATABASE_URL=./data/database.sqlite

# Redis配置（可选）
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# 文件存储
STORAGE_TYPE=local  # 或 s3, oss, cos
STORAGE_PATH=./uploads
# 云存储配置
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# AI服务配置
OPENAI_API_KEY=
STABILITY_API_KEY=
# ... 其他服务商配置

# 分销配置
COMMISSION_RATE_LEVEL1=0.10
COMMISSION_RATE_LEVEL2=0.05
MIN_WITHDRAWAL_AMOUNT=10.00
```

### 6.3 部署步骤

#### 方式一：Docker Compose（推荐）
```bash
# 1. 克隆项目
git clone <repository>
cd ai

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 一键启动
docker-compose up -d

# 4. 初始化数据库
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

#### 方式二：传统部署
```bash
# 1. 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 2. 构建前端
cd frontend && npm run build

# 3. 配置数据库
# MySQL: 创建数据库并导入SQL
# SQLite: 自动创建

# 4. 启动服务
# 前端
cd frontend && npm start

# 后端
cd backend && npm start
```

## 七、分销功能详细设计

### 7.1 分销关系建立
1. 用户注册时填写推荐码
2. 系统验证推荐码有效性
3. 建立一级分销关系（referrer_id）
4. 如果推荐人也有推荐人，建立二级关系

### 7.2 佣金计算时机
- 用户完成订单支付后
- 订单状态变为"已完成"
- 自动计算并分配佣金

### 7.3 佣金分配流程
```
1. 订单完成 → 触发佣金计算
2. 查找订单用户的推荐人（一级）
3. 计算一级佣金 → 创建佣金记录（status=pending）
4. 查找一级推荐人的推荐人（二级）
5. 计算二级佣金 → 创建佣金记录（status=pending）
6. 佣金进入待结算状态
7. 达到可提现时间后，status=available
8. 用户申请提现 → status=withdrawn
```

### 7.4 分销页面设计

#### 7.4.1 分销中心首页
- 可提现佣金
- 累计提现
- 累计佣金
- 我的团队统计
- 分销订单统计
- 立即邀请好友按钮

#### 7.4.2 佣金明细页
- 佣金列表（时间、来源、金额、状态）
- 筛选（全部、待结算、可提现、已提现）
- 分页加载

#### 7.4.3 我的团队页
- 团队总数
- 一级团队列表
- 二级团队列表
- 团队成员详情

#### 7.4.4 分销订单页
- 订单列表
- 订单金额统计
- 订单详情

#### 7.4.5 分佣规则页
- 佣金比例说明
- 提现规则
- 常见问题

## 八、开发计划

### Phase 1: 基础框架（Week 1-2）
- [x] 前端项目搭建
- [x] 基础页面框架
- [x] 底部导航
- [ ] 后端项目搭建
- [ ] 数据库设计
- [ ] 用户认证系统

### Phase 2: 核心功能（Week 3-5）
- [ ] 文生图功能
- [ ] 图生图功能
- [ ] 作品管理
- [ ] 文件上传/存储

### Phase 3: 视频功能（Week 6-8）
- [ ] 文生视频（SORA/VEO）
- [ ] 图生视频（SORA/VEO）
- [ ] 视频播放/下载

### Phase 4: 分销系统（Week 9-10）
- [ ] 分销关系建立
- [ ] 佣金计算
- [ ] 分销页面开发
- [ ] 提现功能

### Phase 5: 社区功能（Week 11-12）
- [ ] 广场功能完善
- [ ] AI助手功能
- [ ] 会员系统

### Phase 6: 优化部署（Week 13-14）
- [ ] 性能优化
- [ ] 一键部署脚本
- [ ] 文档完善
- [ ] 测试

## 九、安全考虑

1. **数据加密**: 敏感数据（密码、API密钥）加密存储
2. **SQL注入防护**: 使用参数化查询
3. **XSS防护**: 输入输出转义
4. **CSRF防护**: Token验证
5. **API限流**: 防止滥用
6. **文件上传安全**: 类型验证、大小限制

## 十、性能优化

1. **数据库优化**: 索引、查询优化
2. **缓存策略**: Redis缓存热点数据
3. **CDN加速**: 静态资源、媒体文件
4. **代码分割**: 前端按需加载
5. **图片优化**: WebP格式、懒加载
6. **视频优化**: 多码率、渐进式加载
