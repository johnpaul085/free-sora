import { Request, Response } from 'express'
import { query, run } from '../db/connection'
import { success, error } from '../utils/response'

interface AIConfig {
  id: number
  provider_name: string
  provider_type: 'image' | 'video' | 'assistant'
  api_key?: string
  api_url?: string
  models?: string | string[]
  is_active: boolean | number
  priority: number
  rate_limit?: number
  config?: string | object
  created_at?: string
  updated_at?: string
}

// 获取API配置列表
export async function getApiConfigs(req: Request, res: Response) {
  try {
    const { type } = req.query

    let sql = 'SELECT id, provider_name, provider_type, api_key, api_url, models, is_active, priority, rate_limit, config, created_at, updated_at FROM ai_configs WHERE 1=1'
    const params: any[] = []

    if (type && type !== 'all') {
      sql += ' AND provider_type = ?'
      params.push(type)
    }

    sql += ' ORDER BY priority DESC, created_at DESC'

    const configs = await query(sql, params) as AIConfig[]

    // 处理JSON字段
    const processedConfigs = configs.map((config: any) => {
      if (config.models) {
        try {
          config.models = typeof config.models === 'string' ? JSON.parse(config.models) : config.models
        } catch {
          config.models = []
        }
      } else {
        config.models = []
      }
      if (config.config) {
        try {
          config.config = typeof config.config === 'string' ? JSON.parse(config.config) : config.config
        } catch {
          config.config = {}
        }
      }
      // 判断是否已配置API密钥（需要查询api_key字段）
      config.has_api_key = !!(config.api_key && config.api_key.trim())
      // 不返回api_key字段
      delete config.api_key
      return config
    })

    success(res, processedConfigs)
  } catch (err: any) {
    console.error('获取API配置列表错误:', err)
    error(res, err.message || '获取配置列表失败', 500)
  }
}

// 获取API配置详情
export async function getApiConfigById(req: Request, res: Response) {
  try {
    const { id } = req.params

    const configs = await query(
      'SELECT * FROM ai_configs WHERE id = ?',
      [id]
    ) as AIConfig[]

    if (!configs || configs.length === 0) {
      return error(res, '配置不存在', 404)
    }

    const config = configs[0] as any

    // 处理JSON字段
    if (config.models) {
      try {
        // 如果是字符串，尝试解析
        if (typeof config.models === 'string') {
          const parsed = JSON.parse(config.models)
          config.models = Array.isArray(parsed) ? parsed : []
        } else if (Array.isArray(config.models)) {
          // 已经是数组，直接使用
          config.models = config.models
        } else {
          config.models = []
        }
      } catch (err) {
        console.error('解析models字段失败:', err, '原始值:', config.models)
        config.models = []
      }
    } else {
      config.models = []
    }
    if (config.config) {
      try {
        config.config = typeof config.config === 'string' ? JSON.parse(config.config) : config.config
      } catch {
        config.config = {}
      }
    }

    success(res, config)
  } catch (err: any) {
    console.error('获取API配置详情错误:', err)
    error(res, err.message || '获取配置详情失败', 500)
  }
}

// 创建API配置
export async function createApiConfig(req: Request, res: Response) {
  try {
    const {
      provider_name,
      provider_type,
      api_key,
      api_url,
      models,
      is_active,
      priority,
      rate_limit,
      config,
    } = req.body

    if (!provider_name || !provider_type) {
      return error(res, '服务商名称和类型不能为空', 400)
    }

    if (!['image', 'video', 'assistant'].includes(provider_type)) {
      return error(res, '无效的服务商类型', 400)
    }

    // 处理JSON字段
    const modelsJson = models ? (typeof models === 'string' ? models : JSON.stringify(models)) : null
    const configJson = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null

    const result = await run(
      `INSERT INTO ai_configs (provider_name, provider_type, api_key, api_url, models, is_active, priority, rate_limit, config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        provider_name,
        provider_type,
        api_key || null,
        api_url || null,
        modelsJson,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        priority || 0,
        rate_limit || null,
        configJson,
      ]
    )

    const newId = (result as any).lastID || (result as any).insertId

    // 获取创建后的配置（需要查询api_key来判断）
    const newConfigs = await query(
      'SELECT id, provider_name, provider_type, api_key, api_url, models, is_active, priority, rate_limit, config, created_at, updated_at FROM ai_configs WHERE id = ?',
      [newId]
    ) as AIConfig[]

    const newConfig = newConfigs[0] as any
    if (newConfig.models) {
      try {
        newConfig.models = typeof newConfig.models === 'string' ? JSON.parse(newConfig.models) : newConfig.models
      } catch {
        newConfig.models = []
      }
    }
    // 判断是否已配置API密钥
    newConfig.has_api_key = !!(newConfig.api_key && newConfig.api_key.trim())
    // 不返回api_key字段
    delete newConfig.api_key

    success(res, newConfig, '创建成功')
  } catch (err: any) {
    console.error('创建API配置错误:', err)
    error(res, err.message || '创建配置失败', 500)
  }
}

// 更新API配置
export async function updateApiConfig(req: Request, res: Response) {
  try {
    const { id } = req.params
    const {
      provider_name,
      provider_type,
      api_key,
      api_url,
      models,
      is_active,
      priority,
      rate_limit,
      config,
    } = req.body

    // 检查配置是否存在
    const existing = await query('SELECT id FROM ai_configs WHERE id = ?', [id]) as any[]
    if (!existing || existing.length === 0) {
      return error(res, '配置不存在', 404)
    }

    // 构建更新字段
    const updates: string[] = []
    const params: any[] = []

    if (provider_name !== undefined) {
      updates.push('provider_name = ?')
      params.push(provider_name)
    }
    if (provider_type !== undefined) {
      if (!['image', 'video', 'assistant'].includes(provider_type)) {
        return error(res, '无效的服务商类型', 400)
      }
      updates.push('provider_type = ?')
      params.push(provider_type)
    }
    if (api_key !== undefined) {
      // 如果传入空字符串，表示清除API密钥
      updates.push('api_key = ?')
      params.push(api_key || null)
    }
    if (api_url !== undefined) {
      updates.push('api_url = ?')
      params.push(api_url || null)
    }
    if (models !== undefined) {
      const modelsJson = models ? (typeof models === 'string' ? models : JSON.stringify(models)) : null
      updates.push('models = ?')
      params.push(modelsJson)
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active ? 1 : 0)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (rate_limit !== undefined) {
      updates.push('rate_limit = ?')
      params.push(rate_limit || null)
    }
    if (config !== undefined) {
      const configJson = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null
      updates.push('config = ?')
      params.push(configJson)
    }

    if (updates.length === 0) {
      return error(res, '没有需要更新的字段', 400)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    await run(
      `UPDATE ai_configs SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    // 获取更新后的配置（需要查询api_key来判断是否已配置）
    const updatedConfigs = await query(
      'SELECT id, provider_name, provider_type, api_key, api_url, models, is_active, priority, rate_limit, config, created_at, updated_at FROM ai_configs WHERE id = ?',
      [id]
    ) as AIConfig[]

    const updatedConfig = updatedConfigs[0] as any
    if (updatedConfig.models) {
      try {
        updatedConfig.models = typeof updatedConfig.models === 'string' ? JSON.parse(updatedConfig.models) : updatedConfig.models
      } catch {
        updatedConfig.models = []
      }
    }
    // 判断是否已配置API密钥
    updatedConfig.has_api_key = !!updatedConfig.api_key
    // 不返回api_key字段
    delete updatedConfig.api_key

    success(res, updatedConfig, '更新成功')
  } catch (err: any) {
    console.error('更新API配置错误:', err)
    error(res, err.message || '更新配置失败', 500)
  }
}

// 删除API配置
export async function deleteApiConfig(req: Request, res: Response) {
  try {
    const { id } = req.params

    // 检查配置是否存在
    const existing = await query('SELECT id FROM ai_configs WHERE id = ?', [id]) as any[]
    if (!existing || existing.length === 0) {
      return error(res, '配置不存在', 404)
    }

    await run('DELETE FROM ai_configs WHERE id = ?', [id])

    success(res, null, '删除成功')
  } catch (err: any) {
    console.error('删除API配置错误:', err)
    error(res, err.message || '删除配置失败', 500)
  }
}

// 测试API连接
export async function testApiConfig(req: Request, res: Response) {
  try {
    const { id } = req.params

    // 获取配置
    const configs = await query(
      'SELECT * FROM ai_configs WHERE id = ?',
      [id]
    ) as AIConfig[]

    if (!configs || configs.length === 0) {
      return error(res, '配置不存在', 404)
    }

    const config = configs[0]

    // 检查是否配置了API密钥
    if (!config.api_key || !config.api_key.trim()) {
      return error(res, '未配置API密钥，无法测试', 400)
    }

    // 解析配置中的模型列表
    let configuredModels: string[] = []
    if (config.models) {
      try {
        if (typeof config.models === 'string') {
          const parsed = JSON.parse(config.models)
          configuredModels = Array.isArray(parsed) ? parsed : []
        } else if (Array.isArray(config.models)) {
          configuredModels = config.models
        }
      } catch (err) {
        console.error('解析models字段失败:', err)
        configuredModels = []
      }
    }

    const startTime = Date.now()
    let testResult: any = null
    let errorMessage = ''

    try {
      // 根据不同的服务商类型调用不同的测试接口
      const baseUrl = config.api_url || getDefaultApiUrl(config.provider_name, config.provider_type)
      
      switch (config.provider_type) {
        case 'assistant':
          // OpenAI/Claude等助手API：调用模型列表接口，传递配置的模型列表
          testResult = await testAssistantAPI(baseUrl, config.api_key, configuredModels)
          break
        case 'image':
          // 图片生成API：调用账户信息或模型列表接口
          testResult = await testImageAPI(baseUrl, config.api_key, config.provider_name)
          break
        case 'video':
          // 视频生成API：调用健康检查或模型列表接口
          testResult = await testVideoAPI(baseUrl, config.api_key, config.provider_name)
          break
        default:
          return error(res, '不支持的服务商类型', 400)
      }

      const responseTime = Date.now() - startTime

      success(res, {
        success: true,
        message: 'API连接测试成功',
        response_time: responseTime,
        details: testResult,
      }, '测试成功')
    } catch (testErr: any) {
      const responseTime = Date.now() - startTime
      errorMessage = testErr.message || 'API测试失败'
      
      // 返回测试失败信息，但包含响应时间
      return res.status(400).json({
        code: 400,
        message: errorMessage,
        data: {
          success: false,
          message: errorMessage,
          response_time: responseTime,
        },
      })
    }
  } catch (err: any) {
    console.error('测试API配置错误:', err)
    error(res, err.message || '测试失败', 500)
  }
}

// 获取默认API地址
function getDefaultApiUrl(providerName: string, providerType: string): string {
  const name = providerName.toLowerCase()
  
  if (name.includes('openai')) {
    return 'https://api.openai.com/v1'
  } else if (name.includes('google') || name.includes('gemini')) {
    return 'https://generativelanguage.googleapis.com/v1'
  } else if (name.includes('anthropic') || name.includes('claude')) {
    return 'https://api.anthropic.com/v1'
  } else if (name.includes('stability')) {
    return 'https://api.stability.ai/v1'
  } else if (name.includes('apixpro')) {
    return 'https://apixpro.com'
  }
  
  return ''
}

// 测试助手API（OpenAI/Claude等）
async function testAssistantAPI(baseUrl: string, apiKey: string, configuredModels: string[] = []): Promise<any> {
  // 优先尝试调用模型列表接口（更安全，不依赖特定模型）
  try {
    const modelsUrl = `${baseUrl}/v1/models`
    const modelsResponse = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json() as any
      const modelsCount = Array.isArray(modelsData.data) ? modelsData.data.length : 0
      return {
        status: modelsResponse.status,
        message: 'API连接测试成功',
        models_count: modelsCount,
        note: modelsCount > 0 ? '已获取模型列表' : '模型列表为空',
      }
    }

    // 如果模型列表接口失败，尝试聊天接口（使用多个可能的模型）
    if (modelsResponse.status === 404 || modelsResponse.status === 401) {
      // 401可能是认证问题，直接抛出
      const errorText = await modelsResponse.text()
      throw new Error(`API认证失败: ${modelsResponse.status} ${modelsResponse.statusText} - ${errorText}`)
    }

    // 优先使用配置中的模型，如果没有配置则使用默认模型列表
    const defaultModels = ['gpt-3.5-turbo', 'gpt-4o', 'claude-3-haiku', 'gemini-pro']
    const testModels = configuredModels.length > 0 ? configuredModels : defaultModels
    let lastError: any = null

    for (const model of testModels) {
      try {
        const chatUrl = `${baseUrl}/v1/chat/completions`
        const response = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5,
          }),
          signal: AbortSignal.timeout(8000),
        })

        if (response.ok) {
          const data = await response.json() as any
          return {
            status: response.status,
            message: 'API连接测试成功',
            model: data.model || model,
            note: `使用模型 ${model} 测试成功`,
          }
        }

        // 如果是模型不存在错误，继续尝试下一个模型
        if (response.status === 400 || response.status === 404 || response.status === 503) {
          const errorData = await response.json().catch(() => ({})) as any
          if (errorData.error?.code === 'model_not_found' || 
              errorData.error?.message?.includes('模型') || 
              errorData.error?.message?.includes('model') ||
              errorData.error?.message?.includes('无可用渠道') ||
              errorData.error?.message?.includes('distributor')) {
            lastError = new Error(`模型 ${model} 不可用，继续尝试其他模型`)
            continue
          }
        }

        // 其他错误，直接抛出
        const errorText = await response.text()
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('请求超时，请检查网络连接和API地址')
        }
        // 如果是模型不存在，继续尝试下一个
        if (err.message?.includes('model_not_found') || err.message?.includes('模型')) {
          lastError = err
          continue
        }
        throw err
      }
    }

    // 所有模型都失败，返回模型列表接口的错误
    const errorText = await modelsResponse.text()
    throw new Error(`API连接正常，但测试的模型都不可用。请检查模型配置。原始错误: ${errorText}`)
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接和API地址')
    }
    throw err
  }
}

// 测试图片生成API
async function testImageAPI(baseUrl: string, apiKey: string, providerName: string, configuredModels: string[] = []): Promise<any> {
  const name = providerName.toLowerCase()
  
  if (name.includes('apixpro')) {
    // ApixPro: 调用图片生成接口进行测试
    try {
      const url = `${baseUrl}/v1/images/generations`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: 'test',
          n: 1,
          size: '1024x1024',
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        // 如果是参数错误（400），说明API连接正常，只是测试参数不对
        if (response.status === 400) {
          return {
            status: response.status,
            message: 'API连接正常（参数验证通过）',
            note: '测试参数可能不完整，但API服务可用',
          }
        }
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any
      return {
        status: response.status,
        message: 'API连接测试成功',
        has_image_url: !!(data.data && Array.isArray(data.data) && data.data.length > 0 && data.data[0].url),
      }
    } catch (err: any) {
      throw new Error(`无法连接到API: ${err.message}`)
    }
  } else if (name.includes('stability')) {
    // Stability AI: 调用账户信息接口
    const url = `${baseUrl}/user/account`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as any
    return {
      status: response.status,
      account_info: data.email || '已连接',
    }
  } else {
    // 其他图片API：尝试调用模型列表或健康检查
    const url = `${baseUrl}/models` || `${baseUrl}/health`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return {
      status: response.status,
      message: '连接成功',
    }
  }
}

// 测试视频生成API
async function testVideoAPI(baseUrl: string, apiKey: string, providerName: string): Promise<any> {
  const name = providerName.toLowerCase()
  
  if (name.includes('apixpro')) {
    // ApixPro: 调用视频生成接口进行测试（使用最小参数）
    try {
      const url = `${baseUrl}/v1/videos`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sora-2',
          prompt: 'test',
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        // 如果是参数错误（400），说明API连接正常，只是测试参数不对
        if (response.status === 400) {
          return {
            status: response.status,
            message: 'API连接正常（参数验证通过）',
            note: '测试参数可能不完整，但API服务可用',
          }
        }
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any
      return {
        status: response.status,
        message: 'API连接测试成功',
        task_id: data.task_id || null,
      }
    } catch (err: any) {
      // 如果是超时或网络错误，尝试简单的GET请求
      if (err.name === 'AbortError' || err.message.includes('fetch')) {
        try {
          // 尝试查询任务列表接口
          const url = `${baseUrl}/api/task/self?p=1&page_size=1`
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
            signal: AbortSignal.timeout(5000),
          })

          if (response.ok) {
            return {
              status: response.status,
              message: 'API连接成功（通过任务列表接口验证）',
            }
          }
        } catch (e) {
          // 忽略错误，继续抛出原始错误
        }
      }
      throw new Error(`无法连接到API: ${err.message}`)
    }
  } else {
    // 其他视频API：尝试调用模型列表或健康检查
    const url = `${baseUrl}/models` || `${baseUrl}/health`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return {
      status: response.status,
      message: '连接成功',
    }
  }
}
