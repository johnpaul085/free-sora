import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { logAdminAction, getClientIp } from '../utils/adminLog'

// 获取待审核作品列表
export async function getReviewWorks(req: Request, res: Response) {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = 'pending',
      work_type = '',
    } = req.query

    const offset = (Number(page) - 1) * Number(pageSize)
    const limit = Number(pageSize)

    let sql = `SELECT w.*, u.username, u.nickname
               FROM works w
               LEFT JOIN users u ON w.user_id = u.id
               WHERE w.is_public = 1 AND w.status = 'completed'`
    const params: any[] = []

    // 这里可以根据实际需求添加审核状态字段
    // 目前使用 is_public = 1 作为已公开（待审核）的作品

    if (work_type && work_type !== 'all') {
      sql += ' AND w.work_type = ?'
      params.push(work_type)
    }

    sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const works = await query(sql, params) as any[]

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM works WHERE is_public = 1 AND status = \'completed\''
    const countParams: any[] = []

    if (work_type && work_type !== 'all') {
      countSql += ' AND work_type = ?'
      countParams.push(work_type)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: works || [],
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    console.error('获取审核作品列表错误:', err)
    error(res, err.message || '获取审核作品列表失败', 500)
  }
}

// 审核作品（通过/拒绝）
export async function reviewWork(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { action, reason } = req.body // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return error(res, '无效的审核操作', 400)
    }

    if (action === 'approve') {
      // 通过审核，保持 is_public = 1
      await run(
        'UPDATE works SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      )
      // 记录操作日志
      await logAdminAction(
        req.user!.userId,
        'review_work',
        'work',
        Number(id),
        '审核通过',
        getClientIp(req),
        req.headers['user-agent']
      )
      success(res, null, '作品审核通过')
    } else {
      // 拒绝审核，设置为不公开
      await run(
        'UPDATE works SET is_public = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      )
      // 记录操作日志
      await logAdminAction(
        req.user!.userId,
        'review_work',
        'work',
        Number(id),
        `审核拒绝: ${reason || '无原因'}`,
        getClientIp(req),
        req.headers['user-agent']
      )
      success(res, null, '作品已拒绝')
    }
  } catch (err: any) {
    console.error('审核作品错误:', err)
    error(res, err.message || '审核失败', 500)
  }
}
