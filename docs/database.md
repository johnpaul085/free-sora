# 数据库设计文档

## 数据库支持

- **轻量级数据库**: SQLite（开发/小型部署）
- **生产数据库**: MySQL 8.0+（生产环境）

## 数据库表结构

### 1. 用户表 (users)

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE COMMENT '邮箱',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  nickname VARCHAR(50) COMMENT '昵称',
  user_type ENUM('normal', 'vip', 'svip') DEFAULT 'normal' COMMENT '用户类型',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
  referrer_id BIGINT COMMENT '推荐人ID（分销关系）',
  referral_code VARCHAR(20) UNIQUE COMMENT '推荐码',
  computing_power INT DEFAULT 0 COMMENT '算力值',
  total_computing_power INT DEFAULT 0 COMMENT '累计算力',
  hd_count INT DEFAULT 0 COMMENT '高清次数',
  gifted_computing_power INT DEFAULT 0 COMMENT '赠送算力',
  status ENUM('active', 'banned', 'deleted') DEFAULT 'active' COMMENT '状态',
  last_login_at DATETIME COMMENT '最后登录时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_referral_code (referral_code),
  INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**SQLite版本**:
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  nickname TEXT,
  user_type TEXT DEFAULT 'normal' CHECK(user_type IN ('normal', 'vip', 'svip')),
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  referrer_id INTEGER,
  referral_code TEXT UNIQUE,
  computing_power INTEGER DEFAULT 0,
  total_computing_power INTEGER DEFAULT 0,
  hd_count INTEGER DEFAULT 0,
  gifted_computing_power INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned', 'deleted')),
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referrer_id ON users(referrer_id);
CREATE INDEX idx_referral_code ON users(referral_code);
CREATE INDEX idx_user_type ON users(user_type);
CREATE INDEX idx_role ON users(role);
```

### 2. 作品表 (works)

```sql
CREATE TABLE works (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  title VARCHAR(200) COMMENT '作品标题',
  description TEXT COMMENT '作品描述',
  work_type ENUM('image', 'video') NOT NULL COMMENT '作品类型',
  content_type ENUM('text2img', 'img2img', 'text2video', 'img2video') NOT NULL COMMENT '生成类型',
  model_name VARCHAR(50) COMMENT '使用的模型（SORA/VEO等）',
  prompt TEXT COMMENT '提示词',
  negative_prompt TEXT COMMENT '负面提示词',
  source_image_url VARCHAR(500) COMMENT '源图片URL（图生图/图生视频）',
  result_url VARCHAR(500) NOT NULL COMMENT '生成结果URL',
  thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
  file_size BIGINT COMMENT '文件大小（字节）',
  duration INT COMMENT '视频时长（秒）',
  width INT COMMENT '宽度',
  height INT COMMENT '高度',
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing' COMMENT '状态',
  error_message TEXT COMMENT '错误信息',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开（广场展示）',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  share_count INT DEFAULT 0 COMMENT '分享次数',
  computing_power_used INT DEFAULT 0 COMMENT '消耗的算力',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_work_type (work_type),
  INDEX idx_status (status),
  INDEX idx_is_public (is_public),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品表';
```

### 3. 生成任务表 (generation_tasks)

```sql
CREATE TABLE generation_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  work_id BIGINT COMMENT '关联作品ID',
  task_type ENUM('text2img', 'img2img', 'text2video', 'img2video') NOT NULL COMMENT '任务类型',
  model_provider VARCHAR(50) COMMENT '模型服务商',
  model_name VARCHAR(50) COMMENT '模型名称',
  prompt TEXT NOT NULL COMMENT '提示词',
  negative_prompt TEXT COMMENT '负面提示词',
  source_image_url VARCHAR(500) COMMENT '源图片URL',
  parameters JSON COMMENT '生成参数（JSON格式）',
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
  progress INT DEFAULT 0 COMMENT '进度（0-100）',
  result_url VARCHAR(500) COMMENT '结果URL',
  error_message TEXT COMMENT '错误信息',
  api_response TEXT COMMENT 'API原始响应',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生成任务表';
```

### 4. AI配置表 (ai_configs)

```sql
CREATE TABLE ai_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  provider_name VARCHAR(50) NOT NULL COMMENT '服务商名称',
  provider_type ENUM('image', 'video', 'assistant') NOT NULL COMMENT '服务商类型',
  api_key VARCHAR(500) COMMENT 'API密钥（加密存储）',
  api_url VARCHAR(500) COMMENT 'API地址',
  models JSON COMMENT '支持的模型列表（JSON格式）',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  priority INT DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
  rate_limit INT COMMENT '速率限制（每分钟请求数）',
  config JSON COMMENT '其他配置（JSON格式）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_type (provider_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI服务商配置表';
```

### 5. 分销佣金表 (commissions)

```sql
CREATE TABLE commissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '获得佣金的用户ID',
  order_id BIGINT COMMENT '关联订单ID',
  commission_type ENUM('direct', 'indirect') NOT NULL COMMENT '佣金类型（直接/间接）',
  source_user_id BIGINT NOT NULL COMMENT '产生佣金的用户ID',
  level INT NOT NULL COMMENT '层级（1=一级，2=二级）',
  amount DECIMAL(10, 2) NOT NULL COMMENT '佣金金额',
  status ENUM('pending', 'available', 'withdrawn', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  withdrawable_at DATETIME COMMENT '可提现时间',
  withdrawn_at DATETIME COMMENT '提现时间',
  description VARCHAR(500) COMMENT '佣金描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_source_user_id (source_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销佣金表';
```

### 6. 分销订单表 (distribution_orders)

```sql
CREATE TABLE distribution_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '下单用户ID',
  order_type ENUM('recharge', 'vip', 'svip', 'computing_power') NOT NULL COMMENT '订单类型',
  order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单号',
  amount DECIMAL(10, 2) NOT NULL COMMENT '订单金额',
  product_name VARCHAR(200) COMMENT '产品名称',
  product_id BIGINT COMMENT '产品ID',
  quantity INT DEFAULT 1 COMMENT '数量',
  status ENUM('pending', 'paid', 'completed', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '订单状态',
  payment_method VARCHAR(50) COMMENT '支付方式',
  payment_time DATETIME COMMENT '支付时间',
  referrer_id BIGINT COMMENT '推荐人ID',
  commission_calculated BOOLEAN DEFAULT FALSE COMMENT '佣金是否已计算',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销订单表';
```

### 7. 提现记录表 (withdrawals)

```sql
CREATE TABLE withdrawals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  amount DECIMAL(10, 2) NOT NULL COMMENT '提现金额',
  withdrawal_method ENUM('alipay', 'wechat', 'bank') NOT NULL COMMENT '提现方式',
  account_info VARCHAR(500) COMMENT '账户信息（加密存储）',
  status ENUM('pending', 'processing', 'completed', 'rejected', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  reject_reason TEXT COMMENT '拒绝原因',
  processed_at DATETIME COMMENT '处理时间',
  transaction_no VARCHAR(100) COMMENT '交易单号',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';
```

### 8. 团队关系表 (team_relations)

```sql
CREATE TABLE team_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  referrer_id BIGINT NOT NULL COMMENT '推荐人ID',
  user_id BIGINT NOT NULL UNIQUE COMMENT '被推荐人ID',
  level INT NOT NULL COMMENT '层级（1=一级，2=二级）',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_referrer_id (referrer_id),
  INDEX idx_user_id (user_id),
  INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队关系表';
```

### 9. 算力记录表 (computing_power_logs)

```sql
CREATE TABLE computing_power_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  change_type ENUM('earn', 'consume', 'gift', 'recharge', 'withdraw') NOT NULL COMMENT '变更类型',
  change_amount INT NOT NULL COMMENT '变更数量（正数=增加，负数=减少）',
  balance_after INT NOT NULL COMMENT '变更后余额',
  related_id BIGINT COMMENT '关联ID（作品ID/订单ID等）',
  related_type VARCHAR(50) COMMENT '关联类型',
  description VARCHAR(500) COMMENT '描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_change_type (change_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='算力记录表';
```

### 10. AI对话记录表 (chat_messages)

```sql
CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  session_id VARCHAR(100) COMMENT '会话ID',
  role ENUM('user', 'assistant') NOT NULL COMMENT '角色',
  content TEXT NOT NULL COMMENT '消息内容',
  model_name VARCHAR(50) COMMENT '使用的模型',
  tokens_used INT COMMENT '使用的token数',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话记录表';
```

### 11. 管理员操作日志表 (admin_logs)

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

**SQLite版本**:
```sql
CREATE TABLE admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  action_content TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_action_type ON admin_logs(action_type);
CREATE INDEX idx_created_at ON admin_logs(created_at);
```

### 12. 系统配置表 (system_configs)

```sql
CREATE TABLE system_configs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  config_value TEXT COMMENT '配置值（JSON格式）',
  config_type VARCHAR(50) COMMENT '配置类型',
  description VARCHAR(500) COMMENT '描述',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';
```

## 分销功能字段说明

### 用户表分销相关字段
- `referrer_id`: 推荐人ID，建立分销关系
- `referral_code`: 用户专属推荐码，用于推广
- `computing_power`: 当前可用算力
- `total_computing_power`: 累计获得算力
- `hd_count`: 高清次数
- `gifted_computing_power`: 赠送算力

### 分销佣金计算规则
1. **一级佣金**: 直接推荐用户产生的订单，按配置比例计算
2. **二级佣金**: 间接推荐用户（推荐人的推荐人）产生的订单，按配置比例计算
3. **佣金状态流转**: pending → available → withdrawn

### 团队统计
通过 `team_relations` 表可以快速统计：
- 一级团队人数
- 二级团队人数
- 团队总人数

## 数据库初始化脚本

### MySQL初始化
```sql
-- 执行所有CREATE TABLE语句
-- 插入默认配置数据
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('commission_rate_level1', '0.10', 'distribution', '一级佣金比例（10%）'),
('commission_rate_level2', '0.05', 'distribution', '二级佣金比例（5%）'),
('min_withdrawal_amount', '10.00', 'distribution', '最低提现金额'),
('withdrawal_fee_rate', '0.01', 'distribution', '提现手续费率（1%）');
```

### SQLite初始化
```sql
-- 执行所有CREATE TABLE语句（SQLite版本）
-- 插入默认配置数据
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('commission_rate_level1', '0.10', 'distribution', '一级佣金比例（10%）'),
('commission_rate_level2', '0.05', 'distribution', '二级佣金比例（5%）'),
('min_withdrawal_amount', '10.00', 'distribution', '最低提现金额'),
('withdrawal_fee_rate', '0.01', 'distribution', '提现手续费率（1%）');
```

## 索引优化建议

1. **用户表**: referrer_id, referral_code, user_type, role
2. **作品表**: user_id, work_type, status, is_public, created_at
3. **佣金表**: user_id, source_user_id, status
4. **订单表**: user_id, referrer_id, order_no, status
5. **团队关系表**: referrer_id, user_id, level

## 数据迁移

### MySQL到SQLite
- 使用工具导出MySQL数据
- 转换数据类型（BIGINT → INTEGER, ENUM → TEXT + CHECK）
- 导入SQLite

### SQLite到MySQL
- 导出SQLite数据
- 转换数据类型
- 导入MySQL
