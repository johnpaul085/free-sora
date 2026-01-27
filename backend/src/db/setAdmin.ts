import { getDb, run, query, closeDb } from './connection'
import { config } from '../config'

/**
 * 将指定用户ID设置为管理员
 */
export async function setUserAsAdmin(userId: number) {
  try {
    console.log(`开始将用户ID ${userId} 设置为管理员...`)
    
    // 检查用户是否存在
    const user = await query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [userId]
    ) as any[]
    
    if (!user || user.length === 0) {
      console.error(`用户ID ${userId} 不存在`)
      return false
    }
    
    const currentUser = user[0]
    console.log(`找到用户: ${currentUser.username}, 当前角色: ${currentUser.role}`)
    
    // 如果已经是管理员，直接返回
    if (currentUser.role === 'admin') {
      console.log(`用户ID ${userId} 已经是管理员`)
      return true
    }
    
    // 更新用户角色为管理员
    await run(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['admin', userId]
    )
    
    console.log(`成功将用户ID ${userId} (${currentUser.username}) 设置为管理员`)
    return true
  } catch (error) {
    console.error('设置管理员失败:', error)
    throw error
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const userId = process.argv[2] ? parseInt(process.argv[2], 10) : 1
  
  setUserAsAdmin(userId)
    .then((success) => {
      if (success) {
        console.log('操作完成')
      }
      closeDb()
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('操作失败:', error)
      closeDb()
      process.exit(1)
    })
}
