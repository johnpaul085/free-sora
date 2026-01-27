import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'
import { v4 as uuidv4 } from 'uuid'

// 获取可用的图片模型列表（公开接口）
export async function getImageModels(req: Request, res: Response) {
  try {
    // 查询启用的、图片类型的配置，按优先级排序
    const configs = await query(
      `SELECT id, provider_name, models, is_active, priority 
       FROM ai_configs 
       WHERE provider_type = 'image' AND is_active = 1 AND api_key IS NOT NULL AND api_key != ''
       ORDER BY priority DESC, created_at DESC`,
      []
    ) as any[]

    // 收集所有模型
    const allModels: string[] = []
    const modelMap: Record<string, { provider: string; models: string[] }> = {}

    for (const config of configs) {
      let models: string[] = []
      if (config.models) {
        try {
          models = typeof config.models === 'string' ? JSON.parse(config.models) : config.models
        } catch {
          models = []
        }
      }

      if (models.length > 0) {
        for (const model of models) {
          if (!allModels.includes(model)) {
            allModels.push(model)
          }
        }
        modelMap[config.provider_name] = {
          provider: config.provider_name,
          models,
        }
      } else {
        // 如果没有配置模型列表，使用服务商名称作为模型
        if (!allModels.includes(config.provider_name)) {
          allModels.push(config.provider_name)
        }
        modelMap[config.provider_name] = {
          provider: config.provider_name,
          models: [config.provider_name],
        }
      }
    }

    success(res, {
      models: allModels,
      providers: Object.values(modelMap),
    })
  } catch (err: any) {
    console.error('获取图片模型列表错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 创建生成任务
export async function createGenerationTask(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const {
      task_type,
      model_provider,
      model_name,
      prompt,
      negative_prompt,
      source_image_url,
      parameters,
    } = req.body
    
    if (!task_type || !prompt) {
      return error(res, '任务类型和提示词不能为空', 400)
    }
    
    if (!['text2img', 'img2img', 'text2video', 'img2video'].includes(task_type)) {
      return error(res, '无效的任务类型', 400)
    }
    
    // TODO: 检查算力是否足够
    // TODO: 扣除算力
    
    // 创建任务
    const result = await run(
      `INSERT INTO generation_tasks 
       (user_id, task_type, model_provider, model_name, prompt, negative_prompt, source_image_url, parameters, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.userId,
        task_type,
        model_provider || null,
        model_name || null,
        prompt,
        negative_prompt || null,
        source_image_url || null,
        parameters ? JSON.stringify(parameters) : null,
      ]
    )
    
    const taskId = (result as any).lastID
    
    // 任务已创建，后台队列处理器会自动处理
    // 不需要在这里等待，立即返回给用户
    
    success(res, {
      id: taskId,
      status: 'pending',
    }, '任务已创建，正在后台处理中...')
  } catch (err: any) {
    console.error('创建生成任务错误:', err)
    error(res, err.message || '创建失败', 500)
  }
}

// 获取任务状态
export async function getTaskStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    const tasks = await query(
      'SELECT * FROM generation_tasks WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    ) as any[]
    
    if (!tasks || tasks.length === 0) {
      return error(res, '任务不存在', 404)
    }
    
    const task = tasks[0]
    
    // 解析parameters
    if (task.parameters) {
      try {
        task.parameters = JSON.parse(task.parameters)
      } catch (e) {
        // 忽略解析错误
      }
    }
    
    success(res, task)
  } catch (err: any) {
    console.error('获取任务状态错误:', err)
    error(res, err.message || '获取失败', 500)
  }
}

// 取消任务
export async function cancelTask(req: Request, res: Response) {
  try {
    if (!req.user) {
      return error(res, '未认证', 401)
    }
    
    const { id } = req.params
    
    const result = await run(
      `UPDATE generation_tasks 
       SET status = 'failed', error_message = '用户取消', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ? AND status IN ('pending', 'processing')`,
      [id, req.user.userId]
    )
    
    if ((result as any).changes === 0) {
      return error(res, '任务不存在或无法取消', 404)
    }
    
    success(res, null, '任务已取消')
  } catch (err: any) {
    console.error('取消任务错误:', err)
    error(res, err.message || '取消失败', 500)
  }
}
