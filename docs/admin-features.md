# 管理员功能设计文档

## 一、管理员权限设计

### 1.1 用户角色
在用户表中添加 `role` 字段：
- `user`: 普通用户（默认）
- `admin`: 管理员

### 1.2 权限控制
- 前端：根据用户角色显示/隐藏管理员功能入口
- 后端：API接口进行权限验证，只有管理员可以访问管理接口

## 二、管理员功能模块

### 2.1 用户管理 (`/admin/users`)

#### 功能列表
- **用户列表**
  - 搜索用户（用户名、邮箱、手机号）
  - 筛选（用户类型、状态、注册时间）
  - 分页显示
  - 排序（注册时间、最后登录时间）

- **用户详情**
  - 基本信息（用户名、邮箱、手机号、昵称）
  - 用户类型（普通/VIP/SVIP）
  - 算力信息（当前算力、累计算力、高清次数、赠送算力）
  - 分销信息（推荐人、推荐码、团队统计）
  - 注册时间、最后登录时间

- **编辑用户**
  - 修改用户信息（昵称、邮箱、手机号）
  - 修改用户类型（普通/VIP/SVIP）
  - 修改用户状态（正常/禁用/删除）
  - 修改算力（增加/减少算力、高清次数）
  - 重置密码

- **批量操作**
  - 批量禁用/启用用户
  - 批量删除用户
  - 批量赠送算力

#### 数据字段
- 用户ID、用户名、邮箱、手机号
- 用户类型、状态
- 算力相关数据
- 分销相关数据
- 注册时间、最后登录时间

### 2.2 API接口设置 (`/admin/api-config`)

#### 功能列表
- **AI服务商列表**
  - 显示所有配置的AI服务商
  - 服务商状态（启用/禁用）
  - 优先级设置
  - 支持的模型列表

- **添加/编辑服务商**
  - 服务商名称
  - 服务商类型（图片生成/视频生成/AI助手）
  - API密钥（加密存储）
  - API地址
  - 支持的模型（JSON格式）
  - 速率限制
  - 优先级
  - 启用/禁用状态

- **模型管理**
  - 查看每个服务商支持的模型
  - 模型参数配置
  - 模型价格/算力消耗设置

- **测试连接**
  - 测试API密钥有效性
  - 测试API连接状态
  - 测试模型可用性

#### 配置项
- 图片生成服务商：Stability AI, DALL-E, Midjourney等
- 视频生成服务商：SORA, VEO, Runway ML等
- AI助手服务商：OpenAI GPT, Claude等

### 2.3 系统配置 (`/admin/system-config`)

#### 功能列表
- **分销配置**
  - 一级佣金比例（默认10%）
  - 二级佣金比例（默认5%）
  - 最低提现金额
  - 提现手续费率
  - 佣金结算周期

- **算力配置**
  - 文生图消耗算力
  - 图生图消耗算力
  - 文生视频消耗算力
  - 图生视频消耗算力
  - 算力充值价格（每单位算力价格）

- **会员配置**
  - VIP会员价格
  - SVIP会员价格
  - VIP会员权益（赠送算力、高清次数）
  - SVIP会员权益（赠送算力、高清次数）
  - 会员有效期

- **系统参数**
  - 文件上传大小限制
  - 视频保留时长
  - 作品公开默认设置
  - 邮件通知开关
  - 短信通知开关

- **支付配置**
  - 支付方式（支付宝、微信、银行卡）
  - 支付接口配置
  - 支付回调地址

### 2.4 订单管理 (`/admin/orders`)

#### 功能列表
- **订单列表**
  - 搜索订单（订单号、用户ID、用户名）
  - 筛选（订单类型、订单状态、支付方式、时间范围）
  - 分页显示
  - 排序（创建时间、支付时间、订单金额）

- **订单详情**
  - 订单基本信息（订单号、订单类型、订单金额）
  - 用户信息（用户ID、用户名）
  - 产品信息（产品名称、数量）
  - 支付信息（支付方式、支付时间、交易单号）
  - 分销信息（推荐人、佣金状态）

- **订单操作**
  - 查看订单详情
  - 手动完成订单
  - 取消订单
  - 退款处理
  - 导出订单数据

- **订单统计**
  - 今日订单数、订单金额
  - 本月订单数、订单金额
  - 订单类型分布
  - 支付方式分布

### 2.5 佣金管理 (`/admin/commissions`)

#### 功能列表
- **佣金列表**
  - 搜索佣金（用户ID、用户名、订单号）
  - 筛选（佣金类型、佣金状态、时间范围）
  - 分页显示
  - 排序（创建时间、佣金金额）

- **佣金详情**
  - 佣金基本信息（佣金金额、佣金类型、层级）
  - 用户信息（获得佣金的用户）
  - 来源信息（产生佣金的用户、订单）
  - 佣金状态（待结算/可提现/已提现）

- **佣金操作**
  - 查看佣金详情
  - 手动结算佣金
  - 取消佣金
  - 导出佣金数据

- **提现管理**
  - 提现申请列表
  - 审核提现申请
  - 处理提现（通过/拒绝）
  - 提现记录查询

### 2.6 数据统计 (`/admin/statistics`)

#### 功能列表
- **用户统计**
  - 总用户数、今日新增、本月新增
  - 用户类型分布（普通/VIP/SVIP）
  - 用户活跃度（日活、月活）
  - 用户增长趋势图

- **订单统计**
  - 总订单数、今日订单、本月订单
  - 订单金额统计（总收入、今日收入、本月收入）
  - 订单类型分布
  - 订单趋势图

- **佣金统计**
  - 总佣金、已提现佣金、待提现佣金
  - 佣金分布（一级/二级）
  - 佣金趋势图

- **作品统计**
  - 总作品数、今日生成、本月生成
  - 作品类型分布（图片/视频）
  - 生成类型分布（文生图/图生图/文生视频/图生视频）
  - 作品趋势图

- **算力统计**
  - 总消耗算力、今日消耗、本月消耗
  - 算力充值统计
  - 算力消耗趋势图

### 2.7 内容审核 (`/admin/content-review`)

#### 功能列表
- **待审核作品**
  - 用户举报的作品列表
  - 系统自动检测的违规内容
  - 审核状态（待审核/已通过/已拒绝）

- **审核操作**
  - 查看作品详情
  - 审核通过
  - 审核拒绝（填写拒绝原因）
  - 删除违规作品
  - 封禁用户（可选）

- **审核规则**
  - 违规内容关键词设置
  - 自动审核开关
  - 审核人员设置

### 2.8 操作日志 (`/admin/logs`)

#### 功能列表
- **日志列表**
  - 搜索日志（操作人、操作类型、操作对象）
  - 筛选（日志类型、时间范围）
  - 分页显示
  - 排序（操作时间）

- **日志类型**
  - 用户操作日志（注册、登录、修改信息）
  - 管理员操作日志（编辑用户、修改配置）
  - 系统日志（错误、警告）
  - API调用日志

- **日志详情**
  - 操作人信息
  - 操作类型
  - 操作对象
  - 操作内容
  - 操作时间
  - IP地址

- **日志导出**
  - 导出日志数据
  - 日志备份

## 三、数据库字段补充

### 3.1 用户表添加角色字段
```sql
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色';
```

### 3.2 操作日志表
```sql
CREATE TABLE admin_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  admin_id BIGINT NOT NULL COMMENT '操作管理员ID',
  action_type VARCHAR(50) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) COMMENT '操作对象类型',
  target_id BIGINT COMMENT '操作对象ID',
  action_content TEXT COMMENT '操作内容',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';
```

## 四、API接口设计

### 4.1 用户管理接口
```
GET /api/v1/admin/users - 获取用户列表
GET /api/v1/admin/users/:id - 获取用户详情
PUT /api/v1/admin/users/:id - 更新用户信息
DELETE /api/v1/admin/users/:id - 删除用户
POST /api/v1/admin/users/:id/reset-password - 重置密码
POST /api/v1/admin/users/batch - 批量操作
```

### 4.2 API配置接口
```
GET /api/v1/admin/api-configs - 获取API配置列表
GET /api/v1/admin/api-configs/:id - 获取API配置详情
POST /api/v1/admin/api-configs - 创建API配置
PUT /api/v1/admin/api-configs/:id - 更新API配置
DELETE /api/v1/admin/api-configs/:id - 删除API配置
POST /api/v1/admin/api-configs/:id/test - 测试API连接
```

### 4.3 系统配置接口
```
GET /api/v1/admin/system-configs - 获取系统配置
PUT /api/v1/admin/system-configs - 更新系统配置
GET /api/v1/admin/system-configs/:key - 获取指定配置
PUT /api/v1/admin/system-configs/:key - 更新指定配置
```

### 4.4 订单管理接口
```
GET /api/v1/admin/orders - 获取订单列表
GET /api/v1/admin/orders/:id - 获取订单详情
PUT /api/v1/admin/orders/:id - 更新订单状态
POST /api/v1/admin/orders/:id/refund - 退款处理
GET /api/v1/admin/orders/statistics - 订单统计
```

### 4.5 佣金管理接口
```
GET /api/v1/admin/commissions - 获取佣金列表
GET /api/v1/admin/commissions/:id - 获取佣金详情
PUT /api/v1/admin/commissions/:id - 更新佣金状态
GET /api/v1/admin/withdrawals - 获取提现列表
PUT /api/v1/admin/withdrawals/:id - 处理提现
```

### 4.6 数据统计接口
```
GET /api/v1/admin/statistics/overview - 数据概览
GET /api/v1/admin/statistics/users - 用户统计
GET /api/v1/admin/statistics/orders - 订单统计
GET /api/v1/admin/statistics/commissions - 佣金统计
GET /api/v1/admin/statistics/works - 作品统计
GET /api/v1/admin/statistics/computing-power - 算力统计
```

### 4.7 内容审核接口
```
GET /api/v1/admin/reviews - 获取待审核列表
GET /api/v1/admin/reviews/:id - 获取审核详情
POST /api/v1/admin/reviews/:id/approve - 审核通过
POST /api/v1/admin/reviews/:id/reject - 审核拒绝
```

### 4.8 操作日志接口
```
GET /api/v1/admin/logs - 获取日志列表
GET /api/v1/admin/logs/:id - 获取日志详情
GET /api/v1/admin/logs/export - 导出日志
```

## 五、前端页面结构

### 5.1 管理员页面路由
```
/admin
  /users              # 用户管理
  /api-config         # API接口设置
  /system-config      # 系统配置
  /orders             # 订单管理
  /commissions        # 佣金管理
  /statistics         # 数据统计
  /content-review     # 内容审核
  /logs               # 操作日志
```

### 5.2 权限控制
- 在"我的"页面根据用户角色显示管理员功能入口
- 使用中间件或路由守卫验证管理员权限
- API请求时携带管理员Token

## 六、安全考虑

1. **权限验证**: 所有管理接口必须验证管理员权限
2. **操作日志**: 记录所有管理员操作，便于审计
3. **敏感操作**: 重要操作（删除用户、修改配置）需要二次确认
4. **API密钥加密**: API密钥加密存储，不直接显示
5. **IP限制**: 可选的IP白名单功能

## 七、开发优先级

### Phase 1: 核心管理功能
1. 用户管理（用户列表、编辑用户）
2. API接口设置（服务商配置）
3. 系统配置（基础配置）

### Phase 2: 业务管理功能
4. 订单管理
5. 佣金管理
6. 数据统计

### Phase 3: 辅助功能
7. 内容审核
8. 操作日志
