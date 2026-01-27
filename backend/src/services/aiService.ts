import { query } from '../db/connection'
import { config } from '../config'
import { logApiCall, writeLog } from '../utils/logger'

interface AIConfig {
  id: number
  provider_name: string
  provider_type: 'image' | 'video' | 'assistant'
  api_key: string
  api_url?: string
  models?: string[]
  is_active: boolean
  priority: number
  rate_limit?: number
  config?: any
}

interface GenerationTask {
  id: number
  task_type: 'text2img' | 'img2img' | 'text2video' | 'img2video'
  model_name?: string
  prompt: string
  negative_prompt?: string
  source_image_url?: string
  parameters?: any
}

/**
 * 获取可用的AI服务配置
 * @param taskType 任务类型
 * @param modelName 可选的模型名（如果指定，会优先匹配包含该模型名的配置）
 */
export async function getAvailableAIConfig(
  taskType: 'text2img' | 'img2img' | 'text2video' | 'img2video',
  modelName?: string
): Promise<AIConfig | null> {
  try {
    // 确定需要的provider_type
    let providerType: 'image' | 'video'
    if (taskType === 'text2img' || taskType === 'img2img') {
      providerType = 'image'
    } else {
      providerType = 'video'
    }

    // 查询启用的、匹配类型的配置，按优先级排序
    const configs = await query(
      `SELECT * FROM ai_configs 
       WHERE provider_type = ? AND is_active = 1 AND api_key IS NOT NULL AND api_key != ''
       ORDER BY priority DESC, created_at DESC`,
      [providerType]
    ) as AIConfig[]

    if (!configs || configs.length === 0) {
      return null
    }

    // 如果指定了模型名，尝试匹配包含该模型名的配置
    if (modelName) {
      const modelNameLower = modelName.toLowerCase()
      for (const cfg of configs) {
        // 解析models字段
        let models: string[] = []
        if (cfg.models) {
          try {
            models = typeof cfg.models === 'string' ? JSON.parse(cfg.models) : cfg.models
          } catch {
            models = []
          }
        }

        // 检查服务商名称或模型列表是否包含指定模型名
        // 例如：modelName='sora' 匹配 provider_name包含'sora'或models包含'sora'
        const providerNameLower = cfg.provider_name.toLowerCase()
        const hasModelInName = providerNameLower.includes(modelNameLower) || modelNameLower.includes(providerNameLower)
        const hasModelInList = models.length === 0 || models.some(m => 
          m.toLowerCase().includes(modelNameLower) || 
          modelNameLower.includes(m.toLowerCase())
        )

        if (hasModelInName || hasModelInList) {
          return cfg
        }
      }
    }

    // 如果没有指定模型名或没有匹配到，返回优先级最高的配置（AI自动选择）
    return configs[0]
  } catch (err: any) {
    console.error('获取AI配置失败:', err)
    return null
  }
}

/**
 * 调用图片生成API
 */
export async function callImageGenerationAPI(
  aiConfig: AIConfig,
  task: GenerationTask
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    // 优先使用配置中的 api_url，如果没有则使用默认值
    let baseUrl = aiConfig.api_url || getDefaultApiUrl(aiConfig.provider_name)
    const apiKey = aiConfig.api_key

    if (!baseUrl || !apiKey) {
      return { success: false, error: 'API配置不完整：缺少API地址或密钥' }
    }
    
    // 确保baseUrl是有效的URL格式
    baseUrl = baseUrl.trim()
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      return { success: false, error: `API地址格式错误: ${baseUrl}，必须以http://或https://开头` }
    }

    // 解析配置中的额外配置
    let extraConfig: any = {}
    if (aiConfig.config) {
      try {
        extraConfig = typeof aiConfig.config === 'string' ? JSON.parse(aiConfig.config) : aiConfig.config
      } catch {
        extraConfig = {}
      }
    }

    const providerName = aiConfig.provider_name.toLowerCase()

    // 根据不同的服务商调用不同的API
    if (providerName.includes('stability')) {
      // Stability AI
      return await callStabilityImageAPI(baseUrl, apiKey, task, extraConfig)
    } else if (providerName.includes('apixpro')) {
      // ApixPro (OpenAI兼容)
      return await callOpenAICompatibleImageAPI(baseUrl, apiKey, task, aiConfig, extraConfig)
    } else {
      // 默认OpenAI兼容接口
      return await callOpenAICompatibleImageAPI(baseUrl, apiKey, task, aiConfig, extraConfig)
    }
  } catch (err: any) {
    console.error('调用图片生成API失败:', err)
    return { success: false, error: err.message || 'API调用失败' }
  }
}

/**
 * 调用视频生成API
 */
export async function callVideoGenerationAPI(
  aiConfig: AIConfig,
  task: GenerationTask
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    // 优先使用配置中的 api_url，如果没有则使用默认值
    let baseUrl = aiConfig.api_url || getDefaultApiUrl(aiConfig.provider_name)
    const apiKey = aiConfig.api_key

    if (!baseUrl || !apiKey) {
      return { success: false, error: 'API配置不完整：缺少API地址或密钥' }
    }
    
    // 确保baseUrl是有效的URL格式
    baseUrl = baseUrl.trim()
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      return { success: false, error: `API地址格式错误: ${baseUrl}，必须以http://或https://开头` }
    }

    // 解析配置中的额外配置
    let extraConfig: any = {}
    if (aiConfig.config) {
      try {
        extraConfig = typeof aiConfig.config === 'string' ? JSON.parse(aiConfig.config) : aiConfig.config
      } catch {
        extraConfig = {}
      }
    }

    const providerName = aiConfig.provider_name.toLowerCase()
    const baseUrlLower = baseUrl.toLowerCase()

    // 根据不同的服务商调用不同的API
    // 检查 provider_name 或 baseUrl 是否包含 apixpro
    if (providerName.includes('apixpro') || baseUrlLower.includes('apixpro.com')) {
      // ApixPro (SORA/VEO)
      return await callApixProVideoAPI(baseUrl, apiKey, task, aiConfig, extraConfig)
    } else {
      // 默认OpenAI兼容接口（SORA）
      return await callOpenAICompatibleVideoAPI(baseUrl, apiKey, task, aiConfig, extraConfig)
    }
  } catch (err: any) {
    console.error('调用视频生成API失败:', err)
    return { success: false, error: err.message || 'API调用失败' }
  }
}

// ========== 私有辅助函数 ==========

function getDefaultApiUrl(providerName: string): string {
  const name = providerName.toLowerCase()
  if (name.includes('openai')) {
    return 'https://api.openai.com/v1'
  } else if (name.includes('anthropic') || name.includes('claude')) {
    return 'https://api.anthropic.com/v1'
  } else if (name.includes('stability')) {
    return 'https://api.stability.ai/v1'
  } else if (name.includes('apixpro')) {
    return 'https://apixpro.com'
  }
  return ''
}

// Stability AI 图片生成
async function callStabilityImageAPI(
  baseUrl: string,
  apiKey: string,
  task: GenerationTask,
  extraConfig?: any
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    const params = task.parameters || {}
    const url = `${baseUrl}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`

    const requestBody = {
      text_prompts: [
        { text: task.prompt, weight: 1 },
        ...(task.negative_prompt ? [{ text: task.negative_prompt, weight: -1 }] : []),
      ],
      cfg_scale: 7,
      height: params.height || 1024,
      width: params.width || 1024,
      samples: 1,
      steps: 30,
    }

    // 记录API调用日志
    logApiCall('image', '调用Stability AI图片生成API', {
      url,
      method: 'POST',
      baseUrl,
      apiPath: '/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      provider: 'Stability AI',
      requestBody,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000), // 60秒超时
    })

    if (!response.ok) {
      const errorText = await response.text()
      // 记录错误日志
      logApiCall('image', 'Stability AI API调用失败', {
        url,
        method: 'POST',
        baseUrl,
        apiPath: '/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        provider: 'Stability AI',
        requestBody,
        responseStatus: response.status,
        error: errorText,
      })
      return { success: false, error: `API错误: ${response.status} - ${errorText}` }
    }

    const data = await response.json() as any
    const imageUrl = data.artifacts?.[0]?.base64
      ? `data:image/png;base64,${data.artifacts[0].base64}`
      : data.artifacts?.[0]?.url

    // 记录成功日志
    logApiCall('image', 'Stability AI API调用成功', {
      url,
      method: 'POST',
      baseUrl,
      apiPath: '/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      provider: 'Stability AI',
      requestBody,
      responseStatus: response.status,
      responseData: { hasImageUrl: !!imageUrl },
    })

    if (!imageUrl) {
      return { success: false, error: 'API返回格式错误' }
    }

    return { success: true, resultUrl: imageUrl }
  } catch (err: any) {
    // 记录异常日志
    logApiCall('image', 'Stability AI API调用异常', {
      url: url || 'unknown',
      method: 'POST',
      baseUrl,
      apiPath: '/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      provider: 'Stability AI',
      error: err.message || String(err),
    })
    return { success: false, error: err.message || 'API调用失败' }
  }
}

// OpenAI兼容的图片生成API
async function callOpenAICompatibleImageAPI(
  baseUrl: string,
  apiKey: string,
  task: GenerationTask,
  aiConfig?: AIConfig,
  extraConfig?: any
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    const params = task.parameters || {}
    
    // 确定使用的模型：优先使用任务指定的模型，其次使用配置中的第一个模型，最后使用默认值
    let useModel = task.model_name
    if (!useModel && aiConfig?.models) {
      let models: string[] = []
      try {
        models = typeof aiConfig.models === 'string' ? JSON.parse(aiConfig.models) : aiConfig.models
      } catch {
        models = []
      }
      if (models.length > 0) {
        useModel = models[0]
      }
    }
    useModel = useModel || 'dall-e-3'
    
    // 构建API路径：确保不重复添加/v1
    let normalizedUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
    let apiPath = '/images/generations'
    
    // 检查baseUrl是否已经包含/v1
    if (normalizedUrl.endsWith('/v1')) {
      // baseUrl已经是 .../v1，直接使用/images/generations
      apiPath = '/images/generations'
    } else if (normalizedUrl.includes('/v1/')) {
      // baseUrl包含/v1/但不在末尾，直接使用/images/generations
      apiPath = '/images/generations'
    } else {
      // baseUrl不包含/v1，需要添加/v1前缀
      apiPath = '/v1/images/generations'
    }
    
    const url = `${normalizedUrl}${apiPath}`

    const requestBody: any = {
      model: useModel,
      prompt: task.prompt,
      n: 1,
      size: params.width && params.height 
        ? `${params.width}x${params.height}`
        : '1024x1024',
      quality: 'standard',
    }
    
    // 合并额外配置
    if (extraConfig) {
      Object.assign(requestBody, extraConfig)
    }

    // 记录API调用日志
    logApiCall('image', '调用图片生成API', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      requestBody,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // 记录错误日志
      logApiCall('image', 'API调用失败', {
        url,
        method: 'POST',
        baseUrl,
        apiPath,
        model: useModel,
        provider: aiConfig?.provider_name || 'unknown',
        requestBody,
        responseStatus: response.status,
        error: errorText,
      })
      return { success: false, error: `API错误: ${response.status} - ${errorText}` }
    }

    const data = await response.json() as any
    
    // 记录完整响应数据用于调试
    logApiCall('image', 'API响应数据', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      responseStatus: response.status,
      responseData: data,
    })
    
    // 优先使用URL，如果没有URL则使用base64数据
    let imageUrl: string | null = null
    if (data.data?.[0]?.url) {
      imageUrl = data.data[0].url
      logApiCall('image', '使用URL格式', {
        url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
      })
    } else if (data.data?.[0]?.b64_json) {
      imageUrl = `data:image/png;base64,${data.data[0].b64_json}`
      logApiCall('image', '使用base64格式', {
        base64Length: data.data[0].b64_json?.length || 0,
      })
    } else {
      // 检查其他可能的字段名
      if (data.url) {
        imageUrl = data.url
        logApiCall('image', '使用根级URL字段', {
          url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        })
      } else if (data.image_url) {
        imageUrl = data.image_url
        logApiCall('image', '使用image_url字段', {
          url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        })
      } else if (data.result_url) {
        imageUrl = data.result_url
        logApiCall('image', '使用result_url字段', {
          url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        })
      }
    }

    // 记录成功日志
    logApiCall('image', 'API调用成功', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      requestBody,
      responseStatus: response.status,
      responseData: { 
        hasImageUrl: !!imageUrl,
        imageUrlType: imageUrl ? (imageUrl.startsWith('data:') ? 'base64' : 'url') : 'null'
      },
    })

    if (!imageUrl) {
      return { success: false, error: 'API返回格式错误' }
    }

    return { success: true, resultUrl: imageUrl }
  } catch (err: any) {
    // 记录异常日志
    logApiCall('image', 'API调用异常', {
      url: url || 'unknown',
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      error: err.message || String(err),
    })
    return { success: false, error: err.message || 'API调用失败' }
  }
}

// ApixPro 视频生成API
async function callApixProVideoAPI(
  baseUrl: string,
  apiKey: string,
  task: GenerationTask,
  aiConfig?: AIConfig,
  extraConfig?: any
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    // 解析parameters（可能是字符串或对象）
    let params: any = {}
    if (task.parameters) {
      try {
        params = typeof task.parameters === 'string' ? JSON.parse(task.parameters) : task.parameters
      } catch {
        params = {}
      }
    }
    
    // 确定使用的模型：优先使用配置中的模型，如果配置中有模型列表，使用第一个；否则使用任务指定的模型
    let useModel: string | undefined
    let models: string[] = []
    
    // 解析配置中的模型列表
    if (aiConfig?.models) {
      try {
        models = typeof aiConfig.models === 'string' ? JSON.parse(aiConfig.models) : aiConfig.models
      } catch {
        models = []
      }
    }
    
    // 判断是否是VEO模型（模型名称包含 "veo"）
    const isVeo = models.length > 0 && models[0]?.toLowerCase().includes('veo') || 
                  task.model_name?.toLowerCase().includes('veo') || false
    
    // VEO模型需要根据任务类型和宽高比自动选择正确的模型
    if (isVeo) {
      // 获取宽高比
      let aspectRatio = params.aspectRatio || '16:9'
      const isPortrait = aspectRatio === '9:16'
      const orientation = isPortrait ? 'portrait' : 'landscape'
      
      // 判断任务类型
      const isText2Video = task.task_type === 'text2video'
      const isImage2Video = task.task_type === 'img2video'
      const hasSourceImage = !!task.source_image_url
      
      // 根据任务类型选择模型
      if (isText2Video && !hasSourceImage) {
        // 文生视频：使用 t2v 模型
        useModel = `veo_3_1_t2v_fast_${orientation}`
        writeLog('VEO自动选择模型：文生视频', {
          taskType: task.task_type,
          aspectRatio,
          orientation,
          selectedModel: useModel,
        })
      } else if (isImage2Video || hasSourceImage) {
        // 图生视频：使用 i2v 模型（优先使用较新的版本）
        useModel = `veo_3_1_i2v_s_fast_fl_${orientation}`
        writeLog('VEO自动选择模型：图生视频', {
          taskType: task.task_type,
          hasSourceImage,
          aspectRatio,
          orientation,
          selectedModel: useModel,
        })
      } else {
        // 如果配置中有模型，尝试从配置中选择匹配的模型
        if (models.length > 0) {
          // 尝试找到匹配任务类型和宽高比的模型
          const taskTypePattern = isText2Video ? 't2v' : 'i2v'
          const matchedModel = models.find(m => 
            m.toLowerCase().includes(taskTypePattern) && 
            m.toLowerCase().includes(orientation)
          )
          if (matchedModel) {
            useModel = matchedModel
            writeLog('VEO从配置中选择匹配的模型', {
              taskType: task.task_type,
              aspectRatio,
              orientation,
              selectedModel: useModel,
            })
          } else {
            // 如果找不到匹配的，使用第一个模型
            useModel = models[0]
            writeLog('VEO使用配置中的第一个模型（未找到完全匹配）', {
              taskType: task.task_type,
              aspectRatio,
              orientation,
              selectedModel: useModel,
            })
          }
        } else {
          // 默认使用文生视频模型
          useModel = `veo_3_1_t2v_fast_${orientation}`
          writeLog('VEO使用默认模型', {
            taskType: task.task_type,
            aspectRatio,
            orientation,
            selectedModel: useModel,
          })
        }
      }
    } else {
      // 非VEO模型：优先使用配置中的第一个模型
      if (models.length > 0) {
        useModel = models[0]
      } else if (task.model_name) {
        // 如果配置中没有模型列表，使用任务指定的模型
        useModel = task.model_name
      } else {
        // 最后使用默认值
        useModel = 'sora-2'
      }
    }
    
    // 构建API路径：ApixPro使用/videos，不是/videos/generations
    let normalizedUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
    let apiPath = '/videos'
    
    // 检查baseUrl是否已经包含/v1
    if (normalizedUrl.endsWith('/v1')) {
      // baseUrl已经是 .../v1，直接使用/videos
      apiPath = '/videos'
    } else if (normalizedUrl.includes('/v1/')) {
      // baseUrl包含/v1/但不在末尾，直接使用/videos
      apiPath = '/videos'
    } else {
      // baseUrl不包含/v1，需要添加/v1前缀
      apiPath = '/v1/videos'
    }
    
    const url = `${normalizedUrl}${apiPath}`
    
    const requestBody: any = {
      model: useModel,
      prompt: task.prompt,
    }
    
    // VEO模型需要使用Google Veo API格式
    if (isVeo) {
      // 优先使用前端传递的aspectRatio参数
      // 如果没有传递，则根据模型名称判断宽高比
      // landscape -> 16:9, portrait -> 9:16
      let aspectRatio = params.aspectRatio || '16:9' // 默认横屏
      if (!params.aspectRatio) {
        // 如果前端没有传递，则根据模型名称判断
        if (useModel?.toLowerCase().includes('portrait')) {
          aspectRatio = '9:16'
        } else if (useModel?.toLowerCase().includes('landscape')) {
          aspectRatio = '16:9'
        }
      }
      
      // 确保durationSeconds是4、6或8
      let durationSeconds = params.duration || 8
      // 转换为数字（可能是字符串）
      durationSeconds = Number(durationSeconds)
      if (isNaN(durationSeconds) || durationSeconds <= 0) {
        durationSeconds = 8
      }
      if (![4, 6, 8].includes(durationSeconds)) {
        // 如果不是有效值，取最接近的值
        if (durationSeconds < 5) {
          durationSeconds = 4
        } else if (durationSeconds < 7) {
          durationSeconds = 6
        } else {
          durationSeconds = 8
        }
      }
      
      // 构建metadata对象（按照Google Veo API规范）
      const metadata: any = {
        aspectRatio: aspectRatio,
        durationSeconds: durationSeconds,
      }
      
      // 添加负面提示词（如果有）
      if (task.negative_prompt) {
        metadata.negativePrompt = task.negative_prompt
      }
      
      // 图生视频：如果有源图片，添加到images数组（base64编码）
      // 注意：当前实现中，source_image_url是URL，需要转换为base64
      // 暂时先不处理，如果需要可以后续添加图片下载和base64转换逻辑
      if (task.source_image_url) {
        // TODO: 将图片URL下载并转换为base64，添加到images数组
        // requestBody.images = [base64Image]
      }
      
      // 将metadata添加到请求体
      requestBody.metadata = metadata
      
      writeLog('VEO模型参数构建（Google Veo API格式）', {
        model: useModel,
        isVeo: true,
        aspectRatio,
        durationSeconds: metadata.durationSeconds,
        hasNegativePrompt: !!task.negative_prompt,
        hasSourceImage: !!task.source_image_url,
        rawParams: task.parameters,
        parsedParams: params,
        requestBody: JSON.stringify(requestBody, null, 2),
      })
    } else {
      // SORA模型使用简单格式
      // 确保duration是数字类型，支持10或15秒
      let duration = params.duration || 10
      duration = Number(duration)
      if (isNaN(duration) || duration <= 0) {
        duration = 10
      }
      // SORA支持10秒或15秒，如果不是这两个值，取最接近的值
      if (duration !== 10 && duration !== 15) {
        duration = duration <= 12 ? 10 : 15
      }
      requestBody.duration = duration
      
      writeLog('SORA模型参数构建', {
        model: useModel,
        isVeo: false,
        rawDuration: params.duration,
        parsedDuration: duration,
        finalDuration: requestBody.duration,
        rawParams: task.parameters,
        parsedParams: params,
      })
    }
    
    // 合并额外配置
    if (extraConfig) {
      Object.assign(requestBody, extraConfig)
    }

    // 记录API调用日志
    logApiCall('video', '调用ApixPro视频生成API', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'ApixPro',
      requestBody,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // 记录错误日志
      logApiCall('video', 'ApixPro API调用失败', {
        url,
        method: 'POST',
        baseUrl,
        apiPath,
        model: useModel,
        provider: aiConfig?.provider_name || 'ApixPro',
        requestBody,
        responseStatus: response.status,
        error: errorText,
      })
      return { success: false, error: `API错误: ${response.status} - ${errorText}` }
    }

    const data = await response.json() as any
    const taskId = data.task_id || data.id

    // 记录成功日志
    logApiCall('video', 'ApixPro API调用成功', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'ApixPro',
      requestBody,
      responseStatus: response.status,
      responseData: data,
    })

    if (!taskId) {
      return { success: false, error: 'API未返回任务ID' }
    }

    // 返回任务ID，需要后续轮询获取结果
    return { success: true, taskId: taskId.toString() }
  } catch (err: any) {
    // 记录异常日志
    logApiCall('video', 'ApixPro API调用异常', {
      url: url || 'unknown',
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'ApixPro',
      error: err.message || String(err),
    })
    return { success: false, error: err.message || 'API调用失败' }
  }
}

// OpenAI兼容的视频生成API（SORA）
async function callOpenAICompatibleVideoAPI(
  baseUrl: string,
  apiKey: string,
  task: GenerationTask,
  aiConfig?: AIConfig,
  extraConfig?: any
): Promise<{ success: boolean; resultUrl?: string; taskId?: string; error?: string }> {
  try {
    const params = task.parameters || {}
    
    // 确定使用的模型：优先使用配置中的模型，如果配置中有模型列表，使用第一个；否则使用任务指定的模型
    let useModel: string | undefined
    let models: string[] = []
    
    // 解析配置中的模型列表
    if (aiConfig?.models) {
      try {
        models = typeof aiConfig.models === 'string' ? JSON.parse(aiConfig.models) : aiConfig.models
      } catch {
        models = []
      }
    }
    
    // 优先使用配置中的第一个模型
    if (models.length > 0) {
      useModel = models[0]
    } else if (task.model_name) {
      // 如果配置中没有模型列表，使用任务指定的模型
      useModel = task.model_name
    } else {
      // 最后使用默认值
      useModel = 'sora'
    }
    
    // 构建API路径：确保不重复添加/v1
    let normalizedUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
    let apiPath = '/videos/generations'
    
    // 检查baseUrl是否已经包含/v1
    if (normalizedUrl.endsWith('/v1')) {
      // baseUrl已经是 .../v1，直接使用/videos/generations
      apiPath = '/videos/generations'
    } else if (normalizedUrl.includes('/v1/')) {
      // baseUrl包含/v1/但不在末尾，直接使用/videos/generations
      apiPath = '/videos/generations'
    } else {
      // baseUrl不包含/v1，需要添加/v1前缀
      apiPath = '/v1/videos/generations'
    }
    
    const url = `${normalizedUrl}${apiPath}`
    
    const requestBody: any = {
      model: useModel,
      prompt: task.prompt,
      duration: params.duration || 10,
      size: params.resolution === '4k' ? '1024x1792' : params.resolution === '720p' ? '1280x720' : '1920x1080',
    }
    
    // 合并额外配置
    if (extraConfig) {
      Object.assign(requestBody, extraConfig)
    }
    
    // 记录API调用日志
    logApiCall('video', '调用视频生成API', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      requestBody,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // 记录错误日志
      logApiCall('video', 'API调用失败', {
        url,
        method: 'POST',
        baseUrl,
        apiPath,
        model: useModel,
        provider: aiConfig?.provider_name || 'unknown',
        requestBody,
        responseStatus: response.status,
        error: errorText,
      })
      return { success: false, error: `API错误: ${response.status} - ${errorText}` }
    }

    const data = await response.json() as any
    const taskId = data.id || data.task_id

    // 记录成功日志
    logApiCall('video', 'API调用成功', {
      url,
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      requestBody,
      responseStatus: response.status,
      responseData: data,
    })

    if (!taskId) {
      return { success: false, error: 'API未返回任务ID' }
    }

    // 返回任务ID，需要后续轮询获取结果
    return { success: true, taskId: taskId.toString() }
  } catch (err: any) {
    // 记录异常日志
    logApiCall('video', 'API调用异常', {
      url: url || 'unknown',
      method: 'POST',
      baseUrl,
      apiPath,
      model: useModel,
      provider: aiConfig?.provider_name || 'unknown',
      error: err.message || String(err),
    })
    return { success: false, error: err.message || 'API调用失败' }
  }
}

/**
 * 轮询视频任务状态（用于异步视频生成）
 */
export async function pollVideoTaskStatus(
  aiConfig: AIConfig,
  taskId: string
): Promise<{ success: boolean; resultUrl?: string; status?: string; progress?: number; error?: string }> {
  try {
    const baseUrl = aiConfig.api_url || getDefaultApiUrl(aiConfig.provider_name)
    const apiKey = aiConfig.api_key
    const providerName = aiConfig.provider_name.toLowerCase()

    if (providerName.includes('apixpro') || baseUrl.toLowerCase().includes('apixpro.com')) {
      // ApixPro任务查询
      let normalizedUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
      const url = `${normalizedUrl}/v1/videos/${taskId}`
      
      writeLog('开始轮询ApixPro任务状态', {
        url,
        taskId,
        provider: aiConfig.provider_name || 'ApixPro',
      })
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        writeLog('ApixPro轮询失败', {
          url,
          taskId,
          responseStatus: response.status,
          error: errorText,
        })
        return { success: false, error: `查询失败: ${response.status} - ${errorText}` }
      }

      const data = await response.json() as any
      
      writeLog('ApixPro轮询响应', {
        url,
        taskId,
        responseData: data,
      })
      
      // ApixPro的响应格式可能有多种：
      // 1. 直接格式：{ status: 'completed', video_url: '...' }
      // 2. 嵌套格式：{ status: 'SUCCESS', data: { status: 'completed', choices: [{ message: { content: '{"video_url":"..."}' } }] } }
      // 3. 嵌套格式：{ status: 'completed', data: { choices: [{ message: { content: '{"video_url":"..."}' } }] } }
      
      let videoUrl: string | null = null
      let actualStatus: string = data.status || 'processing'
      let actualProgress: number | undefined
      
      // 检查顶层status
      if (data.status === 'SUCCESS' || data.status === 'succeeded' || data.status === 'completed') {
        actualStatus = 'completed'
      } else if (data.status === 'failed' || data.status === 'FAILED') {
        actualStatus = 'failed'
      }
      
      // 检查data.status（嵌套格式）
      if (data.data?.status === 'completed' || data.data?.status === 'succeeded') {
        actualStatus = 'completed'
      } else if (data.data?.status === 'failed') {
        actualStatus = 'failed'
      }
      
      // 解析进度
      if (data.progress !== undefined && data.progress !== null) {
        if (typeof data.progress === 'string') {
          const match = data.progress.match(/(\d+(?:\.\d+)?)/)
          if (match) {
            actualProgress = Math.round(parseFloat(match[1]))
          }
        } else if (typeof data.progress === 'number') {
          if (data.progress <= 1) {
            actualProgress = Math.round(data.progress * 100)
          } else {
            actualProgress = Math.round(data.progress)
          }
        }
      }
      
      // 尝试从多个位置提取视频URL
      // 1. 直接字段
      if (data.video_url) {
        videoUrl = data.video_url
      } else if (data.result_url) {
        videoUrl = data.result_url
      }
      
      // 2. 从顶层choices[0].message.content中解析（JSON字符串格式）- 这是最常见的格式
      if (!videoUrl && data.choices?.[0]?.message?.content) {
        try {
          const contentStr = data.choices[0].message.content
          const contentData = typeof contentStr === 'string' ? JSON.parse(contentStr) : contentStr
          if (contentData.video_url) {
            videoUrl = contentData.video_url
          } else if (contentData.original_url) {
            videoUrl = contentData.original_url
          }
        } catch (e) {
          writeLog('解析choices.content失败', {
            url,
            taskId,
            error: e instanceof Error ? e.message : String(e),
          })
        }
      }
      
      // 3. 从data.choices[0].message.content中解析（嵌套格式）
      if (!videoUrl && data.data?.choices?.[0]?.message?.content) {
        try {
          const contentStr = data.data.choices[0].message.content
          const contentData = typeof contentStr === 'string' ? JSON.parse(contentStr) : contentStr
          if (contentData.video_url) {
            videoUrl = contentData.video_url
          } else if (contentData.original_url) {
            videoUrl = contentData.original_url
          }
        } catch (e) {
          // 如果解析失败，继续尝试其他位置
        }
      }
      
      // 4. 从data字段中查找
      if (!videoUrl && data.data) {
        if (data.data.video_url) {
          videoUrl = data.data.video_url
        } else if (data.data.result_url) {
          videoUrl = data.data.result_url
        } else if (typeof data.data === 'string') {
          try {
            const dataParsed = JSON.parse(data.data)
            if (dataParsed.video_url) {
              videoUrl = dataParsed.video_url
            } else if (dataParsed.original_url) {
              videoUrl = dataParsed.original_url
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      // 判断任务状态
      if (actualStatus === 'completed') {
        if (videoUrl) {
          writeLog('ApixPro任务完成，已提取视频URL', {
            url,
            taskId,
            videoUrl: videoUrl.substring(0, 100) + (videoUrl.length > 100 ? '...' : ''),
          })
          return { success: true, resultUrl: videoUrl, status: 'completed', progress: 100 }
        } else {
          // 状态是completed但没有提取到videoUrl，记录警告但返回completed
          writeLog('ApixPro任务状态为completed但未提取到视频URL', {
            url,
            taskId,
            actualStatus,
            hasChoices: !!data.choices,
            hasDataChoices: !!data.data?.choices,
            dataKeys: Object.keys(data),
          })
          return { success: true, status: 'completed', progress: 100 }
        }
      } else if (actualStatus === 'failed') {
        writeLog('ApixPro任务失败', {
          url,
          taskId,
          error: data.fail_reason || data.error || '任务失败',
        })
        return { success: false, error: data.fail_reason || data.error || '任务失败', status: 'failed' }
      } else {
        // 仍在处理中
        writeLog('ApixPro任务处理中', {
          url,
          taskId,
          status: actualStatus,
          rawProgress: data.progress,
          parsedProgress: actualProgress,
        })
        return { success: true, status: actualStatus || 'processing', progress: actualProgress }
      }
    } else {
      // OpenAI兼容接口
      const url = `${baseUrl}/v1/videos/${taskId}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { success: false, error: `查询失败: ${response.status}` }
      }

      const data = await response.json() as any
      
      if (data.status === 'succeeded' && data.video_url) {
        return { success: true, resultUrl: data.video_url, status: 'completed', progress: 100 }
      } else if (data.status === 'failed') {
        return { success: false, error: data.error || '任务失败', status: 'failed' }
      } else {
        // 解析进度
        let progress: number | undefined
        if (data.progress !== undefined && data.progress !== null) {
          if (typeof data.progress === 'string') {
            const match = data.progress.match(/(\d+(?:\.\d+)?)/)
            if (match) {
              progress = Math.round(parseFloat(match[1]))
            }
          } else if (typeof data.progress === 'number') {
            if (data.progress <= 1) {
              progress = Math.round(data.progress * 100)
            } else {
              progress = Math.round(data.progress)
            }
          }
        }
        return { success: true, status: data.status || 'processing', progress }
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message || '查询失败' }
  }
}
