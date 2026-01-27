import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { hashPassword, comparePassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { success, error } from '../utils/response'
import { generateReferralCode } from '../utils/referral'
import { User } from '../types'

// 用户注册
export async function register(req: Request, res: Response) {
  try {
    const { username, password, email, phone, referral_code } = req.body
    
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400)
    }
    
    // 检查用户名是否已存在
    const existingUser = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )
    
    if (existingUser && (existingUser as any[]).length > 0) {
      return error(res, '用户名已存在', 400)
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      )
      if (existingEmail && (existingEmail as any[]).length > 0) {
        return error(res, '邮箱已存在', 400)
      }
    }
    
    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      )
      if (existingPhone && (existingPhone as any[]).length > 0) {
        return error(res, '手机号已存在', 400)
      }
    }
    
    // 处理推荐码
    let referrerId: number | null = null
    if (referral_code) {
      const referrer = await query(
        'SELECT id FROM users WHERE referral_code = ?',
        [referral_code]
      ) as any[]
      
      if (referrer && referrer.length > 0) {
        referrerId = referrer[0].id
      }
    }
    
    // 生成推荐码
    let referralCode = generateReferralCode()
    let codeExists = true
    while (codeExists) {
      const existing = await query(
        'SELECT id FROM users WHERE referral_code = ?',
        [referralCode]
      )
      if (!existing || (existing as any[]).length === 0) {
        codeExists = false
      } else {
        referralCode = generateReferralCode()
      }
    }
    
    // 加密密码
    const passwordHash = await hashPassword(password)
    
    // 创建用户
    const result = await run(
      `INSERT INTO users (username, password_hash, email, phone, referral_code, referrer_id, computing_power, total_computing_power)
       VALUES (?, ?, ?, ?, ?, ?, 100, 100)`,
      [username, passwordHash, email || null, phone || null, referralCode, referrerId]
    )
    
    const userId = (result as any).lastID
    
    // 建立团队关系（如果有推荐人）
    if (referrerId) {
      await run(
        'INSERT INTO team_relations (referrer_id, user_id, level) VALUES (?, ?, 1)',
        [referrerId, userId]
      )
    }
    
    // 生成Token
    const token = generateToken({
      userId,
      username,
      role: 'user',
    })
    
    success(res, {
      token,
      user: {
        id: userId,
        username,
        email,
        phone,
        referral_code: referralCode,
      },
    }, '注册成功')
  } catch (err: any) {
    console.error('注册错误:', err)
    error(res, err.message || '注册失败', 500)
  }
}

// 用户登录
export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400)
    }
    
    // 查找用户
    const users = await query(
      'SELECT * FROM users WHERE (username = ? OR email = ? OR phone = ?) AND status = ?',
      [username, username, username, 'active']
    ) as User[]
    
    if (!users || users.length === 0) {
      return error(res, '用户名或密码错误', 401)
    }
    
    const user = users[0]
    
    // 验证密码
    const isValid = await comparePassword(password, user.password_hash)
    if (!isValid) {
      return error(res, '用户名或密码错误', 401)
    }
    
    // 更新最后登录时间
    await run(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    )
    
    // 生成Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })
    
    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        nickname: user.nickname,
        user_type: user.user_type,
        role: user.role,
        referral_code: user.referral_code,
        computing_power: user.computing_power,
        total_computing_power: user.total_computing_power,
        gifted_computing_power: user.gifted_computing_power,
        hd_count: user.hd_count,
        membership_expires_at: user.membership_expires_at,
      },
    }, '登录成功')
  } catch (err: any) {
    console.error('登录错误:', err)
    error(res, err.message || '登录失败', 500)
  }
}

// 用户登出
export async function logout(req: Request, res: Response) {
  try {
    // JWT是无状态的，退出登录主要是清除前端的token
    // 这里可以记录登出日志或清除服务端session（如果有的话）
    success(res, null, '退出登录成功')
  } catch (err: any) {
    console.error('退出登录错误:', err)
    error(res, err.message || '退出登录失败', 500)
  }
}

// 获取当前用户信息
export async function getMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
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
