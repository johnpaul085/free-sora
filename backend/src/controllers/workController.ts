import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { Work } from '../types'

// 获取作品列表（包括处理中的任务）
export async function getWorks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { page = 1, pageSize = 20, status, work_type, category } = req.query
    
    // 先查询已完成的作品
    let worksSql = 'SELECT * FROM works WHERE user_id = ?'
    const worksParams: any[] = [req.user.userId]
    
    // 处理分类筛选
    if (category === 'sora') {
      worksSql += ` AND work_type = 'video' AND (model_name LIKE '%sora%' OR model_name LIKE '%SORA%')`
    } else if (category === 'veo') {
      worksSql += ` AND work_type = 'video' AND (model_name LIKE '%veo%' OR model_name LIKE '%VEO%')`
    } else if (category === 'image') {
      worksSql += ` AND work_type = 'image'`
    }
    
    if (status) {
      worksSql += ' AND status = ?'
      worksParams.push(status)
    }
    
    if (work_type) {
      worksSql += ' AND work_type = ?'
      worksParams.push(work_type)
    }
    
    worksSql += ' ORDER BY created_at DESC'
    
    const works = await query(worksSql, worksParams) as any[]
    
    // 查询处理中的任务（还没有创建works记录的）
    let tasksSql = 'SELECT * FROM generation_tasks WHERE user_id = ? AND work_id IS NULL'
    const tasksParams: any[] = [req.user.userId]
    
    // 处理分类筛选（任务）
    if (category === 'sora') {
      tasksSql += ` AND task_type IN ('text2video', 'img2video') AND (model_name LIKE '%sora%' OR model_name LIKE '%SORA%' OR model_name = 'sora')`
    } else if (category === 'veo') {
      tasksSql += ` AND task_type IN ('text2video', 'img2video') AND (model_name LIKE '%veo%' OR model_name LIKE '%VEO%' OR model_name = 'veo')`
    } else if (category === 'image') {
      tasksSql += ` AND task_type IN ('text2img', 'img2img')`
    }
    
    if (status) {
      tasksSql += ' AND status = ?'
      tasksParams.push(status)
    }
    
    tasksSql += ' ORDER BY created_at DESC'
    
    const tasks = await query(tasksSql, tasksParams) as any[]
    
    // 将任务转换为作品格式
    const taskWorks = tasks.map((task: any) => ({
      id: task.id,
      user_id: task.user_id,
      title: null,
      work_type: (task.task_type === 'text2img' || task.task_type === 'img2img') ? 'image' : 'video',
      content_type: task.task_type,
      model_name: task.model_name,
      prompt: task.prompt,
      negative_prompt: task.negative_prompt,
      source_image_url: task.source_image_url,
      result_url: task.result_url || null,
      thumbnail_url: null,
      status: task.status,
      error_message: task.error_message || null,
      computing_power_used: 0,
      width: null,
      height: null,
      duration: null,
      progress: task.progress || 0, // 添加进度字段
      created_at: task.created_at,
      updated_at: task.updated_at,
    }))
    
    // 合并并排序
    const allWorks = [...works, ...taskWorks].sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    // 分页
    const offset = (Number(page) - 1) * Number(pageSize)
    const paginatedWorks = allWorks.slice(offset, offset + Number(pageSize))
    
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM works WHERE user_id = ?'
    const countParams: any[] = [req.user.userId]
    
    if (category === 'sora') {
      countSql += ` AND work_type = 'video' AND (model_name LIKE '%sora%' OR model_name LIKE '%SORA%')`
    } else if (category === 'veo') {
      countSql += ` AND work_type = 'video' AND (model_name LIKE '%veo%' OR model_name LIKE '%VEO%')`
    } else if (category === 'image') {
      countSql += ` AND work_type = 'image'`
    }
    
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    
    if (work_type) {
      countSql += ' AND work_type = ?'
      countParams.push(work_type)
    }
    
    // 任务总数
    let taskCountSql = 'SELECT COUNT(*) as total FROM generation_tasks WHERE user_id = ? AND work_id IS NULL'
    const taskCountParams: any[] = [req.user.userId]
    
    if (category === 'sora') {
      taskCountSql += ` AND task_type IN ('text2video', 'img2video') AND (model_name LIKE '%sora%' OR model_name LIKE '%SORA%' OR model_name = 'sora')`
    } else if (category === 'veo') {
      taskCountSql += ` AND task_type IN ('text2video', 'img2video') AND (model_name LIKE '%veo%' OR model_name LIKE '%VEO%' OR model_name = 'veo')`
    } else if (category === 'image') {
      taskCountSql += ` AND task_type IN ('text2img', 'img2img')`
    }
    
    if (status) {
      taskCountSql += ' AND status = ?'
      taskCountParams.push(status)
    }
    
    const countResult = await query(countSql, countParams) as any[]
    const taskCountResult = await query(taskCountSql, taskCountParams) as any[]
    const total = (countResult[0]?.total || 0) + (taskCountResult[0]?.total || 0)
    
    success(res, {
      list: paginatedWorks,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    })
  } catch (err: any) {
    console.error('获取作品列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 获取作品详情
export async function getWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    // 先尝试从works表查询
    const works = await query(
      'SELECT * FROM works WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as Work[]
    
    if (works && works.length > 0) {
      return success(res, works[0])
    }
    
    // 如果works表没有，尝试从generation_tasks表查询（处理中的任务）
    const tasks = await query(
      'SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as any[]
    
    if (tasks && tasks.length > 0) {
      const task = tasks[0]
      // 转换为works格式
      const work = {
        id: task.id,
        user_id: task.user_id,
        title: null,
        work_type: (task.task_type === 'text2img' || task.task_type === 'img2img') ? 'image' : 'video',
        content_type: task.task_type,
        model_name: task.model_name,
        prompt: task.prompt,
        negative_prompt: task.negative_prompt,
        source_image_url: task.source_image_url,
        result_url: task.result_url || null,
        thumbnail_url: null,
        status: task.status,
        computing_power_used: 0,
        width: null,
        height: null,
        duration: null,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }
      return success(res, work)
    }
    
    return error(res, '作品不存在', 404)
  } catch (err: any) {
    console.error('获取作品详情错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 删除作品
export async function deleteWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    // 先尝试删除works记录
    const result = await run(
      'DELETE FROM works WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    )
    
    if ((result as any).changes > 0 || (result as any).affectedRows > 0) {
      return success(res, null, '删除成功')
    }
    
    // 如果works表没有，尝试删除generation_tasks记录
    const taskResult = await run(
      'DELETE FROM generation_tasks WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    )
    
    if ((taskResult as any).changes > 0 || (taskResult as any).affectedRows > 0) {
      return success(res, null, '删除成功')
    }
    
    return error(res, '作品不存在或无权限', 404)
  } catch (err: any) {
    console.error('删除作品错误:', err)
    error(res, err.message || '删除失败', 500)
  }
}

// 更新作品（公开/私有）
export async function updateWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    const { is_public, title } = req.body
    
    const updates: string[] = []
    const values: any[] = []
    
    if (is_public !== undefined) {
      updates.push('is_public = ?')
      values.push(is_public ? 1 : 0)
    }
    
    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    
    if (updates.length === 0) {
      return error(res, '没有要更新的字段', 400)
    }
    
    values.push(id, req.user.userId)
    
    await run(
      `UPDATE works SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      values
    )
    
    success(res, null, '更新成功')
  } catch (err: any) {
    console.error('更新作品错误:', err)
    error(res, err.message || '更新失败', 500)
  }
}

// 下载作品（返回文件URL或重定向）
export async function downloadWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    // 先尝试从works表查询
    const works = await query(
      'SELECT * FROM works WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as Work[]
    
    let work: any = null
    if (works && works.length > 0) {
      work = works[0]
    } else {
      // 尝试从generation_tasks表查询
      const tasks = await query(
        'SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
      ) as any[]
      
      if (tasks && tasks.length > 0) {
        work = tasks[0]
      }
    }
    
    if (!work) {
      return error(res, '作品不存在', 404)
    }
    
    if (work.status !== 'completed') {
      return error(res, '作品尚未完成，无法下载', 400)
    }
    
    // 返回下载URL，前端可以直接下载
    success(res, {
      download_url: work.result_url,
      filename: work.title || `work_${work.id}.${work.work_type === 'video' ? 'mp4' : 'png'}`,
    })
  } catch (err: any) {
    console.error('获取下载链接错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 分享作品（生成分享链接并增加分享数）
export async function shareWork(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    // 先尝试从works表查询
    const works = await query(
      'SELECT * FROM works WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as Work[]
    
    let work: any = null
    if (works && works.length > 0) {
      work = works[0]
    } else {
      // 尝试从generation_tasks表查询
      const tasks = await query(
        'SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
      ) as any[]
      
      if (tasks && tasks.length > 0) {
        work = tasks[0]
      }
    }
    
    if (!work) {
      return error(res, '作品不存在', 404)
    }
    
    if (work.status !== 'completed') {
      return error(res, '作品尚未完成，无法分享', 400)
    }
    
    // 如果是works表的记录，增加分享数
    if (works && works.length > 0) {
      await run(
        'UPDATE works SET share_count = share_count + 1 WHERE id = ?',
        [id]
      )
    }
    
    // 生成分享链接
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/square?work=${id}`
    
    success(res, {
      share_url: shareUrl,
      message: '分享成功',
    })
  } catch (err: any) {
    console.error('分享作品错误:', err)
    error(res, err.message || '分享失败', 500)
  }
}

// 批量删除作品
export async function batchDeleteWorks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, '请选择要删除的作品', 400)
    }
    
    let deletedCount = 0
    
    // 批量删除 works 表中的记录
    for (const id of ids) {
      const result = await run(
        'DELETE FROM works WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
      )
      if ((result as any).changes > 0 || (result as any).affectedRows > 0) {
        deletedCount++
      } else {
        // 尝试删除 generation_tasks 表中的记录
        const taskResult = await run(
          'DELETE FROM generation_tasks WHERE id = ? AND user_id = ?',
          [id, req.user.userId]
        )
        if ((taskResult as any).changes > 0 || (taskResult as any).affectedRows > 0) {
          deletedCount++
        }
      }
    }
    
    success(res, { deletedCount }, `成功删除 ${deletedCount} 个作品`)
  } catch (err: any) {
    console.error('批量删除作品错误:', err)
    error(res, err.message || '批量删除失败', 500)
  }
}

// 批量下载作品
export async function batchDownloadWorks(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return error(res, '请选择要下载的作品', 400)
    }
    
    const downloadList: Array<{ id: number; url: string; filename: string }> = []
    
    // 批量查询作品
    for (const id of ids) {
      // 先尝试从 works 表查询
      const works = await query(
        'SELECT * FROM works WHERE id = ? AND user_id = ?',
        [id, req.user.userId]
      ) as Work[]
      
      let work: any = null
      if (works && works.length > 0) {
        work = works[0]
      } else {
        // 尝试从 generation_tasks 表查询
        const tasks = await query(
          'SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?',
          [id, req.user.userId]
        ) as any[]
        
        if (tasks && tasks.length > 0) {
          work = tasks[0]
        }
      }
      
      if (work && work.status === 'completed' && work.result_url) {
        downloadList.push({
          id: work.id,
          url: work.result_url,
          filename: work.title || `work_${work.id}.${work.work_type === 'video' ? 'mp4' : 'png'}`,
        })
      }
    }
    
    success(res, { downloads: downloadList }, `找到 ${downloadList.length} 个可下载的作品`)
  } catch (err: any) {
    console.error('批量下载作品错误:', err)
    error(res, err.message || '批量下载失败', 500)
  }
}
