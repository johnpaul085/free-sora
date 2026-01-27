import { Request, Response } from 'express'
import { query } from '../db/connection'
import { success, error } from '../utils/response'

// 获取操作日志列表
export async function getAdminLogs(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      action_type = '',
      search = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    // 检查admin_logs表是否存在
    let sql = `SELECT l.*, u.username as admin_name
               FROM admin_logs l
               LEFT JOIN users u ON l.admin_id = u.id
               WHERE 1=1`
    const params: any[] = []

    if (action_type && action_type !== 'all') {
      sql += ' AND l.action_type = ?'
      params.push(action_type)
    }

    if (search) {
      sql += ' AND (l.action_type LIKE ? OR l.target_type LIKE ? OR u.username LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    sql += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    try {
      const logs = await query(sql, params) as any[]

      // 获取总数
      let countSql = `SELECT COUNT(*) as total 
                      FROM admin_logs l
                      LEFT JOIN users u ON l.admin_id = u.id
                      WHERE 1=1`
      const countParams: any[] = []

      if (action_type && action_type !== 'all') {
        countSql += ' AND l.action_type = ?'
        countParams.push(action_type)
      }

      if (search) {
        countSql += ' AND (l.action_type LIKE ? OR l.target_type LIKE ? OR u.username LIKE ?)'
        const searchTerm = `%${search}%`
        countParams.push(searchTerm, searchTerm, searchTerm)
      }

      const countResult = await query(countSql, countParams) as any[]
      const total = countResult[0]?.total || 0

      success(res, {
        list: logs || [],
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / limit),
      })
    } catch (tableError: any) {
      // 如果表不存在，返回空列表
      if (tableError.message && tableError.message.includes('no such table')) {
        success(res, {
          list: [],
          total: 0,
          page: Number(page),
          pageSize: Number(pageSize),
          totalPages: 0,
        })
      } else {
        throw tableError
      }
    }
  } catch (err: any) {
    console.error('获取操作日志错误:', err)
    error(res, err.message || '获取操作日志失败', 500)
  }
}
