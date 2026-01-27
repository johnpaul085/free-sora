import { getDb, run, query } from './connection'
import { config } from '../config'

// SQLite表结构
const sqliteTables = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
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
      membership_expires_at DATETIME,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'banned', 'deleted')),
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  works: `
    CREATE TABLE IF NOT EXISTS works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      work_type TEXT NOT NULL CHECK(work_type IN ('image', 'video')),
      content_type TEXT NOT NULL CHECK(content_type IN ('text2img', 'img2img', 'text2video', 'img2video')),
      model_name TEXT,
      prompt TEXT,
      negative_prompt TEXT,
      source_image_url TEXT,
      result_url TEXT NOT NULL,
      thumbnail_url TEXT,
      file_size INTEGER,
      duration INTEGER,
      width INTEGER,
      height INTEGER,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'completed', 'failed')),
      error_message TEXT,
      is_public INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      computing_power_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  generation_tasks: `
    CREATE TABLE IF NOT EXISTS generation_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      work_id INTEGER,
      task_type TEXT NOT NULL CHECK(task_type IN ('text2img', 'img2img', 'text2video', 'img2video')),
      model_provider TEXT,
      model_name TEXT,
      prompt TEXT NOT NULL,
      negative_prompt TEXT,
      source_image_url TEXT,
      parameters TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      progress INTEGER DEFAULT 0,
      result_url TEXT,
      error_message TEXT,
      api_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (work_id) REFERENCES works(id) ON DELETE SET NULL
    )
  `,
  ai_configs: `
    CREATE TABLE IF NOT EXISTS ai_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_name TEXT NOT NULL,
      provider_type TEXT NOT NULL CHECK(provider_type IN ('image', 'video', 'assistant')),
      api_key TEXT,
      api_url TEXT,
      models TEXT,
      is_active INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      rate_limit INTEGER,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  system_configs: `
    CREATE TABLE IF NOT EXISTS system_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT,
      config_type TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  characters: `
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      avatar_url TEXT,
      type TEXT NOT NULL CHECK(type IN ('sora', 'custom')),
      is_system INTEGER DEFAULT 0,
      sora_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  team_relations: `
    CREATE TABLE IF NOT EXISTS team_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL UNIQUE,
      level INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  commissions: `
    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      commission_type TEXT NOT NULL CHECK(commission_type IN ('direct', 'indirect')),
      source_user_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'available', 'withdrawn', 'cancelled')),
      withdrawable_at DATETIME,
      withdrawn_at DATETIME,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  distribution_orders: `
    CREATE TABLE IF NOT EXISTS distribution_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_type TEXT NOT NULL CHECK(order_type IN ('recharge', 'vip', 'svip', 'computing_power')),
      order_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      product_name TEXT,
      product_id INTEGER,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'completed', 'cancelled', 'refunded')),
      payment_method TEXT,
      payment_time DATETIME,
      referrer_id INTEGER,
      commission_calculated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  withdrawals: `
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      withdrawal_method TEXT NOT NULL CHECK(withdrawal_method IN ('alipay', 'wechat', 'bank')),
      account_info TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
      reject_reason TEXT,
      processed_at DATETIME,
      transaction_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  chat_messages: `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id TEXT,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      model_name TEXT,
      tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  redeem_codes: `
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      code_type TEXT NOT NULL CHECK(code_type IN ('computing_power', 'vip', 'svip')),
      value INTEGER NOT NULL,
      is_used INTEGER DEFAULT 0,
      used_by_user_id INTEGER,
      used_at DATETIME,
      expires_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `,
}

// MySQL表结构
const mysqlTables = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
      email VARCHAR(100) UNIQUE COMMENT '邮箱',
      phone VARCHAR(20) UNIQUE COMMENT '手机号',
      password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
      avatar_url VARCHAR(500) COMMENT '头像URL',
      nickname VARCHAR(50) COMMENT '昵称',
      user_type ENUM('normal', 'vip', 'svip') DEFAULT 'normal' COMMENT '用户类型',
      role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
      referrer_id BIGINT COMMENT '推荐人ID',
      referral_code VARCHAR(20) UNIQUE COMMENT '推荐码',
      computing_power INT DEFAULT 0 COMMENT '算力值',
      total_computing_power INT DEFAULT 0 COMMENT '累计算力',
      hd_count INT DEFAULT 0 COMMENT '高清次数',
      gifted_computing_power INT DEFAULT 0 COMMENT '赠送算力',
      membership_expires_at DATETIME COMMENT '会员到期时间',
      status ENUM('active', 'banned', 'deleted') DEFAULT 'active' COMMENT '状态',
      last_login_at DATETIME COMMENT '最后登录时间',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_referrer_id (referrer_id),
      INDEX idx_referral_code (referral_code),
      INDEX idx_user_type (user_type),
      INDEX idx_role (role),
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
  `,
  works: `
    CREATE TABLE IF NOT EXISTS works (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL COMMENT '用户ID',
      title VARCHAR(200) COMMENT '作品标题',
      description TEXT COMMENT '作品描述',
      work_type ENUM('image', 'video') NOT NULL COMMENT '作品类型',
      content_type ENUM('text2img', 'img2img', 'text2video', 'img2video') NOT NULL COMMENT '生成类型',
      model_name VARCHAR(50) COMMENT '使用的模型',
      prompt TEXT COMMENT '提示词',
      negative_prompt TEXT COMMENT '负面提示词',
      source_image_url VARCHAR(500) COMMENT '源图片URL',
      result_url VARCHAR(500) NOT NULL COMMENT '生成结果URL',
      thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
      file_size BIGINT COMMENT '文件大小',
      duration INT COMMENT '视频时长',
      width INT COMMENT '宽度',
      height INT COMMENT '高度',
      status ENUM('processing', 'completed', 'failed') DEFAULT 'processing' COMMENT '状态',
      error_message TEXT COMMENT '错误信息',
      is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品表'
  `,
  generation_tasks: `
    CREATE TABLE IF NOT EXISTS generation_tasks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL COMMENT '用户ID',
      work_id BIGINT COMMENT '关联作品ID',
      task_type ENUM('text2img', 'img2img', 'text2video', 'img2video') NOT NULL COMMENT '任务类型',
      model_provider VARCHAR(50) COMMENT '模型服务商',
      model_name VARCHAR(50) COMMENT '模型名称',
      prompt TEXT NOT NULL COMMENT '提示词',
      negative_prompt TEXT COMMENT '负面提示词',
      source_image_url VARCHAR(500) COMMENT '源图片URL',
      parameters JSON COMMENT '生成参数',
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '状态',
      progress INT DEFAULT 0 COMMENT '进度',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生成任务表'
  `,
  ai_configs: `
    CREATE TABLE IF NOT EXISTS ai_configs (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI服务商配置表'
  `,
  system_configs: `
    CREATE TABLE IF NOT EXISTS system_configs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
      config_value TEXT COMMENT '配置值',
      config_type VARCHAR(50) COMMENT '配置类型',
      description VARCHAR(500) COMMENT '描述',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表'
  `,
  characters: `
    CREATE TABLE IF NOT EXISTS characters (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT COMMENT '用户ID（NULL表示系统内置角色）',
      name VARCHAR(100) NOT NULL COMMENT '角色名称',
      avatar_url VARCHAR(500) COMMENT '头像URL',
      type ENUM('sora', 'custom') NOT NULL COMMENT '角色类型',
      is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统内置角色',
      sora_id VARCHAR(100) COMMENT 'SORA角色ID（用于@引用）',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_is_system (is_system),
      INDEX idx_sora_id (sora_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表'
  `,
  team_relations: `
    CREATE TABLE IF NOT EXISTS team_relations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      referrer_id BIGINT NOT NULL COMMENT '推荐人ID',
      user_id BIGINT NOT NULL UNIQUE COMMENT '被推荐人ID',
      level INT NOT NULL COMMENT '层级',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_referrer_id (referrer_id),
      INDEX idx_user_id (user_id),
      INDEX idx_level (level)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队关系表'
  `,
  commissions: `
    CREATE TABLE IF NOT EXISTS commissions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL COMMENT '获得佣金的用户ID',
      order_id BIGINT COMMENT '关联订单ID',
      commission_type ENUM('direct', 'indirect') NOT NULL COMMENT '佣金类型',
      source_user_id BIGINT NOT NULL COMMENT '产生佣金的用户ID',
      level INT NOT NULL COMMENT '层级',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销佣金表'
  `,
  distribution_orders: `
    CREATE TABLE IF NOT EXISTS distribution_orders (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分销订单表'
  `,
  withdrawals: `
    CREATE TABLE IF NOT EXISTS withdrawals (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL COMMENT '用户ID',
      amount DECIMAL(10, 2) NOT NULL COMMENT '提现金额',
      withdrawal_method ENUM('alipay', 'wechat', 'bank') NOT NULL COMMENT '提现方式',
      account_info VARCHAR(500) COMMENT '账户信息',
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表'
  `,
  chat_messages: `
    CREATE TABLE IF NOT EXISTS chat_messages (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话记录表'
  `,
  redeem_codes: `
    CREATE TABLE IF NOT EXISTS redeem_codes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(50) UNIQUE NOT NULL COMMENT '卡密',
      code_type ENUM('computing_power', 'vip', 'svip') NOT NULL COMMENT '卡密类型',
      value INT NOT NULL COMMENT '卡密值（算力点数或会员天数）',
      is_used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
      used_by_user_id BIGINT COMMENT '使用用户ID',
      used_at DATETIME COMMENT '使用时间',
      expires_at DATETIME COMMENT '过期时间',
      created_by BIGINT COMMENT '创建者ID',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_code (code),
      INDEX idx_code_type (code_type),
      INDEX idx_is_used (is_used),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卡密表'
  `,
  admin_logs: `
    CREATE TABLE IF NOT EXISTS admin_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      admin_id BIGINT NOT NULL COMMENT '管理员ID',
      action_type VARCHAR(50) NOT NULL COMMENT '操作类型',
      target_type VARCHAR(50) COMMENT '操作对象类型',
      target_id BIGINT COMMENT '操作对象ID',
      action_detail TEXT COMMENT '操作详情',
      ip_address VARCHAR(50) COMMENT 'IP地址',
      user_agent VARCHAR(500) COMMENT '用户代理',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_admin_id (admin_id),
      INDEX idx_action_type (action_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表'
  `,
}

// 创建索引（SQLite）
const sqliteIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_referrer_id ON users(referrer_id)',
  'CREATE INDEX IF NOT EXISTS idx_referral_code ON users(referral_code)',
  'CREATE INDEX IF NOT EXISTS idx_user_type ON users(user_type)',
  'CREATE INDEX IF NOT EXISTS idx_role ON users(role)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_works ON works(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_work_type ON works(work_type)',
  'CREATE INDEX IF NOT EXISTS idx_status_works ON works(status)',
  'CREATE INDEX IF NOT EXISTS idx_is_public ON works(is_public)',
  'CREATE INDEX IF NOT EXISTS idx_created_at_works ON works(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_tasks ON generation_tasks(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_status_tasks ON generation_tasks(status)',
  'CREATE INDEX IF NOT EXISTS idx_created_at_tasks ON generation_tasks(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_provider_type_ai_configs ON ai_configs(provider_type)',
  'CREATE INDEX IF NOT EXISTS idx_is_active_ai_configs ON ai_configs(is_active)',
  'CREATE INDEX IF NOT EXISTS idx_config_key ON system_configs(config_key)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_characters ON characters(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_type_characters ON characters(type)',
  'CREATE INDEX IF NOT EXISTS idx_referrer_id_team ON team_relations(referrer_id)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_team ON team_relations(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_level_team ON team_relations(level)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_commissions ON commissions(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_source_user_id_commissions ON commissions(source_user_id)',
  'CREATE INDEX IF NOT EXISTS idx_status_commissions ON commissions(status)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_orders ON distribution_orders(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_referrer_id_orders ON distribution_orders(referrer_id)',
  'CREATE INDEX IF NOT EXISTS idx_order_no_orders ON distribution_orders(order_no)',
  'CREATE INDEX IF NOT EXISTS idx_status_orders ON distribution_orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_withdrawals ON withdrawals(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_status_withdrawals ON withdrawals(status)',
  'CREATE INDEX IF NOT EXISTS idx_user_id_chat ON chat_messages(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_session_id_chat ON chat_messages(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_created_at_chat ON chat_messages(created_at)',
]

// 初始化默认配置
const defaultConfigs = [
  ['commission_rate_level1', '0.10', 'distribution', '一级佣金比例（10%）'],
  ['commission_rate_level2', '0.05', 'distribution', '二级佣金比例（5%）'],
  ['min_withdrawal_amount', '10.00', 'distribution', '最低提现金额'],
  ['withdrawal_fee_rate', '0.01', 'distribution', '提现手续费率（1%）'],
]

export async function initDatabase() {
  try {
    console.log('开始初始化数据库...')
    
    const tables = config.db.type === 'sqlite' ? sqliteTables : mysqlTables
    
    // 创建表
    for (const [tableName, sql] of Object.entries(tables)) {
      console.log(`创建表: ${tableName}`)
      await run(sql)
    }
    
    // 创建索引（SQLite）
    if (config.db.type === 'sqlite') {
      for (const sql of sqliteIndexes) {
        await run(sql)
      }
    }
    
    // 插入默认配置
    for (const [key, value, type, desc] of defaultConfigs) {
      const existing = await query(
        'SELECT id FROM system_configs WHERE config_key = ?',
        [key]
      )
      
      if (!existing || (Array.isArray(existing) && existing.length === 0)) {
        await run(
          'INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES (?, ?, ?, ?)',
          [key, value, type, desc]
        )
        console.log(`插入默认配置: ${key}`)
      }
    }
    
    // 将ID为1的用户设置为管理员
    try {
      const user = await query(
        'SELECT id, role FROM users WHERE id = ?',
        [1]
      ) as any[]
      
      if (user && user.length > 0) {
        if (user[0].role !== 'admin') {
          await run(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['admin', 1]
          )
          console.log('已将用户ID为1的用户设置为管理员')
        } else {
          console.log('用户ID为1已经是管理员')
        }
      } else {
        console.log('用户ID为1不存在，跳过管理员设置')
      }
    } catch (error) {
      console.error('设置管理员失败:', error)
      // 不抛出错误，继续执行
    }
    
    console.log('数据库初始化完成！')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initDatabase()
    .then(async () => {
      // 运行数据库迁移（添加新字段）
      try {
        const { runAllMigrations } = await import('./migrate')
        await runAllMigrations()
      } catch (err) {
        console.error('数据库迁移失败:', err)
      }
      
      // 初始化SORA公共角色
      try {
        const { initSoraCharacters } = await import('./initSoraCharacters')
        await initSoraCharacters()
      } catch (err) {
        console.error('初始化SORA角色失败:', err)
      }
      console.log('初始化完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('初始化失败:', error)
      process.exit(1)
    })
}
