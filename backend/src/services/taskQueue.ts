import { query, run } from '../db/connection'
import { getAvailableAIConfig, callImageGenerationAPI, callVideoGenerationAPI, pollVideoTaskStatus } from './aiService'
import { downloadAndSaveImage, downloadAndSaveVideo } from '../utils/imageDownloader'
import { writeLog } from '../utils/logger'

interface GenerationTask {
  id: number
  user_id: number
  task_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  model_provider?: string
  model_name?: string
  prompt: string
  negative_prompt?: string
  source_image_url?: string
  parameters?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result_url?: string
  error_message?: string
  api_response?: string
}

let isProcessing = false
let processingInterval: NodeJS.Timeout | null = null

/**
 * 处理单个任务
 */
async function processTask(task: GenerationTask): Promise<void> {
  try {
    console.log(`开始处理任务 ${task.id}: ${task.task_type}`)

    // 更新状态为processing
    await run(
      `UPDATE generation_tasks 
       SET status = 'processing', progress = 10, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [task.id]
    )

    // 获取可用的AI配置
    const aiConfig = await getAvailableAIConfig(task.task_type, task.model_name)

    if (!aiConfig) {
      throw new Error('没有可用的AI服务配置')
    }

    // 如果任务没有model_name，但AI配置有明确的模型标识，更新任务的model_name
    if (!task.model_name && aiConfig.provider_name) {
      const providerNameLower = aiConfig.provider_name.toLowerCase()
      let detectedModel: string | null = null
      
      if (providerNameLower.includes('sora')) {
        detectedModel = 'sora'
      } else if (providerNameLower.includes('veo')) {
        detectedModel = 'veo'
      }
      
      if (detectedModel) {
        await run(
          'UPDATE generation_tasks SET model_name = ? WHERE id = ?',
          [detectedModel, task.id]
        )
        task.model_name = detectedModel
      }
    }

    console.log(`使用AI服务: ${aiConfig.provider_name} (${aiConfig.provider_type}), 模型: ${task.model_name || 'auto'}`)

    // 解析parameters
    let params: any = {}
    if (task.parameters) {
      try {
        params = typeof task.parameters === 'string' ? JSON.parse(task.parameters) : task.parameters
      } catch {
        params = {}
      }
    }

    // 根据任务类型调用不同的API
    let result: { success: boolean; resultUrl?: string; taskId?: string; error?: string }
    
    if (task.task_type === 'text2img' || task.task_type === 'img2img') {
      // 图片生成
      result = await callImageGenerationAPI(aiConfig, {
        id: task.id,
        task_type: task.task_type,
        model_name: task.model_name,
        prompt: task.prompt,
        negative_prompt: task.negative_prompt,
        source_image_url: task.source_image_url,
        parameters: params,
      })

      if (result.success && result.resultUrl) {
        // 下载并保存图片到本地服务器
        writeLog(`任务 ${task.id} 图片生成成功，开始下载到本地`, {
          taskId: task.id,
          originalUrl: result.resultUrl.substring(0, 100) + (result.resultUrl.length > 100 ? '...' : ''),
          provider: aiConfig.provider_name
        })
        
        const localImageUrl = await downloadAndSaveImage(result.resultUrl)
        
        writeLog(`任务 ${task.id} 图片已保存到本地`, {
          taskId: task.id,
          localUrl: localImageUrl,
          originalUrl: result.resultUrl.substring(0, 100) + (result.resultUrl.length > 100 ? '...' : '')
        })

        // 图片生成完成，保存本地URL
        await run(
          `UPDATE generation_tasks 
           SET status = 'completed', progress = 100, result_url = ?, 
               api_response = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [localImageUrl, JSON.stringify({ provider: aiConfig.provider_name, original_url: result.resultUrl }), task.id]
        )

        // 创建作品记录（使用本地URL）
        await createWorkFromTask(task, localImageUrl)

        writeLog(`任务 ${task.id} 完成`, {
          taskId: task.id,
          localUrl: localImageUrl,
          workType: 'image'
        })
      } else {
        writeLog(`任务 ${task.id} 图片生成失败`, {
          taskId: task.id,
          error: result.error || '未知错误',
          provider: aiConfig.provider_name
        })
        throw new Error(result.error || '图片生成失败')
      }
    } else {
      // 视频生成（异步）
      result = await callVideoGenerationAPI(aiConfig, {
        id: task.id,
        task_type: task.task_type,
        model_name: task.model_name,
        prompt: task.prompt,
        negative_prompt: task.negative_prompt,
        source_image_url: task.source_image_url,
        parameters: params,
      })

      if (result.success && result.taskId) {
        // 视频生成是异步的，保存任务ID用于后续轮询
        await run(
          `UPDATE generation_tasks 
           SET progress = 30, api_response = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [JSON.stringify({ 
            provider: aiConfig.provider_name, 
            task_id: result.taskId,
            api_url: aiConfig.api_url 
          }), task.id]
        )

        console.log(`任务 ${task.id} 已提交到AI服务，任务ID: ${result.taskId}`)
        // 视频任务需要后续轮询，这里不标记为完成
      } else {
        throw new Error(result.error || '视频生成任务创建失败')
      }
    }
  } catch (err: any) {
    console.error(`处理任务 ${task.id} 失败:`, err)
    await run(
      `UPDATE generation_tasks 
       SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [err.message || '处理失败', task.id]
    )
  }
}

/**
 * 轮询视频任务状态
 */
async function pollVideoTask(task: GenerationTask): Promise<void> {
  try {
    if (!task.api_response) return

    const apiResponse = JSON.parse(task.api_response)
    const taskId = apiResponse.task_id
    const providerName = apiResponse.provider

    if (!taskId || !providerName) {
      writeLog(`任务 ${task.id} 轮询跳过：缺少task_id或provider`, {
        taskId: task.id,
        hasTaskId: !!taskId,
        hasProvider: !!providerName,
      })
      return
    }

    // 获取AI配置（根据baseUrl判断，不严格匹配provider_name）
    const aiConfig = await getAvailableAIConfig(task.task_type, task.model_name)
    if (!aiConfig) {
      writeLog(`任务 ${task.id} 轮询跳过：无法获取AI配置`, {
        taskId: task.id,
        taskType: task.task_type,
        modelName: task.model_name,
      })
      return
    }

    // 检查是否是同一个服务商（通过provider_name或api_url判断）
    const configProviderLower = aiConfig.provider_name.toLowerCase()
    const taskProviderLower = providerName.toLowerCase()
    const baseUrlLower = (aiConfig.api_url || '').toLowerCase()
    
    if (configProviderLower !== taskProviderLower && 
        !configProviderLower.includes('apixpro') && 
        !baseUrlLower.includes('apixpro.com')) {
      writeLog(`任务 ${task.id} 轮询跳过：服务商不匹配`, {
        taskId: task.id,
        configProvider: aiConfig.provider_name,
        taskProvider: providerName,
      })
      return
    }

    writeLog(`任务 ${task.id} 开始轮询视频任务状态`, {
      taskId: task.id,
      apiTaskId: taskId,
      provider: providerName,
      configProvider: aiConfig.provider_name,
    })

    // 轮询任务状态
    const pollResult = await pollVideoTaskStatus(aiConfig, taskId)

    if (pollResult.success && pollResult.status === 'completed' && pollResult.resultUrl) {
      // 视频生成完成
      writeLog(`任务 ${task.id} 视频生成完成，开始下载到本地`, {
        taskId: task.id,
        apiTaskId: taskId,
        originalUrl: pollResult.resultUrl.substring(0, 100) + (pollResult.resultUrl.length > 100 ? '...' : ''),
      })
      
      // 下载并保存视频到本地服务器
      const localVideoUrl = await downloadAndSaveVideo(pollResult.resultUrl)
      
      writeLog(`任务 ${task.id} 视频已保存到本地`, {
        taskId: task.id,
        localUrl: localVideoUrl,
        originalUrl: pollResult.resultUrl.substring(0, 100) + (pollResult.resultUrl.length > 100 ? '...' : '')
      })
      
      await run(
        `UPDATE generation_tasks 
         SET status = 'completed', progress = 100, result_url = ?, 
             api_response = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [localVideoUrl, JSON.stringify({ provider: aiConfig.provider_name, original_url: pollResult.resultUrl }), task.id]
      )

      // 创建作品记录（使用本地URL）
      await createWorkFromTask(task, localVideoUrl)

      writeLog(`任务 ${task.id} 已创建作品记录`, {
        taskId: task.id,
        localUrl: localVideoUrl,
      })
    } else if (pollResult.status === 'failed' || !pollResult.success) {
      // 任务失败
      writeLog(`任务 ${task.id} 视频生成失败`, {
        taskId: task.id,
        apiTaskId: taskId,
        error: pollResult.error || '视频生成失败',
      })
      
      await run(
        `UPDATE generation_tasks 
         SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [pollResult.error || '视频生成失败', task.id]
      )
    } else {
      // 仍在处理中，更新进度
      // 优先使用API返回的进度，如果没有则递增
      let newProgress: number
      if (pollResult.progress !== undefined && pollResult.progress !== null) {
        newProgress = Math.min(Math.max(pollResult.progress, 0), 100)
      } else {
        // 如果没有返回进度，递增当前进度
        newProgress = Math.min(task.progress + 10, 90)
      }
      
      writeLog(`任务 ${task.id} 视频生成中，更新进度`, {
        taskId: task.id,
        apiTaskId: taskId,
        oldProgress: task.progress,
        newProgress: newProgress,
        apiProgress: pollResult.progress,
        status: pollResult.status,
      })
      
      await run(
        `UPDATE generation_tasks 
         SET progress = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newProgress, task.id]
      )
    }
  } catch (err: any) {
    console.error(`轮询视频任务 ${task.id} 失败:`, err)
  }
}

/**
 * 从任务创建作品记录
 */
async function createWorkFromTask(task: GenerationTask, resultUrl: string): Promise<void> {
  try {
    const params = task.parameters ? (typeof task.parameters === 'string' ? JSON.parse(task.parameters) : task.parameters) : {}
    
    const workType = (task.task_type === 'text2img' || task.task_type === 'img2img') ? 'image' : 'video'
    
    // 计算文件大小和尺寸（如果是图片）
    let fileSize: number | null = null
    let width: number | null = null
    let height: number | null = null
    let duration: number | null = null

    if (params.width) width = params.width
    if (params.height) height = params.height
    if (params.duration) duration = params.duration

    const result = await run(
      `INSERT INTO works 
       (user_id, work_type, content_type, model_name, prompt, negative_prompt, 
        source_image_url, result_url, status, computing_power_used, width, height, duration, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?)`,
      [
        task.user_id,
        workType,
        task.task_type,
        task.model_name || null,
        task.prompt,
        task.negative_prompt || null,
        task.source_image_url || null,
        resultUrl,
        50, // 默认消耗50算力
        width,
        height,
        duration,
        task.created_at, // 使用任务的创建时间作为作品的创建时间
      ]
    )

    const workId = (result as any).lastID || (result as any).insertId

    // 更新任务的work_id
    await run(
      'UPDATE generation_tasks SET work_id = ? WHERE id = ?',
      [workId, task.id]
    )

    // TODO: 扣除用户算力
    // await deductComputingPower(task.user_id, 50)

    console.log(`已创建作品记录: work_id=${workId}, task_id=${task.id}`)
  } catch (err: any) {
    console.error('创建作品记录失败:', err)
  }
}

/**
 * 处理待处理的任务
 */
async function processPendingTasks(): Promise<void> {
  if (isProcessing) {
    return
  }

  isProcessing = true

  try {
    // 获取pending状态的任务（按创建时间排序）
    const pendingTasks = await query(
      `SELECT * FROM generation_tasks 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 5`,
      []
    ) as GenerationTask[]

    for (const task of pendingTasks) {
      await processTask(task)
    }

    // 获取processing状态的视频任务（需要轮询）
    const processingVideoTasks = await query(
      `SELECT * FROM generation_tasks 
       WHERE status = 'processing' 
       AND task_type IN ('text2video', 'img2video')
       AND api_response IS NOT NULL
       ORDER BY updated_at ASC 
       LIMIT 10`,
      []
    ) as GenerationTask[]

    if (processingVideoTasks.length > 0) {
      writeLog(`发现 ${processingVideoTasks.length} 个处理中的视频任务，开始轮询`, {
        taskIds: processingVideoTasks.map(t => t.id),
      })
    }

    for (const task of processingVideoTasks) {
      await pollVideoTask(task)
    }
  } catch (err: any) {
    console.error('处理任务队列错误:', err)
  } finally {
    isProcessing = false
  }
}

/**
 * 启动任务队列处理器
 */
export function startTaskQueue(): void {
  console.log('启动任务队列处理器...')

  // 立即处理一次
  processPendingTasks()

  // 每5秒处理一次
  processingInterval = setInterval(() => {
    processPendingTasks()
  }, 5000)

  console.log('任务队列处理器已启动（每5秒检查一次）')
}

/**
 * 停止任务队列处理器
 */
export function stopTaskQueue(): void {
  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
    console.log('任务队列处理器已停止')
  }
}
