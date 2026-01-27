import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'

// 获取佣金列表
export async function getCommissions(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = '',
      commission_type = '',
      search = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let sql = `SELECT c.*, 
               u1.username as user_username,
               u2.username as source_username
               FROM commissions c
               LEFT JOIN users u1 ON c.user_id = u1.id
               LEFT JOIN users u2 ON c.source_user_id = u2.id
               WHERE 1=1`
    const params: any[] = []

    if (status && status !== 'all') {
      sql += ' AND c.status = ?'
      params.push(status)
    }

    if (commission_type && commission_type !== 'all') {
      sql += ' AND c.commission_type = ?'
      params.push(commission_type)
    }

    if (search) {
      sql += ' AND (u1.username LIKE ? OR u2.username LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const commissions = await query(sql, params) as any[]

    // 获取总数
    let countSql = `SELECT COUNT(*) as total 
                    FROM commissions c
                    LEFT JOIN users u1 ON c.user_id = u1.id
                    LEFT JOIN users u2 ON c.source_user_id = u2.id
                    WHERE 1=1`
    const countParams: any[] = []

    if (status && status !== 'all') {
      countSql += ' AND c.status = ?'
      countParams.push(status)
    }

    if (commission_type && commission_type !== 'all') {
      countSql += ' AND c.commission_type = ?'
      countParams.push(commission_type)
    }

    if (search) {
      countSql += ' AND (u1.username LIKE ? OR u2.username LIKE ?)'
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: commissions || [],
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    console.error('获取佣金列表错误:', err)
    error(res, err.message || '获取佣金列表失败', 500)
  }
}

// 更新佣金状态
export async function updateCommissionStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['pending', 'available', 'withdrawn', 'cancelled'].includes(status)) {
      return error(res, '无效的佣金状态', 400)
    }

    const updates: string[] = []
    const values: any[] = []

    updates.push('status = ?')
    values.push(status)

    if (status === 'withdrawn') {
      updates.push('withdrawn_at = CURRENT_TIMESTAMP')
    } else if (status === 'available') {
      updates.push('withdrawable_at = CURRENT_TIMESTAMP')
    }

    values.push(id)

    await run(
      `UPDATE commissions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    )

    success(res, null, '佣金状态更新成功')
  } catch (err: any) {
    console.error('更新佣金状态错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}
