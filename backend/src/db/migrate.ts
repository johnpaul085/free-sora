import { getDb, run, query } from './connection'
import { config } from '../config'

// 数据库迁移：添加 membership_expires_at 字段
export async function addMembershipExpiresAtField() {
  try {
    const db = getDb()
    const dbType = config.db.type

    if (dbType === 'sqlite') {
      // SQLite: 检查字段是否存在
      const tableInfo = await query("PRAGMA table_info(users)") as any[]
      const hasField = tableInfo.some((col: any) => col.name === 'membership_expires_at')
      
      if (!hasField) {
        await run('ALTER TABLE users ADD COLUMN membership_expires_at DATETIME')
        console.log('SQLite: 已添加 membership_expires_at 字段')
      } else {
        console.log('SQLite: membership_expires_at 字段已存在')
      }
    } else if (dbType === 'mysql') {
      // MySQL: 检查字段是否存在
      const [rows] = await (db as any).execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'membership_expires_at'`,
        [config.db.mysql.database]
      ) as any[]
      
      if (!rows || rows.length === 0) {
        await run('ALTER TABLE users ADD COLUMN membership_expires_at DATETIME COMMENT \'会员到期时间\'')
        console.log('MySQL: 已添加 membership_expires_at 字段')
      } else {
        console.log('MySQL: membership_expires_at 字段已存在')
      }
    }
  } catch (err: any) {
    // 如果字段已存在，忽略错误
    if (err.message && err.message.includes('duplicate') || err.message.includes('already exists')) {
      console.log('字段已存在，跳过迁移')
    } else {
      console.error('迁移失败:', err)
      throw err
    }
  }
}

// 数据库迁移：为 characters 表添加 is_system 和 sora_id 字段
export async function addCharactersFields() {
  try {
    const db = getDb()
    const dbType = config.db.type

    if (dbType === 'sqlite') {
      // SQLite: 检查字段是否存在
      const tableInfo = await query("PRAGMA table_info(characters)") as any[]
      const hasIsSystem = tableInfo.some((col: any) => col.name === 'is_system')
      const hasSoraId = tableInfo.some((col: any) => col.name === 'sora_id')
      const hasNullableUserId = tableInfo.some((col: any) => col.name === 'user_id' && col.notnull === 0)
      
      if (!hasIsSystem) {
        await run('ALTER TABLE characters ADD COLUMN is_system INTEGER DEFAULT 0')
        console.log('SQLite: 已添加 is_system 字段')
      } else {
        console.log('SQLite: is_system 字段已存在')
      }
      
      if (!hasSoraId) {
        await run('ALTER TABLE characters ADD COLUMN sora_id TEXT')
        console.log('SQLite: 已添加 sora_id 字段')
      } else {
        console.log('SQLite: sora_id 字段已存在')
      }

      // SQLite不支持直接修改NOT NULL约束
      // 对于系统角色，我们使用 user_id = 0 来表示（0不是有效的用户ID）
      console.log('SQLite: 注意：系统内置角色将使用 user_id = 0 表示（SQLite限制）')
    } else if (dbType === 'mysql') {
      // MySQL: 检查字段是否存在
      const [rows] = await (db as any).execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'characters'`,
        [config.db.mysql.database]
      ) as any[]
      
      const columnNames = rows.map((r: any) => r.COLUMN_NAME)
      
      if (!columnNames.includes('is_system')) {
        await run('ALTER TABLE characters ADD COLUMN is_system BOOLEAN DEFAULT FALSE COMMENT \'是否系统内置角色\'')
        console.log('MySQL: 已添加 is_system 字段')
      } else {
        console.log('MySQL: is_system 字段已存在')
      }
      
      if (!columnNames.includes('sora_id')) {
        await run('ALTER TABLE characters ADD COLUMN sora_id VARCHAR(100) COMMENT \'SORA角色ID（用于@引用）\'')
        console.log('MySQL: 已添加 sora_id 字段')
      } else {
        console.log('MySQL: sora_id 字段已存在')
      }

      // 修改 user_id 为可空
      const userIdColumn = rows.find((r: any) => r.COLUMN_NAME === 'user_id')
      if (userIdColumn && userIdColumn.IS_NULLABLE === 'NO') {
        await run('ALTER TABLE characters MODIFY COLUMN user_id BIGINT COMMENT \'用户ID（NULL表示系统内置角色）\'')
        console.log('MySQL: 已修改 user_id 字段为可空')
      } else {
        console.log('MySQL: user_id 字段已为可空或不存在')
      }

      // 添加索引
      try {
        await run('CREATE INDEX IF NOT EXISTS idx_is_system ON characters(is_system)')
        await run('CREATE INDEX IF NOT EXISTS idx_sora_id ON characters(sora_id)')
        console.log('MySQL: 已添加索引')
      } catch (err: any) {
        if (err.message && err.message.includes('Duplicate key')) {
          console.log('MySQL: 索引已存在')
        } else {
          throw err
        }
      }
    }
  } catch (err: any) {
    // 如果字段已存在，忽略错误
    if (err.message && (err.message.includes('duplicate') || err.message.includes('already exists') || err.message.includes('Duplicate'))) {
      console.log('字段已存在，跳过迁移')
    } else {
      console.error('迁移失败:', err)
      throw err
    }
  }
}

// 运行所有迁移
export async function runAllMigrations() {
  await addMembershipExpiresAtField()
  await addCharactersFields()
}

// 运行迁移
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('迁移完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('迁移失败:', error)
      process.exit(1)
    })
}
