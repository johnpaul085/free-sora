import { query } from '../db/connection'

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

/**
 * 获取可用的AI助手配置
 */
export async function getAvailableAssistantConfig(
  modelName?: string
): Promise<AIConfig | null> {
  try {
    // 查询启用的、assistant类型的配置，按优先级排序
    const configs = await query(
      `SELECT * FROM ai_configs 
       WHERE provider_type = 'assistant' AND is_active = 1 AND api_key IS NOT NULL AND api_key != ''
       ORDER BY priority DESC, created_at DESC`,
      []
    ) as AIConfig[]

    if (!configs || configs.length === 0) {
      return null
    }

    // 如果指定了模型名，尝试匹配
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
        const providerNameLower = cfg.provider_name.toLowerCase()
        const hasModelInName = providerNameLower.includes(modelNameLower) || modelNameLower.includes(modelNameLower)
        const hasModelInList = models.length === 0 || models.some(m => 
          m.toLowerCase().includes(modelNameLower) || 
          modelNameLower.includes(m.toLowerCase())
        )

        if (hasModelInName || hasModelInList) {
          return cfg
        }
      }
    }

    // 返回优先级最高的配置
    return configs[0]
  } catch (err: any) {
    console.error('获取AI助手配置失败:', err)
    return null
  }
}

/**
 * 调用AI助手API（OpenAI兼容接口）
 */
export async function callAssistantAPI(
  aiConfig: AIConfig,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  modelName?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const baseUrl = aiConfig.api_url || getDefaultApiUrl(aiConfig.provider_name)
    const apiKey = aiConfig.api_key

    if (!baseUrl || !apiKey) {
      return { success: false, error: 'API配置不完整' }
    }

    // 解析models字段，确定使用的模型
    let models: string[] = []
    if (aiConfig.models) {
      try {
        models = typeof aiConfig.models === 'string' ? JSON.parse(aiConfig.models) : aiConfig.models
      } catch {
        models = []
      }
    }

    // 确定使用的模型
    let useModel = modelName || models[0] || 'gpt-3.5-turbo'
    
    // 如果指定的模型不在列表中，尝试使用第一个可用模型
    if (models.length > 0 && !models.some(m => m.toLowerCase().includes(useModel.toLowerCase()))) {
      useModel = models[0]
    }

    const url = `${baseUrl}/v1/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(60000), // 60秒超时
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API错误: ${response.status} - ${errorText}` }
    }

    const data = await response.json() as any
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { success: false, error: 'API返回格式错误' }
    }

    return { success: true, content }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: '请求超时，请检查网络连接' }
    }
    return { success: false, error: err.message || 'API调用失败' }
  }
}

function getDefaultApiUrl(providerName: string): string {
  const name = providerName.toLowerCase()
  if (name.includes('openai')) {
    return 'https://api.openai.com/v1'
  } else if (name.includes('anthropic') || name.includes('claude')) {
    return 'https://api.anthropic.com/v1'
  } else if (name.includes('apixpro')) {
    return 'https://apixpro.com'
  }
  return ''
}
