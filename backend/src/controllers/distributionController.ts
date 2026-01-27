import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'

// 获取分销数据概览
export async function getDistributionData(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const userId = req.user.userId

    // 获取佣金统计
    const commissions = await query(
      `SELECT 
        SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END) as available_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'withdrawn' THEN amount ELSE 0 END) as withdrawn_amount
       FROM commissions WHERE user_id = ?`,
      [userId]
    ) as any[]

    const commissionStats = commissions[0] || {
      available_amount: 0,
      pending_amount: 0,
      withdrawn_amount: 0,
    }

    // 获取团队统计
    const teamStats = await query(
      `SELECT 
        COUNT(CASE WHEN level = 1 THEN 1 END) as level1_count,
        COUNT(CASE WHEN level = 2 THEN 1 END) as level2_count,
        COUNT(*) as total_count
       FROM team_relations WHERE referrer_id = ?`,
      [userId]
    ) as any[]

    const team = teamStats[0] || {
      level1_count: 0,
      level2_count: 0,
      total_count: 0,
    }

    // 获取订单统计
    const orders = await query(
      `SELECT COUNT(*) as total, SUM(amount) as total_amount
       FROM distribution_orders WHERE referrer_id = ? AND status = 'paid'`,
      [userId]
    ) as any[]

    const orderStats = orders[0] || {
      total: 0,
      total_amount: 0,
    }

    success(res, {
      commissions: {
        available: Number(commissionStats.available_amount || 0),
        pending: Number(commissionStats.pending_amount || 0),
        withdrawn: Number(commissionStats.withdrawn_amount || 0),
        total: Number(commissionStats.available_amount || 0) + Number(commissionStats.pending_amount || 0) + Number(commissionStats.withdrawn_amount || 0),
      },
      team: {
        level1: Number(team.level1_count || 0),
        level2: Number(team.level2_count || 0),
        total: Number(team.total_count || 0),
      },
      orders: {
        total: Number(orderStats.total || 0),
        totalAmount: Number(orderStats.total_amount || 0),
      },
    })
  } catch (err: any) {
    console.error('获取分销数据错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取佣金明细
export async function getCommissions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { page = 1, pageSize = 20, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = `
      SELECT c.*, u.username as source_username
      FROM commissions c
      LEFT JOIN users u ON c.source_user_id = u.id
      WHERE c.user_id = ?
    `
    const params: any[] = [req.user.userId]

    if (status) {
      sql += ' AND c.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const commissions = await query(sql, params)

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM commissions WHERE user_id = ?'
    const countParams: any[] = [req.user.userId]

    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: commissions,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取佣金明细错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取团队列表
export async function getTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { level, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = `
      SELECT tr.*, u.username, u.email, u.phone, u.created_at as register_time
      FROM team_relations tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.referrer_id = ?
    `
    const params: any[] = [req.user.userId]

    if (level) {
      sql += ' AND tr.level = ?'
      params.push(Number(level))
    }

    sql += ' ORDER BY tr.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const team = await query(sql, params)

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM team_relations WHERE referrer_id = ?'
    const countParams: any[] = [req.user.userId]

    if (level) {
      countSql += ' AND level = ?'
      countParams.push(Number(level))
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: team,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取团队列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取分销订单
export async function getDistributionOrders(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { page = 1, pageSize = 20, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = `
      SELECT do.*, u.username as order_user_name
      FROM distribution_orders do
      LEFT JOIN users u ON do.user_id = u.id
      WHERE do.referrer_id = ?
    `
    const params: any[] = [req.user.userId]

    if (status) {
      sql += ' AND do.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY do.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const orders = await query(sql, params)

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM distribution_orders WHERE referrer_id = ?'
    const countParams: any[] = [req.user.userId]

    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: orders,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取分销订单错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 申请提现
export async function applyWithdrawal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { amount, withdrawal_method, account_info } = req.body

    if (!amount || !withdrawal_method || !account_info) {
      return error(res, '参数不完整', 400)
    }

    // 检查可提现金额
    const commissions = await query(
      `SELECT SUM(amount) as total FROM commissions 
       WHERE user_id = ? AND status = 'available'`,
      [req.user.userId]
    ) as any[]

    const availableAmount = Number(commissions[0]?.total || 0)

    if (Number(amount) > availableAmount) {
      return error(res, '提现金额超过可提现余额', 400)
    }

    // 检查最低提现金额
    const config = await query(
      'SELECT config_value FROM system_configs WHERE config_key = ?',
      ['min_withdrawal_amount']
    ) as any[]

    const minAmount = Number(config[0]?.config_value || 10)

    if (Number(amount) < minAmount) {
      return error(res, `最低提现金额为${minAmount}元`, 400)
    }

    // 创建提现记录
    const result = await run(
      `INSERT INTO withdrawals (user_id, amount, withdrawal_method, account_info, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.userId, amount, withdrawal_method, account_info]
    )

    success(res, { id: (result as any).lastID }, '提现申请已提交')
  } catch (err: any) {
    console.error('申请提现错误:', err)
    error(res, err.message || '申请失败', 500)
  }
}

// 获取提现记录
export async function getWithdrawals(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { page = 1, pageSize = 20, status } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = 'SELECT * FROM withdrawals WHERE user_id = ?'
    const params: any[] = [req.user.userId]

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const withdrawals = await query(sql, params)

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM withdrawals WHERE user_id = ?'
    const countParams: any[] = [req.user.userId]

    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: withdrawals,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取提现记录错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取推荐码
export async function getReferralCode(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const users = await query(
      'SELECT referral_code FROM users WHERE id = ?',
      [req.user.userId]
    ) as any[]

    if (!users || users.length === 0) {
      return error(res, '用户不存在', 404)
    }

    success(res, {
      referralCode: users[0].referral_code,
    })
  } catch (err: any) {
    console.error('获取推荐码错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}
