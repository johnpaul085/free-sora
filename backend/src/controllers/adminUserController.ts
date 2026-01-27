import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { User } from '../types'
import { hashPassword } from '../utils/password'
import { logAdminAction, getClientIp } from '../utils/adminLog'

// 获取用户列表
export async function getUsers(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = '',
      user_type = '',
      status = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    // 构建查询条件
    let whereConditions = ['1=1']
    const params: any[] = []

    if (search) {
      whereConditions.push('(username LIKE ? OR email LIKE ? OR phone LIKE ?)')
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (user_type && user_type !== 'all') {
      whereConditions.push('user_type = ?')
      params.push(user_type)
    }

    if (status && status !== 'all') {
      whereConditions.push('status = ?')
      params.push(status)
    }

    const whereClause = whereConditions.join(' AND ')

    // 获取总数
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    ) as any[]
    const total = countResult[0]?.total || 0

    // 获取用户列表
    const users = await query(
      `SELECT id, username, email, phone, nickname, avatar_url, user_type, role, status, 
       computing_power, total_computing_power, hd_count, referral_code, 
       membership_expires_at, created_at, last_login_at 
       FROM users 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as User[]

    success(res, {
      list: users || [],
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    console.error('获取用户列表错误:', err)
    error(res, err.message || '获取用户列表失败', 500)
  }
}

// 获取用户详情
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params

    const users = await query(
      `SELECT id, username, email, phone, nickname, avatar_url, user_type, role, status,
       computing_power, total_computing_power, hd_count, gifted_computing_power,
       referral_code, referrer_id, membership_expires_at, created_at, last_login_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    ) as User[]

    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }

    // 获取推荐人信息
    const user = users[0]
    if (user.referrer_id) {
      const referrers = await query(
        'SELECT id, username, nickname FROM users WHERE id = ?',
        [user.referrer_id]
      ) as any[]
      if (referrers && referrers.length > 0) {
        ;(user as any).referrer = referrers[0]
      }
    }

    // 获取团队统计
    const teamStats = await query(
      `SELECT 
        COUNT(CASE WHEN level = 1 THEN 1 END) as level1_count,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level2_count
       FROM team_relations WHERE referrer_id = ?`,
      [id]
    ) as any[]
    if (teamStats && teamStats.length > 0) {
      ;(user as any).team_stats = teamStats[0]
    }

    success(res, user)
  } catch (err: any) {
    console.error('获取用户详情错误:', err)
    error(res, err.message || '获取用户详情失败', 500)
  }
}

// 更新用户信息
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params
    const {
      nickname,
      email,
      phone,
      user_type,
      status,
      computing_power,
      total_computing_power,
      gifted_computing_power,
      hd_count,
      membership_expires_at,
    } = req.body

    // 检查用户是否存在
    const users = await query('SELECT id FROM users WHERE id = ?', [id]) as any[]
    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }

    // 构建更新字段
    const updates: string[] = []
    const params: any[] = []

    if (nickname !== undefined) {
      updates.push('nickname = ?')
      params.push(nickname)
    }
    if (email !== undefined) {
      // 检查邮箱是否被其他用户使用
      const existing = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      ) as any[]
      if (existing && existing.length > 0) {
        return error(res, '邮箱已被使用', 400)
      }
      updates.push('email = ?')
      params.push(email)
    }
    if (phone !== undefined) {
      // 检查手机号是否被其他用户使用
      const existing = await query(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, id]
      ) as any[]
      if (existing && existing.length > 0) {
        return error(res, '手机号已被使用', 400)
      }
      updates.push('phone = ?')
      params.push(phone)
    }
    if (user_type !== undefined) {
      updates.push('user_type = ?')
      params.push(user_type)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (computing_power !== undefined) {
      updates.push('computing_power = ?')
      params.push(computing_power)
    }
    if (total_computing_power !== undefined) {
      updates.push('total_computing_power = ?')
      params.push(total_computing_power)
    }
    if (gifted_computing_power !== undefined) {
      updates.push('gifted_computing_power = ?')
      params.push(gifted_computing_power)
    }
    if (hd_count !== undefined) {
      updates.push('hd_count = ?')
      params.push(hd_count)
    }
    if (membership_expires_at !== undefined) {
      if (membership_expires_at === null || membership_expires_at === '') {
        updates.push('membership_expires_at = NULL')
      } else {
        // 将 ISO 格式转换为数据库格式 (YYYY-MM-DD HH:MM:SS)
        const dateStr = membership_expires_at.replace('T', ' ').slice(0, 19)
        updates.push('membership_expires_at = ?')
        params.push(dateStr)
      }
    }

    if (updates.length === 0) {
      return error(res, '没有需要更新的字段', 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    await run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    // 获取更新后的用户信息
    const updatedUsers = await query(
      'SELECT id, username, email, phone, nickname, avatar_url, user_type, role, status, computing_power, total_computing_power, hd_count, membership_expires_at FROM users WHERE id = ?',
      [id]
    ) as User[]

    success(res, updatedUsers[0], '更新成功')
  } catch (err: any) {
    console.error('更新用户错误:', err)
    error(res, err.message || '更新用户失败', 500)
  }
}

// 重置用户密码
export async function resetPassword(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return error(res, '密码长度至少6位', 400)
    }

    // 检查用户是否存在
    const users = await query('SELECT id FROM users WHERE id = ?', [id]) as any[]
    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }

    // 加密新密码
    const passwordHash = await hashPassword(newPassword)

    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, id]
    )

    success(res, null, '密码重置成功')
  } catch (err: any) {
    console.error('重置密码错误:', err)
    error(res, err.message || '重置密码失败', 500)
  }
}

// 批量操作
export async function batchOperation(req: Request, res: Response) {
  try {
    const { action, userIds } = req.body

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return error(res, '参数错误', 400)
    }

    const placeholders = userIds.map(() => '?').join(',')

    switch (action) {
      case 'ban':
        await run(
          `UPDATE users SET status = 'banned', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
          userIds
        )
        // 记录操作日志
        for (const userId of userIds) {
          await logAdminAction(
            req.user!.userId,
            'ban_user',
            'user',
            userId,
            null,
            getClientIp(req),
            req.headers['user-agent']
          )
        }
        success(res, null, '批量禁用成功')
        break
      case 'unban':
        await run(
          `UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
          userIds
        )
        // 记录操作日志
        for (const userId of userIds) {
          await logAdminAction(
            req.user!.userId,
            'unban_user',
            'user',
            userId,
            null,
            getClientIp(req),
            req.headers['user-agent']
          )
        }
        success(res, null, '批量启用成功')
        break
      case 'delete':
        await run(
          `UPDATE users SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
          userIds
        )
        // 记录操作日志
        for (const userId of userIds) {
          await logAdminAction(
            req.user!.userId,
            'delete_user',
            'user',
            userId,
            null,
            getClientIp(req),
            req.headers['user-agent']
          )
        }
        success(res, null, '批量删除成功')
        break
      default:
        return error(res, '不支持的操作', 400)
    }
  } catch (err: any) {
    console.error('批量操作错误:', err)
    error(res, err.message || '批量操作失败', 500)
  }
}
