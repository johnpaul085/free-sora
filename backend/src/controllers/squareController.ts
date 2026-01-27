import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'

// 获取广场作品列表（所有已完成的作品）
export async function getSquareWorks(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20, work_type, sort = 'latest' } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let sql = `SELECT w.*, u.username, u.avatar_url as user_avatar
               FROM works w
               LEFT JOIN users u ON w.user_id = u.id
               WHERE w.status = 'completed'`
    const params: any[] = []

    if (work_type) {
      sql += ' AND w.work_type = ?'
      params.push(work_type)
    }

    // 排序：latest（最新）、likes（点赞数）、views（播放数）
    if (sort === 'likes') {
      sql += ' ORDER BY w.like_count DESC, w.created_at DESC'
    } else if (sort === 'views') {
      sql += ' ORDER BY w.view_count DESC, w.created_at DESC'
    } else {
      // 默认：latest（最新）
      sql += ' ORDER BY w.created_at DESC'
    }

    sql += ' LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const works = await query(sql, params) as any[]

    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM works WHERE status = \'completed\''
    const countParams: any[] = []

    if (work_type) {
      countSql += ' AND work_type = ?'
      countParams.push(work_type)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    success(res, {
      list: works,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取广场作品列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 点赞作品
export async function likeWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }

    const { id } = req.params

    // 检查作品是否存在且已完成
    const works = await query(
      'SELECT * FROM works WHERE id = ? AND status = \'completed\'',
      [id]
    ) as any[]

    if (!works || works.length === 0) {
      return error(res, '作品不存在或未完成', 404)
    }

    // 增加点赞数
    await run(
      'UPDATE works SET like_count = like_count + 1 WHERE id = ?',
      [id]
    )

    const updatedWork = await query(
      'SELECT like_count FROM works WHERE id = ?',
      [id]
    ) as any[]

    success(res, {
      like_count: updatedWork[0]?.like_count || 0,
    }, '点赞成功')
  } catch (err: any) {
    console.error('点赞作品错误:', err)
    error(res, err.message || '点赞失败', 500)
  }
}

// 浏览作品（增加浏览数）
export async function viewWork(req: Request, res: Response) {
  try {
    const { id } = req.params

    // 检查作品是否存在且已完成
    const works = await query(
      'SELECT * FROM works WHERE id = ? AND status = \'completed\'',
      [id]
    ) as any[]

    if (!works || works.length === 0) {
      return error(res, '作品不存在或未完成', 404)
    }

    // 增加浏览数
    await run(
      'UPDATE works SET view_count = view_count + 1 WHERE id = ?',
      [id]
    )

    success(res, null, '浏览记录已更新')
  } catch (err: any) {
    console.error('更新浏览数错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}
