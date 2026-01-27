import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'

// 获取订单列表
export async function getOrders(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = '',
      order_type = '',
      search = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let sql = `SELECT o.*, u.username, u.nickname
               FROM distribution_orders o
               LEFT JOIN users u ON o.user_id = u.id
               WHERE 1=1`
    const params: any[] = []

    if (status && status !== 'all') {
      sql += ' AND o.status = ?'
      params.push(status)
    }

    if (order_type && order_type !== 'all') {
      sql += ' AND o.order_type = ?'
      params.push(order_type)
    }

    if (search) {
      sql += ' AND (o.order_no LIKE ? OR u.username LIKE ? OR u.nickname LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const orders = await query(sql, params) as any[]

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM distribution_orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1`
    const countParams: any[] = []

    if (status && status !== 'all') {
      countSql += ' AND o.status = ?'
      countParams.push(status)
    }

    if (order_type && order_type !== 'all') {
      countSql += ' AND o.order_type = ?'
      countParams.push(order_type)
    }

    if (search) {
      countSql += ' AND (o.order_no LIKE ? OR u.username LIKE ? OR u.nickname LIKE ?)'
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: orders || [],
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    console.error('获取订单列表错误:', err)
    error(res, err.message || '获取订单列表失败', 500)
  }
}

// 获取订单详情
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params

    const orders = await query(
      `SELECT o.*, u.username, u.nickname, u.email, u.phone
       FROM distribution_orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    ) as any[]

    if (!orders || orders.length === 0) {
      return error(res, '订单不存在', 404)
    }

    success(res, orders[0])
  } catch (err: any) {
    console.error('获取订单详情错误:', err)
    error(res, err.message || '获取订单详情失败', 500)
  }
}

// 更新订单状态
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['pending', 'paid', 'completed', 'cancelled', 'refunded'].includes(status)) {
      return error(res, '无效的订单状态', 400)
    }

    const updates: string[] = []
    const values: any[] = []

    updates.push('status = ?')
    values.push(status)

    if (status === 'paid' || status === 'completed') {
      updates.push('payment_time = CURRENT_TIMESTAMP')
    }

    values.push(id)

    await run(
      `UPDATE distribution_orders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    )

    success(res, null, '订单状态更新成功')
  } catch (err: any) {
    console.error('更新订单状态错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}
