import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { hashPassword, comparePassword } from '../utils/password'
import { success, error } from '../utils/response'
import { User } from '../types'

// 检查并更新过期会员
async function checkAndUpdateExpiredMembership(userId: number) {
  try {
    const users = await query(
      'SELECT id, user_type, membership_expires_at FROM users WHERE id = ?',
      [userId]
    ) as User[]
    
    if (!users || users.length === 0) return
    
    const user = users[0]
    
    // 如果是普通用户，无需检查
    if (user.user_type === 'normal') return
    
    // 如果有到期时间且已过期，则降级为普通用户
    if (user.membership_expires_at) {
      const expiresAt = new Date(user.membership_expires_at)
      const now = new Date()
      
      if (expiresAt <= now) {
        await run(
          'UPDATE users SET user_type = ?, membership_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['normal', userId]
        )
      }
    }
  } catch (err: any) {
    console.error('检查会员过期错误:', err)
  }
}

// 获取用户信息
export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    // 先检查并更新过期会员
    await checkAndUpdateExpiredMembership(req.user.userId)
    
    const users = await query(
      'SELECT id, username, email, phone, avatar_url, nickname, user_type, role, referral_code, computing_power, total_computing_power, gifted_computing_power, hd_count, membership_expires_at, created_at FROM users WHERE id = ?',
      [req.user.userId]
    ) as User[]
    
    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    success(res, users[0])
  } catch (err: any) {
    console.error('获取用户信息错误:', err)
    error(res, err.message || '获取用户信息失败', 500)
  }
}

// 更新用户信息
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { nickname, email, phone } = req.body
    
    const updates: string[] = []
    const values: any[] = []
    
    if (nickname !== undefined) {
      updates.push('nickname = ?')
      values.push(nickname)
    }
    
    if (email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      const existing = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      ) as any[]
      
      if (existing && existing.length > 0) {
        return error(res, '邮箱已被使用', 400)
      }
      
      updates.push('email = ?')
      values.push(email)
    }
    
    if (phone !== undefined) {
      // 检查手机号是否已被其他用户使用
      const existing = await query(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, req.user.userId]
      ) as any[]
      
      if (existing && existing.length > 0) {
        return error(res, '手机号已被使用', 400)
      }
      
      updates.push('phone = ?')
      values.push(phone)
    }
    
    if (updates.length === 0) {
      return error(res, '没有要更新的字段', 400)
    }
    
    values.push(req.user.userId)
    
    await run(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    )
    
    success(res, null, '更新成功')
  } catch (err: any) {
    console.error('更新用户信息错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}

// 修改密码
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { oldPassword, newPassword } = req.body
    
    if (!oldPassword || !newPassword) {
      return error(res, '旧密码和新密码不能为空', 400)
    }
    
    // 获取用户
    const users = await query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.userId]
    ) as User[]
    
    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    // 验证旧密码
    const isValid = await comparePassword(oldPassword, users[0].password_hash)
    if (!isValid) {
      return error(res, '旧密码错误', 400)
    }
    
    // 更新密码
    const passwordHash = await hashPassword(newPassword)
    await run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, req.user.userId]
    )
    
    success(res, null, '密码修改成功')
  } catch (err: any) {
    console.error('修改密码错误:', err)
    error(res, err.message || '修改密码失败', 500)
  }
}

// 上传头像（已迁移到uploadController，保留此接口用于兼容）
export async function uploadAvatar(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    // 如果直接传URL（兼容旧接口）
    const { avatar_url } = req.body
    
    if (avatar_url) {
      await run(
        'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avatar_url, req.user.userId]
      )
      success(res, { avatar_url }, '头像更新成功')
    } else {
      error(res, '请使用 /api/v1/upload/avatar 接口上传文件', 400)
    }
  } catch (err: any) {
    console.error('上传头像错误:', err)
    error(res, err.message || '上传失败', 500)
  }
}

// 获取算力记录
export async function getComputingPowerLogs(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    
    // TODO: 实现算力记录表查询（需要创建computing_power_logs表）
    // 暂时返回空数组
    success(res, {
      list: [],
      total: 0,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取算力记录错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 购买会员
export async function purchaseMembership(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { plan_type } = req.body
    
    if (!plan_type || !['lifetime', 'monthly', 'yearly'].includes(plan_type)) {
      return error(res, '无效的套餐类型', 400)
    }
    
    // 获取用户信息
    const users = await query(
      'SELECT id, user_type, computing_power, hd_count, membership_expires_at FROM users WHERE id = ?',
      [req.user.userId]
    ) as User[]
    
    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }
    
    const user = users[0]
    
    // 根据套餐类型设置会员类型、到期时间和赠送的算力
    let newUserType: 'normal' | 'vip' | 'svip' = 'vip'
    let computingPowerBonus = 2000 // 视频算力2000点
    let hdCountBonus = 1 // 高清次数1次
    let expiresAt: string | null = null
    
    // 计算到期时间
    const now = new Date()
    if (plan_type === 'lifetime') {
      newUserType = 'svip'
      expiresAt = null // 终身会员，不过期
    } else if (plan_type === 'monthly') {
      newUserType = 'vip'
      const expires = new Date(now)
      expires.setMonth(expires.getMonth() + 1)
      expiresAt = expires.toISOString().slice(0, 19).replace('T', ' ')
    } else if (plan_type === 'yearly') {
      newUserType = 'svip' // 年卡会员设为SVIP
      const expires = new Date(now)
      expires.setFullYear(expires.getFullYear() + 1)
      expiresAt = expires.toISOString().slice(0, 19).replace('T', ' ')
    }
    
    // 如果用户已有会员且未过期，则续期（延长到期时间）
    let finalExpiresAt = expiresAt
    if (user.user_type !== 'normal' && user.membership_expires_at) {
      const currentExpires = new Date(user.membership_expires_at)
      if (currentExpires > now && expiresAt) {
        // 从当前到期时间开始续期
        const newExpires = new Date(currentExpires)
        if (plan_type === 'monthly') {
          newExpires.setMonth(newExpires.getMonth() + 1)
        } else if (plan_type === 'yearly') {
          newExpires.setFullYear(newExpires.getFullYear() + 1)
        }
        finalExpiresAt = newExpires.toISOString().slice(0, 19).replace('T', ' ')
      }
    }
    
    // 更新用户会员类型、到期时间、算力和高清次数
    await run(
      `UPDATE users SET 
       user_type = ?,
       membership_expires_at = ?,
       computing_power = computing_power + ?,
       total_computing_power = total_computing_power + ?,
       hd_count = hd_count + ?,
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newUserType, finalExpiresAt, computingPowerBonus, computingPowerBonus, hdCountBonus, req.user.userId]
    )
    
    // 获取更新后的用户信息
    const updatedUsers = await query(
      'SELECT id, username, email, phone, avatar_url, nickname, user_type, role, referral_code, computing_power, total_computing_power, hd_count, membership_expires_at, created_at FROM users WHERE id = ?',
      [req.user.userId]
    ) as User[]
    
    success(res, updatedUsers[0], '购买成功')
  } catch (err: any) {
    console.error('购买会员错误:', err)
    error(res, err.message || '购买失败', 500)
  }
}

// 卡密兑换
export async function redeemCode(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { code } = req.body
    
    if (!code || !code.trim()) {
      return error(res, '卡密不能为空', 400)
    }
    
    const { query, run } = await import('../db/connection')
    
    // 1. 查询卡密是否存在且未使用
    const codes = await query(
      'SELECT * FROM redeem_codes WHERE code = ?',
      [code.trim().toUpperCase()]
    ) as any[]
    
    if (!codes || codes.length === 0) {
      return error(res, '卡密不存在', 404)
    }
    
    const redeemCode = codes[0]
    
    // 检查是否已使用
    if (redeemCode.is_used === 1 || (redeemCode.is_used === true)) {
      return error(res, '卡密已被使用', 400)
    }
    
    // 检查是否过期
    if (redeemCode.expires_at) {
      const expiresAt = new Date(redeemCode.expires_at)
      if (expiresAt < new Date()) {
        return error(res, '卡密已过期', 400)
      }
    }
    
    // 2. 根据卡密类型进行兑换
    if (redeemCode.code_type === 'computing_power') {
      // 增加算力
      await run(
        'UPDATE users SET computing_power = computing_power + ?, total_computing_power = total_computing_power + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [redeemCode.value, redeemCode.value, req.user.userId]
      )
    } else if (redeemCode.code_type === 'vip' || redeemCode.code_type === 'svip') {
      // 设置会员
      const userType = redeemCode.code_type === 'vip' ? 'vip' : 'svip'
      const days = redeemCode.value
      
      // 查询用户当前会员状态
      const users = await query(
        'SELECT membership_expires_at, user_type FROM users WHERE id = ?',
        [req.user.userId]
      ) as any[]
      
      if (users && users.length > 0) {
        const user = users[0]
        let newExpiresAt: Date
        
        if (user.membership_expires_at && new Date(user.membership_expires_at) > new Date()) {
          // 如果已有会员，延长到期时间
          newExpiresAt = new Date(user.membership_expires_at)
          newExpiresAt.setDate(newExpiresAt.getDate() + days)
        } else {
          // 如果没有会员或已过期，从今天开始计算
          newExpiresAt = new Date()
          newExpiresAt.setDate(newExpiresAt.getDate() + days)
        }
        
        await run(
          'UPDATE users SET user_type = ?, membership_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [userType, newExpiresAt.toISOString(), req.user.userId]
        )
      }
    }
    
    // 3. 标记卡密为已使用
    await run(
      'UPDATE redeem_codes SET is_used = 1, used_by_user_id = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.userId, redeemCode.id]
    )
    
    success(res, {
      message: '兑换成功',
      code_type: redeemCode.code_type,
      value: redeemCode.value,
    }, '兑换成功')
  } catch (err: any) {
    console.error('卡密兑换错误:', err)
    error(res, err.message || '兑换失败', 500)
  }
}
